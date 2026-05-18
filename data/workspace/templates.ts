import type { TemplateRecord } from "@/lib/workspace/types";

// Workspace templates (demo catalog).
//
// IDs intentionally preserved (tmpl-standard / tmpl-modern / tmpl-compact)
// so existing document records continue to resolve their template. Schema
// resolution is driven by `DocumentRecord.kind` via `getSchemaForKind`, NOT
// by the template's documentType — so an invoice template assigned to a
// quotation will still render with the Quotation schema.
//
// Tax invoice and the major commercial document types expose three real
// style variants of the same schema (data-style on the .paper root affects
// spacing / density / accent treatment). The catalog keeps the variants real
// so Studio and register preview can resolve Standard / Modern / Compact
// without fake placeholder records.

export const templates: TemplateRecord[] = [
  // ── Tax invoice — three real style variants of the same schema
  {
    id: "tmpl-standard",
    name: "Standard",
    documentType: "invoice",
    style: "standard",
    language: "bilingual",
    isDefault: true,
    presentation: "default",
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-modern",
    name: "Modern",
    documentType: "invoice",
    style: "modern",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-compact",
    name: "Compact",
    documentType: "invoice",
    style: "compact",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  // ── Simplified tax invoice
  {
    id: "tmpl-simp-standard",
    name: "Hisabix Simplified Tax Invoice — A4 Bilingual",
    documentType: "simplified_invoice",
    style: "standard",
    language: "bilingual",
    isDefault: true,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-simp-modern",
    name: "Hisabix Simplified Tax Invoice — Modern",
    documentType: "simplified_invoice",
    style: "modern",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-simp-compact",
    name: "Hisabix Simplified Tax Invoice — Compact",
    documentType: "simplified_invoice",
    style: "compact",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },

  // ── Quotation
  {
    id: "tmpl-qte-standard",
    name: "Hisabix Quotation — A4 Bilingual",
    documentType: "quotation",
    style: "standard",
    language: "bilingual",
    isDefault: true,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-qte-modern",
    name: "Hisabix Quotation — Modern",
    documentType: "quotation",
    style: "modern",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-qte-compact",
    name: "Hisabix Quotation — Compact",
    documentType: "quotation",
    style: "compact",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },

  // ── Proforma
  {
    id: "tmpl-pro-standard",
    name: "Hisabix Proforma Invoice — A4 Bilingual",
    documentType: "proforma",
    style: "standard",
    language: "bilingual",
    isDefault: true,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-pro-modern",
    name: "Hisabix Proforma Invoice — Modern",
    documentType: "proforma",
    style: "modern",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-pro-compact",
    name: "Hisabix Proforma Invoice — Compact",
    documentType: "proforma",
    style: "compact",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },

  // ── Credit note
  {
    id: "tmpl-cn-standard",
    name: "Hisabix Credit Note — A4 Bilingual",
    documentType: "credit_note",
    style: "standard",
    language: "bilingual",
    isDefault: true,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-cn-modern",
    name: "Hisabix Credit Note — Modern",
    documentType: "credit_note",
    style: "modern",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-cn-compact",
    name: "Hisabix Credit Note — Compact",
    documentType: "credit_note",
    style: "compact",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },

  // ── Debit note
  {
    id: "tmpl-dn-standard",
    name: "Hisabix Debit Note — A4 Bilingual",
    documentType: "debit_note",
    style: "standard",
    language: "bilingual",
    isDefault: true,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-dn-modern",
    name: "Hisabix Debit Note — Modern",
    documentType: "debit_note",
    style: "modern",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-dn-compact",
    name: "Hisabix Debit Note — Compact",
    documentType: "debit_note",
    style: "compact",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },

  // ── Delivery note
  {
    id: "tmpl-dlv-standard",
    name: "Hisabix Delivery Note — A4 Bilingual",
    documentType: "delivery_note",
    style: "standard",
    language: "bilingual",
    isDefault: true,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-dlv-modern",
    name: "Hisabix Delivery Note — Modern",
    documentType: "delivery_note",
    style: "modern",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-dlv-compact",
    name: "Hisabix Delivery Note — Compact",
    documentType: "delivery_note",
    style: "compact",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },

  // ── Purchase order
  {
    id: "tmpl-po-standard",
    name: "Hisabix Purchase Order — A4 Bilingual",
    documentType: "purchase_order",
    style: "standard",
    language: "bilingual",
    isDefault: true,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-po-modern",
    name: "Hisabix Purchase Order — Modern",
    documentType: "purchase_order",
    style: "modern",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-po-compact",
    name: "Hisabix Purchase Order — Compact",
    documentType: "purchase_order",
    style: "compact",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
];
