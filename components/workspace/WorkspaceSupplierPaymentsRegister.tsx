"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { findVendor } from "@/data/workspace/vendors";
import { supplierPayments } from "@/data/workspace/supplier-payments";
import { formatCurrency, formatDate, statusLabel, statusTone } from "@/lib/workspace/format";
import { loadColumnVisibility, saveColumnVisibility } from "@/lib/workspace/register-column-storage";
import { WorkspaceEmptyState } from "./WorkspaceEmptyState";
import { WorkspaceSuggestion } from "./WorkspaceSuggestion";
import { WorkspaceMoreActions } from "./WorkspaceMoreActions";
import { WorkspaceColumnPicker, type ColumnDef } from "./WorkspaceColumnPicker";

const REG_ID = "v2.register.supplier-payments";
const COLUMNS: ColumnDef[] = [
  { id: "receipt", label: "Receipt No.", required: true },
  { id: "date", label: "Date" },
  { id: "vendor", label: "Vendor" },
  { id: "bill", label: "Bill", required: true },
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
  cash: "Cash",
  wallet: "Mobile wallet",
};

export function WorkspaceSupplierPaymentsRegister() {
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
    return supplierPayments.filter((p) => {
      const v = findVendor(p.vendorId);
      const okSearch =
        lower.length === 0 ||
        p.number.toLowerCase().includes(lower) ||
        p.billNumber.toLowerCase().includes(lower) ||
        (v?.legalName ?? "").toLowerCase().includes(lower);
      const ok = statusFilter === "all" || p.status === statusFilter;
      return okSearch && ok;
    });
  }, [search, statusFilter]);

  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">Supplier payments</h1>
          <p className="wsv2-page-subtitle">Payments sent to vendors against bills. Separate from customer receipts.</p>
        </div>
        <div className="wsv2-page-actions">
          <button
            type="button"
            className="wsv2-btn"
            disabled
            title="Preview mode only — not connected to payables yet"
          >
            <Plus size={13} />
            Record supplier payment
          </button>
        </div>
      </div>

      <WorkspaceSuggestion
        id="supplier-payments"
        title="AP payments"
        description="This register uses vendor master data, not the products catalog."
      />

      <div className="wsv2-card" style={{ marginTop: 14 }}>
        <div className="wsv2-toolbar">
          <label className="wsv2-toolbar-search">
            <Search size={14} color="var(--wsv2-ink-subtle)" />
            <input
              type="search"
              placeholder="Search by receipt, bill or vendor"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              {rows.length} of {supplierPayments.length}
            </span>
            <WorkspaceColumnPicker columns={COLUMNS} visibleIds={visibleColIds} onChange={setV} />
          </div>
        </div>
        <div className="wsv2-table-scroll">
          {rows.length === 0 ? (
            <WorkspaceEmptyState title="No payments match" />
          ) : (
            <table className="wsv2-table">
              <thead>
                <tr>
                  {show("receipt") ? <th>Receipt</th> : null}
                  {show("date") ? <th>Date</th> : null}
                  {show("vendor") ? <th>Vendor</th> : null}
                  {show("bill") ? <th>Bill</th> : null}
                  {show("method") ? <th>Method</th> : null}
                  {show("ref") ? <th>Reference</th> : null}
                  {show("status") ? <th>Status</th> : null}
                  {show("amount") ? <th className="num">Amount</th> : null}
                  {show("actions") ? <th style={{ textAlign: "right" }}>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const v = findVendor(p.vendorId);
                  return (
                    <tr key={p.id}>
                      {show("receipt") ? <td style={{ fontWeight: 600 }}>{p.number}</td> : null}
                      {show("date") ? <td>{formatDate(p.date)}</td> : null}
                      {show("vendor") ? <td>{v?.legalName ?? "—"}</td> : null}
                      {show("bill") ? <td>{p.billNumber}</td> : null}
                      {show("method") ? <td>{METHOD_LABELS[p.method] ?? p.method}</td> : null}
                      {show("ref") ? (
                        <td style={{ fontFamily: "ui-monospace,monospace", fontSize: 11.5 }}>{p.reference}</td>
                      ) : null}
                      {show("status") ? (
                        <td>
                          <span className="wsv2-pill" data-tone={statusTone(p.status)}>
                            <span className="wsv2-status-dot" /> {statusLabel(p.status)}
                          </span>
                        </td>
                      ) : null}
                      {show("amount") ? <td className="num">{formatCurrency(p.amount)}</td> : null}
                      {show("actions") ? (
                        <td>
                          <WorkspaceMoreActions
                            actions={[
                              { id: "open", label: "Open payment" },
                              { id: "void", label: "Void" },
                            ]}
                          />
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
