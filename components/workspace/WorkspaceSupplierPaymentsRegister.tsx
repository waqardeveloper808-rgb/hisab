"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { findVendor } from "@/data/workspace/vendors";
import { supplierPayments } from "@/data/workspace/supplier-payments";
import { formatCurrency, formatDate, statusLabel, statusTone } from "@/lib/workspace/format";
import { loadColumnVisibility, saveColumnVisibility } from "@/lib/workspace/register-column-storage";
import { useRegisterTableLayout, type RegisterColumnWidthDef } from "@/lib/workspace/register-table-layout";
import { RegisterTableHeaderCell } from "@/components/workspace/RegisterTableHeaderCell";
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

const PAY_WIDTH_DEFS: RegisterColumnWidthDef[] = [
  { id: "receipt", defaultWidth: 120 },
  { id: "date", defaultWidth: 100 },
  { id: "vendor", defaultWidth: 180 },
  { id: "bill", defaultWidth: 120 },
  { id: "method", defaultWidth: 120 },
  { id: "ref", defaultWidth: 120 },
  { id: "status", defaultWidth: 100 },
  { id: "amount", defaultWidth: 100 },
  { id: "actions", defaultWidth: 100 },
];

const HEADER: Record<string, string> = {
  receipt: "Receipt",
  date: "Date",
  vendor: "Vendor",
  bill: "Bill",
  method: "Method",
  ref: "Reference",
  status: "Status",
  amount: "Amount",
  actions: "Actions",
};

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank transfer",
  card: "Card / Mada",
  cash: "Cash",
  wallet: "Mobile wallet",
};

function SupplierPaymentsTable({ visibleIds, rows }: { visibleIds: string[]; rows: typeof supplierPayments }) {
  const ordered = useMemo(() => COLUMNS.map((c) => c.id).filter((id) => visibleIds.includes(id)), [visibleIds]);
  const { wrapRef, colPercents, beginResizePair } = useRegisterTableLayout("v2.register.supplier-payments", PAY_WIDTH_DEFS, ordered);
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
          {rows.map((p) => {
            const v = findVendor(p.vendorId);
            return (
              <tr key={p.id}>
                {ordered.map((colId) => {
                  if (colId === "receipt") return <td key={colId} style={{ fontWeight: 600 }}>{p.number}</td>;
                  if (colId === "date") return <td key={colId}>{formatDate(p.date)}</td>;
                  if (colId === "vendor") return <td key={colId}>{v?.legalName ?? "—"}</td>;
                  if (colId === "bill") return <td key={colId}>{p.billNumber}</td>;
                  if (colId === "method") return <td key={colId}>{METHOD_LABELS[p.method] ?? p.method}</td>;
                  if (colId === "ref") {
                    return (
                      <td key={colId}>
                        <span className="font-mono text-[11.5px]">{p.reference}</span>
                      </td>
                    );
                  }
                  if (colId === "status") {
                    return (
                      <td key={colId}>
                        <span className="wsv2-pill" data-tone={statusTone(p.status)}>
                          <span className="wsv2-status-dot" /> {statusLabel(p.status)}
                        </span>
                      </td>
                    );
                  }
                  if (colId === "amount") return <td key={colId} className="num">{formatCurrency(p.amount)}</td>;
                  if (colId === "actions") {
                    return (
                      <td key={colId}>
                        <WorkspaceMoreActions
                          actions={[
                            { id: "open", label: "Open payment" },
                            { id: "void", label: "Void" },
                          ]}
                        />
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
        {rows.length === 0 ? (
          <WorkspaceEmptyState title="No payments match" />
        ) : (
          <SupplierPaymentsTable visibleIds={visibleColIds} rows={rows} />
        )}
      </div>
    </div>
  );
}
