"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { vendors } from "@/data/workspace/vendors";
import { loadColumnVisibility, saveColumnVisibility } from "@/lib/workspace/register-column-storage";
import { useRegisterTableLayout, type RegisterColumnWidthDef } from "@/lib/workspace/register-table-layout";
import { RegisterTableHeaderCell } from "@/components/workspace/RegisterTableHeaderCell";
import { WorkspaceEmptyState } from "./WorkspaceEmptyState";
import { WorkspaceSuggestion } from "./WorkspaceSuggestion";
import { WorkspaceMoreActions } from "./WorkspaceMoreActions";
import { WorkspaceColumnPicker, type ColumnDef } from "./WorkspaceColumnPicker";

const REG_ID = "v2.register.vendors";
const COLUMNS: ColumnDef[] = [
  { id: "code", label: "Vendor code", required: true },
  { id: "name", label: "Vendor name", required: true },
  { id: "status", label: "Status" },
  { id: "vat", label: "VAT number" },
  { id: "city", label: "City" },
  { id: "last", label: "Last activity" },
  { id: "actions", label: "Actions", required: true },
];
const DEFAULT_VIS = COLUMNS.map((c) => c.id);

const VENDOR_WIDTH_DEFS: RegisterColumnWidthDef[] = [
  { id: "code", defaultWidth: 120 },
  { id: "name", defaultWidth: 220 },
  { id: "status", defaultWidth: 100 },
  { id: "vat", defaultWidth: 120 },
  { id: "city", defaultWidth: 120 },
  { id: "last", defaultWidth: 120 },
  { id: "actions", defaultWidth: 100 },
];

const HEADER: Record<string, string> = {
  code: "Vendor code",
  name: "Legal name",
  status: "Status",
  vat: "VAT number",
  city: "City",
  last: "Last activity",
  actions: "Actions",
};

const statusLabel = (s: string) =>
  s === "active" ? "Active" : s === "on_hold" ? "On hold" : "Archived";

const statusTone = (s: string): "success" | "warning" | "neutral" =>
  s === "active" ? "success" : s === "on_hold" ? "warning" : "neutral";

function VendorTable({ visibleIds, list }: { visibleIds: string[]; list: typeof vendors }) {
  const ordered = useMemo(() => COLUMNS.map((c) => c.id).filter((id) => visibleIds.includes(id)), [visibleIds]);
  const { wrapRef, colPercents, beginResizePair } = useRegisterTableLayout("v2.register.vendors", VENDOR_WIDTH_DEFS, ordered);
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
                align={colId === "actions" ? "right" : "left"}
                onResizePointerDown={idx < ordered.length - 1 ? (x) => beginResizePair(idx, x) : undefined}
              >
                {HEADER[colId] ?? colId}
              </RegisterTableHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id}>
              {ordered.map((colId) => {
                if (colId === "code") {
                  return (
                    <td key={colId}>
                      <span className="font-mono font-semibold">{r.vendorCode}</span>
                    </td>
                  );
                }
                if (colId === "name") return <td key={colId}>{r.legalName}</td>;
                if (colId === "status") {
                  return (
                    <td key={colId}>
                      <span className="wsv2-pill" data-tone={statusTone(r.status)}>
                        <span className="wsv2-status-dot" />
                        {statusLabel(r.status)}
                      </span>
                    </td>
                  );
                }
                if (colId === "vat") return <td key={colId}>{r.vatNumber ?? "—"}</td>;
                if (colId === "city") return <td key={colId}>{r.city}</td>;
                if (colId === "last") return <td key={colId}>{r.lastActivity}</td>;
                if (colId === "actions") {
                  return (
                    <td key={colId}>
                      <WorkspaceMoreActions
                        actions={[
                          { id: "open", label: "View vendor" },
                          { id: "bill", label: "New bill" },
                          { id: "pay", label: "Record payment" },
                        ]}
                      />
                    </td>
                  );
                }
                return <td key={colId}>—</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function WorkspaceVendorRegister() {
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState<string[]>(() =>
    typeof window === "undefined" ? DEFAULT_VIS : loadColumnVisibility(REG_ID, DEFAULT_VIS),
  );
  const setV = (next: string[]) => {
    setVisible(next);
    saveColumnVisibility(REG_ID, next);
  };

  const list = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return vendors.filter(
      (x) =>
        lower.length === 0 ||
        x.legalName.toLowerCase().includes(lower) ||
        x.vendorCode.toLowerCase().includes(lower) ||
        x.city.toLowerCase().includes(lower),
    );
  }, [search]);

  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">Vendor records</h1>
          <p className="wsv2-page-subtitle">Suppliers you purchase from. Keep codes aligned with your AP and bills.</p>
        </div>
        <div className="wsv2-page-actions">
          <button
            type="button"
            className="wsv2-btn"
            disabled
            title="Preview mode only — not connected to vendor API yet"
          >
            <Plus size={13} />
            Add vendor
          </button>
        </div>
      </div>

      <WorkspaceSuggestion
        id="vendors-recovery"
        title="Purchase-side vendors"
        description="This register is for suppliers only, not for saleable product catalog items."
      />

      <div className="wsv2-card" style={{ marginTop: 14 }}>
        <div className="wsv2-toolbar">
          <label className="wsv2-toolbar-search">
            <Search size={14} color="var(--wsv2-ink-subtle)" />
            <input
              type="search"
              placeholder="Search by code, name, or city"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11.5, color: "var(--wsv2-ink-subtle)" }}>{list.length} vendors</span>
            <WorkspaceColumnPicker columns={COLUMNS} visibleIds={visible} onChange={setV} />
          </div>
        </div>
        {list.length === 0 ? (
          <WorkspaceEmptyState title="No vendors match the search" />
        ) : (
          <VendorTable visibleIds={visible} list={list} />
        )}
      </div>
    </div>
  );
}
