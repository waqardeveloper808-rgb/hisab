"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { products } from "@/data/workspace-v2/products";
import { stockItems } from "@/data/workspace-v2/stock";
import { formatCurrency, formatDate, formatNumber, statusLabel, statusTone } from "@/lib/workspace-v2/format";
import { loadColumnVisibility, saveColumnVisibility } from "@/lib/workspace-v2/register-column-storage";
import { WorkspaceV2EmptyState } from "./WorkspaceV2EmptyState";
import { WorkspaceV2Suggestion } from "./WorkspaceV2Suggestion";
import { WorkspaceV2MoreActions } from "./WorkspaceV2MoreActions";
import { WorkspaceV2ColumnPicker, type ColumnDef } from "./WorkspaceV2ColumnPicker";

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

function initVis(reg: string, defaults: string[]) {
  if (typeof window === "undefined") return defaults;
  return loadColumnVisibility(reg, defaults);
}

export function WorkspaceV2StockRegister({ mode = "stock" }: Props) {
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

      <WorkspaceV2Suggestion
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
            <WorkspaceV2ColumnPicker columns={colDefs} visibleIds={visibleStock} onChange={setVis} />
          </div>
        </div>
        <div className="wsv2-table-scroll">
          {isStock ? (
            filteredStock.length === 0 ? (
              <WorkspaceV2EmptyState title="No stock items match the filters" />
            ) : (
              <table className="wsv2-table">
                <thead>
                  <tr>
                    {show("code") ? <th>Item code</th> : null}
                    {show("status") ? <th>Status</th> : null}
                    {show("name") ? <th>Item name</th> : null}
                    {show("description") ? <th>Description</th> : null}
                    {show("tracking") ? <th>Inventory tracking</th> : null}
                    {show("qty") ? <th className="num">Qty on hand</th> : null}
                    {show("avg") ? <th className="num">Avg unit cost</th> : null}
                    {show("value") ? <th className="num">Inventory value +/–</th> : null}
                    {show("last") ? <th>Last movement</th> : null}
                    {show("warehouse") ? <th>Warehouse / location</th> : null}
                    {show("actions") ? <th style={{ textAlign: "right" }}>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map((item) => (
                    <tr key={item.id}>
                      {show("code") ? (
                        <td style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontWeight: 600 }}>
                          {item.sku}
                        </td>
                      ) : null}
                      {show("status") ? (
                        <td>
                          <span className="wsv2-pill" data-tone={statusTone(item.status)}>
                            <span className="wsv2-status-dot" /> {statusLabel(item.status)}
                          </span>
                        </td>
                      ) : null}
                      {show("name") ? <td>{item.name}</td> : null}
                      {show("description") ? <td style={{ color: "var(--wsv2-ink-subtle)", maxWidth: 200 }}>{item.description ?? "—"}</td> : null}
                      {show("tracking") ? <td>{item.inventoryTracking ? "Tracked" : "—"}</td> : null}
                      {show("qty") ? (
                        <td className="num">
                          {formatNumber(item.onHand)} {item.unit}
                        </td>
                      ) : null}
                      {show("avg") ? <td className="num">{formatCurrency(item.avgUnitCost)}</td> : null}
                      {show("value") ? (
                        <td className="num">
                          {formatCurrency(item.onHand * item.avgUnitCost)}
                          <div style={{ fontSize: 11, color: "var(--wsv2-ink-subtle)" }}>
                            {item.inventoryValueDelta >= 0 ? "+" : ""}
                            {formatCurrency(item.inventoryValueDelta)}
                          </div>
                        </td>
                      ) : null}
                      {show("last") ? <td>{formatDate(item.lastMovement)}</td> : null}
                      {show("warehouse") ? <td>{item.warehouse ?? "—"}</td> : null}
                      {show("actions") ? (
                        <td>
                          <div className="actions">
                            <WorkspaceV2MoreActions
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
            <WorkspaceV2EmptyState title="No products match the filters" />
          ) : (
            <table className="wsv2-table">
              <thead>
                <tr>
                  {show("code") ? <th>Code</th> : null}
                  {show("status") ? <th>Status</th> : null}
                  {show("name") ? <th>Name</th> : null}
                  {show("description") ? <th>Description</th> : null}
                  {show("type") ? <th>Type</th> : null}
                  {show("category") ? <th>Category</th> : null}
                  {show("salePrice") ? <th className="num">Sale / base price</th> : null}
                  {show("tracking") ? <th>Inventory tracking</th> : null}
                  {show("qty") ? <th className="num">Qty on hand</th> : null}
                  {show("avg") ? <th className="num">Avg unit cost</th> : null}
                  {show("value") ? <th className="num">Inventory value +/–</th> : null}
                  {show("actions") ? <th style={{ textAlign: "right" }}>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    {show("code") ? (
                      <td style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontWeight: 600 }}>
                        {product.sku}
                      </td>
                    ) : null}
                    {show("status") ? (
                      <td>
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
                      <td>
                        <div style={{ fontWeight: 500 }}>{product.name}</div>
                      </td>
                    ) : null}
                    {show("description") ? (
                      <td style={{ color: "var(--wsv2-ink-subtle)", maxWidth: 220 }}>{product.description ?? "—"}</td>
                    ) : null}
                    {show("type") ? <td>{product.type === "product" ? "Product" : "Service"}</td> : null}
                    {show("category") ? <td>{product.category}</td> : null}
                    {show("salePrice") ? <td className="num">{formatCurrency(product.salePrice)}</td> : null}
                    {show("tracking") ? <td>{product.inventoryTracking ? "Yes" : "No"}</td> : null}
                    {show("qty") ? (
                      <td className="num">{product.qtyOnHand == null ? "—" : formatNumber(product.qtyOnHand)}</td>
                    ) : null}
                    {show("avg") ? (
                      <td className="num">{product.avgUnitCost == null ? "—" : formatCurrency(product.avgUnitCost)}</td>
                    ) : null}
                    {show("value") ? (
                      <td className="num">
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
                      <td>
                        <div className="actions">
                          <WorkspaceV2MoreActions
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
