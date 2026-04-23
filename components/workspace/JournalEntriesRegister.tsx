"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DocumentLinkTrigger } from "@/components/workspace/DocumentLinkTrigger";
import { DocumentLinkPreviewModal } from "@/components/workspace/DocumentLinkPreviewModal";
import { Input } from "@/components/Input";
import { StandardActionBar } from "@/components/workspace/StandardActionBar";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";
import { createJournal, listDocuments, listJournals, type DocumentCenterRecord, type JournalEntryRecord } from "@/lib/workspace-api";
import { mapWorkspaceHref } from "@/lib/workspace-path";
import { currency } from "@/components/workflow/utils";
import { defaultChartOfAccounts, searchAccounts, validateJournalEntry, type JournalEntry, type JournalLine } from "@/lib/accounting-engine";
import { exportRowsToCsv } from "@/lib/spreadsheet";

type JournalSourceContext = "manual" | "inventory_purchase" | "inventory_production" | "inventory_adjustment" | "sales" | "vat";

function emptyLine(lineNumber: number): JournalLine {
  return { lineNumber, accountId: 0, accountCode: "", accountName: "", debit: 0, credit: 0, memo: "" };
}

function emptyJournal(): JournalEntry {
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

function inferSuggestedAccounts(sourceContext: JournalSourceContext, reference: string, memo: string) {
  const query = `${sourceContext} ${reference} ${memo}`.toLowerCase();
  const preferredCodes = new Set<string>();

  if (query.includes("inventory") || query.includes("stock") || query.includes("raw")) {
    preferredCodes.add("1200");
    preferredCodes.add("1400");
    preferredCodes.add("5000");
  }

  if (query.includes("production") || query.includes("finished")) {
    preferredCodes.add("1400");
    preferredCodes.add("5000");
  }

  if (query.includes("vat") || query.includes("tax")) {
    preferredCodes.add("1300");
    preferredCodes.add("2200");
  }

  if (query.includes("sale") || query.includes("invoice")) {
    preferredCodes.add("1100");
    preferredCodes.add("4000");
  }

  const prioritized = defaultChartOfAccounts.filter((account) => preferredCodes.has(account.code) && account.isPostingAllowed);
  const fallback = searchAccounts(`${reference} ${memo}`).filter((account) => account.isPostingAllowed);
  return [...prioritized, ...fallback].filter((account, index, list) => list.findIndex((candidate) => candidate.code === account.code) === index).slice(0, 6);
}

function detectsSalePattern(draft: JournalEntry, sourceContext: JournalSourceContext) {
  const memo = `${draft.reference} ${draft.memo}`.toLowerCase();
  const usesRevenue = draft.lines.some((line) => line.accountCode.startsWith("4") || line.accountCode === "4000");
  const usesInventory = draft.lines.some((line) => line.accountCode === "1150" || line.accountCode === "5000" || line.accountCode.startsWith("14"));
  const hasKeywords = memo.includes("sale") || memo.includes("invoice") || memo.includes("delivery");
  return sourceContext === "sales" || (usesRevenue && (usesInventory || hasKeywords));
}

function buildJournalLinkedDocuments(entry: JournalEntryRecord) {
  const lineLinks = entry.lines
    .filter((line) => line.documentNumber)
    .map((line) => ({ documentId: line.documentId, documentNumber: line.documentNumber ?? "", documentType: line.documentType ?? "document", status: line.documentStatus ?? "" }));
  const saleIntel = (entry.metadata?.sale_intelligence as Record<string, unknown> | undefined) ?? {};
  const metaLinks = [
    saleIntel.proforma_invoice ? { documentId: null, documentNumber: String(saleIntel.proforma_invoice), documentType: "proforma_invoice", status: "linked" } : null,
    saleIntel.delivery_note ? { documentId: null, documentNumber: String(saleIntel.delivery_note), documentType: "delivery_note", status: "linked" } : null,
    saleIntel.tax_invoice ? { documentId: null, documentNumber: String(saleIntel.tax_invoice), documentType: "tax_invoice", status: "linked" } : null,
  ].filter(Boolean) as Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>;

  return [...lineLinks, ...metaLinks].filter((link, index, list) => list.findIndex((candidate) => `${candidate.documentType}:${candidate.documentNumber}` === `${link.documentType}:${link.documentNumber}`) === index);
}

export function JournalEntriesRegister() {
  const { basePath } = useWorkspacePath();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<JournalEntryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "create">("list");
  const [draft, setDraft] = useState<JournalEntry>(emptyJournal);
  const [sourceContext, setSourceContext] = useState<JournalSourceContext>("manual");
  const [inventoryReference, setInventoryReference] = useState("");
  const [saleRefs, setSaleRefs] = useState({ proformaInvoice: "", taxInvoice: "", deliveryNote: "" });
  const [saleLinkPromptOpen, setSaleLinkPromptOpen] = useState(false);
  const [documentSuggestions, setDocumentSuggestions] = useState<DocumentCenterRecord[]>([]);
  const [linkPreview, setLinkPreview] = useState<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null } | null>(null);
  const [validation, setValidation] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const bypassSaleLinkPromptRef = useRef(false);

  const queryFilter = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const entryFilter = searchParams.get("entry")?.trim() ?? "";
  const documentFilter = searchParams.get("document")?.trim().toLowerCase() ?? "";
  const invoiceFilterRaw = searchParams.get("invoice_id")?.trim() ?? "";
  const invoiceFilterId = Number(invoiceFilterRaw);
  const hasInvoiceFilter = Number.isInteger(invoiceFilterId) && invoiceFilterId > 0;
  const invoiceFilterNumber = searchParams.get("invoice_number")?.trim() ?? "";
  const [selectedEntryNumber, setSelectedEntryNumber] = useState<string | null>(null);

  useEffect(() => {
    listJournals({ invoiceId: hasInvoiceFilter ? invoiceFilterId : undefined, invoiceNumber: invoiceFilterNumber || undefined })
      .then((nextEntries) => setEntries(nextEntries))
      .catch((error) => {
        setEntries([]);
        setLoadError(error instanceof Error ? error.message : "Journal entries could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, [hasInvoiceFilter, invoiceFilterId, invoiceFilterNumber]);

  const updateLine = useCallback((idx: number, patch: Partial<JournalLine>) => {
    setDraft((prev) => {
      const lines = [...prev.lines];
      lines[idx] = { ...lines[idx], ...patch };
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
  const suggestedAccounts = useMemo(() => inferSuggestedAccounts(sourceContext, `${draft.reference} ${inventoryReference}`, draft.memo), [draft.memo, draft.reference, inventoryReference, sourceContext]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const linkedDocuments = buildJournalLinkedDocuments(entry);
      const haystack = [
        entry.entryNumber,
        entry.reference,
        entry.memo,
        entry.sourceType ?? "",
        ...entry.lines.map((line) => `${line.accountCode} ${line.accountName} ${line.description ?? ""} ${line.documentNumber ?? ""}`),
        ...linkedDocuments.map((link) => `${link.documentType} ${link.documentNumber}`),
      ].join(" ").toLowerCase();

      const matchesQuery = !queryFilter || haystack.includes(queryFilter);
      const matchesEntry = !entryFilter || entry.entryNumber === entryFilter;
      const matchesDocument = !documentFilter || linkedDocuments.some((link) => link.documentNumber.toLowerCase().includes(documentFilter));
      const matchesInvoice = !hasInvoiceFilter || entry.lines.some((line) => Number(line.documentId ?? 0) === invoiceFilterId);

      return matchesQuery && matchesEntry && matchesDocument && matchesInvoice;
    });
  }, [documentFilter, entries, entryFilter, hasInvoiceFilter, invoiceFilterId, queryFilter]);

  const selectedEntry = useMemo(() => {
    const activeEntryNumber = entryFilter || selectedEntryNumber;

    if (activeEntryNumber) {
      return filteredEntries.find((entry) => entry.entryNumber === activeEntryNumber)
        ?? entries.find((entry) => entry.entryNumber === activeEntryNumber)
        ?? null;
    }

    return filteredEntries[0] ?? null;
  }, [entries, entryFilter, filteredEntries, selectedEntryNumber]);

  const applySuggestedAccount = useCallback((code: string) => {
    const account = defaultChartOfAccounts.find((candidate) => candidate.code === code && candidate.isPostingAllowed);
    if (!account) return;
    const targetIndex = draft.lines.findIndex((line) => !line.accountCode);
    const index = targetIndex >= 0 ? targetIndex : 0;
    updateLine(index, { accountCode: account.code, accountName: account.name, accountId: account.id });
  }, [draft.lines, updateLine]);

  const handlePost = useCallback(async () => {
    if (!bypassSaleLinkPromptRef.current && detectsSalePattern(draft, sourceContext) && !saleLinkPromptOpen && !saleRefs.proformaInvoice && !saleRefs.taxInvoice && !saleRefs.deliveryNote) {
      setSaleLinkPromptOpen(true);
      return;
    }

    bypassSaleLinkPromptRef.current = false;

    const result = validateJournalEntry(draft);
    if (!result.valid) { setValidation(result.errors); return; }
    setValidation([]);
    try {
      const created = await createJournal({
        entryDate: draft.entryDate,
        postingDate: draft.postingDate,
        reference: draft.reference,
        memo: draft.memo,
        metadata: sourceContext === "sales" || draft.memo.toLowerCase().includes("outgoing goods")
          ? {
              sale_intelligence: {
                proforma_invoice: saleRefs.proformaInvoice || null,
                tax_invoice: saleRefs.taxInvoice || null,
                delivery_note: saleRefs.deliveryNote || null,
              },
              source_context: sourceContext,
              inventory_reference: inventoryReference || null,
            }
          : {
              source_context: sourceContext,
              inventory_reference: inventoryReference || null,
            },
        lines: draft.lines.map((line) => ({ accountId: line.accountId, debit: line.debit, credit: line.credit, description: line.memo ?? "" })),
      });
      setEntries((current) => [created, ...current]);
      setFeedback(`Journal entry ${created.entryNumber} posted successfully.`);
      setDraft(emptyJournal());
      setSaleRefs({ proformaInvoice: "", taxInvoice: "", deliveryNote: "" });
      setMode("list");
    } catch (error) {
      bypassSaleLinkPromptRef.current = false;
      setFeedback(error instanceof Error ? error.message : "Journal posting failed.");
    }
  }, [draft, inventoryReference, saleLinkPromptOpen, saleRefs, sourceContext]);

  useEffect(() => {
    if (!saleLinkPromptOpen) {
      return;
    }

    void listDocuments({ group: "sales", sort: "issue_date", direction: "desc" })
      .then((documents) => setDocumentSuggestions(documents.slice(0, 12)))
      .catch((err: unknown) => { console.error('[JournalEntriesRegister] listDocuments failed:', err); setDocumentSuggestions([]); });
  }, [saleLinkPromptOpen]);

  if (mode === "create") {
    return (
      <div className="space-y-3" data-inspector-real-register="journal-entry-create">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Accounting</p>
            <h1 className="text-lg font-semibold tracking-tight text-ink">New Journal Entry</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => { setMode("list"); setDraft(emptyJournal()); setValidation([]); setFeedback(null); }}>← Back to entries</Button>
            <StandardActionBar compact actions={[
              { label: "Edit", disabled: true },
              { label: "Save", onClick: () => void handlePost() },
              { label: "Delete", onClick: () => { setDraft(emptyJournal()); setValidation([]); } },
              { label: "Export", onClick: () => exportRowsToCsv(draft.lines.map((row) => ({ account: row.accountCode, debit: row.debit, credit: row.credit, memo: row.memo })), [
                { label: "Account", value: (row) => row.account },
                { label: "Debit", value: (row) => row.debit },
                { label: "Credit", value: (row) => row.credit },
                { label: "Memo", value: (row) => row.memo },
              ], "journal-draft.csv") },
            ]} />
          </div>
        </div>

        {feedback ? <Card className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</Card> : null}
        {validation.length > 0 ? (
          <Card className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-semibold">Validation errors:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">{validation.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </Card>
        ) : null}

        {/* Header fields */}
        <Card className="rounded-xl bg-white/95 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Entry Date" type="date" value={draft.entryDate} onChange={(e) => setDraft({ ...draft, entryDate: e.target.value })} />
            <Input label="Posting Date" type="date" value={draft.postingDate} onChange={(e) => setDraft({ ...draft, postingDate: e.target.value })} />
            <Input label="Reference" value={draft.reference} onChange={(e) => setDraft({ ...draft, reference: e.target.value })} placeholder="e.g. JV-2026-001" />
            <Input label="Memo / Narration" value={draft.memo} onChange={(e) => setDraft({ ...draft, memo: e.target.value })} placeholder="Description of this entry" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="journal-source-context" className="mb-2 block text-sm font-semibold text-ink">Source context</label>
              <select id="journal-source-context" value={sourceContext} onChange={(e) => setSourceContext(e.target.value as JournalSourceContext)} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                <option value="manual">Manual journal</option>
                <option value="inventory_purchase">Inventory purchase</option>
                <option value="inventory_production">Inventory production</option>
                <option value="inventory_adjustment">Inventory adjustment</option>
                <option value="sales">Sales entry</option>
                <option value="vat">VAT entry</option>
              </select>
            </div>
            <Input label="Inventory / stock reference" value={inventoryReference} onChange={(e) => setInventoryReference(e.target.value)} placeholder="e.g. MAT-STEEL-001 or ADJ-2026-9501" />
            <div className="rounded-xl border border-line bg-surface-soft/35 px-3 py-2.5 text-sm text-muted">
              <p className="font-semibold text-ink">Suggested accounts</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedAccounts.map((account) => (
                  <button key={account.code} type="button" onClick={() => applySuggestedAccount(account.code)} className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink transition hover:border-primary/40 hover:text-primary">
                    {account.code} {account.name}
                  </button>
                ))}
                {suggestedAccounts.length === 0 ? <span className="text-xs">No suggestions yet. Add a reference or memo.</span> : null}
              </div>
            </div>
          </div>
          {sourceContext === "sales" || draft.memo.toLowerCase().includes("outgoing goods") ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Input label="Proforma Invoice" value={saleRefs.proformaInvoice} onChange={(e) => setSaleRefs((current) => ({ ...current, proformaInvoice: e.target.value }))} placeholder="PRO-00012" />
              <Input label="Tax Invoice" value={saleRefs.taxInvoice} onChange={(e) => setSaleRefs((current) => ({ ...current, taxInvoice: e.target.value }))} placeholder="INV-00041" />
              <Input label="Delivery Note" value={saleRefs.deliveryNote} onChange={(e) => setSaleRefs((current) => ({ ...current, deliveryNote: e.target.value }))} placeholder="DN-00008" />
            </div>
          ) : null}
        </Card>

        {/* Journal lines */}
        <Card className="rounded-xl bg-white/95 p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-xs">
            <span className="font-semibold text-ink">Journal Lines</span>
            <div className="flex items-center gap-3">
              <span className={["font-semibold", isBalanced ? "text-emerald-600" : "text-red-600"].join(" ")}>
                Dr {currency(totalDebit)} · Cr {currency(totalCredit)} {isBalanced ? "✓ Balanced" : "✗ Unbalanced"}
              </span>
              <Button size="sm" variant="secondary" onClick={addLine}>+ Add line</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-line bg-surface-soft/70 text-xs">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-muted w-8">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted min-w-[14rem]">Account</th>
                  <th className="px-3 py-2 text-right font-semibold text-muted w-32">Debit</th>
                  <th className="px-3 py-2 text-right font-semibold text-muted w-32">Credit</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted min-w-[10rem]">Line Memo</th>
                  <th className="px-3 py-2 text-center font-semibold text-muted w-10"></th>
                </tr>
              </thead>
              <tbody>
                {draft.lines.map((line, idx) => (
                  <JournalLineRow key={idx} line={line} idx={idx} onUpdate={updateLine} onRemove={removeLine} canRemove={draft.lines.length > 2} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => { setDraft(emptyJournal()); setValidation([]); setFeedback(null); }}>Reset</Button>
          <Button onClick={handlePost}>Validate & Post</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-inspector-real-register="journal-entries">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Accounting</p>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Journal Entries</h1>
          <p className="mt-0.5 text-sm text-muted">{hasInvoiceFilter ? `Impact of Invoice ${invoiceFilterNumber || `#${invoiceFilterId}`}` : "Posted journal groups from sales, purchases, VAT, payments, and manual entries."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setMode("create")}>New Journal Entry</Button>
          <StandardActionBar compact actions={[
            { label: "Edit", onClick: () => setMode("create") },
            { label: "Save", disabled: true },
            { label: "Delete", disabled: true },
            { label: "Export", onClick: () => exportRowsToCsv(filteredEntries.map((row) => ({ entry: row.entryNumber, reference: row.reference, memo: row.memo, source: row.sourceType ?? "" })), [
              { label: "Entry", value: (row) => row.entry },
              { label: "Reference", value: (row) => row.reference },
              { label: "Memo", value: (row) => row.memo },
              { label: "Source", value: (row) => row.source },
            ], "journal-entries.csv") },
          ]} />
        </div>
      </div>

      <WorkspaceModeNotice title="Live journal register" detail="Posted entries below are sourced from invoices, payments, VAT, inventory, and manual journals. Use the detail pane to trace each entry back to its business documents." />
      {feedback ? <Card className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</Card> : null}
      {loadError ? <Card className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{loadError}</Card> : null}

      {(queryFilter || entryFilter || documentFilter || hasInvoiceFilter) ? (
        <Card className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          <p className="font-semibold">Accounting filter active</p>
          <p className="mt-1">Showing journal activity for {hasInvoiceFilter ? `invoice ${invoiceFilterNumber || `#${invoiceFilterId}`}` : entryFilter || documentFilter || queryFilter}.</p>
        </Card>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.9fr)]">
      <Card className="rounded-xl bg-white/95 p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-xs text-muted">
          <span>{filteredEntries.length} journal entries</span>
          <span>Live journal register</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line bg-surface-soft/70 text-xs">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold text-muted">Entry</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted">Date</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted">Source</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted">Documents</th>
                <th className="px-3 py-2.5 text-center font-semibold text-muted">Lines</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted">Accounts</th>
                <th className="px-3 py-2.5 text-right font-semibold text-muted">Debit</th>
                <th className="px-3 py-2.5 text-right font-semibold text-muted">Credit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="px-4 py-4 text-muted">Loading journal entries...</td></tr> : filteredEntries.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-6"><div className="rounded-lg border border-dashed border-line bg-surface-soft px-4 py-4 text-sm text-muted"><p className="font-semibold text-ink">No posted entries yet.</p><p className="mt-1">Issue an invoice, record a payment, or create a manual journal entry to see posted entries here.</p></div></td></tr>
              ) : filteredEntries.map((entry) => (
                <Fragment key={entry.entryNumber}>
                  <tr key={entry.entryNumber} className={["border-t border-line/60 hover:bg-surface-soft/40 cursor-pointer", selectedEntry?.entryNumber === entry.entryNumber ? "bg-primary-soft/40" : ""].join(" ")} onClick={() => setSelectedEntryNumber(entry.entryNumber)}>
                    <td className="px-3 py-2.5 font-mono text-xs font-bold text-ink">
                      <div>{entry.entryNumber}</div>
                      <div className="text-[10px] font-medium text-muted">{entry.createdByName || "Workspace User"}</div>
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      <div>{entry.entryDate}</div>
                      <div className="text-[10px]">{entry.postingDate}</div>
                    </td>
                    <td className="px-3 py-2.5 text-muted">{entry.sourceType ?? "manual"}</td>
                    <td className="px-3 py-2.5 text-xs text-muted">
                      <div className="flex flex-wrap gap-1">
                        {buildJournalLinkedDocuments(entry).map((link) => (
                          <DocumentLinkTrigger key={`${entry.id}-${link.documentType}-${link.documentNumber}`} link={link} onPreview={setLinkPreview} className="text-primary underline-offset-2 hover:underline" />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-muted">{entry.lines.length}</td>
                    <td className="px-3 py-2.5 text-xs text-muted">{[...new Set(entry.lines.map((line) => `${line.accountCode} ${line.accountName}`))].slice(0, 3).join(" · ")}</td>
                    <td className="px-3 py-2.5 text-right text-muted">{currency(entry.lines.reduce((sum, line) => sum + line.debit, 0))} SAR</td>
                    <td className="px-3 py-2.5 text-right text-muted">{currency(entry.lines.reduce((sum, line) => sum + line.credit, 0))} SAR</td>
                  </tr>
                  <tr className="border-t border-line/30 bg-surface-soft/20" onDoubleClick={() => {
                    const firstLink = buildJournalLinkedDocuments(entry)[0];
                    if (firstLink) {
                      setLinkPreview(firstLink);
                    }
                  }}>
                    <td colSpan={8} className="px-3 py-2">
                      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {entry.lines.map((line) => (
                          <div key={`${entry.id}-line-${line.id}`} className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-muted">
                            <div className="font-semibold text-ink">{line.accountCode} {line.accountName}</div>
                            <div className="mt-1">Dr {currency(line.debit)} SAR · Cr {currency(line.credit)} SAR</div>
                            <div className="mt-1">Ref {line.documentNumber ?? entry.reference ?? "—"}</div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="rounded-xl bg-white/95 p-0 overflow-hidden" data-inspector-accounting-detail="journal-entry">
        <div className="border-b border-line px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Journal detail</p>
          <h2 className="mt-1 text-base font-semibold text-ink">{selectedEntry?.entryNumber ?? "Select a journal entry"}</h2>
          <p className="mt-1 text-xs text-muted">Review source, documents, accounts, and drill into ledger or trial balance.</p>
        </div>
        {selectedEntry ? (
          <div className="space-y-3 p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface-soft/35 px-3 py-2 text-xs text-muted">
                <p className="font-semibold text-ink">Reference</p>
                <p className="mt-1">{selectedEntry.reference || selectedEntry.memo || "No reference"}</p>
              </div>
              <div className="rounded-lg border border-line bg-surface-soft/35 px-3 py-2 text-xs text-muted">
                <p className="font-semibold text-ink">Source</p>
                <p className="mt-1">{selectedEntry.sourceType ?? "manual"} · {selectedEntry.entryDate}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Button size="xs" variant="secondary" href={mapWorkspaceHref(`/workspace/accounting/books?entry=${encodeURIComponent(selectedEntry.entryNumber)}&invoice_id=${hasInvoiceFilter ? invoiceFilterId : Number(selectedEntry.lines[0]?.documentId ?? 0)}&invoice_number=${encodeURIComponent(invoiceFilterNumber || selectedEntry.lines[0]?.documentNumber || "")}`, basePath)}>View ledger impact</Button>
              <Button size="xs" variant="secondary" href={mapWorkspaceHref(`/workspace/user/reports/trial-balance?invoice_id=${hasInvoiceFilter ? invoiceFilterId : Number(selectedEntry.lines[0]?.documentId ?? 0)}&invoice_number=${encodeURIComponent(invoiceFilterNumber || selectedEntry.lines[0]?.documentNumber || "")}`, basePath)}>View trial balance</Button>
              {buildJournalLinkedDocuments(selectedEntry)[0] ? (
                <Button
                  size="xs"
                  variant="secondary"
                  href={mapWorkspaceHref(
                    buildJournalLinkedDocuments(selectedEntry)[0]?.documentId
                      ? `/workspace/invoices/${buildJournalLinkedDocuments(selectedEntry)[0]?.documentId}`
                      : `/workspace/user/invoices?q=${encodeURIComponent(buildJournalLinkedDocuments(selectedEntry)[0]?.documentNumber ?? "")}`,
                    basePath,
                  )}
                >
                  Open source document
                </Button>
              ) : null}
            </div>

            <div className="rounded-lg border border-line overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="border-b border-line bg-surface-soft/60 text-[11px] uppercase tracking-[0.08em] text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Account</th>
                    <th className="px-3 py-2 text-left">Reference</th>
                    <th className="px-3 py-2 text-right">Debit</th>
                    <th className="px-3 py-2 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEntry.lines.map((line) => (
                    <tr key={`${selectedEntry.id}-${line.id}-${line.lineNo}`} className="border-t border-line/60">
                      <td className="px-3 py-2 text-xs text-ink">
                        <div className="font-semibold">{line.accountCode} {line.accountName}</div>
                        {line.description ? <div className="mt-0.5 text-muted">{line.description}</div> : null}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted">{line.documentNumber ?? selectedEntry.reference ?? "-"}</td>
                      <td className="px-3 py-2 text-right text-xs text-ink">{currency(line.debit)} SAR</td>
                      <td className="px-3 py-2 text-right text-xs text-ink">{currency(line.credit)} SAR</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-line bg-surface-soft/40 text-xs font-semibold text-ink">
                  <tr>
                    <td className="px-3 py-2" colSpan={2}>Totals</td>
                    <td className="px-3 py-2 text-right">{currency(selectedEntry.lines.reduce((sum, line) => sum + line.debit, 0))} SAR</td>
                    <td className="px-3 py-2 text-right">{currency(selectedEntry.lines.reduce((sum, line) => sum + line.credit, 0))} SAR</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Linked documents</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {buildJournalLinkedDocuments(selectedEntry).length ? buildJournalLinkedDocuments(selectedEntry).map((link) => (
                  <DocumentLinkTrigger key={`${selectedEntry.id}-${link.documentType}-${link.documentNumber}-detail`} link={link} onPreview={setLinkPreview} className="text-primary underline-offset-2 hover:underline" />
                )) : <span className="text-muted">No linked commercial documents were attached to this entry.</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-sm text-muted">Select a journal entry to inspect its accounting impact.</div>
        )}
      </Card>
      </div>

      <DocumentLinkPreviewModal link={linkPreview} onClose={() => setLinkPreview(null)} />
      {saleLinkPromptOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4" role="dialog" aria-modal="true">
          <Card className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Journal intelligence</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">Link this transaction to documents?</h2>
                <p className="mt-2 text-sm text-muted">A sales pattern was detected from the accounts and memo. Link the commercial documents so the journal register, audit trail, and previews stay connected.</p>
              </div>
              <Button size="xs" variant="secondary" onClick={() => setSaleLinkPromptOpen(false)}>Close</Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Input label="Proforma Invoice" value={saleRefs.proformaInvoice} onChange={(e) => setSaleRefs((current) => ({ ...current, proformaInvoice: e.target.value }))} placeholder="AHN-PRO-QMS-5007" />
              <Input label="Tax Invoice" value={saleRefs.taxInvoice} onChange={(e) => setSaleRefs((current) => ({ ...current, taxInvoice: e.target.value }))} placeholder="AHN-INV-QMS-5008" />
              <Input label="Delivery Note" value={saleRefs.deliveryNote} onChange={(e) => setSaleRefs((current) => ({ ...current, deliveryNote: e.target.value }))} placeholder="AHN-DLV-QMS-5007" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {documentSuggestions.map((document) => (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => {
                    if (document.type === "proforma_invoice") setSaleRefs((current) => ({ ...current, proformaInvoice: document.number }));
                    if (document.type === "delivery_note") setSaleRefs((current) => ({ ...current, deliveryNote: document.number }));
                    if (document.type === "tax_invoice") setSaleRefs((current) => ({ ...current, taxInvoice: document.number }));
                  }}
                  className="rounded-full border border-line bg-surface-soft px-3 py-1 text-xs font-semibold text-ink hover:border-primary/40 hover:text-primary"
                >
                  {document.number} · {document.type.replaceAll("_", " ")}
                </button>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => { bypassSaleLinkPromptRef.current = true; setSaleLinkPromptOpen(false); void handlePost(); }}>Skip linking</Button>
              <Button onClick={() => { bypassSaleLinkPromptRef.current = true; setSaleLinkPromptOpen(false); void handlePost(); }}>Save linked journal</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

/** Individual journal line row with account search */
function JournalLineRow({ line, idx, onUpdate, onRemove, canRemove }: { line: JournalLine; idx: number; onUpdate: (idx: number, patch: Partial<JournalLine>) => void; onRemove: (idx: number) => void; canRemove: boolean }) {
  const [accountQuery, setAccountQuery] = useState(line.accountCode ? `${line.accountCode} ${line.accountName}` : "");
  const [showDropdown, setShowDropdown] = useState(false);

  const suggestions = useMemo(() => {
    if (!showDropdown || !accountQuery.trim()) return defaultChartOfAccounts.filter((a) => a.isActive && a.isPostingAllowed).slice(0, 12);
    return searchAccounts(accountQuery).filter((a) => a.isPostingAllowed).slice(0, 12);
  }, [accountQuery, showDropdown]);

  return (
    <tr className="border-t border-line/50">
      <td className="px-3 py-2 text-xs text-muted">{idx + 1}</td>
      <td className="px-3 py-2 relative">
        <input
          type="text"
          value={accountQuery}
          onChange={(e) => { setAccountQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Search by code or name..."
          className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        />
        {showDropdown && suggestions.length > 0 ? (
          <div className="absolute left-0 top-full z-30 mt-0.5 max-h-48 w-full overflow-auto rounded-lg border border-line bg-white shadow-lg">
            {suggestions.map((acc) => (
              <button
                key={acc.code}
                type="button"
                onMouseDown={() => {
                  onUpdate(idx, { accountCode: acc.code, accountName: acc.name, accountId: acc.id });
                  setAccountQuery(`${acc.code} ${acc.name}`);
                  setShowDropdown(false);
                }}
                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs hover:bg-primary-soft"
              >
                <span className="font-mono font-bold text-ink">{acc.code}</span>
                <span className="text-muted">{acc.name}</span>
                <span className="ml-auto text-[10px] capitalize text-muted/70">{acc.accountClass.replaceAll("_", " ")}</span>
              </button>
            ))}
          </div>
        ) : null}
      </td>
      <td className="px-3 py-2">
        <input type="number" min="0" step="0.01" value={line.debit || ""} onChange={(e) => onUpdate(idx, { debit: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-right text-xs text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10" placeholder="0.00" />
      </td>
      <td className="px-3 py-2">
        <input type="number" min="0" step="0.01" value={line.credit || ""} onChange={(e) => onUpdate(idx, { credit: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-right text-xs text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10" placeholder="0.00" />
      </td>
      <td className="px-3 py-2">
        <input type="text" value={line.memo ?? ""} onChange={(e) => onUpdate(idx, { memo: e.target.value })} className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10" placeholder="Line description" />
      </td>
      <td className="px-3 py-2 text-center">
        {canRemove ? <button type="button" onClick={() => onRemove(idx)} className="text-xs text-red-500 hover:text-red-700">×</button> : null}
      </td>
    </tr>
  );
}