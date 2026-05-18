"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import {
  getReportIntelligence,
  getReportsSnapshot,
  listVatPaidDetails,
  listVatReceivedDetails,
  type IntelligenceSnapshot,
  type ReportsSnapshot,
  type VatPaidDetailRecord,
  type VatReceivedDetailRecord,
} from "@/lib/workspace-api";
import { currency } from "@/components/workflow/utils";

function isWorkspacePreviewMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.search.includes("mode=preview")
    || document.cookie.includes("workspace_mode=preview")
    || document.body.dataset.workspaceMode === "preview"
  );
}

function parseLedgerMetaAmount(value: string | undefined): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function sumVatAmounts(rows: Array<{ vatAmount: number }>) {
  return rows.reduce((sum, row) => sum + row.vatAmount, 0);
}

const emptyState: ReportsSnapshot = {
  vatSummary: [],
  vatReconciliationMeta: null,
  vatDetail: [],
  vatReceivedDetails: [],
  vatReceivedLineDetails: [],
  cashFlow: null,
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

export function VatOverview() {
  const previewMode = isWorkspacePreviewMode();
  const [snapshot, setSnapshot] = useState<ReportsSnapshot>(emptyState);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [received, setReceived] = useState<VatReceivedDetailRecord[]>([]);
  const [paid, setPaid] = useState<VatPaidDetailRecord[]>([]);
  const [intelligence, setIntelligence] = useState<IntelligenceSnapshot | null>(null);

  useEffect(() => {
    getReportsSnapshot()
      .then(setSnapshot)
      .catch((err: unknown) => {
        console.error("[VatOverview] getReportsSnapshot failed:", err);
        setSnapshot(emptyState);
      });
  }, []);

  useEffect(() => {
    if (previewMode) {
      return;
    }
    void getReportIntelligence().then(setIntelligence).catch(() => {});
  }, [previewMode]);

  useEffect(() => {
    const filters = {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    };

    Promise.all([
      listVatReceivedDetails(filters),
      listVatPaidDetails(filters),
    ])
      .then(([receivedRows, paidRows]) => {
        setReceived(receivedRows);
        setPaid(paidRows);
      })
      .catch((err: unknown) => {
        console.error("[VatOverview] VAT detail lists failed:", err);
        setReceived([]);
        setPaid([]);
      });
  }, [fromDate, toDate]);

  const hasPeriodFilter = Boolean(fromDate || toDate);
  const receivedDetailRows = hasPeriodFilter ? received : (snapshot.vatReceivedDetails.length > 0 ? snapshot.vatReceivedDetails : received);
  const paidDetailRows = hasPeriodFilter ? paid : (snapshot.vatPaidDetails.length > 0 ? snapshot.vatPaidDetails : paid);

  let vatReceived: number;
  let vatPaid: number;
  if (hasPeriodFilter) {
    vatReceived = sumVatAmounts(received);
    vatPaid = sumVatAmounts(paid);
  } else {
    const ledgerReceived = parseLedgerMetaAmount(snapshot.vatReconciliationMeta?.vatReceived);
    const ledgerPaid = parseLedgerMetaAmount(snapshot.vatReconciliationMeta?.vatPaid);
    if (ledgerReceived !== null && ledgerPaid !== null) {
      vatReceived = ledgerReceived;
      vatPaid = ledgerPaid;
    } else {
      vatReceived = sumVatAmounts(snapshot.vatReceivedDetails.length > 0 ? snapshot.vatReceivedDetails : received);
      vatPaid = sumVatAmounts(snapshot.vatPaidDetails.length > 0 ? snapshot.vatPaidDetails : paid);
    }
  }
  const vatPayable = vatReceived - vatPaid;

  const showVatEmptyState =
    snapshot.backendReady
    && !hasPeriodFilter
    && !snapshot.vatReconciliationMeta
    && snapshot.vatSummary.length === 0
    && receivedDetailRows.length === 0
    && paidDetailRows.length === 0;
  const displayedIntelligence = previewMode ? null : intelligence;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">VAT and compliance</p>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Tax position from posted sales and purchases</h1>
      </div>

      <Card className="rounded-xl bg-white/95 p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink" htmlFor="vat-from-date">From</label>
            <input id="vat-from-date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="rounded-md border border-line bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink" htmlFor="vat-to-date">To</label>
            <input id="vat-to-date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="rounded-md border border-line bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-primary" />
          </div>
          <Button variant="secondary" size="xs" onClick={() => { setFromDate(""); setToDate(""); }}>Reset period</Button>
        </div>
      </Card>

      <div className="grid gap-2.5 lg:grid-cols-[1fr_1fr_0.9fr]">
        <Card className="rounded-xl border-l-4 border-l-emerald-500/80 bg-white/95 p-3" data-inspector-vat-section="received">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">VAT Received</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {showVatEmptyState ? "—" : `${currency(vatReceived)} SAR`}
          </p>
          <p className="mt-1 text-xs text-muted">
            {hasPeriodFilter
              ? `${received.length} output-VAT documents in the filtered period`
              : `${receivedDetailRows.length} output-VAT documents (ledger totals match VAT summary)`}
          </p>
          <div className="mt-3">
            <Link
              href="/workspace/user/vat/received"
              className="inline-flex items-center rounded-md border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink shadow-sm outline-none ring-primary/30 transition hover:border-primary/35 hover:text-primary focus-visible:ring-2"
              data-testid="vat-received-open-register"
            >
              See details
            </Link>
          </div>
        </Card>

        <Card className="rounded-xl border-l-4 border-l-sky-500/80 bg-white/95 p-3" data-inspector-vat-section="paid">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">VAT Paid</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {showVatEmptyState ? "—" : `${currency(vatPaid)} SAR`}
          </p>
          <p className="mt-1 text-xs text-muted">
            {hasPeriodFilter
              ? `${paid.length} input-VAT records in the filtered period`
              : `${paidDetailRows.length} input-VAT records (ledger totals match VAT summary)`}
          </p>
          <div className="mt-3">
            <Link
              href="/workspace/user/vat/paid"
              className="inline-flex items-center rounded-md border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink shadow-sm outline-none ring-primary/30 transition hover:border-primary/35 hover:text-primary focus-visible:ring-2"
              data-testid="vat-paid-open-register"
            >
              See details
            </Link>
          </div>
        </Card>

        <Card className="rounded-xl border border-primary/25 bg-primary-soft/40 p-3" data-inspector-vat-section="payable">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">VAT Payable</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {showVatEmptyState ? "—" : `${currency(vatPayable)} SAR`}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">VAT Payable = VAT Received - VAT Paid</p>
        </Card>
      </div>

      {snapshot.vatReconciliationMeta ? (
        <Card className="rounded-xl border border-line bg-surface-soft/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Posted ledger reconciliation</p>
          <p className="mt-1 text-xs text-muted">
            Payable account movement: received {snapshot.vatReconciliationMeta.vatReceived} SAR · receivable (input) {snapshot.vatReconciliationMeta.vatPaid} SAR · net payable {snapshot.vatReconciliationMeta.vatPayable} SAR
            {snapshot.vatReconciliationMeta.validationStatus ? ` · ${snapshot.vatReconciliationMeta.validationStatus}` : ""}
          </p>
        </Card>
      ) : null}

      <WorkspaceDataTable
        registerTableId="vat-dashboard-summary"
        title="VAT summary"
        caption="Taxable totals and tax totals by VAT code."
        rows={snapshot.vatSummary}
        emptyMessage="VAT summary rows will appear here when posted sales or purchases carry tax."
        columns={[
          { id: "code", header: "Code", defaultWidth: 100, render: (row) => row.code },
          { id: "name", header: "Name", defaultWidth: 220, render: (row) => row.name },
          { id: "rate", header: "Rate", align: "right", defaultWidth: 80, render: (row) => `${row.rate}%` },
          { id: "taxable", header: "Taxable", align: "right", defaultWidth: 140, render: (row) => `${currency(row.taxableAmount)} SAR` },
          { id: "tax", header: "Tax", align: "right", defaultWidth: 140, render: (row) => `${currency(row.taxAmount)} SAR` },
        ]}
      />

      {displayedIntelligence ? (
        <Card className="rounded-xl bg-white/95 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Filing intelligence</p>
              <h2 className="text-sm font-semibold text-ink">VAT review signals from posted source documents</h2>
            </div>
            <span className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-semibold text-muted">Confidence {displayedIntelligence.confidenceScore}%</span>
          </div>
          <div className="mt-3 grid gap-2 lg:grid-cols-3 text-xs">
            {displayedIntelligence.reminders.slice(0, 2).map((reminder) => <p key={reminder.label} className="rounded-lg border border-line px-2.5 py-2 text-muted">{reminder.label}: {reminder.reason}</p>)}
            {displayedIntelligence.suggestions.slice(0, 2).map((suggestion) => <p key={suggestion.label} className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-2 text-emerald-900">{suggestion.label}: {suggestion.reason}</p>)}
            {displayedIntelligence.anomalies.slice(0, 2).map((anomaly) => <p key={anomaly.message} className="rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-2 text-amber-900">{anomaly.message}</p>)}
          </div>
        </Card>
      ) : null}

    </div>
  );
}