import { describe, expect, it } from "vitest";
import { buildProfitLossDetail, buildReportComparison, buildVatMonthlyTrend } from "@/lib/report-analytics";
import type { ReportsSnapshot } from "@/lib/workspace-api";

const snapshot: ReportsSnapshot = {
  vatSummary: [{ code: "VAT15", name: "VAT", taxRate: 15, taxableAmount: 100, taxAmount: 15 }],
  vatDetail: [],
  vatReceivedDetails: [{ id: 1, invoiceNumber: "INV-1", date: "2026-04-01", customer: "A", taxableAmount: 100, vatAmount: 15 }],
  vatPaidDetails: [{ id: 1, reference: "BILL-1", date: "2026-04-03", vendor: "B", vatAmount: 5, category: "expense" }],
  receivablesAging: [{ documentNumber: "INV-1", balanceDue: 200, bucket: "current" }],
  payablesAging: [{ documentNumber: "BILL-1", balanceDue: 50, bucket: "current" }],
  trialBalance: [],
  profitLoss: {
    lines: [
      { code: "4000", name: "Sales", type: "income", netAmount: 1000 },
      { code: "6000", name: "Rent", type: "expense", netAmount: 400 },
    ],
    revenueTotal: 1000,
    expenseTotal: 400,
    netProfit: 600,
  },
  balanceSheet: { assets: [], liabilities: [], equity: [], assetTotal: 2000, liabilityTotal: 500, equityTotal: 1500 },
  profitByCustomer: [],
  profitByProduct: [],
  expenseBreakdown: [],
  auditTrail: [],
  backendReady: true,
};

describe("report-analytics", () => {
  it("builds comparison metrics", () => {
    const comparison = buildReportComparison(snapshot, "previous-period");
    expect(comparison.find((item) => item.label === "Net profit")?.delta).not.toBe(0);
  });

  it("builds VAT monthly trend", () => {
    const trend = buildVatMonthlyTrend(snapshot);
    expect(trend).toHaveLength(1);
    expect(trend[0]?.netVat).toBe(10);
  });

  it("extracts profit and loss detail", () => {
    const detail = buildProfitLossDetail(snapshot);
    expect(detail.grossMarginPct).toBe(60);
    expect(detail.largestRevenueLine?.name).toBe("Sales");
  });
});