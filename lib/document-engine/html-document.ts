import { InvoiceTemplate } from "@/lib/document-engine/InvoiceTemplate";
import { mapInvoiceToSaudiStandard } from "@/lib/document-engine/mappers/mapInvoiceToSaudiStandard";
import { renderTaxInvoiceSaudiStandard } from "@/lib/document-engine/renderers/renderTaxInvoiceSaudiStandard";
import { taxInvoiceSaudiStandardCss } from "@/lib/document-engine/styles/tax-invoice-saudi-standard-inline";
import type {
  CompanyAssetLike,
  CompanyProfileSnapshot,
  ContactLike,
  DocumentLike,
  DocumentRenderModel,
} from "@/lib/document-engine/types";

function getDocumentTitlePair(type: string) {
  return {
    tax_invoice: { en: "Tax Invoice", ar: "فاتورة ضريبية" },
    quotation: { en: "Quotation", ar: "عرض سعر" },
    proforma_invoice: { en: "Proforma Invoice", ar: "فاتورة مبدئية" },
    credit_note: { en: "Credit Note", ar: "إشعار دائن" },
    debit_note: { en: "Debit Note", ar: "إشعار مدين" },
    delivery_note: { en: "Delivery Note", ar: "إشعار تسليم" },
    vendor_bill: { en: "Vendor Bill", ar: "فاتورة مورد" },
    purchase_invoice: { en: "Purchase Invoice", ar: "فاتورة شراء" },
    purchase_order: { en: "Purchase Order", ar: "أمر شراء" },
    purchase_credit_note: { en: "Purchase Credit Note", ar: "إشعار دائن مشتريات" },
  }[type] ?? { en: type.replaceAll("_", " "), ar: type.replaceAll("_", " ") };
}

function getDocumentNumberLabel(type: string) {
  return {
    tax_invoice: { en: "Invoice Number", ar: "رقم الفاتورة" },
    quotation: { en: "Quotation Number", ar: "رقم عرض السعر" },
    proforma_invoice: { en: "Proforma Number", ar: "رقم الفاتورة المبدئية" },
    credit_note: { en: "Credit Note Number", ar: "رقم إشعار الدائن" },
    debit_note: { en: "Debit Note Number", ar: "رقم إشعار المدين" },
    delivery_note: { en: "Delivery Note Number", ar: "رقم إشعار التسليم" },
    vendor_bill: { en: "Bill Number", ar: "رقم الفاتورة" },
    purchase_invoice: { en: "Invoice Number", ar: "رقم الفاتورة" },
    purchase_order: { en: "PO Number", ar: "رقم أمر الشراء" },
    purchase_credit_note: { en: "Credit Note Number", ar: "رقم إشعار الدائن" },
  }[type] ?? { en: "Document Number", ar: "رقم المستند" };
}

function getDocumentPartyLabel(type: string) {
  const isPurchase = ["vendor_bill", "purchase_invoice", "purchase_order", "purchase_credit_note"].includes(type);
  return isPurchase ? { en: "Vendor", ar: "المورد" } : { en: "Customer", ar: "العميل" };
}

function getDocumentReferenceLabel(type: string, custom: Record<string, string | number | boolean | null>) {
  if (type === "credit_note" || type === "debit_note") {
    return {
      en: "Source Invoice",
      ar: "الفاتورة المرجعية",
      value: textValue(custom.source_invoice_number),
    };
  }

  if (type === "quotation") {
    return {
      en: "Reference",
      ar: "المرجع",
      value: textValue(custom.reference),
    };
  }

  if (type === "proforma_invoice") {
    return {
      en: "Quotation Ref",
      ar: "مرجع عرض السعر",
      value: textValue(custom.reference),
    };
  }

  return null;
}

const fallbackCompany: CompanyProfileSnapshot = {
  legalName: "",
  tradeName: "",
  englishName: "",
  arabicName: "",
  taxNumber: "",
  registrationNumber: "",
  email: "",
  phone: "",
  shortAddress: "",
  addressStreet: "",
  addressArea: "",
  addressCity: "",
  addressPostalCode: "",
  addressAdditionalNumber: "",
  addressCountry: "Saudi Arabia",
  baseCurrency: "SAR",
  logoUrl: null,
};

function textValue(value: string | number | boolean | null | undefined, fallback = "") {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return fallback;
}

function numberValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function buildEnglishAddress(company: CompanyProfileSnapshot) {
  const parts = [company.addressStreet, company.addressArea, company.addressCity, company.addressPostalCode, company.addressCountry]
    .map((value) => value.trim())
    .filter(Boolean);
  return parts.join(", ") || company.shortAddress || "-";
}

function buildArabicAddress(company: CompanyProfileSnapshot) {
  return company.shortAddress || buildEnglishAddress(company);
}

function findCompanyLogoUrl(assets: CompanyAssetLike[], company?: Partial<CompanyProfileSnapshot> | null) {
  if (typeof company?.logoUrl === "string" && company.logoUrl.trim()) {
    return company.logoUrl.trim();
  }

  return assets.find((asset) => asset.isActive && (asset.usage ?? "").toLowerCase() === "logo")?.publicUrl ?? null;
}

