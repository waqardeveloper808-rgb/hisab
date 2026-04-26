// Workspace — UBL 2.1 invoice XML foundation.
// Pure-V2 module. Does NOT import any production engine.
//
// Builds a minimal but real UBL 2.1 Invoice XML. This is a foundation, NOT
// a full ZATCA-validated XML — it does not include the cryptographic
// signature block, the embedded XAdES properties, or the cleared/reporting
// envelope. Those require server-side signing and are recorded as blockers.
//
// Schema-aware: the optional `schema` argument is used to (a) decide the
// UBL InvoiceTypeCode and (b) emit a classification comment so downstream
// validators know this is a foundation-only XML, not a fully signed clearance
// payload.

import type { DocumentRecord } from "@/lib/workspace/types";
import type {
  DocumentTemplateSchema,
  ZatcaClassification,
} from "@/lib/workspace/document-template-schemas";

export type SellerInfo = {
  name: string;
  nameAr?: string;
  vatNumber: string;
  registrationNumber?: string;
  addressEn?: string;
};

export type CustomerInfo = {
  name: string;
  nameAr?: string;
  vatNumber?: string;
  city?: string;
  country?: string;
};

const ROOT_ATTRS =
  'xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"' +
  ' xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"' +
  ' xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"';

function escapeXml(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return "";
  const str = String(input);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function money(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  return value.toFixed(2);
}

function invoiceTypeCode(kind: DocumentRecord["kind"]): string {
  // UBL InvoiceTypeCode values per ZATCA / UN/CEFACT D08B:
  //   388 = Tax invoice
  //   381 = Credit note (uses CreditNote root in strict UBL — kept simple here)
  //   383 = Debit note
  //   325 = Proforma invoice
  switch (kind) {
    case "credit_note":
      return "381";
    case "debit_note":
      return "383";
    case "proforma":
      return "325";
    case "quotation":
    case "invoice":
    default:
      return "388";
  }
}

function classificationComment(classification: ZatcaClassification): string {
  switch (classification) {
    case "foundation_only":
      return "ZATCA-CLASSIFICATION: foundation_only — no XAdES signature, no cleared envelope, totals reconcile with PDF/preview.";
    case "informational_only":
      return "ZATCA-CLASSIFICATION: informational_only — not for clearance; informational use.";
    case "not_applicable":
    default:
      return "ZATCA-CLASSIFICATION: not_applicable — exported for reference only.";
  }
}

export function buildInvoiceUbl(
  doc: DocumentRecord,
  seller: SellerInfo,
  customer: CustomerInfo,
  schema?: DocumentTemplateSchema,
): string {
  const issueDate = doc.issueDate.slice(0, 10);
  const dueDate = doc.dueDate.slice(0, 10);
  const currency = doc.currency || "SAR";
  const taxablePerLine = doc.lines.map(
    (line) => line.quantity * line.unitPrice,
  );
  const taxable = taxablePerLine.reduce((sum, value) => sum + value, 0);
  const vatAmountTotal = doc.lines.reduce(
    (sum, line, index) =>
      sum + taxablePerLine[index] * (line.vatRate ?? 0.15),
    0,
  );

  const lineXml = doc.lines
    .map((line, index) => {
      const lineExtension = taxablePerLine[index];
      const lineVat = lineExtension * (line.vatRate ?? 0.15);
      const ratePct = ((line.vatRate ?? 0.15) * 100).toFixed(0);
      return `    <cac:InvoiceLine>
      <cbc:ID>${index + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="EA">${money(line.quantity)}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${currency}">${money(lineExtension)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${currency}">${money(lineVat)}</cbc:TaxAmount>
        <cbc:RoundingAmount currencyID="${currency}">${money(lineExtension + lineVat)}</cbc:RoundingAmount>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Name>${escapeXml(line.description)}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>S</cbc:ID>
          <cbc:Percent>${ratePct}</cbc:Percent>
          <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${currency}">${money(line.unitPrice)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`;
    })
    .join("\n");

  const classification: ZatcaClassification = schema?.zatcaClassification ?? "foundation_only";

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${classificationComment(classification)} -->
<Invoice ${ROOT_ATTRS}>
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${escapeXml(doc.number)}</cbc:ID>
  <cbc:UUID>${escapeXml(doc.id)}</cbc:UUID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:IssueTime>00:00:00</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="0100000">${invoiceTypeCode(doc.kind)}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>${currency}</cbc:TaxCurrencyCode>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${escapeXml(seller.registrationNumber ?? "")}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName><cbc:Name>${escapeXml(seller.name)}</cbc:Name></cac:PartyName>
      ${seller.nameAr ? `<cac:PartyName><cbc:Name languageID="ar">${escapeXml(seller.nameAr)}</cbc:Name></cac:PartyName>` : ""}
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(seller.addressEn ?? "")}</cbc:StreetName>
        <cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(seller.vatNumber)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${escapeXml(customer.name)}</cbc:Name></cac:PartyName>
      ${customer.nameAr ? `<cac:PartyName><cbc:Name languageID="ar">${escapeXml(customer.nameAr)}</cbc:Name></cac:PartyName>` : ""}
      <cac:PostalAddress>
        <cbc:CityName>${escapeXml(customer.city ?? "")}</cbc:CityName>
        <cac:Country><cbc:IdentificationCode>${escapeXml(customer.country ?? "SA")}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      ${
        customer.vatNumber
          ? `<cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(customer.vatNumber)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>`
          : ""
      }
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
    <cbc:PaymentDueDate>${dueDate}</cbc:PaymentDueDate>
  </cac:PaymentMeans>

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${money(vatAmountTotal)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${money(taxable)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${money(vatAmountTotal)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>15</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${money(taxable)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${currency}">${money(taxable)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${money(taxable + vatAmountTotal)}</cbc:TaxInclusiveAmount>
    <cbc:PrepaidAmount currencyID="${currency}">${money(Math.max(0, (taxable + vatAmountTotal) - doc.balance))}</cbc:PrepaidAmount>
    <cbc:PayableAmount currencyID="${currency}">${money(Math.min(doc.balance, taxable + vatAmountTotal))}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

${lineXml}
</Invoice>
`;
}
