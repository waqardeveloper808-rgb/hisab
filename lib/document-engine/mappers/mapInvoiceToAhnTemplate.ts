import type { TaxInvoiceAhnContract } from "@/lib/document-engine/contracts/taxInvoiceAhnContract";
import type { DocumentRenderModel } from "@/lib/document-engine/types";

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function asText(value: unknown, fallback = "") {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function normalizeDate(value: string) {
  if (!value) {
    return "";
  }

  const normalized = value.includes("T") ? value : `${value}T00:00:00`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function mapInvoiceToAhnTemplate(model: DocumentRenderModel): TaxInvoiceAhnContract {
  const custom = model.customFields ?? {};

  const contract: TaxInvoiceAhnContract = {
    seller: {
      companyNameEn: asText(custom.seller_name_en, model.company.englishName || model.company.tradeName || model.company.legalName),
      companyNameAr: asText(custom.seller_name_ar, model.company.arabicName || model.company.legalName),
      addressEn: asText(custom.seller_address_en, model.company.addressEn || "-"),
      addressAr: asText(custom.seller_address_ar, model.company.addressAr || "-"),
      email: asText(custom.seller_email, model.company.email),
      vatNumber: asText(custom.seller_vat_number, model.company.vatNumber),
      crNumber: asText(custom.seller_cr_number, model.company.crNumber),
      logoUrl: model.company.logoUrl,
      nationalAddress: {
        buildingNumber: asText(custom.seller_national_address_building_number),
        street: asText(custom.seller_national_address_street),
        district: asText(custom.seller_national_address_district),
        city: asText(custom.seller_national_address_city),
        postalCode: asText(custom.seller_national_address_postal_code),
        additionalNumber: asText(custom.seller_national_address_additional_number),
        country: asText(custom.seller_national_address_country, "Saudi Arabia"),
      },
    },
    buyer: {
      customerNameEnOrMain: asText(custom.buyer_name_en, model.customer.name),
      customerNameAr: asText(custom.buyer_name_ar),
      addressEn: asText(custom.buyer_address_en, model.customer.address),
      addressAr: asText(custom.buyer_address_ar),
      vatNumber: asText(custom.buyer_vat_number, model.customer.vatNumber),
    },
    document: {
      invoiceNumber: asText(model.invoice.number, "-"),
      issueDate: normalizeDate(model.invoice.issueDate),
      dueDate: normalizeDate(model.invoice.dueDate),
      reference: asText(custom.reference, model.document.referenceValue || ""),
      orderNumber: asText(custom.order_number),
      currency: asText(model.invoice.currency, "SAR"),
      qrCodeData: asText(custom.qr_code_data, `${model.invoice.number}|${model.company.vatNumber}|${model.invoice.grandTotal}`),
      pageNumber: asNumber(custom.page_number, 1),
      totalPages: asNumber(custom.total_pages, 1),
    },
    lines: model.invoice.lines.map((line, index) => {
      const vatFallback = line.vatAmount ?? 0;
      const taxableAmount = asNumber(line.taxableAmount, line.total - vatFallback);
      const vatAmount = asNumber(line.vatAmount, Math.max(0, line.total - taxableAmount));
      const vatRate = taxableAmount > 0 ? (vatAmount / taxableAmount) * 100 : model.invoice.vatRate;

      return {
        lineNo: index + 1,
        descriptionEn: asText(line.description, "-"),
        descriptionAr: asText(line.descriptionAr),
        qty: asNumber(line.quantity),
        unitPrice: asNumber(line.unitPrice),
        taxableAmount,
        vatRate,
        vatAmount,
        lineAmount: asNumber(line.total),
      };
    }),
    totals: {
      subtotal: asNumber(model.invoice.subtotal),
      vatTotal: asNumber(model.invoice.vatTotal),
      grandTotal: asNumber(model.invoice.grandTotal),
    },
    metadata: {
      notes: asText(custom.notes, ""),
      complianceFooter: asText(custom.compliance_footer, "This invoice is generated in compliance with Saudi VAT and ZATCA invoice requirements."),
      zatcaQrNote: asText(custom.zatca_qr_note, "Scan the QR code for ZATCA-compliant invoice verification data."),
      stampUrl: asText(custom.stamp_url) || null,
      signatureUrl: asText(custom.signature_url) || null,
      labels: {
        seller: asText(custom.label_seller),
        customer: asText(custom.label_customer),
        address: asText(custom.label_address),
        vatNumber: asText(custom.label_vat_number),
        invoiceNumber: asText(custom.label_invoice_number),
        issueDate: asText(custom.label_issue_date),
        dueDate: asText(custom.label_due_date),
        reference: asText(custom.label_reference),
        orderNumber: asText(custom.label_order_number),
        subtotal: asText(custom.label_subtotal),
        vatTotal: asText(custom.label_vat_total),
        grandTotal: asText(custom.label_grand_total),
      },
      fieldVisibility: {
        reference: String(custom.show_reference ?? "true") !== "false",
        orderNumber: String(custom.show_order_number ?? "true") !== "false",
        buyerVatNumber: String(custom.show_buyer_vat ?? "true") !== "false",
        buyerAddress: String(custom.show_buyer_address ?? "true") !== "false",
        buyerArabicName: String(custom.show_buyer_arabic_name ?? "true") !== "false",
        notes: String(custom.show_notes ?? "true") !== "false",
        stamp: String(custom.show_stamp ?? "true") !== "false",
        signature: String(custom.show_signature ?? "true") !== "false",
      },
      hooks: {
        logoUpload: true,
        stampUpload: true,
        signatureUpload: true,
        previewMatchesPdf: true,
        xmlHookAvailable: true,
        qrHookAvailable: true,
      },
    },
  };

  return contract;
}
