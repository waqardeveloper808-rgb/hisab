"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { StandardActionBar } from "@/components/workspace/StandardActionBar";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { buildReportIntelligence as buildReportIntelligenceFallback } from "@/lib/intelligence-layer";
import { buildProfitLossDetail, buildReportComparison, buildVatMonthlyTrend } from "@/lib/report-analytics";
import { getReportIntelligence, getReportsSnapshot, type IntelligenceSnapshot, type ReportsSnapshot } from "@/lib/workspace-api";
import { mapWorkspaceHref } from "@/lib/workspace-path";
import { currency } from "@/components/workflow/utils";

/* ─── Report Type Config ─── */
export type ReportType =
  | "trial-balance"
  | "profit-loss"
  | "balance-sheet"
  | "cash-flow"
  | "receivables-aging"
  | "payables-aging"
  | "vat-summary";

const REPORT_META: Record<ReportType, { title: string; subtitle: string }> = {
  "trial-balance": { title: "Trial Balance", subtitle: "Account balances from all posted journal entries" },
  "profit-loss": { title: "Profit & Loss", subtitle: "Revenue, expenses, and net result for the current period" },
  "balance-sheet": { title: "Balance Sheet", subtitle: "Assets, liabilities, and equity as of the current posting state" },
  "cash-flow": { title: "Cash Flow Statement", subtitle: "Cash movements by operating, investing, and financing activities" },
  "receivables-aging": { title: "Receivables Aging", subtitle: "Open customer balances grouped by age bucket" },
  "payables-aging": { title: "Payables Aging", subtitle: "Open supplier balances grouped by age bucket" },
  "vat-summary": { title: "VAT Summary", subtitle: "Taxable amounts and VAT collected/paid by tax code" },
};

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

function readStoredReportFilters(reportType: ReportType) {
  if (typeof window === "undefined") {
    return { query: "", asOfDate: new Date().toISOString().slice(0, 10), comparisonMode: "current-period" };
  }

  const stored = window.localStorage.getItem(`report-filters:${reportType}`);
  if (!stored) {
    return { query: "", asOfDate: new Date().toISOString().slice(0, 10), comparisonMode: "current-period" };
  }

  try {
    const parsed = JSON.parse(stored) as { query?: string; asOfDate?: string; comparisonMode?: string };
    return {
      query: parsed.query ?? "",
      asOfDate: parsed.asOfDate ?? new Date().toISOString().slice(0, 10),
      comparisonMode: parsed.comparisonMode ?? "current-period",
    };
  } catch {
    window.localStorage.removeItem(`report-filters:${reportType}`);
    return { query: "", asOfDate: new Date().toISOString().slice(0, 10), comparisonMode: "current-period" };
  }
}

