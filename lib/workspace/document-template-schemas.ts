// Workspace — master document template schema (Wafeq Format 2 baseline).
//
// SINGLE CONTRACT consumed by:
//   1. Browser preview          components/workspace/WorkspaceDocumentRenderer.tsx
//   2. Template Studio canvas   components/workspace/WorkspaceTemplateStudio.tsx
//   3. PDF export               lib/workspace/exports/pdf.ts
//   4. XML export               lib/workspace/exports/xml.ts
//
// All 8 derived document templates inherit from MASTER_TAX_INVOICE. Layout,
// section dimensions, customer/document info rows, items columns and QR rules
// live ONLY here — they MUST NOT be redefined elsewhere.
//
// Coordinate system (A4 portrait):
//   PDF page: 595.92 × 841.92 pt
//   CSS page: 794   × 1123    px   (1 px = 0.75 pt)
//   Safe area default: 10mm margins (≈ 37.8px @ 96dpi) unless overridden by
//   template UI. Legacy Wafeq reference used 48px left — supersedes to 10mm A4.
//
//   bottom limit derived from 297mm page height minus bottom margin (approx).

import type { DocumentKind } from "./types";

const MM10 = (10 * 96) / 25.4;

// ─── Cross-cutting types ────────────────────────────────────────────────────

export type LangMode = "english" | "arabic" | "bilingual";
export type TemplateStyle = "standard" | "modern" | "compact";

export type SchemaDocType =
  | "tax_invoice"
  | "simplified_tax_invoice"
  | "quotation"
  | "proforma_invoice"
  | "credit_note"
  | "debit_note"
  | "delivery_note"
  | "purchase_order";

export type SectionKey =
  | "header"
  | "title"
  | "customer"
  | "docInfo"
  | "items"
  | "totals"
  | "qr"
  | "stampSignature"
  | "footer";

export type FieldKey =
  // seller
  | "sellerName"
  | "sellerAddress"
  | "sellerEmail"
  | "sellerPhone"
  | "sellerVat"
  | "sellerCr"
  | "sellerLogo"
  // customer
  | "customerName"
  | "customerNameAr"
  | "customerVat"
  | "customerCr"
  | "customerCity"
  | "customerCountry"
  | "customerAddress"
  | "customerEmail"
  | "customerPhone"
  | "customerFax"
  // document meta
  | "docNumber"
  | "issueDate"
  | "supplyDate"
  | "dueDate"
  | "validUntil"
  | "deliveryDate"
  | "expectedDeliveryDate"
  | "deliveryLocation"
  | "deliveryStatus"
  | "originalInvoiceNumber"
  | "originalInvoiceDate"
  | "relatedInvoiceNumber"
  | "relatedProformaNumber"
  | "quotationNumber"
  | "purchaseOrderNumber"
  | "currency"
  | "paymentTerms"
  | "reference"
  | "reason"
  | "amountReceived"
  | "balanceDue"
  | "paymentStatus"
  // totals
  | "subtotal"
  | "discount"
  | "taxableAmount"
  | "totalVat"
  | "grandTotal"
  | "creditTotal"
  | "debitTotal"
  | "paid"
  // footer / signing
  | "stamp"
  | "signature"
  | "receiverName"
  | "receiverSignature"
  | "notes"
  | "terms"
  | "validityNote"
  | "proformaNote"
  | "deliveryTerms"
  | "purchaseTerms"
  | "creditNoteReason"
  | "debitNoteReason"
  | "zatcaNote";

export type ColumnKey =
  | "index"
  | "description"
  | "quantity"
  | "unit"
  | "deliveredQuantity"
  | "pendingQuantity"
  | "remarks"
  | "price"
  | "discount"
  | "taxableAmount"
  | "vatRate"
  | "vatAmount"
  | "lineTotal";

export type Bilingual = { en: string; ar: string };

export type ZatcaClassification =
  | "foundation_only"
  | "not_applicable"
  | "informational_only";

// ─── Page geometry (A4 portrait, Wafeq Format 2) ────────────────────────────

export const PAGE_GEOMETRY = {
  /** PDF page in points. */
  widthPt: 595.92,
  heightPt: 841.92,
  /** CSS page in pixels. */
  widthPx: 794,
  heightPx: 1123,
  /** 1 CSS px = 0.75 PDF pt; 1 pt = 1.3333 px. */
  pxToPt: 0.75,
  ptToPx: 1.3333,
  /** Safe content area in pixels (10mm margins, A4 @ 96dpi). */
  safeMarginLeftPx: MM10,
  safeMarginRightPx: MM10,
  safeMarginTopPx: MM10,
  safeMarginBottomPx: MM10,
  safeWidthPx: 794 - MM10 * 2,
  contentXPx: MM10,
  contentYStartPx: MM10,
  /** Printable bottom Y (px from top) — keep content above. */
  bottomLimitPx: 1123 - MM10,
} as const;

