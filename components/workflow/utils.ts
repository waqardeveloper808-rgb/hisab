import type { ContactRecord, ItemRecord, PickerOption, TransactionLine } from "@/components/workflow/types";

function toNumber(value: string | number | boolean | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function contactToOption(contact: ContactRecord): PickerOption {
  return {
    id: contact.id,
    label: contact.displayName,
    caption: [contact.city, contact.email].filter(Boolean).join(" • "),
    meta: contact.kind === "customer" ? "Customer" : "Supplier",
  };
}

export function itemToOption(item: ItemRecord, kind: "invoice" | "bill"): PickerOption {
  return {
    id: item.id,
    label: item.name,
    caption: `${item.taxLabel} • ${kind === "invoice" ? item.salePrice : item.purchasePrice} SAR`,
    meta: item.kind === "product" ? "Product" : "Service",
  };
}

export function currency(value: number) {
  return new Intl.NumberFormat("en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function calculateLineSubtotal(line: TransactionLine) {
  return line.quantity * line.price;
}

export function calculateLineVatAmount(line: TransactionLine) {
  return calculateLineSubtotal(line) * (toNumber(line.customFields.vat_rate) / 100);
}

export function calculateLineTotal(line: TransactionLine) {
  return calculateLineSubtotal(line) + calculateLineVatAmount(line);
}