"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { AttachmentUploader } from "@/components/workspace/AttachmentUploader";
import { createJournal, listDocuments, type DocumentCenterRecord, type JournalEntryRecord } from "@/lib/workspace-api";
import { currency } from "@/components/workflow/utils";
import {
  searchAccounts,
  validateJournalEntry,
  type JournalEntry,
  type JournalLine,
} from "@/lib/accounting-engine";
import { useRegisterTableLayout, type RegisterColumnWidthDef } from "@/lib/workspace/register-table-layout";
import { RegisterTableHeaderCell } from "@/components/workspace/RegisterTableHeaderCell";
import type { Attachment } from "@/lib/accounting-engine";

type JournalSourceContext = "manual" | "inventory_purchase" | "inventory_production" | "inventory_adjustment" | "sales" | "vat";

const REFERENCE_TYPES: { value: string; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "document", label: "Invoice / document" },
  { value: "payment", label: "Payment" },
  { value: "inventory", label: "Inventory" },
  { value: "vat", label: "VAT" },
  { value: "sales", label: "Sales" },
  { value: "other", label: "Other" },
];

function emptyLine(lineNumber: number): JournalLine {
  return { lineNumber, accountId: 0, accountCode: "", accountName: "", debit: 0, credit: 0, memo: "" };
}

function emptyDraft(): JournalEntry {
  return {
    id: 0,
    entryNumber: "",
    entryDate: new Date().toISOString().slice(0, 10),
    postingDate: new Date().toISOString().slice(0, 10),
    reference: "",
    memo: "",
    status: "draft",
    createdBy: "current_user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lines: [emptyLine(1), emptyLine(2)],
  };
}

function detectsSalePattern(draft: JournalEntry, sourceContext: JournalSourceContext) {
  const memo = `${draft.reference} ${draft.memo}`.toLowerCase();
  const usesRevenue = draft.lines.some((line) => line.accountCode.startsWith("4") || line.accountCode === "400");
  const usesInventory = draft.lines.some((line) =>
    ["113", "115", "116", "117"].includes(line.accountCode) || line.accountCode === "500",
  );
  const hasKeywords = memo.includes("sale") || memo.includes("invoice") || memo.includes("delivery");
  return sourceContext === "sales" || (usesRevenue && (usesInventory || hasKeywords));
}

type JournalEntryModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (created: JournalEntryRecord) => void;
};

