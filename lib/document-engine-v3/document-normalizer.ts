import type { V3Document, V3DocumentType, V3LineItem, V3TemplateStyle } from "./types";

function mapType(value: string): V3DocumentType {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "quotation") return "quotation";
  if (normalized === "proforma" || normalized === "proforma_invoice") return "proforma_invoice";
  if (normalized === "credit_note") return "credit_note";
  if (normalized === "debit_note") return "debit_note";
  if (normalized === "delivery_note") return "delivery_note";
  return "tax_invoice";
}

export function normalizeDocumentTypeV3(value: string): V3DocumentType {
  return mapType(value);
}

export function normalizeStyleV3(layoutLike: unknown, fallback: V3TemplateStyle = "standard"): V3TemplateStyle {
  const value = String(layoutLike ?? "").toLowerCase().trim();
  if (value === "modern" || value === "modern_carded") return "modern";
  if (value === "compact" || value === "compact_v3" || value === "industrial_supply" || value === "compact_carded" || value === "compact_dense") return "compact";
  if (value === "standard" || value === "classic_corporate") return "standard";
  return fallback;
}

function n(value: unknown): number {
  const out = Number(value ?? 0);
  return Number.isFinite(out) ? out : 0;
}

export function normalizeLineV3(line: {
  id?: number;
  description?: string;
  quantity?: number;
  unit_price?: number;
  gross_amount?: number | null;
  vat_rate?: number;
}): V3LineItem {
  return {
    id: line.id,
    description: String(line.description ?? ""),
    quantity: n(line.quantity),
    unitPrice: n(line.unit_price),
    vatRate: n(line.vat_rate),
    amount: n(line.gross_amount) || n(line.quantity) * n(line.unit_price),
  };
}

export function normalizeDocumentV3(input: {
  id: number;
  type: string;
  document_number: string;
  issue_date: string;
  due_date?: string | null;
  taxable_total: number;
  tax_total: number;
  grand_total: number;
  custom_fields?: Record<string, unknown> | null;
  lines?: Array<{
    id?: number;
    description?: string;
    quantity?: number;
    unit_price?: number;
    gross_amount?: number | null;
    vat_rate?: number;
  }>;
  contact?: {
    display_name?: string | null;
    display_name_ar?: string | null;
    tax_number?: string | null;
    phone?: string | null;
    billing_address?: { line_1?: string | null; line_1_ar?: string | null } | null;
  } | null;
  seller: {
    nameEn?: string;
    nameAr?: string;
    vatNumber?: string;
    phone?: string;
    addressEn?: string;
    addressAr?: string;
  };
  currency: string;
}): V3Document {
  return {
    id: input.id,
    number: input.document_number,
    type: mapType(input.type),
    issueDate: input.issue_date,
    dueDate: input.due_date ?? null,
    currency: input.currency || "SAR",
    seller: input.seller,
    customer: {
      nameEn: input.contact?.display_name ?? "",
      nameAr: input.contact?.display_name_ar ?? input.contact?.display_name ?? "",
      vatNumber: input.contact?.tax_number ?? "",
      phone: input.contact?.phone ?? "",
      addressEn: input.contact?.billing_address?.line_1 ?? "",
      addressAr: input.contact?.billing_address?.line_1_ar ?? "",
    },
    lines: (input.lines ?? []).map(normalizeLineV3),
    notes: "",
    referenceDocumentNumber: String(input.custom_fields?.original_invoice_number ?? "") || null,
    adjustmentReason: String(input.custom_fields?.adjustment_reason ?? "") || null,
    taxableTotal: n(input.taxable_total),
    vatTotal: n(input.tax_total),
    grandTotal: n(input.grand_total),
  };
}
