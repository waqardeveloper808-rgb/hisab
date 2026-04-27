"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Plus, Search } from "lucide-react";
import { products } from "@/data/workspace/products";
import { stockItems } from "@/data/workspace/stock";
import { formatCurrency, formatDate, formatNumber, statusLabel, statusTone } from "@/lib/workspace/format";
import { loadColumnVisibility, saveColumnVisibility } from "@/lib/workspace/register-column-storage";
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

/** Fixed widths for products register — pairs with table-layout: fixed in workspace.css */
const PRODUCT_COL_STYLE: Record<string, CSSProperties> = {
  code: { width: 120, minWidth: 120, maxWidth: 120 },
  status: { width: 100, minWidth: 100, maxWidth: 100 },
  name: { width: 200, minWidth: 200, maxWidth: 200 },
  description: { width: 300, minWidth: 300, maxWidth: 300 },
  type: { width: 88, minWidth: 88, maxWidth: 88 },
  category: { width: 128, minWidth: 128, maxWidth: 128 },
  salePrice: { width: 120, minWidth: 120, maxWidth: 120 },
  tracking: { width: 130, minWidth: 130, maxWidth: 130 },
  qty: { width: 100, minWidth: 100, maxWidth: 100 },
  avg: { width: 120, minWidth: 120, maxWidth: 120 },
  value: { width: 140, minWidth: 140, maxWidth: 140 },
  actions: { width: 100, minWidth: 100, maxWidth: 100 },
};

const STOCK_COL_STYLE: Record<string, CSSProperties> = {
  code: { width: 120, minWidth: 120, maxWidth: 120 },
  status: { width: 100, minWidth: 100, maxWidth: 100 },
  name: { width: 180, minWidth: 180, maxWidth: 180 },
  description: { width: 260, minWidth: 260, maxWidth: 260 },
  tracking: { width: 120, minWidth: 120, maxWidth: 120 },
  qty: { width: 100, minWidth: 100, maxWidth: 100 },
  avg: { width: 110, minWidth: 110, maxWidth: 110 },
  value: { width: 130, minWidth: 130, maxWidth: 130 },
  last: { width: 120, minWidth: 120, maxWidth: 120 },
  warehouse: { width: 140, minWidth: 140, maxWidth: 140 },
  actions: { width: 100, minWidth: 100, maxWidth: 100 },
};

