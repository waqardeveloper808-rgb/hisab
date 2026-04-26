"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { vendors } from "@/data/workspace-v2/vendors";
import { loadColumnVisibility, saveColumnVisibility } from "@/lib/workspace-v2/register-column-storage";
import { WorkspaceV2EmptyState } from "./WorkspaceV2EmptyState";
import { WorkspaceV2Suggestion } from "./WorkspaceV2Suggestion";
import { WorkspaceV2MoreActions } from "./WorkspaceV2MoreActions";
import { WorkspaceV2ColumnPicker, type ColumnDef } from "./WorkspaceV2ColumnPicker";

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

const statusLabel = (s: string) =>
  s === "active" ? "Active" : s === "on_hold" ? "On hold" : "Archived";

const statusTone = (s: string): "success" | "warning" | "neutral" =>
  s === "active" ? "success" : s === "on_hold" ? "warning" : "neutral";

export function WorkspaceV2VendorRegister() {
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState<string[]>(() =>
    typeof window === "undefined" ? DEFAULT_VIS : loadColumnVisibility(REG_ID, DEFAULT_VIS),
  );
  const setV = (next: string[]) => {
    setVisible(next);
    saveColumnVisibility(REG_ID, next);
  };
  const v = new Set(visible);
  const show = (id: string) => v.has(id);

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

      <WorkspaceV2Suggestion
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
            <WorkspaceV2ColumnPicker columns={COLUMNS} visibleIds={visible} onChange={setV} />
          </div>
        </div>
        <div className="wsv2-table-scroll">
          {list.length === 0 ? (
            <WorkspaceV2EmptyState title="No vendors match the search" />
          ) : (
            <table className="wsv2-table">
              <thead>
                <tr>
                  {show("code") ? <th>Vendor code</th> : null}
                  {show("name") ? <th>Legal name</th> : null}
                  {show("status") ? <th>Status</th> : null}
                  {show("vat") ? <th>VAT number</th> : null}
                  {show("city") ? <th>City</th> : null}
                  {show("last") ? <th>Last activity</th> : null}
                  {show("actions") ? <th style={{ textAlign: "right" }}>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id}>
                    {show("code") ? (
                      <td style={{ fontWeight: 600, fontFamily: "ui-monospace,monospace" }}>{r.vendorCode}</td>
                    ) : null}
                    {show("name") ? <td>{r.legalName}</td> : null}
                    {show("status") ? (
                      <td>
                        <span className="wsv2-pill" data-tone={statusTone(r.status)}>
                          <span className="wsv2-status-dot" />
                          {statusLabel(r.status)}
                        </span>
                      </td>
                    ) : null}
                    {show("vat") ? <td>{r.vatNumber ?? "—"}</td> : null}
                    {show("city") ? <td>{r.city}</td> : null}
                    {show("last") ? <td>{r.lastActivity}</td> : null}
                    {show("actions") ? (
                      <td>
                        <WorkspaceV2MoreActions
                          actions={[
                            { id: "open", label: "View vendor" },
                            { id: "bill", label: "New bill" },
                            { id: "pay", label: "Record payment" },
                          ]}
                        />
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
