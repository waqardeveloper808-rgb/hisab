import type { V3DocumentType } from "./types";

const PREFIX: Record<V3DocumentType, string> = {
  tax_invoice: "INV",
  quotation: "QUO",
  proforma_invoice: "PRO",
  credit_note: "CN",
  debit_note: "DN",
  delivery_note: "DLV",
};

export function getNextDocumentNumberV3(documentType: V3DocumentType, existingDocuments: Array<{ type: string; number: string }>): string {
  const prefix = PREFIX[documentType];
  const pattern = new RegExp(`^${prefix}-(\\d+)$`, "i");
  const max = existingDocuments
    .filter((doc) => String(doc.type).toLowerCase() === documentType)
    .map((doc) => {
      const m = String(doc.number).match(pattern);
      return m ? Number(m[1]) : 0;
    })
    .reduce((acc, value) => Math.max(acc, value), 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}
