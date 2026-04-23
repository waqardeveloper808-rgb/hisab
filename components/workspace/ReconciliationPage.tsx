"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import {
  analyzeMapping,
  buildDraftPreview,
  buildSuggestedMapping,
  normalizeFieldLabel,
  parseImportTable,
  type DraftIssue,
  type ImportExecutionSummary,
  type ImportField,
  type MappingAnalysis,
  type ParsedImportTable,
} from "@/lib/reconciliation-import";
import {
  importStatementLines,
  listBankAccounts,
  listStatementLineCandidates,
  listStatementLines,
  matchStatementLine,
  reconcileStatementLines,
  type BankAccountRecord,
  type StatementImportLineInput,
  type StatementLineCandidateRecord,
  type StatementLineRecord,
} from "@/lib/workspace-api";
import { mapWorkspaceHref } from "@/lib/workspace-path";

type Notice = {
  tone: "error" | "success";
  text: string;
};

type ImportLogEntry = {
  id: string;
  accountId: number;
  accountCode: string;
  importedBy: string;
  totalRows: number;
  validRows: number;
  importedRows: number;
  invalidRows: number;
  skippedRows: number;
  failedRows: number;
  sourceLabel: string;
  importedAt: string;
  resultSummary: string;
  warnings: string[];
  errors: string[];
  generatedRecords: string[];
};

type StatementFilter = "all" | "unmatched" | "matched" | "reconciled";