export function buildInvoiceRenderModel(input: {
  company?: Partial<CompanyProfileSnapshot> | null;
  assets?: CompanyAssetLike[];
  document: DocumentLike;
  contact?: ContactLike | null;
}) {
  const company = { ...fallbackCompany, ...(input.company ?? {}) };
  const custom = input.document.customFields ?? {};
  const contact = input.contact;
  const kind = input.document.type;
  const currency = textValue(custom.currency, company.baseCurrency || "SAR");
  const vatRate = numberValue(custom.vat_rate ?? custom.vatRate, input.document.taxableTotal > 0 ? (input.document.taxTotal / input.document.taxableTotal) * 100 : 15);
  const logoUrl = findCompanyLogoUrl(input.assets ?? [], company);
  const title = getDocumentTitlePair(kind);
  const numberLabel = getDocumentNumberLabel(kind);
  const partyLabel = getDocumentPartyLabel(kind);
  const reference = getDocumentReferenceLabel(kind, custom);
  const showVat = !["delivery_note", "purchase_order"].includes(kind);
  const showQr = ["tax_invoice", "credit_note", "debit_note"].includes(kind);

  const lines = input.document.lines.map((line, index) => {
    const lineSubtotal = numberValue(line.grossAmount, numberValue(line.quantity) * numberValue(line.unitPrice));
    const lineVatAmount = input.document.taxableTotal > 0
      ? (lineSubtotal / input.document.taxableTotal) * input.document.taxTotal
      : 0;

    return {
      id: line.id,
      sequence: index + 1,
      description: line.description,
      descriptionAr: textValue(line.metadata?.custom_fields?.description_ar),
      quantity: numberValue(line.quantity),
      unitPrice: numberValue(line.unitPrice),
      taxableAmount: Number(lineSubtotal.toFixed(2)),
      vatAmount: Number(lineVatAmount.toFixed(2)),
      vatLabel: `${vatRate.toFixed(0)}%`,
      total: Number((lineSubtotal + lineVatAmount).toFixed(2)),
    };
  });

  const model: DocumentRenderModel = {
    customFields: custom,
    document: {
      kind,
      titleEn: title.en,
      titleAr: title.ar,
      numberLabelEn: numberLabel.en,
      numberLabelAr: numberLabel.ar,
      partyLabelEn: partyLabel.en,
      partyLabelAr: partyLabel.ar,
      showVatColumn: showVat,
      showVatTotals: showVat,
      showQr,
      referenceLabelEn: reference?.en,
      referenceLabelAr: reference?.ar,
      referenceValue: reference?.value,
    },
    company: {
      legalName: company.legalName,
      tradeName: company.tradeName,
      englishName: textValue(custom.seller_name_en, company.englishName || company.tradeName || company.legalName),
      arabicName: textValue(custom.seller_name_ar, company.arabicName || company.legalName),
      vatNumber: textValue(custom.seller_vat_number, company.taxNumber),
      crNumber: textValue(custom.seller_cr_number, company.registrationNumber),
      email: textValue(custom.seller_email, company.email),
      phone: textValue(custom.seller_phone, company.phone),
      addressEn: textValue(custom.seller_address_en, buildEnglishAddress(company)),
      addressAr: textValue(custom.seller_address_ar, buildArabicAddress(company)),
      logoUrl,
    },
    customer: {
      name: textValue(custom.buyer_name_en, contact?.displayName || "-"),
      address: textValue(custom.buyer_address_en, contact?.billingAddress?.line1 || contact?.billingAddress?.city || "-"),
      vatNumber: textValue(custom.buyer_vat_number, contact?.vatNumber || "-"),
      contact: textValue(custom.buyer_phone, contact?.phone || "-"),
    },
    invoice: {
      number: input.document.documentNumber,
      issueDate: input.document.issueDate,
      supplyDate: input.document.supplyDate || input.document.issueDate,
      dueDate: input.document.dueDate,
      currency,
      vatRate: Number(vatRate.toFixed(2)),
      subtotal: Number(input.document.taxableTotal.toFixed(2)),
      vatTotal: Number(input.document.taxTotal.toFixed(2)),
      grandTotal: Number(input.document.grandTotal.toFixed(2)),
      lines,
    },
  };

  return model;
}

export function buildDocumentHtml(model: DocumentRenderModel) {
  if (model.document.kind === "tax_invoice") {
    const contract = mapInvoiceToSaudiStandard(model);
    return renderTaxInvoiceSaudiStandard(contract);
  }

  return InvoiceTemplate({ model });
}

export function buildPrintableDocumentShell(bodyHtml: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Document</title>
    <style>
      html, body { margin: 0; padding: 0; }
      body {
        background: #f5f5f5;
        color: #172226;
        font-family: "Noto Sans Arabic", "IBM Plex Sans Arabic", "Segoe UI", Tahoma, "Helvetica Neue", sans-serif;
        line-height: 1.45;
        font-size: 12px;
      }
      .gh-document-page {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 20px;
        background: #f5f5f5;
      }
      .gh-document-page > article {
        width: 210mm;
        min-height: 297mm;
        background: #ffffff;
        box-shadow: 0 2px 12px rgba(0,0,0,.08);
      }
      ${taxInvoiceSaudiStandardCss}
    </style>
  </head>
  <body>
    <div class="gh-document-page">${bodyHtml}</div>
  </body>
</html>`;
}

export function isFullHtmlDocument(html: string) {
  const t = html.trim();
  if (!t) return false;
  return /^<!doctype/i.test(t) || /^<html[\s>]/i.test(t);
}