export const TYPOGRAPHY = {
  /** Base document body (+1pt vs 2026-04 baseline). */
  bodyPx: 12,
  labelPx: 10,
  smallPx: 9,
  titleEnPx: 25,
  titleArPx: 21,
  sectionHeadingPx: 11,
  lineHeightBodyPx: 16,
  lineHeightArPx: 18,
  /** Seller / company name in header row (preview + PDF). */
  sellerNamePx: 14,
  /** Info-row / table body (px; PDF pt = px * PAGE_GEOMETRY.pxToPt). */
  infoValuePx: 12,
  infoLabelPx: 11,
  /** Items table body — 1 pt smaller than prior baseline; header row stays 1 pt above body. */
  itemsCellPx: 10,
  itemsHeaderEnPx: 9,
  itemsHeaderArPx: 8,
  qrCaptionPx: 10,
  stampCaptionPx: 10,
  stampMetaPx: 9,
  stampDesignationPx: 9,
} as const;

export const COLORS = {
  ink: "#111827",
  inkSubtle: "#6B7280",
  border: "#D7DDE2",
  borderLight: "#E7ECEF",
  hisabixGreen: "#2FAE2B",
  tableHeaderBg: "#F6FAF4",
  cardBg: "#FFFFFF",
} as const;

export const SPACING = {
  sectionGapPx: 12,
  cardPaddingXPx: 14,
  cardPaddingYPx: 12,
  tableCellPaddingXPx: 6,
  tableCellPaddingYPx: 7,
  cardBorderRadiusPx: 6,
  topAccentPx: 3,
} as const;

// ─── Section + field labels (single source of truth) ────────────────────────

export const SECTION_LABELS: Record<SectionKey, Bilingual> = {
  header: { en: "Header", ar: "الرأس" },
  title: { en: "Document title", ar: "عنوان المستند" },
  customer: { en: "Client company information", ar: "بيانات العميل" },
  docInfo: { en: "Document information", ar: "بيانات المستند" },
  items: { en: "Products / services", ar: "المنتجات والخدمات" },
  totals: { en: "Totals", ar: "الإجماليات" },
  qr: { en: "QR code", ar: "رمز الاستجابة" },
  stampSignature: { en: "Stamp and signature", ar: "الختم والتوقيع" },
  footer: { en: "Footer", ar: "التذييل" },
};

