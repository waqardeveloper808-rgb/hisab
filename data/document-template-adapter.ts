import type { DocumentTemplateRecord } from "@/lib/workspace-api";
import { documentTemplateTypes } from "@/lib/document-platform/schema";

export const templateDocumentTypes = [
  { value: documentTemplateTypes[0], label: "Tax Invoice" },
  { value: documentTemplateTypes[1], label: "Proforma Invoice" },
  { value: documentTemplateTypes[2], label: "Quotation" },
  { value: documentTemplateTypes[3], label: "Credit Note" },
  { value: documentTemplateTypes[4], label: "Debit Note" },
  { value: "purchase_order", label: "Purchase Order" },
  { value: "delivery_note", label: "Delivery Note" },
  { value: "receipt_voucher", label: "Receipt Voucher" },
  { value: "payment_voucher", label: "Payment Voucher" },
  { value: "journal_voucher", label: "Journal Voucher" },
] as const;

export function buildTemplateRegister(templates: DocumentTemplateRecord[]) {
  return templateDocumentTypes.map((documentType) => {
    const matchingTemplates = templates.filter((template) => template.documentTypes.includes(documentType.value));

    return {
      documentType: documentType.value,
      label: documentType.label,
      templates: matchingTemplates,
      usesFallbackData: false,
    };
  });
}