"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { loadColumnVisibility, saveColumnVisibility } from "@/lib/workspace-v2/register-column-storage";
import { WorkspaceV2ColumnPicker, type ColumnDef } from "./WorkspaceV2ColumnPicker";
import { WorkspaceV2MoreActions } from "./WorkspaceV2MoreActions";
import { WorkspaceV2Suggestion } from "./WorkspaceV2Suggestion";

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

export function WorkspaceV2PurchaseOrderRegister() {
  const [q, setQ] = useState("");
  const [vis, setVis] = useState(() =>
    typeof window === "undefined" ? DEFAULT : loadColumnVisibility(REG, DEFAULT),
  );
  const setC = (n: string[]) => {
    setVis(n);
    saveColumnVisibility(REG, n);
  };
  const s = new Set(vis);
  const show = (id: string) => s.has(id);
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
      <WorkspaceV2Suggestion
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
            <WorkspaceV2ColumnPicker columns={COLUMNS} visibleIds={vis} onChange={setC} />
          </div>
        </div>
        <div className="wsv2-table-scroll">
          <table className="wsv2-table">
            <thead>
              <tr>
                {show("num") ? <th>PO no.</th> : null}
                {show("vendor") ? <th>Vendor</th> : null}
                {show("date") ? <th>Date</th> : null}
                {show("status") ? <th>Status</th> : null}
                {show("amt") ? <th className="num">Total (SAR)</th> : null}
                {show("act") ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  {show("num") ? <td style={{ fontWeight: 600 }}>{r.number}</td> : null}
                  {show("vendor") ? <td>{r.vendor}</td> : null}
                  {show("date") ? <td>{r.date}</td> : null}
                  {show("status") ? <td style={{ textTransform: "capitalize" }}>{r.status}</td> : null}
                  {show("amt") ? <td className="num">{r.amount.toLocaleString("en-SA")}</td> : null}
                  {show("act") ? (
                    <td>
                      <WorkspaceV2MoreActions
                        actions={[
                          { id: "o", label: "Open" },
                          { id: "c", label: "Close" },
                        ]}
                      />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
