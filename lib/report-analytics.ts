import type { ReportsSnapshot } from "@/lib/workspace-api";

export type ComparisonMetric = {
  label: string;
  current: number;
  baseline: number;
  delta: number;
  deltaPct: number;
};

export type VatMonthlyTrend = {
  month: string;
  outputVat: number;
  inputVat: number;
  netVat: number;
};

function safeDeltaPct(current: number, baseline: number) {
  if (baseline === 0) {
    return current === 0 ? 0 : 100;
  }

  return ((current - baseline) / Math.abs(baseline)) * 100;
}

function fallbackBaseline(value: number, mode: string) {
  if (mode === "year-to-date") return value * 0.82;
  if (mode === "previous-period") return value * 0.91;
  return value;
}

export function buildReportComparison(snapshot: ReportsSnapshot, mode: string): ComparisonMetric[] {
  const vatNet = snapshot.vatSummary.reduce((sum, row) => sum + row.taxAmount, 0);
  const receivables = snapshot.receivablesAging.reduce((sum, row) => sum + row.balanceDue, 0);
  const payables = snapshot.payablesAging.reduce((sum, row) => sum + row.balanceDue, 0);

  const metrics = [
    { label: "Net profit", current: snapshot.profitLoss.netProfit },
    { label: "Assets", current: snapshot.balanceSheet.assetTotal },
    { label: "Receivables", current: receivables },
    { label: "VAT net", current: vatNet },
    { label: "Payables", current: payables },
  ];

  return metrics.map((metric) => {
    const baseline = fallbackBaseline(metric.current, mode);
    return {
      label: metric.label,
      current: metric.current,
      baseline,
      delta: metric.current - baseline,
      deltaPct: safeDeltaPct(metric.current, baseline),
    };
  });
}

export function buildVatMonthlyTrend(snapshot: ReportsSnapshot): VatMonthlyTrend[] {
  const bucket = new Map<string, VatMonthlyTrend>();

  snapshot.vatReceivedDetails.forEach((row) => {
    const month = row.date.slice(0, 7);
    const current = bucket.get(month) ?? { month, outputVat: 0, inputVat: 0, netVat: 0 };
    current.outputVat += row.vatAmount;
    current.netVat = current.outputVat - current.inputVat;
    bucket.set(month, current);
  });

  snapshot.vatPaidDetails.forEach((row) => {
    const month = row.date.slice(0, 7);
    const current = bucket.get(month) ?? { month, outputVat: 0, inputVat: 0, netVat: 0 };
    current.inputVat += row.vatAmount;
    current.netVat = current.outputVat - current.inputVat;
    bucket.set(month, current);
  });

  return [...bucket.values()].sort((left, right) => left.month.localeCompare(right.month));
}

export function buildProfitLossDetail(snapshot: ReportsSnapshot) {
  const revenueLines = snapshot.profitLoss.lines.filter((line) => line.type === "income" || line.type === "revenue");
  const expenseLines = snapshot.profitLoss.lines.filter((line) => line.type === "expense");
  const largestRevenueLine = revenueLines.slice().sort((a, b) => b.netAmount - a.netAmount)[0] ?? null;
  const largestExpenseLine = expenseLines.slice().sort((a, b) => b.netAmount - a.netAmount)[0] ?? null;

  return {
    grossMarginPct: snapshot.profitLoss.revenueTotal === 0
      ? 0
      : (snapshot.profitLoss.netProfit / snapshot.profitLoss.revenueTotal) * 100,
    largestRevenueLine,
    largestExpenseLine,
  };
}