function formatMoney(value: number) {
  return `${value.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
}


export function ReconciliationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { basePath } = useWorkspacePath();
  const baseHref = mapWorkspaceHref("/workspace/user/reconciliation", basePath);

  const [accounts, setAccounts] = useState<BankAccountRecord[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [lines, setLines] = useState<StatementLineRecord[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [selectedMatchedIds, setSelectedMatchedIds] = useState<number[]>([]);
  const [candidates, setCandidates] = useState<StatementLineCandidateRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatementFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importSource, setImportSource] = useState("transaction_date,reference,description,debit,credit,running_balance\n2026-04-01,DEP-1001,Customer receipt,0,1250,1250\n2026-04-02,CHQ-2010,Supplier payment,420,0,830");
  const [importSourceLabel, setImportSourceLabel] = useState("pasted-statement.csv");
  const [parsedTable, setParsedTable] = useState<ParsedImportTable>({ headers: [], rows: [], delimiter: "," });
  const [fieldMapping, setFieldMapping] = useState<Record<ImportField, string>>(buildSuggestedMapping([]));
  const [mappingAnalysis, setMappingAnalysis] = useState<MappingAnalysis>({
    duplicateTargets: [],
    missingRequiredTargets: [],
    unmappedSourceHeaders: [],
    mappedSourceHeaders: [],
  });
  const [draftLines, setDraftLines] = useState<StatementImportLineInput[]>([]);
  const [draftIssues, setDraftIssues] = useState<DraftIssue[]>([]);
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);
  const [executionSummary, setExecutionSummary] = useState<ImportExecutionSummary | null>(null);
  const [importLogs, setImportLogs] = useState<ImportLogEntry[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingLines, setIsLoadingLines] = useState(false);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("reconciliation-import-logs");
      if (stored) {
        setImportLogs(JSON.parse(stored) as ImportLogEntry[]);
      }
    } catch {
      window.localStorage.removeItem("reconciliation-import-logs");
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadAccounts() {
      try {
        setIsLoadingAccounts(true);
        const result = await listBankAccounts();
        if (!isActive) {
          return;
        }

        setAccounts(result);
        const requestedAccountId = Number(searchParams.get("account"));
        const nextAccountId = result.some((account) => account.id === requestedAccountId)
          ? requestedAccountId
          : result[0]?.id ?? null;
        setSelectedAccountId(nextAccountId);
        setIsImportOpen(searchParams.get("import") === "1");
      } catch (error) {
        if (!isActive) {
          return;
        }

        setNotice({
          tone: "error",
          text: error instanceof Error ? error.message : "Unable to load bank accounts.",
        });
      } finally {
        if (isActive) {
          setIsLoadingAccounts(false);
        }
      }
    }

    void loadAccounts();

    return () => {
      isActive = false;
    };
  }, [searchParams]);

  useEffect(() => {
    let isActive = true;

    async function loadLines() {
      if (!selectedAccountId) {
        setLines([]);
        return;
      }

      try {
        setIsLoadingLines(true);
        const result = await listStatementLines(selectedAccountId, {
          status: status === "all" ? undefined : status,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        });
        if (!isActive) {
          return;
        }

        setLines(result);
        setSelectedMatchedIds((current) => current.filter((id) => result.some((line) => line.id === id && line.status === "matched")));
        setSelectedLineId((current) => (current && result.some((line) => line.id === current) ? current : result[0]?.id ?? null));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setNotice({
          tone: "error",
          text: error instanceof Error ? error.message : "Unable to load statement lines.",
        });
      } finally {
        if (isActive) {
          setIsLoadingLines(false);
        }
      }
    }

    void loadLines();

    return () => {
      isActive = false;
    };
  }, [selectedAccountId, status, fromDate, toDate]);

  useEffect(() => {
    let isActive = true;

    async function loadCandidates() {
      const selectedLine = lines.find((line) => line.id === selectedLineId) ?? null;
      if (!selectedAccountId || !selectedLine || selectedLine.status === "reconciled") {
        setCandidates([]);
        return;
      }

      try {
        setIsLoadingCandidates(true);
        const result = await listStatementLineCandidates(selectedAccountId, selectedLine.id);
        if (!isActive) {
          return;
        }

        setCandidates(result);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setCandidates([]);
        setNotice({
          tone: "error",
          text: error instanceof Error ? error.message : "Unable to load match candidates.",
        });
      } finally {
        if (isActive) {
          setIsLoadingCandidates(false);
        }
      }
    }

    void loadCandidates();

    return () => {
      isActive = false;
    };
  }, [lines, selectedAccountId, selectedLineId]);

  function updateQuery(next: { account?: number | null; import?: boolean }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.account) {
      params.set("account", String(next.account));
    } else {
      params.delete("account");
    }

    if (next.import) {
      params.set("import", "1");
    } else {
      params.delete("import");
    }

    const query = params.toString();
    router.replace(query ? `${baseHref}?${query}` : baseHref);
  }

  const filteredLines = useMemo(() => {
    if (!search.trim()) {
      return lines;
    }

    const query = search.trim().toLowerCase();
    return lines.filter((line) => `${line.reference} ${line.description}`.toLowerCase().includes(query));
  }, [lines, search]);

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? null;
  const selectedLine = filteredLines.find((line) => line.id === selectedLineId) ?? lines.find((line) => line.id === selectedLineId) ?? null;
  const unmatchedCount = lines.filter((line) => line.status === "unmatched").length;
  const matchedCount = lines.filter((line) => line.status === "matched").length;
  const reconciledCount = lines.filter((line) => line.status === "reconciled").length;
  const bankMovementTotal = lines.reduce((sum, line) => sum + line.credit - line.debit, 0);

  function toggleMatchedSelection(statementLineId: number) {
    setSelectedMatchedIds((current) => (
      current.includes(statementLineId)
        ? current.filter((id) => id !== statementLineId)
        : [...current, statementLineId]
    ));
  }

  function previewImport() {
    const table = parseImportTable(importSource);
    setParsedTable(table);
    setExecutionSummary(null);

    if (table.headers.length === 0 || table.rows.length === 0) {
      setDraftLines([]);
      setDraftIssues([]);
      setPreviewWarnings([]);
      setMappingAnalysis({ duplicateTargets: [], missingRequiredTargets: [], unmappedSourceHeaders: [], mappedSourceHeaders: [] });
      setNotice({ tone: "error", text: "Import preview needs a header row and at least one valid data row." });
      return;
    }

    const nextMapping = buildSuggestedMapping(table.headers);
    setFieldMapping(nextMapping);
    const nextAnalysis = analyzeMapping(table.headers, nextMapping);
    setMappingAnalysis(nextAnalysis);
    const preview = buildDraftPreview(table, nextMapping, {
      existingReferences: lines.map((line) => line.reference).filter(Boolean),
    });
    setDraftLines(preview.lines);
    setDraftIssues(preview.issues);
    setPreviewWarnings(preview.warnings);
    if (preview.lines.length === 0) {
      setNotice({ tone: "error", text: "No valid statement rows were found after applying the detected mapping." });
      return;
    }

    setNotice({ tone: "success", text: `Prepared ${preview.lines.length} valid row${preview.lines.length === 1 ? "" : "s"} with ${preview.issues.filter((issue) => issue.severity === "error").length} blocking issue${preview.issues.filter((issue) => issue.severity === "error").length === 1 ? "" : "s"} and ${preview.issues.filter((issue) => issue.severity === "warning").length} warning${preview.issues.filter((issue) => issue.severity === "warning").length === 1 ? "" : "s"}.` });
  }

  function rebuildDraftFromMapping(nextMapping: Record<ImportField, string>) {
    setFieldMapping(nextMapping);
    setMappingAnalysis(analyzeMapping(parsedTable.headers, nextMapping));
    const preview = buildDraftPreview(parsedTable, nextMapping, {
      existingReferences: lines.map((line) => line.reference).filter(Boolean),
    });
    setDraftLines(preview.lines);
    setDraftIssues(preview.issues);
    setPreviewWarnings(preview.warnings);
    setExecutionSummary(null);
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImportSourceLabel(file.name);
      if (/\.(xlsx|xls)$/i.test(file.name)) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          throw new Error("The selected spreadsheet does not contain a readable worksheet.");
        }
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, { header: 1, raw: false });
        const nextSource = rows
          .filter((row) => Array.isArray(row) && row.some((cell) => `${cell ?? ""}`.trim().length > 0))
          .map((row) => row.map((cell) => `${cell ?? ""}`).join(","))
          .join("\n");
        if (!nextSource.trim()) {
          throw new Error("The selected spreadsheet is empty or uses an unsupported structure.");
        }
        setImportSource(nextSource);
      } else {
        const content = await file.text();
        if (!content.trim()) {
          throw new Error("The selected file is empty.");
        }
        setImportSource(content);
      }
      setDraftLines([]);
      setDraftIssues([]);
      setPreviewWarnings([]);
      setExecutionSummary(null);
      setParsedTable({ headers: [], rows: [], delimiter: "," });
      setMappingAnalysis({ duplicateTargets: [], missingRequiredTargets: [], unmappedSourceHeaders: [], mappedSourceHeaders: [] });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Unable to read the selected import file." });
    }
  }

  async function refreshLines(successText?: string) {
    if (!selectedAccountId) {
      return;
    }

    const result = await listStatementLines(selectedAccountId, {
      status: status === "all" ? undefined : status,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
    setLines(result);
    if (successText) {
      setNotice({ tone: "success", text: successText });
    }
  }

  async function handleImportSubmit() {
    if (!selectedAccountId || draftLines.length === 0) {
      return;
    }

    try {
      setIsImporting(true);
      const result = await importStatementLines(selectedAccountId, draftLines);
      const blockingIssues = draftIssues.filter((issue) => issue.severity === "error").length;
      const nextSummary = {
        ...result.summary,
        totalRows: parsedTable.rows.length,
        validRows: draftLines.length,
        invalidRows: blockingIssues,
      };
      setExecutionSummary(nextSummary);
      const nextLogs = [
        {
          id: `${selectedAccountId}-${Date.now()}`,
          accountId: selectedAccountId,
          accountCode: selectedAccount?.code ?? "Unknown",
          importedBy: "Guest preview",
          totalRows: parsedTable.rows.length,
          validRows: draftLines.length,
          importedRows: nextSummary.importedRows,
          invalidRows: nextSummary.invalidRows,
          skippedRows: nextSummary.skippedRows,
          failedRows: nextSummary.failedRows,
          sourceLabel: importSourceLabel,
          importedAt: new Date().toISOString(),
          resultSummary: `${nextSummary.importedRows} imported, ${nextSummary.skippedRows} skipped, ${nextSummary.failedRows} failed`,
          warnings: nextSummary.warnings,
          errors: nextSummary.errors,
          generatedRecords: nextSummary.generatedRecords,
        },
        ...importLogs,
      ].slice(0, 12);
      setImportLogs(nextLogs);
      window.localStorage.setItem("reconciliation-import-logs", JSON.stringify(nextLogs));
      setDraftLines([]);
      setDraftIssues([]);
      setPreviewWarnings([]);
      setParsedTable({ headers: [], rows: [], delimiter: "," });
      setMappingAnalysis({ duplicateTargets: [], missingRequiredTargets: [], unmappedSourceHeaders: [], mappedSourceHeaders: [] });
      await refreshLines(`Imported ${nextSummary.importedRows} statement line${nextSummary.importedRows === 1 ? "" : "s"} with ${nextSummary.skippedRows} skipped row${nextSummary.skippedRows === 1 ? "" : "s"}.`);
      updateQuery({ account: selectedAccountId, import: false });
      setIsImportOpen(false);
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Unable to import statement lines.",
      });
    } finally {
      setIsImporting(false);
    }
  }

  async function handleMatch(journalLineId: number) {
    if (!selectedAccountId || !selectedLine) {
      return;
    }

    try {
      await matchStatementLine(selectedAccountId, selectedLine.id, journalLineId);
      await refreshLines("Statement line matched successfully.");
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Unable to match statement line.",
      });
    }
  }

  async function handleReconcileSelected() {
    if (!selectedAccountId || selectedMatchedIds.length === 0) {
      return;
    }

    try {
      setIsReconciling(true);
      await reconcileStatementLines(selectedAccountId, selectedMatchedIds);
      setSelectedMatchedIds([]);
      await refreshLines("Selected matched lines reconciled.");
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Unable to reconcile selected lines.",
      });
    } finally {
      setIsReconciling(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Banking</p>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Bank Reconciliation</h1>
          <p className="text-xs text-muted">Account-scoped statement import, matching, and reconciliation against the live backend contract.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => { const next = !isImportOpen; setIsImportOpen(next); updateQuery({ account: selectedAccountId, import: next }); }} disabled={!selectedAccountId}>
            {isImportOpen ? "Close Import" : "Import Statement"}
          </Button>
          <Button size="sm" onClick={() => void refreshLines()} disabled={!selectedAccountId || isLoadingLines}>Reload Lines</Button>
          <Button size="sm" onClick={() => void handleReconcileSelected()} disabled={selectedMatchedIds.length === 0 || isReconciling}>
            Reconcile Selected
          </Button>
        </div>
      </div>

      {notice ? (
        <Card className={notice.tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"}>
          <p className="text-xs font-medium">{notice.text}</p>
        </Card>
      ) : null}

      <div className="grid gap-2 md:grid-cols-5">
        <Card className="rounded-lg bg-white/95 p-2.5">
          <p className="text-[10px] font-semibold text-muted">Selected Account</p>
          <p className="text-sm font-bold text-ink">{selectedAccount ? selectedAccount.code : "None"}</p>
        </Card>
        <Card className="rounded-lg bg-white/95 p-2.5">
          <p className="text-[10px] font-semibold text-muted">Unmatched</p>
          <p className="text-sm font-bold text-amber-700">{unmatchedCount}</p>
        </Card>
        <Card className="rounded-lg bg-white/95 p-2.5">
          <p className="text-[10px] font-semibold text-muted">Matched</p>
          <p className="text-sm font-bold text-sky-700">{matchedCount}</p>
        </Card>
        <Card className="rounded-lg bg-white/95 p-2.5">
          <p className="text-[10px] font-semibold text-muted">Reconciled</p>
          <p className="text-sm font-bold text-green-700">{reconciledCount}</p>
        </Card>
        <Card className="rounded-lg bg-white/95 p-2.5">
          <p className="text-[10px] font-semibold text-muted">Net Bank Movement</p>
          <p className={`text-sm font-bold ${bankMovementTotal < 0 ? "text-red-700" : "text-ink"}`}>{formatMoney(bankMovementTotal)}</p>
        </Card>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-line bg-white p-3 lg:flex-row lg:items-end">
        <div className="min-w-48">
          <label htmlFor="reconciliation-account" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">Bank account</label>
          <select
            id="reconciliation-account"
            className="h-9 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none focus:border-primary"
            value={selectedAccountId ?? ""}
            disabled={isLoadingAccounts || accounts.length === 0}
            onChange={(event) => {
              const nextId = Number(event.target.value);
              setSelectedAccountId(nextId);
              updateQuery({ account: nextId, import: isImportOpen });
            }}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.code} · {account.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-40">
          <label htmlFor="reconciliation-status" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">Status</label>
          <select
            id="reconciliation-status"
            className="h-9 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none focus:border-primary"
            value={status}
            onChange={(event) => setStatus(event.target.value as StatementFilter)}
          >
            <option value="all">All</option>
            <option value="unmatched">Unmatched</option>
            <option value="matched">Matched</option>
            <option value="reconciled">Reconciled</option>
          </select>
        </div>
        <div>
          <label htmlFor="reconciliation-from-date" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">From</label>
          <input id="reconciliation-from-date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-9 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none focus:border-primary" />
        </div>
        <div>
          <label htmlFor="reconciliation-to-date" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">To</label>
          <input id="reconciliation-to-date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-9 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none focus:border-primary" />
        </div>
        <div className="flex-1">
          <label htmlFor="reconciliation-search" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">Search</label>
          <input id="reconciliation-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference or description" className="h-9 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none focus:border-primary" />
        </div>
      </div>

      {isImportOpen ? (
        <Card className="space-y-3 bg-white/95">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Statement import</p>
              <h2 className="text-sm font-semibold text-ink">Paste CSV or tab-delimited rows</h2>
              <p className="text-xs text-muted">Upload CSV or Excel, review detected mappings, preview valid rows, fix blocked rows, then commit directly into reconciliation.</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <label className="inline-flex cursor-pointer items-center rounded-md border border-line bg-white px-3 py-2 text-xs font-medium text-ink hover:bg-surface-soft/30">
                Upload File
                <input type="file" accept=".csv,.tsv,.xlsx,.xls" className="hidden" onChange={(event) => void handleImportFile(event)} />
              </label>
              <Button size="sm" variant="secondary" onClick={() => { setImportSource(""); setImportSourceLabel("pasted-statement.csv"); setParsedTable({ headers: [], rows: [], delimiter: "," }); setDraftLines([]); setDraftIssues([]); setPreviewWarnings([]); setExecutionSummary(null); }}>Clear</Button>
              <Button size="sm" variant="secondary" onClick={previewImport}>Preview Import</Button>
              <Button size="sm" onClick={() => void handleImportSubmit()} disabled={!selectedAccountId || draftLines.length === 0 || isImporting}>
                {isImporting ? "Importing…" : "Commit Import"}
              </Button>
            </div>
          </div>
          <div className="rounded-md border border-dashed border-line bg-surface-soft/35 px-3 py-2 text-xs text-muted">
            Source: <span className="font-semibold text-ink">{importSourceLabel}</span>
          </div>
          <textarea
            value={importSource}
            onChange={(event) => {
              setImportSource(event.target.value);
              setImportSourceLabel("pasted-statement.csv");
            }}
            rows={7}
            className="block w-full rounded-lg border border-line-strong bg-white px-4 py-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          />
          <div className="grid gap-2 md:grid-cols-4">
            <Card className="rounded-lg bg-white/95 p-2.5">
              <p className="text-[10px] font-semibold text-muted">Rows Detected</p>
              <p className="text-sm font-bold text-ink">{parsedTable.rows.length}</p>
            </Card>
            <Card className="rounded-lg bg-white/95 p-2.5">
              <p className="text-[10px] font-semibold text-muted">Valid Preview Rows</p>
              <p className="text-sm font-bold text-green-700">{draftLines.length}</p>
            </Card>
            <Card className="rounded-lg bg-white/95 p-2.5">
              <p className="text-[10px] font-semibold text-muted">Blocking Issues</p>
              <p className="text-sm font-bold text-red-700">{draftIssues.filter((issue) => issue.severity === "error").length}</p>
            </Card>
            <Card className="rounded-lg bg-white/95 p-2.5">
              <p className="text-[10px] font-semibold text-muted">Warnings</p>
              <p className="text-sm font-bold text-amber-700">{draftIssues.filter((issue) => issue.severity === "warning").length + previewWarnings.length}</p>
            </Card>
          </div>
          {parsedTable.headers.length > 0 ? (
            <div className="space-y-2 rounded-md border border-line bg-surface-soft/25 p-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Smart mapping suggestions</p>
                <p className="text-xs text-muted">Review detected columns before committing. Customer, company, amount, VAT, currency, item, and account recognition are surfaced for operator review even when the final write only creates bank statement rows.</p>
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {(["transactionDate", "valueDate", "reference", "invoiceNumber", "paymentReference", "description", "customer", "company", "debit", "credit", "amount", "subtotal", "vat", "currency", "quantity", "itemDescription", "runningBalance", "accountCategory"] as ImportField[]).map((field) => (
                  <div key={field}>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{normalizeFieldLabel(field)}</label>
                    <select
                      value={fieldMapping[field] ?? ""}
                      onChange={(event) => rebuildDraftFromMapping({ ...fieldMapping, [field]: event.target.value })}
                      className="h-9 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none focus:border-primary"
                    >
                      <option value="">Not mapped</option>
                      {parsedTable.headers.map((header) => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              {mappingAnalysis.missingRequiredTargets.length > 0 || mappingAnalysis.duplicateTargets.length > 0 || mappingAnalysis.unmappedSourceHeaders.length > 0 ? (
                <div className="grid gap-2 xl:grid-cols-3">
                  <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
                    <p className="font-semibold">Required mapping gaps</p>
                    <p className="mt-1">{mappingAnalysis.missingRequiredTargets.length > 0 ? mappingAnalysis.missingRequiredTargets.map((field) => normalizeFieldLabel(field)).join(", ") : "None"}</p>
                  </div>
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                    <p className="font-semibold">Duplicate mapping warnings</p>
                    <p className="mt-1">{mappingAnalysis.duplicateTargets.length > 0 ? mappingAnalysis.duplicateTargets.map((field) => normalizeFieldLabel(field)).join(", ") : "None"}</p>
                  </div>
                  <div className="rounded-md border border-line bg-white p-2 text-xs text-muted">
                    <p className="font-semibold text-ink">Unmapped source columns</p>
                    <p className="mt-1">{mappingAnalysis.unmappedSourceHeaders.length > 0 ? mappingAnalysis.unmappedSourceHeaders.join(", ") : "All source columns are reviewed."}</p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          {previewWarnings.length > 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-semibold">Import-level warnings</p>
              <div className="mt-2 space-y-1">
                {previewWarnings.map((warning) => <p key={warning}>{warning}</p>)}
              </div>
            </div>
          ) : null}
          {draftIssues.length > 0 ? (
            <div className="rounded-md border border-line bg-white p-3 text-xs text-ink">
              <p className="font-semibold">Validation issues</p>
              <div className="mt-2 space-y-1">
                {draftIssues.slice(0, 8).map((issue) => (
                  <p key={`${issue.rowNumber}-${issue.message}`} className={issue.severity === "error" ? "text-red-800" : "text-amber-900"}>
                    Row {issue.rowNumber}: {issue.message}
                  </p>
                ))}
                {draftIssues.length > 8 ? <p>and {draftIssues.length - 8} more blocked rows.</p> : null}
              </div>
            </div>
          ) : null}
          {draftLines.length > 0 ? (
            <div className="rounded-md border border-line bg-surface-soft/20 p-3 text-xs text-muted">
              <p className="font-semibold text-ink">What happens on import</p>
              <p className="mt-1">Valid rows are written as unmatched bank statement lines in the selected account, duplicate rows may be skipped, and the workflow returns you to matching and reconciliation rather than ending in a dead confirmation state.</p>
            </div>
          ) : null}
          {draftLines.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-line">
              <div className="grid grid-cols-[110px_120px_1fr_90px_90px_120px] gap-1.5 border-b border-line bg-surface-soft/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                <span>Date</span>
                <span>Reference</span>
                <span>Description</span>
                <span className="text-right">Debit</span>
                <span className="text-right">Credit</span>
                <span className="text-right">Running Balance</span>
              </div>
              {draftLines.map((line, index) => (
                <div key={`${line.transactionDate}-${line.reference}-${index}`} className="grid grid-cols-[110px_120px_1fr_90px_90px_120px] gap-1.5 border-b border-line px-3 py-1.5 text-xs text-ink">
                  <span>{line.transactionDate}</span>
                  <span className="font-mono text-[11px] text-muted">{line.reference || "—"}</span>
                  <span>{line.description || "—"}</span>
                  <span className="text-right font-mono">{line.debit ? formatMoney(line.debit) : "—"}</span>
                  <span className="text-right font-mono">{line.credit ? formatMoney(line.credit) : "—"}</span>
                  <span className="text-right font-mono">{typeof line.runningBalance === "number" ? formatMoney(line.runningBalance) : "—"}</span>
                </div>
              ))}
            </div>
          ) : null}
          {executionSummary ? (
            <div className="space-y-2 rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-900">
              <div>
                <p className="font-semibold">Import execution result</p>
                <p className="mt-1">{executionSummary.importedRows} imported, {executionSummary.skippedRows} skipped, {executionSummary.failedRows} failed.</p>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <div>Generated records: {executionSummary.generatedRecords.length}</div>
                <div>Warnings: {executionSummary.warnings.length}</div>
                <div>Errors: {executionSummary.errors.length}</div>
              </div>
              {executionSummary.generatedRecords.length > 0 ? (
                <div className="space-y-1">
                  {executionSummary.generatedRecords.slice(0, 5).map((record) => <p key={record}>{record}</p>)}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-1.5">
                <Button size="xs" onClick={() => setIsImportOpen(false)}>Continue to Reconciliation</Button>
                <Button size="xs" variant="secondary" onClick={() => { setIsImportOpen(true); setExecutionSummary(null); }}>Re-import</Button>
                <Button size="xs" variant="secondary" href={mapWorkspaceHref(`/workspace/user/banking${selectedAccountId ? `?account=${selectedAccountId}` : ""}`, basePath)}>Review Bank Account</Button>
              </div>
            </div>
          ) : null}
          <div className="space-y-2 rounded-md border border-line bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Import logs</p>
                <p className="text-xs text-muted">Recent import attempts for reconciliation review and audit visibility.</p>
              </div>
            </div>
            {importLogs.length === 0 ? <p className="text-xs text-muted">No statement imports have been logged in this browser yet.</p> : null}
            {importLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="space-y-1 border-b border-line px-1 py-1.5 text-xs text-ink last:border-b-0">
                <div className="grid grid-cols-[110px_1fr_170px] gap-2">
                  <span className="font-semibold">{log.accountCode}</span>
                  <span className="truncate text-muted">{log.sourceLabel}</span>
                  <span className="text-right text-muted">{new Date(log.importedAt).toLocaleString("en-SA")}</span>
                </div>
                <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-2 text-[11px] text-muted">
                  <span>Total {log.totalRows}</span>
                  <span>Valid {log.validRows}</span>
                  <span>Imported {log.importedRows}</span>
                  <span>Skipped {log.skippedRows}</span>
                  <span>Invalid {log.invalidRows + log.failedRows}</span>
                </div>
                <p className="text-[11px] text-ink">{log.resultSummary}</p>
                <p className="text-[11px] text-muted">Imported by {log.importedBy}</p>
                {log.warnings.length > 0 ? <p className="text-[11px] text-amber-800">Warnings: {log.warnings.join(" | ")}</p> : null}
                {log.errors.length > 0 ? <p className="text-[11px] text-red-800">Errors: {log.errors.join(" | ")}</p> : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="flex flex-col gap-2 xl:flex-row">
        <div className="flex-1 overflow-hidden rounded-md border border-line bg-white">
          <div className="grid grid-cols-[36px_110px_110px_1fr_95px_95px_90px_95px] gap-1.5 border-b border-line bg-surface-soft/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
            <span />
            <span>Date</span>
            <span>Reference</span>
            <span>Description</span>
            <span className="text-right">Debit</span>
            <span className="text-right">Credit</span>
            <span>Status</span>
            <span className="text-right">Balance</span>
          </div>
          {isLoadingLines ? <p className="px-3 py-6 text-center text-xs text-muted">Loading statement lines…</p> : null}
          {!isLoadingLines && filteredLines.length === 0 ? <p className="px-3 py-6 text-center text-xs text-muted">No statement lines matched the current filters.</p> : null}
          {!isLoadingLines && filteredLines.map((line) => {
            const isSelected = selectedLineId === line.id;
            const canSelectForReconcile = line.status === "matched";

            return (
              <div
                key={line.id}
                className={[
                  "grid grid-cols-[36px_110px_110px_1fr_95px_95px_90px_95px] gap-1.5 border-b border-line px-3 py-1.5 text-xs text-ink",
                  isSelected ? "bg-primary-soft/15" : line.status === "unmatched" ? "bg-amber-50/40" : "bg-white",
                ].join(" ")}
              >
                <div className="flex items-center justify-center">
                  {canSelectForReconcile ? (
                    <input type="checkbox" checked={selectedMatchedIds.includes(line.id)} onChange={() => toggleMatchedSelection(line.id)} className="rounded border-line" />
                  ) : null}
                </div>
                <button type="button" onClick={() => setSelectedLineId(line.id)} className="text-left">{line.transactionDate}</button>
                <button type="button" onClick={() => setSelectedLineId(line.id)} className="text-left font-mono text-[11px] text-muted">{line.reference || "—"}</button>
                <button type="button" onClick={() => setSelectedLineId(line.id)} className="truncate text-left">{line.description || "—"}</button>
                <button type="button" onClick={() => setSelectedLineId(line.id)} className="text-right font-mono">{line.debit ? formatMoney(line.debit) : "—"}</button>
                <button type="button" onClick={() => setSelectedLineId(line.id)} className="text-right font-mono">{line.credit ? formatMoney(line.credit) : "—"}</button>
                <button type="button" onClick={() => setSelectedLineId(line.id)} className="text-left">
                  <span className={[
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    line.status === "unmatched" ? "bg-amber-100 text-amber-800" : line.status === "matched" ? "bg-sky-100 text-sky-800" : "bg-green-100 text-green-800",
                  ].join(" ")}>
                    {line.status}
                  </span>
                </button>
                <button type="button" onClick={() => setSelectedLineId(line.id)} className="text-right font-mono">{formatMoney(line.runningBalance)}</button>
              </div>
            );
          })}
        </div>

        <div className="w-full shrink-0 rounded-md border border-line bg-white p-3 xl:w-[24rem]">
          {selectedLine ? (
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Selected statement line</p>
                <h2 className="text-sm font-semibold text-ink">{selectedLine.reference || "Unreferenced entry"}</h2>
                <p className="text-xs text-muted">{selectedLine.description || "No description"}</p>
              </div>
              <div className="space-y-1 text-xs text-ink">
                <div className="flex justify-between gap-3"><span className="text-muted">Transaction date</span><span>{selectedLine.transactionDate}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted">Value date</span><span>{selectedLine.valueDate || "—"}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted">Debit</span><span className="font-mono">{selectedLine.debit ? formatMoney(selectedLine.debit) : "—"}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted">Credit</span><span className="font-mono">{selectedLine.credit ? formatMoney(selectedLine.credit) : "—"}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted">Status</span><span className="capitalize">{selectedLine.status}</span></div>
              </div>

              <div className="space-y-2 rounded-md bg-surface-soft/45 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Match candidates</p>
                  {isLoadingCandidates ? <span className="text-[11px] text-muted">Loading…</span> : null}
                </div>
                {selectedLine.status === "reconciled" ? <p className="text-xs text-muted">This line is already reconciled.</p> : null}
                {selectedLine.status !== "reconciled" && !isLoadingCandidates && candidates.length === 0 ? <p className="text-xs text-muted">No journal-line candidates were returned for this bank amount.</p> : null}
                {selectedLine.status !== "reconciled" && candidates.map((candidate) => (
                  <div key={candidate.id} className="rounded-md border border-line bg-white p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-ink">{candidate.journalEntryNumber}</p>
                        <p className="text-[11px] text-muted">{candidate.journalEntryDate || "No date"}</p>
                      </div>
                      <div className="text-right text-[11px] font-mono text-ink">
                        <div>{candidate.debit ? `Dr ${formatMoney(candidate.debit)}` : "—"}</div>
                        <div>{candidate.credit ? `Cr ${formatMoney(candidate.credit)}` : "—"}</div>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted">{candidate.description || candidate.journalEntryDescription || "No journal-line description"}</p>
                    <div className="mt-2">
                      <Button size="xs" onClick={() => void handleMatch(candidate.id)} disabled={selectedLine.status !== "unmatched"}>Match This Line</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted">Select a statement line to review candidates.</p>
          )}
        </div>
      </div>
    </div>
  );
}