export const FIELD_LABELS: Record<FieldKey, Bilingual> = {
  sellerName: { en: "Seller", ar: "البائع" },
  sellerAddress: { en: "Address", ar: "العنوان" },
  sellerEmail: { en: "Email", ar: "البريد الإلكتروني" },
  sellerPhone: { en: "Phone", ar: "الهاتف" },
  sellerVat: { en: "VAT Number", ar: "الرقم الضريبي" },
  sellerCr: { en: "CR Number", ar: "رقم السجل التجاري" },
  sellerLogo: { en: "Logo", ar: "الشعار" },

  customerName: { en: "Customer", ar: "العميل" },
  customerNameAr: { en: "Customer Arabic Name", ar: "اسم العميل بالعربية" },
  customerVat: { en: "VAT Number", ar: "الرقم الضريبي" },
  customerCr: { en: "CR Number", ar: "رقم السجل التجاري" },
  customerCity: { en: "City", ar: "المدينة" },
  customerCountry: { en: "Country", ar: "الدولة" },
  customerAddress: { en: "Address", ar: "العنوان" },
  customerEmail: { en: "Email", ar: "البريد الإلكتروني" },
  customerPhone: { en: "Phone", ar: "الهاتف" },
  customerFax: { en: "Fax", ar: "الفاكس" },

  docNumber: { en: "Invoice Number", ar: "رقم الفاتورة" },
  issueDate: { en: "Issue Date", ar: "تاريخ الإصدار" },
  supplyDate: { en: "Supply Date", ar: "تاريخ التوريد" },
  dueDate: { en: "Due Date", ar: "تاريخ الاستحقاق" },
  validUntil: { en: "Valid Until", ar: "صالح حتى" },
  deliveryDate: { en: "Delivery Date", ar: "تاريخ التسليم" },
  expectedDeliveryDate: { en: "Expected Delivery Date", ar: "تاريخ التسليم المتوقع" },
  deliveryLocation: { en: "Delivery Location", ar: "موقع التسليم" },
  deliveryStatus: { en: "Delivery Status", ar: "حالة التسليم" },
  originalInvoiceNumber: { en: "Original Invoice Number", ar: "رقم الفاتورة الأصلية" },
  originalInvoiceDate: { en: "Original Invoice Date", ar: "تاريخ الفاتورة الأصلية" },
  relatedInvoiceNumber: { en: "Related Invoice", ar: "الفاتورة المرتبطة" },
  relatedProformaNumber: { en: "Related Proforma", ar: "الفاتورة الأولية المرتبطة" },
  quotationNumber: { en: "Quotation Number", ar: "رقم عرض السعر" },
  purchaseOrderNumber: { en: "PO Number", ar: "رقم أمر الشراء" },
  currency: { en: "Currency", ar: "العملة" },
  paymentTerms: { en: "Payment Terms", ar: "شروط الدفع" },
  reference: { en: "Reference", ar: "المرجع" },
  reason: { en: "Reason", ar: "السبب" },
  amountReceived: { en: "Amount Received", ar: "المبلغ المستلم" },
  balanceDue: { en: "Balance Due", ar: "الرصيد المستحق" },
  paymentStatus: { en: "Payment Status", ar: "حالة الدفع" },

  subtotal: { en: "Subtotal", ar: "المجموع الفرعي" },
  discount: { en: "Discount", ar: "الخصم" },
  taxableAmount: { en: "Taxable Amount", ar: "المبلغ الخاضع للضريبة" },
  totalVat: { en: "VAT Total", ar: "إجمالي ضريبة القيمة المضافة" },
  grandTotal: { en: "Grand Total", ar: "المجموع شامل الضريبة" },
  creditTotal: { en: "Credit Total", ar: "إجمالي الإشعار الدائن" },
  debitTotal: { en: "Debit Total", ar: "إجمالي الإشعار المدين" },
  paid: { en: "Paid", ar: "المدفوع" },

  stamp: { en: "Company Stamp", ar: "ختم الشركة" },
  signature: { en: "Authorized Signature", ar: "التوقيع المعتمد" },
  receiverName: { en: "Received By", ar: "مستلم بواسطة" },
  receiverSignature: { en: "Receiver Signature", ar: "توقيع المستلم" },
  notes: { en: "Notes", ar: "ملاحظات" },
  terms: { en: "Terms & Conditions", ar: "الشروط والأحكام" },
  validityNote: {
    en: "This quotation is valid for 30 days from the issue date.",
    ar: "هذا العرض ساري لمدة 30 يوماً من تاريخ الإصدار.",
  },
  proformaNote: {
    en: "Proforma invoice — this is not a tax invoice. A final tax invoice will be issued upon payment.",
    ar: "فاتورة أولية — هذه ليست فاتورة ضريبية. سيتم إصدار فاتورة ضريبية نهائية عند السداد.",
  },
  deliveryTerms: {
    en: "Goods received in good condition unless noted otherwise.",
    ar: "تم استلام البضاعة بحالة جيدة ما لم يذكر خلاف ذلك.",
  },
  purchaseTerms: {
    en: "Supply terms per the agreement. Invoice on delivery.",
    ar: "شروط التوريد وفقاً للاتفاقية. الفوترة عند التسليم.",
  },
  creditNoteReason: { en: "Reason", ar: "سبب إشعار الدائن" },
  debitNoteReason: { en: "Reason", ar: "سبب إشعار المدين" },
  zatcaNote: {
    en: "Issued under the Saudi VAT regulations.",
    ar: "صادر بموجب لوائح ضريبة القيمة المضافة في المملكة العربية السعودية.",
  },
};

export const COLUMN_LABELS: Record<ColumnKey, Bilingual> = {
  index: { en: "#", ar: "#" },
  description: { en: "Description", ar: "الوصف" },
  quantity: { en: "Qty", ar: "الكمية" },
  unit: { en: "Unit", ar: "الوحدة" },
  deliveredQuantity: { en: "Delivered", ar: "المُسلّم" },
  pendingQuantity: { en: "Pending", ar: "المتبقي" },
  remarks: { en: "Remarks", ar: "ملاحظات" },
  price: { en: "Rate", ar: "السعر" },
  discount: { en: "Discount", ar: "الخصم" },
  taxableAmount: { en: "Taxable", ar: "الخاضع للضريبة" },
  vatRate: { en: "VAT %", ar: "الضريبة %" },
  vatAmount: { en: "VAT", ar: "الضريبة" },
  lineTotal: { en: "Total", ar: "الإجمالي" },
};

