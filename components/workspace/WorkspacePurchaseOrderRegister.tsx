"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { loadColumnVisibility, saveColumnVisibility } from "@/lib/workspace/register-column-storage";
import { useRegisterTableLayout, type RegisterColumnWidthDef } from "@/lib/workspace/register-table-layout";
import { RegisterTableHeaderCell } from "@/components/workspace/RegisterTableHeaderCell";
import { WorkspaceColumnPicker, type ColumnDef } from "./WorkspaceColumnPicker";
import { WorkspaceMoreActions } from "./WorkspaceMoreActions";
import { WorkspaceSuggestion } from "./WorkspaceSuggestion";
import { fetchPurchaseDocumentsRegister } from "@/lib/workspace-api";
import { currency } from "@/components/workflow/utils";

type PORow = {
  id: number;
  number: string;
  vendor: string;
  date: string;
  status: string;
  amount: number;
};

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

function POTable({ visibleIds, list }: { visibleIds: string[]; list: PORow[] }) {
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
                if (colId === "num") {
                  return (
                    <td key={colId} style={{ fontWeight: 600 }}>
                      <Link href={`/workspace/bills/${r.id}`} className="text-primary hover:underline">
                        {r.number}
                      </Link>
                    </td>
                  );
                }
                if (colId === "vendor") return <td key={colId}>{r.vendor}</td>;
                if (colId === "date") return <td key={colId}>{r.date}</td>;
                if (colId === "status") {
                  return (
                    <td key={colId} style={{ textTransform: "capitalize" }}>
                      {r.status.replaceAll("_", " ")}
                    </td>
                  );
                }
                if (colId === "amt") return <td key={colId} className="num">{currency(r.amount)}</td>;
                if (colId === "act") {
                  return (
                    <td key={colId}>
                      <WorkspaceMoreActions
                        actions={[
                          { id: "open", label: "Open linked purchase document" },
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
  const [rows, setRows] = useState<PORow[]>([]);
  const [q, setQ] = useState("");
  const [vis, setVis] = useState(() =>
    typeof window === "undefined" ? DEFAULT : loadColumnVisibility(REG, DEFAULT),
  );
  const setC = (n: string[]) => {
    setVis(n);
    saveColumnVisibility(REG, n);
  };

  useEffect(() => {
    let active = true;
    fetchPurchaseDocumentsRegister({ type: "purchase_order" })
      .then((documents) => {
        if (!active) return;
        setRows(
          documents.map((d) => ({
            id: d.id,
            number: d.number || `Draft-${d.id}`,
            vendor: (d.contactName ?? "").trim() || "—",
            date: d.issueDate ?? "",
            status: d.status,
            amount: d.grandTotal ?? 0,
          })),
        );
      })
      .catch((err: unknown) => {
        console.error("[WorkspacePurchaseOrderRegister] failed", err);
        if (active) {
          setRows([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const lower = q.trim().toLowerCase();
  const list =
    lower.length === 0
      ? rows
      : rows.filter((r) => r.number.toLowerCase().includes(lower) || r.vendor.toLowerCase().includes(lower));

  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">Purchase orders</h1>
          <p className="wsv2-page-subtitle">Purchase orders queried from Laravel purchase-document index.</p>
        </div>
        <div className="wsv2-page-actions">
          <Link href="/workspace/bills/new" className="wsv2-btn inline-flex items-center gap-1.5">
            <Plus size={13} aria-hidden />
            New purchase order
          </Link>
        </div>
      </div>
      <WorkspaceSuggestion
        id="po-linked"
        tone="primary"
        title="Receiving and invoicing remain in purchase workflow"
        description="Finalize a purchase order, then capture vendor bills and payments from the Bills surface so inventory and VAT stay linked."
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
        {list.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted">No purchase orders returned for this company.</div>
        ) : (
          <POTable visibleIds={vis} list={list} />
        )}
      </div>
    </div>
  );
}
