export type TaxInvoiceAhnLabelOverrides = Partial<Record<
  | "seller"
  | "customer"
  | "address"
  | "vatNumber"
  | "invoiceNumber"
  | "issueDate"
  | "dueDate"
  | "reference"
  | "orderNumber"
  | "subtotal"
  | "vatTotal"
  | "grandTotal", string>>;

export type TaxInvoiceAhnFieldVisibility = {
  reference: boolean;
  orderNumber: boolean;
  buyerVatNumber: boolean;
  buyerAddress: boolean;
  buyerArabicName: boolean;
  notes: boolean;
  stamp: boolean;
  signature: boolean;
};

export type TaxInvoiceAhnContract = {
  seller: {
    companyNameEn: string;
    companyNameAr: string;
    addressEn: string;
    addressAr: string;
    email: string;
    vatNumber: string;
    crNumber: string;
    logoUrl: string | null;
    nationalAddress?: {
      buildingNumber?: string;
      street?: string;
      district?: string;
      city?: string;
      postalCode?: string;
      additionalNumber?: string;
      country?: string;
    } | null;
  };
  buyer: {
    customerNameEnOrMain: string;
    customerNameAr?: string;
    addressEn: string;
    addressAr?: string;
    vatNumber: string;
  };
  document: {
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    reference: string;
    orderNumber: string;
    currency: string;
    qrCodeData: string;
    pageNumber: number;
    totalPages: number;
  };
  lines: Array<{
    lineNo: number;
    descriptionEn: string;
    descriptionAr?: string;
    qty: number;
    unitPrice: number;
    taxableAmount: number;
    vatRate: number;
    vatAmount: number;
    lineAmount: number;
  }>;
  totals: {
    subtotal: number;
    vatTotal: number;
    grandTotal: number;
  };
  metadata: {
    notes: string;
    complianceFooter: string;
    zatcaQrNote: string;
    stampUrl: string | null;
    signatureUrl: string | null;
    labels: TaxInvoiceAhnLabelOverrides;
    fieldVisibility: TaxInvoiceAhnFieldVisibility;
    hooks: {
      logoUpload: boolean;
      stampUpload: boolean;
      signatureUpload: boolean;
      previewMatchesPdf: boolean;
      xmlHookAvailable: boolean;
      qrHookAvailable: boolean;
    };
  };
};