// ─── 3-column row spec (label_en | value | label_ar) ────────────────────────

export type InfoRow = {
  /** Field key — also drives renderer/pdf value resolution. */
  field: FieldKey;
  /** When true the row is omitted if value resolves to empty. */
  hideIfEmpty?: boolean;
};

// ─── Items table column spec (with absolute widths) ─────────────────────────

export type ItemColumnSpec = {
  key: ColumnKey;
  /** Width in pixels. PDF converts to points (× 0.75). */
  widthPx: number;
  align: "left" | "right" | "center";
  /** Required columns cannot be hidden in the inspector. */
  required: boolean;
  format?: "money" | "percent" | "qty" | "text";
};

// ─── Section geometry (Wafeq Format 2 page positions) ───────────────────────

export type SectionGeometry = {
  /** Pixel x within the safe area (always 48 except totals/QR split). */
  xPx: number;
  /** Pixel width. */
  widthPx: number;
  /** Minimum height in pixels. */
  minHeightPx: number;
  /** Maximum height in pixels. `auto` lets long content grow until bottom limit. */
  maxHeightPx: number | "auto";
  /** Optional column slot id for split rows (totals + QR share a row). */
  splitRow?: "totals_left_qr" | "totals_right";
};

// ─── Master schema entry ────────────────────────────────────────────────────

export type DocumentTemplateSchema = {
  documentType: SchemaDocType;
  inheritsFrom?: SchemaDocType;
  title: Bilingual;
  customerLabel: Bilingual;

  /** Strict section order — renderer renders top-to-bottom, never reorders. */
  sections: SectionKey[];

  /** Per-section geometry. Renderer + PDF read this for layout. */
  sectionGeometry: Partial<Record<SectionKey, SectionGeometry>>;

  /** 3-column customer information rows. */
  customerRows: InfoRow[];

  /** 3-column document information rows. */
  documentInfoRows: InfoRow[];

  /** Items table column specs (canonical order). */
  itemColumns: ItemColumnSpec[];

  /** Required columns — duplicated here for fast lookup; must match itemColumns[].required. */
  requiredItemColumns: ColumnKey[];

  /** Totals fields in display order. */
  totalsFields: FieldKey[];
  /** Optional grand-total label override (per derived doc type). */
  totalsGrandLabel?: Bilingual;

  /** Footer fields. */
  footerFields: FieldKey[];

  qr: {
    applicable: boolean;
    defaultVisible: boolean;
    /** Customer-facing caption shown next to QR image only. */
    caption: Bilingual;
  };

  stampSignature: {
    /** When true the section is allowed by this schema. */
    enabled: boolean;
    showStamp: boolean;
    showSignature: boolean;
    /** Delivery note adds an explicit receiver-signature column. */
    showReceiverSignature: boolean;
  };

  zatcaClassification: ZatcaClassification;

  rules: {
    requireOriginalInvoiceRef?: boolean;
    showCreditAmounts?: boolean;
    showDebitAmounts?: boolean;
    paymentStatusVisible?: boolean;
    noTaxClaim?: boolean;
    /** Items table totals row hidden by default (delivery note). */
    hideTotalsByDefault?: boolean;
    supplierFacingDocument?: boolean;
  };
};

// ─── Reusable building blocks (Wafeq Format 2 defaults) ─────────────────────
// Content width = page width minus 10mm left + 10mm right (see PAGE_GEOMETRY).

const CONTENT_W = 794 - MM10 * 2;

const DEFAULT_SECTION_GEOMETRY: Partial<Record<SectionKey, SectionGeometry>> = {
  header:         { xPx: MM10, widthPx: CONTENT_W, minHeightPx: 122, maxHeightPx: 150 },
  title:          { xPx: MM10, widthPx: CONTENT_W, minHeightPx: 58,  maxHeightPx: 70 },
  customer:       { xPx: MM10, widthPx: CONTENT_W, minHeightPx: 122, maxHeightPx: 170 },
  docInfo:        { xPx: MM10, widthPx: CONTENT_W, minHeightPx: 128, maxHeightPx: 190 },
  items:          { xPx: MM10, widthPx: CONTENT_W, minHeightPx: 190, maxHeightPx: "auto" },
  totals:         { xPx: 794 - MM10 - 276, widthPx: 276, minHeightPx: 104, maxHeightPx: 150, splitRow: "totals_right" },
  qr:             { xPx: MM10, widthPx: 390, minHeightPx: 118, maxHeightPx: 140, splitRow: "totals_left_qr" },
  stampSignature: { xPx: MM10, widthPx: CONTENT_W, minHeightPx: 120, maxHeightPx: 145 },
  footer:         { xPx: MM10, widthPx: CONTENT_W, minHeightPx: 34,  maxHeightPx: 34 },
};

