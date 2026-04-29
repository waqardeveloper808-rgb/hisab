"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { currency } from "@/components/workflow/utils";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
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

function KpiChip({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-1 text-base font-bold leading-tight text-ink sm:text-lg">{value}</p>
      {sub ? <p className="mt-1 text-[11px] leading-5 text-muted">{sub}</p> : null}
    </div>
  );
}

export function UserWorkspaceHome() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(emptyDashboard);
  const [reports, setReports] = useState<ReportsSnapshot | null>(null);
  const role = workspaceRoles.user;

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    getDashboardSnapshot(controller.signal)
      .then((s) => {
        if (active) {
          setSnapshot(s);
        }
      })
      .catch((err: unknown) => {
        if (active && !(err instanceof Error && err.name === "AbortError")) {
          setSnapshot(emptyDashboard);
        }
      });
    getReportsSnapshot(undefined, controller.signal)
      .then((r) => {
        if (active) {
          setReports(r);
        }
      })
      .catch((err: unknown) => {
        if (active && !(err instanceof Error && err.name === "AbortError")) {
          setReports(null);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const vatPayable = (reports?.vatDetail ?? []).reduce((t, r) => t + r.outputTaxAmount - r.inputTaxAmount, 0);
  const pendingInvoices = snapshot.recentInvoices.filter((i) => i.balanceDue > 0).length;
  const pendingBills = snapshot.recentBills.filter((b) => b.balanceDue > 0).length;
  const hasLiveData = snapshot.backendReady && (snapshot.openInvoices > 0 || snapshot.openBills > 0 || snapshot.recentPayments.length > 0);

  const activity = [
    ...snapshot.recentInvoices.map((r) => ({ id: `inv-${r.id}`, type: "Invoice" as const, ref: r.number, date: r.issueDate, amount: r.balanceDue })),
    ...snapshot.recentBills.map((r) => ({ id: `bill-${r.id}`, type: "Bill" as const, ref: r.number, date: r.issueDate, amount: r.balanceDue })),
    ...snapshot.recentPayments.map((r) => ({ id: `pay-${r.id}`, type: (r.direction === "incoming" ? "Receipt" : "Payment") as string, ref: r.number, date: r.paymentDate, amount: r.amount })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  const quickLinks = role.sidebarGroups
    .filter((g) => g.label !== "Dashboard" && g.label !== "Settings" && g.label !== "Templates")
    .flatMap((g) => g.items.slice(0, 2))
    .slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-line bg-white px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Workspace overview</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">Operational finance snapshot</h1>
            <p className="mt-1 text-sm text-muted">
              {hasLiveData
                ? "Track receivables, payables, VAT, and recent activity from one compact workspace surface."
                : "Demo-ready placeholders keep the workspace readable until live invoices, bills, and payments start flowing."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-muted">
            <span className="rounded-full border border-line bg-surface-soft px-3 py-1">{snapshot.backendReady ? "Live workspace data" : "Workspace preview mode"}</span>
            <span className="rounded-full border border-line bg-surface-soft px-3 py-1">{pendingInvoices + pendingBills} pending follow-ups</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-6">
        <KpiChip label="Receivables" value={`${currency(snapshot.receivablesTotal)}`} sub={`${snapshot.openInvoices} open invoices`} />
        <KpiChip label="Payables" value={`${currency(snapshot.payablesTotal)}`} sub={`${snapshot.openBills} open bills`} />
        <KpiChip label="VAT Position" value={`${currency(vatPayable)}`} sub={`${snapshot.vatLines} VAT lines`} />
        <KpiChip label="Net Profit" value={`${currency(reports?.profitLoss.netProfit ?? 0)}`} sub="Current period" />
        <KpiChip label="Net Assets" value={`${currency((reports?.balanceSheet.assetTotal ?? 0) - (reports?.balanceSheet.liabilityTotal ?? 0))}`} sub="Assets minus liabilities" />
        <KpiChip label="Pending" value={`${pendingInvoices + pendingBills}`} sub={`${pendingInvoices} inv · ${pendingBills} bills`} />
      </div>

      <div className="grid gap-2 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-line bg-white p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">Attention</p>
          <div className="space-y-1">
            {pendingInvoices > 0 ? (
              <div className="flex items-center justify-between rounded border border-amber-100 bg-amber-50/50 px-2 py-1.5">
                <span className="text-xs text-ink"><span className="font-semibold">{pendingInvoices}</span> unpaid invoices need follow-up</span>
                <Link href="/workspace/user/invoices" className="text-[10px] font-semibold text-primary hover:underline">View</Link>
              </div>
            ) : null}
            {pendingBills > 0 ? (
              <div className="flex items-center justify-between rounded border border-amber-100 bg-amber-50/50 px-2 py-1.5">
                <span className="text-xs text-ink"><span className="font-semibold">{pendingBills}</span> unpaid bills due</span>
                <Link href="/workspace/user/bills" className="text-[10px] font-semibold text-primary hover:underline">View</Link>
              </div>
            ) : null}
            {vatPayable !== 0 ? (
              <div className="flex items-center justify-between rounded border border-sky-100 bg-sky-50/50 px-2 py-1.5">
                <span className="text-xs text-ink">VAT {vatPayable > 0 ? "payable" : "refundable"}: <span className="font-semibold">{currency(Math.abs(vatPayable))} SAR</span></span>
                <Link href="/workspace/user/vat" className="text-[10px] font-semibold text-primary hover:underline">Review</Link>
              </div>
            ) : null}
            {pendingInvoices === 0 && pendingBills === 0 && vatPayable === 0 ? (
              <div className="rounded border border-emerald-100 bg-emerald-50/50 px-2 py-1.5 text-xs text-emerald-800">All clear - no pending items.</div>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">Quick access</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border border-line px-2.5 py-2 text-[11px] font-semibold text-ink transition hover:border-primary/30 hover:bg-primary-soft hover:text-primary">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <WorkspaceDataTable
        registerTableId="user-home-activity"
        title="Recent Activity"
        caption=""
        rows={activity}
        emptyMessage="Activity will appear once documents and payments are posted."
        columns={[
          { id: "type", header: "Type", defaultWidth: 120, render: (row) => row.type },
          { id: "ref", header: "Ref", defaultWidth: 160, render: (row) => row.ref },
          { id: "date", header: "Date", defaultWidth: 110, render: (row) => row.date || "—" },
          { id: "amount", header: "Amount", align: "right", defaultWidth: 120, render: (row) => `${currency(row.amount)} SAR` },
        ]}
      />
    </div>
  );
}