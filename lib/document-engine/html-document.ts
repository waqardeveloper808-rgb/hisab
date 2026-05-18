import { ARABIC_FONT_STACK_LITERAL } from "@/lib/workspace/arabic-font-stack";
import { renderCompactDocument } from "@/lib/document-engine/renderers/renderCompactDocument";
import { compactDocumentCss } from "@/lib/document-engine/styles/compact-document-inline";
import { complianceAllowsPhase1Qr } from "@/lib/document-engine/zatca-qr-eligibility";
import { buildZatcaQrPayload } from "@/lib/document-engine/zatca-qr-payload";
import { mainLogoPath } from "@/lib/brand";
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
    proforma_invoice: { en: "Proforma Invoice", ar: "فاتورة أولية" },
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
    const val = textValue(custom.source_invoice_number);
    if (!val) return null;
    return {
      en: "Source Invoice",
      ar: "الفاتورة المرجعية",
      value: val,
    };
  }

  if (type === "quotation") {
    const val = textValue(custom.reference);
    if (!val) return null;
    return {
      en: "Reference",
      ar: "المرجع",
      value: val,
    };
  }

  if (type === "proforma_invoice") {
    const val = textValue(custom.reference);
    if (!val) return null;
    return {
      en: "Quotation Ref",
      ar: "مرجع عرض السعر",
      value: val,
    };
  }

  if (type === "tax_invoice") {
    const ref = textValue(custom.reference ?? custom.linked_invoice_number ?? "");
    if (ref) {
      return {
        en: "Reference",
        ar: "المرجع",
        value: ref,
      };
    }
  }

  return null;
}

/** Only when the user supplies explicit wording (no auto-generated amount-in-words on tax/credit/debit). */
function resolveAmountInWords(custom: Record<string, string | number | boolean | null>): { en: string; ar: string } | null {
  const en = textValue(custom.amount_in_words_en, "");
  const ar = textValue(custom.amount_in_words_ar, "");
  if (en.trim() || ar.trim()) {
    return { en: en.trim(), ar: ar.trim() };
  }
  return null;
}

function resolveFooterNote(
  custom: Record<string, string | number | boolean | null>,
): { en: string; ar: string } | null {
  const en = textValue(custom.footer_note_en, "");
  const ar = textValue(custom.footer_note_ar, "");
  if (!en.trim() && !ar.trim()) return null;
  return { en: en.trim(), ar: ar.trim() };
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

function boolFromCustom(custom: Record<string, string | number | boolean | null>, key: string, fallback: boolean) {
  const raw = custom[key];
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "no") return false;
  }
  if (typeof raw === "number") return raw !== 0;
  return fallback;
}

function resolveIssueTime(issueDate: string, custom: Record<string, string | number | boolean | null>) {
  const t = textValue(custom.issue_time ?? custom.issueTime ?? "");
  if (t) return t;
  if (issueDate.includes("T")) {
    const d = new Date(issueDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
    }
  }
  return "";
}