export function JournalEntryModal({ open, onClose, onSaved }: JournalEntryModalProps) {
  const [draft, setDraft] = useState<JournalEntry>(emptyDraft);
  const [sourceContext, setSourceContext] = useState<JournalSourceContext>("manual");
  const [referenceType, setReferenceType] = useState("manual");
  const [inventoryReference, setInventoryReference] = useState("");
  const [saleRefs, setSaleRefs] = useState({ proformaInvoice: "", taxInvoice: "", deliveryNote: "" });
  const [saleLinkPromptOpen, setSaleLinkPromptOpen] = useState(false);
  const [documentSuggestions, setDocumentSuggestions] = useState<DocumentCenterRecord[]>([]);
  const [refDocuments, setRefDocuments] = useState<DocumentCenterRecord[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [validation, setValidation] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadDocsError, setLoadDocsError] = useState<string | null>(null);
  const bypassSaleLinkPromptRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setDraft(emptyDraft());
    setSourceContext("manual");
    setReferenceType("manual");
    setInventoryReference("");
    setSaleRefs({ proformaInvoice: "", taxInvoice: "", deliveryNote: "" });
    setSaleLinkPromptOpen(false);
    setSelectedDocumentId("");
    setAttachments([]);
    setValidation([]);
    setLoadDocsError(null);
    bypassSaleLinkPromptRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    void listDocuments({ group: "all", sort: "issue_date", direction: "desc" })
      .then((list) => setRefDocuments(list.slice(0, 200)))
      .catch(() => {
        setRefDocuments([]);
        setLoadDocsError("Documents could not be loaded for the reference list.");
      });
  }, [open]);

  const updateLine = useCallback((idx: number, patch: Partial<JournalLine>) => {
    setDraft((prev) => {
      const lines = [...prev.lines];
      let next: JournalLine = { ...lines[idx], ...patch };
      if (patch.debit !== undefined && patch.debit > 0) {
        next = { ...next, credit: 0 };
      }
      if (patch.credit !== undefined && patch.credit > 0) {
        next = { ...next, debit: 0 };
      }
      lines[idx] = next;
      return { ...prev, lines };
    });
  }, []);

  const addLine = useCallback(() => {
    setDraft((prev) => ({ ...prev, lines: [...prev.lines, emptyLine(prev.lines.length + 1)] }));
  }, []);

  const removeLine = useCallback((idx: number) => {
    setDraft((prev) => {
      if (prev.lines.length <= 2) return prev;
      const lines = prev.lines.filter((_, i) => i !== idx).map((l, i) => ({ ...l, lineNumber: i + 1 }));
      return { ...prev, lines };
    });
  }, []);

  const totalDebit = draft.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = draft.lines.reduce((s, l) => s + l.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.005;

  const selectedDocument = useMemo(
    () => (selectedDocumentId ? refDocuments.find((d) => String(d.id) === selectedDocumentId) ?? null : null),
    [refDocuments, selectedDocumentId],
  );

  const documentIdForLines = selectedDocument?.id ?? null;

  const saveInternal = useCallback(async () => {
    const forValidation: JournalEntry = {
      ...draft,
      lines: draft.lines.map((l) => ({
        ...l,
        memo: l.memo,
      })),
    };
    const result = validateJournalEntry(forValidation);
    if (!result.valid) {
      setValidation(result.errors);
      return;
    }
    setValidation([]);
    setSaving(true);
    try {
      const created = await createJournal({
        entryDate: draft.entryDate,
        postingDate: draft.postingDate,
        reference: draft.reference,
        description: draft.reference?.trim() || undefined,
        memo: draft.memo,
        metadata: {
          reference_type: referenceType,
          source_context: sourceContext,
          inventory_reference: inventoryReference || null,
          attachment_manifest: attachments.map((a) => ({ fileName: a.fileName, fileSize: a.fileSize, tag: a.documentTag })),
          ...(sourceContext === "sales" || draft.memo.toLowerCase().includes("outgoing goods")
            ? {
                sale_intelligence: {
                  proforma_invoice: saleRefs.proformaInvoice || null,
                  tax_invoice: saleRefs.taxInvoice || null,
                  delivery_note: saleRefs.deliveryNote || null,
                },
              }
            : {}),
        },
        lines: draft.lines.map((line) => ({
          accountId: line.accountId,
          debit: line.debit,
          credit: line.credit,
          description: line.memo ?? "",
          documentId: documentIdForLines,
          inventoryItemId: null,
        })),
      });
      onSaved(created);
      onClose();
    } catch (e) {
      setValidation([e instanceof Error ? e.message : "Save failed."]);
    } finally {
      setSaving(false);
    }
  }, [draft, sourceContext, referenceType, inventoryReference, saleRefs, attachments, documentIdForLines, onSaved, onClose]);

  const handleSave = useCallback(() => {
    if (!bypassSaleLinkPromptRef.current && detectsSalePattern(draft, sourceContext) && !saleLinkPromptOpen && !saleRefs.proformaInvoice && !saleRefs.taxInvoice && !saleRefs.deliveryNote) {
      setSaleLinkPromptOpen(true);
      return;
    }
    bypassSaleLinkPromptRef.current = false;
    void saveInternal();
  }, [draft, sourceContext, saleLinkPromptOpen, saleRefs, saveInternal]);

  useEffect(() => {
    if (!saleLinkPromptOpen) return;
    void listDocuments({ group: "sales", sort: "issue_date", direction: "desc" })
      .then((documents) => setDocumentSuggestions(documents.slice(0, 12)))
      .catch(() => setDocumentSuggestions([]));
  }, [saleLinkPromptOpen]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-ink/50 px-3 py-8" role="dialog" aria-modal="true" aria-labelledby="journal-modal-title" data-inspector-real-register="journal-entry-modal">
      <Card className="relative z-10 w-full max-w-5xl overflow-visible rounded-2xl border border-line bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Manual journal</p>
            <h2 id="journal-modal-title" className="mt-0.5 text-lg font-semibold text-ink">
              New journal entry
            </h2>
            <p className="mt-1 text-sm text-muted">Balanced lines required before save. Dr and Cr on separate sides per line.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>

        {loadDocsError ? <p className="mt-2 text-sm text-amber-800">{loadDocsError}</p> : null}
        {validation.length > 0 ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-semibold">Fix before save</p>
            <ul className="mt-1 list-inside list-disc">
              {validation.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Date" type="date" value={draft.entryDate} onChange={(e) => setDraft({ ...draft, entryDate: e.target.value, postingDate: e.target.value })} />
          <Input label="Reference number" value={draft.reference} onChange={(e) => setDraft({ ...draft, reference: e.target.value })} placeholder="e.g. INV-1042" />
          <div>
            <label htmlFor="je-ref-type" className="mb-2 block text-sm font-semibold text-ink">
              Reference type
            </label>
            <select
              id="je-ref-type"
              value={referenceType}
              onChange={(e) => setReferenceType(e.target.value)}
              className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            >
              {REFERENCE_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="je-ref-doc" className="mb-2 block text-sm font-semibold text-ink">
              Reference document
            </label>
            <select
              id="je-ref-doc"
              value={selectedDocumentId}
              onChange={(e) => setSelectedDocumentId(e.target.value)}
              className="block w-full max-w-xl rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            >
              <option value="">— None —</option>
              {refDocuments.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.number} · {d.type?.replaceAll("_", " ")} · {d.issueDate ?? ""}
                </option>
              ))}
            </select>
            {selectedDocument ? (
              <p className="mt-1 text-xs text-muted">
                Linked to <span className="font-medium text-ink">{selectedDocument.number}</span> on all lines.
              </p>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="je-ctx" className="mb-2 block text-sm font-semibold text-ink">
              Engine context
            </label>
            <select
              id="je-ctx"
              value={sourceContext}
              onChange={(e) => setSourceContext(e.target.value as JournalSourceContext)}
              className="block w-full max-w-md rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            >
              <option value="manual">Manual journal</option>
              <option value="inventory_purchase">Inventory purchase</option>
              <option value="inventory_production">Inventory production</option>
              <option value="inventory_adjustment">Inventory adjustment</option>
              <option value="sales">Sales</option>
              <option value="vat">VAT</option>
            </select>
          </div>
          <Input label="Inventory / stock reference" value={inventoryReference} onChange={(e) => setInventoryReference(e.target.value)} placeholder="Optional" />
        </div>

        <div className="mt-3">
          <label htmlFor="je-memo" className="mb-2 block text-sm font-semibold text-ink">
            Remarks
          </label>
          <textarea
            id="je-memo"
            value={draft.memo}
            onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
            rows={3}
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            placeholder="Narration for this entry"
          />
        </div>

        <div className="relative z-[1] mt-4 overflow-x-auto overflow-y-visible rounded-xl border border-line">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-soft/60 px-3 py-2 text-xs">
            <span className="font-semibold text-ink">Lines</span>
            <span className={["font-semibold", isBalanced ? "text-emerald-600" : "text-red-600"].join(" ")}>
              Dr {currency(totalDebit)} · Cr {currency(totalCredit)} {isBalanced ? "· Balanced" : "· Unbalanced"}
            </span>
            <Button size="sm" variant="secondary" type="button" onClick={addLine}>
              Add line
            </Button>
          </div>
          <JournalModalLinesTable
            lines={draft.lines}
            updateLine={updateLine}
            onRemove={removeLine}
            canRemoveRow={draft.lines.length > 2}
          />
        </div>

        {sourceContext === "sales" || draft.memo.toLowerCase().includes("outgoing goods") ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Input label="Proforma invoice" value={saleRefs.proformaInvoice} onChange={(e) => setSaleRefs((c) => ({ ...c, proformaInvoice: e.target.value }))} placeholder="PRO-00012" />
            <Input label="Tax invoice" value={saleRefs.taxInvoice} onChange={(e) => setSaleRefs((c) => ({ ...c, taxInvoice: e.target.value }))} placeholder="INV-00041" />
            <Input label="Delivery note" value={saleRefs.deliveryNote} onChange={(e) => setSaleRefs((c) => ({ ...c, deliveryNote: e.target.value }))} placeholder="DN-00008" />
          </div>
        ) : null}

        <div className="mt-4">
          <p className="mb-1 text-sm font-semibold text-ink">Attachments</p>
          <AttachmentUploader attachments={attachments} onChange={setAttachments} maxFiles={10} maxSizeMB={5} />
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !isBalanced}>
            {saving ? "Saving…" : "Save entry"}
          </Button>
        </div>
      </Card>

      {saleLinkPromptOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/45 px-4" role="dialog" aria-modal="true">
          <Card className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Link documents</p>
                <h3 className="mt-1 text-lg font-semibold text-ink">Link commercial documents?</h3>
                <p className="mt-2 text-sm text-muted">A sales pattern was detected. Link documents for register and audit, or continue without.</p>
              </div>
              <Button size="xs" variant="secondary" onClick={() => setSaleLinkPromptOpen(false)} type="button">
                Close
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Input label="Proforma invoice" value={saleRefs.proformaInvoice} onChange={(e) => setSaleRefs((c) => ({ ...c, proformaInvoice: e.target.value }))} />
              <Input label="Tax invoice" value={saleRefs.taxInvoice} onChange={(e) => setSaleRefs((c) => ({ ...c, taxInvoice: e.target.value }))} />
              <Input label="Delivery note" value={saleRefs.deliveryNote} onChange={(e) => setSaleRefs((c) => ({ ...c, deliveryNote: e.target.value }))} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {documentSuggestions.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    if (doc.type === "proforma_invoice") setSaleRefs((c) => ({ ...c, proformaInvoice: doc.number }));
                    if (doc.type === "delivery_note") setSaleRefs((c) => ({ ...c, deliveryNote: doc.number }));
                    if (doc.type === "tax_invoice") setSaleRefs((c) => ({ ...c, taxInvoice: doc.number }));
                  }}
                  className="rounded-full border border-line bg-surface-soft px-3 py-1 text-xs font-semibold text-ink hover:border-primary/40"
                >
                  {doc.number} · {doc.type?.replaceAll("_", " ")}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  bypassSaleLinkPromptRef.current = true;
                  setSaleLinkPromptOpen(false);
                  void saveInternal();
                }}
              >
                Skip linking
              </Button>
              <Button
                type="button"
                onClick={() => {
                  bypassSaleLinkPromptRef.current = true;
                  setSaleLinkPromptOpen(false);
                  void saveInternal();
                }}
              >
                Save
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

