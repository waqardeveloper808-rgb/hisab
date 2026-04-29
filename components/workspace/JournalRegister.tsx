"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DocumentLinkPreviewModal } from "@/components/workspace/DocumentLinkPreviewModal";
import { JournalDetailPanel, type JournalDetailLink } from "@/components/workspace/JournalDetailPanel";
import { JournalEntryModal } from "@/components/workspace/JournalEntryModal";
import { RegisterTableHeaderCell } from "@/components/workspace/RegisterTableHeaderCell";
import { StandardActionBar } from "@/components/workspace/StandardActionBar";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";
import { listJournals, type JournalEntryRecord } from "@/lib/workspace-api";
import { exportRowsToCsv } from "@/lib/spreadsheet";
import {
  registerTableWidthsStorageKey,
  useRegisterTableLayout,
  type RegisterColumnWidthDef,
} from "@/lib/workspace/register-table-layout";
import { currency } from "@/components/workflow/utils";

const JOURNAL_WIDTHS_LS = "journal:columnWidths";
const JOURNAL_SPLIT_LS = "journal:splitRatio";

function clampJournalSplit(n: number): number {
  return Math.min(70, Math.max(30, n));
}

const JOURNAL_WIDTH_DEFS: RegisterColumnWidthDef[] = [
  { id: "date", defaultWidth: 96 },
  { id: "accounts", defaultWidth: 200 },
  { id: "description", defaultWidth: 220 },
  { id: "dr", defaultWidth: 88 },
  { id: "cr", defaultWidth: 88 },
  { id: "remarks", defaultWidth: 180 },
];

const JOURNAL_COL_ORDER = JOURNAL_WIDTH_DEFS.map((d) => d.id);

function registerDescription(entry: JournalEntryRecord) {
  const d = entry.description?.trim();
  if (d) return d;
  const r = entry.reference?.trim();
  if (r) return r;
  const fromLine = entry.lines.find((l) => l.documentNumber?.trim());
  if (fromLine?.documentNumber) return fromLine.documentNumber;
  return "—";
}

function uniqueAccountCodes(entry: JournalEntryRecord): string[] {
  const seen = new Set<string>();
  const codes: string[] = [];
  for (const line of entry.lines) {
    const c = line.accountCode?.trim();
    if (c && !seen.has(c)) {
      seen.add(c);
      codes.push(c);
    }
  }
  return codes;
}

function buildJournalLinkedDocuments(entry: JournalEntryRecord): JournalDetailLink[] {
  const lineLinks = entry.lines
    .filter((line) => line.documentNumber)
    .map((line) => ({
      documentId: line.documentId,
      documentNumber: line.documentNumber ?? "",
      documentType: line.documentType ?? "document",
      status: line.documentStatus ?? "",
    }));
  const saleIntel = (entry.metadata?.sale_intelligence as Record<string, unknown> | undefined) ?? {};
  const metaLinks = [
    saleIntel.proforma_invoice ? { documentId: null, documentNumber: String(saleIntel.proforma_invoice), documentType: "proforma_invoice", status: "linked" } : null,
    saleIntel.delivery_note ? { documentId: null, documentNumber: String(saleIntel.delivery_note), documentType: "delivery_note", status: "linked" } : null,
    saleIntel.tax_invoice ? { documentId: null, documentNumber: String(saleIntel.tax_invoice), documentType: "tax_invoice", status: "linked" } : null,
  ].filter(Boolean) as JournalDetailLink[];

  return [...lineLinks, ...metaLinks].filter(
    (link, index, list) => list.findIndex((candidate) => `${candidate.documentType}:${candidate.documentNumber}` === `${link.documentType}:${link.documentNumber}`) === index,
  );
}

