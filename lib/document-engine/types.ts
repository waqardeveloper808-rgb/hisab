export type DocumentRenderModel = {
  customFields?: Record<string, string | number | boolean | null>;
  document: {
    kind: string;
    titleEn: string;
    titleAr: string;
    numberLabelEn: string;
    numberLabelAr: string;
    partyLabelEn: string;
    partyLabelAr: string;
    showVatColumn: boolean;
    showVatTotals: boolean;
    /** Phase 1 QR eligibility from document compliance (simplified tax invoice or flagged credit/debit note). */
    showQr: boolean;
    /** Table column toggles (defaults per compact template spec). */
    showVatPercentColumn: boolean;
    showUnitColumn: boolean;
    subtitleBadgeEn: string;
    subtitleBadgeAr: string;
    referenceLabelEn?: string;
    referenceLabelAr?: string;
    referenceValue?: string;
  };
  company: {
    legalName: string;
    tradeName: string;
    englishName: string;
    arabicName: string;
    vatNumber: string;
    crNumber: string;
    email: string;
    phone: string;
    addressEn: string;
    addressAr: string;
    logoUrl: string | null;
    /** Fallback brand asset when no workspace logo (Gulf Hisab mark). */
    defaultBrandLogoPath: string;
  };
  customer: {
    name: string;
    nameAr: string;
    address: string;
    addressAr: string;
    vatNumber: string;
    contact: string;
  };
  invoice: {
    number: string;
    issueDate: string;
    issueTime: string;
    supplyDate: string;
    dueDate: string;
    currency: string;
    vatRate: number;
    subtotal: number;
    vatTotal: number;
    grandTotal: number;
    lines: Array<{
      id: number;
      sequence: number;
      description: string;
      descriptionAr?: string;
      quantity: number;
      unitPrice: number;
      taxableAmount?: number;
      vatAmount?: number;
      vatLabel?: string;
      total: number;
      discountAmount: number;
      unitLabel: string;
    }>;
  };
  /** Footer notes — omitted when empty. */
  notes?: string | null;
  /** Amount in words — only rendered when provided via custom fields (no auto-generation). */
  amountInWords?: { en: string; ar: string } | null;
  /** Optional bilingual footer line (terms / disclaimer). Hidden when both empty. */
  footerNote?: { en: string; ar: string } | null;
  /** ZATCA overlay — populated only for tax_invoice when enabled. */
  zatca: null | {
    enabled: boolean;
    /** TLV-encoded Phase 1 simplified-invoice QR content (base64). */
    qrPayload: string;
    /** Raster QR from local `qrcode` — server-rendered for PDF/export. */
    qrImageDataUrl?: string;
    uuid: string;
    invoiceHash: string;
    previousInvoiceHash: string;
  };
};

export type CompanyProfileSnapshot = {
  legalName: string;
  tradeName: string;
  englishName: string;
  arabicName: string;
  taxNumber: string;
  registrationNumber: string;
  email: string;
  phone: string;
  shortAddress: string;
  addressStreet: string;
  addressArea: string;
  addressCity: string;
  addressPostalCode: string;
  addressAdditionalNumber: string;
  addressCountry: string;
  baseCurrency: string;
  logoUrl: string | null;
};

export type CompanyAssetLike = {
  id: number;
  usage?: string | null;
  publicUrl: string;
  isActive: boolean;
};

export type DocumentLineLike = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  grossAmount?: number;
  metadata?: {
    custom_fields?: Record<string, string | number | boolean | null> | null;
  } | null;
};

export type DocumentLike = {
  id: number;
  type: string;
  documentNumber: string;
  issueDate: string;
  dueDate: string;
  supplyDate?: string | null;
  taxableTotal: number;
  taxTotal: number;
  grandTotal: number;
  notes?: string | null;
  compliance_metadata?: Record<string, unknown> | null;
  customFields?: Record<string, string | number | boolean | null> | null;
  lines: DocumentLineLike[];
};

export type ContactLike = {
  displayName: string;
  displayNameAr?: string | null;
  vatNumber?: string | null;
  phone?: string | null;
  billingAddress?: {
    line1?: string | null;
    line1Ar?: string | null;
    city?: string | null;
  } | null;
};