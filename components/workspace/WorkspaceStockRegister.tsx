"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { products } from "@/data/workspace/products";
import { stockItems } from "@/data/workspace/stock";
import { formatCurrency, formatDate, formatNumber, statusLabel, statusTone } from "@/lib/workspace/format";
import { loadColumnVisibility, saveColumnVisibility } from "@/lib/workspace/register-column-storage";
import { useRegisterTableLayout, type RegisterColumnWidthDef } from "@/lib/workspace/register-table-layout";
import { RegisterTableHeaderCell } from "@/components/workspace/RegisterTableHeaderCell";
import { WorkspaceEmptyState } from "./WorkspaceEmptyState";
import { WorkspaceSuggestion } from "./WorkspaceSuggestion";
import { WorkspaceMoreActions } from "./WorkspaceMoreActions";
import { WorkspaceColumnPicker, type ColumnDef } from "./WorkspaceColumnPicker";

type Mode = "stock" | "products";

type Props = { mode?: Mode };

const PRODUCT_COLS: ColumnDef[] = [
  { id: "code", label: "Product or Service Code", required: true },
  { id: "status", label: "Status", required: true },
  { id: "name", label: "Name of Product or Service", required: true },
  { id: "description", label: "Description" },
  { id: "type", label: "Type" },
  { id: "category", label: "Category" },
  { id: "salePrice", label: "Sale / Base price", required: true },
  { id: "tracking", label: "Inventory tracking" },
  { id: "qty", label: "Qty on hand" },
  { id: "avg", label: "Avg unit cost" },
  { id: "value", label: "Inventory value +/–" },
  { id: "actions", label: "Actions", required: true },
];

const DEFAULT_PRODUCT = PRODUCT_COLS.map((c) => c.id);
const REG_PRODUCT = "v2.register.products";

const STOCK_COLS: ColumnDef[] = [
  { id: "code", label: "Item code", required: true },
  { id: "status", label: "Status", required: true },
  { id: "name", label: "Item name", required: true },
  { id: "description", label: "Description" },
  { id: "tracking", label: "Inventory tracking" },
  { id: "qty", label: "Qty on hand" },
  { id: "avg", label: "Avg unit cost" },
  { id: "value", label: "Inventory value +/–" },
  { id: "last", label: "Last movement" },
  { id: "warehouse", label: "Warehouse / location" },
  { id: "actions", label: "Actions", required: true },
];

const DEFAULT_STOCK = STOCK_COLS.map((c) => c.id);
const REG_STOCK = "v2.register.stock";

const PRODUCT_WIDTH_DEFS: RegisterColumnWidthDef[] = [
  { id: "code", defaultWidth: 120 },
  { id: "status", defaultWidth: 100 },
  { id: "name", defaultWidth: 200 },
  { id: "description", defaultWidth: 300 },
  { id: "type", defaultWidth: 88 },
  { id: "category", defaultWidth: 128 },
  { id: "salePrice", defaultWidth: 120 },
  { id: "tracking", defaultWidth: 130 },
  { id: "qty", defaultWidth: 100 },
  { id: "avg", defaultWidth: 120 },
  { id: "value", defaultWidth: 140 },
  { id: "actions", defaultWidth: 100 },
];

const STOCK_WIDTH_DEFS: RegisterColumnWidthDef[] = [
  { id: "code", defaultWidth: 120 },
  { id: "status", defaultWidth: 100 },
  { id: "name", defaultWidth: 180 },
  { id: "description", defaultWidth: 260 },
  { id: "tracking", defaultWidth: 120 },
  { id: "qty", defaultWidth: 100 },
  { id: "avg", defaultWidth: 110 },
  { id: "value", defaultWidth: 130 },
  { id: "last", defaultWidth: 120 },
  { id: "warehouse", defaultWidth: 140 },
  { id: "actions", defaultWidth: 100 },
];

