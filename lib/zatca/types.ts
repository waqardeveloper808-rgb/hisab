export type ZatcaEnvironment = "sandbox" | "production" | "simulation";

export type ZatcaDocumentKind = "tax_invoice" | "simplified_tax_invoice" | "credit_note" | "debit_note";

export type ZatcaPartyAddress = {
  street?: string | null;
  city?: string | null;
  postalCode?: string | null;
  additionalNumber?: string | null;
  countryCode?: string | null;
};

export type ZatcaParty = {
  name: string;
  vatNumber?: string | null;
  registrationNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: ZatcaPartyAddress | null;
};

export type ZatcaLine = {
  id: string | number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxableAmount?: number | null;
  vatRate?: number | null;
  vatAmount?: number | null;
  total?: number | null;
  note?: string | null;
};

export type ZatcaDocumentInput = {
  documentId: number;
  documentNumber: string;
  documentKind: ZatcaDocumentKind;
  issueDate: string;
  issueTime?: string | null;
  currency: string;
  seller: ZatcaParty;
  buyer: ZatcaParty;
  lines: ZatcaLine[];
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  previousInvoiceHash?: string | null;
  invoiceUuid?: string | null;
  invoiceCounterValue?: number | null;
  billingReferenceNumber?: string | null;
  billingReferenceUuid?: string | null;
  notes?: string | null;
  environment: ZatcaEnvironment;
  scenario: "standard" | "simplified" | "credit_note" | "debit_note";
};

export type ZatcaCertificateBundle = {
  available: boolean;
  privateKeyPem?: string | null;
  certificatePem?: string | null;
  csid?: string | null;
  pcsid?: string | null;
  environment: ZatcaEnvironment;
  blockers: string[];
};

export type ZatcaQrFields = {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  invoiceTotal: string;
  vatTotal: string;
  invoiceHash?: string | null;
  publicKey?: string | null;
  certificateSignature?: string | null;
};

export type ZatcaSignatureResult = {
  available: boolean;
  xml: string;
  signatureValue?: string | null;
  digestValue?: string | null;
  certificateFingerprint?: string | null;
  blockers: string[];
};

export type ZatcaPackageStatus = "ready" | "blocked" | "simulation";

export type ZatcaValidationResult = {
  status: ZatcaPackageStatus;
  xmlValid: boolean;
  signatureValid: boolean | "blocked";
  qrValid: boolean;
  embeddedXmlValid: boolean | "blocked";
  blockers: string[];
  warnings: string[];
  details: Record<string, unknown>;
};

export type ZatcaBuildResult = {
  status: ZatcaPackageStatus;
  document: ZatcaDocumentInput;
  xml: string;
  canonicalXml: string;
  invoiceHashBase64: string;
  qrBase64: string;
  qrDecoded: Record<string, string>;
  signature: ZatcaSignatureResult;
  validation: ZatcaValidationResult;
  sequence: {
    icv: number;
    previousInvoiceHash: string | null;
  };
  blockers: string[];
  warnings: string[];
};

export type ZatcaPdfA3Result = {
  bytes: Uint8Array;
  fileName: string;
  xmlFileName: string;
  status: ZatcaPackageStatus;
  blockers: string[];
  warnings: string[];
};

export type ZatcaSandboxResult = {
  status: "ready" | "blocked" | "simulation";
  blockers: string[];
  command?: string | null;
  stdout?: string | null;
  stderr?: string | null;
  payload?: Record<string, unknown> | null;
};
