"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { listBankAccounts, type BankAccountRecord } from "@/lib/workspace-api";
import { mapWorkspaceHref } from "@/lib/workspace-path";

type Notice = {
  tone: "error" | "success";
  text: string;
};

function formatBalance(value: number) {
  return `${value.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
}

export function BankAccountsRegister() {
  const { basePath } = useWorkspacePath();
  const [accounts, setAccounts] = useState<BankAccountRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadAccounts() {
      try {
        setIsLoading(true);
        const result = await listBankAccounts();
        if (!isActive) {
          return;
        }

        setAccounts(result);
        setSelectedId((current) => current ?? result[0]?.id ?? null);
        setNotice(null);
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
          setIsLoading(false);
        }
      }
    }

    void loadAccounts();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredAccounts = useMemo(() => {
    if (!search.trim()) {
      return accounts;
    }

    const query = search.trim().toLowerCase();
    return accounts.filter((account) => `${account.code} ${account.name}`.toLowerCase().includes(query));
  }, [accounts, search]);

  const selectedAccount = accounts.find((account) => account.id === selectedId) ?? null;
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const positiveAccounts = accounts.filter((account) => account.balance >= 0).length;
  const reconciliationHref = selectedAccount
    ? mapWorkspaceHref(`/workspace/user/reconciliation?account=${selectedAccount.id}`, basePath)
    : undefined;
  const importHref = selectedAccount
    ? mapWorkspaceHref(`/workspace/user/reconciliation?account=${selectedAccount.id}&import=1`, basePath)
    : undefined;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Banking</p>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Bank Accounts</h1>
          <p className="text-xs text-muted">Live bank ledgers drive reconciliation. This route no longer uses sample accounts.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-surface-soft px-2.5 py-0.5 text-[11px] font-semibold text-muted">{accounts.length} accounts</span>
          <Button href={importHref} size="sm" disabled={!importHref}>Import Statement</Button>
          <Button href={reconciliationHref} size="sm" variant="secondary" disabled={!reconciliationHref}>Open Reconciliation</Button>
        </div>
      </div>

      {notice ? (
        <Card className={notice.tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"}>
          <p className="text-xs font-medium">{notice.text}</p>
        </Card>
      ) : null}

      <div className="grid gap-2 md:grid-cols-3">
        <Card className="rounded-lg bg-white/95 p-2.5">
          <p className="text-[10px] font-semibold text-muted">Combined Bank Balance</p>
          <p className="text-sm font-bold text-ink">{formatBalance(totalBalance)}</p>
        </Card>
        <Card className="rounded-lg bg-white/95 p-2.5">
          <p className="text-[10px] font-semibold text-muted">Accounts In Debit Position</p>
          <p className="text-sm font-bold text-ink">{positiveAccounts}</p>
        </Card>
        <Card className="rounded-lg bg-white/95 p-2.5">
          <p className="text-[10px] font-semibold text-muted">Selected Account</p>
          <p className="text-sm font-bold text-ink">{selectedAccount ? selectedAccount.code : "No account selected"}</p>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <input
          className="w-full max-w-sm rounded-md border border-line bg-white px-2.5 py-1 text-xs text-ink placeholder:text-muted focus:border-primary focus:outline-none"
          placeholder="Search bank accounts by code or name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2 lg:flex-row">
        <div className="flex-1 overflow-hidden rounded-md border border-line bg-white">
          <div className="grid grid-cols-[110px_1fr_120px_120px] gap-1.5 border-b border-line bg-surface-soft/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
            <span>Code</span>
            <span>Account</span>
            <span>Normal Side</span>
            <span className="text-right">Balance</span>
          </div>
          {isLoading ? <p className="px-3 py-6 text-center text-xs text-muted">Loading bank accounts…</p> : null}
          {!isLoading && filteredAccounts.length === 0 ? <p className="px-3 py-6 text-center text-xs text-muted">No bank accounts matched your search.</p> : null}
          {!isLoading && filteredAccounts.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => setSelectedId(account.id)}
              className={[
                "grid w-full grid-cols-[110px_1fr_120px_120px] gap-1.5 border-b border-line px-3 py-2 text-left text-xs text-ink transition hover:bg-surface-soft/40",
                selectedId === account.id ? "bg-primary-soft/15" : "bg-white",
              ].join(" ")}
            >
              <span className="font-mono text-[11px] text-muted">{account.code}</span>
              <span className="font-medium">{account.name}</span>
              <span className="capitalize text-muted">{account.normalBalance ?? "—"}</span>
              <span className={`text-right font-mono ${account.balance < 0 ? "text-red-600" : "text-ink"}`}>{formatBalance(account.balance)}</span>
            </button>
          ))}
        </div>

        <div className="w-full shrink-0 rounded-md border border-line bg-white p-3 lg:w-80">
          {selectedAccount ? (
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Selected bank ledger</p>
                <h2 className="text-sm font-semibold text-ink">{selectedAccount.name}</h2>
                <p className="font-mono text-[11px] text-muted">{selectedAccount.code}</p>
              </div>
              <div className="space-y-1 text-xs text-ink">
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Balance</span>
                  <span className="font-mono font-semibold">{formatBalance(selectedAccount.balance)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Normal balance</span>
                  <span className="capitalize">{selectedAccount.normalBalance ?? "—"}</span>
                </div>
                <div className="rounded-md bg-surface-soft/50 p-2 text-[11px] text-muted">
                  Import statements and matching now continue in the reconciliation module using the selected account context.
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button href={reconciliationHref} size="sm">Reconcile Account</Button>
                <Button href={importHref} size="sm" variant="secondary">Import Statement</Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted">Select a bank account to continue into reconciliation.</p>
          )}
        </div>
      </div>
    </div>
  );
}
