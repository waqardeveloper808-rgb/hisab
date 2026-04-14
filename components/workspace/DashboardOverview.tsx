"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { getDashboardSnapshot, getReportsSnapshot, type DashboardSnapshot, type ReportsSnapshot } from "@/lib/workspace-api";
import { workspaceModules } from "@/data/workspace";
import { useWorkspaceAccess } from "@/components/workspace/WorkspaceAccessProvider";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { currency } from "@/components/workflow/utils";
import { canAccessWorkspaceArea } from "@/lib/access-control";
import { mapWorkspaceHref, mapWorkspaceModule } from "@/lib/workspace-path";

const fallbackSnapshot: DashboardSnapshot = {
  openInvoices: 0,
  openBills: 0,
  receivablesTotal: 0,
  payablesTotal: 0,
  vatLines: 0,
  recentInvoices: [],
  recentBills: [],
  recentPayments: [],
  backendReady: false,
};

export function DashboardOverview() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(fallbackSnapshot);
  const [reportSnapshot, setReportSnapshot] = useState<ReportsSnapshot | null>(null);
  const access = useWorkspaceAccess();
  const { basePath } = useWorkspacePath();

  useEffect(() => {
    let active = true;

    getDashboardSnapshot().then((nextSnapshot) => {
      if (active) {
        setSnapshot(nextSnapshot);
      }
    });

    getReportsSnapshot().then((nextSnapshot) => {
      if (active) {
        setReportSnapshot(nextSnapshot);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const summaryCards = [
    { title: "Total Sales", value: `${currency(reportSnapshot?.profitLoss.revenueTotal ?? 0)} SAR`, caption: `${snapshot.openInvoices} open invoices still need follow-up` },
    { title: "Total Income", value: `${currency(snapshot.recentPayments.filter((row) => row.direction === "incoming").reduce((total, row) => total + row.amount, 0))} SAR`, caption: "Recent incoming cash already recorded" },
    { title: "Total Expenses", value: `${currency(reportSnapshot?.profitLoss.expenseTotal ?? 0)} SAR`, caption: `${snapshot.openBills} supplier documents remain open` },
    { title: "Open Payables", value: `${currency(snapshot.payablesTotal)} SAR`, caption: "Outstanding supplier balances still waiting for settlement" },
    { title: "VAT Payable", value: `${currency((reportSnapshot?.vatDetail ?? []).reduce((total, row) => total + row.outputTaxAmount - row.inputTaxAmount, 0))} SAR`, caption: "Current net VAT position from posted activity" },
    { title: "Profit Snapshot", value: `${currency(reportSnapshot?.profitLoss.netProfit ?? 0)} SAR`, caption: "Current earnings based on posted activity" },
  ];

  const intelligenceCards = [
    {
      title: "Top customer",
      value: reportSnapshot?.profitByCustomer[0]?.contactName ?? "Waiting for data",
      caption: reportSnapshot ? `${currency(reportSnapshot.profitByCustomer[0]?.profit ?? 0)} SAR gross profit` : "Customer performance updates once sales are posted",
    },
    {
      title: "Top product",
      value: reportSnapshot?.profitByProduct[0]?.itemName ?? "Waiting for data",
      caption: reportSnapshot ? `${currency(reportSnapshot.profitByProduct[0]?.profit ?? 0)} SAR gross profit` : "Product performance updates once sales are posted",
    },
    {
      title: "Expense focus",
      value: reportSnapshot?.expenseBreakdown[0]?.categoryName ?? "Waiting for data",
      caption: reportSnapshot ? `${currency(reportSnapshot.expenseBreakdown[0]?.total ?? 0)} SAR in posted costs` : "Expense trends update once purchase activity is posted",
    },
  ];

  const recentActivity = [
    ...snapshot.recentInvoices.map((row) => ({ id: `invoice-${row.id}`, type: "Invoice", label: row.number, date: row.issueDate, amount: row.grandTotal })),
    ...snapshot.recentBills.map((row) => ({ id: `bill-${row.id}`, type: "Vendor bill", label: row.number, date: row.issueDate, amount: row.grandTotal })),
    ...snapshot.recentPayments.map((row) => ({ id: `payment-${row.id}`, type: row.direction === "incoming" ? "Receipt" : "Payment", label: row.number, date: row.paymentDate, amount: row.amount })),
  ].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 8);

  const topCustomers = reportSnapshot?.profitByCustomer.slice(0, 5) ?? [];
  const revenueMax = Math.max(1, ...(topCustomers.map((row) => row.revenue) || [1]));

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">One daily starting point for the whole invoicing workspace.</h1>
            <p className="mt-4 text-base leading-7 text-muted">Start with the numbers that move today, then step into the module that owns the next action.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={mapWorkspaceHref("/workspace/invoices/new", basePath)}>Create invoice</Button>
            <Button href={mapWorkspaceHref("/workspace/bills/new", basePath)} variant="secondary">Create vendor bill</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.title} className="rounded-[1.8rem] bg-white/92 p-5">
            <p className="text-sm font-semibold text-muted">{card.title}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{card.value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{card.caption}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {intelligenceCards.map((card) => (
          <Card key={card.title} className="rounded-[1.8rem] bg-white/92 p-5">
            <p className="text-sm font-semibold text-primary">{card.title}</p>
            <p className="mt-3 text-xl font-semibold text-ink">{card.value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{card.caption}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[2rem] bg-white/92 p-6">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <h2 className="text-2xl font-semibold text-ink">Top customers</h2>
              <p className="mt-1 text-sm text-muted">Live revenue and profit ranking from posted documents.</p>
            </div>
            <span className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-muted">Performance insights</span>
          </div>
          <div className="mt-5 space-y-4">
            {topCustomers.length ? topCustomers.map((row) => (
              <div key={row.contactId}>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-ink">{row.contactName}</p>
                    <p className="text-muted">{currency(row.profit)} SAR gross profit</p>
                  </div>
                  <p className="font-semibold text-ink">{currency(row.revenue)} SAR</p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-surface-soft">
                  <div className="h-2 rounded-full bg-[linear-gradient(90deg,#1f7a53,#0f5b41)]" style={{ width: `${Math.max(14, (row.revenue / revenueMax) * 100)}%` }} />
                </div>
              </div>
            )) : <p className="text-sm text-muted">Top customer data will populate once sales activity is posted.</p>}
          </div>
        </Card>

        <WorkspaceDataTable
          title="Recent activity"
          caption="Latest commercial and finance events across the workspace."
          rows={recentActivity}
          emptyMessage="Recent activity will appear here once the workspace posts documents and payments."
          columns={[
            { header: "Type", render: (row) => row.type },
            { header: "Reference", render: (row) => row.label },
            { header: "Date", render: (row) => row.date || "-" },
            { header: "Amount", align: "right", render: (row) => `${currency(row.amount)} SAR` },
          ]}
        />
      </div>

      <Card className="rounded-[2rem] bg-white/92 p-6">
        <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-ink">Module map</h2>
            <p className="mt-1 text-sm text-muted">Every module has one clear purpose and one clear next action.</p>
          </div>
          <span className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-muted">
            {snapshot.backendReady ? "Company books connected" : "Company books are waiting for posted activity"}
          </span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workspaceModules
            .map((module) => mapWorkspaceModule(module, basePath))
            .filter((module) => module.slug !== "dashboard")
            .filter((module) => canAccessWorkspaceArea(access, {
              platform: module.requiredPlatformAbilities,
              company: module.requiredCompanyAbilities,
            }))
            .map((module) => (
            <Link key={module.slug} href={module.href} className="rounded-[1.5rem] border border-line bg-surface-soft p-4 hover:border-primary/30 hover:bg-white">
              <p className="text-sm font-semibold text-primary">{module.label}</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">{module.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{module.summary}</p>
            </Link>
            ))}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <WorkspaceDataTable
          title="Recent invoices"
          caption="Latest sales documents and their remaining balances."
          rows={snapshot.recentInvoices}
          emptyMessage="Posted invoices will appear here."
          columns={[
            { header: "Invoice", render: (row) => row.number },
            { header: "Status", render: (row) => row.status.replaceAll("_", " ") },
            { header: "Issue date", render: (row) => row.issueDate || "-" },
            { header: "Balance", align: "right", render: (row) => `${currency(row.balanceDue)} SAR` },
          ]}
        />

        <WorkspaceDataTable
          title="Recent payments"
          caption="Latest incoming and outgoing money movement."
          rows={snapshot.recentPayments}
          emptyMessage="Recorded payments will appear here."
          columns={[
            { header: "Payment", render: (row) => row.number },
            { header: "Direction", render: (row) => row.direction === "incoming" ? "Incoming money" : "Outgoing payment" },
            { header: "Date", render: (row) => row.paymentDate || "-" },
            { header: "Amount", align: "right", render: (row) => `${currency(row.amount)} SAR` },
          ]}
        />
      </div>
    </div>
  );
}