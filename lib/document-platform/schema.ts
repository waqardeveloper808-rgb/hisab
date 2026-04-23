export const documentTemplateTypes = [
  "tax_invoice",
  "proforma_invoice",
  "quotation",
  "credit_note",
  "debit_note",
] as const;

export type DocumentTemplateType = (typeof documentTemplateTypes)[number];

export const canonicalBlocks = [
  "header",
  "title",
  "customer",
  "document-info",
  "delivery",
  "items",
  "totals",
  "notes",
  "footer",
] as const;

export type CanonicalBlock = (typeof canonicalBlocks)[number];

export type LabelOverrideMap = Record<string, string>;

export type ItemTableColumnKey =
  | "serial"
  | "description"
  | "quantity"
  | "unit_price"
  | "taxable"
  | "vat"
  | "total";

export type ItemTableColumnSetting = {
  key: ItemTableColumnKey;
  width: number;
  visible: boolean;
};

export type TemplateSchemaSettings = {
  layout: "classic_corporate" | "modern_carded" | "industrial_supply";
  section_order: string;
  hidden_sections: string;
  section_grid_columns: number;
  section_layout_map: string;
  logo_max_width: number;
  logo_max_height: number;
  label_color_en: string;
  label_color_ar: string;
  label_overrides_en: string;
  label_overrides_ar: string;
  item_table_columns: string;
  table_heading_bilingual: boolean;
  watermark_enabled: boolean;
  watermark_logo_mode: "full-width" | "centered" | "disabled";
  font_family: string;
  font_size: number;
  title_font_size: number;
  section_gap: number;
  spacing_scale: number;
  canvas_padding: number;
  show_qr: boolean;
  show_footer: boolean;
};

const defaultLabelOverridesEn: LabelOverrideMap = {
  issue_date: "Issue Date",
  supply_date: "Supply Date",
  due_date: "Due Date",
  reference: "Reference",
  order_number: "Order Number",
  project: "Project",
  invoice_number: "Invoice Number",
  quantity: "Qty",
  unit_price: "Unit Price",
  taxable: "Taxable",
  vat: "VAT",
  total: "Total",
  subtotal: "Subtotal",
  grand_total: "Total",
};

const defaultLabelOverridesAr: LabelOverrideMap = {
  issue_date: "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0635\u062f\u0627\u0631",
  supply_date: "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0648\u0631\u064a\u062f",
  due_date: "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0627\u0633\u062a\u062d\u0642\u0627\u0642",
  reference: "\u0627\u0644\u0645\u0631\u062c\u0639",
  order_number: "\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628",
  project: "\u0627\u0644\u0645\u0634\u0631\u0648\u0639",
  invoice_number: "\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629",
  quantity: "\u0627\u0644\u0643\u0645\u064a\u0629",
  unit_price: "\u0633\u0639\u0631 \u0627\u0644\u0648\u062d\u062f\u0629",
  taxable: "\u0627\u0644\u062e\u0627\u0636\u0639 \u0644\u0644\u0636\u0631\u064a\u0628\u0629",
  vat: "\u0627\u0644\u0636\u0631\u064a\u0628\u0629",
  total: "\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a",
  subtotal: "\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0641\u0631\u0639\u064a",
  grand_total: "\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a",
};

const defaultItemColumns: ItemTableColumnSetting[] = [
  { key: "serial", width: 5, visible: true },
  { key: "description", width: 37, visible: true },
  { key: "quantity", width: 9, visible: true },
  { key: "unit_price", width: 13, visible: true },
  { key: "taxable", width: 13, visible: true },
  { key: "vat", width: 10, visible: true },
  { key: "total", width: 13, visible: true },
];

function buildDefaultSectionLayout(columns: number) {
  if (columns >= 3) {
    return {
      header: { row: 1, column: 1, span: 3 },
      title: { row: 2, column: 1, span: 3 },
      customer: { row: 3, column: 1, span: 1 },
      "document-info": { row: 3, column: 2, span: 1 },
      delivery: { row: 3, column: 3, span: 1 },
      items: { row: 4, column: 1, span: 3 },
      totals: { row: 5, column: 3, span: 1 },
      notes: { row: 5, column: 1, span: 2 },
      footer: { row: 6, column: 1, span: 3 },
    };
  }

  return {
    header: { row: 1, column: 1, span: columns },
    title: { row: 2, column: 1, span: columns },
    customer: { row: 3, column: 1, span: 1 },
    "document-info": { row: 3, column: Math.min(2, columns), span: 1 },
    delivery: { row: 4, column: 1, span: 1 },
    items: { row: 5, column: 1, span: columns },
    totals: { row: 6, column: Math.min(2, columns), span: 1 },
    notes: { row: 6, column: 1, span: 1 },
    footer: { row: 7, column: 1, span: columns },
  };
}

export function buildDefaultSchemaSettings(documentType: DocumentTemplateType): TemplateSchemaSettings {
  const columns = documentType === "quotation" ? 3 : 2;

  return {
    layout: documentType === "quotation" ? "modern_carded" : "classic_corporate",
    section_order: canonicalBlocks.join(","),
    hidden_sections: "",
    section_grid_columns: columns,
    section_layout_map: JSON.stringify(buildDefaultSectionLayout(columns)),
    logo_max_width: 160,
    logo_max_height: 62,
    label_color_en: "#5f6e68",
    label_color_ar: "#5f6e68",
    label_overrides_en: JSON.stringify(defaultLabelOverridesEn),
    label_overrides_ar: JSON.stringify(defaultLabelOverridesAr),
    item_table_columns: JSON.stringify(defaultItemColumns),
    table_heading_bilingual: true,
    watermark_enabled: true,
    watermark_logo_mode: "full-width",
    font_family: "Segoe UI",
    font_size: 12,
    title_font_size: 26,
    section_gap: 10,
    spacing_scale: 0.95,
    canvas_padding: 14,
    show_qr: true,
    show_footer: true,
  };
}
