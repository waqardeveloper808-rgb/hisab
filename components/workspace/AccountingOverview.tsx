"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { currency } from "@/components/workflow/utils";
import { mapWorkspaceHref } from "@/lib/workspace-path";
import { getBooksSnapshot, getReportsSnapshot, type BooksSnapshot, type ReportsSnapshot } from "@/lib/workspace-api";

const emptyBooks: BooksSnapshot = {
  trialBalance: [],
  generalLedger: [],
  auditTrail: [],
  backendReady: false,
};

const emptyReports: ReportsSnapshot = {
  vatSummary: [],
  vatDetail: [],
  receivablesAging: [],
  payablesAging: [],
  trialBalance: [],
  profitLoss: { lines: [], revenueTotal: 0, expenseTotal: 0, netProfit: 0 },
  profitByCustomer: [],
  profitByProduct: [],
  expenseBreakdown: [],
  balanceSheet: { assets: [], liabilities: [], equity: [], assetTotal: 0, liabilityTotal: 0, equityTotal: 0 },
  auditTrail: [],
  backendReady: false,
};

export function AccountingOverview() {
  const { basePath } = useWorkspacePath();
  const [books, setBooks] = useState<BooksSnapshot>(emptyBooks);
  const [reports, setReports] = useState<ReportsSnapshot>(emptyReports);

  useEffect(() => {
    let active = true;

    Promise.all([getBooksSnapshot(), getReportsSnapshot()]).then(([nextBooks, nextReports]) => {
      if (!active) {
        return;
      }

      setBooks(nextBooks);
      setReports(nextReports);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Accounting</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Accounting review stays credible when the books, statements, and audit trail read from the same posted activity.</h1>
            <p className="mt-4 text-base leading-7 text-muted">Use this page to move from ledger review into books and reporting without falling back to disconnected summary cards or manual reconciliations.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={mapWorkspaceHref("/workspace/accounting/books", basePath)}>Open books</Button>
            <Button href={mapWorkspaceHref("/workspace/reports", basePath)} variant="secondary">Open reports</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Ledger lines", String(books.generalLedger.length), "Posted journal lines in the books"],
          ["Trial balance rows", String(books.trialBalance.length), "Accounts included in the current trial balance"],
          ["Net result", `${currency(reports.profitLoss.netProfit)} SAR`, "Current profit or loss from posted work"],
          ["Audit events", String(books.auditTrail.length), "Recent finance events recorded for traceability"],
        ].map(([title, value, caption]) => (
          <Card key={title} className="rounded-[1.8rem] bg-white/92 p-5">
            <p className="text-sm font-semibold text-muted">{title}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{caption}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <WorkspaceDataTable
          title="Latest ledger activity"
          caption="Recent posted journal lines across the company books."
          rows={books.generalLedger.slice(0, 12)}
          emptyMessage="Posted journal lines will appear here after the first finalized transaction."
          columns={[
            { header: "Entry", render: (row) => row.entryNumber },
            { header: "Date", render: (row) => row.entryDate },
            { header: "Account", render: (row) => `${row.accountCode} ${row.accountName}` },
            { header: "Cost center", render: (row) => row.costCenterCode ? `${row.costCenterCode} ${row.costCenterName}` : "-" },
            { header: "Balance", align: "right", render: (row) => `${currency(row.runningBalance)} SAR` },
          ]}
        />

        <WorkspaceDataTable
          title="Profit and loss"
          caption="Current revenue and expense lines behind the net result."
          rows={reports.profitLoss.lines.slice(0, 12)}
          emptyMessage="Profit and loss lines will appear here once revenue and expense activity is posted."
          columns={[
            { header: "Code", render: (row) => row.code },
            { header: "Account", render: (row) => row.name },
            { header: "Type", render: (row) => row.type },
            { header: "Net", align: "right", render: (row) => `${currency(row.netAmount)} SAR` },
          ]}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <WorkspaceDataTable
          title="Balance sheet"
          caption="Assets, liabilities, and equity from the current posting state."
          rows={[...reports.balanceSheet.assets, ...reports.balanceSheet.liabilities, ...reports.balanceSheet.equity].slice(0, 18)}
          emptyMessage="Balance sheet lines will appear here after the first posted finance activity."
          columns={[
            { header: "Code", render: (row) => row.code },
            { header: "Name", render: (row) => row.name },
            { header: "Type", render: (row) => row.type },
            { header: "Balance", align: "right", render: (row) => `${currency(row.balance)} SAR` },
          ]}
        />

        <WorkspaceDataTable
          title="Audit trail"
          caption="Recent recorded events across company finance activity."
          rows={books.auditTrail.slice(0, 12)}
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