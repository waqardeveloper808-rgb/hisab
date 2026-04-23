"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { DocumentLinkTrigger } from "@/components/workspace/DocumentLinkTrigger";
import { DocumentLinkPreviewModal } from "@/components/workspace/DocumentLinkPreviewModal";
import { StandardActionBar } from "@/components/workspace/StandardActionBar";
import { createInventoryAdjustment, listInventoryAdjustments, listInventoryStock, type InventoryAdjustmentRecord, type InventoryStockRecord } from "@/lib/workspace-api";
import { Input } from "@/components/Input";
import { exportRowsToCsv } from "@/lib/spreadsheet";

export function InventoryAdjustmentsRegister() {
  const [rows, setRows] = useState<InventoryAdjustmentRecord[]>([]);
  const [preview, setPreview] = useState<InventoryAdjustmentRecord | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [stock, setStock] = useState<InventoryStockRecord[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createDraft, setCreateDraft] = useState({ inventoryItemId: "", quantityDelta: "", reason: "", reference: "" });
  const [linkPreview, setLinkPreview] = useState<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null } | null>(null);

  useEffect(() => {
    listInventoryAdjustments().then(setRows);
    listInventoryStock().then(setStock);
  }, []);

  async function handleCreate() {
    const created = await createInventoryAdjustment({
      inventoryItemId: Number(createDraft.inventoryItemId),
      quantityDelta: Number(createDraft.quantityDelta),
      reason: createDraft.reason || "Inventory adjustment",
      reference: createDraft.reference || undefined,
    });
    setRows((current) => [created, ...current]);
    setCreateDraft({ inventoryItemId: "", quantityDelta: "", reason: "", reference: "" });
    setShowCreate(false);
  }

  const filtered = useMemo(() => {
    if (!search) return rows;
    return rows.filter((a) =>
      a.reference.toLowerCase().includes(search.toLowerCase()) ||
      a.reason.toLowerCase().includes(search.toLowerCase()) ||
      a.productName.toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-semibold text-ink">Inventory Adjustments</h1>
          <span className="rounded bg-surface-soft px-1.5 py-0.5 text-[10px] font-semibold text-muted">{filtered.length}</span>
        </div>
        <div className="flex gap-1.5">
          <Button size="xs" variant="muted" onClick={() => setFiltersOpen(!filtersOpen)}>
            {filtersOpen ? "Hide Filters" : "Filters"}
          </Button>
          <Button size="xs" variant="secondary" onClick={() => setShowCreate((current) => !current)}>{showCreate ? "Close Adjustment" : "New Adjustment"}</Button>
          <Button size="xs" variant="primary" href="/workspace/user/stock">Add Inventory</Button>
          <StandardActionBar compact actions={[
            { label: "Edit", onClick: () => setShowCreate(true), disabled: !preview },
            { label: "Save", onClick: () => void handleCreate(), disabled: !showCreate },
            { label: "Delete", onClick: () => setCreateDraft({ inventoryItemId: "", quantityDelta: "", reason: "", reference: "" }), disabled: !showCreate },
            { label: "Export", onClick: () => exportRowsToCsv(filtered.map((row) => ({ reference: row.reference, date: row.date, reason: row.reason, quantity: row.quantity })), [
              { label: "Reference", value: (row) => row.reference },
              { label: "Date", value: (row) => row.date },
              { label: "Reason", value: (row) => row.reason },
              { label: "Quantity", value: (row) => row.quantity },
            ], "inventory-adjustments.csv") },
          ]} />
        </div>
      </div>

      {showCreate ? (
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">Inventory item</label>
              <select value={createDraft.inventoryItemId} onChange={(event) => setCreateDraft((current) => ({ ...current, inventoryItemId: event.target.value }))} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                <option value="">Select item</option>
                {stock.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.productName}</option>)}
              </select>
            </div>
            <Input label="Quantity delta" type="number" value={createDraft.quantityDelta} onChange={(event) => setCreateDraft((current) => ({ ...current, quantityDelta: event.target.value }))} />
            <Input label="Reason" value={createDraft.reason} onChange={(event) => setCreateDraft((current) => ({ ...current, reason: event.target.value }))} />
            <Input label="Reference" value={createDraft.reference} onChange={(event) => setCreateDraft((current) => ({ ...current, reference: event.target.value }))} />
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="xs" onClick={() => void handleCreate()}>Post adjustment</Button>
            <Button size="xs" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      ) : null}

      {/* Filters */}
      {filtersOpen && (
        <div className="grid gap-2 rounded-md border border-line bg-surface-soft/30 px-2.5 py-2 lg:grid-cols-3">
          <Input
            label="Search adjustments"
            placeholder="Reference, reason, or product"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            labelClassName="mb-1"
            inputClassName="h-9 rounded-lg px-3 text-sm"
          />
          <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Status</label>
          <select className="block h-9 w-full rounded-lg border border-line bg-white px-3 text-sm">
            <option>All Statuses</option>
            <option>Draft</option>
            <option>Posted</option>
          </select>
          </div>
          <Input label="Posting date" type="date" inputClassName="h-9 rounded-lg px-3 text-sm" />
        </div>
      )}

      {/* Register + Preview Split */}
      <div className="grid gap-2 grid-cols-1">
        <div className="rounded-md border border-line bg-white overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1.2fr_0.55fr_0.75fr_0.75fr_0.8fr] gap-1 px-2 py-1 border-b border-line bg-surface-soft/30 text-[9px] font-bold uppercase tracking-wider text-muted">
            <span>Reference</span>
            <span>Date</span>
            <span>Reason</span>
            <span className="text-right">Items</span>
            <span>Journal</span>
            <span>Recorded By</span>
            <span>Documents</span>
          </div>
          {/* Rows */}
          {filtered.map((adj) => (
            <button
              key={adj.id}
              type="button"
              onDoubleClick={() => setPreview(adj)}
              className="grid w-full grid-cols-[1fr_1fr_1.2fr_0.55fr_0.75fr_0.75fr_0.8fr] gap-1 border-b border-line px-2 py-1.5 text-left transition hover:bg-surface-soft/30"
            >
              <span className="text-xs font-semibold text-primary">{adj.reference}</span>
              <span className="text-[11px] text-muted">{adj.date}</span>
              <span className="text-[11px] text-ink truncate">{adj.reason}</span>
              <span className="text-[11px] text-right text-ink">{adj.itemCount}</span>
              <span className="text-[11px] text-muted">{adj.journalEntryNumber}</span>
              <span className="text-[11px] text-muted truncate">{adj.recordedBy}</span>
              <span className="flex flex-wrap gap-1 text-[10px] text-muted">{adj.documentLinks.slice(0, 2).map((link) => <DocumentLinkTrigger key={`${adj.id}-${link.documentNumber}`} link={link} onPreview={setLinkPreview} className="cursor-pointer text-primary underline-offset-2 hover:underline" />)}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-muted">No adjustments found.</p>
          )}
        </div>
      </div>

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4 py-6" role="dialog" aria-modal="true">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-5 shadow-[0_30px_90px_-40px_rgba(17,32,24,0.55)]">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Adjustment Preview</p>
                <h2 className="text-lg font-semibold text-ink">{preview.reference}</h2>
              </div>
              <Button size="xs" variant="secondary" onClick={() => setPreview(null)}>Close</Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-muted">
              <div className="rounded-xl border border-line bg-surface-soft/25 p-4">
                <p><strong>Date:</strong> {preview.date}</p>
                <p><strong>Reason:</strong> {preview.reason}</p>
                <p><strong>Status:</strong> {preview.status}</p>
                <p><strong>Code:</strong> {preview.code}</p>
                <p><strong>Product:</strong> {preview.productName}</p>
              </div>
              <div className="rounded-xl border border-line bg-surface-soft/25 p-4">
                <p><strong>Quantity:</strong> {preview.quantity}</p>
                <p><strong>Source:</strong> {preview.source}</p>
                <p><strong>Journal:</strong> {preview.journalEntryNumber}</p>
                <p><strong>Account:</strong> {preview.inventoryAccountCode} · {preview.inventoryAccountName}</p>
                <p><strong>Recorded by:</strong> {preview.recordedBy}</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-line bg-white p-4">
              <p className="text-sm font-semibold text-ink">Attached documents</p>
              {preview.documentLinks.length ? (
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {preview.documentLinks.map((link) => (
                    <li key={`${link.documentType}-${link.documentNumber}`} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
                      <DocumentLinkTrigger link={link} onPreview={setLinkPreview} className="truncate text-left text-primary underline-offset-2 hover:underline" />
                      <span>{link.documentType.replace(/_/g, " ")}</span>
                    </li>
                  ))}
                </ul>
              ) : preview.attachments.length ? (
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {preview.attachments.map((attachment) => (
                    <li key={attachment.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
                      <span className="truncate">{attachment.fileName}</span>
                      <span>{attachment.documentTag.replace(/_/g, " ")}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-3 text-sm text-muted">No documents attached to this adjustment.</p>}
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
              <div className="text-[11px] text-muted">Inventory adjustment detail stays compact and traceable to stock and linked documents.</div>
              <StandardActionBar compact actions={[
                { label: "Edit", onClick: () => setShowCreate(true) },
                { label: "Save", onClick: () => void handleCreate(), disabled: true },
                { label: "Delete", onClick: () => setPreview(null), variant: "muted" },
                { label: "Export", onClick: () => exportRowsToCsv([{ reference: preview.reference, product: preview.productName, quantity: preview.quantity }], [
                  { label: "Reference", value: (row) => row.reference },
                  { label: "Product", value: (row) => row.product },
                  { label: "Quantity", value: (row) => row.quantity },
                ], `${preview.reference}.csv`) },
              ]} />
            </div>
          </div>
        </div>
      ) : null}

      <DocumentLinkPreviewModal link={linkPreview} onClose={() => setLinkPreview(null)} />
    </div>
  );
}
