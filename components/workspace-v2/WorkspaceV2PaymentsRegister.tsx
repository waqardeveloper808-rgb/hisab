"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { findCustomer } from "@/data/workspace-v2/customers";
import { payments } from "@/data/workspace-v2/payments";
import { formatCurrency, formatDate, statusLabel, statusTone } from "@/lib/workspace-v2/format";
import { loadColumnVisibility, saveColumnVisibility } from "@/lib/workspace-v2/register-column-storage";
import { WorkspaceV2EmptyState } from "./WorkspaceV2EmptyState";
import { WorkspaceV2Suggestion } from "./WorkspaceV2Suggestion";
import { WorkspaceV2MoreActions } from "./WorkspaceV2MoreActions";
import { WorkspaceV2ColumnPicker, type ColumnDef } from "./WorkspaceV2ColumnPicker";

const REG_ID = "v2.register.customer-payments";
const COLUMNS: ColumnDef[] = [
  { id: "receipt", label: "Receipt No.", required: true },
  { id: "date", label: "Date" },
  { id: "customer", label: "Customer" },
  { id: "invoice", label: "Invoice" },
  { id: "method", label: "Method" },
  { id: "ref", label: "Reference" },
  { id: "status", label: "Status" },
  { id: "amount", label: "Amount" },
  { id: "actions", label: "Actions", required: true },
];
const DEFAULT_VIS = COLUMNS.map((c) => c.id);

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank transfer",
  card: "Card / Mada",
  cash: "Cash receipt",
  wallet: "Mobile wallet",
};

export function WorkspaceV2PaymentsRegister() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "cleared" | "pending">("all");
  const [visibleColIds, setVisibleColIds] = useState<string[]>(() =>
    typeof window === "undefined" ? DEFAULT_VIS : loadColumnVisibility(REG_ID, DEFAULT_VIS),
  );
  const setV = (n: string[]) => {
    setVisibleColIds(n);
    saveColumnVisibility(REG_ID, n);
  };
  const vs = new Set(visibleColIds);
  const show = (id: string) => vs.has(id);

  const rows = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return payments.filter((payment) => {
      const customer = findCustomer(payment.customerId);
      const matchesSearch =
        lower.length === 0 ||
        payment.number.toLowerCase().includes(lower) ||
        payment.invoiceNumber.toLowerCase().includes(lower) ||
        (customer?.legalName ?? "").toLowerCase().includes(lower);
      const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">Customer payments</h1>
          <p className="wsv2-page-subtitle">Receipts captured against issued invoices, with clearing status.</p>
        </div>
        <div className="wsv2-page-actions">
          <button
            type="button"
            className="wsv2-btn"
            disabled
            title="Preview mode only — not connected to receivables yet"
          >
            <Plus size={13} />
            Record customer payment
          </button>
        </div>
      </div>

      <WorkspaceV2Suggestion
        id="payments-register-tip"
        title="Reconcile payments against the source invoice"
        description="Each receipt is linked to a single invoice for a clean audit trail. Use the bank transfer method for SADAD or interbank transfers."
      />

      <div className="wsv2-card" style={{ marginTop: 14 }}>
        <div className="wsv2-toolbar">
          <label className="wsv2-toolbar-search">
            <Search size={14} color="var(--wsv2-ink-subtle)" />
            <input
              type="search"
              placeholder="Search by receipt, invoice or customer"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["all", "cleared", "pending"].map((option) => (
              <button
                key={option}
                type="button"
                className="wsv2-toolbar-filter"
                data-active={option === statusFilter ? "true" : "false"}
                onClick={() => setStatusFilter(option as "all" | "cleared" | "pending")}
              >
                {option === "all" ? "All" : statusLabel(option as "cleared" | "pending")}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11.5, color: "var(--wsv2-ink-subtle)" }}>
              {rows.length} of {payments.length}
            </span>
            <WorkspaceV2ColumnPicker columns={COLUMNS} visibleIds={visibleColIds} onChange={setV} />
          </div>
        </div>
        <div className="wsv2-table-scroll">
          {rows.length === 0 ? (
            <WorkspaceV2EmptyState title="No payments match the current filters" />
          ) : (
            <table className="wsv2-table">
              <thead>
                <tr>
                  {show("receipt") ? <th>Receipt No.</th> : null}
                  {show("date") ? <th>Date</th> : null}
                  {show("customer") ? <th>Customer</th> : null}
                  {show("invoice") ? <th>Invoice</th> : null}
                  {show("method") ? <th>Method</th> : null}
                  {show("ref") ? <th>Reference</th> : null}
                  {show("status") ? <th>Status</th> : null}
                  {show("amount") ? <th className="num">Amount</th> : null}
                  {show("actions") ? <th style={{ textAlign: "right" }}>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((payment) => {
                  const customer = findCustomer(payment.customerId);
                  return (
                    <tr key={payment.id}>
                      {show("receipt") ? <td style={{ fontWeight: 600 }}>{payment.number}</td> : null}
                      {show("date") ? <td>{formatDate(payment.date)}</td> : null}
                      {show("customer") ? <td>{customer?.legalName ?? "—"}</td> : null}
                      {show("invoice") ? <td>{payment.invoiceNumber}</td> : null}
                      {show("method") ? <td>{METHOD_LABELS[payment.method] ?? payment.method}</td> : null}
                      {show("ref") ? (
                        <td style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 11.5 }}>
                          {payment.reference}
                        </td>
                      ) : null}
                      {show("status") ? (
                        <td>
                          <span className="wsv2-pill" data-tone={statusTone(payment.status)}>
                            <span className="wsv2-status-dot" /> {statusLabel(payment.status)}
                          </span>
                        </td>
                      ) : null}
                      {show("amount") ? <td className="num">{formatCurrency(payment.amount)}</td> : null}
                      {show("actions") ? (
                        <td>
                          <div className="actions" onClick={(event) => event.stopPropagation()}>
                            <WorkspaceV2MoreActions
                              actions={[
                                { id: "view", label: "Open receipt" },
                                { id: "duplicate", label: "Duplicate receipt" },
                                { id: "void", label: "Void payment" },
                              ]}
                            />
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
