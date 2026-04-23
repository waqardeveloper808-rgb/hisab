import { assessMultiCountryReadiness } from "@/lib/country-foundation";

/**
 * ZATCA Phase 2 Compliance Engine
 *
 * Canonical boundary for e-invoicing compliance:
 * - Document state machine (draft → issued → reported/cleared → paid → locked)
 * - Invoice hash generation
 * - XML generation boundary
 * - Signing boundary (certificate/key management)
 * - QR payload composition (TLV encoding per ZATCA spec)
 * - Clearance/reporting submission boundary
 * - Immutability enforcement
 */

// ─── Document State Machine ───

export type ZatcaDocumentState =
  | "draft"
  | "issued"
  | "ready"
  | "submitted"
  | "reported"
  | "cleared"
  | "paid"
  | "partially_paid"
  | "locked"
  | "cancelled";

export type ZatcaTransition =
  | "issue"
  | "ready_submit"
  | "submit"
  | "report"
  | "clear"
  | "pay"
  | "partial_pay"
  | "lock"
  | "cancel"
  | "credit"
  | "debit";

const VALID_TRANSITIONS: Record<ZatcaDocumentState, ZatcaTransition[]> = {
  draft: ["issue"],
  issued: ["ready_submit", "report", "clear", "pay", "partial_pay", "cancel", "credit", "debit"],
  ready: ["submit", "report", "clear", "pay", "partial_pay", "cancel", "credit", "debit"],
  submitted: ["report", "clear", "pay", "partial_pay", "lock", "credit", "debit"],
  reported: ["pay", "partial_pay", "lock", "credit", "debit"],
  cleared: ["pay", "partial_pay", "lock", "credit", "debit"],
  paid: ["lock", "credit", "debit"],
  partially_paid: ["pay", "partial_pay", "lock", "credit", "debit"],
  locked: [],
  cancelled: [],
};

const TRANSITION_TARGET: Record<ZatcaTransition, ZatcaDocumentState> = {
  issue: "issued",
  ready_submit: "ready",
  submit: "submitted",
  report: "reported",
  clear: "cleared",
  pay: "paid",
  partial_pay: "partially_paid",
  lock: "locked",
  cancel: "cancelled",
  credit: "issued", // credit note creates new document, source stays same
  debit: "issued", // debit note creates new document, source stays same
};

export function canTransition(currentState: ZatcaDocumentState, transition: ZatcaTransition): boolean {
  return VALID_TRANSITIONS[currentState]?.includes(transition) ?? false;
}

export function applyTransition(currentState: ZatcaDocumentState, transition: ZatcaTransition): ZatcaDocumentState {
  if (!canTransition(currentState, transition)) {
    throw new Error(`Invalid transition "${transition}" from state "${currentState}".`);
  }
  return TRANSITION_TARGET[transition];
}

export function isEditable(state: ZatcaDocumentState): boolean {
  return state === "draft";
}

export function isDeletable(state: ZatcaDocumentState): boolean {
  return state === "draft";
}

export function isImmutable(state: ZatcaDocumentState): boolean {
  return state === "locked" || state === "cancelled";
}

export function requiresCorrectionNote(state: ZatcaDocumentState): boolean {
  return state !== "draft" && state !== "cancelled";
}

// ─── Editability Rules ───

export type EditabilityContext = {
  documentState: ZatcaDocumentState;
  hasPayments: boolean;
  isInLockedPeriod: boolean;
  isTaxReported: boolean;
};

export function getEditabilityVerdict(context: EditabilityContext): {
  canEdit: boolean;
  canDelete: boolean;
  correctionRequired: boolean;
  reason: string;
} {
  if (context.isInLockedPeriod) {
    return { canEdit: false, canDelete: false, correctionRequired: true, reason: "Document is in a locked accounting period." };
  }

  if (context.isTaxReported) {
    return { canEdit: false, canDelete: false, correctionRequired: true, reason: "Document has been reported to tax authority." };
  }

  if (context.documentState === "locked" || context.documentState === "cancelled") {
    return { canEdit: false, canDelete: false, correctionRequired: false, reason: `Document is ${context.documentState}.` };
  }

  if (context.hasPayments) {
    return { canEdit: false, canDelete: false, correctionRequired: true, reason: "Document has payments. Use credit/debit note." };
  }

  if (context.documentState !== "draft") {
    return { canEdit: false, canDelete: false, correctionRequired: true, reason: "Document is issued. Use credit/debit note to correct." };
  }

  return { canEdit: true, canDelete: true, correctionRequired: false, reason: "Document is a draft and can be edited." };
}

