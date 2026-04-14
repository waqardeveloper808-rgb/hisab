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

const languageModes = ["bilingual", "en", "ar", "bilingual", "bilingual"] as const;

function titleizeDocumentType(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function buildFallbackTemplate(documentType: string, position: number): DocumentTemplateRecord {
  const label = titleizeDocumentType(documentType);

  return {
    id: Number(`9${String(position + 1).padStart(2, "0")}${documentType.length}`),
    name: `${label} Template ${position + 1}`,
    documentTypes: [documentType],
    localeMode: languageModes[position],
    accentColor: "#1f7a53",
    watermarkText: "",
    headerHtml: "",
    footerHtml: "",
    settings: {},
    logoAssetId: null,
    logoAssetUrl: "",
    isDefault: position === 0,
    isActive: true,
  };
}

export function buildTemplateRegister(templates: DocumentTemplateRecord[]) {
  return templateDocumentTypes.map((documentType) => {
    const matchingTemplates = templates.filter((template) => template.documentTypes.includes(documentType.value));
    const filledTemplates = [...matchingTemplates];

    while (filledTemplates.length < 5) {
      filledTemplates.push(buildFallbackTemplate(documentType.value, filledTemplates.length));
    }

    return {
      documentType: documentType.value,
      label: documentType.label,
      templates: filledTemplates.slice(0, 5),
      usesFallbackData: matchingTemplates.length < 5,
    };
  });
}