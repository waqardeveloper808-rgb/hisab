import { previewCompany } from "@/data/preview-company";
import {
  buildDocumentHtml,
  buildInvoiceRenderModel,
  buildPrintableDocumentShell,
} from "@/lib/document-engine/html-document";
import { enrichTaxInvoiceCompactWithPhase1Qr } from "@/lib/document-engine/enrich-tax-invoice-qr-server";
import type { CompanyAssetLike, ContactLike, DocumentLike } from "@/lib/document-engine/types";
import type {
  GuestPreviewContact,
  GuestPreviewDocument,
  GuestPreviewTemplate,
} from "@/lib/document-engine/workspace-v2-guest-pdf-types";

function guestLines(document: GuestPreviewDocument): DocumentLike["lines"] {
  return (document.lines ?? []).map((line) => ({
    id: line.id,
    description: line.description,
    quantity: line.quantity,
    unitPrice: line.unit_price,
    grossAmount: line.gross_amount,
    metadata: line.metadata ?? null,
  }));
}

function guestToContact(contact: GuestPreviewContact | null): ContactLike | null {
  if (!contact) return null;
  return {
    displayName: contact.display_name,
    displayNameAr: contact.display_name_ar ?? null,
    vatNumber: contact.vat_number ?? null,
    phone: contact.phone ?? null,
    billingAddress: contact.billing_address
      ? {
          line1: contact.billing_address.line_1 ?? null,
          line1Ar: contact.billing_address.line_1_ar ?? null,
          city: contact.billing_address.city ?? null,
        }
      : null,
  };
}

export async function buildGuestCompactPrintHtml(params: {
  document: GuestPreviewDocument;
  template?: GuestPreviewTemplate;
  contact?: GuestPreviewContact | null;
}): Promise<string> {
  const { document, template } = params;
  const contact = guestToContact(params.contact ?? null);

  const logoUrl = template?.logo_asset?.public_url?.trim() ?? "";
  const assets: CompanyAssetLike[] = logoUrl
    ? [{ id: Number(template?.logo_asset?.id ?? 0), publicUrl: logoUrl, isActive: true, usage: "logo" }]
    : [];

  const docLike: DocumentLike = {
    id: document.id,
    type: document.type,
    documentNumber: document.document_number,
    issueDate: document.issue_date,
    dueDate: document.due_date,
    supplyDate: document.supply_date ?? null,
    taxableTotal: document.taxable_total,
    taxTotal: document.tax_total,
    grandTotal: document.grand_total,
    notes: document.notes ?? null,
    compliance_metadata: document.compliance_metadata ?? null,
    customFields: document.custom_fields ?? {},
    lines: guestLines(document),
  };

  const company = {
    legalName: previewCompany.sellerName,
    tradeName: previewCompany.sellerName,
    englishName: previewCompany.sellerName,
    arabicName: previewCompany.sellerNameAr,
    taxNumber: previewCompany.vatNumber,
    registrationNumber: previewCompany.registrationNumber,
    email: previewCompany.sellerEmail,
    phone: previewCompany.sellerPhone,
    shortAddress: previewCompany.sellerAddressEn,
    addressStreet: "",
    addressArea: "",
    addressCity: "",
    addressPostalCode: "",
    addressAdditionalNumber: "",
    addressCountry: "Saudi Arabia",
    baseCurrency: previewCompany.currency,
    logoUrl: logoUrl || null,
  };

  let model = buildInvoiceRenderModel({
    company,
    assets,
    document: docLike,
    contact,
  });

  model = await enrichTaxInvoiceCompactWithPhase1Qr(model);

  return buildPrintableDocumentShell(buildDocumentHtml(model));
}
