"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";
import type { ItemKind, ItemRecord } from "@/components/workflow/types";
import { createItemInBackend, getWorkspaceDirectory } from "@/lib/workspace-api";
import { currency } from "@/components/workflow/utils";

const emptyDraft: {
  name: string;
  sku: string;
  kind: ItemKind;
  salePrice: string;
  purchasePrice: string;
  taxLabel: string;
} = {
  name: "",
  sku: "",
  kind: "service",
  salePrice: "",
  purchasePrice: "",
  taxLabel: "VAT 15%",
};

export function ProductsServicesRegister() {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    () => items.filter((row) => `${row.name} ${row.sku} ${row.taxLabel} ${row.kind}`.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );

  async function handleCreate() {
    if (!draft.name.trim()) {
      setError("Item name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const created = await createItemInBackend({
        kind: draft.kind,
        name: draft.name.trim(),
        sku: draft.sku.trim(),
        salePrice: Number(draft.salePrice || 0),
        purchasePrice: Number(draft.purchasePrice || 0),
        taxLabel: draft.taxLabel.trim() || "VAT 15%",
      });

      if (!created) {
        setError("Product could not be created in the current mode.");
        return;
      }

      setItems((current) => [created, ...current]);
      setDraft(emptyDraft);
      setShowCreate(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4" data-inspector-real-register="products">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Products & Services</h1>
          <p className="text-sm text-muted">Saved items for invoices, bills, quotations, and recurring document lines.</p>
        </div>
        <Button onClick={() => setShowCreate((current) => !current)}>{showCreate ? "Close" : "Add Product"}</Button>
      </div>

      <WorkspaceModeNotice
        title="Preview product register"
        detail="Guest mode keeps a real item register available so invoice and bill line selection stays benchmark-testable."
      />

      {showCreate ? (
        <Card className="rounded-[1.25rem] bg-white/95 p-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Input label="Name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
            <Input label="Code" value={draft.sku} onChange={(event) => setDraft((current) => ({ ...current, sku: event.target.value.toUpperCase() }))} />
            <div>
              <label htmlFor="product-kind" className="mb-2 block text-sm font-semibold text-ink">Type</label>
              <select id="product-kind" value={draft.kind} onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value as "product" | "service" }))} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                <option value="service">Service</option>
                <option value="product">Product</option>
              </select>
            </div>
            <Input label="Sale price" type="number" min="0" step="0.01" value={draft.salePrice} onChange={(event) => setDraft((current) => ({ ...current, salePrice: event.target.value }))} />
            <Input label="Purchase price" type="number" min="0" step="0.01" value={draft.purchasePrice} onChange={(event) => setDraft((current) => ({ ...current, purchasePrice: event.target.value }))} />
            <Input label="Tax label" value={draft.taxLabel} onChange={(event) => setDraft((current) => ({ ...current, taxLabel: event.target.value }))} />
          </div>
          {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          <div className="mt-4 flex gap-3">
            <Button onClick={() => void handleCreate()} disabled={saving}>{saving ? "Saving" : "Create Item"}</Button>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </Card>
      ) : null}

      <Card className="rounded-[1.25rem] bg-white/95 p-0 overflow-hidden">
        <div className="border-b border-line px-4 py-4">
          <div className="max-w-sm">
            <Input label="Search products and services" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, code, type, or tax label" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line bg-surface-soft/70">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Type</th>
                <th className="px-4 py-3 text-right font-semibold text-muted">Sale price</th>
                <th className="px-4 py-3 text-right font-semibold text-muted">Purchase price</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Tax</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-4 text-muted" colSpan={6}>Loading items...</td></tr>
              ) : filteredItems.length ? filteredItems.map((item) => (
                <tr key={item.id} className="border-t border-line/70">
                  <td className="px-4 py-3 font-semibold text-ink">{item.name}</td>
                  <td className="px-4 py-3 text-muted">{item.sku || "-"}</td>
                  <td className="px-4 py-3 text-muted capitalize">{item.kind}</td>
                  <td className="px-4 py-3 text-right text-muted">{currency(item.salePrice)} SAR</td>
                  <td className="px-4 py-3 text-right text-muted">{currency(item.purchasePrice)} SAR</td>
                  <td className="px-4 py-3 text-muted">{item.taxLabel}</td>
                </tr>
              )) : (
                <tr>
                  <td className="px-4 py-6" colSpan={6}>
                    <div className="rounded-[1.2rem] border border-dashed border-line bg-surface-soft px-4 py-4 text-sm text-muted">
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
    </div>
  );
}