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
  const [salePrice, setSalePrice] = useState("0");
  const [purchasePrice, setPurchasePrice] = useState("0");
  const [taxLabel, setTaxLabel] = useState("VAT 15%");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const item = await onSubmit({
      kind,
      name,
      sku,
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
        <div className="grid grid-cols-2 gap-2 rounded-[1.3rem] bg-surface-soft p-1.5">
          {(["service", "product"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setKind(option)}
              className={[
                "rounded-2xl px-4 py-3 text-sm font-semibold capitalize",
                kind === option ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
              ].join(" ")}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
      <Input label="Code" value={sku} onChange={(event) => setSku(event.target.value)} placeholder="Optional" />
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