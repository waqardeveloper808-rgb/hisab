import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { processLogoImage } from "@/lib/logo-intelligence";
import { previewCompany } from "@/data/preview-company";

type PreviewContact = {
  id: number;
  type: "customer" | "supplier";
  display_name: string;
  display_name_ar?: string | null;
  email?: string | null;
  phone?: string | null;
  vat_number?: string | null;
  billing_address?: {
    city?: string | null;
    line_1?: string | null;
    line_1_ar?: string | null;
  } | null;
};

type PreviewAsset = {
  id: number;
  type: string;
  usage?: string | null;
  original_name: string;
  mime_type?: string | null;
  extension?: string | null;
  size_bytes: number;
  public_url: string;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
};

type PreviewTemplate = {
  id: number;
  name: string;
  document_types?: string[] | null;
  locale_mode: string;
  accent_color: string;
  watermark_text?: string | null;
  header_html?: string | null;
  footer_html?: string | null;
  settings?: Record<string, string | number | boolean | null> | null;
  logo_asset_id?: number | null;
  logo_asset?: {
    id: number;
    public_url: string;
    original_name: string;
  } | null;
  is_default: boolean;
  is_active: boolean;
};

type PreviewItem = {
  id: number;
  type: "product" | "service";
  name: string;
  sku?: string | null;
  default_sale_price?: number | null;
  default_purchase_price?: number | null;
  tax_category?: {
    name?: string | null;
    rate?: number | null;
  } | null;
};

type PreviewDocumentLine = {
  id: number;
  item_id?: number | null;
  ledger_account_id?: number | null;
  cost_center_id?: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  gross_amount: number;
  metadata?: {
    custom_fields?: Record<string, string | number | boolean | null> | null;
  } | null;
};

type PreviewDocument = {
  id: number;
  type: string;
  status: string;
  contact_id: number;
  document_number: string;
  issue_date: string;
  due_date: string;
  grand_total: number;
  balance_due: number;
  paid_total: number;
  tax_total: number;
  taxable_total: number;
  contact: { display_name: string };
  title: string;
  language_code: string;
  sent_at?: string | null;
  sent_to_email?: string | null;
  custom_fields?: Record<string, string | number | boolean | null>;
  template?: { id: number; name: string } | null;
  notes?: string;
  compliance_metadata?: Record<string, unknown> | null;
  lines?: PreviewDocumentLine[];
};

type PreviewPayment = {
  id: number;
  direction: "incoming" | "outgoing";
  status: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  allocated_total: number;
  unallocated_amount: number;
  method?: string | null;
  reference?: string | null;
  document_id?: number | null;
  document_number?: string | null;
  contact_name?: string | null;
};

type PreviewCustomFieldDefinition = {
  id: number;
  name: string;
  slug: string;
  field_type: string;
  placement: string;
  applies_to: string[];
  options: string[];
  is_active: boolean;
};

type PreviewCostCenter = {
  id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
};

const previewContactsPath = path.join(process.cwd(), "data", "preview-contact-store.json");
const previewTemplatesPath = path.join(process.cwd(), "data", "preview-template-store.json");
const previewItemsPath = path.join(process.cwd(), "data", "preview-item-store.json");
const previewDocumentsPath = path.join(process.cwd(), "data", "preview-document-store.json");
const previewPaymentsPath = path.join(process.cwd(), "data", "preview-payment-store.json");
const previewAssetsPath = path.join(process.cwd(), "data", "preview-asset-store.json");

const seededPreviewItems: PreviewItem[] = [
  {
    id: 301,
    type: "service",
    name: "Monthly bookkeeping",
    sku: "SRV-BOOK-01",
    default_sale_price: 1250,
    default_purchase_price: 0,
    tax_category: { name: "VAT 15%", rate: 15 },
  },
  {
    id: 302,
    type: "product",
    name: "Thermal invoice paper",
    sku: "PRD-PAPER-02",
    default_sale_price: 85,
    default_purchase_price: 55,
    tax_category: { name: "VAT 15%", rate: 15 },
  },
];

const seededPreviewDocuments: PreviewDocument[] = [
  {
    id: 1101,
    type: "tax_invoice",
    status: "sent",
    contact_id: 101,
    document_number: "INV-2026-1101",
    issue_date: "2026-04-10",
    due_date: "2026-04-17",
    grand_total: 4600,
    balance_due: 1850,
    paid_total: 2750,
    tax_total: 600,
    taxable_total: 4000,
    contact: { display_name: "Al Noor Trading" },
    title: "April monthly accounting",
    language_code: "en",
    sent_at: "2026-04-10T09:30:00Z",
    sent_to_email: "finance@alnoor.sa",
    custom_fields: { reference: "INV-2026-1101" },
    template: { id: 801, name: "Standard Tax Invoice" },
    notes: "Preview invoice for inspector coverage.",
    compliance_metadata: {
      zatca: {
        seller_name: previewCompany.sellerName,
        vat_number: previewCompany.vatNumber,
      },
    },
    lines: [
      {
        id: 11011,
        item_id: 301,
        ledger_account_id: 4100,
        cost_center_id: 11,
        description: "Monthly bookkeeping",
        quantity: 1,
        unit_price: 4000,
        gross_amount: 4000,
        metadata: { custom_fields: {} },
      },
    ],
  },
  {
    id: 1102,
    type: "tax_invoice",
    status: "draft",
    contact_id: 102,
    document_number: "INV-2026-1102",
    issue_date: "2026-04-12",
    due_date: "2026-04-19",
    grand_total: 2300,
    balance_due: 2300,
    paid_total: 0,
    tax_total: 300,
    taxable_total: 2000,
    contact: { display_name: "Desert Retail Co." },
    title: "POS integration setup",
    language_code: "en",
    sent_at: null,
    sent_to_email: "ap@desertretail.sa",
    custom_fields: { reference: "INV-2026-1102" },
    template: { id: 802, name: "Compact Invoice" },
    notes: "Draft preview invoice.",
    compliance_metadata: {
      zatca: {
        seller_name: previewCompany.sellerName,
        vat_number: previewCompany.vatNumber,
      },
    },
    lines: [
      {
        id: 11021,
        item_id: 301,
        ledger_account_id: 4100,
        cost_center_id: 11,
        description: "POS integration setup",
        quantity: 1,
        unit_price: 2000,
        gross_amount: 2000,
        metadata: { custom_fields: {} },
      },
    ],
  },
  {
    id: 2101,
    type: "vendor_bill",
    status: "posted",
    contact_id: 201,
    document_number: "BILL-2026-2101",
    issue_date: "2026-04-08",
    due_date: "2026-04-22",
    grand_total: 920,
    balance_due: 320,
    paid_total: 600,
    tax_total: 120,
    taxable_total: 800,
    contact: { display_name: "Eastern Paper Supply" },
    title: "Stationery replenishment",
    language_code: "en",
    sent_at: null,
    sent_to_email: "accounts@easternpaper.sa",
    custom_fields: { reference: "BILL-2026-2101" },
    template: { id: 803, name: "Vendor Bill Layout" },
    notes: "Preview vendor bill.",
    compliance_metadata: null,
    lines: [
      {
        id: 21011,
        item_id: 302,
        ledger_account_id: 5100,
        cost_center_id: 21,
        description: "Stationery replenishment",
        quantity: 1,
        unit_price: 800,
        gross_amount: 800,
        metadata: { custom_fields: {} },
      },
    ],
  },
  {
    id: 2102,
    type: "purchase_invoice",
    status: "posted",
    contact_id: 202,
    document_number: "PINV-2026-2102",
    issue_date: "2026-04-11",
    due_date: "2026-04-25",
    grand_total: 3450,
    balance_due: 3450,
    paid_total: 0,
    tax_total: 450,
    taxable_total: 3000,
    contact: { display_name: "Najd Office Systems" },
    title: "Office system refresh",
    language_code: "en",
    sent_at: null,
    sent_to_email: "payables@najdoffice.sa",
    custom_fields: { reference: "PINV-2026-2102" },
    template: { id: 803, name: "Vendor Bill Layout" },
    notes: "Preview purchase invoice.",
    compliance_metadata: null,
    lines: [
      {
        id: 21021,
        item_id: 302,
        ledger_account_id: 5100,
        cost_center_id: 21,
        description: "Office system refresh",
        quantity: 1,
        unit_price: 3000,
        gross_amount: 3000,
        metadata: { custom_fields: {} },
      },
    ],
  },
  {
    id: 2103,
    type: "purchase_order",
    status: "approved",
    contact_id: 201,
    document_number: "PO-2026-2103",
    issue_date: "2026-04-13",
    due_date: "2026-04-20",
    grand_total: 1725,
    balance_due: 1725,
    paid_total: 0,
    tax_total: 225,
    taxable_total: 1500,
    contact: { display_name: "Eastern Paper Supply" },
    title: "Warehouse refill order",
    language_code: "en",
    sent_at: null,
    sent_to_email: "accounts@easternpaper.sa",
    custom_fields: { reference: "PO-2026-2103" },
    template: { id: 803, name: "Vendor Bill Layout" },
    notes: "Preview purchase order for route parity.",
    compliance_metadata: null,
    lines: [
      {
        id: 21031,
        item_id: 302,
        ledger_account_id: 5100,
        cost_center_id: 21,
        description: "Warehouse refill order",
        quantity: 20,
        unit_price: 75,
        gross_amount: 1500,
        metadata: { custom_fields: {} },
      },
    ],
  },
];

