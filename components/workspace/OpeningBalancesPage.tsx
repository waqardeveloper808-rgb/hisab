"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { ImportExportControls } from "@/components/workspace/ImportExportControls";
import {
  createJournal,
  listAccounts,
  listJournals,
  postJournal,
  type AccountRecord,
  type JournalEntryRecord,
} from "@/lib/workspace-api";
import type { SpreadsheetRow } from "@/lib/spreadsheet";

type BalanceEntry = {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
  note: string;
};

const IMPORT_FIELDS = [
  { key: "account_code", label: "Account code", required: true, aliases: ["code", "gl_code", "account"] },
  { key: "account_name", label: "Account name", aliases: ["name", "ledger_name"] },
  { key: "debit", label: "Debit", aliases: ["dr", "debit_amount"] },
  { key: "credit", label: "Credit", aliases: ["cr", "credit_amount"] },
  { key: "note", label: "Note", aliases: ["memo", "description", "remarks"] },
] as const;

function createEmptyEntry(index: number): BalanceEntry {
  return {
    id: `opening-balance-${index}-${Math.random().toString(36).slice(2, 8)}`,
    accountCode: "",
    accountName: "",
    accountType: "",
    debit: 0,
    credit: 0,
    note: "",
  };
}

function toAmount(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(numeric) ? numeric : 0;
}