export function JournalRegister() {
  const { basePath: _basePath } = useWorkspacePath();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<JournalEntryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [linkPreview, setLinkPreview] = useState<JournalDetailLink | null>(null);

  const queryFilter = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const entryFilter = searchParams.get("entry")?.trim() ?? "";
  const documentFilter = searchParams.get("document")?.trim().toLowerCase() ?? "";
  const invoiceFilterRaw = searchParams.get("invoice_id")?.trim() ?? "";
  const invoiceFilterId = Number(invoiceFilterRaw);
  const hasInvoiceFilter = Number.isInteger(invoiceFilterId) && invoiceFilterId > 0;
  const invoiceFilterNumber = searchParams.get("invoice_number")?.trim() ?? "";

  useEffect(() => {
    listJournals({ invoiceId: hasInvoiceFilter ? invoiceFilterId : undefined, invoiceNumber: invoiceFilterNumber || undefined })
      .then((next) => setEntries(next))
      .catch((error) => {
        setEntries([]);
        setLoadError(error instanceof Error ? error.message : "Journal entries could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, [hasInvoiceFilter, invoiceFilterId, invoiceFilterNumber]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const linkedDocuments = buildJournalLinkedDocuments(entry);
      const haystack = [
        entry.entryNumber,
        entry.reference,
        entry.description,
        entry.memo,
        entry.sourceType ?? "",
        ...entry.lines.map((line) => `${line.accountCode} ${line.accountName} ${line.description ?? ""} ${line.documentNumber ?? ""}`),
        ...linkedDocuments.map((link) => `${link.documentType} ${link.documentNumber}`),
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !queryFilter || haystack.includes(queryFilter);
      const matchesEntry = !entryFilter || entry.entryNumber === entryFilter;
      const matchesDocument = !documentFilter || linkedDocuments.some((link) => link.documentNumber.toLowerCase().includes(documentFilter));
      const matchesInvoice = !hasInvoiceFilter || entry.lines.some((line) => Number(line.documentId ?? 0) === invoiceFilterId);

      return matchesQuery && matchesEntry && matchesDocument && matchesInvoice;
    });
  }, [documentFilter, entries, entryFilter, hasInvoiceFilter, invoiceFilterId, queryFilter]);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (filteredEntries.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) => {
      if (current != null && filteredEntries.some((e) => e.id === current)) {
        return current;
      }
      return filteredEntries[0].id;
    });
  }, [loading, filteredEntries]);

  const selectedEntry = useMemo(() => {
    if (selectedId == null) return null;
    return filteredEntries.find((e) => e.id === selectedId) ?? entries.find((e) => e.id === selectedId) ?? null;
  }, [selectedId, filteredEntries, entries]);

  const selectedLinked = selectedEntry ? buildJournalLinkedDocuments(selectedEntry) : [];

  const { wrapRef, colPercents, beginResizePair } = useRegisterTableLayout(
    "v2.register.journal-entries",
    JOURNAL_WIDTH_DEFS,
    JOURNAL_COL_ORDER,
    { columnWidthsStorageKey: JOURNAL_WIDTHS_LS },
  );
  const pctById = useMemo(() => Object.fromEntries(colPercents.map((c) => [c.id, c.percent])), [colPercents]);

  const splitContainerRef = useRef<HTMLDivElement>(null);
  const splitDragRef = useRef<{ startX: number; startRatio: number; width: number } | null>(null);
  const [splitLeftFr, setSplitLeftFr] = useState(60);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const legacy = localStorage.getItem(registerTableWidthsStorageKey("v2.register.journal-entries"));
      if (legacy && !localStorage.getItem(JOURNAL_WIDTHS_LS)) {
        localStorage.setItem(JOURNAL_WIDTHS_LS, legacy);
      }
    } catch {
      /* quota */
    }
    try {
      const v = Number(localStorage.getItem(JOURNAL_SPLIT_LS));
      if (Number.isFinite(v)) {
        setSplitLeftFr(clampJournalSplit(v));
      }
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = splitDragRef.current;
      if (!d) return;
      const deltaPct = ((e.clientX - d.startX) / d.width) * 100;
      setSplitLeftFr(clampJournalSplit(d.startRatio + deltaPct));
    };
    const up = (e: PointerEvent) => {
      const d = splitDragRef.current;
      if (!d) return;
      splitDragRef.current = null;
      const deltaPct = ((e.clientX - d.startX) / d.width) * 100;
      const next = clampJournalSplit(d.startRatio + deltaPct);
      setSplitLeftFr(next);
      try {
        localStorage.setItem(JOURNAL_SPLIT_LS, String(next));
      } catch {
        /* quota */
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  const onSplitDividerPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const root = splitContainerRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      splitDragRef.current = {
        startX: e.clientX,
        startRatio: splitLeftFr,
        width: Math.max(1, rect.width),
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [splitLeftFr],
  );

  return (
    <div
      className="journal-register-page space-y-1.5 sm:space-y-2"
      data-journal-register-split="true"
      data-inspector-real-register="journal-entries"
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary sm:text-[11px]">Accounting</p>
          <h1 className="text-base font-semibold leading-tight tracking-tight text-ink sm:text-lg">Journal entries</h1>
          <p className="mt-0.5 text-xs text-muted sm:text-sm [overflow-wrap:anywhere]">
            {hasInvoiceFilter
              ? `Linked to invoice ${invoiceFilterNumber || `#${invoiceFilterId}`}`
              : "Split view: select a row; preview updates on the right (desktop) or below (mobile)."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <Button
            onClick={() => {
              setModalOpen(true);
            }}
            className="text-xs sm:text-sm"
            size="sm"
          >
            New entry
          </Button>
          <StandardActionBar
            compact
            actions={[
              { label: "Edit", disabled: true },
              { label: "Save", disabled: true },
              { label: "Delete", disabled: true },
              {
                label: "Export",
                onClick: () =>
                  exportRowsToCsv(
                    filteredEntries.map((row) => ({
                      date: row.entryDate,
                      accounts: uniqueAccountCodes(row).join(" "),
                      description: registerDescription(row),
                      debit: row.lines.reduce((s, l) => s + l.debit, 0),
                      credit: row.lines.reduce((s, l) => s + l.credit, 0),
                      remarks: row.memo,
                    })),
                    [
                      { label: "Date", value: (r) => r.date },
                      { label: "Accounts", value: (r) => r.accounts },
                      { label: "Description", value: (r) => r.description },
                      { label: "Debit", value: (r) => r.debit },
                      { label: "Credit", value: (r) => r.credit },
                      { label: "Remarks", value: (r) => r.remarks },
                    ],
                    "journal-entries.csv",
                  ),
              },
            ]}
          />
        </div>
      </div>

      <WorkspaceModeNotice
        title="Register + preview"
        detail="The table is compact; the preview shows full lines. First row is selected when data loads."
      />
      {feedback ? <Card className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-800 sm:px-3 sm:py-2 sm:text-sm">{feedback}</Card> : null}
      {loadError ? <Card className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-800 sm:px-3 sm:py-2 sm:text-sm">{loadError}</Card> : null}

      {queryFilter || entryFilter || documentFilter || hasInvoiceFilter ? (
        <Card className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1.5 text-xs text-sky-900 sm:px-3 sm:py-2 sm:text-sm">
          <p className="font-semibold">Filter active</p>
          <p className="mt-0.5">
            Showing {hasInvoiceFilter ? `items for invoice ${invoiceFilterNumber || `#${invoiceFilterId}`}` : entryFilter || documentFilter || queryFilter}.
          </p>
        </Card>
      ) : null}

      <div
        ref={splitContainerRef}
        className="journal-split-root flex min-h-0 w-full min-w-0 flex-1 flex-col items-stretch gap-2 sm:gap-2.5 lg:grid lg:min-h-[min(80vh,880px)] lg:gap-0 lg:items-stretch"
        data-journal-split-container="true"
        style={{
          gridTemplateColumns: `minmax(0, ${splitLeftFr}fr) 6px minmax(0, ${100 - splitLeftFr}fr)`,
        }}
      >
        <div className="flex min-h-0 min-w-0 max-w-full flex-col lg:min-w-0" data-journal-register-pane="left">
          <Card className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-white/95 p-0 sm:rounded-xl">
            <div className="shrink-0 border-b border-line px-2 py-1 text-[10px] text-muted sm:px-2.5 sm:py-1.5 sm:text-xs">
              <div className="flex justify-between gap-2">
                <span className="tabular-nums">{filteredEntries.length} entries</span>
                <span className="hidden sm:inline">Row → preview</span>
              </div>
            </div>
            <div ref={wrapRef} className="min-h-0 flex-1 overflow-auto" data-register-table="true">
              <table className="journal-register-table w-full min-w-0 table-fixed border-collapse text-[12px] leading-tight tabular-nums sm:text-[13px]">
                <colgroup>
                  {JOURNAL_COL_ORDER.map((id) => (
                    <col key={id} style={{ width: `${pctById[id] ?? 100 / JOURNAL_COL_ORDER.length}%` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    {JOURNAL_COL_ORDER.map((colId, idx) => (
                      <RegisterTableHeaderCell
                        key={colId}
                        align={colId === "dr" || colId === "cr" ? "right" : "left"}
                        className={colId === "dr" || colId === "cr" ? "num" : ""}
                        resizeHandleClassName="resize-handle"
                        onResizePointerDown={idx < JOURNAL_COL_ORDER.length - 1 ? (x) => beginResizePair(idx, x) : undefined}
                      >
                        {{
                          date: "Date",
                          accounts: "Accounts",
                          description: "Description",
                          dr: "Dr.",
                          cr: "Cr.",
                          remarks: "Remarks",
                        }[colId]}
                      </RegisterTableHeaderCell>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr data-journal-placeholder="true">
                      <td colSpan={6} className="text-xs text-muted">
                        Loading…
                      </td>
                    </tr>
                  ) : filteredEntries.length === 0 ? (
                    <tr data-journal-placeholder="true">
                      <td colSpan={6} className="py-4">
                        <div className="rounded-md border border-dashed border-line bg-surface-soft px-2 py-2.5 text-xs text-muted sm:px-3 sm:py-3 sm:text-sm">
                          <p className="font-semibold text-ink">No entries</p>
                          <p className="mt-0.5">Create a journal or post transactions to see rows here.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => {
                      const codes = uniqueAccountCodes(entry);
                      const totalDr = entry.lines.reduce((s, l) => s + l.debit, 0);
                      const totalCr = entry.lines.reduce((s, l) => s + l.credit, 0);
                      const isSelected = entry.id === selectedId;
                      const desc = registerDescription(entry);
                      return (
                        <tr
                          key={entry.id}
                          data-selected={isSelected ? "true" : undefined}
                          className="cursor-pointer border-t border-line/50 align-top transition-[background-color,box-shadow] duration-150"
                          onClick={() => setSelectedId(entry.id)}
                          title={entry.entryNumber}
                        >
                          <td className="register-table-cell font-mono text-[11px] text-ink tabular-nums sm:text-[12px]">{entry.entryDate}</td>
                          <td className="register-table-cell min-w-0 text-[11px] text-ink sm:text-[12px]">
                            {codes.length === 0 ? "—" : codes.join(" · ")}
                          </td>
                          <td className="register-table-cell min-w-0 text-[11px] text-ink sm:text-[12px]">{desc}</td>
                          <td className="register-table-cell num text-right font-mono text-[11px] tabular-nums text-ink sm:text-[12px]">{currency(totalDr)}</td>
                          <td className="register-table-cell num text-right font-mono text-[11px] tabular-nums text-ink sm:text-[12px]">{currency(totalCr)}</td>
                          <td className="register-table-cell min-w-0 text-[11px] text-muted sm:text-[12px]">{entry.memo?.trim() || "—"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <button
          type="button"
          aria-label="Drag to resize register and preview width"
          className="journal-split-divider hidden lg:block"
          onPointerDown={onSplitDividerPointerDown}
        />

        <div
          className="min-h-0 min-w-0 w-full self-stretch lg:min-w-0"
          data-journal-preview-pane="right"
        >
          <div className="max-lg:min-h-[min(55vh,520px)] lg:sticky lg:top-1 lg:max-h-[min(80vh,880px)] lg:min-h-0">
            <JournalDetailPanel
              entry={selectedEntry}
              basePath={_basePath}
              hasInvoiceFilter={hasInvoiceFilter}
              invoiceFilterId={invoiceFilterId}
              invoiceFilterNumber={invoiceFilterNumber}
              linkedDocuments={selectedLinked}
              onPreviewDocument={setLinkPreview}
            />
          </div>
        </div>
      </div>

      <JournalEntryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={(created) => {
          setEntries((cur) => [created, ...cur]);
          setSelectedId(created.id);
          setModalOpen(false);
          setFeedback(`Saved ${created.entryNumber}.`);
        }}
      />

      <DocumentLinkPreviewModal link={linkPreview} onClose={() => setLinkPreview(null)} />
    </div>
  );
}
