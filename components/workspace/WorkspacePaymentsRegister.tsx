"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { findCustomer } from "@/data/workspace/customers";
import { payments } from "@/data/workspace/payments";
import { formatCurrency, formatDate, statusLabel, statusTone } from "@/lib/workspace/format";
import { loadColumnVisibility, saveColumnVisibility } from "@/lib/workspace/register-column-storage";
import { useRegisterTableLayout, type RegisterColumnWidthDef } from "@/lib/workspace/register-table-layout";
import { RegisterTableHeaderCell } from "@/components/workspace/RegisterTableHeaderCell";
import { WorkspaceEmptyState } from "./WorkspaceEmptyState";
import { WorkspaceSuggestion } from "./WorkspaceSuggestion";
import { WorkspaceMoreActions } from "./WorkspaceMoreActions";
import { WorkspaceColumnPicker, type ColumnDef } from "./WorkspaceColumnPicker";

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

const PAY_WIDTH_DEFS: RegisterColumnWidthDef[] = [
  { id: "receipt", defaultWidth: 120 },
  { id: "date", defaultWidth: 100 },
  { id: "customer", defaultWidth: 180 },
  { id: "invoice", defaultWidth: 120 },
  { id: "method", defaultWidth: 120 },
  { id: "ref", defaultWidth: 120 },
  { id: "status", defaultWidth: 100 },
  { id: "amount", defaultWidth: 100 },
  { id: "actions", defaultWidth: 100 },
];

const HEADER: Record<string, string> = {
  receipt: "Receipt No.",
  date: "Date",
  customer: "Customer",
  invoice: "Invoice",
  method: "Method",
  ref: "Reference",
  status: "Status",
  amount: "Amount",
  actions: "Actions",
};

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank transfer",
  card: "Card / Mada",
  cash: "Cash receipt",
  wallet: "Mobile wallet",
};

function CustomerPaymentsTable({ visibleIds, rows }: { visibleIds: string[]; rows: typeof payments }) {
  const ordered = useMemo(() => COLUMNS.map((c) => c.id).filter((id) => visibleIds.includes(id)), [visibleIds]);
  const { wrapRef, colPercents, beginResizePair } = useRegisterTableLayout("v2.register.customer-payments", PAY_WIDTH_DEFS, ordered);
  const pctById = useMemo(() => Object.fromEntries(colPercents.map((c) => [c.id, c.percent])), [colPercents]);

  return (
    <div ref={wrapRef} className="wsv2-table-scroll" data-register-table="true">
      <table className="wsv2-table">
        <colgroup>
          {ordered.map((id) => (
            <col key={id} style={{ width: `${pctById[id] ?? 100 / ordered.length}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {ordered.map((colId, idx) => (
              <RegisterTableHeaderCell
                key={colId}
                align={colId === "amount" || colId === "actions" ? "right" : "left"}
                className={colId === "amount" ? "num" : ""}
                onResizePointerDown={idx < ordered.length - 1 ? (x) => beginResizePair(idx, x) : undefined}
              >
                {HEADER[colId] ?? colId}
              </RegisterTableHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((payment) => {
            const customer = findCustomer(payment.customerId);
            return (
              <tr key={payment.id}>
                {ordered.map((colId) => {
                  if (colId === "receipt") return <td key={colId} style={{ fontWeight: 600 }}>{payment.number}</td>;
                  if (colId === "date") return <td key={colId}>{formatDate(payment.date)}</td>;
                  if (colId === "customer") return <td key={colId}>{customer?.legalName ?? "—"}</td>;
                  if (colId === "invoice") return <td key={colId}>{payment.invoiceNumber}</td>;
                  if (colId === "method") return <td key={colId}>{METHOD_LABELS[payment.method] ?? payment.method}</td>;
                  if (colId === "ref") {
                    return (
                      <td key={colId}>
                        <span className="font-mono text-[11.5px]">{payment.reference}</span>
                      </td>
                    );
                  }
                  if (colId === "status") {
                    return (
                      <td key={colId}>
                        <span className="wsv2-pill" data-tone={statusTone(payment.status)}>
                          <span className="wsv2-status-dot" /> {statusLabel(payment.status)}
                        </span>
                      </td>
                    );
                  }
                  if (colId === "amount") return <td key={colId} className="num">{formatCurrency(payment.amount)}</td>;
                  if (colId === "actions") {
                    return (
                      <td key={colId}>
                        <div className="actions" onClick={(event) => event.stopPropagation()}>
                          <WorkspaceMoreActions
                            actions={[
                              { id: "view", label: "Open receipt" },
                              { id: "duplicate", label: "Duplicate receipt" },
                              { id: "void", label: "Void payment" },
                            ]}
                          />
                        </div>
                      </td>
                    );
                  }
                  return <td key={colId}>—</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function WorkspacePaymentsRegister() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "cleared" | "pending">("all");
  const [visibleColIds, setVisibleColIds] = useState<string[]>(() =>
    typeof window === "undefined" ? DEFAULT_VIS : loadColumnVisibility(REG_ID, DEFAULT_VIS),
  );
  const setV = (n: string[]) => {
    setVisibleColIds(n);
    saveColumnVisibility(REG_ID, n);
  };

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

      <WorkspaceSuggestion
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
            <WorkspaceColumnPicker columns={COLUMNS} visibleIds={visibleColIds} onChange={setV} />
          </div>
        </div>
        {rows.length === 0 ? (
          <WorkspaceEmptyState title="No payments match the current filters" />
        ) : (
          <CustomerPaymentsTable visibleIds={visibleColIds} rows={rows} />
        )}
      </div>
    </div>
  );
}