const DEFAULT_CUSTOMER_ROWS: InfoRow[] = [
  { field: "customerName" },
  { field: "customerNameAr",   hideIfEmpty: true },
  { field: "customerCr",       hideIfEmpty: true },
  { field: "customerVat" },
  { field: "customerAddress" },
  { field: "customerPhone",    hideIfEmpty: true },
  { field: "customerFax",      hideIfEmpty: true },
  { field: "customerEmail",    hideIfEmpty: true },
];

const DEFAULT_DOCUMENT_INFO_ROWS: InfoRow[] = [
  { field: "docNumber" },
  { field: "quotationNumber",  hideIfEmpty: true },
  { field: "purchaseOrderNumber", hideIfEmpty: true },
  { field: "issueDate" },
  { field: "supplyDate",       hideIfEmpty: true },
  { field: "dueDate",          hideIfEmpty: true },
  { field: "currency" },
  { field: "paymentTerms",     hideIfEmpty: true },
  { field: "reference",        hideIfEmpty: true },
];

// Wafeq Format 2 invoice item table — exact widthPx values match the schema spec.
const DEFAULT_ITEM_COLUMNS: ItemColumnSpec[] = [
  { key: "index",           widthPx: 30,  align: "center", required: true },
  { key: "description",     widthPx: 225, align: "left",   required: true },
  { key: "quantity",        widthPx: 44,  align: "right",  required: true,  format: "qty" },
  { key: "unit",            widthPx: 40,  align: "center", required: false, format: "text" },
  { key: "price",           widthPx: 68,  align: "right",  required: true,  format: "money" },
  { key: "taxableAmount",   widthPx: 72,  align: "right",  required: true,  format: "money" },
  { key: "vatRate",         widthPx: 44,  align: "right",  required: false, format: "percent" },
  { key: "vatAmount",       widthPx: 64,  align: "right",  required: true,  format: "money" },
  { key: "lineTotal",       widthPx: 225, align: "right",  required: true,  format: "money" },
];

const REQUIRED_ITEM_COLUMNS_FROM = (cols: ItemColumnSpec[]): ColumnKey[] =>
  cols.filter((c) => c.required).map((c) => c.key);

const DEFAULT_QR: DocumentTemplateSchema["qr"] = {
  applicable: true,
  defaultVisible: true,
  caption: {
    en: "This QR code is encoded as per ZATCA e-invoicing requirements.",
    ar: "تم ترميز هذا الرمز وفقاً لمتطلبات هيئة الزكاة والضريبة والجمارك للفوترة الإلكترونية.",
  },
};

const DEFAULT_STAMP_SIG: DocumentTemplateSchema["stampSignature"] = {
  enabled: true,
  showStamp: true,
  showSignature: true,
  showReceiverSignature: false,
};

// ─── Master invoice schema ──────────────────────────────────────────────────

const MASTER_TAX_INVOICE: DocumentTemplateSchema = {
  documentType: "tax_invoice",
  title: { en: "Tax Invoice", ar: "فاتورة ضريبية" },
  customerLabel: { en: "Bill to", ar: "العميل" },
  sections: ["header", "title", "customer", "docInfo", "items", "totals", "qr", "stampSignature", "footer"],
  sectionGeometry: DEFAULT_SECTION_GEOMETRY,
  customerRows: DEFAULT_CUSTOMER_ROWS,
  documentInfoRows: DEFAULT_DOCUMENT_INFO_ROWS,
  itemColumns: DEFAULT_ITEM_COLUMNS,
  requiredItemColumns: REQUIRED_ITEM_COLUMNS_FROM(DEFAULT_ITEM_COLUMNS),
  totalsFields: ["subtotal", "totalVat", "grandTotal"],
  footerFields: ["zatcaNote"],
  qr: DEFAULT_QR,
  stampSignature: DEFAULT_STAMP_SIG,
  zatcaClassification: "foundation_only",
  rules: {},
};

// ─── Derived schemas ────────────────────────────────────────────────────────