// ─── QR Payload (TLV per ZATCA Phase 2) ───

function encodeTlvField(tag: number, value: string): Uint8Array {
  const valueBytes = new TextEncoder().encode(value);
  return new Uint8Array([tag, valueBytes.length, ...valueBytes]);
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export type QrPayloadInput = {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  invoiceTotal: string;
  vatTotal: string;
  invoiceHash?: string;
  publicKey?: string;
  certificateSignature?: string;
};

export type VatDecisionInput = {
  documentType: string;
  sellerCountry: string;
  buyerCountry: string;
  currency: string;
  buyerVatNumber: string;
  lineCount: number;
  hasGoods: boolean;
};

export type VatDecisionSummary = {
  summary: string;
  reason: string;
  requiresBuyerVatNumber: boolean;
  requiresBuyerAddress: boolean;
  requiresQr: boolean;
};

function normalizeCountryName(value: string) {
  return value.trim().toLowerCase();
}

export function getVatDecisionSummary(input: VatDecisionInput): VatDecisionSummary {
  const sellerCountry = normalizeCountryName(input.sellerCountry);
  const buyerCountry = normalizeCountryName(input.buyerCountry);
  const isSaudiSeller = sellerCountry.includes("saudi") || sellerCountry.includes("ksa") || sellerCountry.includes("المملكة");
  const isSaudiBuyer = buyerCountry.includes("saudi") || buyerCountry.includes("ksa") || buyerCountry.includes("المملكة");
  const isCreditOrDebit = ["credit_note", "debit_note"].includes(input.documentType);
  const isTaxDocument = ["tax_invoice", "cash_invoice", "api_invoice", "credit_note", "debit_note"].includes(input.documentType);
  const exportFlow = isSaudiSeller && !isSaudiBuyer;
  const foreignCurrency = input.currency.trim().toUpperCase() !== "SAR";

  if (!isTaxDocument) {
    return {
      summary: "Operational workflow only",
      reason: "This document type does not create final ZATCA tax reporting on its own.",
      requiresBuyerVatNumber: false,
      requiresBuyerAddress: false,
      requiresQr: false,
    };
  }

  if (exportFlow || foreignCurrency) {
    return {
      summary: isCreditOrDebit ? "Cross-border correction note" : "Cross-border tax invoice",
      reason: "Foreign buyer or currency path needs stronger buyer identity and explicit compliance review.",
      requiresBuyerVatNumber: true,
      requiresBuyerAddress: true,
      requiresQr: true,
    };
  }

  if (isSaudiSeller && isSaudiBuyer && input.hasGoods) {
    return {
      summary: isCreditOrDebit ? "Domestic goods correction" : "Domestic goods invoice",
      reason: "Domestic goods supply in KSA requires QR output and buyer address for traceable handoff.",
      requiresBuyerVatNumber: Boolean(input.buyerVatNumber),
      requiresBuyerAddress: true,
      requiresQr: true,
    };
  }

  return {
    summary: isCreditOrDebit ? "Domestic service correction" : "Domestic service invoice",
    reason: input.lineCount > 1
      ? "Multi-line taxable supply still requires QR, but buyer VAT number stays optional unless contractually required."
      : "Single domestic taxable supply qualifies for standard QR output with basic buyer identity.",
    requiresBuyerVatNumber: false,
    requiresBuyerAddress: true,
    requiresQr: true,
  };
}

export function buildQrPayload(input: QrPayloadInput): string {
  const fields: Uint8Array[] = [
    encodeTlvField(1, input.sellerName),
    encodeTlvField(2, input.vatNumber),
    encodeTlvField(3, input.timestamp),
    encodeTlvField(4, input.invoiceTotal),
    encodeTlvField(5, input.vatTotal),
  ];

  // Phase 2 additional fields
  if (input.invoiceHash) {
    fields.push(encodeTlvField(6, input.invoiceHash));
  }
  if (input.publicKey) {
    fields.push(encodeTlvField(7, input.publicKey));
  }
  if (input.certificateSignature) {
    fields.push(encodeTlvField(8, input.certificateSignature));
  }

  const totalLength = fields.reduce((sum, field) => sum + field.length, 0);
  const payload = new Uint8Array(totalLength);
  let offset = 0;
  fields.forEach((field) => {
    payload.set(field, offset);
    offset += field.length;
  });

  return uint8ToBase64(payload);
}

// ─── Invoice Hash Generation Boundary ───

export type InvoiceHashInput = {
  uuid: string;
  issueDate: string;
  issueTime: string;
  invoiceTotal: string;
  vatTotal: string;
  sellerVatNumber: string;
  previousInvoiceHash?: string;
};

export function computeInvoiceHash(input: InvoiceHashInput): string {
  // SHA-256 hash placeholder — in production, use SubtleCrypto or server-side hashing
  const canonical = [
    input.uuid,
    input.issueDate,
    input.issueTime,
    input.invoiceTotal,
    input.vatTotal,
    input.sellerVatNumber,
    input.previousInvoiceHash ?? "",
  ].join("|");

  // Simple hash for scaffold — replace with crypto.subtle.digest("SHA-256", ...) in production
  let hash = 0;
  for (let i = 0; i < canonical.length; i++) {
    const chr = canonical.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
}

// ─── XML Generation Boundary ───

export type ZatcaXmlInput = {
  uuid: string;
  invoiceNumber: string;
  issueDate: string;
  issueTime: string;
  invoiceTypeCode: string; // "388" for tax invoice, "381" for credit, "383" for debit
  currencyCode: string;
  seller: {
    name: string;
    vatNumber: string;
    crNumber?: string;
    address: { street?: string; city?: string; postalCode?: string; countryCode: string };
  };
  buyer: {
    name: string;
    vatNumber?: string;
    address?: { street?: string; city?: string; postalCode?: string; countryCode: string };
  };
  lines: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxableAmount: number;
    taxAmount: number;
    taxRate: number;
  }>;
  taxableTotal: number;
  taxTotal: number;
  grandTotal: number;
  previousInvoiceHash?: string;
};

export function generateUblXmlStub(input: ZatcaXmlInput): string {
  const lines = input.lines.map((line, index) => `
    <cac:InvoiceLine>
      <cbc:ID>${index + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="PCE">${line.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${input.currencyCode}">${line.taxableAmount.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:Item><cbc:Name>${escapeXml(line.description)}</cbc:Name></cac:Item>
      <cac:Price><cbc:PriceAmount currencyID="${input.currencyCode}">${line.unitPrice.toFixed(2)}</cbc:PriceAmount></cac:Price>
    </cac:InvoiceLine>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${escapeXml(input.invoiceNumber)}</cbc:ID>
  <cbc:UUID>${escapeXml(input.uuid)}</cbc:UUID>
  <cbc:IssueDate>${input.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${input.issueTime}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>${input.invoiceTypeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${input.currencyCode}</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="CRN">${escapeXml(input.seller.crNumber ?? "")}</cbc:ID></cac:PartyIdentification>
      <cac:PartyLegalEntity><cbc:RegistrationName>${escapeXml(input.seller.name)}</cbc:RegistrationName></cac:PartyLegalEntity>
      <cac:PartyTaxScheme><cbc:CompanyID>${escapeXml(input.seller.vatNumber)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyLegalEntity><cbc:RegistrationName>${escapeXml(input.buyer.name)}</cbc:RegistrationName></cac:PartyLegalEntity>
      ${input.buyer.vatNumber ? `<cac:PartyTaxScheme><cbc:CompanyID>${escapeXml(input.buyer.vatNumber)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ""}
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:TaxExclusiveAmount currencyID="${input.currencyCode}">${input.taxableTotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${input.currencyCode}">${input.grandTotal.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${input.currencyCode}">${input.grandTotal.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${input.currencyCode}">${input.taxTotal.toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>${lines}
</Invoice>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── Signing Boundary (Certificate/Key) ───

export type SigningConfiguration = {
  certificatePem: string;
  privateKeyPem: string;
  certificateSerialNumber: string;
  issuerName: string;
};

export type SigningResult = {
  signatureValue: string;
  signedPropertiesHash: string;
  certificateHash: string;
  signatureEnvelope: {
    signingMethod: string;
    canonicalizationMethod: string;
    certificateSerialNumber: string;
    issuerName: string;
  };
};

/**
 * Stub for XML signing. In production, use xmldsig / XAdES-BES per ZATCA spec.
 * This boundary exists so the rest of the engine can wire in real signing
 * without restructuring.
 */
export function signInvoiceXml(
  xml: string,
  config: SigningConfiguration
): SigningResult {
  void xml;
  void config;
  return {
    signatureValue: "STUB_SIGNATURE_PENDING_IMPLEMENTATION",
    signedPropertiesHash: "STUB_HASH",
    certificateHash: "STUB_CERT_HASH",
    signatureEnvelope: {
      signingMethod: "XAdES-BES-ready",
      canonicalizationMethod: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
      certificateSerialNumber: config.certificateSerialNumber,
      issuerName: config.issuerName,
    },
  };
}

export type ZatcaSchemaValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  requiredTagsPresent: string[];
};

const REQUIRED_XML_TAGS = [
  "<cbc:UUID>",
  "<cbc:IssueDate>",
  "<cbc:IssueTime>",
  "<cbc:InvoiceTypeCode>",
  "<cbc:DocumentCurrencyCode>",
  "<cac:AccountingSupplierParty>",
  "<cac:AccountingCustomerParty>",
  "<cac:LegalMonetaryTotal>",
  "<cac:TaxTotal>",
  "<cac:InvoiceLine>",
];

export function validateUblXmlStructure(xml: string): ZatcaSchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredTagsPresent = REQUIRED_XML_TAGS.filter((tag) => xml.includes(tag));

  REQUIRED_XML_TAGS.forEach((tag) => {
    if (!xml.includes(tag)) {
      errors.push(`Missing required UBL tag ${tag}.`);
    }
  });

  if (!xml.startsWith("<?xml")) {
    errors.push("XML declaration is missing.");
  }

  if (!xml.includes('xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"')) {
    errors.push("UBL invoice namespace is missing.");
  }

  if (!xml.includes("<cbc:ProfileID>")) {
    warnings.push("ProfileID is missing; ZATCA profile selection should be explicit.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    requiredTagsPresent,
  };
}

export type InvoiceHashChainEntry = {
  currentHash: string;
  previousHash: string;
  chainStatus: "genesis" | "linked";
};

export function buildInvoiceHashChain(input: InvoiceHashInput): InvoiceHashChainEntry {
  const currentHash = computeInvoiceHash(input);
  return {
    currentHash,
    previousHash: input.previousInvoiceHash ?? "GENESIS",
    chainStatus: input.previousInvoiceHash ? "linked" : "genesis",
  };
}

export type ZatcaSubmissionReadyPayload = {
  uuid: string;
  invoiceHash: string;
  previousInvoiceHash: string;
  xml: string;
  schemaValidation: ZatcaSchemaValidationResult;
  signature: SigningResult;
  qrPayload: string;
  submissionEnvelope: {
    status: "ready" | "blocked";
    transportMode: SubmissionMode;
    contentType: "application/xml";
    invoiceNumber: string;
  };
};

export function buildSubmissionReadyPayload(input: {
  xmlInput: ZatcaXmlInput;
  hashInput: InvoiceHashInput;
  signingConfig: SigningConfiguration;
  qrPayloadInput: QrPayloadInput;
  mode: SubmissionMode;
}): ZatcaSubmissionReadyPayload {
  const xml = generateUblXmlStub(input.xmlInput);
  const schemaValidation = validateUblXmlStructure(xml);
  const hashChain = buildInvoiceHashChain(input.hashInput);
  const signature = signInvoiceXml(xml, input.signingConfig);
  const qrPayload = buildQrPayload({
    ...input.qrPayloadInput,
    invoiceHash: hashChain.currentHash,
    publicKey: signature.signatureEnvelope.certificateSerialNumber,
    certificateSignature: signature.signatureValue,
  });

  return {
    uuid: input.xmlInput.uuid,
    invoiceHash: hashChain.currentHash,
    previousInvoiceHash: hashChain.previousHash,
    xml,
    schemaValidation,
    signature,
    qrPayload,
    submissionEnvelope: {
      status: schemaValidation.valid ? "ready" : "blocked",
      transportMode: input.mode,
      contentType: "application/xml",
      invoiceNumber: input.xmlInput.invoiceNumber,
    },
  };
}

export type ZatcaReadinessAssessment = {
  state: ZatcaDocumentState;
  canSubmit: boolean;
  validation: ZatcaSchemaValidationResult;
  countryReadiness: ReturnType<typeof assessMultiCountryReadiness>;
  blockers: string[];
};

export function assessZatcaReadiness(input: {
  state: ZatcaDocumentState;
  xml: string;
  sellerCountryCode?: string | null;
  buyerCountryCode?: string | null;
  currency?: string | null;
}): ZatcaReadinessAssessment {
  const validation = validateUblXmlStructure(input.xml);
  const countryReadiness = assessMultiCountryReadiness({
    sellerCountryCode: input.sellerCountryCode,
    buyerCountryCode: input.buyerCountryCode,
    currency: input.currency,
  });
  const blockers = [
    ...validation.errors,
    ...countryReadiness.warnings.filter((warning) => warning.toLowerCase().includes("cross-border")),
  ];

  return {
    state: input.state,
    canSubmit: (input.state === "ready" || input.state === "submitted" || input.state === "reported" || input.state === "cleared") && blockers.length === 0,
    validation,
    countryReadiness,
    blockers,
  };
}

// ─── Clearance / Reporting Submission Boundary ───

export type SubmissionMode = "reporting" | "clearance";

export type SubmissionResult = {
  requestId: string;
  dispositionStatus: "ACCEPTED" | "REJECTED" | "PENDING" | "ERROR";
  clearanceStatus?: string;
  validationResults?: Array<{
    code: string;
    message: string;
    severity: "WARNING" | "ERROR" | "INFO";
  }>;
  clearedInvoiceXml?: string;
  timestamp: string;
};

/**
 * Boundary for ZATCA API submission.
 * In production, POST to ZATCA sandbox/production endpoint.
 */
export async function submitToZatca(
  mode: SubmissionMode,
  signedXml: string,
  invoiceHash: string,
  uuid: string
): Promise<SubmissionResult> {
  void mode;
  void signedXml;
  void invoiceHash;
  void uuid;
  return {
    requestId: crypto.randomUUID(),
    dispositionStatus: "PENDING",
    validationResults: [
      { code: "INFO-001", message: "ZATCA submission boundary scaffolded. Connect to sandbox.", severity: "INFO" },
    ],
    timestamp: new Date().toISOString(),
  };
}

// ─── Balance Calculation ───

export type BalanceInput = {
  grandTotal: number;
  paidTotal: number;
  creditNotesTotal: number;
  debitNotesTotal: number;
  adjustmentsTotal: number;
};

export function calculateBalance(input: BalanceInput): number {
  return input.grandTotal - input.paidTotal - input.creditNotesTotal + input.debitNotesTotal + input.adjustmentsTotal;
}

// ─── Locked Period ───

export type LockedPeriod = {
  startDate: string;
  endDate: string;
  lockedBy: string;
  lockedAt: string;
  reason: string;
};

export function isInLockedPeriod(documentDate: string, periods: LockedPeriod[]): boolean {
  return periods.some((period) => documentDate >= period.startDate && documentDate <= period.endDate);
}