function money(value: number) {
  return value.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function equalsAmount(left: number, right: number) {
  return Math.abs(left - right) < 0.005;
}

export function OpeningBalancesPage() {
  const [entries, setEntries] = useState<BalanceEntry[]>([createEmptyEntry(1), createEmptyEntry(2)]);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [openingJournal, setOpeningJournal] = useState<JournalEntryRecord | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [postingDate, setPostingDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("OPENING-BALANCES");
  const [memo, setMemo] = useState("Opening balances import");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const accountByCode = useMemo(() => new Map(accounts.map((account) => [account.code.toLowerCase(), account])), [accounts]);

  const loadWorkspaceState = useCallback(async () => {
    setLoading(true);
    try {
      const [accountRows, journalRows] = await Promise.all([
        listAccounts({ active: true }),
        listJournals(),
      ]);
      setAccounts(accountRows.filter((account) => account.isPostingAllowed));
      setOpeningJournal(journalRows.find((journal) => journal.metadata?.workflow === "opening_balances") ?? null);
      setNotice(null);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Opening balances could not be loaded." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspaceState();
  }, [loadWorkspaceState]);

  const hydratedEntries = useMemo(() => {
    return entries.map((entry) => {
      const matchedAccount = accountByCode.get(entry.accountCode.trim().toLowerCase());
      return matchedAccount ? {
        ...entry,
        accountName: entry.accountName || matchedAccount.name,
        accountType: matchedAccount.accountClass,
      } : entry;
    });
  }, [accountByCode, entries]);

  const filtered = useMemo(() => {
    return hydratedEntries.filter((entry) => {
      const matchesType = filterType === "all" ? true : entry.accountType === filterType;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q ? true : `${entry.accountCode} ${entry.accountName} ${entry.note}`.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [filterType, hydratedEntries, search]);

  const totalDebit = hydratedEntries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = hydratedEntries.reduce((sum, entry) => sum + entry.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = equalsAmount(totalDebit, totalCredit);

  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    const activeEntries = hydratedEntries.filter((entry) => entry.accountCode || entry.accountName || entry.debit || entry.credit || entry.note);

    if (activeEntries.length < 2) {
      issues.push("Add at least two lines before posting opening balances.");
    }

    activeEntries.forEach((entry, index) => {
      if (!entry.accountCode.trim()) {
        issues.push(`Line ${index + 1}: account code is required.`);
        return;
      }

      const matchedAccount = accountByCode.get(entry.accountCode.trim().toLowerCase());

      if (!matchedAccount) {
        issues.push(`Line ${index + 1}: account ${entry.accountCode} was not found in the chart of accounts.`);
        return;
      }

      if ((entry.debit > 0 && entry.credit > 0) || (entry.debit <= 0 && entry.credit <= 0)) {
        issues.push(`Line ${index + 1}: enter either a debit or a credit amount.`);
      }
    });

    if (!isBalanced) {
      issues.push("Opening balances must be perfectly balanced before posting.");
    }

    return issues;
  }, [accountByCode, hydratedEntries, isBalanced]);

  function updateEntry(id: string, patch: Partial<BalanceEntry>) {
    setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, ...patch } : entry));
  }

  function addLine() {
    setEntries((current) => [...current, createEmptyEntry(current.length + 1)]);
  }

  function removeLine(id: string) {
    setEntries((current) => current.length <= 2 ? current : current.filter((entry) => entry.id !== id));
  }

  const handleImportFile = useCallback(async ({ mappedRows }: {
    file: File;
    rows: SpreadsheetRow[];
    mappedRows: SpreadsheetRow[];
    headers: string[];
    fileName: string;
    mapping: Record<string, string>;
  }) => {
    const errors: Array<{ rowNumber: number; field?: string; message: string }> = [];

    const importedEntries = mappedRows.map((row, index) => {
      const rowNumber = index + 2;
      const accountCode = String(row.account_code ?? "").trim();
      const matchedAccount = accountByCode.get(accountCode.toLowerCase());
      const debit = toAmount(row.debit);
      const credit = toAmount(row.credit);

      if (!accountCode) {
        errors.push({ rowNumber, field: "account_code", message: "Account code is required." });
      } else if (!matchedAccount) {
        errors.push({ rowNumber, field: "account_code", message: `Account ${accountCode} was not found.` });
      }

      if ((debit > 0 && credit > 0) || (debit <= 0 && credit <= 0)) {
        errors.push({ rowNumber, field: "debit", message: "Provide either a debit or a credit amount." });
      }

      return {
        id: createEmptyEntry(index + 1).id,
        accountCode,
        accountName: String(row.account_name ?? matchedAccount?.name ?? "").trim(),
        accountType: matchedAccount?.accountClass ?? "",
        debit,
        credit,
        note: String(row.note ?? "").trim(),
      } satisfies BalanceEntry;
    });

    const importDebit = importedEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const importCredit = importedEntries.reduce((sum, entry) => sum + entry.credit, 0);

    if (!equalsAmount(importDebit, importCredit)) {
      errors.push({ rowNumber: 0, message: "Imported opening balances are not balanced." });
    }

    if (errors.length) {
      return {
        createdCount: 0,
        message: `Import blocked. Fix ${errors.length} validation issue${errors.length === 1 ? "" : "s"} and try again.`,
        errors,
      };
    }

    setEntries(importedEntries.length ? importedEntries : [createEmptyEntry(1), createEmptyEntry(2)]);
    setNotice({ tone: "success", text: `Loaded ${importedEntries.length} opening balance lines into the worksheet.` });

    return {
      createdCount: importedEntries.length,
      message: `Loaded ${importedEntries.length} opening balance lines for review. Post them when ready.`,
    };
  }, [accountByCode]);

  async function handlePostOpeningBalances() {
    if (validationIssues.length) {
      setNotice({ tone: "error", text: validationIssues[0] });
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const lines = hydratedEntries
        .filter((entry) => entry.accountCode.trim() && (entry.debit > 0 || entry.credit > 0))
        .map((entry) => {
          const account = accountByCode.get(entry.accountCode.trim().toLowerCase());
          if (!account) {
            throw new Error(`Account ${entry.accountCode} was not found.`);
          }

          return {
            accountId: account.id,
            debit: entry.debit,
            credit: entry.credit,
            description: entry.note || "Opening balance",
          };
        });

      const draftJournal = await createJournal({
        entryDate: postingDate,
        postingDate,
        reference,
        memo,
        metadata: {
          workflow: "opening_balances",
          imported_line_count: lines.length,
        },
        lines,
      });

      const postedJournal = await postJournal(draftJournal.id);
      setOpeningJournal(postedJournal);
      setNotice({ tone: "success", text: `Opening balances posted as ${postedJournal.entryNumber}.` });
      await loadWorkspaceState();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Opening balances could not be posted." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2" data-inspector-opening-balances="live">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Accounting</p>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Opening Balances</h1>
          <p className="text-xs text-muted">Build and import the opening journal against the live chart of accounts, then post it once the debits and credits match exactly.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={["rounded-full px-2.5 py-0.5 text-[11px] font-semibold", isBalanced ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"].join(" ")}>
            {isBalanced ? "Balanced" : "Out of balance"}
          </span>
          <button
            type="button"
            onClick={() => void handlePostOpeningBalances()}
            disabled={saving || loading || validationIssues.length > 0}
            className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Posting..." : "Post Opening Balances"}
          </button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <Card className="rounded-lg bg-white/95 p-2.5">
          <p className="text-[10px] font-semibold text-muted">Total Debit</p>
          <p className="text-sm font-bold text-ink">{money(totalDebit)} SAR</p>
        </Card>
        <Card className="rounded-lg bg-white/95 p-2.5">
          <p className="text-[10px] font-semibold text-muted">Total Credit</p>
          <p className="text-sm font-bold text-ink">{money(totalCredit)} SAR</p>
        </Card>
        <Card className="rounded-lg bg-white/95 p-2.5">
          <p className="text-[10px] font-semibold text-muted">Difference</p>
          <p className={["text-sm font-bold", isBalanced ? "text-green-700" : "text-red-700"].join(" ")}>{money(difference)} SAR</p>
        </Card>
        <Card className="rounded-lg bg-white/95 p-2.5">
          <p className="text-[10px] font-semibold text-muted">Last Posted Journal</p>
          <p className="text-sm font-bold text-ink">{openingJournal?.entryNumber ?? "None yet"}</p>
        </Card>
      </div>

      <div className="grid gap-2 rounded-lg border border-line bg-white p-2 md:grid-cols-[minmax(0,1fr)_12rem_12rem]">
        <label className="text-xs font-medium text-ink">
          Reference
          <input value={reference} onChange={(event) => setReference(event.target.value)} className="mt-1 h-8 w-full rounded-md border border-line bg-white px-2 text-xs text-ink outline-none focus:border-primary" />
        </label>
        <label className="text-xs font-medium text-ink">
          Posting date
          <input type="date" value={postingDate} onChange={(event) => setPostingDate(event.target.value)} className="mt-1 h-8 w-full rounded-md border border-line bg-white px-2 text-xs text-ink outline-none focus:border-primary" />
        </label>
        <label className="text-xs font-medium text-ink">
          Memo
          <input value={memo} onChange={(event) => setMemo(event.target.value)} className="mt-1 h-8 w-full rounded-md border border-line bg-white px-2 text-xs text-ink outline-none focus:border-primary" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white p-2">
        <input
          className="h-8 rounded-md border border-line bg-white px-2.5 text-xs text-ink placeholder:text-muted focus:border-primary focus:outline-none"
          placeholder="Search accounts..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="h-8 rounded-md border border-line bg-white px-2 text-xs text-ink focus:border-primary focus:outline-none"
          value={filterType}
          onChange={(event) => setFilterType(event.target.value)}
        >
          <option value="all">All classes</option>
          <option value="asset">Assets</option>
          <option value="liability">Liabilities</option>
          <option value="equity">Equity</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>
        <ImportExportControls
          label="opening balances"
          exportFileName="opening-balances.csv"
          xlsxExportFileName="opening-balances.xlsx"
          rows={hydratedEntries}
          columns={[
            { label: "Account code", value: (row) => row.accountCode },
            { label: "Account name", value: (row) => row.accountName },
            { label: "Account class", value: (row) => row.accountType },
            { label: "Debit", value: (row) => row.debit },
            { label: "Credit", value: (row) => row.credit },
            { label: "Note", value: (row) => row.note },
          ]}
          importMappingFields={[...IMPORT_FIELDS]}
          importRules={[
            "Required column: account_code.",
            "Each row must contain either a debit or a credit amount, not both.",
            "The imported journal must balance exactly before it can be posted.",
            "Account codes must already exist in the chart of accounts and allow posting.",
          ]}
          onImportFile={handleImportFile}
        />
        <button type="button" onClick={addLine} className="ml-auto rounded-md border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface-soft/30">Add Line</button>
      </div>

      {notice ? <div className={["rounded-md px-2.5 py-1.5 text-xs", notice.tone === "success" ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "border border-red-200 bg-red-50 text-red-700"].join(" ")}>{notice.text}</div> : null}
      {validationIssues.length ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
          <p className="font-semibold">Validation checks</p>
          <ul className="mt-1 space-y-1">
            {validationIssues.slice(0, 5).map((issue) => <li key={issue}>• {issue}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-md border border-line bg-white">
        <div className="grid grid-cols-[7rem_minmax(0,1.3fr)_7rem_8rem_8rem_minmax(0,1fr)_3rem] gap-1.5 border-b border-line bg-surface-soft/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
          <span>Code</span>
          <span>Account</span>
          <span>Class</span>
          <span className="text-right">Debit</span>
          <span className="text-right">Credit</span>
          <span>Note</span>
          <span />
        </div>
        {loading ? <p className="px-3 py-6 text-center text-xs text-muted">Loading live chart of accounts...</p> : null}
        {!loading && filtered.length === 0 ? <p className="px-3 py-6 text-center text-xs text-muted">No opening balance lines match the current filters.</p> : null}
        {!loading && filtered.map((entry) => {
          const matchedAccount = accountByCode.get(entry.accountCode.trim().toLowerCase());
          return (
            <div key={entry.id} className="grid grid-cols-[7rem_minmax(0,1.3fr)_7rem_8rem_8rem_minmax(0,1fr)_3rem] gap-1.5 border-b border-line px-3 py-1.5 text-xs text-ink hover:bg-surface-soft/30">
              <input
                value={entry.accountCode}
                onChange={(event) => updateEntry(entry.id, { accountCode: event.target.value.toUpperCase() })}
                className="h-8 rounded border border-line px-2 font-mono text-[11px] outline-none focus:border-primary"
                list="opening-balance-account-codes"
              />
              <input
                value={matchedAccount?.name ?? entry.accountName}
                onChange={(event) => updateEntry(entry.id, { accountName: event.target.value })}
                className="h-8 rounded border border-line px-2 outline-none focus:border-primary"
                readOnly={Boolean(matchedAccount)}
              />
              <span className="flex items-center text-[11px] capitalize text-muted">{matchedAccount?.accountClass ?? entry.accountType ?? "-"}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={entry.debit || ""}
                onChange={(event) => updateEntry(entry.id, { debit: toAmount(event.target.value), credit: 0 })}
                className="h-8 rounded border border-line px-2 text-right font-mono outline-none focus:border-primary"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={entry.credit || ""}
                onChange={(event) => updateEntry(entry.id, { credit: toAmount(event.target.value), debit: 0 })}
                className="h-8 rounded border border-line px-2 text-right font-mono outline-none focus:border-primary"
              />
              <input
                value={entry.note}
                onChange={(event) => updateEntry(entry.id, { note: event.target.value })}
                className="h-8 rounded border border-line px-2 outline-none focus:border-primary"
              />
              <button type="button" onClick={() => removeLine(entry.id)} className="rounded border border-line text-[10px] font-semibold text-muted hover:text-ink">x</button>
            </div>
          );
        })}
        <div className="grid grid-cols-[7rem_minmax(0,1.3fr)_7rem_8rem_8rem_minmax(0,1fr)_3rem] gap-1.5 bg-surface-soft/40 px-3 py-1.5 text-xs font-bold text-ink">
          <span />
          <span>Totals</span>
          <span />
          <span className="text-right font-mono">{money(totalDebit)}</span>
          <span className="text-right font-mono">{money(totalCredit)}</span>
          <span>{openingJournal ? `Posted ${openingJournal.entryNumber}` : "Ready to post"}</span>
          <span />
        </div>
      </div>

      <datalist id="opening-balance-account-codes">
        {accounts.map((account) => <option key={account.id} value={account.code}>{account.name}</option>)}
      </datalist>
    </div>
  );
}