const seededPreviewPayments: PreviewPayment[] = [
  {
    id: 5001,
    direction: "incoming",
    status: "posted",
    payment_number: "PAY-2026-5001",
    payment_date: "2026-04-11",
    amount: 2750,
    allocated_total: 2750,
    unallocated_amount: 0,
    method: "bank_transfer",
    reference: "RCPT-1101",
    document_id: 1101,
    document_number: "INV-2026-1101",
    contact_name: "Al Noor Trading",
  },
  {
    id: 5002,
    direction: "outgoing",
    status: "posted",
    payment_number: "PAY-2026-5002",
    payment_date: "2026-04-09",
    amount: 600,
    allocated_total: 600,
    unallocated_amount: 0,
    method: "card",
    reference: "SUP-2101",
    document_id: 2101,
    document_number: "BILL-2026-2101",
    contact_name: "Eastern Paper Supply",
  },
];

const previewCustomFields: PreviewCustomFieldDefinition[] = [
  {
    id: 801,
    name: "Project code",
    slug: "project_code",
    field_type: "text",
    placement: "document_header",
    applies_to: ["tax_invoice", "vendor_bill", "purchase_invoice"],
    options: [],
    is_active: true,
  },
  {
    id: 802,
    name: "Approval required",
    slug: "approval_required",
    field_type: "boolean",
    placement: "document_header",
    applies_to: ["vendor_bill", "purchase_invoice"],
    options: [],
    is_active: true,
  },
  {
    id: 803,
    name: "Service period",
    slug: "service_period",
    field_type: "text",
    placement: "line_item",
    applies_to: ["tax_invoice"],
    options: [],
    is_active: true,
  },
];

const previewCostCenters: PreviewCostCenter[] = [
  { id: 11, name: "Sales", code: "SALES", description: "Revenue-driving work", is_active: true },
  { id: 21, name: "Operations", code: "OPS", description: "Operational delivery and purchasing", is_active: true },
  { id: 31, name: "Admin", code: "ADMIN", description: "Administration and shared overhead", is_active: true },
];

async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

