"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import {
  cloneDefaultChartOfAccounts,
  getActiveChartOfAccounts,
  normalBalanceForClass,
  setWorkspaceChartOfAccountsSnapshot,
  suggestNextChildCode,
  suggestNextRootCode,
  type Account,
  type AccountClass,
  type AccountGroup,
  type CashFlowType,
} from "@/lib/accounting-engine";
import { previewJournalBalanceByAccountId, previewJournalLineCountByAccountId } from "@/lib/workspace/preview-journal-account-stats";
import { formatCurrency } from "@/lib/workspace/format";
import { useRegisterTableLayout, type RegisterColumnWidthDef } from "@/lib/workspace/register-table-layout";
import { RegisterTableHeaderCell } from "@/components/workspace/RegisterTableHeaderCell";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";
import { ChevronDown, ChevronRight, Lock, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";

const COA_STORAGE_KEY = "hisab.workspace.coa.v1";

const classOrder: AccountClass[] = ["asset", "liability", "equity", "income", "cost_of_sales", "expense", "contra"];

const classLabels: Record<AccountClass, string> = {
  asset: "Assets",
  liability: "Liabilities",
  equity: "Equity",
  income: "Revenue",
  expense: "Expenses",
  cost_of_sales: "Cost of sales",
  contra: "Contra",
};

type UiAccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

function uiTypeFromClass(c: AccountClass): UiAccountType {
  if (c === "income") return "revenue";
  if (c === "expense" || c === "cost_of_sales") return "expense";
  if (c === "contra") return "expense";
  return c as UiAccountType;
}

function classFromUiType(u: UiAccountType): AccountClass {
  if (u === "revenue") return "income";
  return u;
}

function displayTypeColumn(a: Account): string {
  switch (a.accountClass) {
    case "income":
      return "Revenue";
    case "cost_of_sales":
      return "Expense (COS)";
    case "contra":
      return "Contra";
    default:
      return classLabels[a.accountClass];
  }
}

function defaultGroupForClass(c: AccountClass): AccountGroup {
  switch (c) {
    case "asset":
      return "current_asset";
    case "liability":
      return "current_liability";
    case "equity":
      return "equity";
    case "income":
      return "operating_revenue";
    case "expense":
      return "operating_expense";
    case "cost_of_sales":
      return "cost_of_goods_sold";
    case "contra":
      return "contra_asset";
  }
}

function defaultSubtypeForClass(c: AccountClass): string {
  switch (c) {
    case "asset":
      return "other";
    case "liability":
      return "other";
    case "equity":
      return "capital";
    case "income":
      return "operating";
    case "expense":
      return "operating";
    case "cost_of_sales":
      return "cogs";
    case "contra":
      return "contra_asset";
  }
}

function nextAccountId(list: Account[]): number {
  return list.reduce((m, a) => Math.max(m, a.id), 0) + 1;
}

function descendantCodes(root: string, list: Account[]): Set<string> {
  const s = new Set<string>();
  function walk(code: string) {
    for (const a of list) {
      if (a.parentCode === code) {
        s.add(a.code);
        walk(a.code);
      }
    }
  }
  walk(root);
  return s;
}

function forestForClass(accounts: Account[], cls: AccountClass): Account[] {
  const list = accounts.filter((a) => a.accountClass === cls).sort((x, y) => x.code.localeCompare(y.code, undefined, { numeric: true }));
  const byCode = new Map(list.map((a) => [a.code, a]));
  const childrenOf = (code: string) => list.filter((a) => a.parentCode === code);
  const roots = list.filter((a) => !a.parentCode || !byCode.has(a.parentCode));
  const out: Account[] = [];
  function walk(a: Account) {
    out.push(a);
    for (const c of childrenOf(a.code).sort((x, y) => x.code.localeCompare(y.code, undefined, { numeric: true }))) {
      walk(c);
    }
  }
  for (const r of roots) walk(r);
  return out;
}

function depthOf(account: Account, byCode: Map<string, Account>): number {
  let d = 0;
  let p: string | null | undefined = account.parentCode;
  while (p && byCode.has(p)) {
    d += 1;
    p = byCode.get(p)?.parentCode;
  }
  return d;
}

const COA_WIDTH_DEFS: RegisterColumnWidthDef[] = [
  { id: "code", defaultWidth: 96 },
  { id: "name", defaultWidth: 220 },
  { id: "type", defaultWidth: 120 },
  { id: "parent", defaultWidth: 110 },
  { id: "balance", defaultWidth: 110 },
  { id: "lines", defaultWidth: 72 },
  { id: "status", defaultWidth: 88 },
  { id: "actions", defaultWidth: 120 },
];

const COA_COL_ORDER = COA_WIDTH_DEFS.map((d) => d.id);

export function ChartOfAccountsRegister() {
  const [accounts, setAccounts] = useState<Account[]>(() => [...getActiveChartOfAccounts()]);
  const [coaReady, setCoaReady] = useState(false);
  const [query, setQuery] = useState("");
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [openClass, setOpenClass] = useState<Record<AccountClass, boolean>>(() =>
    Object.fromEntries(classOrder.map((c) => [c, true])) as Record<AccountClass, boolean>,
  );
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<Account> | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [subParent, setSubParent] = useState<Account | null>(null);
  const [uiType, setUiType] = useState<UiAccountType>("asset");

  const lineCountById = useMemo(() => previewJournalLineCountByAccountId(), []);
  const balanceById = useMemo(() => previewJournalBalanceByAccountId(), []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COA_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Account[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccounts(parsed);
        }
      }
    } catch {
      /* ignore */
    }
    setCoaReady(true);
  }, []);

  useEffect(() => {
    setWorkspaceChartOfAccountsSnapshot(accounts);
    if (!coaReady) return;
    try {
      localStorage.setItem(COA_STORAGE_KEY, JSON.stringify(accounts));
    } catch {
      /* quota / private mode */
    }
  }, [accounts, coaReady]);

  useEffect(() => {
    if (!saveBanner) return;
    const t = window.setTimeout(() => setSaveBanner(null), 2800);
    return () => window.clearTimeout(t);
  }, [saveBanner]);

  useEffect(() => {
    if (!editOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditOpen(false);
        setSubParent(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editOpen]);

  const byCode = useMemo(() => new Map(accounts.map((a) => [a.code, a])), [accounts]);

  const filteredAccounts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        (a.nameAr && a.nameAr.includes(q)) ||
        (a.parentCode && a.parentCode.toLowerCase().includes(q)),
    );
  }, [accounts, query]);

  const { wrapRef, colPercents, beginResizePair } = useRegisterTableLayout("v2.register.chart-of-accounts", COA_WIDTH_DEFS, COA_COL_ORDER);
  const pctById = useMemo(() => Object.fromEntries(colPercents.map((c) => [c.id, c.percent])), [colPercents]);

  const openNewRoot = useCallback(() => {
    const cls = classFromUiType(uiType);
    setSubParent(null);
    setEditingCode(null);
    const suggested = suggestNextRootCode(accounts, cls);
    setEditDraft({
      code: suggested,
      name: "",
      nameAr: "",
      accountClass: cls,
      group: defaultGroupForClass(cls),
      subtype: defaultSubtypeForClass(cls),
      normalBalance: normalBalanceForClass(cls),
      parentCode: null,
      isActive: true,
      isPostingAllowed: true,
      isSystem: false,
      cashFlowType: cls === "asset" ? "cash" : "operating",
      enablePayments: cls === "asset",
      showInExpenseClaims: false,
      isFolder: false,
      reportMapping: "gl",
      taxRelevant: false,
    });
    setEditOpen(true);
  }, [uiType, accounts]);

  const openEdit = useCallback((a: Account) => {
    setSubParent(null);
    setEditingCode(a.code);
    setEditDraft({ ...a });
    setUiType(uiTypeFromClass(a.accountClass));
    setEditOpen(true);
  }, []);

  const openAddSub = useCallback((parent: Account) => {
    const cls = parent.accountClass;
    setSubParent(parent);
    setEditingCode(null);
    setUiType(uiTypeFromClass(cls));
    const suggested = suggestNextChildCode(parent, accounts);
    setEditDraft({
      code: suggested,
      name: "",
      nameAr: "",
      accountClass: cls,
      group: parent.group,
      subtype: parent.subtype || defaultSubtypeForClass(cls),
      normalBalance: parent.normalBalance,
      parentCode: parent.code,
      isActive: true,
      isPostingAllowed: true,
      isSystem: false,
      cashFlowType: parent.cashFlowType,
      enablePayments: !!parent.enablePayments,
      showInExpenseClaims: !!parent.showInExpenseClaims,
      isFolder: false,
      reportMapping: parent.reportMapping ?? "gl",
      taxRelevant: !!parent.taxRelevant,
    });
    setEditOpen(true);
    setOpenClass((o) => ({ ...o, [cls]: true }));
  }, [accounts]);

  const resetDefaultCoa = useCallback(() => {
    if (
      !window.confirm(
        "Restore the default Chart of Accounts? Session edits will be replaced (Petty Cash 102 and all defaults). This does not change production server data.",
      )
    ) {
      return;
    }
    const fresh = cloneDefaultChartOfAccounts();
    setAccounts(fresh);
    setWorkspaceChartOfAccountsSnapshot(fresh);
    try {
      localStorage.setItem(COA_STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      /* ignore */
    }
    setEditOpen(false);
    setEditDraft(null);
    setSaveBanner("Default Chart of Accounts restored.");
  }, []);

  const applySave = useCallback(() => {
    if (!editDraft?.code?.trim() || !editDraft.name?.trim()) {
      window.alert("Account code and English name are required.");
      return;
    }
    const code = editDraft.code.trim();
    const cls = classFromUiType(uiType);
    const prior = editingCode ? accounts.find((a) => a.code === editingCode) : undefined;
    const journalLinesOnAccount = prior ? (lineCountById.get(prior.id) ?? 0) : 0;

    if (accounts.some((a) => a.code === code && (!editingCode || a.code !== editingCode))) {
      window.alert("Duplicate account code — choose another code.");
      return;
    }

    const pc = editDraft.parentCode?.trim() || null;
    if (pc) {
      const par = accounts.find((a) => a.code === pc);
      if (!par) {
        window.alert("Parent account not found.");
        return;
      }
      if (par.accountClass !== cls) {
        window.alert("Invalid parent: account class must match the parent account.");
        return;
      }
    }

    if (editingCode && prior && journalLinesOnAccount > 0 && code !== editingCode) {
      window.alert("This account has journal entries — the account code cannot be changed.");
      return;
    }

    setAccounts((prev) => {
      const priorRow = editingCode ? prev.find((a) => a.code === editingCode) : undefined;

      const next: Account = {
        id: priorRow?.id ?? nextAccountId(prev),
        code,
        legacyCode: editDraft.legacyCode ?? priorRow?.legacyCode ?? null,
        name: editDraft.name!.trim(),
        nameAr: editDraft.nameAr?.trim() || null,
        accountClass: cls,
        group: editDraft.group ?? defaultGroupForClass(cls),
        subtype: editDraft.subtype ?? defaultSubtypeForClass(cls),
        normalBalance: editDraft.normalBalance ?? normalBalanceForClass(cls),
        parentCode: pc,
        isActive: editDraft.isActive !== false,
        isPostingAllowed: editDraft.isFolder ? false : editDraft.isPostingAllowed !== false,
        isSystem: priorRow?.isSystem === true,
        cashFlowType: (editDraft.cashFlowType as CashFlowType) ?? "operating",
        enablePayments: !!editDraft.enablePayments,
        showInExpenseClaims: !!editDraft.showInExpenseClaims,
        isFolder: !!editDraft.isFolder,
        reportMapping: editDraft.reportMapping ?? "gl",
        taxRelevant: !!editDraft.taxRelevant,
      };

      let merged = editingCode ? prev.filter((a) => a.code !== editingCode) : [...prev];
      merged = merged.filter((a) => a.code !== code);
      if (next.parentCode) {
        merged = merged.map((a) => (a.code === next.parentCode ? { ...a, isFolder: true, isPostingAllowed: false } : a));
      }
      merged.push(next);
      return merged;
    });
    setEditOpen(false);
    setSubParent(null);
    setSaveBanner(subParent ? "Subaccount saved." : editingCode ? "Account updated." : "Account added.");
  }, [accounts, editDraft, editingCode, lineCountById, subParent, uiType]);

  const deleteBlockReason = useCallback(
    (a: Account): string | null => {
      if (a.isSystem) return "This is a protected system account.";
      const lines = lineCountById.get(a.id) ?? 0;
      if (lines > 0) return "This account has journal entries and cannot be deleted.";
      if (accounts.some((x) => x.parentCode === a.code)) return "Move or delete subaccounts before deleting this parent account.";
      return null;
    },
    [accounts, lineCountById],
  );

  const tryDelete = useCallback(
    (a: Account) => {
      const block = deleteBlockReason(a);
      if (block) {
        window.alert(block);
        return;
      }
      if (!window.confirm(`Delete account ${a.code} — ${a.name}? You can restore defaults with “Restore default COA” if needed.`)) return;
      setAccounts((prev) => prev.filter((x) => x.code !== a.code));
      setSaveBanner("Account removed from session COA.");
    },
    [deleteBlockReason],
  );

  const parentOptions = useMemo(() => {
    const dc = editDraft?.code?.trim();
    if (!dc) return accounts;
    const ban = descendantCodes(dc, accounts);
    ban.add(dc);
    return accounts.filter((a) => !ban.has(a.code));
  }, [accounts, editDraft?.code]);

  const codeFieldLocked = useMemo(() => {
    if (!editingCode) return false;
    const ac = accounts.find((a) => a.code === editingCode);
    if (!ac) return false;
    if (ac.isSystem) return true;
    return (lineCountById.get(ac.id) ?? 0) > 0;
  }, [accounts, editingCode, lineCountById]);

  return (
    <div className="space-y-3" data-inspector-real-register="chart-of-accounts">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Accounting</p>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Chart of Accounts</h1>
          <p className="mt-0.5 text-sm text-muted [overflow-wrap:anywhere]">
            Hierarchical COA with resizable columns. Session edits update the in-memory chart used by journal entry lines (preview).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-muted">
            <span>Type for new account</span>
            <select
              value={uiType}
              onChange={(e) => setUiType(e.target.value as UiAccountType)}
              className="rounded-lg border border-line bg-white px-2 py-1 text-xs"
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <button type="button" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white" onClick={openNewRoot}>
            <Plus className="mr-1 inline h-3.5 w-3.5" />
            Add account
          </button>
          <button
            type="button"
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950"
            onClick={resetDefaultCoa}
            title="Restore factory default accounts (includes Petty Cash 102)"
          >
            <RotateCcw className="mr-1 inline h-3.5 w-3.5" />
            Restore default COA
          </button>
        </div>
      </div>

      {saveBanner ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{saveBanner}</div>
      ) : null}

      <WorkspaceModeNotice
        title="COA (preview session)"
        detail="Edits persist in this browser (localStorage) and sync to journal validation. Use “Restore default COA” to recover defaults if accounts were removed. Delete requires confirmation and is blocked for system accounts and accounts used on journal lines."
      />

      <Card className="rounded-xl bg-white/95 p-3">
        <Input label="Search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Code, name, parent…" />
      </Card>

      <Card className="rounded-xl bg-white/95 p-0 overflow-hidden">
        <div ref={wrapRef} className="wsv2-table-scroll" data-register-table="true">
          <table className="wsv2-table w-full min-w-0 table-fixed">
            <colgroup>
              {COA_COL_ORDER.map((id) => (
                <col key={id} style={{ width: `${pctById[id] ?? 100 / COA_COL_ORDER.length}%` }} />
              ))}
            </colgroup>
            <thead className="border-b border-line bg-surface-soft/70 text-left text-xs text-muted">
              <tr>
                {COA_COL_ORDER.map((colId, idx) => (
                  <RegisterTableHeaderCell
                    key={colId}
                    align={colId === "balance" || colId === "lines" ? "right" : colId === "actions" ? "right" : "left"}
                    className={colId === "balance" || colId === "lines" ? "num" : ""}
                    onResizePointerDown={idx < COA_COL_ORDER.length - 1 ? (x) => beginResizePair(idx, x) : undefined}
                  >
                    {{
                      code: "Code",
                      name: "Account name",
                      type: "Type",
                      parent: "Parent",
                      balance: "Balance",
                      lines: "Jrnl lines",
                      status: "Status",
                      actions: "Actions",
                    }[colId]}
                  </RegisterTableHeaderCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {classOrder.map((cls) => {
                const forest = forestForClass(filteredAccounts, cls);
                if (forest.length === 0) return null;
                const open = openClass[cls] ?? true;
                return (
                  <Fragment key={cls}>
                    <tr className="bg-surface-soft/80 border-t border-line">
                      <td colSpan={COA_COL_ORDER.length} className="px-2 py-2">
                        <button
                          type="button"
                          className="flex w-full items-center gap-1 text-left text-xs font-bold text-ink"
                          onClick={() => setOpenClass((o) => ({ ...o, [cls]: !open }))}
                        >
                          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          {classLabels[cls]} ({forest.length})
                        </button>
                      </td>
                    </tr>
                    {open
                      ? forest.map((account) => {
                          const depth = depthOf(account, byCode);
                          const parentLabel = account.parentCode ? (byCode.get(account.parentCode)?.name ?? account.parentCode) : "—";
                          const bal = balanceById.get(account.id) ?? 0;
                          const lines = lineCountById.get(account.id) ?? 0;
                          const blockReason = deleteBlockReason(account);
                          return (
                            <tr key={account.code} className={["border-t border-line/60", !account.isActive ? "opacity-60" : ""].join(" ")}>
                              <td className="px-2 py-2 font-mono text-xs font-semibold text-ink">
                                <span style={{ paddingLeft: depth * 12 }} className="inline-block [overflow-wrap:anywhere]">
                                  {account.code}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-sm font-medium text-ink [overflow-wrap:anywhere]">
                                <div>{account.name}</div>
                                {account.nameAr ? <div className="text-xs text-muted" dir="rtl">{account.nameAr}</div> : null}
                              </td>
                              <td className="px-2 py-2 text-xs text-muted [overflow-wrap:anywhere]">{displayTypeColumn(account)}</td>
                              <td className="px-2 py-2 text-xs [overflow-wrap:anywhere]">{parentLabel}</td>
                              <td className="num px-2 py-2 text-xs tabular-nums">{formatCurrency(bal)}</td>
                              <td className="num px-2 py-2 text-xs tabular-nums">{lines}</td>
                              <td className="px-2 py-2 text-xs">
                                {account.isActive ? <span className="text-emerald-700">Active</span> : <span className="text-muted">Inactive</span>}
                              </td>
                              <td className="px-2 py-2 text-right text-xs">
                                <div className="flex flex-wrap justify-end gap-1">
                                  {account.isSystem ? <Lock className="inline h-3.5 w-3.5 text-muted" aria-label="System" /> : null}
                                  <button
                                    type="button"
                                    className="rounded border border-line bg-white px-1.5 py-0.5 font-semibold"
                                    onClick={() => openEdit(account)}
                                    title="Edit"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded border border-line bg-white px-1.5 py-0.5 font-semibold"
                                    onClick={() => openAddSub(account)}
                                    title="Add subaccount"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!!blockReason}
                                    className="rounded border border-line bg-white px-1.5 py-0.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                                    title={blockReason ?? "Delete account"}
                                    onClick={() => tryDelete(account)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {editOpen && editDraft ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/35"
            aria-label="Close panel"
            onClick={() => {
              setEditOpen(false);
              setSubParent(null);
            }}
          />
          <div
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coa-panel-title"
          >
            <div className="flex-shrink-0 border-b border-line px-4 py-3">
              <p id="coa-panel-title" className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                {subParent ? "Add subaccount" : editingCode ? "Edit account" : "Add account"}
              </p>
              {subParent ? (
                <p className="mt-1 text-sm text-muted">
                  Parent:{" "}
                  <span className="font-mono font-semibold text-ink">
                    {subParent.code}
                  </span>{" "}
                  — {subParent.name}
                </p>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <div className="grid gap-3">
                <Input
                  label="Account code"
                  value={editDraft.code ?? ""}
                  onChange={(e) => setEditDraft((d) => (d ? { ...d, code: e.target.value } : d))}
                  disabled={!!editingCode && codeFieldLocked}
                />
                {!!editingCode && codeFieldLocked ? (
                  <p className="text-xs text-muted">
                    Code is locked for system accounts or accounts that already have journal lines.
                  </p>
                ) : null}
                <Input label="English name" value={editDraft.name ?? ""} onChange={(e) => setEditDraft((d) => (d ? { ...d, name: e.target.value } : d))} />
                <Input label="Arabic name" value={editDraft.nameAr ?? ""} onChange={(e) => setEditDraft((d) => (d ? { ...d, nameAr: e.target.value } : d))} dir="rtl" />
                <div>
                  <label className="text-xs font-semibold text-muted">Account type</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-line px-2 py-2 text-sm"
                    value={uiType}
                    disabled={!!subParent || !!editingCode}
                    onChange={(e) => {
                      const u = e.target.value as UiAccountType;
                      setUiType(u);
                      const c = classFromUiType(u);
                      setEditDraft((d) =>
                        d
                          ? {
                              ...d,
                              accountClass: c,
                              group: defaultGroupForClass(c),
                              subtype: defaultSubtypeForClass(c),
                              normalBalance: normalBalanceForClass(c),
                            }
                          : d,
                      );
                    }}
                  >
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted">Parent account</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-line px-2 py-2 text-sm"
                    value={editDraft.parentCode ?? ""}
                    disabled={!!subParent}
                    onChange={(e) => setEditDraft((d) => (d ? { ...d, parentCode: e.target.value || null } : d))}
                  >
                    <option value="">— None —</option>
                    {parentOptions.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted">Cash flow type</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-line px-2 py-2 text-sm"
                    value={(editDraft.cashFlowType as CashFlowType) ?? "operating"}
                    onChange={(e) =>
                      setEditDraft((d) => (d ? { ...d, cashFlowType: e.target.value as CashFlowType } : d))
                    }
                  >
                    <option value="operating">Operating</option>
                    <option value="investing">Investing</option>
                    <option value="financing">Financing</option>
                    <option value="cash">Cash</option>
                    <option value="non_cash">Non-cash</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!editDraft.isFolder}
                    onChange={(e) =>
                      setEditDraft((d) =>
                        d
                          ? { ...d, isFolder: e.target.checked, isPostingAllowed: e.target.checked ? false : d.isPostingAllowed }
                          : d,
                      )
                    }
                  />
                  Header / folder (not postable)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editDraft.isPostingAllowed !== false && !editDraft.isFolder}
                    disabled={!!editDraft.isFolder || accounts.some((x) => x.parentCode === (editDraft.code ?? ""))}
                    onChange={(e) => setEditDraft((d) => (d ? { ...d, isPostingAllowed: e.target.checked } : d))}
                  />
                  Allow posting to this account
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!editDraft.enablePayments}
                    onChange={(e) => setEditDraft((d) => (d ? { ...d, enablePayments: e.target.checked } : d))}
                  />
                  Enable account selection for payments
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!editDraft.showInExpenseClaims}
                    onChange={(e) => setEditDraft((d) => (d ? { ...d, showInExpenseClaims: e.target.checked } : d))}
                  />
                  Show account for employee expense claims
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!editDraft.taxRelevant}
                    onChange={(e) => setEditDraft((d) => (d ? { ...d, taxRelevant: e.target.checked } : d))}
                  />
                  Tax / VAT relevant
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editDraft.isActive !== false}
                    onChange={(e) => setEditDraft((d) => (d ? { ...d, isActive: e.target.checked } : d))}
                  />
                  Active
                </label>
                <div className="rounded-lg border border-line bg-surface-soft/60 p-3 text-xs">
                  <p className="font-semibold text-ink">Reporting links</p>
                  <ul className="mt-2 space-y-1">
                    <li>
                      <Link href="/workspace/user/reports/general-ledger" className="text-primary underline">
                        General Ledger
                      </Link>
                    </li>
                    <li>
                      <Link href="/workspace/user/journal-entries" className="text-primary underline">
                        Journal entries
                      </Link>
                    </li>
                    <li>
                      <Link href="/workspace/user/reports/trial-balance" className="text-primary underline">
                        Trial Balance
                      </Link>
                    </li>
                    <li>
                      <Link href="/workspace/user/reports/profit-loss" className="text-primary underline">
                        Profit & Loss
                      </Link>
                    </li>
                    <li>
                      <Link href="/workspace/user/reports/balance-sheet" className="text-primary underline">
                        Balance Sheet
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex flex-shrink-0 flex-wrap gap-2 border-t border-line px-4 py-3">
              <button type="button" className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white" onClick={applySave}>
                Save
              </button>
              <button
                type="button"
                className="rounded-lg border border-line px-3 py-2 text-sm font-semibold"
                onClick={() => {
                  setEditOpen(false);
                  setSubParent(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