const SIMPLIFIED_TAX_INVOICE: DocumentTemplateSchema = {
  ...MASTER_TAX_INVOICE,
  documentType: "simplified_tax_invoice",
  inheritsFrom: "tax_invoice",
  title: { en: "Simplified Tax Invoice", ar: "فاتورة ضريبية مبسطة" },
  customerLabel: { en: "Customer", ar: "العميل" },
  customerRows: [
    { field: "customerName" },
    { field: "customerNameAr",   hideIfEmpty: true },
    { field: "customerCr",       hideIfEmpty: true },
    { field: "customerVat",      hideIfEmpty: true },
    { field: "customerAddress",  hideIfEmpty: true },
    { field: "customerPhone",    hideIfEmpty: true },
    { field: "customerEmail",    hideIfEmpty: true },
  ],
  itemColumns: [
    { key: "index",        widthPx: 30,  align: "center", required: true },
    { key: "description",  widthPx: 225, align: "left",   required: true },
    { key: "quantity",     widthPx: 44,  align: "right",  required: true,  format: "qty" },
    { key: "price",        widthPx: 72,  align: "right",  required: true,  format: "money" },
    { key: "vatAmount",    widthPx: 68,  align: "right",  required: true,  format: "money" },
    { key: "lineTotal",    widthPx: 225, align: "right",  required: true,  format: "money" },
  ],
  requiredItemColumns: ["description", "quantity", "price", "vatAmount", "lineTotal"],
  totalsFields: ["subtotal", "totalVat", "grandTotal"],
  footerFields: ["zatcaNote"],
};

const QUOTATION: DocumentTemplateSchema = {
  ...MASTER_TAX_INVOICE,
  documentType: "quotation",
  inheritsFrom: "tax_invoice",
  title: { en: "Quotation", ar: "عرض سعر" },
  customerLabel: { en: "Customer", ar: "العميل" },
  sections: ["header", "title", "customer", "docInfo", "items", "totals", "stampSignature", "footer"],
  documentInfoRows: [
    { field: "quotationNumber" },
    { field: "issueDate" },
    { field: "validUntil",       hideIfEmpty: true },
    { field: "currency" },
    { field: "reference",        hideIfEmpty: true },
    { field: "paymentTerms",     hideIfEmpty: true },
  ],
  totalsFields: ["subtotal", "totalVat", "grandTotal"],
  footerFields: ["validityNote", "terms"],
  qr: {
    applicable: false,
    defaultVisible: false,
    caption: { en: "QR not required for quotations", ar: "رمز الاستجابة غير مطلوب لعروض الأسعار" },
  },
  zatcaClassification: "not_applicable",
  rules: { noTaxClaim: true },
};

const PROFORMA_INVOICE: DocumentTemplateSchema = {
  ...MASTER_TAX_INVOICE,
  documentType: "proforma_invoice",
  inheritsFrom: "tax_invoice",
  title: { en: "Proforma Invoice", ar: "فاتورة أولية" },
  customerLabel: { en: "Customer", ar: "العميل" },
  sections: ["header", "title", "customer", "docInfo", "items", "totals", "stampSignature", "footer"],
  documentInfoRows: [
    { field: "docNumber" },
    { field: "issueDate" },
    { field: "validUntil",       hideIfEmpty: true },
    { field: "currency" },
    { field: "paymentStatus",    hideIfEmpty: true },
    { field: "amountReceived",   hideIfEmpty: true },
    { field: "balanceDue",       hideIfEmpty: true },
  ],
  totalsFields: ["subtotal", "totalVat", "grandTotal", "amountReceived", "balanceDue"],
  footerFields: ["proformaNote", "terms"],
  qr: {
    applicable: false,
    defaultVisible: false,
    caption: { en: "QR not required for proforma invoices", ar: "رمز الاستجابة غير مطلوب للفاتورة الأولية" },
  },
  zatcaClassification: "not_applicable",
  rules: { paymentStatusVisible: true, noTaxClaim: true },
};

const CREDIT_NOTE: DocumentTemplateSchema = {
  ...MASTER_TAX_INVOICE,
  documentType: "credit_note",
  inheritsFrom: "tax_invoice",
  title: { en: "Credit Note", ar: "إشعار دائن" },
  customerLabel: { en: "Customer", ar: "العميل" },
  documentInfoRows: [
    { field: "docNumber" },
    { field: "issueDate" },
    { field: "originalInvoiceNumber" },
    { field: "originalInvoiceDate", hideIfEmpty: true },
    { field: "currency" },
    { field: "reason",            hideIfEmpty: true },
  ],
  totalsFields: ["subtotal", "totalVat", "creditTotal"],
  totalsGrandLabel: { en: "Credit Total", ar: "إجمالي الإشعار الدائن" },
  footerFields: ["creditNoteReason", "zatcaNote"],
  qr: {
    ...DEFAULT_QR,
    caption: {
      en: "ZATCA QR (credit note foundation)",
      ar: "رمز الاستجابة (أساس إشعار دائن)",
    },
  },
  zatcaClassification: "foundation_only",
  rules: { requireOriginalInvoiceRef: true, showCreditAmounts: true },
};

