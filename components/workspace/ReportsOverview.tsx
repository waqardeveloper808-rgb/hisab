"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { StandardActionBar } from "@/components/workspace/StandardActionBar";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { getIntelligenceOverview, getReportsSnapshot, type IntelligenceSnapshot, type ReportsSnapshot } from "@/lib/workspace-api";
import { mapWorkspaceHref } from "@/lib/workspace-path";
import { currency } from "@/components/workflow/utils";

const fallbackState: ReportsSnapshot = {
  vatSummary: [],
  vatDetail: [],
  vatReceivedDetails: [],
  vatPaidDetails: [],
  receivablesAging: [],
  payablesAging: [],
  trialBalance: [],
  profitLoss: { lines: [], revenueTotal: 0, expenseTotal: 0, netProfit: 0 },
  balanceSheet: { assets: [], liabilities: [], equity: [], assetTotal: 0, liabilityTotal: 0, equityTotal: 0 },
  profitByCustomer: [],
  profitByProduct: [],
  expenseBreakdown: [],
  auditTrail: [],
  backendReady: false,
};

export function ReportsOverview() {
  const { basePath } = useWorkspacePath();
  const [snapshot, setSnapshot] = useState<ReportsSnapshot>(fallbackState);
  const [query, setQuery] = useState("");
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  const [segment, setSegment] = useState("all");
  const [intelligence, setIntelligence] = useState<IntelligenceSnapshot | null>(null);

  useEffect(() => {
    let active = true;

    getReportsSnapshot().then((nextSnapshot) => {
      if (active) {
        setSnapshot(nextSnapshot);
      }
    }).catch((err: unknown) => { console.error('[ReportsOverview] getReportsSnapshot failed:', err); });
    getIntelligenceOverview().then((nextIntelligence) => {
      if (active) {
        setIntelligence(nextIntelligence);
      }
    }).catch((err: unknown) => { console.error('[ReportsOverview] getIntelligenceOverview failed:', err); });

    return () => {
      active = false;
    };
  }, []);

  const headlineCards = [
    { title: "Revenue", value: `${currency(snapshot.profitLoss.revenueTotal)} SAR`, caption: "Sales posted to the books" },
    { title: "Expenses", value: `${currency(snapshot.profitLoss.expenseTotal)} SAR`, caption: "Purchase and operating cost posted" },
    { title: "Net result", value: `${currency(snapshot.profitLoss.netProfit)} SAR`, caption: "Current earnings from posted work" },
    { title: "Top customer profit", value: `${currency(snapshot.profitByCustomer[0]?.profit ?? 0)} SAR`, caption: snapshot.profitByCustomer[0]?.contactName ?? "Customer performance appears here after posted sales activity" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Reports</p>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Posted Performance Overview</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-surface-soft px-2.5 py-0.5 text-[11px] font-semibold text-muted">
            {snapshot.backendReady ? "Connected" : "Awaiting activity"}
          </span>
          <StandardActionBar compact actions={[
            { label: "Edit", disabled: true },
            { label: "Save", onClick: () => window.localStorage.setItem("reports-overview-filters", JSON.stringify({ query, asOfDate, segment })) },
            { label: "Delete", onClick: () => { setQuery(""); setSegment("all"); }, variant: "muted" },
            { label: "Export", onClick: () => window.print() },
          ]} />
        </div>
      </div>

      <Card className="rounded-xl bg-white/95 p-3">
        <div className="grid gap-3 lg:grid-cols-3">
          <Input label="Search reports" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Customer, product, account, or report" />
          <Input label="As of date" type="date" value={asOfDate} onChange={(event) => setAsOfDate(event.target.value)} />
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Focus</label>
            <select value={segment} onChange={(event) => setSegment(event.target.value)} className="block h-[var(--control-input)] w-full rounded-[var(--radius-sm)] border border-line-strong bg-white px-2.5 text-sm text-ink outline-none">
              <option value="all">All reports</option>
              <option value="cash">Cash and liquidity</option>
              <option value="vat">VAT and compliance</option>
              <option value="profit">Profitability</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="rounded-xl bg-white/95 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <p className="text-muted">Use this overview to jump into detailed accountant reports, not as a dead-end summary page.</p>
          <div className="flex flex-wrap gap-2">
            <Link href={mapWorkspaceHref("/workspace/user/reports/profit-loss", basePath)} className="rounded-md border border-line bg-white px-2.5 py-1 font-medium text-ink hover:bg-surface-soft/30">Profit &amp; Loss</Link>
            <Link href={mapWorkspaceHref("/workspace/user/reports/balance-sheet", basePath)} className="rounded-md border border-line bg-white px-2.5 py-1 font-medium text-ink hover:bg-surface-soft/30">Balance Sheet</Link>
            <Link href={mapWorkspaceHref("/workspace/user/reports/trial-balance", basePath)} className="rounded-md border border-line bg-white px-2.5 py-1 font-medium text-ink hover:bg-surface-soft/30">Trial Balance</Link>
            <Link href={mapWorkspaceHref("/workspace/accounting/books", basePath)} className="rounded-md border border-line bg-white px-2.5 py-1 font-medium text-ink hover:bg-surface-soft/30">Ledger</Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-2.5 grid-cols-2 xl:grid-cols-4">
        {headlineCards.map((card) => (
          <Card key={card.title} className="rounded-xl bg-white/95 p-3">
            <p className="text-xs font-semibold text-muted">{card.title}</p>
            <p className="mt-1 text-xl font-bold text-ink">{card.value}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted">{card.caption}</p>
          </Card>
        ))}
      </div>

      {intelligence ? (
        <Card className="rounded-xl bg-white/95 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Intelligence</p>
              <h2 className="text-sm font-semibold text-ink">Live finance signals</h2>
            </div>
            <span className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-semibold text-muted">Confidence {intelligence.confidenceScore}%</span>
          </div>
          <div className="mt-3 grid gap-2 xl:grid-cols-3 text-xs">
            {intelligence.reminders.slice(0, 2).map((reminder) => <p key={reminder.label} className="rounded-lg border border-line px-2.5 py-2 text-muted">{reminder.label}: {reminder.reason}</p>)}
            {intelligence.suggestions.slice(0, 2).map((suggestion) => <p key={suggestion.label} className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-2 text-emerald-900">{suggestion.label}: {suggestion.reason}</p>)}
            {intelligence.anomalies.slice(0, 2).map((anomaly) => <p key={anomaly.message} className="rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-2 text-amber-900">{anomaly.message}</p>)}
          </div>
        </Card>
      ) : null}

      <WorkspaceDataTable
        registerTableId="reports-overview-vat-summary"
        title="VAT summary"
        caption="Taxable value and tax by VAT code."
        rows={snapshot.vatSummary}
        emptyMessage="Posted VAT activity will appear here."
        columns={[
          { id: "code", header: "Code", defaultWidth: 100, render: (row) => row.code },
          { id: "name", header: "Name", defaultWidth: 200, render: (row) => row.name },
          { id: "rate", header: "Rate", align: "right", defaultWidth: 80, render: (row) => `${row.rate}%` },
          { id: "taxable", header: "Taxable", align: "right", defaultWidth: 120, render: (row) => `${currency(row.taxableAmount)} SAR` },
          { id: "tax", header: "Tax", align: "right", defaultWidth: 120, render: (row) => `${currency(row.taxAmount)} SAR` },
        ]}
      />

      <div className="grid gap-2.5 xl:grid-cols-2">
        <WorkspaceDataTable
          registerTableId="reports-overview-ar-aging"
          title="Receivables aging"
          caption="Open customer balances grouped by age bucket."
          rows={snapshot.receivablesAging}
          emptyMessage="Open customer balances will appear here."
          columns={[
            { id: "document", header: "Document", defaultWidth: 160, render: (row) => row.documentNumber },
            { id: "bucket", header: "Bucket", defaultWidth: 120, render: (row) => row.bucket.replaceAll("_", "-") },
            { id: "balance", header: "Balance", align: "right", defaultWidth: 120, render: (row) => `${currency(row.balanceDue)} SAR` },
          ]}
        />

        <WorkspaceDataTable
          registerTableId="reports-overview-ap-aging"
          title="Payables aging"
          caption="Open supplier balances grouped by age bucket."
          rows={snapshot.payablesAging}
          emptyMessage="Open supplier balances will appear here."
          columns={[
            { id: "document", header: "Document", defaultWidth: 160, render: (row) => row.documentNumber },
            { id: "bucket", header: "Bucket", defaultWidth: 120, render: (row) => row.bucket.replaceAll("_", "-") },
            { id: "balance", header: "Balance", align: "right", defaultWidth: 120, render: (row) => `${currency(row.balanceDue)} SAR` },
          ]}
        />
      </div>

      <div className="grid gap-2.5 xl:grid-cols-2">
        <WorkspaceDataTable
          registerTableId="reports-overview-profit-customer"
          title="Profit by customer"
          caption="See which customers are driving the strongest gross profit based on posted revenue and estimated cost."
          rows={snapshot.profitByCustomer}
          emptyMessage="Customer profitability will appear after posted sales activity."
          columns={[
            { id: "customer", header: "Customer", defaultWidth: 200, render: (row) => row.contactName },
            { id: "revenue", header: "Revenue", align: "right", defaultWidth: 120, render: (row) => `${currency(row.revenue)} SAR` },
            { id: "cost", header: "Est. cost", align: "right", defaultWidth: 120, render: (row) => `${currency(row.estimatedCost)} SAR` },
            { id: "profit", header: "Profit", align: "right", defaultWidth: 120, render: (row) => `${currency(row.profit)} SAR` },
          ]}
        />

        <WorkspaceDataTable
          registerTableId="reports-overview-profit-product"
          title="Profit by product"
          caption="Compare quantity, revenue, and estimated gross profit by product or service."
          rows={snapshot.profitByProduct}
          emptyMessage="Product profitability will appear after posted sales activity."
          columns={[
            { id: "product", header: "Product", defaultWidth: 200, render: (row) => row.itemName },
            { id: "qty", header: "Qty", align: "right", defaultWidth: 80, render: (row) => row.quantity },
            { id: "revenue", header: "Revenue", align: "right", defaultWidth: 120, render: (row) => `${currency(row.revenue)} SAR` },
            { id: "profit", header: "Profit", align: "right", defaultWidth: 120, render: (row) => `${currency(row.profit)} SAR` },
          ]}
        />
      </div>

      <div className="grid gap-2.5 xl:grid-cols-2">
        <WorkspaceDataTable
          registerTableId="reports-overview-expense"
          title="Expense breakdown"
          caption="Review operating cost concentration by expense account category."
          rows={snapshot.expenseBreakdown}
          emptyMessage="Expense categories will appear after posted purchase activity."
          columns={[
            { id: "code", header: "Code", defaultWidth: 100, render: (row) => row.categoryCode },
            { id: "category", header: "Category", defaultWidth: 200, render: (row) => row.categoryName },
            { id: "total", header: "Total", align: "right", defaultWidth: 120, render: (row) => `${currency(row.total)} SAR` },
          ]}
        />

        <WorkspaceDataTable
          registerTableId="reports-overview-pl"
          title="Profit and loss"
          caption="Revenue and expense lines that build the current result."
          rows={snapshot.profitLoss.lines}
          emptyMessage="Posted revenue and expenses will appear here."
          columns={[
            { id: "code", header: "Code", defaultWidth: 88, render: (row) => row.code },
            { id: "name", header: "Name", defaultWidth: 200, render: (row) => row.name },
            { id: "type", header: "Type", defaultWidth: 100, render: (row) => row.type },
            { id: "net", header: "Net", align: "right", defaultWidth: 120, render: (row) => `${currency(row.netAmount)} SAR` },
          ]}
        />

        <WorkspaceDataTable
          registerTableId="reports-overview-tb"
          title="Trial balance"
          caption="Account balances from posted journal lines."
          rows={snapshot.trialBalance.slice(0, 12)}
          emptyMessage="Posted journal lines will appear here."
          columns={[
            { id: "code", header: "Code", defaultWidth: 88, render: (row) => row.code },
            { id: "account", header: "Account", defaultWidth: 200, render: (row) => row.name },
            { id: "type", header: "Type", defaultWidth: 100, render: (row) => row.type },
            { id: "balance", header: "Balance", align: "right", defaultWidth: 120, render: (row) => `${currency(row.balance)} SAR` },
          ]}
        />
      </div>

      <div className="grid gap-2.5 xl:grid-cols-2">
        <WorkspaceDataTable
          registerTableId="reports-overview-bs"
          title="Balance sheet"
          caption="Assets, liabilities, and equity as of the current posting state."
          rows={[...snapshot.balanceSheet.assets, ...snapshot.balanceSheet.liabilities, ...snapshot.balanceSheet.equity]}
          emptyMessage="The balance sheet will appear after posting activity."
          columns={[
            { id: "code", header: "Code", defaultWidth: 88, render: (row) => row.code },
            { id: "name", header: "Name", defaultWidth: 200, render: (row) => row.name },
            { id: "type", header: "Type", defaultWidth: 100, render: (row) => row.type },
            { id: "balance", header: "Balance", align: "right", defaultWidth: 120, render: (row) => `${currency(row.balance)} SAR` },
          ]}
        />

        <WorkspaceDataTable
          registerTableId="reports-overview-audit"
          title="Audit trail"
          caption="Recent changes recorded against finance activity."
          rows={snapshot.auditTrail.slice(0, 12)}
          emptyMessage="Recorded activity will appear here."
          columns={[
            { id: "event", header: "Event", defaultWidth: 160, render: (row) => row.event.replaceAll(".", " ") },
            { id: "record", header: "Record", defaultWidth: 180, render: (row) => `${row.auditableType.split("\\").pop()} #${row.auditableId}` },
            { id: "when", header: "When", defaultWidth: 160, render: (row) => row.createdAt },
          ]}
        />
      </div>
    </div>
  );
}