function pickZatcaCompliance(
  custom: Record<string, string | number | boolean | null>,
  complianceRoot: Record<string, unknown> | null | undefined,
) {
  const root = complianceRoot ?? {};
  const nested =
    root.zatca && typeof root.zatca === "object" ? (root.zatca as Record<string, unknown>) : {};
  const nestedUuid = typeof nested.uuid === "string" ? nested.uuid : "";
  const nestedInv = typeof nested.invoice_hash === "string" ? nested.invoice_hash : "";
  const nestedPrev = typeof nested.previous_invoice_hash === "string" ? nested.previous_invoice_hash : "";
  const rootUuid = typeof root.icv_uuid === "string" ? root.icv_uuid : "";
  const rootHash = typeof root.icv_hash === "string" ? root.icv_hash : "";
  return {
    uuid: textValue(custom.zatca_uuid, textValue(custom.icv_uuid, textValue(nestedUuid, rootUuid))),
    invoiceHash: textValue(custom.zatca_invoice_hash, textValue(nestedInv, rootHash)),
    previousInvoiceHash: textValue(custom.zatca_previous_invoice_hash, nestedPrev),
  };
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
  const phase1QrCompliance = complianceAllowsPhase1Qr(kind, custom);

  const lines = input.document.lines.map((line, index) => {
    const lineSubtotal = numberValue(line.grossAmount, numberValue(line.quantity) * numberValue(line.unitPrice));
    const lineVatAmount =
      input.document.taxableTotal > 0 ? (lineSubtotal / input.document.taxableTotal) * input.document.taxTotal : 0;
    const discountRaw = line.metadata?.custom_fields?.discount ?? line.metadata?.custom_fields?.line_discount;
    const discountAmount = Math.abs(numberValue(discountRaw, 0));

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
      discountAmount,
      unitLabel: textValue(line.metadata?.custom_fields?.unit ?? line.metadata?.custom_fields?.unit_label, ""),
    };
  });

  const subtitleBadgeEn = textValue(custom.subtitle_badge_en, textValue(custom.document_copy_en, "ORIGINAL"));
  const subtitleBadgeAr = textValue(custom.subtitle_badge_ar, textValue(custom.document_copy_ar, "نسخة أصلية"));

  const complianceMeta = input.document.compliance_metadata as Record<string, unknown> | null | undefined;
  const zFields = pickZatcaCompliance(custom, complianceMeta);

  const notesRaw =
    typeof input.document.notes === "string" && input.document.notes.trim()
      ? input.document.notes.trim()
      : "";
  const notesMerged = notesRaw || textValue(custom.document_notes ?? custom.notes, "");

  const amountInWords = resolveAmountInWords(custom);
  const footerNote = resolveFooterNote(custom);

  const draft: DocumentRenderModel = {
    customFields: custom,
    notes: notesMerged.trim() ? notesMerged.trim() : null,
    amountInWords,
    footerNote,
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
      showQr: phase1QrCompliance,
      showVatPercentColumn: boolFromCustom(custom, "show_vat_percent_column", false),
      showUnitColumn: boolFromCustom(custom, "show_unit_column", false),
      subtitleBadgeEn,
      subtitleBadgeAr,
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
      defaultBrandLogoPath: mainLogoPath,
    },
    customer: {
      name: textValue(custom.buyer_name_en, contact?.displayName || "-"),
      nameAr: textValue(custom.buyer_name_ar, contact?.displayNameAr || ""),
      address: textValue(custom.buyer_address_en, contact?.billingAddress?.line1 || contact?.billingAddress?.city || "-"),
      addressAr: textValue(custom.buyer_address_ar, contact?.billingAddress?.line1Ar || ""),
      vatNumber: textValue(custom.buyer_vat_number, contact?.vatNumber || "-"),
      contact: textValue(custom.buyer_phone, contact?.phone || "-"),
    },
    invoice: {
      number: input.document.documentNumber,
      issueDate: input.document.issueDate,
      issueTime: resolveIssueTime(input.document.issueDate, custom),
      supplyDate: input.document.supplyDate || input.document.issueDate,
      dueDate: input.document.dueDate,
      currency,
      vatRate: Number(vatRate.toFixed(2)),
      subtotal: Number(input.document.taxableTotal.toFixed(2)),
      vatTotal: Number(input.document.taxTotal.toFixed(2)),
      grandTotal: Number(input.document.grandTotal.toFixed(2)),
      lines,
    },
    zatca: null,
  };

  if (phase1QrCompliance && ["tax_invoice", "credit_note", "debit_note"].includes(kind)) {
    return {
      ...draft,
      zatca: {
        enabled: true,
        qrPayload: buildZatcaQrPayload(draft),
        uuid: zFields.uuid,
        invoiceHash: zFields.invoiceHash,
        previousInvoiceHash: zFields.previousInvoiceHash,
      },
    };
  }

  return draft;
}

export function buildDocumentHtml(model: DocumentRenderModel) {
  return renderCompactDocument(model);
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
        font-family: ${ARABIC_FONT_STACK_LITERAL};
        line-height: 1.45;
        font-size: 12px;
      }
      .cd-document-page {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 16px;
        background: #f5f5f5;
      }
      .cd-document-page > .cd-document-root {
        box-shadow: 0 2px 12px rgba(0,0,0,.08);
        min-height: 297mm;
      }
      @page { size: A4 portrait; margin: 10mm; }
      @media print {
        body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .cd-document-page { padding: 0 !important; background: #fff !important; }
        .cd-document-page > .cd-document-root { box-shadow: none !important; }
      }
      ${compactDocumentCss}
    </style>
  </head>
  <body>
    <div class="cd-document-page">${bodyHtml}</div>
  </body>
</html>`;
}

export function isFullHtmlDocument(html: string) {
  const t = html.trim();
  if (!t) return false;
  return /^<!doctype/i.test(t) || /^<html[\s>]/i.test(t);
}
