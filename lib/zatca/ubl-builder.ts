import type {
  ZatcaDocumentInput,
  ZatcaLine,
  ZatcaParty,
  ZatcaSignatureResult,
} from "./types";

function escapeXml(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function money(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function safeTime(value?: string | null): string {
  if (value && value.trim()) {
    return value.trim();
  }
  return "00:00:00";
}

function rootName(kind: ZatcaDocumentInput["documentKind"]) {
  return kind === "credit_note" ? "CreditNote" : "Invoice";
}

function documentTypeCode(kind: ZatcaDocumentInput["documentKind"]) {
  switch (kind) {
    case "credit_note":
      return "381";
    case "debit_note":
      return "383";
    case "simplified_tax_invoice":
      return "388";
    case "tax_invoice":
    default:
      return "388";
  }
}

function profileId(kind: ZatcaDocumentInput["documentKind"], scenario: ZatcaDocumentInput["scenario"]) {
  if (kind === "credit_note" || kind === "debit_note") {
    return "reporting:1.0";
  }
  return scenario === "simplified" ? "reporting:1.0" : "compliance:1.0";
}

function customizationId(kind: ZatcaDocumentInput["documentKind"], scenario: ZatcaDocumentInput["scenario"]) {
  if (kind === "credit_note" || kind === "debit_note") {
    return "urn:zatca:credit-note:1.0";
  }
  return scenario === "simplified"
    ? "urn:zatca:simplified-tax-invoice:1.0"
    : "urn:zatca:standard-tax-invoice:1.0";
}

function partyAddressXml(prefix: string, party: ZatcaParty) {
  const address = party.address ?? {};
  return `
    <cac:PostalAddress>
      ${address.street ? `<cbc:StreetName>${escapeXml(address.street)}</cbc:StreetName>` : ""}
      ${address.city ? `<cbc:CityName>${escapeXml(address.city)}</cbc:CityName>` : ""}
      ${address.postalCode ? `<cbc:PostalZone>${escapeXml(address.postalCode)}</cbc:PostalZone>` : ""}
      ${address.additionalNumber ? `<cbc:BuildingNumber>${escapeXml(address.additionalNumber)}</cbc:BuildingNumber>` : ""}
      <cac:Country><cbc:IdentificationCode>${escapeXml(address.countryCode ?? "SA")}</cbc:IdentificationCode></cac:Country>
    </cac:PostalAddress>
    ${party.email ? `<cbc:WebsiteURI>${escapeXml(party.email)}</cbc:WebsiteURI>` : ""}
    ${party.phone ? `<cbc:Telephone>${escapeXml(party.phone)}</cbc:Telephone>` : ""}
  `.trim();
}

function supplierPartyXml(party: ZatcaParty) {
  return `
  <cac:AccountingSupplierParty>
    <cac:Party>
      ${party.registrationNumber ? `<cac:PartyIdentification><cbc:ID schemeID="CRN">${escapeXml(party.registrationNumber)}</cbc:ID></cac:PartyIdentification>` : ""}
      <cac:PartyName><cbc:Name>${escapeXml(party.name)}</cbc:Name></cac:PartyName>
      ${partyAddressXml("supplier", party)}
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(party.vatNumber ?? "")}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  `.trim();
}

function customerPartyXml(party: ZatcaParty) {
  return `
  <cac:AccountingCustomerParty>
    <cac:Party>
      ${party.registrationNumber ? `<cac:PartyIdentification><cbc:ID schemeID="CRN">${escapeXml(party.registrationNumber)}</cbc:ID></cac:PartyIdentification>` : ""}
      <cac:PartyName><cbc:Name>${escapeXml(party.name)}</cbc:Name></cac:PartyName>
      ${partyAddressXml("customer", party)}
      ${party.vatNumber ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(party.vatNumber)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>` : ""}
    </cac:Party>
  </cac:AccountingCustomerParty>
  `.trim();
}

function taxTotalXml(input: ZatcaDocumentInput) {
  return `
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${escapeXml(input.currency)}">${money(input.vatTotal)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${escapeXml(input.currency)}">${money(input.subtotal)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${escapeXml(input.currency)}">${money(input.vatTotal)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>15</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  `.trim();
}

function lineXml(line: ZatcaLine, index: number, currency: string, root: "Invoice" | "CreditNote") {
  const lineExtension = line.taxableAmount ?? line.quantity * line.unitPrice;
  const vatAmount = line.vatAmount ?? Math.max(0, (line.vatRate ?? 0.15) * lineExtension);
  const total = line.total ?? lineExtension + vatAmount;
  const tag = root === "CreditNote" ? "CreditNoteLine" : "InvoiceLine";
  return `
    <cac:${tag}>
      <cbc:ID>${index + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="EA">${line.quantity.toFixed(3)}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${escapeXml(currency)}">${money(lineExtension)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${escapeXml(currency)}">${money(vatAmount)}</cbc:TaxAmount>
        <cbc:RoundingAmount currencyID="${escapeXml(currency)}">${money(total)}</cbc:RoundingAmount>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Name>${escapeXml(line.description)}</cbc:Name>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${escapeXml(currency)}">${money(line.unitPrice)}</cbc:PriceAmount>
      </cac:Price>
    </cac:${tag}>
  `.trim();
}

function billingReferenceXml(input: ZatcaDocumentInput) {
  if (!input.billingReferenceNumber && !input.billingReferenceUuid) {
    return "";
  }

  return `
  <cac:BillingReference>
    <cac:InvoiceDocumentReference>
      ${input.billingReferenceNumber ? `<cbc:ID>${escapeXml(input.billingReferenceNumber)}</cbc:ID>` : ""}
      ${input.billingReferenceUuid ? `<cbc:UUID>${escapeXml(input.billingReferenceUuid)}</cbc:UUID>` : ""}
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>
  `.trim();
}

function additionalReferenceXml(input: ZatcaDocumentInput, invoiceHashBase64: string, icv: number) {
  const refs = [
    `<cac:AdditionalDocumentReference><cbc:ID>QR</cbc:ID><cbc:DocumentDescription>${escapeXml(input.documentNumber)}</cbc:DocumentDescription></cac:AdditionalDocumentReference>`,
    `<cac:AdditionalDocumentReference><cbc:ID>ICV</cbc:ID><cbc:DocumentDescription>${icv}</cbc:DocumentDescription></cac:AdditionalDocumentReference>`,
    `<cac:AdditionalDocumentReference><cbc:ID>PIH</cbc:ID><cbc:DocumentDescription>${escapeXml(input.previousInvoiceHash ?? "")}</cbc:DocumentDescription></cac:AdditionalDocumentReference>`,
    `<cac:AdditionalDocumentReference><cbc:ID>HASH</cbc:ID><cbc:DocumentDescription>${escapeXml(invoiceHashBase64)}</cbc:DocumentDescription></cac:AdditionalDocumentReference>`,
  ];

  return refs.join("\n");
}

function signatureExtensionXml(signature: ZatcaSignatureResult | null | undefined) {
  if (!signature?.available || !signature.xml.trim()) {
    return "";
  }

  return `
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
${signature.xml}
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  `.trim();
}

export function buildZatcaUblXml(params: {
  document: ZatcaDocumentInput;
  invoiceHashBase64: string;
  icv: number;
  signature?: ZatcaSignatureResult | null;
}) {
  const root = rootName(params.document.documentKind);
  const lines = params.document.lines.map((line, index) => lineXml(line, index, params.document.currency, root)).join("\n");
  const additionalReferences = additionalReferenceXml(params.document, params.invoiceHashBase64, params.icv);
  const billingReference = billingReferenceXml(params.document);
  const signatureExtension = signatureExtensionXml(params.signature);
  const profile = profileId(params.document.documentKind, params.document.scenario);
  const customization = customizationId(params.document.documentKind, params.document.scenario);
  const issueTime = safeTime(params.document.issueTime);
  const invoiceType = documentTypeCode(params.document.documentKind);

  return `<?xml version="1.0" encoding="UTF-8"?>
<${root} xmlns="urn:oasis:names:specification:ubl:schema:xsd:${root}-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  ${signatureExtension}
  <cbc:CustomizationID>${escapeXml(customization)}</cbc:CustomizationID>
  <cbc:ProfileID>${escapeXml(profile)}</cbc:ProfileID>
  <cbc:ID>${escapeXml(params.document.documentNumber)}</cbc:ID>
  <cbc:UUID>${escapeXml(params.document.invoiceUuid ?? String(params.document.documentId))}</cbc:UUID>
  <cbc:IssueDate>${escapeXml(params.document.issueDate)}</cbc:IssueDate>
  <cbc:IssueTime>${escapeXml(issueTime)}</cbc:IssueTime>
  ${root === "CreditNote" ? "<cbc:CreditNoteTypeCode>381</cbc:CreditNoteTypeCode>" : `<cbc:InvoiceTypeCode name="${params.document.scenario === "simplified" ? "0200000" : "0100000"}">${invoiceType}</cbc:InvoiceTypeCode>`}
  <cbc:DocumentCurrencyCode>${escapeXml(params.document.currency)}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>${escapeXml(params.document.currency)}</cbc:TaxCurrencyCode>
  ${additionalReferences}
  ${billingReference}
  ${supplierPartyXml(params.document.seller)}
  ${customerPartyXml(params.document.buyer)}
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
    <cbc:PaymentDueDate>${escapeXml(params.document.issueDate)}</cbc:PaymentDueDate>
  </cac:PaymentMeans>
  ${taxTotalXml(params.document)}
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${escapeXml(params.document.currency)}">${money(params.document.subtotal)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${escapeXml(params.document.currency)}">${money(params.document.subtotal)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${escapeXml(params.document.currency)}">${money(params.document.grandTotal)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${escapeXml(params.document.currency)}">${money(params.document.grandTotal)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${lines}
</${root}>
`;
}

