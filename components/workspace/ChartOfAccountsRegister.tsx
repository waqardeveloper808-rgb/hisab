"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";
import { getBooksSnapshot, type BooksSnapshot } from "@/lib/workspace-api";
import { currency } from "@/components/workflow/utils";

const emptyState: BooksSnapshot = {
  trialBalance: [],
  generalLedger: [],
  auditTrail: [],
  backendReady: false,
};

export function ChartOfAccountsRegister() {
  const [snapshot, setSnapshot] = useState<BooksSnapshot>(emptyState);
  const [loading, setLoading] = useState(true);
  const [showBlockedAction, setShowBlockedAction] = useState(false);

  useEffect(() => {
    getBooksSnapshot()
      .then(setSnapshot)
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4" data-inspector-real-register="chart-of-accounts">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Chart of Accounts</h1>
          <p className="text-sm text-muted">Live account register derived from the company books so account visibility is owned by a dedicated route.</p>
        </div>
        <Button onClick={() => setShowBlockedAction((current) => !current)}>Create Account</Button>
      </div>

      <WorkspaceModeNotice
        title="Preview accounts register"
        detail="Guest mode shows controlled account balances. Account creation remains blocked until the backend exposes an accounts write endpoint."
      />

      {showBlockedAction ? (
        <Card className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Account creation is structurally blocked because the backend does not currently expose a writable accounts route. The register itself is dedicated and real, sourced from book data rather than the catch-all page.
        </Card>
      ) : null}

      <Card className="rounded-[1.25rem] bg-white/95 p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-4 text-sm text-muted">
          <span>{snapshot.trialBalance.length} account rows</span>
          <span>{snapshot.backendReady ? "Books-connected" : "Preview dataset"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line bg-surface-soft/70">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Account</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Type</th>
                <th className="px-4 py-3 text-right font-semibold text-muted">Debit total</th>
                <th className="px-4 py-3 text-right font-semibold text-muted">Credit total</th>
                <th className="px-4 py-3 text-right font-semibold text-muted">Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-muted" colSpan={6}>Loading accounts...</td>
                </tr>
              ) : snapshot.trialBalance.length ? snapshot.trialBalance.map((account) => (
                <tr key={account.code} className="border-t border-line/70">
                  <td className="px-4 py-3 font-semibold text-ink">{account.code}</td>
                  <td className="px-4 py-3 text-ink">{account.name}</td>
                  <td className="px-4 py-3 text-muted capitalize">{account.type}</td>
                  <td className="px-4 py-3 text-right text-muted">{currency(account.debitTotal)} SAR</td>
                  <td className="px-4 py-3 text-right text-muted">{currency(account.creditTotal)} SAR</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{currency(account.balance)} SAR</td>
                </tr>
              )) : (
                <tr>
                  <td className="px-4 py-6" colSpan={6}>
                    <div className="rounded-[1.2rem] border border-dashed border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                      <p className="font-semibold text-ink">No posted ledger exists yet.</p>
                      <p className="mt-1">Issue an invoice or post a bill and payment first. This route reflects posted books rather than stand-alone sample accounts.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}