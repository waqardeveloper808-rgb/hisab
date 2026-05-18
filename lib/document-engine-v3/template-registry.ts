import type { V3DocumentType, V3TemplateId, V3TemplateRecord, V3TemplateStyle } from "./types";

const DOC_TYPES: V3DocumentType[] = [
  "tax_invoice",
  "quotation",
  "proforma_invoice",
  "credit_note",
  "debit_note",
  "delivery_note",
];

const STYLES: V3TemplateStyle[] = ["standard", "modern", "compact"];

function styleLabel(style: V3TemplateStyle): "Standard" | "Modern" | "Compact" {
  if (style === "modern") return "Modern";
  if (style === "compact") return "Compact";
  return "Standard";
}

export const V3_TEMPLATE_REGISTRY: V3TemplateRecord[] = DOC_TYPES.flatMap((documentType) =>
  STYLES.map((style) => ({
    id: `${documentType}.${style}` as V3TemplateId,
    documentType,
    style,
    name: styleLabel(style),
  })),
);

export function listDocumentTemplatesV3(documentType?: V3DocumentType): V3TemplateRecord[] {
  if (!documentType) return [...V3_TEMPLATE_REGISTRY];
  return V3_TEMPLATE_REGISTRY.filter((entry) => entry.documentType === documentType);
}