function initVis(reg: string, defaults: string[]) {
  if (typeof window === "undefined") return defaults;
  return loadColumnVisibility(reg, defaults);
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

  const visibleStock = isStock
    ? visibleS
    : visibleP;
  const setVis = isStock ? setColsS : setColsP;
  const colDefs = isStock ? STOCK_COLS : PRODUCT_COLS;
  const vp = new Set(visibleStock);
  const show = (id: string) => vp.has(id);

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

  const invVal = (qty: number | null, avg: number | null) => {
    if (qty == null || avg == null) return "—";
    return formatCurrency(qty * avg);
  };

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
        <div className="wsv2-table-scroll">
          {isStock ? (
            filteredStock.length === 0 ? (
              <WorkspaceEmptyState title="No stock items match the filters" />
            ) : (
              <table className="wsv2-table">
                <thead>
                  <tr>
                    {show("code") ? <th style={STOCK_COL_STYLE.code}>Item code</th> : null}
                    {show("status") ? <th style={STOCK_COL_STYLE.status}>Status</th> : null}
                    {show("name") ? <th style={STOCK_COL_STYLE.name}>Item name</th> : null}
                    {show("description") ? <th className="wsv2-cell-desc" style={STOCK_COL_STYLE.description}>Description</th> : null}
                    {show("tracking") ? <th style={STOCK_COL_STYLE.tracking}>Inventory tracking</th> : null}
                    {show("qty") ? <th className="num" style={STOCK_COL_STYLE.qty}>Qty on hand</th> : null}
                    {show("avg") ? <th className="num" style={STOCK_COL_STYLE.avg}>Avg unit cost</th> : null}
                    {show("value") ? <th className="num" style={STOCK_COL_STYLE.value}>Inventory value +/–</th> : null}
                    {show("last") ? <th style={STOCK_COL_STYLE.last}>Last movement</th> : null}
                    {show("warehouse") ? <th style={STOCK_COL_STYLE.warehouse}>Warehouse / location</th> : null}
                    {show("actions") ? <th style={{ ...STOCK_COL_STYLE.actions, textAlign: "right" }}>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map((item) => (
                    <tr key={item.id}>
                      {show("code") ? (
                        <td style={{ ...STOCK_COL_STYLE.code, fontFamily: "ui-monospace, SFMono-Regular, monospace", fontWeight: 600 }}>
                          {item.sku}
                        </td>
                      ) : null}
                      {show("status") ? (
                        <td style={STOCK_COL_STYLE.status}>
                          <span className="wsv2-pill" data-tone={statusTone(item.status)}>
                            <span className="wsv2-status-dot" /> {statusLabel(item.status)}
                          </span>
                        </td>
                      ) : null}
                      {show("name") ? <td style={STOCK_COL_STYLE.name}>{item.name}</td> : null}
                      {show("description") ? <td className="wsv2-cell-desc" style={{ ...STOCK_COL_STYLE.description, color: "var(--wsv2-ink-subtle)" }}>{item.description ?? "—"}</td> : null}
                      {show("tracking") ? <td style={STOCK_COL_STYLE.tracking}>{item.inventoryTracking ? "Tracked" : "—"}</td> : null}
                      {show("qty") ? (
                        <td className="num" style={STOCK_COL_STYLE.qty}>
                          {formatNumber(item.onHand)} {item.unit}
                        </td>
                      ) : null}
                      {show("avg") ? <td className="num" style={STOCK_COL_STYLE.avg}>{formatCurrency(item.avgUnitCost)}</td> : null}
                      {show("value") ? (
                        <td className="num" style={STOCK_COL_STYLE.value}>
                          {formatCurrency(item.onHand * item.avgUnitCost)}
                          <div style={{ fontSize: 11, color: "var(--wsv2-ink-subtle)" }}>
                            {item.inventoryValueDelta >= 0 ? "+" : ""}
                            {formatCurrency(item.inventoryValueDelta)}
                          </div>
                        </td>
                      ) : null}
                      {show("last") ? <td style={STOCK_COL_STYLE.last}>{formatDate(item.lastMovement)}</td> : null}
                      {show("warehouse") ? <td style={STOCK_COL_STYLE.warehouse}>{item.warehouse ?? "—"}</td> : null}
                      {show("actions") ? (
                        <td style={STOCK_COL_STYLE.actions}>
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
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : filteredProducts.length === 0 ? (
            <WorkspaceEmptyState title="No products match the filters" />
          ) : (
            <table className="wsv2-table">
              <thead>
                <tr>
                  {show("code") ? <th style={PRODUCT_COL_STYLE.code}>Code</th> : null}
                  {show("status") ? <th style={PRODUCT_COL_STYLE.status}>Status</th> : null}
                  {show("name") ? <th style={PRODUCT_COL_STYLE.name}>Name</th> : null}
                  {show("description") ? <th className="wsv2-cell-desc" style={PRODUCT_COL_STYLE.description}>Description</th> : null}
                  {show("type") ? <th style={PRODUCT_COL_STYLE.type}>Type</th> : null}
                  {show("category") ? <th style={PRODUCT_COL_STYLE.category}>Category</th> : null}
                  {show("salePrice") ? <th className="num" style={PRODUCT_COL_STYLE.salePrice}>Sale / base price</th> : null}
                  {show("tracking") ? <th style={PRODUCT_COL_STYLE.tracking}>Inventory tracking</th> : null}
                  {show("qty") ? <th className="num" style={PRODUCT_COL_STYLE.qty}>Qty on hand</th> : null}
                  {show("avg") ? <th className="num" style={PRODUCT_COL_STYLE.avg}>Avg unit cost</th> : null}
                  {show("value") ? <th className="num" style={PRODUCT_COL_STYLE.value}>Inventory value +/–</th> : null}
                  {show("actions") ? <th style={{ ...PRODUCT_COL_STYLE.actions, textAlign: "right" }}>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    {show("code") ? (
                      <td style={{ ...PRODUCT_COL_STYLE.code, fontFamily: "ui-monospace, SFMono-Regular, monospace", fontWeight: 600 }}>
                        {product.sku}
                      </td>
                    ) : null}
                    {show("status") ? (
                      <td style={PRODUCT_COL_STYLE.status}>
                        <span
                          className="wsv2-pill"
                          data-tone={product.status === "active" ? "success" : "neutral"}
                        >
                          <span className="wsv2-status-dot" />
                          {product.status === "active" ? "Active" : "Archived"}
                        </span>
                      </td>
                    ) : null}
                    {show("name") ? (
                      <td style={PRODUCT_COL_STYLE.name}>
                        <div style={{ fontWeight: 500 }}>{product.name}</div>
                      </td>
                    ) : null}
                    {show("description") ? (
                      <td className="wsv2-cell-desc" style={{ ...PRODUCT_COL_STYLE.description, color: "var(--wsv2-ink-subtle)" }}>{product.description ?? "—"}</td>
                    ) : null}
                    {show("type") ? <td style={PRODUCT_COL_STYLE.type}>{product.type === "product" ? "Product" : "Service"}</td> : null}
                    {show("category") ? <td style={PRODUCT_COL_STYLE.category}>{product.category}</td> : null}
                    {show("salePrice") ? <td className="num" style={PRODUCT_COL_STYLE.salePrice}>{formatCurrency(product.salePrice)}</td> : null}
                    {show("tracking") ? <td style={PRODUCT_COL_STYLE.tracking}>{product.inventoryTracking ? "Yes" : "No"}</td> : null}
                    {show("qty") ? (
                      <td className="num" style={PRODUCT_COL_STYLE.qty}>{product.qtyOnHand == null ? "—" : formatNumber(product.qtyOnHand)}</td>
                    ) : null}
                    {show("avg") ? (
                      <td className="num" style={PRODUCT_COL_STYLE.avg}>{product.avgUnitCost == null ? "—" : formatCurrency(product.avgUnitCost)}</td>
                    ) : null}
                    {show("value") ? (
                      <td className="num" style={PRODUCT_COL_STYLE.value}>
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
                    ) : null}
                    {show("actions") ? (
                      <td style={PRODUCT_COL_STYLE.actions}>
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