const JOURNAL_LINE_WIDTH_DEFS: RegisterColumnWidthDef[] = [
  { id: "account", defaultWidth: 280 },
  { id: "memo", defaultWidth: 200 },
  { id: "dr", defaultWidth: 88 },
  { id: "cr", defaultWidth: 88 },
  { id: "rm", defaultWidth: 44 },
];

const JOURNAL_LINE_COLS = JOURNAL_LINE_WIDTH_DEFS.map((d) => d.id);

function JournalModalLinesTable({
  lines,
  updateLine,
  onRemove,
  canRemoveRow,
}: {
  lines: JournalLine[];
  updateLine: (idx: number, patch: Partial<JournalLine>) => void;
  onRemove: (idx: number) => void;
  canRemoveRow: boolean;
}) {
  const { wrapRef, colPercents, beginResizePair } = useRegisterTableLayout("v2.register.journal-entry-lines", JOURNAL_LINE_WIDTH_DEFS, JOURNAL_LINE_COLS);
  const pctById = useMemo(() => Object.fromEntries(colPercents.map((c) => [c.id, c.percent])), [colPercents]);

  return (
    <div ref={wrapRef} className="relative overflow-x-auto overflow-y-visible" data-register-table="true">
      <table className="w-full min-w-0 table-fixed text-sm">
        <colgroup>
          {JOURNAL_LINE_COLS.map((id) => (
            <col key={id} style={{ width: `${pctById[id] ?? 100 / JOURNAL_LINE_COLS.length}%` }} />
          ))}
        </colgroup>
        <thead className="border-b border-line bg-surface-soft/70 text-left text-xs text-muted">
          <tr>
            {JOURNAL_LINE_COLS.map((colId, idx) => (
              <RegisterTableHeaderCell
                key={colId}
                align={colId === "dr" || colId === "cr" ? "right" : colId === "rm" ? "center" : "left"}
                className={colId === "dr" || colId === "cr" ? "num" : ""}
                onResizePointerDown={idx < JOURNAL_LINE_COLS.length - 1 ? (x) => beginResizePair(idx, x) : undefined}
              >
                {colId === "account" ? "Account (code + name)" : colId === "memo" ? "Description" : colId === "dr" ? "Dr." : colId === "cr" ? "Cr." : ""}
              </RegisterTableHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((line, idx) => (
            <ModalLineRow
              key={idx}
              line={line}
              idx={idx}
              onUpdate={updateLine}
              onRemove={onRemove}
              canRemove={canRemoveRow}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModalLineRow({
  line,
  idx,
  onUpdate,
  onRemove,
  canRemove,
}: {
  line: JournalLine;
  idx: number;
  onUpdate: (idx: number, patch: Partial<JournalLine>) => void;
  onRemove: (idx: number) => void;
  canRemove: boolean;
}) {
  const [accountQuery, setAccountQuery] = useState(
    line.accountCode ? `${line.accountCode} — ${line.accountName}`.trim() : "",
  );
  const [showDropdown, setShowDropdown] = useState(false);

  const suggestions = useMemo(() => {
    const base = !accountQuery.trim() ? searchAccounts("") : searchAccounts(accountQuery);
    return base.filter((a) => !a.isFolder && a.isPostingAllowed).slice(0, 14);
  }, [accountQuery]);

  return (
    <tr className="border-t border-line/50">
      <td className="register-table-cell align-top px-2 py-2">
        <div className="relative min-w-0">
          <input
            type="text"
            value={accountQuery}
            onChange={(e) => {
              setAccountQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="Search COA code or name…"
            className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-primary/40"
          />
          {showDropdown && suggestions.length > 0 ? (
            <div className="absolute left-0 top-full z-[200] mt-0.5 max-h-52 w-[min(100%,24rem)] overflow-auto rounded-lg border border-line bg-white shadow-xl">
              {suggestions.map((acc) => (
                <button
                  key={acc.code}
                  type="button"
                  onMouseDown={() => {
                    onUpdate(idx, { accountCode: acc.code, accountName: acc.name, accountId: acc.id });
                    setAccountQuery(`${acc.code} — ${acc.name}`);
                    setShowDropdown(false);
                  }}
                  className="flex w-full flex-col gap-0.5 px-2 py-1.5 text-left text-xs hover:bg-primary-soft [overflow-wrap:anywhere]"
                >
                  <span className="font-mono font-bold text-ink">{acc.code}</span>
                  <span className="text-muted">{acc.name}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </td>
      <td className="register-table-cell px-2 py-2">
        <input
          type="text"
          value={line.memo ?? ""}
          onChange={(e) => onUpdate(idx, { memo: e.target.value })}
          className="w-full min-w-0 rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
          placeholder="Line note"
        />
      </td>
      <td className="register-table-cell num px-2 py-2">
        <input
          type="number"
          min={0}
          step="0.01"
          value={line.debit || ""}
          onChange={(e) => onUpdate(idx, { debit: parseFloat(e.target.value) || 0 })}
          className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-right text-xs"
        />
      </td>
      <td className="register-table-cell num px-2 py-2">
        <input
          type="number"
          min={0}
          step="0.01"
          value={line.credit || ""}
          onChange={(e) => onUpdate(idx, { credit: parseFloat(e.target.value) || 0 })}
          className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-right text-xs"
        />
      </td>
      <td className="register-table-cell px-1 py-2 text-center">
        {canRemove ? (
          <button type="button" onClick={() => onRemove(idx)} className="text-red-500 hover:text-red-700">
            ×
          </button>
        ) : null}
      </td>
    </tr>
  );
}
