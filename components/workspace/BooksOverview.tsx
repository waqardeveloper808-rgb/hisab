"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { getBooksSnapshot, type BooksSnapshot } from "@/lib/workspace-api";
import { currency } from "@/components/workflow/utils";

const emptyState: BooksSnapshot = {
  trialBalance: [],
  generalLedger: [],
  auditTrail: [],
  backendReady: false,
};

export function BooksOverview() {
  const [snapshot, setSnapshot] = useState<BooksSnapshot>(emptyState);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getBooksSnapshot().then(setSnapshot);
  }, []);

  const filteredLedger = useMemo(
    () => snapshot.generalLedger.filter((row) => `${row.entryNumber} ${row.accountCode} ${row.accountName} ${row.description} ${row.documentNumber} ${row.costCenterCode} ${row.costCenterName}`.toLowerCase().includes(query.toLowerCase())),
    [snapshot.generalLedger, query],
  );
  const debitTotal = snapshot.trialBalance.reduce((sum, row) => sum + row.debitTotal, 0);
  const creditTotal = snapshot.trialBalance.reduce((sum, row) => sum + row.creditTotal, 0);

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Books</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Book review stays disciplined when ledger lines, balances, and audit history stay together.</h1>
        <p className="mt-4 text-base leading-7 text-muted">This page is for review only. Entry stays in sales, purchases, and banking so the books reflect posted work instead of manual drift.</p>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        {[
          ["Trial balance rows", String(snapshot.trialBalance.length), "Active account balances in the current books"],
          ["Total debits", `${currency(debitTotal)} SAR`, "Sum of posted debit movement"],
          ["Total credits", `${currency(creditTotal)} SAR`, "Sum of posted credit movement"],
        ].map(([title, value, caption]) => (
          <Card key={title} className="rounded-[1.8rem] bg-white/92 p-5">
            <p className="text-sm font-semibold text-muted">{title}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{caption}</p>
          </Card>
        ))}
      </div>

      <Card className="rounded-[1.8rem] bg-white/92 p-5">
        <div className="max-w-sm">
          <Input label="Search ledger" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by entry, account, document, or description" />
        </div>
      </Card>

      <WorkspaceDataTable
        title="General ledger"
        caption="Posted journal lines in date order with running balance."
        rows={filteredLedger}
        emptyMessage="Posted journal lines will appear here as soon as invoices, vendor bills, or payments are finalized."
        columns={[
          { header: "Entry", render: (row) => row.entryNumber },
          { header: "Date", render: (row) => row.entryDate },
          { header: "Account", render: (row) => `${row.accountCode} ${row.accountName}` },
          { header: "Cost center", render: (row) => row.costCenterCode ? `${row.costCenterCode} ${row.costCenterName}` : "-" },
          { header: "Description", render: (row) => row.description || row.documentNumber || "-" },
          { header: "Debit", align: "right", render: (row) => `${currency(row.debit)} SAR` },
          { header: "Credit", align: "right", render: (row) => `${currency(row.credit)} SAR` },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <WorkspaceDataTable
          title="Trial balance"
          caption="Account balances behind the current books."
          rows={snapshot.trialBalance}
          emptyMessage="Trial balance rows will appear here after the first posted transaction."
          columns={[
            { header: "Code", render: (row) => row.code },
            { header: "Account", render: (row) => row.name },
            { header: "Type", render: (row) => row.type },
            { header: "Balance", align: "right", render: (row) => `${currency(row.balance)} SAR` },
          ]}
        />

        <WorkspaceDataTable
          title="Audit trail"
          caption="Recent finance events captured against company activity."
          rows={snapshot.auditTrail.slice(0, 20)}
          emptyMessage="Audit events will appear here once company activity is posted or changed."
          columns={[
            { header: "Event", render: (row) => row.event.replaceAll(".", " ") },
            { header: "Record", render: (row) => `${row.auditableType.split("\\").pop()} #${row.auditableId}` },
            { header: "When", render: (row) => row.createdAt },
          ]}
        />
      </div>
    </div>
  );
}