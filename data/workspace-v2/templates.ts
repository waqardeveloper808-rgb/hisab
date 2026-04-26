import type { TemplateRecord } from "@/lib/workspace-v2/types";

// Workspace V2 templates.
//
// IDs intentionally preserved (tmpl-standard / tmpl-modern / tmpl-compact)
// so existing document records continue to resolve their template. Schema
// resolution is driven by `DocumentRecord.kind` via `getSchemaForKind`, NOT
// by the template's documentType — so an invoice template assigned to a
// quotation will still render with the Quotation schema.
//
// Tax invoice has three real style variants of the same schema (data-style
// on the .paper root affects spacing / density / accent treatment). All
// other document types intentionally expose ONE real "Hisabix Standard"
// template instead of fake style choices, per the schema-driven spec rule:
// "Do not show three templates if only one style exists."

export const templates: TemplateRecord[] = [
  // ── Tax invoice — three real style variants of the same schema
  {
    id: "tmpl-standard",
    name: "Default",
    documentType: "invoice",
    style: "standard",
    language: "bilingual",
    isDefault: true,
    presentation: "default",
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-invoice-zatca-standard",
    name: "Standard",
    documentType: "invoice",
    style: "standard",
    language: "bilingual",
    isDefault: false,
    presentation: "zatca_standard",
    updatedAt: "2026-04-25T23:05:00+03:00",
  },
  {
    id: "tmpl-modern",
    name: "Hisabix Modern — Wide accent",
    documentType: "invoice",
    style: "modern",
    language: "bilingual",
    isDefault: false,
    updatedAt: "2026-04-25T17:05:00+03:00",
  },
  {
    id: "tmpl-compact",
    name: "Hisabix Compact — Dense table",
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
];
