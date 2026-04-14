"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";
import { getBooksSnapshot, type BooksSnapshot } from "@/lib/workspace-api";
import { currency } from "@/components/workflow/utils";

const emptyBooks: BooksSnapshot = {
  trialBalance: [],
  generalLedger: [],
  auditTrail: [],
  backendReady: false,
};

export function JournalEntriesRegister() {
  const [snapshot, setSnapshot] = useState<BooksSnapshot>(emptyBooks);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBooksSnapshot()
      .then(setSnapshot)
      .finally(() => setLoading(false));
  }, []);

  const entries = useMemo(() => {
    const groups = new Map<string, {
      entryNumber: string;
      entryDate: string;
      lines: number;
      sourceDocument: string;
      debit: number;
      credit: number;
      accounts: string[];
    }>();

    snapshot.generalLedger.forEach((row) => {
      const current = groups.get(row.entryNumber) ?? {
        entryNumber: row.entryNumber,
        entryDate: row.entryDate,
        lines: 0,
        sourceDocument: row.documentNumber || "Manual source unavailable",
        debit: 0,
        credit: 0,
        accounts: [],
      };

      current.lines += 1;
      current.debit += row.debit;
      current.credit += row.credit;
      current.accounts.push(`${row.accountCode} ${row.accountName}`);
      groups.set(row.entryNumber, current);
    });

    return [...groups.values()].sort((left, right) => right.entryDate.localeCompare(left.entryDate));
  }, [snapshot.generalLedger]);

  return (
    <div className="space-y-4" data-inspector-real-register="journal-entries">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Journal Entries</h1>
          <p className="text-sm text-muted">Posted journal groups derived from sales, purchases, VAT, and payment activity.</p>
        </div>
        <Button onClick={() => {}}>New Journal Entry</Button>
      </div>

      <WorkspaceModeNotice
        title="Preview journal register"
        detail="Manual journal posting is blocked until a real journal-entry write endpoint exists. Posted source entries still remain fully inspectable."
      />

      <Card className="rounded-[1.1rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Manual journal creation is not wired yet. This route shows posted source entries honestly so accounting review does not depend on placeholder screens.
      </Card>

      <Card className="rounded-[1.25rem] bg-white/95 p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line bg-surface-soft/70">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted">Entry</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Source</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Accounts</th>
                <th className="px-4 py-3 text-right font-semibold text-muted">Debit</th>
                <th className="px-4 py-3 text-right font-semibold text-muted">Credit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td className="px-4 py-4 text-muted" colSpan={6}>Loading journal entries...</td></tr> : entries.map((entry) => (
                <tr key={entry.entryNumber} className="border-t border-line/70">
                  <td className="px-4 py-3 font-semibold text-ink">{entry.entryNumber}</td>
                  <td className="px-4 py-3 text-muted">{entry.entryDate}</td>
                  <td className="px-4 py-3 text-muted">{entry.sourceDocument}</td>
                  <td className="px-4 py-3 text-muted">{[...new Set(entry.accounts)].slice(0, 3).join(" · ")}</td>
                  <td className="px-4 py-3 text-right text-muted">{currency(entry.debit)} SAR</td>
                  <td className="px-4 py-3 text-right text-muted">{currency(entry.credit)} SAR</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}