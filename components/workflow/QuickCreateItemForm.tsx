"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import type { ItemKind, ItemRecord } from "@/components/workflow/types";

type QuickCreateItemFormProps = {
  initialName: string;
  onSubmit: (payload: {
    kind: ItemKind;
    name: string;
    sku: string;
    category?: string;
    salePrice: number;
    purchasePrice: number;
    taxLabel: string;
  }) => Promise<ItemRecord>;
  onComplete: (item: ItemRecord) => void;
};

export function QuickCreateItemForm({ initialName, onSubmit, onComplete }: QuickCreateItemFormProps) {
  const [kind, setKind] = useState<ItemKind>("service");
  const [name, setName] = useState(initialName);
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [salePrice, setSalePrice] = useState("0");
  const [purchasePrice, setPurchasePrice] = useState("0");
  const [taxLabel, setTaxLabel] = useState("VAT 15%");
  const [saving, setSaving] = useState(false);

  const isInventoryTracked = kind === "product" || kind === "raw_material" || kind === "finished_good";
  const codeRequired = isInventoryTracked;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (codeRequired && !sku.trim()) return;
    setSaving(true);
    const item = await onSubmit({
      kind,
      name,
      sku,
      category,
      salePrice: Number(salePrice) || 0,
      purchasePrice: Number(purchasePrice) || 0,
      taxLabel,
    });
    setSaving(false);
    onComplete(item);
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2.5 block text-sm font-semibold text-ink">Type</label>
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-soft p-1.5">
          {(["service", "product", "raw_material", "finished_good"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setKind(option)}
              className={[
                "rounded-2xl px-4 py-3 text-sm font-semibold capitalize",
                kind === option ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
              ].join(" ")}
            >
              {option.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>
      <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
      <div>
        <Input label={codeRequired ? "Item Code (required)" : "Code"} value={sku} onChange={(event) => setSku(event.target.value)} placeholder={codeRequired ? "e.g. SKU-001" : "Optional"} required={codeRequired} />
        {codeRequired && !sku.trim() && (
          <p className="mt-1 text-xs text-red-600">Item code is mandatory for inventory-tracked items.</p>
        )}
      </div>
      <Input label="Category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Optional" />
      <Input label="Tax" value={taxLabel} onChange={(event) => setTaxLabel(event.target.value)} />
      <Input label="Sales price" type="number" min="0" value={salePrice} onChange={(event) => setSalePrice(event.target.value)} />
      <Input label="Cost price" type="number" min="0" value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} />
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Saving…" : "Save item"}
        </Button>
      </div>
    </form>
  );
}