"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { currency } from "@/components/workflow/utils";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { WorkspaceRoleHeader } from "@/components/workspace/WorkspaceRoleHeader";
import { workspaceRoles } from "@/data/role-workspace";
import { getDashboardSnapshot, getReportsSnapshot, type DashboardSnapshot, type ReportsSnapshot } from "@/lib/workspace-api";

const emptyDashboard: DashboardSnapshot = {
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

export function UserWorkspaceHome() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(emptyDashboard);
  const [reports, setReports] = useState<ReportsSnapshot | null>(null);
  const role = workspaceRoles.user;

  useEffect(() => {
    let active = true;

    getDashboardSnapshot().then((nextSnapshot) => {
      if (active) {
        setSnapshot(nextSnapshot);
      }
    });

    getReportsSnapshot().then((nextReports) => {
      if (active) {
        setReports(nextReports);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const vatPayable = (reports?.vatDetail ?? []).reduce((total, row) => total + row.outputTaxAmount - row.inputTaxAmount, 0);
  const pendingInvoiceReminders = snapshot.recentInvoices.filter((invoice) => invoice.balanceDue > 0).length;
  const pendingBills = snapshot.recentBills.filter((bill) => bill.balanceDue > 0).length;
  const activity = [
    ...snapshot.recentInvoices.map((row) => ({ id: `invoice-${row.id}`, type: "Invoice", reference: row.number, date: row.issueDate, amount: row.balanceDue })),
    ...snapshot.recentBills.map((row) => ({ id: `bill-${row.id}`, type: "Vendor bill", reference: row.number, date: row.issueDate, amount: row.balanceDue })),
    ...snapshot.recentPayments.map((row) => ({ id: `payment-${row.id}`, type: row.direction === "incoming" ? "Receipt" : "Payment", reference: row.number, date: row.paymentDate, amount: row.amount })),
  ].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 8);

  return (
    <div className="space-y-6">
      <WorkspaceRoleHeader
        eyebrow={role.eyebrow}
        title={role.title}
        description="Use one primary business workspace for sales, purchases, accounting, VAT, products, and operations. Every visible destination leads to a real workflow screen."
        actions={role.quickActions}
        focusAreas={[
          { label: "Sales and collections", detail: "Keep invoice creation, receipt allocation, and customer follow-up tied together in the same working path." },
          { label: "Purchases and obligations", detail: "Review bills, expenses, and vendor obligations before they become late-payable surprises." },
          { label: "Accounting and compliance", detail: "Keep journal review, chart control, VAT position, and reports close to daily document flow." },
        ]}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Open invoices", String(snapshot.openInvoices), `${currency(snapshot.receivablesTotal)} SAR receivables still outstanding`],
          ["Open bills", String(snapshot.openBills), `${currency(snapshot.payablesTotal)} SAR payable to vendors`],
          ["VAT position", `${currency(vatPayable)} SAR`, `${snapshot.vatLines} VAT lines included in current review`],
          ["Net profit", `${currency(reports?.profitLoss.netProfit ?? 0)} SAR`, "Current profit snapshot from posted activity"],
        ].map(([title, value, caption]) => (
          <Card key={title} className="rounded-[1.8rem] bg-white/92 p-5">
            <p className="text-sm font-semibold text-muted">{title}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{caption}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[1.8rem] bg-white/92 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Alerts and pending actions</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-[1.3rem] border border-line bg-surface-soft px-4 py-3">
              <p className="text-sm font-semibold text-ink">Unpaid invoice reminders</p>
              <p className="mt-1 text-sm leading-6 text-muted">{pendingInvoiceReminders} recent customer invoices still show open balances and need collection follow-up.</p>
            </div>
            <div className="rounded-[1.3rem] border border-line bg-surface-soft px-4 py-3">
              <p className="text-sm font-semibold text-ink">Pending bills</p>
              <p className="mt-1 text-sm leading-6 text-muted">{pendingBills} recent supplier bills remain unpaid and should be reviewed in the purchases workflow.</p>
            </div>
            <div className="rounded-[1.3rem] border border-line bg-surface-soft px-4 py-3">
              <p className="text-sm font-semibold text-ink">VAT reminder</p>
              <p className="mt-1 text-sm leading-6 text-muted">Keep the current VAT position visible before filing, especially when new invoices and bills are still being posted.</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[1.8rem] bg-white/92 p-6">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <h2 className="text-2xl font-semibold text-ink">Business modules</h2>
              <p className="mt-1 text-sm text-muted">Concrete navigation for the work that actually happens every day.</p>
            </div>
            <span className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-muted">Workflow-based navigation</span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {role.sidebarGroups.flatMap((group) => group.items).filter((item) => item.href !== role.homeHref).map((item) => (
              <Link key={item.href} href={item.href} className="rounded-[1.4rem] border border-line bg-surface-soft p-4 transition hover:border-primary/30 hover:bg-white">
                <p className="text-sm font-semibold text-primary">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-muted">Open the {item.label.toLowerCase()} workflow without leaving the user workspace.</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <WorkspaceDataTable
        title="Recent activity"
        caption="Latest invoices, bills, and cash movement across the user workspace."
        rows={activity}
        emptyMessage="Recent business activity will appear here once documents and payments are posted."
        columns={[
          { header: "Type", render: (row) => row.type },
          { header: "Reference", render: (row) => row.reference },
          { header: "Date", render: (row) => row.date || "-" },
          { header: "Amount", align: "right", render: (row) => `${currency(row.amount)} SAR` },
        ]}
      />
    </div>
  );
}