const DEBIT_NOTE: DocumentTemplateSchema = {
  ...MASTER_TAX_INVOICE,
  documentType: "debit_note",
  inheritsFrom: "tax_invoice",
  title: { en: "Debit Note", ar: "إشعار مدين" },
  customerLabel: { en: "Customer", ar: "العميل" },
  documentInfoRows: [
    { field: "docNumber" },
    { field: "issueDate" },
    { field: "originalInvoiceNumber" },
    { field: "originalInvoiceDate", hideIfEmpty: true },
    { field: "currency" },
    { field: "reason",            hideIfEmpty: true },
  ],
  totalsFields: ["subtotal", "totalVat", "debitTotal"],
  totalsGrandLabel: { en: "Debit Total", ar: "إجمالي الإشعار المدين" },
  footerFields: ["debitNoteReason", "zatcaNote"],
  qr: {
    ...DEFAULT_QR,
    caption: {
      en: "ZATCA QR (debit note foundation)",
      ar: "رمز الاستجابة (أساس إشعار مدين)",
    },
  },
  zatcaClassification: "foundation_only",
  rules: { requireOriginalInvoiceRef: true, showDebitAmounts: true },
};

const DELIVERY_NOTE: DocumentTemplateSchema = {
  ...MASTER_TAX_INVOICE,
  documentType: "delivery_note",
  inheritsFrom: "tax_invoice",
  title: { en: "Delivery Note", ar: "إشعار تسليم" },
  customerLabel: { en: "Deliver to", ar: "يسلم إلى" },
  // Delivery note removes totals + QR sections.
  sections: ["header", "title", "customer", "docInfo", "items", "stampSignature", "footer"],
  documentInfoRows: [
    { field: "docNumber" },
    { field: "deliveryDate" },
    { field: "expectedDeliveryDate", hideIfEmpty: true },
    { field: "relatedInvoiceNumber", hideIfEmpty: true },
    { field: "relatedProformaNumber", hideIfEmpty: true },
    { field: "deliveryLocation",    hideIfEmpty: true },
    { field: "deliveryStatus",      hideIfEmpty: true },
  ],
  itemColumns: [
    { key: "index",             widthPx: 30,  align: "center", required: true },
    { key: "description",       widthPx: 225, align: "left",   required: true },
    { key: "quantity",          widthPx: 56,  align: "right",  required: true,  format: "qty" },
    { key: "unit",              widthPx: 44,  align: "center", required: false, format: "text" },
    { key: "deliveredQuantity", widthPx: 72,  align: "right",  required: true,  format: "qty" },
    { key: "pendingQuantity",   widthPx: 72,  align: "right",  required: false, format: "qty" },
    { key: "remarks",           widthPx: 120, align: "left",   required: false, format: "text" },
  ],
  requiredItemColumns: ["description", "quantity", "deliveredQuantity"],
  totalsFields: [],
  footerFields: ["receiverName", "deliveryTerms"],
  qr: {
    applicable: false,
    defaultVisible: false,
    caption: { en: "QR not required for delivery notes", ar: "رمز الاستجابة غير مطلوب لإشعار التسليم" },
  },
  stampSignature: { enabled: true, showStamp: true, showSignature: true, showReceiverSignature: true },
  zatcaClassification: "not_applicable",
  rules: { hideTotalsByDefault: true, noTaxClaim: true },
};

const PURCHASE_ORDER: DocumentTemplateSchema = {
  ...MASTER_TAX_INVOICE,
  documentType: "purchase_order",
  inheritsFrom: "tax_invoice",
  title: { en: "Purchase Order", ar: "أمر شراء" },
  customerLabel: { en: "Supplier", ar: "المورد" },
  sections: ["header", "title", "customer", "docInfo", "items", "totals", "stampSignature", "footer"],
  documentInfoRows: [
    { field: "docNumber" },
    { field: "issueDate" },
    { field: "expectedDeliveryDate", hideIfEmpty: true },
    { field: "currency" },
    { field: "paymentTerms",        hideIfEmpty: true },
    { field: "deliveryLocation",    hideIfEmpty: true },
  ],
  itemColumns: [
    { key: "index",        widthPx: 30,  align: "center", required: true },
    { key: "description",  widthPx: 225, align: "left",   required: true },
    { key: "quantity",     widthPx: 52,  align: "right",  required: true,  format: "qty" },
    { key: "unit",         widthPx: 44,  align: "center", required: false, format: "text" },
    { key: "price",        widthPx: 72,  align: "right",  required: true,  format: "money" },
    { key: "vatAmount",    widthPx: 64,  align: "right",  required: false, format: "money" },
    { key: "lineTotal",    widthPx: 225, align: "right",  required: true,  format: "money" },
  ],
  requiredItemColumns: ["description", "quantity", "price", "lineTotal"],
  totalsFields: ["subtotal", "totalVat", "grandTotal"],
  footerFields: ["purchaseTerms", "signature"],
  qr: {
    applicable: false,
    defaultVisible: false,
    caption: { en: "QR not required for purchase orders", ar: "رمز الاستجابة غير مطلوب لأمر الشراء" },
  },
  zatcaClassification: "not_applicable",
  rules: { noTaxClaim: true, supplierFacingDocument: true },
};