async function readOptionalJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return await readJsonFile<T>(filePath);
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numericValue(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function currencyValue(value: number, currencyCode: string) {
  return `${value.toFixed(2)} ${currencyCode}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getLineVatRate(line: PreviewDocumentLine) {
  return numericValue(line.metadata?.custom_fields?.vat_rate, 15);
}

function getLineVatAmount(line: PreviewDocumentLine) {
  return roundCurrency(line.gross_amount * (getLineVatRate(line) / 100));
}

function getLineTotal(line: PreviewDocumentLine) {
  return roundCurrency(line.gross_amount + getLineVatAmount(line));
}

function getTemplateSetting(template: PreviewTemplate | undefined, key: string, fallback = "") {
  const value = template?.settings?.[key];
  return value == null ? fallback : String(value);
}

function splitTemplateSections(template: PreviewTemplate | undefined) {
  return getTemplateSetting(template, "section_order", "header,seller-buyer,items,totals,qr,footer")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function amountToEnglishWords(value: number) {
  const ones = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

  const underThousand = (input: number): string => {
    if (input < 20) return ones[input];
    if (input < 100) return `${tens[Math.floor(input / 10)]}${input % 10 ? `-${ones[input % 10]}` : ""}`;
    return `${ones[Math.floor(input / 100)]} hundred${input % 100 ? ` ${underThousand(input % 100)}` : ""}`;
  };

  const integer = Math.floor(value);
  const fraction = Math.round((value - integer) * 100);
  const thousands = Math.floor(integer / 1000);
  const remainder = integer % 1000;
  const integerWords = thousands ? `${underThousand(thousands)} thousand${remainder ? ` ${underThousand(remainder)}` : ""}` : underThousand(remainder);

  return `${integerWords} riyals${fraction ? ` and ${fraction} halalas` : ""}`;
}

function amountToArabicWords(value: number) {
  const integer = Math.floor(value);
  const fraction = Math.round((value - integer) * 100);
  return `فقط ${integer} ريال${fraction ? ` و ${fraction} هللة` : ""}`;
}

function encodeTlvField(tag: number, value: string) {
  const valueBytes = new TextEncoder().encode(value);
  return new Uint8Array([tag, valueBytes.length, ...valueBytes]);
}

function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

async function buildInvoiceQrDataUrl(metadata: {
  sellerNameEn: string;
  sellerVat: string;
  issueDate: string;
  grandTotal: number;
  vatTotal: number;
}) {
  const fields = [
    encodeTlvField(1, metadata.sellerNameEn),
    encodeTlvField(2, metadata.sellerVat),
    encodeTlvField(3, `${metadata.issueDate}T09:30:00`),
    encodeTlvField(4, metadata.grandTotal.toFixed(2)),
    encodeTlvField(5, metadata.vatTotal.toFixed(2)),
  ];
  const totalLength = fields.reduce((sum, field) => sum + field.length, 0);
  const payload = new Uint8Array(totalLength);
  let offset = 0;

  fields.forEach((field) => {
    payload.set(field, offset);
    offset += field.length;
  });

  return QRCode.toDataURL(toBase64(payload), { margin: 1, width: 148, errorCorrectionLevel: "M" });
}

function decodeDataUrl(dataUrl: string) {
  const [header, base64] = dataUrl.split(",");
  return {
    mimeType: header?.match(/data:(.*?);base64/)?.[1] ?? "image/png",
    bytes: Buffer.from(base64 ?? "", "base64"),
  };
}

function buildInvoicePresentation(document: PreviewDocument, template?: PreviewTemplate, contact?: PreviewContact | null) {
  const custom = document.custom_fields ?? {};
  const currencyCode = textValue(custom.currency, previewCompany.currency);
  const sellerNameEn = textValue(custom.seller_name_en, previewCompany.sellerName);
  const sellerNameAr = textValue(custom.seller_name_ar, previewCompany.sellerNameAr);
  const sellerVat = textValue(custom.seller_vat_number, previewCompany.vatNumber);
  const sellerAddressEn = textValue(custom.seller_address_en, previewCompany.sellerAddressEn);
  const sellerAddressAr = textValue(custom.seller_address_ar, previewCompany.sellerAddressAr);
  const buyerNameEn = textValue(custom.buyer_name_en, document.contact.display_name);
  const buyerNameAr = textValue(custom.buyer_name_ar, contact?.display_name_ar ?? document.contact.display_name);
  const buyerVat = textValue(custom.buyer_vat_number, contact?.vat_number ?? "");
  const buyerAddressEn = textValue(custom.buyer_address_en, `${contact?.billing_address?.line_1 ?? ""} ${contact?.billing_address?.city ?? ""}`.trim());
  const buyerAddressAr = textValue(custom.buyer_address_ar, contact?.billing_address?.line_1_ar ?? "");
  const issueDate = textValue(document.issue_date);
  const supplyDate = textValue(custom.supply_date, issueDate);
  const subtotal = roundCurrency((document.lines ?? []).reduce((sum, line) => sum + line.gross_amount, 0));
  const vatTotal = roundCurrency((document.lines ?? []).reduce((sum, line) => sum + getLineVatAmount(line), 0));
  const grandTotal = roundCurrency((document.lines ?? []).reduce((sum, line) => sum + getLineTotal(line), 0));
  const amountWordsEn = amountToEnglishWords(grandTotal);
  const amountWordsAr = amountToArabicWords(grandTotal);
  const logoUrl = template?.logo_asset?.public_url ?? "";

  return {
    currencyCode,
    sellerNameEn,
    sellerNameAr,
    sellerVat,
    sellerAddressEn,
    sellerAddressAr,
    buyerNameEn,
    buyerNameAr,
    buyerVat,
    buyerAddressEn,
    buyerAddressAr,
    issueDate,
    supplyDate,
    subtotal,
    vatTotal,
    grandTotal,
    amountWordsEn,
    amountWordsAr,
    logoUrl,
  };
}

export async function listPreviewAssets() {
  return readOptionalJsonFile<PreviewAsset[]>(previewAssetsPath, []);
}

export async function createPreviewAsset(payload: {
  type: string;
  usage?: string | null;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
}) {
  const assets = await listPreviewAssets();
  const processedLogo = payload.usage === "logo" || payload.type === "logo"
    ? await processLogoImage(payload.bytes)
    : null;
  const nextAsset: PreviewAsset = {
    id: Math.max(...assets.map((asset) => asset.id), 900) + 1,
    type: payload.type,
    usage: payload.usage ?? null,
    original_name: payload.fileName,
    mime_type: processedLogo ? "image/png" : payload.mimeType,
    extension: processedLogo ? "png" : (payload.fileName.split(".").pop() ?? "bin"),
    size_bytes: payload.bytes.byteLength,
    public_url: processedLogo ? processedLogo.transparentDataUrl : `data:${payload.mimeType};base64,${Buffer.from(payload.bytes).toString("base64")}`,
    is_active: true,
    metadata: processedLogo ? {
      transparent_background: true,
      dominant_colors: processedLogo.dominantColors,
      generated_theme: processedLogo.theme,
      width: processedLogo.width,
      height: processedLogo.height,
    } : null,
  };

  await writeJsonFile(previewAssetsPath, [nextAsset, ...assets]);
  return nextAsset;
}

export async function listPreviewContacts(type?: "customer" | "supplier") {
  const contacts = await readJsonFile<PreviewContact[]>(previewContactsPath);
  return type ? contacts.filter((contact) => contact.type === type) : contacts;
}

export async function createPreviewContact(payload: {
  type: "customer" | "supplier";
  display_name: string;
  email?: string | null;
  phone?: string | null;
  billing_address?: { city?: string | null } | null;
}) {
  const contacts = await listPreviewContacts();
  const nextContact: PreviewContact = {
    id: Math.max(...contacts.map((contact) => contact.id), 0) + 1,
    type: payload.type,
    display_name: payload.display_name,
    email: payload.email ?? null,
    phone: payload.phone ?? null,
    billing_address: payload.billing_address ?? null,
  };

  await writeJsonFile(previewContactsPath, [...contacts, nextContact]);
  return nextContact;
}

function mergeById<T extends { id: number }>(base: T[], overlay: T[]) {
  const overlayById = new Map(overlay.map((item) => [item.id, item]));
  const merged = base.map((item) => overlayById.get(item.id) ?? item);
  const extras = overlay.filter((item) => !base.some((baseItem) => baseItem.id === item.id));
  return [...extras, ...merged];
}

export async function listPreviewItems() {
  const overlayItems = await readOptionalJsonFile<PreviewItem[]>(previewItemsPath, []);
  return mergeById(seededPreviewItems, overlayItems);
}

export async function createPreviewItem(payload: {
  type: "product" | "service";
  name: string;
  sku?: string | null;
  default_sale_price?: number | null;
  default_purchase_price?: number | null;
}) {
  const items = await listPreviewItems();
  const overlayItems = await readOptionalJsonFile<PreviewItem[]>(previewItemsPath, []);
  const nextItem: PreviewItem = {
    id: Math.max(...items.map((item) => item.id), 300) + 1,
    type: payload.type,
    name: payload.name,
    sku: payload.sku ?? null,
    default_sale_price: payload.default_sale_price ?? 0,
    default_purchase_price: payload.default_purchase_price ?? 0,
    tax_category: { name: "VAT 15%", rate: 15 },
  };

  await writeJsonFile(previewItemsPath, [nextItem, ...overlayItems]);
  return nextItem;
}

export async function listPreviewTemplates() {
  return readJsonFile<PreviewTemplate[]>(previewTemplatesPath);
}

export async function createPreviewTemplate(payload: Omit<PreviewTemplate, "id">) {
  const templates = await listPreviewTemplates();
  const nextTemplate: PreviewTemplate = {
    ...payload,
    id: Math.max(...templates.map((template) => template.id), 800) + 1,
  };

  await writeJsonFile(previewTemplatesPath, [nextTemplate, ...templates]);
  return nextTemplate;
}

export async function updatePreviewTemplate(templateId: number, payload: Omit<PreviewTemplate, "id">) {
  const templates = await listPreviewTemplates();
  const updatedTemplate: PreviewTemplate = { ...payload, id: templateId };
  const nextTemplates = templates.map((template) => template.id === templateId ? updatedTemplate : template);

  await writeJsonFile(previewTemplatesPath, nextTemplates);
  return updatedTemplate;
}

export function renderPreviewTemplateHtml(payload: {
  name: string;
  document_types?: string[] | null;
  locale_mode: string;
  accent_color: string;
  watermark_text?: string | null;
  header_html?: string | null;
  footer_html?: string | null;
}, documentType: string) {
  const layout = getTemplateSetting(payload as PreviewTemplate, "layout", "classic");
  const sectionOrder = getTemplateSetting(payload as PreviewTemplate, "section_order", "header,seller-buyer,items,totals,qr,footer");
  const watermarkEnabled = getBooleanSetting(payload as PreviewTemplate, "watermark_enabled", true);
  const watermarkMode = getTemplateSetting(payload as PreviewTemplate, "watermark_logo_mode", "full-width");
  return {
    html: `
      <article style="font-family: ui-sans-serif, system-ui; color: #183226; border: 1px solid #d8e5db; border-radius: 24px; overflow: hidden; background: #ffffff; position: relative;">
        ${watermarkEnabled ? `<div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:${watermarkMode === "centered" ? 56 : 88}px; font-weight:700; color:${payload.accent_color}; opacity:0.07; z-index:0; pointer-events:none; text-transform:uppercase;">${escapeHtml(payload.watermark_text || payload.name)}</div>` : ""}
        <header style="padding: 24px; background: ${payload.accent_color}; color: white; display: flex; justify-content: space-between; gap: 16px; align-items: flex-start;">
          <div>
            <div style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.88;">${documentType.replaceAll("_", " ")}</div>
            <h2 style="margin: 8px 0 0; font-size: 26px;">${payload.name}</h2>
            <div style="margin-top:8px;font-size:12px;opacity:0.88;">Layout: ${layout} · Sections: ${sectionOrder}</div>
          </div>
          <div style="text-align: right; font-size: 12px; line-height: 1.6; opacity: 0.92;">
            <div>${previewCompany.sellerName}</div>
            <div>${previewCompany.sellerNameAr}</div>
            <div>VAT ${previewCompany.vatNumber}</div>
          </div>
        </header>
        <section style="padding: 24px; display: grid; gap: 16px; position:relative; z-index:1;">
          <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">
            <div style="padding: 16px; border-radius: 16px; background: #f3f7f4;">
              <div style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #5c6f66;">Seller details</div>
              <div style="margin-top: 8px; display:grid; gap:6px; color:#183226;">${payload.header_html || `<strong>${previewCompany.sellerName}</strong><div>${previewCompany.sellerNameAr}</div><div style=\"color:#52615a;\">${previewCompany.sellerAddressEn}</div>`}</div>
            </div>
            <div style="padding: 16px; border-radius: 16px; background: #f9fbfa; border: 1px solid #d8e5db;">
              <div style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #5c6f66;">Template engine</div>
              <div style="margin-top: 8px; display: grid; gap: 6px; color: #52615a; font-size: 14px;">
                <div>Locale mode: ${payload.locale_mode}</div>
                <div>Accent color: ${payload.accent_color}</div>
                <div>Watermark: ${payload.watermark_text || "None"}</div>
              </div>
            </div>
          </div>
          <div style="border: 1px solid #e1e8e3; border-radius: 18px; overflow: hidden;">
            <div style="display: grid; grid-template-columns: 2fr 0.7fr 1fr 0.8fr 0.9fr 1fr; background: #f4f8f5; padding: 12px 16px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #5c6f66;">
              <span>Description</span>
              <span style="text-align: right;">Qty</span>
              <span style="text-align: right;">Unit price</span>
              <span style="text-align: right;">VAT %</span>
              <span style="text-align: right;">VAT</span>
              <span style="text-align: right;">Line total</span>
            </div>
            <div style="display: grid; grid-template-columns: 2fr 0.7fr 1fr 0.8fr 0.9fr 1fr; padding: 14px 16px; font-size: 14px; color: #183226; border-top: 1px solid #e1e8e3;">
              <span>Monthly bookkeeping<br/><span style=\"color:#52615a; font-size:12px;\">مسك دفاتر شهري</span></span>
              <span style="text-align: right;">1</span>
              <span style="text-align: right;">4,000.00</span>
              <span style="text-align: right;">15%</span>
              <span style="text-align: right;">600.00</span>
              <span style="text-align: right; font-weight: 700;">4,600.00</span>
            </div>
          </div>
          <div style="display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:16px;">
            <div style="padding:16px; border-radius:16px; background:#f9fbfa; border:1px solid #d8e5db;">
              <div style="font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#5c6f66;">Amount in words</div>
              <div style="margin-top:8px; line-height:1.8;">four thousand six hundred riyals<br/>فقط 4600 ريال</div>
            </div>
            <div>${payload.footer_html || "<span style=\"color:#52615a;\">Authorized by Gulf Hisab Finance Team</span>"}</div>
          </div>
        </section>
      </article>
    `.trim(),
  };
}

async function listMergedPreviewDocuments() {
  const overlayDocuments = await readOptionalJsonFile<PreviewDocument[]>(previewDocumentsPath, []);
  return mergeById(seededPreviewDocuments, overlayDocuments);
}

export async function listPreviewDocuments(filters: {
  group?: string | null;
  type?: string | null;
  status?: string | null;
  search?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  minTotal?: number | null;
  maxTotal?: number | null;
}) {
  const previewDocuments = await listMergedPreviewDocuments();

  return previewDocuments.filter((document) => {
    const inGroup = filters.group === "purchase"
      ? ["vendor_bill", "purchase_invoice", "purchase_order", "debit_note"].includes(document.type)
      : filters.group === "sales"
        ? ["tax_invoice", "quotation", "proforma_invoice", "cash_invoice", "recurring_invoice", "api_invoice"].includes(document.type)
        : true;
    const matchesType = filters.type ? document.type === filters.type : true;
    const matchesStatus = filters.status ? document.status === filters.status : true;
    const searchValue = `${document.document_number} ${document.title} ${document.contact.display_name}`.toLowerCase();
    const matchesSearch = filters.search ? searchValue.includes(filters.search.toLowerCase()) : true;
    const matchesFrom = filters.fromDate ? document.issue_date >= filters.fromDate : true;
    const matchesTo = filters.toDate ? document.issue_date <= filters.toDate : true;
    const matchesMin = typeof filters.minTotal === "number" ? document.grand_total >= filters.minTotal : true;
    const matchesMax = typeof filters.maxTotal === "number" ? document.grand_total <= filters.maxTotal : true;

    return inGroup && matchesType && matchesStatus && matchesSearch && matchesFrom && matchesTo && matchesMin && matchesMax;
  });
}

export async function getPreviewDocument(documentId: number) {
  const previewDocuments = await listMergedPreviewDocuments();
  return previewDocuments.find((document) => document.id === documentId) ?? null;
}

export async function getPreviewDocumentDetail(documentId: number) {
  const document = await getPreviewDocument(documentId);

  if (!document) {
    return null;
  }

  return {
    ...document,
    lines: document.lines?.length ? document.lines : [
      {
        id: documentId * 10 + 1,
        item_id: 301,
        ledger_account_id: document.type.includes("invoice") ? 4100 : 5100,
        cost_center_id: 11,
        description: document.title,
        quantity: 1,
        unit_price: document.taxable_total,
        gross_amount: document.taxable_total,
        metadata: { custom_fields: {} },
      },
    ],
  };
}

export async function getPreviewDocumentPreview(documentId: number, templateId?: number | null) {
  const document = await getPreviewDocument(documentId);

  if (!document) {
    return null;
  }

  const templates = await listPreviewTemplates();
  const template = templates.find((entry) => entry.id === templateId) ?? templates.find((entry) => entry.id === document.template?.id) ?? templates[0];
  const contacts = await listPreviewContacts();
  const contact = contacts.find((entry) => entry.id === document.contact_id) ?? null;
  const presentation = buildInvoicePresentation(document, template, contact);
  const qrDataUrl = await buildInvoiceQrDataUrl({
    sellerNameEn: presentation.sellerNameEn,
    sellerVat: presentation.sellerVat,
    issueDate: presentation.issueDate,
    grandTotal: presentation.grandTotal,
    vatTotal: presentation.vatTotal,
  });
  const sections = splitTemplateSections(template);
  const layout = getTemplateSetting(template, "layout", "classic");
  const watermarkLabel = template?.watermark_text || document.document_number;
  const watermarkEnabled = getBooleanSetting(template, "watermark_enabled", true);
  const watermarkMode = getTemplateSetting(template, "watermark_logo_mode", "full-width");
  const logoMarkup = presentation.logoUrl ? `<img src="${presentation.logoUrl}" alt="Company logo" style="max-width:150px; max-height:70px; object-fit:contain;" />` : "";
  const watermarkMarkup = !watermarkEnabled
    ? ""
    : presentation.logoUrl && watermarkMode !== "disabled"
      ? `<img src="${presentation.logoUrl}" alt="Watermark" style="position:absolute; inset:0; margin:auto; width:${watermarkMode === "centered" ? "42%" : "92%"}; opacity:0.1; filter:grayscale(0.15); z-index:0; pointer-events:none;" />`
      : `<div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:${watermarkMode === "centered" ? 56 : 88}px; font-weight:700; color:${template?.accent_color ?? "#1f7a53"}; opacity:0.08; z-index:0; pointer-events:none; text-transform:uppercase;">${escapeHtml(watermarkLabel)}</div>`;

  const sectionMarkup: Record<string, string> = {
    header: `
      <header style="padding: 24px; background: ${template?.accent_color ?? "#1f7a53"}; color: white; display: flex; justify-content: space-between; gap: 16px; align-items: flex-start;">
        <div>
          <div style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.88;">${document.type.replaceAll("_", " ")}</div>
          <h2 style="margin: 8px 0 0; font-size: ${layout === "legal" ? 22 : 26}px;">${document.document_number}</h2>
          <div style="margin-top:8px; font-size:12px; opacity:0.9;">Issue ${presentation.issueDate} · Supply ${presentation.supplyDate} · ${presentation.currencyCode}</div>
        </div>
        <div style="text-align:right; font-size:12px; line-height:1.7; opacity:0.94;">
          ${logoMarkup}
          <div style="font-weight:700; margin-top:${presentation.logoUrl ? 8 : 0}px;">${escapeHtml(presentation.sellerNameEn)}</div>
          <div dir="rtl">${escapeHtml(presentation.sellerNameAr)}</div>
          <div>VAT ${escapeHtml(presentation.sellerVat)}</div>
        </div>
      </header>
    `,
    "seller-buyer": `
      <div style="display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">
        <div style="padding:16px; border-radius:${layout === "legal" ? 8 : 16}px; background:#f3f7f4; border:${layout === "legal" ? "1px solid #d8e5db" : "0"};">
          <div style="font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#5c6f66;">Seller / البائع</div>
          <div style="margin-top:8px; display:grid; gap:6px; line-height:1.7; font-size:14px;">
            <div><strong>${escapeHtml(presentation.sellerNameEn)}</strong></div>
            <div dir="rtl">${escapeHtml(presentation.sellerNameAr)}</div>
            <div>${escapeHtml(presentation.sellerAddressEn)}</div>
            <div dir="rtl">${escapeHtml(presentation.sellerAddressAr)}</div>
            <div>VAT ${escapeHtml(presentation.sellerVat)}</div>
          </div>
        </div>
        <div style="padding:16px; border-radius:${layout === "legal" ? 8 : 16}px; background:#ffffff; border:1px solid #d8e5db;">
          <div style="font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#5c6f66;">Buyer / المشتري</div>
          <div style="margin-top:8px; display:grid; gap:6px; line-height:1.7; font-size:14px;">
            <div><strong>${escapeHtml(presentation.buyerNameEn)}</strong></div>
            <div dir="rtl">${escapeHtml(presentation.buyerNameAr)}</div>
            <div>${escapeHtml(presentation.buyerAddressEn)}</div>
            <div dir="rtl">${escapeHtml(presentation.buyerAddressAr)}</div>
            <div>${presentation.buyerVat ? `VAT ${escapeHtml(presentation.buyerVat)}` : "VAT pending"}</div>
          </div>
        </div>
      </div>
    `,
    items: `
      <div style="border: 1px solid #e1e8e3; border-radius:${layout === "legal" ? 8 : 18}px; overflow: hidden;">
        <div style="display: grid; grid-template-columns: 2fr 0.7fr 1fr 0.8fr 0.9fr 1fr; background: #f4f8f5; padding: 12px 16px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #5c6f66;">
          <span>Description</span>
          <span style="text-align: right;">Qty</span>
          <span style="text-align: right;">Unit</span>
          <span style="text-align: right;">VAT %</span>
          <span style="text-align: right;">VAT</span>
          <span style="text-align: right;">Line total</span>
        </div>
        ${(document.lines ?? []).map((line) => `
          <div style="display: grid; grid-template-columns: 2fr 0.7fr 1fr 0.8fr 0.9fr 1fr; padding: 14px 16px; font-size: 14px; color: #183226; border-top: 1px solid #e1e8e3;">
            <span>${escapeHtml(line.description)}${textValue(line.metadata?.custom_fields?.description_ar) ? `<br/><span dir=\"rtl\" style=\"color:#52615a; font-size:12px;\">${escapeHtml(textValue(line.metadata?.custom_fields?.description_ar))}</span>` : ""}</span>
            <span style="text-align: right;">${line.quantity}</span>
            <span style="text-align: right;">${currencyValue(line.unit_price, presentation.currencyCode)}</span>
            <span style="text-align: right;">${getLineVatRate(line).toFixed(2)}%</span>
            <span style="text-align: right;">${currencyValue(getLineVatAmount(line), presentation.currencyCode)}</span>
            <span style="text-align: right; font-weight: 700;">${currencyValue(getLineTotal(line), presentation.currencyCode)}</span>
          </div>
        `).join("")}
      </div>
    `,
    totals: `
      <div style="display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:16px; align-items:start;">
        <div style="padding:16px; border-radius:${layout === "legal" ? 8 : 16}px; background:#f9fbfa; border:1px solid #d8e5db; line-height:1.8;">
          <div style="font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#5c6f66;">Amount in words</div>
          <div style="margin-top:8px; font-size:14px; color:#183226;">${escapeHtml(presentation.amountWordsEn)}</div>
          <div style="margin-top:4px; font-size:14px; color:#183226;" dir="rtl">${escapeHtml(presentation.amountWordsAr)}</div>
        </div>
        <div style="padding:16px; border-radius:${layout === "legal" ? 8 : 16}px; border:1px solid #d8e5db; background:#ffffff;">
          <div style="display:grid; gap:8px; font-size:14px; color:#52615a;">
            <div style="display:flex; justify-content:space-between; gap:16px;"><span>Subtotal</span><strong style="color:#183226;">${currencyValue(presentation.subtotal, presentation.currencyCode)}</strong></div>
            <div style="display:flex; justify-content:space-between; gap:16px;"><span>VAT total</span><strong style="color:#183226;">${currencyValue(presentation.vatTotal, presentation.currencyCode)}</strong></div>
            <div style="display:flex; justify-content:space-between; gap:16px; font-size:16px;"><span>Grand total</span><strong style="color:#183226;">${currencyValue(presentation.grandTotal, presentation.currencyCode)}</strong></div>
          </div>
        </div>
      </div>
    `,
    qr: `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; border:1px solid #d8e5db; border-radius:${layout === "legal" ? 8 : 18}px; padding:16px; background:#fcfefd;">
        <div style="font-size:14px; color:#52615a; line-height:1.8;">
          <div style="font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#5c6f66; margin-bottom:6px;">ZATCA compliance</div>
          <div>Seller VAT: ${escapeHtml(presentation.sellerVat)}</div>
          <div>Issue date: ${escapeHtml(presentation.issueDate)}</div>
          <div>Supply date: ${escapeHtml(presentation.supplyDate)}</div>
          <div>Currency: ${escapeHtml(presentation.currencyCode)}</div>
        </div>
        <img src="${qrDataUrl}" alt="ZATCA QR" style="width:148px; height:148px; object-fit:contain; background:white; padding:8px; border-radius:12px; border:1px solid #d8e5db;" />
      </div>
    `,
    footer: `
      <div style="display:grid; gap:12px; color:#52615a;">${template?.footer_html || "<span>Generated from Gulf Hisab template engine.</span>"}${document.notes ? `<div style=\"padding:16px; border-radius:16px; background:#f3f7f4;\">${escapeHtml(document.notes)}</div>` : ""}</div>
    `,
  };

  return {
    html: `
      <article style="font-family: ui-sans-serif, system-ui; color: #183226; border: 1px solid #d8e5db; border-radius: 24px; overflow: hidden; background: #ffffff; position:relative;">
        ${watermarkMarkup}
        <section style="display:grid; gap:12px; position:relative; z-index:1;">
          ${sections.map((section) => sectionMarkup[section] ?? "").join("")}
        </section>
      </article>
    `.trim(),
  };
}

function sanitizePdfText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizePdfFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function wrapPdfText(text: string, maxLength: number) {
  const words = sanitizePdfText(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length ? lines : [""];
}

export async function getPreviewDocumentPdf(documentId: number) {
  const document = await getPreviewDocumentDetail(documentId);

  if (!document) {
    return null;
  }

  const templates = await listPreviewTemplates();
  const template = templates.find((entry) => entry.id === document.template?.id) ?? templates[0];
  const contacts = await listPreviewContacts();
  const contact = contacts.find((entry) => entry.id === document.contact_id) ?? null;
  const presentation = buildInvoicePresentation(document, template, contact);
  const qrDataUrl = await buildInvoiceQrDataUrl({
    sellerNameEn: presentation.sellerNameEn,
    sellerVat: presentation.sellerVat,
    issueDate: presentation.issueDate,
    grandTotal: presentation.grandTotal,
    vatTotal: presentation.vatTotal,
  });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const margin = 48;
  let y = pageHeight - margin;

  const qrImage = await pdf.embedPng(decodeDataUrl(qrDataUrl).bytes);
  const logoImage = presentation.logoUrl ? await (async () => {
    const decoded = decodeDataUrl(presentation.logoUrl);
    return decoded.mimeType.includes("png") ? pdf.embedPng(decoded.bytes) : pdf.embedJpg(decoded.bytes);
  })() : null;

  const drawTextBlock = (text: string, x: number, maxLength: number, size = 11, bold = false, color = rgb(0.12, 0.2, 0.15)) => {
    wrapPdfText(text, maxLength).forEach((line) => {
      page.drawText(line, {
        x,
        y,
        size,
        font: bold ? boldFont : regularFont,
        color,
      });
      y -= size + 4;
    });
  };

  page.drawRectangle({
    x: 0,
    y: pageHeight - 122,
    width: pageWidth,
    height: 122,
    color: rgb(0.12, 0.48, 0.33),
  });

  if (logoImage) {
    page.drawImage(logoImage, {
      x: pageWidth - margin - 94,
      y: pageHeight - 96,
      width: 72,
      height: 48,
      opacity: 1,
    });
  }

  page.drawText(document.document_number, {
    x: margin,
    y: pageHeight - 62,
    size: 22,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText(document.type.replaceAll("_", " ").toUpperCase(), {
    x: margin,
    y: pageHeight - 34,
    size: 10,
    font: boldFont,
    color: rgb(0.92, 0.98, 0.95),
  });

  page.drawText(presentation.sellerNameEn, {
    x: pageWidth - margin - 170,
    y: pageHeight - 34,
    size: 10,
    font: boldFont,
    color: rgb(0.92, 0.98, 0.95),
  });

  page.drawText(`VAT ${presentation.sellerVat}`, {
    x: pageWidth - margin - 170,
    y: pageHeight - 50,
    size: 10,
    font: regularFont,
    color: rgb(0.92, 0.98, 0.95),
  });

  y = pageHeight - 152;
  drawTextBlock(`Seller: ${presentation.sellerNameEn}`, margin, 48, 11, true);
  drawTextBlock(`Buyer: ${presentation.buyerNameEn}`, margin, 48, 11, true);
  drawTextBlock(`Supply date: ${presentation.supplyDate}`, margin, 48);
  drawTextBlock(`Currency: ${presentation.currencyCode}`, margin, 48);

  y -= 10;
  drawTextBlock(`Subtotal: ${presentation.subtotal.toFixed(2)} ${presentation.currencyCode}`, pageWidth - margin - 190, 32, 11, true);
  drawTextBlock(`VAT: ${presentation.vatTotal.toFixed(2)} ${presentation.currencyCode}`, pageWidth - margin - 190, 32);
  drawTextBlock(`Total: ${presentation.grandTotal.toFixed(2)} ${presentation.currencyCode}`, pageWidth - margin - 190, 32, 13, true);
  drawTextBlock(`Amount in words: ${presentation.amountWordsEn}`, pageWidth - margin - 190, 32);

  y -= 12;
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1,
    color: rgb(0.85, 0.9, 0.87),
  });
  y -= 22;

  const columnX = {
    description: margin,
    quantity: 300,
    unit: 350,
    vatRate: 405,
    vatAmount: 455,
    gross: 515,
  };

  page.drawText("Description", { x: columnX.description, y, size: 10, font: boldFont, color: rgb(0.36, 0.44, 0.4) });
  page.drawText("Qty", { x: columnX.quantity, y, size: 10, font: boldFont, color: rgb(0.36, 0.44, 0.4) });
  page.drawText("Unit", { x: columnX.unit, y, size: 10, font: boldFont, color: rgb(0.36, 0.44, 0.4) });
  page.drawText("VAT%", { x: columnX.vatRate, y, size: 10, font: boldFont, color: rgb(0.36, 0.44, 0.4) });
  page.drawText("VAT", { x: columnX.vatAmount, y, size: 10, font: boldFont, color: rgb(0.36, 0.44, 0.4) });
  page.drawText("Total", { x: columnX.gross, y, size: 10, font: boldFont, color: rgb(0.36, 0.44, 0.4) });
  y -= 18;

  document.lines.forEach((line) => {
    const description = textValue(line.metadata?.custom_fields?.description_ar)
      ? `${line.description} / ${textValue(line.metadata?.custom_fields?.description_ar)}`
      : line.description;
    const wrappedDescription = wrapPdfText(description, 28);
    const rowHeight = Math.max(18, wrappedDescription.length * 14);

    wrappedDescription.forEach((segment, index) => {
      page.drawText(segment, {
        x: columnX.description,
        y: y - (index * 14),
        size: 10,
        font: regularFont,
        color: rgb(0.12, 0.2, 0.15),
      });
    });

    page.drawText(String(line.quantity), { x: columnX.quantity, y, size: 10, font: regularFont, color: rgb(0.12, 0.2, 0.15) });
    page.drawText(`${line.unit_price.toFixed(2)}`, { x: columnX.unit, y, size: 10, font: regularFont, color: rgb(0.12, 0.2, 0.15) });
  page.drawText(`${getLineVatRate(line).toFixed(2)}%`, { x: columnX.vatRate, y, size: 10, font: regularFont, color: rgb(0.12, 0.2, 0.15) });
  page.drawText(`${getLineVatAmount(line).toFixed(2)}`, { x: columnX.vatAmount, y, size: 10, font: regularFont, color: rgb(0.12, 0.2, 0.15) });
  page.drawText(`${getLineTotal(line).toFixed(2)}`, { x: columnX.gross, y, size: 10, font: boldFont, color: rgb(0.12, 0.2, 0.15) });

    y -= rowHeight;
    page.drawLine({
      start: { x: margin, y: y + 6 },
      end: { x: pageWidth - margin, y: y + 6 },
      thickness: 0.75,
      color: rgb(0.9, 0.93, 0.91),
    });
    y -= 10;
  });

  if (document.notes) {
    y -= 6;
    drawTextBlock("Notes", margin, 50, 11, true);
    drawTextBlock(document.notes, margin, 78);
  }

  if (document.compliance_metadata?.zatca) {
    y -= 8;
    drawTextBlock("ZATCA seller information", margin, 50, 11, true);
    drawTextBlock(`${presentation.sellerNameEn} | VAT ${presentation.sellerVat}`, margin, 78);
  }

  page.drawImage(qrImage, {
    x: pageWidth - margin - 92,
    y: 54,
    width: 88,
    height: 88,
  });

  const bytes = await pdf.save();
  return {
    bytes,
    fileName: `${sanitizePdfFileName(document.document_number || `document-${document.id}`)}.pdf`,
  };
}

function isSalesDocument(type: string) {
  return ["tax_invoice", "quotation", "proforma_invoice", "cash_invoice", "recurring_invoice", "api_invoice"].includes(type);
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function calculateDocumentTotals(lines: Array<{ quantity: number; unit_price: number; custom_fields?: Record<string, string | number | boolean | null> }>) {
  const subtotal = roundCurrency(lines.reduce((sum, line) => sum + (Number(line.quantity) * Number(line.unit_price)), 0));
  const taxTotal = roundCurrency(lines.reduce((sum, line) => {
    const vatRate = numericValue(line.custom_fields?.vat_rate, 15);
    return sum + (Number(line.quantity) * Number(line.unit_price) * (vatRate / 100));
  }, 0));

  return {
    subtotal,
    taxTotal,
    grandTotal: roundCurrency(subtotal + taxTotal),
  };
}

async function saveOverlayDocument(document: PreviewDocument) {
  const overlayDocuments = await readOptionalJsonFile<PreviewDocument[]>(previewDocumentsPath, []);
  const nextDocuments = overlayDocuments.some((item) => item.id === document.id)
    ? overlayDocuments.map((item) => item.id === document.id ? document : item)
    : [document, ...overlayDocuments];
  await writeJsonFile(previewDocumentsPath, nextDocuments);
}

async function saveOverlayPayment(payment: PreviewPayment) {
  const overlayPayments = await readOptionalJsonFile<PreviewPayment[]>(previewPaymentsPath, []);
  await writeJsonFile(previewPaymentsPath, [payment, ...overlayPayments]);
}

export async function createPreviewDocument(
  kind: "sales" | "purchase",
  payload: {
    type?: string;
    title?: string | null;
    template_id?: number | null;
    language_code?: string | null;
    custom_fields?: Record<string, string | number | boolean | null>;
    contact_id: number;
    issue_date: string;
    due_date: string;
    notes?: string | null;
    lines: Array<{
      item_id?: number | null;
      description?: string | null;
      quantity: number;
      unit_price: number;
      cost_center_id?: number | null;
      custom_fields?: Record<string, string | number | boolean | null>;
    }>;
  },
) {
  const documents = await listMergedPreviewDocuments();
  const contacts = await listPreviewContacts();
  const templates = await listPreviewTemplates();
  const nextId = Math.max(...documents.map((document) => document.id), kind === "sales" ? 1100 : 2100) + 1;
  const totals = calculateDocumentTotals(payload.lines.map((line) => ({
    quantity: line.quantity,
    unit_price: line.unit_price,
    custom_fields: line.custom_fields,
  })));
  const reference = String(payload.custom_fields?.reference ?? "").trim();
  const documentPrefix = kind === "sales" ? "INV" : "BILL";
  const contact = contacts.find((item) => item.id === payload.contact_id);
  const template = templates.find((item) => item.id === payload.template_id);
  const nextDocument: PreviewDocument = {
    id: nextId,
    type: payload.type ?? (kind === "sales" ? "tax_invoice" : "vendor_bill"),
    status: "draft",
    contact_id: payload.contact_id,
    document_number: reference || `${documentPrefix}-2026-${nextId}`,
    issue_date: payload.issue_date,
    due_date: payload.due_date,
    grand_total: totals.grandTotal,
    balance_due: totals.grandTotal,
    paid_total: 0,
    tax_total: totals.taxTotal,
    taxable_total: totals.subtotal,
    contact: { display_name: contact?.display_name ?? "Unknown contact" },
    title: payload.title?.trim() || (kind === "sales" ? "Preview invoice" : "Preview bill"),
    language_code: payload.language_code ?? "en",
    sent_at: null,
    sent_to_email: contact?.email ?? null,
    custom_fields: payload.custom_fields ?? {},
    template: template ? { id: template.id, name: template.name } : null,
    notes: payload.notes ?? "",
    compliance_metadata: kind === "sales"
      ? { zatca: { seller_name: previewCompany.sellerName, vat_number: previewCompany.vatNumber } }
      : null,
    lines: payload.lines.map((line, index) => ({
      id: nextId * 10 + index + 1,
      item_id: line.item_id ?? null,
      ledger_account_id: kind === "sales" ? 4100 : 5100,
      cost_center_id: line.cost_center_id ?? null,
      description: line.description?.trim() || "Line item",
      quantity: Number(line.quantity),
      unit_price: Number(line.unit_price),
      gross_amount: roundCurrency(Number(line.quantity) * Number(line.unit_price)),
      metadata: { custom_fields: line.custom_fields ?? {} },
    })),
  };

  await saveOverlayDocument(nextDocument);
  return nextDocument;
}

export async function updatePreviewDocument(
  documentId: number,
  kind: "sales" | "purchase",
  payload: Parameters<typeof createPreviewDocument>[1],
) {
  const current = await getPreviewDocument(documentId);

  if (!current) {
    return null;
  }

  const contacts = await listPreviewContacts();
  const templates = await listPreviewTemplates();
  const totals = calculateDocumentTotals(payload.lines.map((line) => ({
    quantity: line.quantity,
    unit_price: line.unit_price,
    custom_fields: line.custom_fields,
  })));
  const contact = contacts.find((item) => item.id === payload.contact_id);
  const template = templates.find((item) => item.id === payload.template_id);
  const updated: PreviewDocument = {
    ...current,
    type: payload.type ?? current.type,
    contact_id: payload.contact_id,
    issue_date: payload.issue_date,
    due_date: payload.due_date,
    grand_total: totals.grandTotal,
    tax_total: totals.taxTotal,
    taxable_total: totals.subtotal,
    balance_due: roundCurrency(Math.max(totals.grandTotal - current.paid_total, 0)),
    contact: { display_name: contact?.display_name ?? current.contact.display_name },
    title: payload.title?.trim() || current.title,
    language_code: payload.language_code ?? current.language_code,
    sent_to_email: contact?.email ?? current.sent_to_email ?? null,
    custom_fields: payload.custom_fields ?? current.custom_fields,
    template: template ? { id: template.id, name: template.name } : current.template,
    notes: payload.notes ?? current.notes,
    compliance_metadata: kind === "sales"
      ? { zatca: { seller_name: previewCompany.sellerName, vat_number: previewCompany.vatNumber } }
      : null,
    lines: payload.lines.map((line, index) => ({
      id: current.id * 10 + index + 1,
      item_id: line.item_id ?? null,
      ledger_account_id: kind === "sales" ? 4100 : 5100,
      cost_center_id: line.cost_center_id ?? null,
      description: line.description?.trim() || "Line item",
      quantity: Number(line.quantity),
      unit_price: Number(line.unit_price),
      gross_amount: roundCurrency(Number(line.quantity) * Number(line.unit_price)),
      metadata: { custom_fields: line.custom_fields ?? {} },
    })),
  };

  await saveOverlayDocument(updated);
  return updated;
}

export async function finalizePreviewDocument(documentId: number) {
  const current = await getPreviewDocument(documentId);

  if (!current) {
    return null;
  }

  const nextStatus = isSalesDocument(current.type) ? "finalized" : "posted";
  const updated: PreviewDocument = {
    ...current,
    status: nextStatus,
  };

  await saveOverlayDocument(updated);
  return updated;
}

export async function duplicatePreviewDocument(documentId: number) {
  const current = await getPreviewDocumentDetail(documentId);

  if (!current) {
    return null;
  }

  const kind = isSalesDocument(current.type) ? "sales" : "purchase";
  return createPreviewDocument(kind, {
    type: current.type,
    title: `${current.title} Copy`,
    template_id: current.template?.id ?? null,
    language_code: current.language_code,
    custom_fields: {
      ...(current.custom_fields ?? {}),
      reference: `${current.document_number}-COPY`,
    },
    contact_id: current.contact_id,
    issue_date: current.issue_date,
    due_date: current.due_date,
    notes: current.notes,
    lines: (current.lines ?? []).map((line) => ({
      item_id: line.item_id ?? null,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      cost_center_id: line.cost_center_id ?? null,
      custom_fields: line.metadata?.custom_fields ?? {},
    })),
  });
}

export async function sendPreviewDocument(documentId: number, payload?: { email?: string | null; subject?: string | null }) {
  const current = await getPreviewDocument(documentId);

  if (!current) {
    return null;
  }

  const updated: PreviewDocument = {
    ...current,
    status: current.status === "draft" ? "finalized" : current.status,
    sent_at: new Date().toISOString(),
    sent_to_email: payload?.email?.trim() || current.sent_to_email || current.contact.email || null,
  };

  await saveOverlayDocument(updated);
  return getPreviewDocumentDetail(updated.id);
}

export async function listPreviewPayments() {
  const overlayPayments = await readOptionalJsonFile<PreviewPayment[]>(previewPaymentsPath, []);
  return mergeById(seededPreviewPayments, overlayPayments);
}

export async function createPreviewPayment(
  documentId: number,
  direction: "incoming" | "outgoing",
  payload: {
    amount: number;
    payment_date: string;
    method?: string | null;
    reference?: string | null;
  },
) {
  const payments = await listPreviewPayments();
  const current = await getPreviewDocument(documentId);

  if (!current) {
    return null;
  }

  const nextPayment: PreviewPayment = {
    id: Math.max(...payments.map((payment) => payment.id), 5000) + 1,
    direction,
    status: "posted",
    payment_number: `PAY-2026-${Math.max(...payments.map((payment) => payment.id), 5000) + 1}`,
    payment_date: payload.payment_date,
    amount: roundCurrency(payload.amount),
    allocated_total: roundCurrency(payload.amount),
    unallocated_amount: 0,
    method: payload.method ?? null,
    reference: payload.reference ?? null,
    document_id: current.id,
    document_number: current.document_number,
    contact_name: current.contact.display_name,
  };

  const paidTotal = roundCurrency(current.paid_total + nextPayment.amount);
  const balanceDue = roundCurrency(Math.max(current.grand_total - paidTotal, 0));
  const updatedDocument: PreviewDocument = {
    ...current,
    paid_total: paidTotal,
    balance_due: balanceDue,
    status: balanceDue <= 0 ? "paid" : current.status === "draft" ? "finalized" : current.status,
  };

  await saveOverlayDocument(updatedDocument);
  await saveOverlayPayment(nextPayment);
  return nextPayment;
}

export async function listPreviewInvoiceRegister() {
  return listPreviewDocuments({ group: "sales", type: "tax_invoice" });
}

export async function listPreviewBillsRegister() {
  return listPreviewDocuments({ group: "purchase" });
}

export async function listPreviewGeneralLedger() {
  const documents = await listMergedPreviewDocuments();
  const payments = await listPreviewPayments();
  const rows: Array<{
    id: number;
    entry_number: string;
    entry_date: string;
    account_code: string;
    account_name: string;
    contact_name: string;
    document_number: string;
    cost_center_code: string;
    cost_center_name: string;
    description: string;
    debit: number;
    credit: number;
    running_balance: number;
  }> = [];
  let runningId = 7000;

  documents.filter((document) => document.status !== "draft").forEach((document) => {
    const isSales = isSalesDocument(document.type);
    if (isSales) {
      rows.push(
        {
          id: ++runningId,
          entry_number: `GL-2026-${runningId}`,
          entry_date: document.issue_date,
          account_code: "1100",
          account_name: "Accounts Receivable",
          contact_name: document.contact.display_name,
          document_number: document.document_number,
          cost_center_code: "SALES",
          cost_center_name: "Sales",
          description: "Invoice posted",
          debit: document.grand_total,
          credit: 0,
          running_balance: 0,
        },
        {
          id: ++runningId,
          entry_number: `GL-2026-${runningId}`,
          entry_date: document.issue_date,
          account_code: "4100",
          account_name: "Consulting Revenue",
          contact_name: document.contact.display_name,
          document_number: document.document_number,
          cost_center_code: "SALES",
          cost_center_name: "Sales",
          description: "Invoice revenue",
          debit: 0,
          credit: document.taxable_total,
          running_balance: 0,
        },
        {
          id: ++runningId,
          entry_number: `GL-2026-${runningId}`,
          entry_date: document.issue_date,
          account_code: "2200",
          account_name: "VAT Payable",
          contact_name: document.contact.display_name,
          document_number: document.document_number,
          cost_center_code: "VAT",
          cost_center_name: "VAT",
          description: "Sales VAT",
          debit: 0,
          credit: document.tax_total,
          running_balance: 0,
        },
      );
      return;
    }

    rows.push(
      {
        id: ++runningId,
        entry_number: `GL-2026-${runningId}`,
        entry_date: document.issue_date,
        account_code: "5100",
        account_name: "Office Supplies",
        contact_name: document.contact.display_name,
        document_number: document.document_number,
        cost_center_code: "OPS",
        cost_center_name: "Operations",
        description: "Purchase expense",
        debit: document.taxable_total,
        credit: 0,
        running_balance: 0,
      },
      {
        id: ++runningId,
        entry_number: `GL-2026-${runningId}`,
        entry_date: document.issue_date,
        account_code: "1300",
        account_name: "VAT Receivable",
        contact_name: document.contact.display_name,
        document_number: document.document_number,
        cost_center_code: "VAT",
        cost_center_name: "VAT",
        description: "Purchase VAT",
        debit: document.tax_total,
        credit: 0,
        running_balance: 0,
      },
      {
        id: ++runningId,
        entry_number: `GL-2026-${runningId}`,
        entry_date: document.issue_date,
        account_code: "2100",
        account_name: "Accounts Payable",
        contact_name: document.contact.display_name,
        document_number: document.document_number,
        cost_center_code: "OPS",
        cost_center_name: "Operations",
        description: "Vendor bill posted",
        debit: 0,
        credit: document.grand_total,
        running_balance: 0,
      },
    );
  });

  payments.forEach((payment) => {
    const isIncoming = payment.direction === "incoming";
    rows.push(
      {
        id: ++runningId,
        entry_number: `GL-2026-${runningId}`,
        entry_date: payment.payment_date,
        account_code: isIncoming ? "1210" : "2100",
        account_name: isIncoming ? "Bank Account" : "Accounts Payable",
        contact_name: payment.contact_name ?? "",
        document_number: payment.payment_number,
        cost_center_code: isIncoming ? "CASH" : "OPS",
        cost_center_name: isIncoming ? "Cash" : "Operations",
        description: isIncoming ? "Incoming payment allocation" : "Outgoing payment allocation",
        debit: payment.amount,
        credit: 0,
        running_balance: 0,
      },
      {
        id: ++runningId,
        entry_number: `GL-2026-${runningId}`,
        entry_date: payment.payment_date,
        account_code: isIncoming ? "1100" : "1210",
        account_name: isIncoming ? "Accounts Receivable" : "Bank Account",
        contact_name: payment.contact_name ?? "",
        document_number: payment.payment_number,
        cost_center_code: isIncoming ? "SALES" : "CASH",
        cost_center_name: isIncoming ? "Sales" : "Cash",
        description: isIncoming ? "Receivable settled" : "Cash paid out",
        debit: 0,
        credit: payment.amount,
        running_balance: 0,
      },
    );
  });

  return rows;
}

export async function listPreviewTrialBalance() {
  const ledger = await listPreviewGeneralLedger();
  const accounts = new Map<string, { code: string; name: string; type: string; debit_total: number; credit_total: number; balance: number }>();

  const accountMeta: Record<string, { name: string; type: string }> = {
    "1100": { name: "Accounts Receivable", type: "asset" },
    "1210": { name: "Bank Account", type: "asset" },
    "1300": { name: "VAT Receivable", type: "asset" },
    "2100": { name: "Accounts Payable", type: "liability" },
    "2200": { name: "VAT Payable", type: "liability" },
    "4100": { name: "Consulting Revenue", type: "income" },
    "5100": { name: "Office Supplies", type: "expense" },
  };

  ledger.forEach((row) => {
    const meta = accountMeta[row.account_code] ?? { name: row.account_name, type: "asset" };
    const current = accounts.get(row.account_code) ?? { code: row.account_code, name: meta.name, type: meta.type, debit_total: 0, credit_total: 0, balance: 0 };
    current.debit_total = roundCurrency(current.debit_total + row.debit);
    current.credit_total = roundCurrency(current.credit_total + row.credit);
    current.balance = roundCurrency(current.debit_total - current.credit_total);
    accounts.set(row.account_code, current);
  });

  return [...accounts.values()].sort((left, right) => left.code.localeCompare(right.code));
}

export async function listPreviewAuditTrail() {
  const documents = await listMergedPreviewDocuments();
  const payments = await listPreviewPayments();
  const events = documents.map((document) => ({
    id: 9000 + document.id,
    event: document.status === "draft" ? "documents.created" : "documents.finalized",
    auditable_type: "App\\Models\\Document",
    auditable_id: document.id,
    created_at: `${document.issue_date}T09:00:00Z`,
  }));
  const paymentEvents = payments.map((payment) => ({
    id: 9500 + payment.id,
    event: "payments.recorded",
    auditable_type: "App\\Models\\Payment",
    auditable_id: payment.id,
    created_at: `${payment.payment_date}T11:00:00Z`,
  }));

  return [...events, ...paymentEvents].sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export function listPreviewCustomFieldDefinitions() {
  return previewCustomFields;
}

export function listPreviewCostCenters() {
  return previewCostCenters;
}

export async function listPreviewVatSummary() {
  const documents = await listMergedPreviewDocuments();
  const postedDocuments = documents.filter((document) => document.status !== "draft");
  const outputTaxableAmount = postedDocuments.filter((document) => isSalesDocument(document.type)).reduce((sum, document) => sum + document.taxable_total, 0);
  const outputTaxAmount = postedDocuments.filter((document) => isSalesDocument(document.type)).reduce((sum, document) => sum + document.tax_total, 0);
  const inputTaxableAmount = postedDocuments.filter((document) => !isSalesDocument(document.type)).reduce((sum, document) => sum + document.taxable_total, 0);
  const inputTaxAmount = postedDocuments.filter((document) => !isSalesDocument(document.type)).reduce((sum, document) => sum + document.tax_total, 0);

  return [
    {
      code: "S15",
      name: "Standard VAT",
      tax_rate: 15,
      taxable_amount: roundCurrency(outputTaxableAmount + inputTaxableAmount),
      tax_amount: roundCurrency(outputTaxAmount + inputTaxAmount),
    },
  ];
}

export async function listPreviewVatDetail() {
  const documents = await listMergedPreviewDocuments();
  const postedDocuments = documents.filter((document) => document.status !== "draft");
  return [
    {
      code: "S15",
      name: "Standard VAT",
      tax_rate: 15,
      output_taxable_amount: roundCurrency(postedDocuments.filter((document) => isSalesDocument(document.type)).reduce((sum, document) => sum + document.taxable_total, 0)),
      output_tax_amount: roundCurrency(postedDocuments.filter((document) => isSalesDocument(document.type)).reduce((sum, document) => sum + document.tax_total, 0)),
      input_taxable_amount: roundCurrency(postedDocuments.filter((document) => !isSalesDocument(document.type)).reduce((sum, document) => sum + document.taxable_total, 0)),
      input_tax_amount: roundCurrency(postedDocuments.filter((document) => !isSalesDocument(document.type)).reduce((sum, document) => sum + document.tax_total, 0)),
    },
  ];
}

function agingBucket(issueDate: string, dueDate: string) {
  if (dueDate >= issueDate) {
    return "current";
  }

  return "1_30";
}

export async function listPreviewReceivablesAging() {
  const invoices = await listPreviewInvoiceRegister();
  return invoices
    .filter((invoice) => invoice.balance_due > 0)
    .map((invoice) => ({
      document_number: invoice.document_number,
      balance_due: invoice.balance_due,
      bucket: agingBucket(invoice.issue_date, invoice.due_date),
    }));
}

export async function listPreviewPayablesAging() {
  const bills = await listPreviewBillsRegister();
  return bills
    .filter((bill) => bill.balance_due > 0)
    .map((bill) => ({
      document_number: bill.document_number,
      balance_due: bill.balance_due,
      bucket: agingBucket(bill.issue_date, bill.due_date),
    }));
}

export async function getPreviewProfitLoss() {
  const trialBalance = await listPreviewTrialBalance();
  const lines = trialBalance
    .filter((row) => row.type === "income" || row.type === "expense")
    .map((row) => ({
      code: row.code,
      name: row.name,
      type: row.type,
      net_amount: row.type === "income" ? Math.abs(row.balance) : row.balance,
    }));
  const revenueTotal = lines.filter((row) => row.type === "income").reduce((sum, row) => sum + row.net_amount, 0);
  const expenseTotal = lines.filter((row) => row.type === "expense").reduce((sum, row) => sum + row.net_amount, 0);

  return {
    lines,
    revenue_total: roundCurrency(revenueTotal),
    expense_total: roundCurrency(expenseTotal),
    net_profit: roundCurrency(revenueTotal - expenseTotal),
  };
}

export async function getPreviewBalanceSheet() {
  const trialBalance = await listPreviewTrialBalance();
  const assets = trialBalance.filter((row) => row.type === "asset").map((row) => ({ code: row.code, name: row.name, type: row.type, balance: row.balance }));
  const liabilities = trialBalance.filter((row) => row.type === "liability").map((row) => ({ code: row.code, name: row.name, type: row.type, balance: Math.abs(row.balance) }));
  const profitLoss = await getPreviewProfitLoss();
  const equity = [
    {
      code: "3200",
      name: "Retained Earnings",
      type: "equity",
      balance: roundCurrency(profitLoss.net_profit),
    },
  ];

  return {
    assets,
    liabilities,
    equity,
    asset_total: roundCurrency(assets.reduce((sum, row) => sum + row.balance, 0)),
    liability_total: roundCurrency(liabilities.reduce((sum, row) => sum + row.balance, 0)),
    equity_total: roundCurrency(equity.reduce((sum, row) => sum + row.balance, 0)),
  };
}

export async function listPreviewProfitByCustomer() {
  const documents = await listPreviewInvoiceRegister();
  return documents.map((document) => ({
    contact_id: document.contact_id,
    contact_name: document.contact.display_name,
    revenue: document.taxable_total,
    estimated_cost: roundCurrency(document.taxable_total * 0.35),
    profit: roundCurrency(document.taxable_total * 0.65),
  }));
}

export async function listPreviewProfitByProduct() {
  const documents = await listPreviewInvoiceRegister();
  const items = await listPreviewItems();
  const totals = new Map<number, { item_id: number; item_name: string; quantity: number; revenue: number; estimated_cost: number; profit: number }>();

  documents.forEach((document) => {
    (document.lines ?? []).forEach((line) => {
      const itemId = line.item_id ?? 0;
      const item = items.find((entry) => entry.id === itemId);
      const quantity = Number(line.quantity);
      const revenue = Number(line.gross_amount);
      const estimatedCost = roundCurrency(quantity * Number(item?.default_purchase_price ?? 0));
      const current = totals.get(itemId) ?? {
        item_id: itemId,
        item_name: item?.name ?? line.description,
        quantity: 0,
        revenue: 0,
        estimated_cost: 0,
        profit: 0,
      };
      current.quantity += quantity;
      current.revenue = roundCurrency(current.revenue + revenue);
      current.estimated_cost = roundCurrency(current.estimated_cost + estimatedCost);
      current.profit = roundCurrency(current.revenue - current.estimated_cost);
      totals.set(itemId, current);
    });
  });

  return [...totals.values()];
}

export async function listPreviewExpenseBreakdown() {
  const bills = await listPreviewBillsRegister();
  return [
    {
      category_code: "5100",
      category_name: "Office Supplies",
      total: roundCurrency(bills.reduce((sum, bill) => sum + bill.taxable_total, 0)),
    },
  ];
}