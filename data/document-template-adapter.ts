import type { DocumentTemplateRecord } from "@/lib/workspace-api";

export const templateDocumentTypes = [
  { value: "tax_invoice", label: "Tax Invoice" },
  { value: "quotation", label: "Quotation" },
  { value: "proforma_invoice", label: "Proforma Invoice" },
  { value: "purchase_order", label: "Purchase Order" },
  { value: "credit_note", label: "Credit Note" },
  { value: "debit_note", label: "Debit Note" },
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