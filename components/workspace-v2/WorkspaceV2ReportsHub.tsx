"use client";

import { useState } from "react";
import { FileBarChart, Plus, Search } from "lucide-react";
import { loadColumnVisibility, saveColumnVisibility } from "@/lib/workspace-v2/register-column-storage";
import { WorkspaceV2ColumnPicker, type ColumnDef } from "./WorkspaceV2ColumnPicker";
import { WorkspaceV2Suggestion } from "./WorkspaceV2Suggestion";

const ROWS: { id: string; name: string; category: string; lastRun: string }[] = [
  { id: "r1", name: "Operations summary", category: "Management", lastRun: "—" },
  { id: "r2", name: "A/R aging", category: "Receivables", lastRun: "2026-04-20" },
  { id: "r3", name: "A/P aging", category: "Payables", lastRun: "2026-04-19" },
  { id: "r4", name: "VAT detail", category: "Tax", lastRun: "2026-04-18" },
];

const COLUMNS: ColumnDef[] = [
  { id: "name", label: "Report", required: true },
  { id: "cat", label: "Category" },
  { id: "last", label: "Last run" },
  { id: "act", label: "Actions", required: true },
];
const DEFAULT_VIS = COLUMNS.map((c) => c.id);
const REG = "v2.register.reports";

export function WorkspaceV2ReportsHub() {
  const [q, setQ] = useState("");
  const [vis, setVis] = useState(() =>
    typeof window === "undefined" ? DEFAULT_VIS : loadColumnVisibility(REG, DEFAULT_VIS),
  );
  const setC = (n: string[]) => {
    setVis(n);
    saveColumnVisibility(REG, n);
  };
  const s = new Set(vis);
  const show = (id: string) => s.has(id);
  const list = ROWS.filter((r) => {
    if (!q.trim()) return true;
    return r.name.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">Reports</h1>
          <p className="wsv2-page-subtitle">Preview list of standard reports. Engine connection is not live in this V2 build.</p>
        </div>
        <div className="wsv2-page-actions">
          <button type="button" className="wsv2-btn" disabled title="Not connected to reporting engine">
            <Plus size={13} />
            Generate report
          </button>
        </div>
      </div>
      <WorkspaceV2Suggestion
        id="reports-preview"
        tone="info"
        title="Preview mode"
        description="Favorites and scheduled runs are not stored yet. Use this hub to confirm navigation and column layout only."
      />
      <div className="wsv2-card" style={{ marginTop: 14 }}>
        <div className="wsv2-toolbar">
          <label className="wsv2-toolbar-search">
            <Search size={14} color="var(--wsv2-ink-subtle)" />
            <input type="search" placeholder="Filter reports" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <div style={{ marginLeft: "auto" }}>
            <WorkspaceV2ColumnPicker columns={COLUMNS} visibleIds={vis} onChange={setC} />
          </div>
        </div>
        <div className="wsv2-table-scroll">
          <table className="wsv2-table">
            <thead>
              <tr>
                {show("name") ? <th>Report</th> : null}
                {show("cat") ? <th>Category</th> : null}
                {show("last") ? <th>Last run</th> : null}
                {show("act") ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  {show("name") ? (
                    <td>
                      <FileBarChart size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "text-bottom" }} />
                      {r.name}
                    </td>
                  ) : null}
                  {show("cat") ? <td>{r.category}</td> : null}
                  {show("last") ? <td>{r.lastRun}</td> : null}
                  {show("act") ? (
                    <td>
                      <button type="button" className="wsv2-btn-secondary" disabled>
                        View
                      </button>
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
