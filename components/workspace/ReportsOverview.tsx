"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { getReportsSnapshot, type ReportsSnapshot } from "@/lib/workspace-api";
import { currency } from "@/components/workflow/utils";

const fallbackState: ReportsSnapshot = {
  vatSummary: [],
  vatDetail: [],
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
  const [snapshot, setSnapshot] = useState<ReportsSnapshot>(fallbackState);

  useEffect(() => {
    let active = true;

    getReportsSnapshot().then((nextSnapshot) => {
      if (active) {
        setSnapshot(nextSnapshot);
      }
    });

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
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Reports</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Read the business story from posted numbers, not disconnected screens.</h1>
        <p className="mt-4 text-base leading-7 text-muted">VAT, aging, books, earnings, and audit history live together so finance review stays clear and consistent.</p>
        <div className="mt-5 inline-flex rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-muted">
          {snapshot.backendReady ? "Reporting is reading the company books" : "Reporting will populate as soon as company books have posted activity"}
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {headlineCards.map((card) => (
          <Card key={card.title} className="rounded-[1.8rem] bg-white/92 p-5">
            <p className="text-sm font-semibold text-muted">{card.title}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{card.value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{card.caption}</p>
          </Card>
        ))}
      </div>

      <WorkspaceDataTable
        title="VAT summary"
        caption="Taxable value and tax by VAT code."
        rows={snapshot.vatSummary}
        emptyMessage="Posted VAT activity will appear here."
        columns={[
          { header: "Code", render: (row) => row.code },
          { header: "Name", render: (row) => row.name },
          { header: "Rate", align: "right", render: (row) => `${row.rate}%` },
          { header: "Taxable", align: "right", render: (row) => `${currency(row.taxableAmount)} SAR` },
          { header: "Tax", align: "right", render: (row) => `${currency(row.taxAmount)} SAR` },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <WorkspaceDataTable
          title="Receivables aging"
          caption="Open customer balances grouped by age bucket."
          rows={snapshot.receivablesAging}
          emptyMessage="Open customer balances will appear here."
          columns={[
            { header: "Document", render: (row) => row.documentNumber },
            { header: "Bucket", render: (row) => row.bucket.replaceAll("_", "-") },
            { header: "Balance", align: "right", render: (row) => `${currency(row.balanceDue)} SAR` },
          ]}
        />

        <WorkspaceDataTable
          title="Payables aging"
          caption="Open supplier balances grouped by age bucket."
          rows={snapshot.payablesAging}
          emptyMessage="Open supplier balances will appear here."
          columns={[
            { header: "Document", render: (row) => row.documentNumber },
            { header: "Bucket", render: (row) => row.bucket.replaceAll("_", "-") },
            { header: "Balance", align: "right", render: (row) => `${currency(row.balanceDue)} SAR` },
          ]}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <WorkspaceDataTable
          title="Profit by customer"
          caption="See which customers are driving the strongest gross profit based on posted revenue and estimated cost."
          rows={snapshot.profitByCustomer}
          emptyMessage="Customer profitability will appear after posted sales activity."
          columns={[
            { header: "Customer", render: (row) => row.contactName },
            { header: "Revenue", align: "right", render: (row) => `${currency(row.revenue)} SAR` },
            { header: "Est. cost", align: "right", render: (row) => `${currency(row.estimatedCost)} SAR` },
            { header: "Profit", align: "right", render: (row) => `${currency(row.profit)} SAR` },
          ]}
        />

        <WorkspaceDataTable
          title="Profit by product"
          caption="Compare quantity, revenue, and estimated gross profit by product or service."
          rows={snapshot.profitByProduct}
          emptyMessage="Product profitability will appear after posted sales activity."
          columns={[
            { header: "Product", render: (row) => row.itemName },
            { header: "Qty", align: "right", render: (row) => row.quantity },
            { header: "Revenue", align: "right", render: (row) => `${currency(row.revenue)} SAR` },
            { header: "Profit", align: "right", render: (row) => `${currency(row.profit)} SAR` },
          ]}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <WorkspaceDataTable
          title="Expense breakdown"
          caption="Review operating cost concentration by expense account category."
          rows={snapshot.expenseBreakdown}
          emptyMessage="Expense categories will appear after posted purchase activity."
          columns={[
            { header: "Code", render: (row) => row.categoryCode },
            { header: "Category", render: (row) => row.categoryName },
            { header: "Total", align: "right", render: (row) => `${currency(row.total)} SAR` },
          ]}
        />

        <WorkspaceDataTable
          title="Profit and loss"
          caption="Revenue and expense lines that build the current result."
          rows={snapshot.profitLoss.lines}
          emptyMessage="Posted revenue and expenses will appear here."
          columns={[
            { header: "Code", render: (row) => row.code },
            { header: "Name", render: (row) => row.name },
            { header: "Type", render: (row) => row.type },
            { header: "Net", align: "right", render: (row) => `${currency(row.netAmount)} SAR` },
          ]}
        />

        <WorkspaceDataTable
          title="Trial balance"
          caption="Account balances from posted journal lines."
          rows={snapshot.trialBalance.slice(0, 12)}
          emptyMessage="Posted journal lines will appear here."
          columns={[
            { header: "Code", render: (row) => row.code },
            { header: "Account", render: (row) => row.name },
            { header: "Type", render: (row) => row.type },
            { header: "Balance", align: "right", render: (row) => `${currency(row.balance)} SAR` },
          ]}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <WorkspaceDataTable
          title="Balance sheet"
          caption="Assets, liabilities, and equity as of the current posting state."
          rows={[...snapshot.balanceSheet.assets, ...snapshot.balanceSheet.liabilities, ...snapshot.balanceSheet.equity]}
          emptyMessage="The balance sheet will appear after posting activity."
          columns={[
            { header: "Code", render: (row) => row.code },
            { header: "Name", render: (row) => row.name },
            { header: "Type", render: (row) => row.type },
            { header: "Balance", align: "right", render: (row) => `${currency(row.balance)} SAR` },
          ]}
        />

        <WorkspaceDataTable
          title="Audit trail"
          caption="Recent changes recorded against finance activity."
          rows={snapshot.auditTrail.slice(0, 12)}
          emptyMessage="Recorded activity will appear here."
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