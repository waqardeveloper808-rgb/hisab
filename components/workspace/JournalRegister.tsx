"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DocumentLinkPreviewModal } from "@/components/workspace/DocumentLinkPreviewModal";
import { JournalDetailPanel, type JournalDetailLink } from "@/components/workspace/JournalDetailPanel";
import { JournalEntryModal } from "@/components/workspace/JournalEntryModal";
import { StandardActionBar } from "@/components/workspace/StandardActionBar";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";
import { listJournals, type JournalEntryRecord } from "@/lib/workspace-api";
import { exportRowsToCsv } from "@/lib/spreadsheet";
import { currency } from "@/components/workflow/utils";

const REMARKS_MAX = 42;

function truncateRemarks(s: string, max: number) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function registerDescription(entry: JournalEntryRecord) {
  const d = entry.description?.trim();
  if (d) return d;
  const r = entry.reference?.trim();
  if (r) return r;
  const fromLine = entry.lines.find((l) => l.documentNumber?.trim());
  if (fromLine?.documentNumber) return fromLine.documentNumber;
  return "—";
}

function keyAccounts(entry: JournalEntryRecord, max: number) {
  const seen = new Set<string>();
  const codes: string[] = [];
  for (const line of entry.lines) {
    const c = line.accountCode?.trim();
    if (c && !seen.has(c)) {
      seen.add(c);
      codes.push(c);
    }
  }
  if (codes.length <= max) return { show: codes, more: 0 };
  return { show: codes.slice(0, max), more: codes.length - max };
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
          <p className="mt-0.5 line-clamp-2 text-xs text-muted sm:line-clamp-none sm:text-sm">
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
                      accounts: keyAccounts(row, 5).show.join(" "),
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
        className="grid min-h-0 w-full min-w-0 flex-1 grid-cols-1 items-stretch gap-2 sm:gap-2.5 lg:min-h-[min(80vh,880px)] lg:grid-cols-[minmax(0,1fr)_minmax(50%,1.15fr)] lg:gap-3"
        data-journal-split-container="true"
      >
        <div className="flex min-h-0 min-w-0 max-w-full flex-col" data-journal-register-pane="left">
          <Card className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-white/95 p-0 sm:rounded-xl">
            <div className="shrink-0 border-b border-line px-2 py-1 text-[10px] text-muted sm:px-2.5 sm:py-1.5 sm:text-xs">
              <div className="flex justify-between gap-2">
                <span className="tabular-nums">{filteredEntries.length} entries</span>
                <span className="hidden sm:inline">Row → preview</span>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-0 table-fixed border-collapse text-[12px] leading-tight tabular-nums sm:text-[13px]">
                <thead className="sticky top-0 z-[1] border-b border-line bg-surface-soft/90 text-left text-[10px] text-muted sm:text-[11px]">
                  <tr>
                    <th className="w-[4.5rem] px-2 py-1 font-semibold sm:px-2.5 sm:py-1.5">Date</th>
                    <th className="px-2 py-1 font-semibold sm:px-2.5 sm:py-1.5">Accounts</th>
                    <th className="w-[28%] px-2 py-1 font-semibold sm:px-2.5 sm:py-1.5">Description</th>
                    <th className="w-[4.2rem] px-1 py-1 text-right font-semibold sm:w-[4.5rem] sm:px-2.5 sm:py-1.5">Dr.</th>
                    <th className="w-[4.2rem] px-1 py-1 text-right font-semibold sm:w-[4.5rem] sm:px-2.5 sm:py-1.5">Cr.</th>
                    <th className="w-[25%] px-2 py-1 font-semibold sm:px-2.5 sm:py-1.5">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-2 py-3 text-xs text-muted sm:px-2.5">
                        Loading…
                      </td>
                    </tr>
                  ) : filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-2 py-4 sm:px-2.5">
                        <div className="rounded-md border border-dashed border-line bg-surface-soft px-2 py-2.5 text-xs text-muted sm:px-3 sm:py-3 sm:text-sm">
                          <p className="font-semibold text-ink">No entries</p>
                          <p className="mt-0.5">Create a journal or post transactions to see rows here.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => {
                      const { show, more } = keyAccounts(entry, 3);
                      const totalDr = entry.lines.reduce((s, l) => s + l.debit, 0);
                      const totalCr = entry.lines.reduce((s, l) => s + l.credit, 0);
                      const isSelected = entry.id === selectedId;
                      const desc = registerDescription(entry);
                      return (
                        <tr
                          key={entry.id}
                          className={[
                            "cursor-pointer border-t border-line/50 align-top transition-colors",
                            isSelected ? "bg-primary-soft/50 ring-1 ring-inset ring-primary/25" : "hover:bg-surface-soft/50",
                          ].join(" ")}
                          onClick={() => setSelectedId(entry.id)}
                          title={entry.entryNumber}
                        >
                          <td className="px-2 py-1.5 font-mono text-[11px] text-ink tabular-nums sm:px-2.5 sm:py-2 sm:text-[12px]">{entry.entryDate}</td>
                          <td className="min-w-0 px-2 py-1.5 text-[11px] text-ink sm:px-2.5 sm:py-2 sm:text-[12px]">
                            {show.length === 0 ? (
                              "—"
                            ) : (
                              <>
                                <span className="line-clamp-2 [overflow-wrap:anywhere]">{show.join(" · ")}</span>
                                {more > 0 ? <span className="ml-0.5 font-medium text-primary">+{more}</span> : null}
                              </>
                            )}
                          </td>
                          <td
                            className="min-w-0 px-2 py-1.5 text-[11px] text-ink sm:px-2.5 sm:py-2 sm:text-[12px]"
                            title={desc}
                          >
                            <span className="line-clamp-2 [overflow-wrap:anywhere]">{desc}</span>
                          </td>
                          <td className="px-1 py-1.5 text-right font-mono text-[11px] tabular-nums text-ink sm:px-2 sm:py-2 sm:text-[12px]">{currency(totalDr)}</td>
                          <td className="px-1 py-1.5 text-right font-mono text-[11px] tabular-nums text-ink sm:px-2 sm:py-2 sm:text-[12px]">{currency(totalCr)}</td>
                          <td
                            className="min-w-0 px-2 py-1.5 text-[11px] text-muted sm:px-2.5 sm:py-2 sm:text-[12px]"
                            title={entry.memo || ""}
                          >
                            <span className="line-clamp-2 [overflow-wrap:anywhere]">{truncateRemarks(entry.memo || "", REMARKS_MAX)}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div
          className="min-h-0 min-w-0 w-full self-stretch"
          data-journal-preview-pane="right"
        >
          <div className="max-lg:min-h-[min(55vh,520px)] lg:sticky lg:top-1 lg:max-h-[min(80vh,880px)]">
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