const STOCK_HEADER: Record<string, string> = {
  code: "Item code",
  status: "Status",
  name: "Item name",
  description: "Description",
  tracking: "Inventory tracking",
  qty: "Qty on hand",
  avg: "Avg unit cost",
  value: "Inventory value +/–",
  last: "Last movement",
  warehouse: "Warehouse / location",
  actions: "Actions",
};

const PRODUCT_HEADER: Record<string, string> = {
  code: "Code",
  status: "Status",
  name: "Name",
  description: "Description",
  type: "Type",
  category: "Category",
  salePrice: "Sale / base price",
  tracking: "Inventory tracking",
  qty: "Qty on hand",
  avg: "Avg unit cost",
  value: "Inventory value +/–",
  actions: "Actions",
};

function initVis(reg: string, defaults: string[]) {
  if (typeof window === "undefined") return defaults;
  return loadColumnVisibility(reg, defaults);
}

function StockItemsTable({ visibleIds, filtered }: { visibleIds: string[]; filtered: typeof stockItems }) {
  const ordered = useMemo(() => STOCK_COLS.map((c) => c.id).filter((id) => visibleIds.includes(id)), [visibleIds]);
  const { wrapRef, colPercents, beginResizePair } = useRegisterTableLayout("v2.register.stock", STOCK_WIDTH_DEFS, ordered);
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
                align={["qty", "avg", "value", "actions"].includes(colId) ? "right" : "left"}
                className={["qty", "avg", "value"].includes(colId) ? "num" : colId === "description" ? "wsv2-cell-desc" : ""}
                onResizePointerDown={idx < ordered.length - 1 ? (x) => beginResizePair(idx, x) : undefined}
              >
                {STOCK_HEADER[colId] ?? colId}
              </RegisterTableHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <tr key={item.id}>
              {ordered.map((colId) => {
                if (colId === "code") {
                  return (
                    <td key={colId}>
                      <span className="font-mono font-semibold">{item.sku}</span>
                    </td>
                  );
                }
                if (colId === "status") {
                  return (
                    <td key={colId}>
                      <span className="wsv2-pill" data-tone={statusTone(item.status)}>
                        <span className="wsv2-status-dot" /> {statusLabel(item.status)}
                      </span>
                    </td>
                  );
                }
                if (colId === "name") return <td key={colId}>{item.name}</td>;
                if (colId === "description") {
                  return (
                    <td key={colId} className="wsv2-cell-desc" style={{ color: "var(--wsv2-ink-subtle)" }}>
                      {item.description ?? "—"}
                    </td>
                  );
                }
                if (colId === "tracking") return <td key={colId}>{item.inventoryTracking ? "Tracked" : "—"}</td>;
                if (colId === "qty") {
                  return (
                    <td key={colId} className="num">
                      {formatNumber(item.onHand)} {item.unit}
                    </td>
                  );
                }
                if (colId === "avg") return <td key={colId} className="num">{formatCurrency(item.avgUnitCost)}</td>;
                if (colId === "value") {
                  return (
                    <td key={colId} className="num">
                      {formatCurrency(item.onHand * item.avgUnitCost)}
                      <div style={{ fontSize: 11, color: "var(--wsv2-ink-subtle)" }}>
                        {item.inventoryValueDelta >= 0 ? "+" : ""}
                        {formatCurrency(item.inventoryValueDelta)}
                      </div>
                    </td>
                  );
                }
                if (colId === "last") return <td key={colId}>{formatDate(item.lastMovement)}</td>;
                if (colId === "warehouse") return <td key={colId}>{item.warehouse ?? "—"}</td>;
                if (colId === "actions") {
                  return (
                    <td key={colId}>
                      <div className="actions">
                        <WorkspaceMoreActions
                          actions={[
                            { id: "adjust", label: "Adjust stock" },
                            { id: "history", label: "View movement history" },
                            { id: "archive", label: "Archive item" },
                          ]}
                        />
                      </div>
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

function ProductsTable({ visibleIds, filtered }: { visibleIds: string[]; filtered: typeof products }) {
  const ordered = useMemo(() => PRODUCT_COLS.map((c) => c.id).filter((id) => visibleIds.includes(id)), [visibleIds]);
  const { wrapRef, colPercents, beginResizePair } = useRegisterTableLayout("v2.register.products", PRODUCT_WIDTH_DEFS, ordered);
  const pctById = useMemo(() => Object.fromEntries(colPercents.map((c) => [c.id, c.percent])), [colPercents]);

  const invVal = (qty: number | null, avg: number | null) => {
    if (qty == null || avg == null) return "—";
    return formatCurrency(qty * avg);
  };

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
                align={["salePrice", "qty", "avg", "value", "actions"].includes(colId) ? "right" : "left"}
                className={["salePrice", "qty", "avg", "value"].includes(colId) ? "num" : colId === "description" ? "wsv2-cell-desc" : ""}
                onResizePointerDown={idx < ordered.length - 1 ? (x) => beginResizePair(idx, x) : undefined}
              >
                {PRODUCT_HEADER[colId] ?? colId}
              </RegisterTableHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((product) => (
            <tr key={product.id}>
              {ordered.map((colId) => {
                if (colId === "code") {
                  return (
                    <td key={colId}>
                      <span className="font-mono font-semibold">{product.sku}</span>
                    </td>
                  );
                }
                if (colId === "status") {
                  return (
                    <td key={colId}>
                      <span className="wsv2-pill" data-tone={product.status === "active" ? "success" : "neutral"}>
                        <span className="wsv2-status-dot" />
                        {product.status === "active" ? "Active" : "Archived"}
                      </span>
                    </td>
                  );
                }
                if (colId === "name") {
                  return (
                    <td key={colId}>
                      <div style={{ fontWeight: 500 }}>{product.name}</div>
                    </td>
                  );
                }
                if (colId === "description") {
                  return (
                    <td key={colId} className="wsv2-cell-desc" style={{ color: "var(--wsv2-ink-subtle)" }}>
                      {product.description ?? "—"}
                    </td>
                  );
                }
                if (colId === "type") return <td key={colId}>{product.type === "product" ? "Product" : "Service"}</td>;
                if (colId === "category") return <td key={colId}>{product.category}</td>;
                if (colId === "salePrice") return <td key={colId} className="num">{formatCurrency(product.salePrice)}</td>;
                if (colId === "tracking") return <td key={colId}>{product.inventoryTracking ? "Yes" : "No"}</td>;
                if (colId === "qty") {
                  return <td key={colId} className="num">{product.qtyOnHand == null ? "—" : formatNumber(product.qtyOnHand)}</td>;
                }
                if (colId === "avg") {
                  return <td key={colId} className="num">{product.avgUnitCost == null ? "—" : formatCurrency(product.avgUnitCost)}</td>;
                }
                if (colId === "value") {
                  return (
                    <td key={colId} className="num">
                      {product.inventoryValueDelta == null ? (
                        "—"
                      ) : (
                        <>
                          {invVal(product.qtyOnHand, product.avgUnitCost)}
                          <div style={{ fontSize: 11, color: "var(--wsv2-ink-subtle)" }}>
                            {product.inventoryValueDelta >= 0 ? "+" : ""}
                            {formatCurrency(product.inventoryValueDelta)}
                          </div>
                        </>
                      )}
                    </td>
                  );
                }
                if (colId === "actions") {
                  return (
                    <td key={colId}>
                      <div className="actions">
                        <WorkspaceMoreActions
                          actions={[
                            { id: "edit", label: "Edit details" },
                            { id: "duplicate", label: "Duplicate item" },
                            { id: "archive", label: "Archive item" },
                          ]}
                        />
                      </div>
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

export function WorkspaceStockRegister({ mode = "stock" }: Props) {
  const isStock = mode === "stock";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [visibleP, setVisibleP] = useState<string[]>(() => initVis(REG_PRODUCT, DEFAULT_PRODUCT));
  const [visibleS, setVisibleS] = useState<string[]>(() => initVis(REG_STOCK, DEFAULT_STOCK));

  const setColsP = (next: string[]) => {
    setVisibleP(next);
    saveColumnVisibility(REG_PRODUCT, next);
  };
  const setColsS = (next: string[]) => {
    setVisibleS(next);
    saveColumnVisibility(REG_STOCK, next);
  };

  const visibleStock = isStock ? visibleS : visibleP;
  const setVis = isStock ? setColsS : setColsP;
  const colDefs = isStock ? STOCK_COLS : PRODUCT_COLS;

  const filteredStock = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return stockItems.filter((item) => {
      const matchesSearch =
        lower.length === 0 ||
        item.name.toLowerCase().includes(lower) ||
        item.sku.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower);
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const filteredProducts = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        lower.length === 0 ||
        product.name.toLowerCase().includes(lower) ||
        product.sku.toLowerCase().includes(lower) ||
        product.category.toLowerCase().includes(lower);
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? product.status === "active"
            : statusFilter === "archived"
              ? product.status === "archived"
              : true;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">{isStock ? "Stock movements" : "Products & services"}</h1>
          <p className="wsv2-page-subtitle">
            {isStock
              ? "Inventory positions, average cost, and last movement. VAT is set on tax documents, not on product rows."
              : "Product and service codes with sell price and stock-aware fields. VAT is decided when you create a tax invoice or proforma, not in this catalog."}
          </p>
        </div>
        <div className="wsv2-page-actions">
          <button
            type="button"
            className="wsv2-btn"
            disabled
            title="Preview mode only — not connected to catalog API yet"
          >
            <Plus size={13} />
            {isStock ? "New stock movement" : "Add product / service"}
          </button>
        </div>
      </div>

      <WorkspaceSuggestion
        id={isStock ? "stock-register-tip" : "products-register-tip"}
        title={isStock ? "Watch average cost vs. sale" : "No VAT in this grid"}
        description={
          isStock
            ? "Values are demo data aligned with the product catalog. Use Edit columns to focus the register."
            : "The VAT column is intentionally removed. Tax treatment follows the document and customer when you invoice."
        }
      />

      <div className="wsv2-card" style={{ marginTop: 14 }}>
        <div className="wsv2-toolbar">
          <label className="wsv2-toolbar-search">
            <Search size={14} color="var(--wsv2-ink-subtle)" />
            <input
              type="search"
              placeholder={isStock ? "Search by item code, name or category" : "Search products and services"}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {isStock
              ? ["all", "in_stock", "low_stock", "out_of_stock"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="wsv2-toolbar-filter"
                    data-active={statusFilter === option ? "true" : "false"}
                    onClick={() => setStatusFilter(option)}
                  >
                    {option === "all" ? "All" : statusLabel(option as "in_stock" | "low_stock" | "out_of_stock")}
                  </button>
                ))
              : ["all", "active", "archived"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="wsv2-toolbar-filter"
                    data-active={statusFilter === option ? "true" : "false"}
                    onClick={() => setStatusFilter(option)}
                  >
                    {option === "all" ? "All" : option === "active" ? "Active" : "Archived"}
                  </button>
                ))}
          </div>
          <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11.5, color: "var(--wsv2-ink-subtle)" }}>
              {isStock ? filteredStock.length : filteredProducts.length} of {isStock ? stockItems.length : products.length}
            </span>
            <WorkspaceColumnPicker columns={colDefs} visibleIds={visibleStock} onChange={setVis} />
          </div>
        </div>
        {isStock ? (
          filteredStock.length === 0 ? (
            <WorkspaceEmptyState title="No stock items match the filters" />
          ) : (
            <StockItemsTable visibleIds={visibleS} filtered={filteredStock} />
          )
        ) : filteredProducts.length === 0 ? (
          <WorkspaceEmptyState title="No products match the filters" />
        ) : (
          <ProductsTable visibleIds={visibleP} filtered={filteredProducts} />
        )}
      </div>
    </div>
  );
}
