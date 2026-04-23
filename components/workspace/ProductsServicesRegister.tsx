"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { DirectoryImportPanel } from "@/components/workspace/DirectoryImportPanel";
import { StandardActionBar } from "@/components/workspace/StandardActionBar";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";
import type { ItemKind, ItemRecord } from "@/components/workflow/types";
import {
  buildDirectoryImportMapping,
  buildItemImportPreview,
  getDirectoryImportRequiredFields,
  getItemImportFields,
} from "@/lib/directory-import";
import { createItemInBackend, getWorkspaceDirectory, updateItemInBackend } from "@/lib/workspace-api";
import { currency } from "@/components/workflow/utils";
import { exportRowsToCsv } from "@/lib/spreadsheet";

const emptyDraft: {
  name: string;
  sku: string;
  kind: ItemKind;
  inventoryClassification: string;
  description: string;
  salePrice: string;
  purchasePrice: string;
  taxLabel: string;
  category: string;
  isActive: boolean;
} = {
  name: "",
  sku: "",
  kind: "service",
  inventoryClassification: "non_stock_service",
  description: "",
  salePrice: "",
  purchasePrice: "",
  taxLabel: "VAT 15%",
  category: "",
  isActive: true,
};

export function ProductsServicesRegister() {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "archived" | "all">("active");
  const [typeFilter, setTypeFilter] = useState<"all" | ItemKind>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    getWorkspaceDirectory()
      .then((directory) => {
        setItems(directory?.items ?? []);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredItems = useMemo(
    () => items.filter((row) => {
      const matchesQuery = `${row.name} ${row.sku} ${row.taxLabel} ${row.kind} ${row.description ?? ""}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : statusFilter === "active" ? row.isActive !== false : row.isActive === false;
      const matchesType = typeFilter === "all" ? true : row.kind === typeFilter;
      return matchesQuery && matchesStatus && matchesType;
    }),
    [items, query, statusFilter, typeFilter],
  );
  const selectedItem = filteredItems.find((row) => row.id === selectedItemId) ?? filteredItems[0] ?? null;

  function draftFromItem(item: ItemRecord) {
    return {
      name: item.name,
      sku: item.sku,
      kind: item.kind,
      inventoryClassification: item.inventoryClassification ?? (item.kind === "product" ? "inventory_tracked" : "non_stock_service"),
      description: item.description ?? "",
      salePrice: String(item.salePrice || ""),
      purchasePrice: String(item.purchasePrice || ""),
      taxLabel: item.taxLabel,
      category: item.category ?? "",
      isActive: item.isActive !== false,
    };
  }

  async function handleCreate() {
    if (!draft.name.trim()) {
      setError("Item name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const selectedExisting = items.find((item) => item.id === selectedItemId) ?? null;
      const payload = {
        kind: draft.kind,
        inventoryClassification: draft.inventoryClassification,
        name: draft.name.trim(),
        sku: draft.sku.trim(),
        description: draft.description.trim(),
        salePrice: Number(draft.salePrice || 0),
        purchasePrice: Number(draft.purchasePrice || 0),
        taxLabel: draft.taxLabel.trim() || "VAT 15%",
        category: draft.category.trim() || undefined,
        isActive: draft.isActive,
      };

      const created = selectedExisting?.backendId
        ? await updateItemInBackend(selectedExisting.backendId, payload)
        : await createItemInBackend(payload);

      if (!created) {
        setError(selectedExisting?.backendId ? "Item could not be updated in the current mode." : "Product could not be created in the current mode.");
        return;
      }

      setItems((current) => selectedExisting?.backendId
        ? current.map((item) => item.id === created.id ? created : item)
        : [created, ...current]);
      setSelectedItemId(created.id);
      setDraft(emptyDraft);
      setShowCreate(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleImportRows(rows: Array<Parameters<typeof createItemInBackend>[0]>) {
    const created: ItemRecord[] = [];
    const generatedRecords: string[] = [];
    const errors: string[] = [];

    for (const row of rows) {
      const result = await createItemInBackend(row);
      if (result) {
        created.push(result);
        generatedRecords.push(result.name);
      } else {
        errors.push(`Failed to import item ${row.name}.`);
      }
    }

    return {
      created,
      summary: {
        totalRows: rows.length,
        validRows: rows.length,
        invalidRows: errors.length,
        importedRows: created.length,
        skippedRows: 0,
        failedRows: errors.length,
        generatedRecords,
        warnings: [],
        errors,
      },
    };
  }

  return (
    <div className="space-y-4" data-inspector-real-register="products">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Products & Services</h1>
          <p className="text-sm text-muted">Saved products, services, and inventory-linked items for invoices, delivery notes, imports, and downstream stock workflows.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setShowCreate((current) => !current)}>{showCreate ? "Close" : "Add Product"}</Button>
          <StandardActionBar compact actions={[
            { label: "Edit", onClick: () => {
              if (!selectedItem) {
                return;
              }
              setDraft(draftFromItem(selectedItem));
              setShowCreate(true);
            }, disabled: !selectedItem },
            { label: "Save", onClick: () => void handleCreate(), disabled: !showCreate || saving },
            { label: selectedItem?.isActive === false ? "Activate" : "Archive", onClick: async () => {
              if (!selectedItem?.backendId) {
                return;
              }

              setSaving(true);
              setError(null);
              const updated = await updateItemInBackend(selectedItem.backendId, {
                kind: selectedItem.kind,
                inventoryClassification: selectedItem.inventoryClassification,
                name: selectedItem.name,
                sku: selectedItem.sku,
                description: selectedItem.description,
                salePrice: selectedItem.salePrice,
                purchasePrice: selectedItem.purchasePrice,
                taxLabel: selectedItem.taxLabel,
                category: selectedItem.category,
                isActive: selectedItem.isActive === false,
              });
              setSaving(false);

              if (!updated) {
                setError("Item status could not be updated.");
                return;
              }

              setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
            }, disabled: !selectedItem || saving },
            { label: "Export", onClick: () => exportRowsToCsv(filteredItems.map((row) => ({ name: row.name, code: row.sku, type: row.kind, salePrice: row.salePrice })), [
              { label: "Name", value: (row) => row.name },
              { label: "Code", value: (row) => row.code },
              { label: "Type", value: (row) => row.type },
              { label: "Sale price", value: (row) => row.salePrice },
            ], "products-services.csv") },
          ]} />
        </div>
      </div>

      <WorkspaceModeNotice
        title="Backend-backed product register"
        detail="This register reads only company-owned item records. If the backend is unavailable, the page stays empty instead of injecting demo products."
      />

      <DirectoryImportPanel
        entity="item"
        title="Products & Services Import"
        description="Upload or paste item rows, map fields, validate commercial defaults, and load invoice-ready products or services into the register."
        exampleSource={"product,sku,type,sale_price,purchase_price,tax_label,category\nLED Panel,LED-10,product,250,180,Standard VAT 15%,Lighting"}
        sourceLabelDefault="items-import.csv"
        fields={getItemImportFields()}
        requiredFields={getDirectoryImportRequiredFields("item")}
        storageKey="item-import-logs"
        importActorLabel="workspace user"
        buildPreview={(table, currentMapping) => {
          const mapping = Object.values(currentMapping).some(Boolean)
            ? currentMapping
            : buildDirectoryImportMapping(table.headers, getItemImportFields());
          return buildItemImportPreview(table, mapping, items.map((row) => row.name));
        }}
        previewColumns={[
          { label: "Name", value: (row) => row.name },
          { label: "Code", value: (row) => row.sku || "-" },
          { label: "Type", value: (row) => row.kind },
          { label: "Sale", value: (row) => row.salePrice },
        ]}
        importRows={handleImportRows}
        onCreated={(rows) => {
          setItems((current) => [...rows, ...current]);
          if (rows[0]) {
            setSelectedItemId(rows[0].id);
          }
        }}
      />

      {showCreate ? (
        <Card className="rounded-[1.25rem] bg-white/95 p-4" data-inspector-form="product-create">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <Input label="Name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
            <Input label="Code" value={draft.sku} onChange={(event) => setDraft((current) => ({ ...current, sku: event.target.value.toUpperCase() }))} />
            <div>
              <label htmlFor="product-kind" className="mb-2 block text-sm font-semibold text-ink">Type</label>
              <select id="product-kind" value={draft.kind} onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value as "product" | "service" }))} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                <option value="service">Service</option>
                <option value="product">Product</option>
              </select>
            </div>
            <div>
              <label htmlFor="inventory-classification" className="mb-2 block text-sm font-semibold text-ink">Stock mode</label>
              <select id="inventory-classification" value={draft.inventoryClassification} onChange={(event) => setDraft((current) => ({ ...current, inventoryClassification: event.target.value }))} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                <option value="inventory_tracked">Inventory tracked</option>
                <option value="non_stock_service">Non-stock service</option>
              </select>
            </div>
            <Input label="Sale price" type="number" min="0" step="0.01" value={draft.salePrice} onChange={(event) => setDraft((current) => ({ ...current, salePrice: event.target.value }))} />
            <Input label="Purchase price" type="number" min="0" step="0.01" value={draft.purchasePrice} onChange={(event) => setDraft((current) => ({ ...current, purchasePrice: event.target.value }))} />
            <Input label="Category" value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} />
            <Input label="Tax label" value={draft.taxLabel} onChange={(event) => setDraft((current) => ({ ...current, taxLabel: event.target.value }))} />
            <div className="lg:col-span-2 xl:col-span-3">
              <label htmlFor="product-description" className="mb-2 block text-sm font-semibold text-ink">Description</label>
              <textarea id="product-description" rows={3} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
            </div>
            <label className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-soft px-3 py-2 text-sm font-semibold text-ink"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} />Active item</label>
          </div>
          {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          <div className="mt-4 flex gap-3">
            <Button onClick={() => void handleCreate()} disabled={saving}>{saving ? "Saving" : (items.some((item) => item.id === selectedItemId) ? "Save Item" : "Create Item")}</Button>
            <Button variant="secondary" onClick={() => { setShowCreate(false); setDraft(emptyDraft); }}>Cancel</Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
      <Card className="rounded-[1.25rem] bg-white/95 p-0 overflow-hidden">
        <div className="border-b border-line px-4 py-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem]">
            <Input label="Search products and services" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, code, type, or tax label" />
            <div>
              <label htmlFor="product-status-filter" className="mb-2 block text-sm font-semibold text-ink">Status</label>
              <select id="product-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "active" | "archived" | "all")} className="block h-11 w-full rounded-xl border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="all">All</option>
              </select>
            </div>
            <div>
              <label htmlFor="product-type-filter" className="mb-2 block text-sm font-semibold text-ink">Type</label>
              <select id="product-type-filter" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "all" | ItemKind)} className="block h-11 w-full rounded-xl border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                <option value="all">All</option>
                <option value="product">Products</option>
                <option value="service">Services</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line bg-surface-soft/70">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-muted">Sale price</th>
                <th className="px-4 py-3 text-right font-semibold text-muted">Purchase price</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Tax</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-4 text-muted" colSpan={7}>Loading items...</td></tr>
              ) : filteredItems.length ? filteredItems.map((item) => (
                <tr key={item.id} className={["border-t border-line/70 cursor-pointer", selectedItem?.id === item.id ? "bg-primary-soft/20" : "hover:bg-surface-soft/40"].join(" ")} onClick={() => setSelectedItemId(item.id)}>
                  <td className="px-4 py-3 font-semibold text-ink">{item.name}</td>
                  <td className="px-4 py-3 text-muted">{item.sku || "-"}</td>
                  <td className="px-4 py-3 text-muted capitalize">{item.kind}</td>
                  <td className="px-4 py-3 text-muted">{item.isActive === false ? "Archived" : "Active"}</td>
                  <td className="px-4 py-3 text-right text-muted">{currency(item.salePrice)} SAR</td>
                  <td className="px-4 py-3 text-right text-muted">{currency(item.purchasePrice)} SAR</td>
                  <td className="px-4 py-3 text-muted">{item.taxLabel}</td>
                </tr>
              )) : (
                <tr>
                  <td className="px-4 py-6" colSpan={7}>
                    <div className="rounded-lg border border-dashed border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                      <p className="font-semibold text-ink">No products or services are ready yet.</p>
                      <p className="mt-1">Add the first saved item here so sales and purchase documents stop depending on one-off line descriptions.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="rounded-[1.25rem] bg-white/95 p-0 overflow-hidden" data-inspector-detail-card="product">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Product Detail</p>
            <h2 className="text-base font-semibold text-ink">{selectedItem?.name ?? "Select a product"}</h2>
          </div>
          <StandardActionBar compact actions={[
            { label: "Edit", onClick: () => {
              if (!selectedItem) {
                return;
              }
              setDraft(draftFromItem(selectedItem));
              setShowCreate(true);
            }, disabled: !selectedItem },
            { label: "Save", onClick: () => void handleCreate(), disabled: true },
            { label: selectedItem?.isActive === false ? "Activate" : "Archive", onClick: async () => {
              if (!selectedItem?.backendId) {
                return;
              }
              const updated = await updateItemInBackend(selectedItem.backendId, {
                kind: selectedItem.kind,
                inventoryClassification: selectedItem.inventoryClassification,
                name: selectedItem.name,
                sku: selectedItem.sku,
                description: selectedItem.description,
                salePrice: selectedItem.salePrice,
                purchasePrice: selectedItem.purchasePrice,
                taxLabel: selectedItem.taxLabel,
                category: selectedItem.category,
                isActive: selectedItem.isActive === false,
              });
              if (updated) {
                setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
              }
            }, disabled: !selectedItem },
            { label: "Export", onClick: () => exportRowsToCsv(selectedItem ? [{ name: selectedItem.name, code: selectedItem.sku, category: selectedItem.category ?? "", sale: selectedItem.salePrice }] : [], [
              { label: "Name", value: (row) => row.name },
              { label: "Code", value: (row) => row.code },
              { label: "Category", value: (row) => row.category },
              { label: "Sale", value: (row) => row.sale },
            ], `${selectedItem?.name ?? "product"}.csv`), disabled: !selectedItem },
          ]} />
        </div>
        {selectedItem ? (
          <div className="space-y-3 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface-soft/30 p-3 text-sm text-muted">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Commercial</p>
                <div className="mt-2 space-y-1.5">
                  <p><span className="font-semibold text-ink">Code:</span> {selectedItem.sku || "-"}</p>
                  <p><span className="font-semibold text-ink">Type:</span> {selectedItem.kind}</p>
                  <p><span className="font-semibold text-ink">Stock mode:</span> {selectedItem.inventoryClassification || "-"}</p>
                  <p><span className="font-semibold text-ink">Category:</span> {selectedItem.category || "-"}</p>
                  <p><span className="font-semibold text-ink">Status:</span> {selectedItem.isActive === false ? "Archived" : "Active"}</p>
                </div>
              </div>
              <div className="rounded-lg border border-line bg-surface-soft/30 p-3 text-sm text-muted">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Pricing</p>
                <div className="mt-2 space-y-1.5">
                  <p><span className="font-semibold text-ink">Sale price:</span> {currency(selectedItem.salePrice)} SAR</p>
                  <p><span className="font-semibold text-ink">Purchase price:</span> {currency(selectedItem.purchasePrice)} SAR</p>
                  <p><span className="font-semibold text-ink">Tax:</span> {selectedItem.taxLabel}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-line bg-surface-soft/30 p-3 text-sm text-muted">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Description</p>
              <p className="mt-2 leading-6">{selectedItem.description || "No saved description."}</p>
            </div>
            <div className="rounded-lg border border-line bg-white p-3 text-sm text-muted">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">Next actions</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="xs" variant="secondary" href="/workspace/invoices/new?documentType=tax_invoice&resumeDraft=1">Use on invoice</Button>
                <Button size="xs" variant="secondary" href="/workspace/user/stock?returnTo=%2Fworkspace%2Finvoices%2Fnew%3FresumeDraft%3D1">Add inventory and return</Button>
                <Button size="xs" variant="secondary" href="/workspace/user/proforma-invoices">Use in proforma workflow</Button>
              </div>
            </div>
          </div>
        ) : <div className="p-4 text-sm text-muted">Select a product row to review pricing, category, and next workflow steps.</div>}
      </Card>
      </div>
    </div>
  );
}