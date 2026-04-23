"use client";

import { useId, useState } from "react";
import { Button } from "@/components/Button";
import { EntityPicker } from "@/components/workflow/EntityPicker";
import { QuickCreateDialog } from "@/components/workflow/QuickCreateDialog";
import { QuickCreateItemForm } from "@/components/workflow/QuickCreateItemForm";
import { itemToOption, useWorkspaceData } from "@/components/workflow/WorkspaceDataProvider";
import type { ItemRecord, TransactionKind, TransactionLine } from "@/components/workflow/types";
import { calculateLineDiscountAmount, calculateLineSubtotal, calculateLineTotal, calculateLineVatAmount, createId, currency } from "@/components/workflow/utils";
import type { CostCenterRecord, CustomFieldDefinitionRecord } from "@/lib/workspace-api";

type LineItemsEditorProps = {
  kind: TransactionKind;
  lines: TransactionLine[];
  onChange: (lines: TransactionLine[]) => void;
  costCenters?: CostCenterRecord[];
  lineFieldDefinitions?: CustomFieldDefinitionRecord[];
  readOnly?: boolean;
  inventoryWarnings?: Record<string, { available: number; requested: number; productName: string }>;
  onOpenInventory?: () => void;
};

export function LineItemsEditor({ kind, lines, onChange, costCenters = [], lineFieldDefinitions = [], readOnly = false, inventoryWarnings = {}, onOpenInventory }: LineItemsEditorProps) {
  const { createItem, items, searchItems, recordItemSelection } = useWorkspaceData();
  const formId = useId();
  const [openCreateForLine, setOpenCreateForLine] = useState<string | null>(null);
  const [draftItemName, setDraftItemName] = useState("");

  const compactLineFieldDefinitions = lineFieldDefinitions.filter((field) => !/service\s*period/i.test(field.name));

  function updateLine(lineId: string, partial: Partial<TransactionLine>) {
    onChange(lines.map((line) => (line.id === lineId ? { ...line, ...partial } : line)));
  }

  function addLine() {
    if (readOnly) {
      return;
    }

    onChange([
      ...lines,
      {
        id: createId("line"),
        itemId: null,
        backendItemId: null,
        description: "",
        quantity: 1,
        price: 0,
        costCenterId: null,
        customFields: {},
      },
    ]);
  }

  function removeLine(lineId: string) {
    if (readOnly) {
      return;
    }

    onChange(lines.filter((line) => line.id !== lineId));
  }

  function selectItem(lineId: string, item: ItemRecord) {
    if (readOnly) {
      return;
    }

    const currentLine = lines.find((line) => line.id === lineId);

    updateLine(lineId, {
      itemId: item.id,
      backendItemId: item.backendId ?? null,
      description: item.name,
      price: kind === "invoice" ? item.salePrice : item.purchasePrice,
      customFields: {
        ...(currentLine?.customFields ?? {}),
        item_code: item.sku || null,
        item_category: item.category || null,
        vat_rate: currentLine?.customFields.vat_rate ?? 15,
      },
    });
    recordItemSelection(item.id);
  }

  function updateCustomField(lineId: string, fieldSlug: string, value: string | number | boolean | null) {
    const line = lines.find((candidate) => candidate.id === lineId);

    if (!line) {
      return;
    }

    updateLine(lineId, {
      customFields: {
        ...line.customFields,
        [fieldSlug]: value,
      },
    });
  }

  function updateCustomFields(lineId: string, fields: Record<string, string | number | boolean | null>) {
    const line = lines.find((candidate) => candidate.id === lineId);

    if (!line) {
      return;
    }

    updateLine(lineId, {
      customFields: {
        ...line.customFields,
        ...fields,
      },
    });
  }

  function getFieldString(line: TransactionLine, fieldSlug: string) {
    const value = line.customFields[fieldSlug];
    return typeof value === "string" || typeof value === "number" ? String(value) : "";
  }

  return (
    <div className="rounded-xl border border-line bg-white p-3 shadow-[0_14px_32px_-26px_rgba(17,32,24,0.16)]">
      <div className="flex items-center justify-between gap-2 border-b border-line pb-2.5">
        <div>
          <p className="text-sm font-semibold text-primary">Line items</p>
          <p className="text-[11px] text-muted">Compact commercial lines with VAT, discount, and inventory visibility.</p>
        </div>
        {!readOnly ? <Button variant="secondary" size="xs" onClick={addLine}>Add line</Button> : null}
      </div>

      <div className="mt-2 overflow-x-auto">
        <div className="grid min-w-[1220px] grid-cols-[1.5fr_2fr_0.72fr_0.9fr_0.78fr_0.78fr_1.05fr_58px] gap-2.5 border-b border-line px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
          <span>Product</span>
          <span>Description</span>
          <span>Qty</span>
          <span>Price</span>
          <span>VAT %</span>
          <span>Discount</span>
          <span>Total</span>
          <span />
        </div>

        {lines.map((line, index) => {
          const selectedItem = items.find((item) => item.id === line.itemId) ?? null;
          const fieldPrefix = `${formId}-line-${index}`;
          const descriptionId = `${fieldPrefix}-description`;
          const quantityId = `${fieldPrefix}-quantity`;
          const priceId = `${fieldPrefix}-price`;
          const costCenterId = `${fieldPrefix}-cost-center`;
          const inventoryWarning = inventoryWarnings[line.id];

          return (
            <div key={line.id} className="border-b border-line px-2.5 py-2.5 last:border-b-0">
              <div className="grid min-w-[1220px] grid-cols-[1.5fr_2fr_0.72fr_0.9fr_0.78fr_0.78fr_1.05fr_58px] items-start gap-2.5">
                <EntityPicker
                  label="Product or service"
                  placeholder="Search item name or code"
                  selectedOption={selectedItem ? itemToOption(selectedItem, kind) : null}
                  onSearch={async (query) => {
                    const results = await searchItems(query);
                    return results.map((item, position) => {
                      const option = itemToOption(item, kind);
                      const normalizedQuery = query.trim();

                      return {
                        ...option,
                        group: normalizedQuery
                          ? "Matching items"
                          : position === 0
                            ? "Recent"
                            : position < 3
                              ? "Frequently used"
                              : "More items",
                      };
                    });
                  }}
                  onSelect={(option) => {
                    const match = items.find((item) => item.id === option.id);
                    if (match) {
                      selectItem(line.id, match);
                    }
                  }}
                  createLabel="Add a new product or service"
                  onCreateNew={(query) => {
                    setDraftItemName(query);
                    setOpenCreateForLine(line.id);
                  }}
                  disabled={readOnly}
                />

                <div className="space-y-1">
                  <input
                    id={descriptionId}
                    aria-label="Description"
                    value={line.description}
                    disabled={readOnly}
                    onChange={(event) => updateLine(line.id, { description: event.target.value })}
                    className="block h-11 w-full rounded-md border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    placeholder="Description"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      id={`${fieldPrefix}-description-ar`}
                      aria-label="Arabic"
                      value={getFieldString(line, "description_ar")}
                      disabled={readOnly}
                      onChange={(event) => updateCustomField(line.id, "description_ar", event.target.value || null)}
                      className="block h-9 min-w-0 flex-1 rounded-md border border-line bg-white px-2.5 text-xs text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                      placeholder="Arabic"
                    />
                  </div>
                </div>

                <input
                  id={quantityId}
                  aria-label="Qty"
                  type="number"
                  min="1"
                  value={line.quantity}
                  disabled={readOnly}
                  onChange={(event) => updateLine(line.id, { quantity: Number(event.target.value) || 1 })}
                  className="block h-11 w-full rounded-md border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />

                <input
                  id={priceId}
                  aria-label="Price"
                  type="number"
                  min="0"
                  value={line.price}
                  disabled={readOnly}
                  onChange={(event) => updateLine(line.id, { price: Number(event.target.value) || 0 })}
                  className="block h-11 w-full rounded-md border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />

                <input
                  id={`${fieldPrefix}-vat-rate`}
                  aria-label="VAT %"
                  type="number"
                  min="0"
                  step="0.01"
                  value={getFieldString(line, "vat_rate") || "15"}
                  disabled={readOnly}
                  onChange={(event) => updateCustomField(line.id, "vat_rate", Number(event.target.value) || 0)}
                  className="block h-11 w-full rounded-md border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />

                <input
                  id={`${fieldPrefix}-discount-rate`}
                  aria-label="Discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={getFieldString(line, "discount_rate") || "0"}
                  disabled={readOnly}
                  onChange={(event) => updateCustomField(line.id, "discount_rate", Number(event.target.value) || 0)}
                  className="block h-11 w-full rounded-md border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />

                <div className="rounded-md border border-line bg-surface-soft px-3 py-2 text-xs">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Line total</div>
                  <div className="mt-0.5 font-semibold text-ink">{currency(calculateLineTotal(line))} SAR</div>
                </div>

                <div className="flex items-center justify-end">
                  {lines.length > 1 && !readOnly ? <Button size="xs" variant="tertiary" onClick={() => removeLine(line.id)}>Remove</Button> : null}
                </div>
              </div>

              <div className="mt-2 grid min-w-[1220px] gap-1.5 rounded-md bg-surface-soft/60 px-3 py-2.5 text-[11px] text-muted md:grid-cols-[repeat(4,minmax(0,1fr))]">
                <span><span className="font-semibold text-ink">Net</span> {currency(calculateLineSubtotal(line))}</span>
                <span><span className="font-semibold text-ink">VAT</span> {currency(calculateLineVatAmount(line))}</span>
                <span><span className="font-semibold text-ink">Disc</span> {currency(calculateLineDiscountAmount(line))}</span>
                <span><span className="font-semibold text-ink">SKU</span> {getFieldString(line, "item_code") || "-"}</span>
              </div>

              {inventoryWarning ? (
                <div className="mt-2 flex min-w-[1220px] items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-800">
                  <span>{inventoryWarning.productName}: requested {inventoryWarning.requested}, available {inventoryWarning.available}.</span>
                  {onOpenInventory ? <button type="button" onClick={onOpenInventory} className="font-semibold text-primary underline-offset-2 hover:underline">Open stock</button> : null}
                </div>
              ) : null}

              {kind === "bill" || compactLineFieldDefinitions.length ? (
                <div className="mt-1.5 grid gap-1.5 lg:grid-cols-2">
                  {kind === "bill" ? (
                    <div>
                      <label htmlFor={costCenterId} className="mb-1 block text-[11px] font-semibold text-ink">Cost center</label>
                      <select
                        id={costCenterId}
                        value={line.costCenterId ?? ""}
                        disabled={readOnly}
                        onChange={(event) => updateLine(line.id, { costCenterId: event.target.value ? Number(event.target.value) : null })}
                        className="block h-8 w-full rounded-md border border-line-strong bg-white px-2 text-xs text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                      >
                        <option value="">No cost center</option>
                        {costCenters.filter((item) => item.isActive).map((costCenter) => (
                          <option key={costCenter.id} value={costCenter.id}>{costCenter.code} · {costCenter.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  {compactLineFieldDefinitions.map((field) => {
                    const value = line.customFields[field.slug];

                    if (field.fieldType === "boolean") {
                      return (
                        <label key={field.id} className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink">
                          <input
                            type="checkbox"
                            checked={Boolean(value)}
                            disabled={readOnly}
                            onChange={(event) => updateCustomField(line.id, field.slug, event.target.checked)}
                          />
                          {field.name}
                        </label>
                      );
                    }

                    const customFieldId = `${fieldPrefix}-${field.slug}`;

                    if (field.fieldType === "select") {
                      return (
                        <div key={field.id}>
                          <label htmlFor={customFieldId} className="mb-1 block text-[11px] font-semibold text-ink">{field.name}</label>
                          <select
                            id={customFieldId}
                            value={typeof value === "string" ? value : ""}
                            disabled={readOnly}
                            onChange={(event) => updateCustomField(line.id, field.slug, event.target.value || null)}
                            className="block h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                          >
                            <option value="">Select {field.name.toLowerCase()}</option>
                            {field.options.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    return (
                      <div key={field.id}>
                        <label htmlFor={customFieldId} className="mb-1 block text-[11px] font-semibold text-ink">{field.name}</label>
                        <input
                          id={customFieldId}
                          value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
                          disabled={readOnly}
                          onChange={(event) => updateCustomField(line.id, field.slug, event.target.value || null)}
                          className="block h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <QuickCreateDialog
                open={openCreateForLine === line.id}
                title="Add a product or service"
                description="Save it here and it will drop straight into the current line."
                onClose={() => setOpenCreateForLine(null)}
              >
                <QuickCreateItemForm
                  initialName={draftItemName}
                  onSubmit={createItem}
                  onComplete={(item) => {
                    selectItem(line.id, item);
                    setOpenCreateForLine(null);
                  }}
                />
              </QuickCreateDialog>
            </div>
          );
        })}
      </div>
    </div>
  );
}
