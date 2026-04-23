"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { defaultChartOfAccounts, searchAccounts, type Account, type AccountClass } from "@/lib/accounting-engine";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";

const classLabels: Record<AccountClass, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  income: "Income / Revenue",
  expense: "Expense",
  cost_of_sales: "Cost of Sales",
  contra: "Contra",
};

const classBadge: Record<AccountClass, string> = {
  asset: "bg-blue-50 text-blue-700 border-blue-200",
  liability: "bg-orange-50 text-orange-700 border-orange-200",
  equity: "bg-purple-50 text-purple-700 border-purple-200",
  income: "bg-emerald-50 text-emerald-700 border-emerald-200",
  expense: "bg-red-50 text-red-700 border-red-200",
  cost_of_sales: "bg-amber-50 text-amber-700 border-amber-200",
  contra: "bg-gray-50 text-gray-600 border-gray-200",
};

type ClassFilter = "all" | AccountClass;

export function ChartOfAccountsRegister() {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<ClassFilter>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const accounts = useMemo(() => {
    let list = query ? searchAccounts(query) : defaultChartOfAccounts.filter((a) => a.isActive || showInactive);
    if (classFilter !== "all") list = list.filter((a) => a.accountClass === classFilter);
    if (!showInactive) list = list.filter((a) => a.isActive);
    return list;
  }, [query, classFilter, showInactive]);

  const classCounts = useMemo(() => {
    const counts: Partial<Record<AccountClass, number>> = {};
    for (const a of defaultChartOfAccounts) {
      if (!a.isActive && !showInactive) continue;
      counts[a.accountClass] = (counts[a.accountClass] ?? 0) + 1;
    }
    return counts;
  }, [showInactive]);

  return (
    <div className="space-y-3" data-inspector-real-register="chart-of-accounts">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Accounting</p>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Chart of Accounts</h1>
          <p className="mt-0.5 text-sm text-muted">{defaultChartOfAccounts.length} accounts · search by code, name, or classification</p>
        </div>
      </div>

      <WorkspaceModeNotice
        title="Preview chart of accounts"
        detail="Showing the default company chart. Account creation and editing will be available when the backend exposes a writable accounts endpoint."
      />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {(Object.keys(classLabels) as AccountClass[]).map((cls) => (
          <button
            key={cls}
            type="button"
            onClick={() => setClassFilter(classFilter === cls ? "all" : cls)}
            className={["rounded-lg border px-3 py-2 text-left text-xs transition", classFilter === cls ? `${classBadge[cls]} ring-1 ring-current` : "border-line bg-white hover:bg-surface-soft"].join(" ")}
          >
            <span className="font-semibold">{classLabels[cls]}</span>
            <span className="mt-0.5 block text-[10px] text-muted">{classCounts[cls] ?? 0} accounts</span>
          </button>
        ))}
      </div>

      <Card className="rounded-xl bg-white/95 p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[16rem] flex-1">
            <Input label="Search accounts" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Code, name, Arabic name, class, group..." />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={showInactive} onChange={() => setShowInactive(!showInactive)} className="rounded border-line" />
            Show inactive
          </label>
          {classFilter !== "all" ? (
            <button type="button" onClick={() => setClassFilter("all")} className="rounded-full border border-line bg-surface-soft px-2.5 py-1 text-xs font-semibold text-muted hover:bg-white">
              Clear filter: {classLabels[classFilter]} ×
            </button>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-3 xl:grid-cols-[1fr_22rem]">
        <Card className="rounded-xl bg-white/95 p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-xs text-muted">
            <span>{accounts.length} accounts shown</span>
            <span className="font-semibold">{classFilter === "all" ? "All classes" : classLabels[classFilter]}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-line bg-surface-soft/70 text-xs">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted">Code</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted">Account Name</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted">Arabic Name</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted">Class</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted">Group</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-muted">Normal</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-muted">Posting</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-muted">System</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-muted">No accounts match your search.</td></tr>
                ) : accounts.map((account) => (
                  <tr key={account.code} onClick={() => setSelectedAccount(account)} className={["border-t border-line/60 cursor-pointer transition", selectedAccount?.code === account.code ? "bg-primary-soft/40" : "hover:bg-surface-soft/50", !account.isActive ? "opacity-50" : ""].join(" ")}>
                    <td className="px-3 py-2.5 font-mono text-xs font-bold text-ink">{account.code}</td>
                    <td className="px-3 py-2.5 font-semibold text-ink">{account.name}</td>
                    <td className="px-3 py-2.5 text-muted" dir="rtl">{account.nameAr || "\u2014"}</td>
                    <td className="px-3 py-2.5"><span className={["inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold", classBadge[account.accountClass]].join(" ")}>{classLabels[account.accountClass]}</span></td>
                    <td className="px-3 py-2.5 text-xs text-muted capitalize">{account.group.replaceAll("_", " ")}</td>
                    <td className="px-3 py-2.5 text-center text-xs font-semibold uppercase text-muted">{account.normalBalance === "debit" ? "Dr" : "Cr"}</td>
                    <td className="px-3 py-2.5 text-center">{account.isPostingAllowed ? <span className="text-emerald-600">{"\u2713"}</span> : <span className="text-muted">{"\u2014"}</span>}</td>
                    <td className="px-3 py-2.5 text-center">{account.isSystem ? <span className="text-xs text-primary font-semibold">SYS</span> : <span className="text-muted">{"\u2014"}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="rounded-xl bg-white/95 p-4 xl:sticky xl:top-4 xl:h-fit">
          {selectedAccount ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Account Detail</p>
                <h2 className="mt-1 text-lg font-bold text-ink">{selectedAccount.code} — {selectedAccount.name}</h2>
                {selectedAccount.nameAr ? <p className="mt-0.5 text-sm text-muted" dir="rtl">{selectedAccount.nameAr}</p> : null}
              </div>
              <div className="space-y-2 text-sm">
                <DetailRow label="Class" value={classLabels[selectedAccount.accountClass]} />
                <DetailRow label="Group" value={selectedAccount.group.replaceAll("_", " ")} />
                <DetailRow label="Subtype" value={selectedAccount.subtype.replaceAll("_", " ")} />
                <DetailRow label="Normal Balance" value={selectedAccount.normalBalance === "debit" ? "Debit (Dr)" : "Credit (Cr)"} />
                <DetailRow label="Posting Allowed" value={selectedAccount.isPostingAllowed ? "Yes" : "No (header only)"} />
                <DetailRow label="System Account" value={selectedAccount.isSystem ? "Yes" : "No"} />
                <DetailRow label="Status" value={selectedAccount.isActive ? "Active" : "Inactive"} />
                {selectedAccount.parentCode ? <DetailRow label="Parent" value={selectedAccount.parentCode} /> : null}
                {selectedAccount.description ? <DetailRow label="Notes" value={selectedAccount.description} /> : null}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted">
              <p className="font-semibold text-ink">Select an account</p>
              <p className="mt-1">Click any row to view full account details, classification, and posting rules.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border border-line/60 bg-surface-soft/40 px-3 py-2">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <span className="text-right text-xs font-semibold capitalize text-ink">{value}</span>
    </div>
  );
}