"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { getReportsSnapshot, type ReportsSnapshot } from "@/lib/workspace-api";
import { currency } from "@/components/workflow/utils";

const emptyState: ReportsSnapshot = {
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

export function VatOverview() {
  const [snapshot, setSnapshot] = useState<ReportsSnapshot>(emptyState);

  useEffect(() => {
    getReportsSnapshot().then(setSnapshot);
  }, []);

  const outputTax = snapshot.vatDetail.reduce((sum, row) => sum + row.outputTaxAmount, 0);
  const inputTax = snapshot.vatDetail.reduce((sum, row) => sum + row.inputTaxAmount, 0);

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">VAT and compliance</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Review tax position from posted sales and purchases in one focused workspace.</h1>
        <p className="mt-4 text-base leading-7 text-muted">Output tax, input tax, and line-level VAT detail are kept separate from daily entry so review stays disciplined.</p>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        {[
          ["Output tax", `${currency(outputTax)} SAR`, "Tax collected through sales documents"],
          ["Input tax", `${currency(inputTax)} SAR`, "Tax recoverable through purchases"],
          ["Net position", `${currency(outputTax - inputTax)} SAR`, "Current difference before filing review"],
        ].map(([title, value, caption]) => (
          <Card key={title} className="rounded-[1.8rem] bg-white/92 p-5">
            <p className="text-sm font-semibold text-muted">{title}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{caption}</p>
          </Card>
        ))}
      </div>

      <WorkspaceDataTable
        title="VAT summary"
        caption="Taxable totals and tax totals by VAT code."
        rows={snapshot.vatSummary}
        emptyMessage="VAT summary rows will appear here when posted sales or purchases carry tax."
        columns={[
          { header: "Code", render: (row) => row.code },
          { header: "Name", render: (row) => row.name },
          { header: "Rate", align: "right", render: (row) => `${row.rate}%` },
          { header: "Taxable", align: "right", render: (row) => `${currency(row.taxableAmount)} SAR` },
          { header: "Tax", align: "right", render: (row) => `${currency(row.taxAmount)} SAR` },
        ]}
      />

      <WorkspaceDataTable
        title="VAT detail"
        caption="Output and input positions from posted document lines."
        rows={snapshot.vatDetail}
        emptyMessage="VAT detail rows will appear here when posted document lines contain tax."
        columns={[
          { header: "Code", render: (row) => row.code },
          { header: "Name", render: (row) => row.name },
          { header: "Sales tax", align: "right", render: (row) => `${currency(row.outputTaxAmount)} SAR` },
          { header: "Purchase tax", align: "right", render: (row) => `${currency(row.inputTaxAmount)} SAR` },
        ]}
      />
    </div>
  );
}