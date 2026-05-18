import type { V3Document } from "./types";

export function isZatcaEligibleV3(documentType: string): boolean {
  return ["tax_invoice", "credit_note", "debit_note"].includes(documentType);
}

export function buildZatcaQrV3(document: V3Document): { svg: string; textPayload: string; eligible: boolean } {
  const eligible = isZatcaEligibleV3(document.type);
  const payload = [
    `Seller:${document.seller.nameEn ?? ""}`,
    `VAT:${document.seller.vatNumber ?? ""}`,
    `IssueDate:${document.issueDate}`,
    `Total:${document.grandTotal.toFixed(2)}`,
    `VATTotal:${document.vatTotal.toFixed(2)}`,
  ].join("|");
  const safe = payload.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="#ffffff"/><rect x="8" y="8" width="112" height="112" rx="8" fill="#0f766e"/><text x="64" y="60" text-anchor="middle" font-size="9" fill="#ffffff">ZATCA QR</text><text x="64" y="74" text-anchor="middle" font-size="6" fill="#dcfce7">${safe.slice(0, 32)}</text></svg>`;
  return { svg, textPayload: payload, eligible };
}

export function buildZatcaXmlV3(document: V3Document): string {
  if (!isZatcaEligibleV3(document.type)) {
    return `<Invoice><Status>not-eligible</Status><Type>${document.type}</Type></Invoice>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice>
  <ID>${document.number}</ID>
  <IssueDate>${document.issueDate}</IssueDate>
  <DocumentType>${document.type}</DocumentType>
  <SellerName>${document.seller.nameEn ?? ""}</SellerName>
  <SellerVAT>${document.seller.vatNumber ?? ""}</SellerVAT>
  <TaxableAmount>${document.taxableTotal.toFixed(2)}</TaxableAmount>
  <TaxAmount>${document.vatTotal.toFixed(2)}</TaxAmount>
  <PayableAmount>${document.grandTotal.toFixed(2)}</PayableAmount>
</Invoice>`;
}
