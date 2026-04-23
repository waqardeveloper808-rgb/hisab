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
  vatReceivedDetails: [],
  vatPaidDetails: [],
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
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    Promise.all([getBooksSnapshot(), getReportsSnapshot()])
      .then(([nextBooks, nextReports]) => {
        if (!active) {
          return;
        }

        setBooks(nextBooks);
        setReports(nextReports);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        console.error('[AccountingOverview] data fetch failed:', err);
        if (!active) {
          return;
        }

        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-3" data-inspector-accounting-overview="true">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Accounting</p>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Books, statements, and audit trail from posted activity</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" href={mapWorkspaceHref("/workspace/accounting/books", basePath)}>Open books</Button>
          <Button size="sm" href={mapWorkspaceHref("/workspace/reports", basePath)} variant="secondary">Open reports</Button>
        </div>
      </div>

      <Card className="rounded-xl bg-white/95 p-3" data-inspector-accounting-entry="true">
        <p className="text-sm font-semibold text-ink">Accounting workspace loaded</p>
        <p className="mt-1 text-sm text-muted">
          {status === "loading"
            ? "Accounting data is loading. Core accounting controls and navigation are already available."
            : status === "error"
              ? "Accounting data could not be refreshed, but the accounting workspace remains accessible for navigation and review."
              : "Accounting books, reports, and audit trail are ready for review from this route."}
        </p>
      </Card>

      <div className="grid gap-2.5 grid-cols-2 xl:grid-cols-4">
        {[
          ["Ledger lines", String(books.generalLedger.length), "Posted journal lines"],
          ["Trial balance rows", String(books.trialBalance.length), "Accounts in trial balance"],
          ["Net result", `${currency(reports.profitLoss.netProfit)} SAR`, "Current P&L"],
          ["Audit events", String(books.auditTrail.length), "Recorded events"],
        ].map(([title, value, caption]) => (
          <Card key={title} className="rounded-xl bg-white/95 p-3">
            <p className="text-xs font-semibold text-muted">{title}</p>
            <p className="mt-1 text-xl font-bold text-ink">{value}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted">{caption}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-2.5 xl:grid-cols-2">
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

      <div className="grid gap-2.5 xl:grid-cols-2">
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