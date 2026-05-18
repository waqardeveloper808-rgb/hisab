export type V3DocumentType =
  | "tax_invoice"
  | "quotation"
  | "proforma_invoice"
  | "credit_note"
  | "debit_note"
  | "delivery_note";

export type V3TemplateStyle = "standard" | "modern" | "compact";

export type V3TemplateId =
  | "tax_invoice.standard"
  | "tax_invoice.modern"
  | "tax_invoice.compact"
  | "quotation.standard"
  | "quotation.modern"
  | "quotation.compact"
  | "proforma_invoice.standard"
  | "proforma_invoice.modern"
  | "proforma_invoice.compact"
  | "credit_note.standard"
  | "credit_note.modern"
  | "credit_note.compact"
  | "debit_note.standard"
  | "debit_note.modern"
  | "debit_note.compact"
  | "delivery_note.standard"
  | "delivery_note.modern"
  | "delivery_note.compact";

export type V3LineItem = {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  amount?: number;
};

export type V3Party = {
  nameEn?: string;
  nameAr?: string;
  vatNumber?: string;
  phone?: string;
  addressEn?: string;
  addressAr?: string;
};

export type V3Document = {
  id: number;
  number: string;
  type: V3DocumentType;
  issueDate: string;
  dueDate?: string | null;
  currency: string;
  seller: V3Party;
  customer: V3Party;
  lines: V3LineItem[];
  notes?: string | null;
  referenceDocumentNumber?: string | null;
  adjustmentReason?: string | null;
  taxableTotal: number;
  vatTotal: number;
  grandTotal: number;
};

export type V3TemplateRecord = {
  id: V3TemplateId;
  documentType: V3DocumentType;
  style: V3TemplateStyle;
  name: "Standard" | "Modern" | "Compact";
  internalVariant?: "legacy_blue";
};

export type V3RenderInput = {
  document: V3Document;
  style: V3TemplateStyle;
};
