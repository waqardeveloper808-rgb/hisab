"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { StandardActionBar } from "@/components/workspace/StandardActionBar";

type SupplierPaymentRow = {
  id: string;
  date: string;
  number: string;
  vendor: string;
  amount: number;
  method: string;
  linkedBill: string | null;
  status: "applied" | "unapplied" | "partial";
};

const SAMPLE_PAYMENTS: SupplierPaymentRow[] = [
  { id: "SP-001", date: "2026-04-14", number: "PAY-V-001", vendor: "Al Rashid Trading", amount: 5750, method: "Bank Transfer", linkedBill: "BILL-003", status: "applied" },
  { id: "SP-002", date: "2026-04-11", number: "PAY-V-002", vendor: "Gulf Office Supplies", amount: 1200, method: "Cash", linkedBill: null, status: "unapplied" },
  { id: "SP-003", date: "2026-04-09", number: "PAY-V-003", vendor: "Technical Solutions Ltd", amount: 8500, method: "Bank Transfer", linkedBill: "BILL-007", status: "partial" },
];

export function SupplierPaymentsRegister() {
  const [selected, setSelected] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ vendor: "", amount: "", method: "Bank Transfer", linkedBill: "", date: "2026-04-18" });

  const filtered = useMemo(() => {
    if (!search) return SAMPLE_PAYMENTS;
    return SAMPLE_PAYMENTS.filter((p) =>
      p.number.toLowerCase().includes(search.toLowerCase()) ||
      p.vendor.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const selectedPayment = selected ? filtered.find((p) => p.id === selected) : null;

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-semibold text-ink">Supplier Payments</h1>
          <span className="rounded bg-surface-soft px-1.5 py-0.5 text-[10px] font-semibold text-muted">{filtered.length}</span>
        </div>
        <div className="flex gap-1.5">
          <Button size="xs" variant="muted" onClick={() => setFiltersOpen(!filtersOpen)}>
            {filtersOpen ? "Hide Filters" : "Filters"}
          </Button>
          <Button size="xs" variant="primary" onClick={() => setShowCreate((current) => !current)}>{showCreate ? "Close" : "Record Payment"}</Button>
          <StandardActionBar compact actions={[
            { label: "Edit", onClick: () => setShowCreate(true), disabled: !selectedPayment },
            { label: "Save", onClick: () => setShowCreate(false), disabled: !showCreate },
            { label: "Delete", onClick: () => setSelected(null), disabled: !selectedPayment },
            { label: "Export", onClick: () => {} },
          ]} />
        </div>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
            <Input label="Vendor" value={draft.vendor} onChange={(event) => setDraft((current) => ({ ...current, vendor: event.target.value }))} />
            <Input label="Payment date" type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} />
            <Input label="Amount" type="number" value={draft.amount} onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))} />
            <Input label="Linked bill" value={draft.linkedBill} onChange={(event) => setDraft((current) => ({ ...current, linkedBill: event.target.value }))} />
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Method</label>
              <select value={draft.method} onChange={(event) => setDraft((current) => ({ ...current, method: event.target.value }))} className="block h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink">
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>Cheque</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {filtersOpen && (
        <div className="grid gap-2 rounded-md border border-line bg-surface-soft/30 px-2.5 py-2 lg:grid-cols-3">
          <Input label="Search payments" placeholder="Payment or vendor" value={search} onChange={(e) => setSearch(e.target.value)} inputClassName="h-9 rounded-lg px-3 text-sm" />
          <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Status</label>
          <select className="block h-9 w-full rounded-lg border border-line bg-white px-3 text-sm">
            <option>All Statuses</option>
            <option>Applied</option>
            <option>Unapplied</option>
            <option>Partial</option>
          </select>
          </div>
          <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Method</label>
          <select className="block h-9 w-full rounded-lg border border-line bg-white px-3 text-sm">
            <option>All Methods</option>
            <option>Bank Transfer</option>
            <option>Cash</option>
            <option>Check</option>
          </select>
          </div>
        </div>
      )}

      {/* Register + Preview Split */}
      <div className={`grid gap-2 ${selectedPayment ? "grid-cols-[1fr_1fr]" : "grid-cols-1"}`}>
        {/* Register */}
        <div className="rounded-md border border-line bg-white overflow-hidden">
          <div className="grid grid-cols-[0.8fr_1fr_1.5fr_0.8fr_0.7fr_0.6fr] gap-1 px-2 py-1 border-b border-line bg-surface-soft/30 text-[9px] font-bold uppercase tracking-wider text-muted">
            <span>Number</span>
            <span>Date</span>
            <span>Vendor</span>
            <span className="text-right">Amount</span>
            <span>Method</span>
            <span className="text-right">Status</span>
          </div>
          {filtered.map((pay) => (
            <button
              key={pay.id}
              type="button"
              onClick={() => setSelected(selected === pay.id ? null : pay.id)}
              className={`grid w-full grid-cols-[0.8fr_1fr_1.5fr_0.8fr_0.7fr_0.6fr] gap-1 px-2 py-1.5 text-left transition hover:bg-surface-soft/30 ${selected === pay.id ? "bg-primary-soft/10 border-l-2 border-l-primary" : "border-b border-line"}`}
            >
              <span className="text-xs font-semibold text-primary">{pay.number}</span>
              <span className="text-[11px] text-muted">{pay.date}</span>
              <span className="text-[11px] text-ink truncate">{pay.vendor}</span>
              <span className="text-[11px] text-right font-medium text-ink">SAR {pay.amount.toLocaleString()}</span>
              <span className="text-[10px] text-muted">{pay.method}</span>
              <span className="text-right">
                <span className={`inline-block rounded px-1 py-0.5 text-[9px] font-bold ${
                  pay.status === "applied" ? "bg-green-100 text-green-800" :
                  pay.status === "partial" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {pay.status}
                </span>
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-muted">No supplier payments found.</p>
          )}
        </div>

        {/* Preview Panel */}
        {selectedPayment && (
          <div className="rounded-md border border-line bg-white p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-ink">{selectedPayment.number}</h2>
              <button type="button" onClick={() => setSelected(null)} className="text-[10px] text-muted hover:text-ink">Close</button>
            </div>
            <div className="space-y-1 text-[11px]">
              <p><strong>Date:</strong> {selectedPayment.date}</p>
              <p><strong>Vendor:</strong> {selectedPayment.vendor}</p>
              <p><strong>Amount:</strong> SAR {selectedPayment.amount.toLocaleString()}</p>
              <p><strong>Method:</strong> {selectedPayment.method}</p>
              <p><strong>Status:</strong> {selectedPayment.status}</p>
              {selectedPayment.linkedBill && <p><strong>Linked Bill:</strong> {selectedPayment.linkedBill}</p>}
            </div>
            {/* Action Bar */}
            <div className="space-y-2 border-t border-line pt-2">
              <div className="flex flex-wrap gap-1.5">
                {selectedPayment.status === "unapplied" && <Button size="xs" variant="primary">Link to Bill</Button>}
                <Button size="xs" variant="secondary">View Journal</Button>
                <Button size="xs" variant="secondary">View Reports</Button>
              </div>
              <StandardActionBar compact actions={[
                { label: "Edit", onClick: () => setShowCreate(true) },
                { label: "Save", onClick: () => setShowCreate(false), disabled: true },
                { label: "Delete", onClick: () => setSelected(null), variant: "muted" },
                { label: "Export", onClick: () => {} },
              ]} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
