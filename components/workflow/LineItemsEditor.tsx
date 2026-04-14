"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { EntityPicker } from "@/components/workflow/EntityPicker";
import { QuickCreateDialog } from "@/components/workflow/QuickCreateDialog";
import { QuickCreateItemForm } from "@/components/workflow/QuickCreateItemForm";
import { itemToOption, useWorkspaceData } from "@/components/workflow/WorkspaceDataProvider";
import type { ItemRecord, TransactionKind, TransactionLine } from "@/components/workflow/types";
import { calculateLineTotal, createId, currency } from "@/components/workflow/utils";
import type { CostCenterRecord, CustomFieldDefinitionRecord } from "@/lib/workspace-api";

type LineItemsEditorProps = {
  kind: TransactionKind;
  lines: TransactionLine[];
  onChange: (lines: TransactionLine[]) => void;
  costCenters?: CostCenterRecord[];
  lineFieldDefinitions?: CustomFieldDefinitionRecord[];
  readOnly?: boolean;
};

export function LineItemsEditor({ kind, lines, onChange, costCenters = [], lineFieldDefinitions = [], readOnly = false }: LineItemsEditorProps) {
  const { createItem, items, searchItems, recordItemSelection } = useWorkspaceData();
  const [openCreateForLine, setOpenCreateForLine] = useState<string | null>(null);
  const [draftItemName, setDraftItemName] = useState("");

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

    updateLine(lineId, {
      itemId: item.id,
      backendItemId: item.backendId ?? null,
      description: item.name,
      price: kind === "invoice" ? item.salePrice : item.purchasePrice,
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

  return (
    <div className="rounded-[1.2rem] border border-line bg-white p-4 shadow-[0_12px_28px_-24px_rgba(17,32,24,0.16)]">
      <div className="flex flex-col gap-2 border-b border-line pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Line items</p>
          <p className="mt-0.5 text-sm text-muted">{readOnly ? "Line values are locked." : "Add products or services."}</p>
        </div>
        {!readOnly ? <Button variant="secondary" onClick={addLine}>Add line</Button> : null}
      </div>

      <div className="mt-3 space-y-3">
        {lines.map((line) => {
          const selectedItem = items.find((item) => item.id === line.itemId) ?? null;
          const descriptionId = `${line.id}-description`;
          const quantityId = `${line.id}-quantity`;
          const priceId = `${line.id}-price`;

          return (
            <div key={line.id} className="rounded-xl border border-line bg-surface-soft p-3">
              <div className="mb-3 flex items-center justify-end gap-4">
                {lines.length > 1 && !readOnly ? (
                  <Button variant="tertiary" onClick={() => removeLine(line.id)}>Remove</Button>
                ) : null}
              </div>
              <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr_0.6fr_0.7fr_0.8fr]">
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
                <div>
                  <label htmlFor={descriptionId} className="mb-2.5 block text-sm font-semibold text-ink">Description</label>
                  <input
                    id={descriptionId}
                    value={line.description}
                    disabled={readOnly}
                    onChange={(event) => updateLine(line.id, { description: event.target.value })}
                    className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label htmlFor={quantityId} className="mb-2.5 block text-sm font-semibold text-ink">Qty</label>
                  <input
                    id={quantityId}
                    type="number"
                    min="1"
                    value={line.quantity}
                    disabled={readOnly}
                    onChange={(event) => updateLine(line.id, { quantity: Number(event.target.value) || 1 })}
                    className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label htmlFor={priceId} className="mb-2.5 block text-sm font-semibold text-ink">Price</label>
                  <input
                    id={priceId}
                    type="number"
                    min="0"
                    value={line.price}
                    disabled={readOnly}
                    onChange={(event) => updateLine(line.id, { price: Number(event.target.value) || 0 })}
                    className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-ink">Line total</label>
                  <div className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-semibold text-ink">
                    {currency(calculateLineTotal(line))} SAR
                  </div>
                </div>
              </div>

              {kind === "bill" || lineFieldDefinitions.length ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {kind === "bill" ? (
                    <div>
                      <label htmlFor={`${line.id}-cost-center`} className="mb-2.5 block text-sm font-semibold text-ink">Cost center</label>
                      <select
                        id={`${line.id}-cost-center`}
                        value={line.costCenterId ?? ""}
                        disabled={readOnly}
                        onChange={(event) => updateLine(line.id, { costCenterId: event.target.value ? Number(event.target.value) : null })}
                        className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                      >
                        <option value="">No cost center</option>
                        {costCenters.filter((item) => item.isActive).map((costCenter) => (
                          <option key={costCenter.id} value={costCenter.id}>{costCenter.code} · {costCenter.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  {lineFieldDefinitions.map((field) => {
                    const value = line.customFields[field.slug];

                    if (field.fieldType === "boolean") {
                      return (
                        <label key={field.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink">
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

                    if (field.fieldType === "select") {
                      return (
                        <div key={field.id}>
                          <label htmlFor={`${line.id}-${field.slug}`} className="mb-2.5 block text-sm font-semibold text-ink">{field.name}</label>
                          <select
                            id={`${line.id}-${field.slug}`}
                            value={typeof value === "string" ? value : ""}
                            disabled={readOnly}
                            onChange={(event) => updateCustomField(line.id, field.slug, event.target.value || null)}
                            className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
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
                        <label htmlFor={`${line.id}-${field.slug}`} className="mb-2.5 block text-sm font-semibold text-ink">{field.name}</label>
                        <input
                          id={`${line.id}-${field.slug}`}
                          value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
                          disabled={readOnly}
                          onChange={(event) => updateCustomField(line.id, field.slug, event.target.value || null)}
                          className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
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