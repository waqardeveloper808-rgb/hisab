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
    showQr: boolean;
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
  };
  customer: {
    name: string;
    address: string;
    vatNumber: string;
    contact: string;
  };
  invoice: {
    number: string;
    issueDate: string;
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
    }>;
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