// ─── Public registry ────────────────────────────────────────────────────────

export const DOCUMENT_TEMPLATE_SCHEMAS: Record<SchemaDocType, DocumentTemplateSchema> = {
  tax_invoice: MASTER_TAX_INVOICE,
  simplified_tax_invoice: SIMPLIFIED_TAX_INVOICE,
  quotation: QUOTATION,
  proforma_invoice: PROFORMA_INVOICE,
  credit_note: CREDIT_NOTE,
  debit_note: DEBIT_NOTE,
  delivery_note: DELIVERY_NOTE,
  purchase_order: PURCHASE_ORDER,
};

export function getSchema(docType: SchemaDocType): DocumentTemplateSchema {
  return DOCUMENT_TEMPLATE_SCHEMAS[docType];
}

/**
 * Resolve the schema for a given DocumentRecord.kind.
 */
export function getSchemaForKind(kind: DocumentKind): DocumentTemplateSchema {
  switch (kind) {
    case "invoice":
      return DOCUMENT_TEMPLATE_SCHEMAS.tax_invoice;
    case "quotation":
      return DOCUMENT_TEMPLATE_SCHEMAS.quotation;
    case "proforma":
      return DOCUMENT_TEMPLATE_SCHEMAS.proforma_invoice;
    case "credit_note":
      return DOCUMENT_TEMPLATE_SCHEMAS.credit_note;
    case "debit_note":
      return DOCUMENT_TEMPLATE_SCHEMAS.debit_note;
    default:
      return DOCUMENT_TEMPLATE_SCHEMAS.tax_invoice;
  }
}

export function bilingual(value: Bilingual, lang: LangMode): string {
  if (lang === "english") return value.en;
  if (lang === "arabic") return value.ar;
  return value.en;
}

export function bilingualBoth(value: Bilingual): string {
  return `${value.en} / ${value.ar}`;
}

/**
 * Honest list of style variants implemented end-to-end. Standard / Modern /
 * Compact share the same schema; only spacing, density and accent treatment
 * differ. They are real CSS variants (data-style on the .paper root) — see
 * v2.css [data-style="modern"] / [data-style="compact"].
 *
 * Per spec: "Do not show three templates if only one style exists." Doc types
 * other than tax_invoice expose only the Standard variant (see
 * REAL_STYLE_VARIANTS_BY_DOC_TYPE).
 */
export const REAL_STYLE_VARIANTS: TemplateStyle[] = ["standard", "modern", "compact"];

export const REAL_STYLE_VARIANTS_BY_DOC_TYPE: Record<SchemaDocType, TemplateStyle[]> = {
  tax_invoice: ["standard", "modern", "compact"],
  simplified_tax_invoice: ["standard"],
  quotation: ["standard"],
  proforma_invoice: ["standard"],
  credit_note: ["standard"],
  debit_note: ["standard"],
  delivery_note: ["standard"],
  purchase_order: ["standard"],
};

// ─── Backward-compatible accessors for code that still reads the old fields ─

/**
 * Items columns as bare ColumnKey[] — kept so existing call sites that read
 * `schema.itemsColumns` continue to compile while the new code reads
 * `schema.itemColumns` (with `widthPx`).
 */
export function itemColumnKeys(schema: DocumentTemplateSchema): ColumnKey[] {
  return schema.itemColumns.map((c) => c.key);
}

/**
 * Document meta keys (for legacy consumers that iterated over a flat list).
 */
export function documentMetaFields(schema: DocumentTemplateSchema): FieldKey[] {
  return schema.documentInfoRows.map((row) => row.field);
}

/**
 * Optional customer fields = customerRows that are flagged hideIfEmpty.
 */
export function optionalCustomerFields(schema: DocumentTemplateSchema): FieldKey[] {
  return schema.customerRows.filter((row) => row.hideIfEmpty).map((row) => row.field);
}
