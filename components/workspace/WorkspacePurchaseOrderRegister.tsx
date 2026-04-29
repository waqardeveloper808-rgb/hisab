"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { loadColumnVisibility, saveColumnVisibility } from "@/lib/workspace/register-column-storage";
import { useRegisterTableLayout, type RegisterColumnWidthDef } from "@/lib/workspace/register-table-layout";
import { RegisterTableHeaderCell } from "@/components/workspace/RegisterTableHeaderCell";
import { WorkspaceColumnPicker, type ColumnDef } from "./WorkspaceColumnPicker";
import { WorkspaceMoreActions } from "./WorkspaceMoreActions";
import { WorkspaceSuggestion } from "./WorkspaceSuggestion";

const ROWS = [
  { id: "po-1", number: "PO-2026-101", vendor: "Najim Electrical Supply", date: "2026-04-18", status: "open", amount: 42000 },
  { id: "po-2", number: "PO-2026-102", vendor: "Red Sea Packaging", date: "2026-04-15", status: "received", amount: 11800.5 },
];

const COLUMNS: ColumnDef[] = [
  { id: "num", label: "PO no.", required: true },
  { id: "vendor", label: "Vendor" },
  { id: "date", label: "Date" },
  { id: "status", label: "Status" },
  { id: "amt", label: "Total" },
  { id: "act", label: "Actions", required: true },
];
const DEFAULT = COLUMNS.map((c) => c.id);
const REG = "v2.register.purchase-orders";

const PO_WIDTH_DEFS: RegisterColumnWidthDef[] = [
  { id: "num", defaultWidth: 140 },
  { id: "vendor", defaultWidth: 220 },
  { id: "date", defaultWidth: 110 },
  { id: "status", defaultWidth: 100 },
  { id: "amt", defaultWidth: 120 },
  { id: "act", defaultWidth: 100 },
];

const PO_HEADER: Record<string, string> = {
  num: "PO no.",
  vendor: "Vendor",
  date: "Date",
  status: "Status",
  amt: "Total (SAR)",
  act: "Actions",
};

function POTable({ visibleIds, list }: { visibleIds: string[]; list: typeof ROWS }) {
  const ordered = useMemo(() => COLUMNS.map((c) => c.id).filter((id) => visibleIds.includes(id)), [visibleIds]);
  const { wrapRef, colPercents, beginResizePair } = useRegisterTableLayout("v2.register.purchase-orders", PO_WIDTH_DEFS, ordered);
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
                align={colId === "amt" || colId === "act" ? "right" : "left"}
                className={colId === "amt" ? "num" : ""}
                onResizePointerDown={idx < ordered.length - 1 ? (x) => beginResizePair(idx, x) : undefined}
              >
                {PO_HEADER[colId] ?? colId}
              </RegisterTableHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id}>
              {ordered.map((colId) => {
                if (colId === "num") return <td key={colId} style={{ fontWeight: 600 }}>{r.number}</td>;
                if (colId === "vendor") return <td key={colId}>{r.vendor}</td>;
                if (colId === "date") return <td key={colId}>{r.date}</td>;
                if (colId === "status") return <td key={colId} style={{ textTransform: "capitalize" }}>{r.status}</td>;
                if (colId === "amt") return <td key={colId} className="num">{r.amount.toLocaleString("en-SA")}</td>;
                if (colId === "act") {
                  return (
                    <td key={colId}>
                      <WorkspaceMoreActions
                        actions={[
                          { id: "o", label: "Open" },
                          { id: "c", label: "Close" },
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

export function WorkspacePurchaseOrderRegister() {
  const [q, setQ] = useState("");
  const [vis, setVis] = useState(() =>
    typeof window === "undefined" ? DEFAULT : loadColumnVisibility(REG, DEFAULT),
  );
  const setC = (n: string[]) => {
    setVis(n);
    saveColumnVisibility(REG, n);
  };
  const list = ROWS.filter((r) => !q.trim() || r.number.toLowerCase().includes(q.toLowerCase()) || r.vendor.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">Purchase orders</h1>
          <p className="wsv2-page-subtitle">Open orders to suppliers. Demo rows only in this V2 build.</p>
        </div>
        <div className="wsv2-page-actions">
          <button type="button" className="wsv2-btn" disabled title="Not connected to purchasing workflow">
            <Plus size={13} />
            New purchase order
          </button>
        </div>
      </div>
      <WorkspaceSuggestion
        id="po-preview"
        tone="warning"
        title="Preview module — workflow not connected yet"
        description="Real PO lifecycle (approval, receiving, 3-way match) is not active here."
      />
      <div className="wsv2-card" style={{ marginTop: 14 }}>
        <div className="wsv2-toolbar">
          <label className="wsv2-toolbar-search">
            <Search size={14} color="var(--wsv2-ink-subtle)" />
            <input
              type="search"
              placeholder="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <div style={{ marginLeft: "auto" }}>
            <WorkspaceColumnPicker columns={COLUMNS} visibleIds={vis} onChange={setC} />
          </div>
        </div>
        <POTable visibleIds={vis} list={list} />
      </div>
    </div>
  );
}
