import type { DocumentRenderModel } from "@/lib/document-engine/types";
import type { TaxInvoiceSaudiStandardContract } from "@/lib/document-engine/contracts/taxInvoiceSaudiStandardContract";

function text(value: unknown, fallback = "-"): string {
  if (typeof value === "string") {
    const v = value.trim();
    return v.length ? v : fallback;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return fallback;
}

function num(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function businessDate(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-CA");
}

function buildQrPayload(model: DocumentRenderModel): string {
  const seller = text(model.company.englishName || model.company.tradeName || model.company.legalName, "");
  const vat = text(model.company.vatNumber, "");
  const issueIso = model.invoice.issueDate ? new Date(model.invoice.issueDate).toISOString() : "";
  const total = model.invoice.grandTotal.toFixed(2);
  const vatTotal = model.invoice.vatTotal.toFixed(2);

  // Layout/render hook only. Full Phase 2 TLV/XAdES signing stays in backend compliance service.
  return [seller, vat, issueIso, total, vatTotal].join("|");
}

export function mapInvoiceToSaudiStandard(
  model: DocumentRenderModel,
): TaxInvoiceSaudiStandardContract {
  const custom = model.customFields ?? {};

  return {
    seller: {
      companyNameEn: text(model.company.englishName || model.company.tradeName || model.company.legalName),
      companyNameAr: text(model.company.arabicName || model.company.legalName),
      addressEn: text(model.company.addressEn),
      addressAr: text(model.company.addressAr),
      email: text(model.company.email, ""),
      vatNumber: text(model.company.vatNumber),
      crNumber: text(model.company.crNumber),
      logoUrl: model.company.logoUrl ?? null,
      nationalAddressLineEn: text(
        custom.seller_national_address_en ??
          model.company.addressEn ??
          "-",
      ),
      nationalAddressLineAr: text(
        custom.seller_national_address_ar ??
          model.company.addressAr ??
          "-",
      ),
    },
    buyer: {
      customerName: text(model.customer.name),
      customerNameAr: text(custom.buyer_name_ar, ""),
      addressEn: text(model.customer.address),
      addressAr: text(custom.buyer_address_ar, ""),
      vatNumber: text(model.customer.vatNumber),
    },
    document: {
      invoiceNumber: text(model.invoice.number),
      issueDate: businessDate(model.invoice.issueDate),
      supplyDate: businessDate(model.invoice.supplyDate),
      dueDate: businessDate(model.invoice.dueDate),
      reference: text(model.document.referenceValue, "-"),
      orderNumber: text(custom.order_number, "-"),
      currency: text(model.invoice.currency, "SAR"),
      qrCodeData: buildQrPayload(model),
      pageNumber: 1,
      totalPages: 1,
    },
    lines: model.invoice.lines.map((line, index) => ({
      lineNo: index + 1,
      descriptionEn: text(line.description),
      descriptionAr: text(line.descriptionAr, ""),
      qty: num(line.quantity),
      unitPrice: num(line.unitPrice),
      taxableAmount: num(line.taxableAmount ?? line.unitPrice * line.quantity),
      vatRate: num(model.invoice.vatRate),
      vatAmount: num(line.vatAmount ?? 0),
      lineAmount: num(line.total),
    })),
    totals: {
      subtotal: num(model.invoice.subtotal),
      vatTotal: num(model.invoice.vatTotal),
      grandTotal: num(model.invoice.grandTotal),
    },
    compliance: {
      qrComplianceNoteEn:
        "This QR code is encoded as per ZATCA e-invoicing requirements.",
      qrComplianceNoteAr:
        "تم ترميز هذا الرمز وفقًا لمتطلبات هيئة الزكاة والضريبة والجمارك للفوترة الإلكترونية.",
      pdfStandardHook: "pdf-a4-saudi-tax-invoice",
      xmlHook: "zatca-phase2-ubl-xml",
      zatcaPhase2Hook: "zatca-phase2-tax-invoice",
    },
    editor: {
      logoUpload: true,
      stampUpload: true,
      signatureUpload: true,
      fieldVisibility: {
        buyerVatNumber: true,
        buyerAddress: true,
        reference: true,
        orderNumber: true,
        supplyDate: true,
        nationalAddress: true,
        stamp: true,
        signature: true,
        labelsBilingual: true,
      },
      stampUrl: typeof custom.stamp_url === "string" ? custom.stamp_url : null,
      signatureUrl:
        typeof custom.signature_url === "string" ? custom.signature_url : null,
    },
  };
}
