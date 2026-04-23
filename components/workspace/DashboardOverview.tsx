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
    }).catch((err: unknown) => { console.error('[DashboardOverview] getDashboardSnapshot failed:', err); });

    getReportsSnapshot().then((nextSnapshot) => {
      if (active) {
        setReportSnapshot(nextSnapshot);
      }
    }).catch((err: unknown) => { console.error('[DashboardOverview] getReportsSnapshot failed:', err); });

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
  const hasLiveData = snapshot.backendReady || reportSnapshot?.backendReady;

  if (!hasLiveData) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Dashboard</p>
            <h1 className="text-lg font-semibold text-ink">Daily starting point</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" href={mapWorkspaceHref("/workspace/settings/company", basePath)}>Complete company profile</Button>
            <Button size="sm" href={mapWorkspaceHref("/workspace/products", basePath)} variant="secondary">Create first item</Button>
          </div>
        </div>

        <Card className="rounded-xl bg-white/95 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-primary">No live dashboard data</p>
          <h2 className="mt-1 text-base font-semibold text-ink">Backend data is required before this overview can show totals.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">No placeholder sales, VAT, customer, or payment metrics are rendered here. Post real company, item, document, and payment records to populate this workspace.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Dashboard</p>
          <h1 className="text-lg font-semibold text-ink">Daily starting point</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" href={mapWorkspaceHref("/workspace/invoices/new", basePath)}>Create invoice</Button>
          <Button size="sm" href={mapWorkspaceHref("/workspace/bills/new", basePath)} variant="secondary">Create vendor bill</Button>
        </div>
      </div>

      <div className="grid gap-2.5 md:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((card) => (
          <Card key={card.title} className="rounded-xl bg-white/95 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{card.title}</p>
            <p className="mt-1.5 text-xl font-bold text-ink">{card.value}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{card.caption}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-2.5 lg:grid-cols-3">
        {intelligenceCards.map((card) => (
          <Card key={card.title} className="rounded-xl bg-white/95 p-3">
            <p className="text-[11px] font-semibold text-primary">{card.title}</p>
            <p className="mt-1.5 text-base font-semibold text-ink">{card.value}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{card.caption}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-2.5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-xl bg-white/95 p-4">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
            <div>
              <h2 className="text-base font-semibold text-ink">Top customers</h2>
              <p className="mt-0.5 text-xs text-muted">Revenue and profit from posted documents.</p>
            </div>
            <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[10px] font-semibold text-muted">Performance</span>
          </div>
          <div className="mt-3 space-y-3">
            {topCustomers.length ? topCustomers.map((row) => (
              <div key={row.contactId}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-ink">{row.contactName}</p>
                    <p className="text-xs text-muted">{currency(row.profit)} SAR profit</p>
                  </div>
                  <p className="text-sm font-semibold text-ink">{currency(row.revenue)} SAR</p>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-surface-soft">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(14, (row.revenue / revenueMax) * 100)}%` }} />
                </div>
              </div>
            )) : <p className="text-sm text-muted">Top customer data populates once sales are posted.</p>}
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

      <Card className="rounded-xl bg-white/95 p-4">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
          <div>
            <h2 className="text-base font-semibold text-ink">Module map</h2>
            <p className="mt-0.5 text-xs text-muted">Every module, one purpose, one next action.</p>
          </div>
          <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[10px] font-semibold text-muted">
            {snapshot.backendReady ? "Connected" : "Waiting for activity"}
          </span>
        </div>
        <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {workspaceModules
            .map((module) => mapWorkspaceModule(module, basePath))
            .filter((module) => module.slug !== "dashboard")
            .filter((module) => canAccessWorkspaceArea(access, {
              platform: module.requiredPlatformAbilities,
              company: module.requiredCompanyAbilities,
            }))
            .map((module) => (
            <Link key={module.slug} href={module.href} className="rounded-lg border border-line bg-surface-soft p-3 hover:border-primary/30 hover:bg-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-primary">{module.label}</p>
              <h3 className="mt-1 text-sm font-semibold text-ink">{module.title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted">{module.summary}</p>
            </Link>
            ))}
        </div>
      </Card>

      <div className="grid gap-2.5 xl:grid-cols-2">
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