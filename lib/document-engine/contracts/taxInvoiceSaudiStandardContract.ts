export type TaxInvoiceSaudiStandardFieldVisibility = {
  buyerVatNumber: boolean;
  buyerAddress: boolean;
  reference: boolean;
  orderNumber: boolean;
  supplyDate: boolean;
  nationalAddress: boolean;
  stamp: boolean;
  signature: boolean;
  labelsBilingual: boolean;
};

export type TaxInvoiceSaudiStandardLine = {
  lineNo: number;
  descriptionEn: string;
  descriptionAr: string;
  qty: number;
  unitPrice: number;
  taxableAmount: number;
  vatRate: number;
  vatAmount: number;
  lineAmount: number;
};

export type TaxInvoiceSaudiStandardContract = {
  seller: {
    companyNameEn: string;
    companyNameAr: string;
    addressEn: string;
    addressAr: string;
    email: string;
    vatNumber: string;
    crNumber: string;
    logoUrl: string | null;
    nationalAddressLineEn: string;
    nationalAddressLineAr: string;
  };
  buyer: {
    customerName: string;
    customerNameAr: string;
    addressEn: string;
    addressAr: string;
    vatNumber: string;
  };
  document: {
    invoiceNumber: string;
    issueDate: string;
    supplyDate: string;
    dueDate: string;
    reference: string;
    orderNumber: string;
    currency: string;
    /** Phase 1 QR (simplified / B2C scenario only) — see `showPhase1Qr`. */
    qrCodeData: string;
    /** Local QR raster (data URL) — optional until server enrichment. */
    qrImageDataUrl?: string;
    /** When false, QR markup is omitted (standard B2B tax invoice). */
    showPhase1Qr: boolean;
    pageNumber: number;
    totalPages: number;
  };
  lines: TaxInvoiceSaudiStandardLine[];
  totals: {
    subtotal: number;
    vatTotal: number;
    grandTotal: number;
  };
  compliance: {
    qrComplianceNoteEn: string;
    qrComplianceNoteAr: string;
    pdfStandardHook: string;
    xmlHook: string;
    zatcaPhase2Hook: string;
  };
  editor: {
    logoUpload: boolean;
    stampUpload: boolean;
    signatureUpload: boolean;
    fieldVisibility: TaxInvoiceSaudiStandardFieldVisibility;
    stampUrl: string | null;
    signatureUrl: string | null;
  };
};