/* ─── Component ─── */
export function AccountingReportPage({ reportType }: { reportType: ReportType }) {
  const { basePath } = useWorkspacePath();
  const searchParams = useSearchParams();
  const storedFilters = readStoredReportFilters(reportType);
  const [snapshot, setSnapshot] = useState<ReportsSnapshot>(fallbackState);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") ?? storedFilters.query);
  const [asOfDate, setAsOfDate] = useState(storedFilters.asOfDate);
  const [comparisonMode, setComparisonMode] = useState(storedFilters.comparisonMode);
  const [filtersEditable, setFiltersEditable] = useState(false);
  const [backendIntelligence, setBackendIntelligence] = useState<IntelligenceSnapshot | null>(null);
  const invoiceFilterRaw = searchParams.get("invoice_id")?.trim() ?? "";
  const invoiceFilterId = Number(invoiceFilterRaw);
  const hasInvoiceFilter = reportType === "trial-balance" && Number.isInteger(invoiceFilterId) && invoiceFilterId > 0;
  const invoiceFilterNumber = searchParams.get("invoice_number")?.trim() ?? "";

  useEffect(() => {
    let active = true;
    getReportsSnapshot({
      invoiceId: hasInvoiceFilter ? invoiceFilterId : undefined,
      invoiceNumber: hasInvoiceFilter ? invoiceFilterNumber : undefined,
    }).then((s) => { if (active) setSnapshot(s); }).catch((err: unknown) => { console.error('[AccountingReportPage] getReportsSnapshot failed:', err); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [hasInvoiceFilter, invoiceFilterId, invoiceFilterNumber]);

  useEffect(() => {
    let active = true;
    getReportIntelligence().then((result) => {
      if (active) {
        setBackendIntelligence(result);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const meta = REPORT_META[reportType];
  const comparisonMetrics = buildReportComparison(snapshot, comparisonMode);
  const vatTrend = buildVatMonthlyTrend(snapshot);
  const profitLossDetail = buildProfitLossDetail(snapshot);
  const fallbackIntelligence = buildReportIntelligenceFallback({
    netProfit: snapshot.profitLoss.netProfit,
    receivablesTotal: snapshot.receivablesAging.reduce((sum, row) => sum + row.balanceDue, 0),
    payablesTotal: snapshot.payablesAging.reduce((sum, row) => sum + row.balanceDue, 0),
    vatBalance: snapshot.vatSummary.reduce((sum, row) => sum + row.taxAmount, 0),
  });
  const reportIntelligence = backendIntelligence ?? fallbackIntelligence;

  function exportJson() {
    const payload = {
      reportType,
      generatedAt: new Date().toISOString(),
      filters: { query, asOfDate, comparisonMode },
      snapshot,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${reportType}-${asOfDate || "current"}.json`;
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Reports</p>
          <h1 className="text-lg font-semibold tracking-tight text-ink">{meta.title}</h1>
          <p className="text-xs text-muted">{hasInvoiceFilter ? `Impact of Invoice ${invoiceFilterNumber || `#${invoiceFilterId}`}` : meta.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="xs" variant="secondary" href={mapWorkspaceHref("/workspace/accounting/books", basePath)}>Books</Button>
          <Button size="xs" variant="secondary" href={mapWorkspaceHref("/workspace/user/journal-entries", basePath)}>Journals</Button>
          <button type="button" onClick={() => window.print()} className="rounded-md border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface-soft/30">Print</button>
          <StandardActionBar compact actions={[
            { label: "Edit", onClick: () => setFiltersEditable((current) => !current) },
            { label: "Save", onClick: () => window.localStorage.setItem(`report-filters:${reportType}`, JSON.stringify({ query, asOfDate, comparisonMode })) },
            { label: "Delete", onClick: () => { setQuery(""); setComparisonMode("current-period"); }, variant: "muted" },
            { label: "Export", onClick: exportJson },
          ]} />
        </div>
      </div>

      <Card className="rounded-xl bg-white/95 p-3">
        <div className="grid gap-3 lg:grid-cols-3">
          <Input label="Find account or document" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by code, account, document, or bucket" disabled={!filtersEditable} />
          <Input label="As of date" type="date" value={asOfDate} onChange={(event) => setAsOfDate(event.target.value)} disabled={!filtersEditable} />
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Comparison</label>
            <select value={comparisonMode} onChange={(event) => setComparisonMode(event.target.value)} disabled={!filtersEditable} className="block h-[var(--control-input)] w-full rounded-[var(--radius-sm)] border border-line-strong bg-white px-2.5 text-sm text-ink outline-none disabled:opacity-60">
              <option value="current-period">Current period</option>
              <option value="previous-period">Previous period</option>
              <option value="year-to-date">Year to date</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-surface-soft px-2.5 py-1 font-semibold text-muted">{snapshot.backendReady ? "Live backend data" : "Awaiting posted activity"}</span>
            <Link href={mapWorkspaceHref("/workspace/user/reports", basePath)} className="rounded-md border border-line bg-white px-2.5 py-1 font-medium text-ink hover:bg-surface-soft/30">All reports</Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 xl:grid-cols-3">
        <Card className="rounded-xl bg-white/95 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Comparison</p>
          <h2 className="text-sm font-semibold text-ink">Period deltas</h2>
          <div className="mt-3 space-y-2 text-xs">
            {comparisonMetrics.slice(0, 4).map((metric) => (
              <div key={metric.label} className="flex items-center justify-between gap-3 rounded-lg border border-line px-2.5 py-2">
                <span className="text-muted">{metric.label}</span>
                <span className={metric.delta >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>{metric.deltaPct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="rounded-xl bg-white/95 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Trend analysis</p>
          <h2 className="text-sm font-semibold text-ink">VAT monthly drift</h2>
          <div className="mt-3 space-y-2 text-xs">
            {vatTrend.length ? vatTrend.slice(-4).map((row) => (
              <div key={row.month} className="grid grid-cols-4 gap-2 rounded-lg border border-line px-2.5 py-2">
                <span className="font-semibold text-ink">{row.month}</span>
                <span className="text-muted">Out {currency(row.outputVat)}</span>
                <span className="text-muted">In {currency(row.inputVat)}</span>
                <span className={row.netVat >= 0 ? "text-ink" : "text-rose-700"}>Net {currency(row.netVat)}</span>
              </div>
            )) : <p className="text-muted">Monthly VAT trend will appear when dated VAT source lines are available.</p>}
          </div>
        </Card>
        <Card className="rounded-xl bg-white/95 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Intelligence</p>
          <h2 className="text-sm font-semibold text-ink">Report signals</h2>
          <div className="mt-3 space-y-2 text-xs">
            <p className="rounded-lg bg-surface-soft/35 px-2.5 py-2 text-ink">Confidence score: {reportIntelligence.confidenceScore}%</p>
            {reportIntelligence.reminders.map((reminder) => <p key={reminder.label} className="rounded-lg border border-line px-2.5 py-2 text-muted">{reminder.label}: {reminder.reason}</p>)}
            {reportIntelligence.suggestions.slice(0, 2).map((suggestion) => <p key={suggestion.label} className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-2 text-emerald-900">{suggestion.label}: {suggestion.reason}</p>)}
            {reportIntelligence.anomalies.slice(0, 2).map((anomaly) => <p key={anomaly.message} className="rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-2 text-amber-900">{anomaly.message}</p>)}
            {reportType === "profit-loss" ? <p className="rounded-lg border border-line px-2.5 py-2 text-muted">Gross margin: {profitLossDetail.grossMarginPct.toFixed(1)}%</p> : null}
          </div>
        </Card>
      </div>

      {reportType === "trial-balance" ? (
        <Card className="rounded-xl bg-white/95 p-3">
          <div className="max-w-sm">
            <Input label="Filter accounts" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by code, account, or type" />
          </div>
        </Card>
      ) : null}

      {!snapshot.backendReady && !loading ? (
        <Card className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          This report needs live accounting data from the backend. No preview-only totals are being shown here.
        </Card>
      ) : null}

      {reportType === "trial-balance" && <TrialBalanceReport snapshot={snapshot} query={query} basePath={basePath} hasInvoiceFilter={hasInvoiceFilter} invoiceLabel={invoiceFilterNumber || `#${invoiceFilterId}`} invoiceId={invoiceFilterId} />}
      {reportType === "profit-loss" && <ProfitLossReport snapshot={snapshot} basePath={basePath} />}
      {reportType === "balance-sheet" && <BalanceSheetReport snapshot={snapshot} basePath={basePath} />}
      {reportType === "cash-flow" && <CashFlowReport snapshot={snapshot} />}
      {reportType === "receivables-aging" && <AgingReport snapshot={snapshot} kind="receivables" basePath={basePath} />}
      {reportType === "payables-aging" && <AgingReport snapshot={snapshot} kind="payables" basePath={basePath} />}
      {reportType === "vat-summary" && <VatSummaryReport snapshot={snapshot} basePath={basePath} />}
    </div>
  );
}

/* ─── Trial Balance ─── */
function TrialBalanceReport({ snapshot, query, basePath, hasInvoiceFilter, invoiceLabel, invoiceId }: { snapshot: ReportsSnapshot; query: string; basePath: string; hasInvoiceFilter: boolean; invoiceLabel: string; invoiceId: number }) {
  const rows = snapshot.trialBalance.filter((row) => {
    const haystack = `${row.code} ${row.name} ${row.type}`.toLowerCase();
    return !query.trim() || haystack.includes(query.toLowerCase());
  });
  const totalDebit = rows.reduce((s, r) => s + (r.debitTotal ?? 0), 0);
  const totalCredit = rows.reduce((s, r) => s + (r.creditTotal ?? 0), 0);

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <KpiCard title="Accounts" value={String(snapshot.trialBalance.length)} />
        <KpiCard title="Total Debits" value={`${currency(totalDebit)} SAR`} />
        <KpiCard title="Total Credits" value={`${currency(totalCredit)} SAR`} />
      </div>
      <WorkspaceDataTable
        registerTableId="report-trial-balance"
        title="Trial Balance"
        caption={hasInvoiceFilter ? `Delta impact of Invoice ${invoiceLabel}.` : "All accounts with posted activity."}
        rows={rows}
        emptyMessage="Posted journal lines will populate the trial balance."
        columns={[
          { id: "code", header: "Code", defaultWidth: 88, render: (r) => r.code },
          {
            id: "account",
            header: "Account",
            defaultWidth: 220,
            render: (r) => (
              <Link href={mapWorkspaceHref(`/workspace/accounting/books?account=${encodeURIComponent(`${r.code} ${r.name}`)}${hasInvoiceFilter ? `&invoice_id=${invoiceId}&invoice_number=${encodeURIComponent(invoiceLabel)}` : ""}`, basePath)} className="font-semibold text-primary hover:underline">
                {r.name}
              </Link>
            ),
          },
          { id: "type", header: "Type", defaultWidth: 100, render: (r) => r.type },
          { id: "debit", header: "Debit", align: "right", defaultWidth: 110, render: (r) => `${currency(r.debitTotal ?? 0)} SAR` },
          { id: "credit", header: "Credit", align: "right", defaultWidth: 110, render: (r) => `${currency(r.creditTotal ?? 0)} SAR` },
          { id: "balance", header: "Balance", align: "right", defaultWidth: 110, render: (r) => `${currency(r.balance)} SAR` },
        ]}
      />
      <Card className="rounded-xl bg-white/95 p-0 overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-base font-semibold text-ink">Totals</h2>
          <p className="mt-0.5 text-xs leading-5 text-muted">Visible debit and credit totals for the current trial balance selection.</p>
        </div>
        <div className="grid gap-2 px-4 py-3 sm:grid-cols-3 text-sm">
          <div className="rounded-lg border border-line bg-surface-soft/35 px-3 py-2"><span className="text-muted">Accounts</span><div className="mt-1 font-semibold text-ink">{rows.length}</div></div>
          <div className="rounded-lg border border-line bg-surface-soft/35 px-3 py-2"><span className="text-muted">Debit total</span><div className="mt-1 font-semibold text-ink">{currency(totalDebit)} SAR</div></div>
          <div className="rounded-lg border border-line bg-surface-soft/35 px-3 py-2"><span className="text-muted">Credit total</span><div className="mt-1 font-semibold text-ink">{currency(totalCredit)} SAR</div></div>
        </div>
      </Card>
    </>
  );
}

/* ─── Profit & Loss ─── */
function ProfitLossReport({ snapshot, basePath }: { snapshot: ReportsSnapshot; basePath: string }) {
  const pl = snapshot.profitLoss;
  const revenueLines = pl.lines.filter((line) => line.type === "income" || line.type === "revenue");
  const discountLines = pl.lines.filter((line) => line.type === "contra" || line.code === "450");
  const expenseLines = pl.lines.filter((line) => line.type === "expense");
  const cogsLines = expenseLines.filter((line) => line.code === "500");
  const operatingExpenseLines = expenseLines.filter((line) => line.code !== "500");
  const cogsTotal = cogsLines.reduce((sum, line) => sum + line.netAmount, 0);
  const discountTotal = discountLines.reduce((sum, line) => sum + Math.abs(line.netAmount), 0);
  const grossProfit = pl.revenueTotal - cogsTotal;
  return (
    <>
      <div className="grid grid-cols-5 gap-2">
        <KpiCard title="Revenue" value={`${currency(pl.revenueTotal)} SAR`} />
        <KpiCard title="Discounts" value={`${currency(discountTotal)} SAR`} positive={false} />
        <KpiCard title="COGS" value={`${currency(cogsTotal)} SAR`} />
        <KpiCard title="Gross Profit" value={`${currency(grossProfit)} SAR`} positive={grossProfit >= 0} />
        <KpiCard title="Net Profit" value={`${currency(pl.netProfit)} SAR`} positive={pl.netProfit >= 0} />
      </div>
      <div className="grid gap-2.5 xl:grid-cols-3">
        <WorkspaceDataTable
          registerTableId="report-pl-revenue"
          title="Revenue Lines"
          caption="Revenue accounts included in P&L."
          rows={revenueLines}
          emptyMessage="Revenue will appear after tax invoices are posted."
          columns={[
            { id: "code", header: "Code", defaultWidth: 88, render: (r) => r.code },
            {
              id: "account",
              header: "Account",
              defaultWidth: 220,
              render: (r) => (
                <Link href={mapWorkspaceHref(`/workspace/accounting/books?account=${encodeURIComponent(`${r.code} ${r.name}`)}`, basePath)} className="font-semibold text-primary hover:underline">
                  {r.name}
                </Link>
              ),
            },
            { id: "net", header: "Net Amount", align: "right", defaultWidth: 120, render: (r) => `${currency(r.netAmount)} SAR` },
          ]}
        />
        <WorkspaceDataTable
          registerTableId="report-pl-discount"
          title="Discount Lines"
          caption="Contra-revenue and discount allowed lines affecting realized sales."
          rows={discountLines}
          emptyMessage="Discount lines appear when contra-revenue accounts are posted."
          columns={[
            { id: "code", header: "Code", defaultWidth: 88, render: (r) => r.code },
            {
              id: "account",
              header: "Account",
              defaultWidth: 220,
              render: (r) => (
                <Link href={mapWorkspaceHref(`/workspace/accounting/books?account=${encodeURIComponent(`${r.code} ${r.name}`)}`, basePath)} className="font-semibold text-primary hover:underline">
                  {r.name}
                </Link>
              ),
            },
            { id: "net", header: "Net Amount", align: "right", defaultWidth: 120, render: (r) => `${currency(Math.abs(r.netAmount))} SAR` },
          ]}
        />
        <WorkspaceDataTable
          registerTableId="report-pl-cogs-expense"
          title="COGS + Expense Lines"
          caption="Cost of goods sold and operating expenses."
          rows={expenseLines}
          emptyMessage="COGS and expenses will appear after delivery and purchase posting."
          columns={[
            { id: "code", header: "Code", defaultWidth: 88, render: (r) => r.code },
            {
              id: "account",
              header: "Account",
              defaultWidth: 220,
              render: (r) => (
                <Link href={mapWorkspaceHref(`/workspace/accounting/books?account=${encodeURIComponent(`${r.code} ${r.name}`)}`, basePath)} className="font-semibold text-primary hover:underline">
                  {r.name}
                </Link>
              ),
            },
            { id: "net", header: "Net Amount", align: "right", defaultWidth: 120, render: (r) => `${currency(r.netAmount)} SAR` },
          ]}
        />
      </div>
      <div className="grid gap-2.5 xl:grid-cols-2">
        <WorkspaceDataTable
          registerTableId="report-pl-cogs"
          title="Cost of Goods Sold"
          caption="Inventory relief and cost postings linked to fulfilled inventory documents."
          rows={cogsLines}
          emptyMessage="COGS lines appear when inventory-linked sales are posted."
          columns={[
            { id: "code", header: "Code", defaultWidth: 88, render: (r) => r.code },
            {
              id: "account",
              header: "Account",
              defaultWidth: 220,
              render: (r) => (
                <Link href={mapWorkspaceHref(`/workspace/accounting/books?account=${encodeURIComponent(`${r.code} ${r.name}`)}`, basePath)} className="font-semibold text-primary hover:underline">
                  {r.name}
                </Link>
              ),
            },
            { id: "amount", header: "Amount", align: "right", defaultWidth: 120, render: (r) => `${currency(r.netAmount)} SAR` },
          ]}
        />
        <WorkspaceDataTable
          registerTableId="report-pl-opex"
          title="Operating Expenses"
          caption="Expense lines excluding inventory cost so accountants can review margin separately from overhead."
          rows={operatingExpenseLines}
          emptyMessage="Operating expense lines appear after expense and purchase activity is posted."
          columns={[
            { id: "code", header: "Code", defaultWidth: 88, render: (r) => r.code },
            {
              id: "account",
              header: "Account",
              defaultWidth: 220,
              render: (r) => (
                <Link href={mapWorkspaceHref(`/workspace/accounting/books?account=${encodeURIComponent(`${r.code} ${r.name}`)}`, basePath)} className="font-semibold text-primary hover:underline">
                  {r.name}
                </Link>
              ),
            },
            { id: "amount", header: "Amount", align: "right", defaultWidth: 120, render: (r) => `${currency(r.netAmount)} SAR` },
          ]}
        />
      </div>
      <WorkspaceDataTable
        registerTableId="report-pl-all"
        title="Profit & Loss Lines"
        caption="Posted P&L lines for the current period."
        rows={pl.lines}
        emptyMessage="Revenue and expense lines will appear after posting activity."
        columns={[
          { id: "code", header: "Code", defaultWidth: 88, render: (r) => r.code },
          {
            id: "account",
            header: "Account",
            defaultWidth: 200,
            render: (r) => (
              <Link href={mapWorkspaceHref(`/workspace/accounting/books?account=${encodeURIComponent(`${r.code} ${r.name}`)}`, basePath)} className="font-semibold text-primary hover:underline">
                {r.name}
              </Link>
            ),
          },
          { id: "type", header: "Type", defaultWidth: 100, render: (r) => r.type },
          { id: "net", header: "Net Amount", align: "right", defaultWidth: 120, render: (r) => `${currency(r.netAmount)} SAR` },
        ]}
      />
    </>
  );
}

/* ─── Balance Sheet ─── */
function BalanceSheetReport({ snapshot, basePath }: { snapshot: ReportsSnapshot; basePath: string }) {
  const bs = snapshot.balanceSheet;
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <KpiCard title="Total Assets" value={`${currency(bs.assetTotal)} SAR`} />
        <KpiCard title="Total Liabilities" value={`${currency(bs.liabilityTotal)} SAR`} />
        <KpiCard title="Total Equity" value={`${currency(bs.equityTotal)} SAR`} />
      </div>
      <div className="grid gap-2.5 xl:grid-cols-2">
        <WorkspaceDataTable registerTableId="report-bs-assets" title="Assets" caption="Asset accounts and balances." rows={bs.assets} emptyMessage="No asset accounts." columns={[
          { id: "code", header: "Code", defaultWidth: 88, render: (r) => r.code },
          { id: "name", header: "Name", defaultWidth: 220, render: (r) => <Link href={mapWorkspaceHref(`/workspace/accounting/books?account=${encodeURIComponent(`${r.code} ${r.name}`)}`, basePath)} className="font-semibold text-primary hover:underline">{r.name}</Link> },
          { id: "balance", header: "Balance", align: "right", defaultWidth: 120, render: (r) => `${currency(r.balance)} SAR` },
        ]} />
        <WorkspaceDataTable registerTableId="report-bs-liabilities" title="Liabilities" caption="Liability accounts and balances." rows={bs.liabilities} emptyMessage="No liability accounts." columns={[
          { id: "code", header: "Code", defaultWidth: 88, render: (r) => r.code },
          { id: "name", header: "Name", defaultWidth: 220, render: (r) => <Link href={mapWorkspaceHref(`/workspace/accounting/books?account=${encodeURIComponent(`${r.code} ${r.name}`)}`, basePath)} className="font-semibold text-primary hover:underline">{r.name}</Link> },
          { id: "balance", header: "Balance", align: "right", defaultWidth: 120, render: (r) => `${currency(r.balance)} SAR` },
        ]} />
      </div>
      <WorkspaceDataTable registerTableId="report-bs-equity" title="Equity" caption="Equity accounts and balances." rows={bs.equity} emptyMessage="No equity accounts." columns={[
        { id: "code", header: "Code", defaultWidth: 88, render: (r) => r.code },
        { id: "name", header: "Name", defaultWidth: 220, render: (r) => <Link href={mapWorkspaceHref(`/workspace/accounting/books?account=${encodeURIComponent(`${r.code} ${r.name}`)}`, basePath)} className="font-semibold text-primary hover:underline">{r.name}</Link> },
        { id: "balance", header: "Balance", align: "right", defaultWidth: 120, render: (r) => `${currency(r.balance)} SAR` },
      ]} />
    </>
  );
}

/* ─── Cash Flow ─── */
function CashFlowReport({ snapshot }: { snapshot: ReportsSnapshot }) {
  // Derive a simplified cash flow from the available data
  const pl = snapshot.profitLoss;
  const sections = [
    { activity: "Operating", amount: pl.netProfit, note: "Net profit from operations" },
    { activity: "Investing", amount: 0, note: "Capital expenditure (not yet tracked)" },
    { activity: "Financing", amount: 0, note: "Debt/equity changes (not yet tracked)" },
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <KpiCard title="Net Cash from Operations" value={`${currency(pl.netProfit)} SAR`} />
        <KpiCard title="Net Change in Cash" value={`${currency(pl.netProfit)} SAR`} />
      </div>
      <WorkspaceDataTable
        registerTableId="report-cash-flow"
        title="Cash Flow by Activity"
        caption="Simplified cash flow statement. Full indirect method will be available when bank reconciliation is connected."
        rows={sections}
        emptyMessage="Cash flow data will appear after posting activity."
        columns={[
          { id: "activity", header: "Activity", defaultWidth: 140, render: (r) => r.activity },
          { id: "amount", header: "Amount", align: "right", defaultWidth: 120, render: (r) => `${currency(r.amount)} SAR` },
          { id: "note", header: "Note", defaultWidth: 280, render: (r) => r.note },
        ]}
      />
    </>
  );
}

/* ─── Aging Report ─── */
function AgingReport({ snapshot, kind, basePath }: { snapshot: ReportsSnapshot; kind: "receivables" | "payables"; basePath: string }) {
  const rows = kind === "receivables" ? snapshot.receivablesAging : snapshot.payablesAging;
  const total = rows.reduce((s, r) => s + r.balanceDue, 0);
  const label = kind === "receivables" ? "Receivables" : "Payables";

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <KpiCard title={`Open ${label}`} value={String(rows.length)} />
        <KpiCard title={`Total ${label}`} value={`${currency(total)} SAR`} />
      </div>
      <WorkspaceDataTable
        registerTableId={`report-aging-${kind}`}
        title={`${label} Aging`}
        caption={`Open ${kind === "receivables" ? "customer" : "supplier"} balances grouped by age.`}
        rows={rows}
        emptyMessage={`Open ${kind} balances will appear after posting activity.`}
        columns={[
          {
            id: "document",
            header: "Document",
            defaultWidth: 160,
            render: (r) => (
              <Link
                href={mapWorkspaceHref(`${kind === "receivables" ? "/workspace/user/invoices" : "/workspace/user/bills"}?q=${encodeURIComponent(r.documentNumber)}`, basePath)}
                className="font-semibold text-primary hover:underline"
              >
                {r.documentNumber}
              </Link>
            ),
          },
          { id: "bucket", header: "Bucket", defaultWidth: 120, render: (r) => r.bucket.replaceAll("_", "-") },
          { id: "balance", header: "Balance Due", align: "right", defaultWidth: 120, render: (r) => `${currency(r.balanceDue)} SAR` },
        ]}
      />
    </>
  );
}

/* ─── VAT Summary ─── */
function VatSummaryReport({ snapshot, basePath }: { snapshot: ReportsSnapshot; basePath: string }) {
  const totalTax = snapshot.vatSummary.reduce((s, r) => s + r.taxAmount, 0);
  const totalTaxable = snapshot.vatSummary.reduce((s, r) => s + r.taxableAmount, 0);
  const vatReceived = snapshot.vatDetail.reduce((sum, row) => sum + row.outputTaxAmount, 0);
  const vatPaid = snapshot.vatDetail.reduce((sum, row) => sum + row.inputTaxAmount, 0);
  const vatPayable = vatReceived - vatPaid;

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        <KpiCard title="Tax Codes" value={String(snapshot.vatSummary.length)} />
        <KpiCard title="Total Taxable" value={`${currency(totalTaxable)} SAR`} />
        <KpiCard title="VAT Received" value={`${currency(vatReceived)} SAR`} />
        <KpiCard title="VAT Payable" value={`${currency(vatPayable)} SAR`} positive={vatPayable >= 0} />
      </div>
      <div className="grid gap-2 xl:grid-cols-3">
        <KpiCard title="VAT Received" value={`${currency(vatReceived)} SAR`} />
        <KpiCard title="VAT Paid" value={`${currency(vatPaid)} SAR`} />
        <KpiCard title="VAT Payable" value={`${currency(vatPayable)} SAR`} positive={vatPayable >= 0} />
      </div>
      <Card className="rounded-xl bg-white/95 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-ink">VAT drill-down</p>
            <p className="mt-0.5 text-muted">Review output VAT, input VAT, and filing position directly from posted invoices, bills, and VAT ledger lines.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={mapWorkspaceHref(`/workspace/accounting/books?q=${encodeURIComponent("vat tax")}`, basePath)} className="rounded-md border border-line bg-white px-2.5 py-1 font-medium text-ink hover:bg-surface-soft/30">Open VAT ledger</Link>
            <Link href={mapWorkspaceHref("/workspace/user/reports/receivables-aging", basePath)} className="rounded-md border border-line bg-white px-2.5 py-1 font-medium text-ink hover:bg-surface-soft/30">Open receivables</Link>
          </div>
        </div>
      </Card>
      <WorkspaceDataTable
        registerTableId="report-vat-summary"
        title="VAT Summary"
        caption={`Tax amounts by VAT code. Total tax ${currency(totalTax)} SAR.`}
        rows={snapshot.vatSummary}
        emptyMessage="VAT activity will appear after posting invoices and bills."
        columns={[
          { id: "code", header: "Code", defaultWidth: 100, render: (r) => r.code },
          { id: "name", header: "Name", defaultWidth: 220, render: (r) => r.name },
          { id: "rate", header: "Rate", align: "right", defaultWidth: 80, render: (r) => `${r.rate}%` },
          { id: "taxable", header: "Taxable", align: "right", defaultWidth: 140, render: (r) => `${currency(r.taxableAmount)} SAR` },
          { id: "tax", header: "Tax", align: "right", defaultWidth: 140, render: (r) => `${currency(r.taxAmount)} SAR` },
        ]}
      />
      <WorkspaceDataTable
        registerTableId="report-vat-detail"
        title="VAT Detail"
        caption="Output and input VAT by code for accountant review and filing traceability."
        rows={snapshot.vatDetail}
        emptyMessage="VAT detail appears after posted invoice and purchase activity."
        columns={[
          { id: "code", header: "Code", defaultWidth: 90, render: (r) => r.code },
          { id: "name", header: "Name", defaultWidth: 180, render: (r) => r.name },
          { id: "outTaxable", header: "Output Taxable", align: "right", defaultWidth: 130, render: (r) => `${currency(r.outputTaxableAmount)} SAR` },
          { id: "outVat", header: "Output VAT", align: "right", defaultWidth: 120, render: (r) => `${currency(r.outputTaxAmount)} SAR` },
          { id: "inTaxable", header: "Input Taxable", align: "right", defaultWidth: 130, render: (r) => `${currency(r.inputTaxableAmount)} SAR` },
          { id: "inVat", header: "Input VAT", align: "right", defaultWidth: 120, render: (r) => `${currency(r.inputTaxAmount)} SAR` },
        ]}
      />
      <div className="grid gap-2.5 xl:grid-cols-2">
        <WorkspaceDataTable
          registerTableId="report-vat-received-details"
          title="VAT Received Details"
          caption="Customer-side VAT collected from tax invoices and debit notes."
          rows={snapshot.vatReceivedDetails}
          emptyMessage="VAT received details will appear after sales documents are finalized."
          columns={[
            { id: "invoice", header: "Invoice", defaultWidth: 128, render: (r) => r.invoiceNumber },
            { id: "date", header: "Date", defaultWidth: 110, render: (r) => r.date },
            { id: "customer", header: "Customer", defaultWidth: 200, render: (r) => r.customer || "—" },
            { id: "taxable", header: "Taxable", align: "right", defaultWidth: 130, render: (r) => `${currency(r.taxableAmount)} SAR` },
            { id: "vat", header: "VAT", align: "right", defaultWidth: 120, render: (r) => `${currency(r.vatAmount)} SAR` },
          ]}
        />
        <WorkspaceDataTable
          registerTableId="report-vat-paid-details"
          title="VAT Paid Details"
          caption="Supplier-side VAT recoverable from bills and purchase invoices."
          rows={snapshot.vatPaidDetails}
          emptyMessage="VAT paid details will appear after purchase documents are finalized."
          columns={[
            { id: "reference", header: "Reference", defaultWidth: 130, render: (r) => r.reference },
            { id: "date", header: "Date", defaultWidth: 110, render: (r) => r.date },
            { id: "vendor", header: "Vendor", defaultWidth: 200, render: (r) => r.vendor || "—" },
            { id: "category", header: "Category", defaultWidth: 120, render: (r) => r.category || "—" },
            { id: "vat", header: "VAT", align: "right", defaultWidth: 120, render: (r) => `${currency(r.vatAmount)} SAR` },
          ]}
        />
      </div>
    </>
  );
}

/* ─── Shared KPI Card ─── */
function KpiCard({ title, value, positive }: { title: string; value: string; positive?: boolean }) {
  return (
    <Card className="rounded-lg bg-white/95 p-2.5">
      <p className="text-[10px] font-semibold text-muted">{title}</p>
      <p className={`text-sm font-bold ${positive === false ? "text-red-700" : "text-ink"}`}>{value}</p>
    </Card>
  );
}
