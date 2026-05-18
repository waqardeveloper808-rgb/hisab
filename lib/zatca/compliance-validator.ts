import { canonicalizeXml } from "./xml-canonicalizer";
import { decodeZatcaQrTlvBase64 } from "./qr-tlv";
import type { ZatcaBuildResult, ZatcaValidationResult } from "./types";

function hasRequired(xml: string, tokens: string[]) {
  return tokens.every((token) => xml.includes(token));
}

export function validateZatcaXmlStructure(xml: string) {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const rootOk = xml.includes("<Invoice") || xml.includes("<CreditNote");
  if (!rootOk) blockers.push("missing-ubl-root");
  if (!xml.includes("xmlns:cac=") || !xml.includes("xmlns:cbc=")) blockers.push("missing-ubl-namespaces");
  if (!hasRequired(xml, ["<cbc:ID>", "<cbc:UUID>", "<cbc:IssueDate>", "<cbc:IssueTime>", "<cbc:DocumentCurrencyCode>"])) {
    blockers.push("missing-core-invoice-fields");
  }
  if (!xml.includes("<cac:TaxTotal>")) blockers.push("missing-tax-total");
  if (!xml.includes("<cac:LegalMonetaryTotal>")) blockers.push("missing-monetary-total");
  if (!xml.includes("<cac:AccountingSupplierParty>")) blockers.push("missing-supplier-party");
  if (!xml.includes("<cac:AccountingCustomerParty>")) blockers.push("missing-customer-party");
  return {
    valid: blockers.length === 0,
    blockers,
    warnings,
  };
}

export function validateZatcaQrPayload(result: ZatcaBuildResult) {
  const decoded = result.qrDecoded;
  const blockers: string[] = [];
  if (decoded["1"] !== result.document.seller.name) blockers.push("seller-name-mismatch");
  if (decoded["2"] !== result.document.seller.vatNumber) blockers.push("vat-number-mismatch");
  if (!decoded["3"]) blockers.push("timestamp-missing");
  if (decoded["4"] !== result.document.grandTotal.toFixed(2)) blockers.push("total-mismatch");
  if (decoded["5"] !== result.document.vatTotal.toFixed(2)) blockers.push("vat-mismatch");
  return {
    valid: blockers.length === 0,
    blockers,
  };
}

export function validateSignedXml(result: ZatcaBuildResult) {
  if (!result.signature.available) {
    return {
      valid: false as const,
      blockers: result.signature.blockers.length ? result.signature.blockers : ["signature-blocked"],
    };
  }

  const canonical = canonicalizeXml(result.xml);
  const hasSignature = canonical.includes("<ds:Signature");
  return {
    valid: hasSignature,
    blockers: hasSignature ? [] : ["signature-xml-missing"],
  };
}

export function buildZatcaValidationResult(result: ZatcaBuildResult): ZatcaValidationResult {
  const xml = validateZatcaXmlStructure(result.xml);
  const signature = validateSignedXml(result);
  const qr = validateZatcaQrPayload(result);

  const blockers = [...xml.blockers, ...signature.blockers, ...qr.blockers, ...result.blockers];
  return {
    status: result.status,
    xmlValid: xml.valid,
    signatureValid: signature.valid,
    qrValid: qr.valid,
    embeddedXmlValid: result.status === "ready" ? true : "blocked",
    blockers,
    warnings: [...xml.warnings, ...result.warnings],
    details: {
      xml,
      signature,
      qr,
      canonicalHash: result.invoiceHashBase64,
      icv: result.sequence.icv,
      previousInvoiceHash: result.sequence.previousInvoiceHash,
    },
  };
}

