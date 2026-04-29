"use client";

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

const emptyState: ReportsSnapshot = {
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

export function VatOverview() {
  const [snapshot, setSnapshot] = useState<ReportsSnapshot>(emptyState);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [received, setReceived] = useState<VatReceivedDetailRecord[]>([]);
  const [paid, setPaid] = useState<VatPaidDetailRecord[]>([]);
  const [openModal, setOpenModal] = useState<"received" | "paid" | null>(null);
  const [intelligence, setIntelligence] = useState<IntelligenceSnapshot | null>(null);

  useEffect(() => {
    getReportsSnapshot()
      .then(setSnapshot)
      .catch((err: unknown) => {
        console.error("[VatOverview] getReportsSnapshot failed:", err);
        setSnapshot(emptyState);
      });
    getReportIntelligence().then(setIntelligence).catch((err: unknown) => { console.error('[VatOverview] getReportIntelligence failed:', err); });
  }, []);

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

  const vatReceived = received.reduce((sum, row) => sum + row.vatAmount, 0);
  const vatPaid = paid.reduce((sum, row) => sum + row.vatAmount, 0);
  const vatPayable = vatReceived - vatPaid;

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
        <Card className="rounded-xl bg-white/95 p-3" data-inspector-vat-section="received">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">VAT Received</p>
          <p className="mt-1 text-2xl font-bold text-ink">{currency(vatReceived)} SAR</p>
          <p className="mt-1 text-xs text-muted">{received.length} invoices in the current period</p>
          <div className="mt-3">
            <Button size="xs" variant="secondary" onClick={() => setOpenModal("received")}>See details</Button>
          </div>
        </Card>

        <Card className="rounded-xl bg-white/95 p-3" data-inspector-vat-section="paid">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">VAT Paid</p>
          <p className="mt-1 text-2xl font-bold text-ink">{currency(vatPaid)} SAR</p>
          <p className="mt-1 text-xs text-muted">{paid.length} records in the current period</p>
          <div className="mt-3">
            <Button size="xs" variant="secondary" onClick={() => setOpenModal("paid")}>See details</Button>
          </div>
        </Card>

        <Card className="rounded-xl border border-primary/25 bg-primary-soft/40 p-3" data-inspector-vat-section="payable">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">VAT Payable</p>
          <p className="mt-1 text-2xl font-bold text-ink">{currency(vatPayable)} SAR</p>
          <p className="mt-1 text-xs leading-5 text-muted">VAT Payable = VAT Received - VAT Paid</p>
        </Card>
      </div>

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

      {intelligence ? (
        <Card className="rounded-xl bg-white/95 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Filing intelligence</p>
              <h2 className="text-sm font-semibold text-ink">VAT review signals from posted source documents</h2>
            </div>
            <span className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-semibold text-muted">Confidence {intelligence.confidenceScore}%</span>
          </div>
          <div className="mt-3 grid gap-2 lg:grid-cols-3 text-xs">
            {intelligence.reminders.slice(0, 2).map((reminder) => <p key={reminder.label} className="rounded-lg border border-line px-2.5 py-2 text-muted">{reminder.label}: {reminder.reason}</p>)}
            {intelligence.suggestions.slice(0, 2).map((suggestion) => <p key={suggestion.label} className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-2 text-emerald-900">{suggestion.label}: {suggestion.reason}</p>)}
            {intelligence.anomalies.slice(0, 2).map((anomaly) => <p key={anomaly.message} className="rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-2 text-amber-900">{anomaly.message}</p>)}
          </div>
        </Card>
      ) : null}

      {openModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4 py-6" role="dialog" aria-modal="true">
          <div className="max-h-[85vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white p-4 shadow-[0_30px_90px_-40px_rgba(17,32,24,0.55)]" data-inspector-vat-modal={openModal}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">{openModal === "received" ? "VAT Received" : "VAT Paid"} details</p>
                <h2 className="text-lg font-semibold text-ink">{openModal === "received" ? "Invoices filtered by current period" : "Expenses, purchases, and rent filtered by current period"}</h2>
              </div>
              <Button size="xs" variant="secondary" onClick={() => setOpenModal(null)}>Close</Button>
            </div>

            {openModal === "received" ? (
              <WorkspaceDataTable
                registerTableId="vat-dashboard-received-modal"
                title="VAT received details"
                caption="Full invoice list filtered by the current VAT screen period."
                rows={received}
                emptyMessage="No invoices matched the current VAT period."
                columns={[
                  { id: "invoice", header: "Invoice number", defaultWidth: 128, render: (row) => row.invoiceNumber },
                  { id: "date", header: "Date", defaultWidth: 110, render: (row) => row.date },
                  { id: "customer", header: "Customer", defaultWidth: 200, render: (row) => row.customer },
                  { id: "taxable", header: "Taxable amount", align: "right", defaultWidth: 130, render: (row) => `${currency(row.taxableAmount)} SAR` },
                  { id: "vat", header: "VAT amount", align: "right", defaultWidth: 120, render: (row) => `${currency(row.vatAmount)} SAR` },
                ]}
              />
            ) : (
              <WorkspaceDataTable
                registerTableId="vat-dashboard-paid-modal"
                title="VAT paid details"
                caption="Expenses, purchases, and rent filtered by the current VAT screen period."
                rows={paid}
                emptyMessage="No purchase-side VAT records matched the current VAT period."
                columns={[
                  { id: "reference", header: "Reference", defaultWidth: 130, render: (row) => row.reference },
                  { id: "date", header: "Date", defaultWidth: 110, render: (row) => row.date },
                  { id: "vendor", header: "Vendor", defaultWidth: 200, render: (row) => row.vendor },
                  { id: "category", header: "Category", defaultWidth: 120, render: (row) => row.category.replaceAll("_", " ") },
                  { id: "vat", header: "VAT amount", align: "right", defaultWidth: 120, render: (row) => `${currency(row.vatAmount)} SAR` },
                ]}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}