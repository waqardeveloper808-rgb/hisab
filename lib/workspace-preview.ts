import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import QRCode from "qrcode";
import { defaultChartOfAccounts } from "@/lib/accounting-engine";
import {
  buildDocumentHtml as buildUnifiedDocumentHtml,
  buildInvoiceRenderModel,
  renderDocumentPdf,
} from "@/lib/document-engine";
import { processLogoImage } from "@/lib/logo-intelligence";
import type { Attachment } from "@/lib/accounting-engine";
import { previewCompany } from "@/data/preview-company";
import {
  WSV2_TEMPLATE_AR_FONT_STACK,
  WSV2_TEMPLATE_LATIN_FONT_STACK,
} from "@/lib/workspace/template-font-stacks";

export type PreviewContact = {
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

export type PreviewTemplate = {
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
  type: "product" | "service" | "raw_material" | "finished_good";
  name: string;
  sku?: string | null;
  default_sale_price?: number | null;
  default_purchase_price?: number | null;
  tax_category?: {
    name?: string | null;
    rate?: number | null;
  } | null;
};

export type PreviewDocumentLine = {
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

export type PreviewDocument = {
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
  source_document_id?: number | null;
  reversal_of_document_id?: number | null;
  version?: number | null;
  status_reason?: string | null;
  supply_date?: string | null;
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

type PreviewInventoryRecord = {
  id: number;
  item_id?: number | null;
  product_name: string;
  material: string;
  inventory_type: string;
  size: string;
  source: "production" | "purchase";
  code: string;
  quantity_on_hand: number;
  committed_quantity: number;
  reorder_level: number;
  batch_number?: string | null;
  production_date?: string | null;
  recorded_by?: string | null;
  journal_entry_number?: string | null;
  inventory_account_code?: string | null;
  inventory_account_name?: string | null;
  attachments?: Attachment[];
  document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>;
  created_at: string;
  updated_at: string;
};

type PreviewInventoryAdjustment = {
  id: number;
  inventory_record_id: number;
  date: string;
  reference: string;
  reason: string;
  item_count: number;
  status: "draft" | "posted";
  code: string;
  product_name: string;
  quantity: number;
  source: "production" | "purchase";
  recorded_by?: string | null;
  journal_entry_number?: string | null;
  inventory_account_code?: string | null;
  inventory_account_name?: string | null;
  attachments?: Attachment[];
};

type PreviewManualJournal = {
  id: number;
  entry_number: string;
  entry_date: string;
  posting_date: string;
  reference: string;
  memo: string;
  source_type: string | null;
  source_id: number | null;
  status: string;
  created_by_name?: string | null;
  metadata?: Record<string, unknown> | null;
  lines: Array<{ id: number; line_no: number; account_id?: number; account_code?: string | null; account_name?: string | null; debit: string | number; credit: string | number; description?: string | null; document_id?: number | null; document_number?: string | null; document_type?: string | null; document_status?: string | null; inventory_item_id?: number | null }>;
};

type PreviewStatementLine = {
  id: number;
  bank_account_id: number;
  transaction_date: string;
  value_date?: string | null;
  reference?: string | null;
  description?: string | null;
  debit: number;
  credit: number;
  running_balance: number;
  status: "unmatched" | "matched" | "reconciled";
  matched_journal_line_id?: number | null;
  reconciled_at?: string | null;
  notes?: string | null;
};

type PreviewReconciliationStore = {
  statementLines: PreviewStatementLine[];
};

const previewContactsPath = path.join(process.cwd(), "data", "preview-contact-store.json");
const previewTemplatesPath = path.join(process.cwd(), "data", "preview-template-store.json");
const previewItemsPath = path.join(process.cwd(), "data", "preview-item-store.json");
const previewDocumentsPath = path.join(process.cwd(), "data", "preview-document-store.json");
const previewPaymentsPath = path.join(process.cwd(), "data", "preview-payment-store.json");
const previewAssetsPath = path.join(process.cwd(), "data", "preview-asset-store.json");
const previewInventoryPath = path.join(process.cwd(), "data", "preview-inventory-store.json");
const previewInventoryAdjustmentsPath = path.join(process.cwd(), "data", "preview-inventory-adjustment-store.json");
const previewJournalsPath = path.join(process.cwd(), "data", "preview-journal-store.json");
const previewReconciliationPath = path.join(process.cwd(), "data", "preview-reconciliation-store.json");

export function assertExplicitWorkspacePreviewRequest(searchParams: URLSearchParams, modeHeader: string | null) {
  const mode = searchParams.get("mode")?.toLowerCase();
  const headerMode = modeHeader?.toLowerCase();

  if (mode !== "preview" && headerMode !== "preview") {
    throw new Error("Preview workspace data requires explicit preview mode.");
  }
}

const arabicFontStack = WSV2_TEMPLATE_AR_FONT_STACK;
const documentFontStack = `${WSV2_TEMPLATE_LATIN_FONT_STACK}, ${WSV2_TEMPLATE_AR_FONT_STACK}`;

const productionCustomer = {
  display_name: "Desert Retail Co.",
  display_name_ar: "شركة صحراء للتجزئة",
  email: "ap@desertretail.sa",
  phone: "+966500000102",
  vat_number: "301112223330003",
  cr_number: "4032145678",
  billing_address: {
    city: "Jeddah",
    line_1: "Prince Sultan Street, Al Zahra, Jeddah 23425, Saudi Arabia",
    line_1_ar: "شارع الأمير سلطان، حي الزهراء، جدة 23425، المملكة العربية السعودية",
    line_2: "Building 5, Al Zahra District",
    line_2_ar: "مبنى 5، حي الزهراء",
  },
};

const productionSupplier = {
  display_name: "Eastern Paper Supply Co.",
  display_name_ar: "شركة الإمداد الشرقي للورق",
  email: "accounts@easternpaper.sa",
  phone: "+966500000201",
  vat_number: "302223334440003",
  cr_number: "2051184321",
  billing_address: {
    city: "Dammam",
    line_1: "Building 88, Corniche Road, Al Shati, Dammam 32413, Saudi Arabia",
    line_1_ar: "مبنى 88، طريق الكورنيش، حي الشاطئ، الدمام 32413، المملكة العربية السعودية",
  },
};

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
    contact_id: 102,
    document_number: "INV-2026-1101",
    issue_date: "2026-04-10",
    due_date: "2026-04-17",
    grand_total: 4600,
    balance_due: 1850,
    paid_total: 2750,
    tax_total: 600,
    taxable_total: 4000,
    contact: { display_name: "Desert Retail Co." },
    title: "Monthly bookkeeping retainer",
    language_code: "en",
    sent_at: "2026-04-10T09:30:00Z",
    sent_to_email: "ap@desertretail.sa",
    custom_fields: { reference: "INV-2026-1101", buyer_name_en: productionCustomer.display_name, buyer_name_ar: productionCustomer.display_name_ar, buyer_vat_number: productionCustomer.vat_number, buyer_address_en: productionCustomer.billing_address.line_1, buyer_address_ar: productionCustomer.billing_address.line_1_ar, buyer_phone: productionCustomer.phone, buyer_country: "Saudi Arabia", buyer_district: "Al Zahra", buyer_postal_code: "23425" },
    template: { id: 801, name: "Standard Tax Invoice" },
    notes: "",
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
        metadata: { custom_fields: { description_ar: "خدمات مسك الدفاتر الشهرية" } },
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
    notes: "",
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
        metadata: { custom_fields: { description_ar: "إعداد وتهيئة نظام نقاط البيع" } },
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
    notes: "",
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
  {
    id: 1201,
    type: "credit_note",
    status: "issued",
    contact_id: 102,
    document_number: "CN-2026-1201",
    issue_date: "2026-04-14",
    due_date: "2026-04-14",
    grand_total: 1150,
    balance_due: 1150,
    paid_total: 0,
    tax_total: 150,
    taxable_total: 1000,
    contact: { display_name: "Desert Retail Co." },
    title: "Return — damaged goods",
    language_code: "en",
    sent_at: "2026-04-14T10:00:00Z",
    sent_to_email: "ap@desertretail.sa",
    custom_fields: { reference: "CN-2026-1201", source_invoice_number: "INV-2026-1101", adjustment_reason: "Goods returned — damaged in transit", buyer_name_en: productionCustomer.display_name, buyer_name_ar: productionCustomer.display_name_ar, buyer_vat_number: productionCustomer.vat_number, buyer_address_en: productionCustomer.billing_address.line_1, buyer_address_ar: productionCustomer.billing_address.line_1_ar, buyer_phone: productionCustomer.phone, buyer_country: "Saudi Arabia", buyer_district: "Al Zahra", buyer_postal_code: "23425" },
    template: { id: 801, name: "Standard Tax Invoice" },
    notes: "",
    compliance_metadata: {
      zatca: {
        seller_name: previewCompany.sellerName,
        vat_number: previewCompany.vatNumber,
      },
    },
    lines: [
      {
        id: 12011,
        item_id: 302,
        ledger_account_id: 4100,
        cost_center_id: 11,
        description: "Return — damaged thermal paper batch",
        quantity: 10,
        unit_price: 100,
        gross_amount: 1000,
        metadata: { custom_fields: { description_ar: "مرتجع دفعة ورق حراري تالفة" } },
      },
    ],
  },
  {
    id: 1301,
    type: "debit_note",
    status: "issued",
    contact_id: 102,
    document_number: "DN-2026-1301",
    issue_date: "2026-04-15",
    due_date: "2026-04-22",
    grand_total: 575,
    balance_due: 575,
    paid_total: 0,
    tax_total: 75,
    taxable_total: 500,
    contact: { display_name: "Desert Retail Co." },
    title: "Price adjustment on POS setup",
    language_code: "en",
    sent_at: null,
    sent_to_email: "ap@desertretail.sa",
    custom_fields: { reference: "DN-2026-1301", source_invoice_number: "INV-2026-1102", adjustment_reason: "Scope increase — additional terminal" },
    template: { id: 801, name: "Standard Tax Invoice" },
    notes: "",
    compliance_metadata: {
      zatca: {
        seller_name: previewCompany.sellerName,
        vat_number: previewCompany.vatNumber,
      },
    },
    lines: [
      {
        id: 13011,
        item_id: 301,
        ledger_account_id: 4100,
        cost_center_id: 11,
        description: "Additional POS terminal setup",
        quantity: 1,
        unit_price: 500,
        gross_amount: 500,
        metadata: { custom_fields: { description_ar: "إعداد طرفية إضافية لنقاط البيع" } },
      },
    ],
  },
  {
    id: 1401,
    type: "quotation",
    status: "sent",
    contact_id: 102,
    document_number: "QUO-2026-1401",
    issue_date: "2026-04-09",
    due_date: "2026-04-23",
    grand_total: 5750,
    balance_due: 5750,
    paid_total: 0,
    tax_total: 750,
    taxable_total: 5000,
    contact: { display_name: "Desert Retail Co." },
    title: "Annual finance outsourcing proposal",
    language_code: "en",
    sent_at: "2026-04-09T14:00:00Z",
    sent_to_email: "ap@desertretail.sa",
    custom_fields: { reference: "QUO-2026-1401", buyer_name_en: productionCustomer.display_name, buyer_name_ar: productionCustomer.display_name_ar, buyer_vat_number: productionCustomer.vat_number, buyer_address_en: productionCustomer.billing_address.line_1, buyer_address_ar: productionCustomer.billing_address.line_1_ar, buyer_phone: productionCustomer.phone, buyer_country: "Saudi Arabia", buyer_district: "Al Zahra", buyer_postal_code: "23425" },
    template: { id: 802, name: "Compact Invoice" },
    notes: "",
    compliance_metadata: null,
    lines: [
      {
        id: 14011,
        item_id: 301,
        ledger_account_id: 4100,
        cost_center_id: 11,
        description: "Annual bookkeeping — full scope",
        quantity: 12,
        unit_price: 350,
        gross_amount: 4200,
        metadata: { custom_fields: { description_ar: "خدمات مسك الدفاتر السنوية كاملة النطاق" } },
      },
      {
        id: 14012,
        item_id: 301,
        ledger_account_id: 4100,
        cost_center_id: 11,
        description: "VAT filing support — quarterly",
        quantity: 4,
        unit_price: 200,
        gross_amount: 800,
        metadata: { custom_fields: { description_ar: "دعم تقديم ضريبة القيمة المضافة ربع السنوي" } },
      },
    ],
  },
  {
    id: 1501,
    type: "proforma_invoice",
    status: "draft",
    contact_id: 102,
    document_number: "PRO-2026-1501",
    issue_date: "2026-04-13",
    due_date: "2026-04-27",
    grand_total: 3450,
    balance_due: 3450,
    paid_total: 0,
    tax_total: 450,
    taxable_total: 3000,
    contact: { display_name: "Desert Retail Co." },
    title: "Advance billing — system migration",
    language_code: "en",
    sent_at: null,
    sent_to_email: "ap@desertretail.sa",
    custom_fields: { reference: "PRO-2026-1501" },
    template: { id: 802, name: "Compact Invoice" },
    notes: "",
    compliance_metadata: null,
    lines: [
      {
        id: 15011,
        item_id: 301,
        ledger_account_id: 4100,
        cost_center_id: 11,
        description: "System migration — phase 1 deposit",
        quantity: 1,
        unit_price: 3000,
        gross_amount: 3000,
        metadata: { custom_fields: { description_ar: "دفعة مقدمة للمرحلة الأولى من ترحيل النظام" } },
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
    name: "Customer PO",
    slug: "customer_po",
    field_type: "text",
    placement: "document_header",
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
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencyCode}`;
}

function arabicTextStyle(extra = "") {
  return `font-family:${arabicFontStack}; direction:rtl; unicode-bidi:isolate; text-align:right; line-height:1.55;${extra}`;
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

function getBooleanSetting(template: PreviewTemplate | undefined, key: string, fallback = false) {
  const value = template?.settings?.[key];
  return typeof value === "boolean" ? value : fallback;
}

function getTemplateMode(template: PreviewTemplate | undefined) {
  const layout = getTemplateSetting(template, "layout", "classic");

  if (layout === "compact-grid" || layout === "ledger") {
    return "stacked";
  }

  if (layout === "statement") {
    return "mixed";
  }

  return "side-by-side";
}

function getTemplateNumber(template: PreviewTemplate | undefined, key: string, fallback: number) {
  const value = template?.settings?.[key];
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getTemplateTextAlign(template: PreviewTemplate | undefined, key: string, fallback: "left" | "center" | "right") {
  const value = getTemplateSetting(template, key, fallback);
  return value === "left" || value === "center" || value === "right" ? value : fallback;
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function splitTemplateSections(template: PreviewTemplate | undefined) {
  const canonical = ["header", "title", "document-info", "delivery", "customer", "items", "totals", "notes", "footer"];
  const hidden = new Set(
    getTemplateSetting(template, "hidden_sections", "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  const configured = getTemplateSetting(template, "section_order", canonical.join(","))
    .split(",")
    .map((value) => value.trim())
    .map((value) => {
      if (value === "seller-buyer") return "customer";
      if (value === "qr") return "footer";
      return value;
    })
    .filter((value): value is string => canonical.includes(value));

  const ordered = [...new Set(configured)];
  const normalized = canonical.filter((section) => ordered.includes(section) || !configured.length);

  for (const section of canonical) {
    if (!ordered.includes(section)) {
      const insertionIndex = normalized.findIndex((candidate) => canonical.indexOf(candidate) > canonical.indexOf(section));
      if (insertionIndex === -1) {
        normalized.push(section);
      } else {
        normalized.splice(insertionIndex, 0, section);
      }
    }
  }

  return normalized.filter((section) => !hidden.has(section));
}

type ResolvedItemCol = { key: string; widthPct: number };

const FULL_ITEM_COLUMN_DEFAULTS: { key: string; width: number; visible: boolean }[] = [
  { key: "serial", width: 4, visible: true },
  { key: "description", width: 26, visible: true },
  { key: "quantity", width: 7, visible: true },
  { key: "unit", width: 7, visible: true },
  { key: "unit_price", width: 9, visible: true },
  { key: "taxable", width: 11, visible: true },
  { key: "vat_rate", width: 7, visible: true },
  { key: "vat", width: 9, visible: true },
  { key: "total", width: 20, visible: true },
];

function getLabelOverride(template: PreviewTemplate | undefined, lang: "en" | "ar", key: string): string | null {
  const raw = getTemplateSetting(template, lang === "en" ? "label_overrides_en" : "label_overrides_ar", "{}");
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    const v = j[key];
    return typeof v === "string" && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

function resolveItemColumnsForPreview(template: PreviewTemplate | undefined): ResolvedItemCol[] {
  const raw = getTemplateSetting(template, "item_table_columns", "");
  let saved: { key: string; width: number; visible: boolean }[] = [];
  if (raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as Array<Partial<{ key: string; width: number; visible: boolean }>>;
      saved = parsed
        .filter((e): e is { key: string } & Partial<{ width: number; visible: boolean }> => typeof e?.key === "string")
        .map((e) => ({
          key: e.key,
          width: Math.max(3, Math.min(60, Number(e.width) || 10)),
          visible: typeof e.visible === "boolean" ? e.visible : true,
        }));
    } catch {
      saved = [];
    }
  }
  const byKey = new Map(saved.map((s) => [s.key, s]));
  const merged = FULL_ITEM_COLUMN_DEFAULTS.map((d) => {
    const o = byKey.get(d.key);
    return {
      key: d.key,
      width: o?.width ?? d.width,
      visible: o?.visible ?? d.visible,
    };
  });
  const vis = merged.filter((c) => c.visible);
  const sum = vis.reduce((s, c) => s + c.width, 0) || 1;
  return vis.map((c) => ({ key: c.key, widthPct: (100 * c.width) / sum }));
}

function defaultItemColumnLabels(): Record<string, { en: string; ar: string }> {
  return {
    serial: { en: "#", ar: "#" },
    description: { en: "Description", ar: "الوصف" },
    quantity: { en: "Qty", ar: "الكمية" },
    unit: { en: "Unit", ar: "الوحدة" },
    unit_price: { en: "Rate", ar: "السعر" },
    taxable: { en: "Taxable", ar: "الخاضع للضريبة" },
    vat_rate: { en: "VAT %", ar: "% الضريبة" },
    vat: { en: "VAT", ar: "الضريبة" },
    total: { en: "Total", ar: "الإجمالي" },
  };
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

function documentTitlePair(type: string) {
  return {
    tax_invoice: { en: "Tax Invoice", ar: "فاتورة ضريبية" },
    quotation: { en: "Quotation", ar: "عرض سعر" },
    proforma_invoice: { en: "Proforma Invoice", ar: "فاتورة مبدئية" },
    credit_note: { en: "Credit Note", ar: "إشعار دائن" },
    debit_note: { en: "Debit Note", ar: "إشعار مدين" },
    vendor_bill: { en: "Vendor Bill", ar: "فاتورة مورد" },
    purchase_invoice: { en: "Purchase Invoice", ar: "فاتورة شراء" },
    purchase_order: { en: "Purchase Order", ar: "أمر شراء" },
    purchase_credit_note: { en: "Purchase Credit Note", ar: "إشعار دائن مشتريات" },
  }[type] ?? { en: type.replaceAll("_", " "), ar: type.replaceAll("_", " ") };
}

function documentNumberLabel(type: string): { en: string; ar: string } {
  return {
    tax_invoice: { en: "Invoice Number", ar: "رقم الفاتورة" },
    quotation: { en: "Quotation Number", ar: "رقم عرض السعر" },
    proforma_invoice: { en: "Proforma Number", ar: "رقم الفاتورة المبدئية" },
    credit_note: { en: "Credit Note Number", ar: "رقم إشعار الدائن" },
    debit_note: { en: "Debit Note Number", ar: "رقم إشعار المدين" },
    vendor_bill: { en: "Bill Number", ar: "رقم الفاتورة" },
    purchase_invoice: { en: "Invoice Number", ar: "رقم الفاتورة" },
    purchase_order: { en: "PO Number", ar: "رقم أمر الشراء" },
    purchase_credit_note: { en: "Credit Note Number", ar: "رقم إشعار الدائن" },
  }[type] ?? { en: "Document Number", ar: "رقم المستند" };
}

function documentContactLabel(type: string): { en: string; ar: string } {
  const isPurchase = ["vendor_bill", "purchase_invoice", "purchase_order", "purchase_credit_note"].includes(type);
  return isPurchase ? { en: "Vendor", ar: "المورد" } : { en: "Customer", ar: "العميل" };
}

function renderBilingualLabel(en: string, ar: string, mode: string, options?: { justify?: "space-between" | "start"; strong?: boolean }) {
  const justify = options?.justify ?? "space-between";
  const strong = options?.strong ?? false;

  if (mode === "stacked") {
    return `<div style="display:grid; gap:2px;"><span style="font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:#5c6f66; ${strong ? "font-weight:700;" : ""}">${escapeHtml(en)}</span><span dir="rtl" style="font-size:12px; color:#52615a; text-align:right; ${strong ? "font-weight:700;" : ""}">${escapeHtml(ar)}</span></div>`;
  }

  if (mode === "mixed") {
    return `<span style="font-size:11px; letter-spacing:0.05em; text-transform:uppercase; color:#5c6f66; ${strong ? "font-weight:700;" : ""}">${escapeHtml(en)} / <span dir="rtl">${escapeHtml(ar)}</span></span>`;
  }

  return `<div style="display:flex; align-items:center; justify-content:${justify}; gap:12px;"><span style="font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:#5c6f66; ${strong ? "font-weight:700;" : ""}">${escapeHtml(en)}</span><span dir="rtl" style="font-size:12px; color:#52615a; text-align:right; ${strong ? "font-weight:700;" : ""}">${escapeHtml(ar)}</span></div>`;
}

function renderTotalsRow(en: string, ar: string, value: string, mode: string, strong = false) {
  return `<div style="display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; align-items:center; padding:${strong ? "12px" : "8px"} 0; ${strong ? "border-top:1px solid #d8e5db; margin-top:4px;" : ""}">${renderBilingualLabel(en, ar, mode, { strong })}<strong style="font-size:${strong ? "18px" : "14px"}; color:#183226;">${escapeHtml(value)}</strong></div>`;
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

function buildInvoicePresentation(document: PreviewDocument, template?: PreviewTemplate, contact?: PreviewContact | null) {
  const custom = document.custom_fields ?? {};
  const isPurchase = ["vendor_bill", "purchase_invoice", "purchase_order", "purchase_credit_note"].includes(document.type);
  const effectiveCounterparty = isPurchase ? productionSupplier : productionCustomer;
  const currencyCode = textValue(custom.currency, previewCompany.currency);
  const sellerNameEn = textValue(custom.seller_name_en, previewCompany.sellerName);
  const sellerNameAr = textValue(custom.seller_name_ar, previewCompany.sellerNameAr);
  const sellerVat = textValue(custom.seller_vat_number, previewCompany.vatNumber);
  const sellerAddressEn = textValue(custom.seller_address_en, previewCompany.sellerAddressEn);
  const sellerAddressAr = textValue(custom.seller_address_ar, previewCompany.sellerAddressAr);
  const buyerNameEn = effectiveCounterparty.display_name ?? textValue(custom.buyer_name_en, contact?.display_name ?? document.contact.display_name);
  const buyerNameAr = effectiveCounterparty.display_name_ar ?? textValue(custom.buyer_name_ar, contact?.display_name_ar ?? document.contact.display_name);
  const buyerVat = effectiveCounterparty.vat_number ?? textValue(custom.buyer_vat_number, contact?.vat_number ?? "");
  const buyerCr = effectiveCounterparty.cr_number ?? textValue(custom.buyer_cr_number, "");
  const buyerAddressEn = effectiveCounterparty.billing_address.line_1 ?? textValue(custom.buyer_address_en, `${contact?.billing_address?.line_1 ?? ""} ${contact?.billing_address?.city ?? ""}`.trim());
  const buyerAddressAr = effectiveCounterparty.billing_address.line_1_ar ?? textValue(custom.buyer_address_ar, contact?.billing_address?.line_1_ar ?? "");
  const sellerCr = textValue(custom.seller_cr_number, previewCompany.registrationNumber || String((document.compliance_metadata as Record<string, unknown> | null)?.commercial_registration_number ?? ""));
  const buyerPhone = effectiveCounterparty.phone ?? textValue(custom.buyer_phone, contact?.phone ?? "");
  const sellerPhone = textValue(custom.seller_phone, previewCompany.sellerPhone);
  const sellerEmail = textValue(custom.seller_email, previewCompany.sellerEmail);
  const issueDate = textValue(document.issue_date);
  const supplyDate = textValue(custom.supply_date, issueDate);
  const dueDate = textValue(document.due_date, "");
  const subtotal = roundCurrency((document.lines ?? []).reduce((sum, line) => sum + line.gross_amount, 0));
  const vatTotal = roundCurrency((document.lines ?? []).reduce((sum, line) => sum + getLineVatAmount(line), 0));
  const grandTotal = roundCurrency((document.lines ?? []).reduce((sum, line) => sum + getLineTotal(line), 0));
  const amountWordsEn = amountToEnglishWords(grandTotal);
  const amountWordsAr = amountToArabicWords(grandTotal);
  const logoUrl = template?.logo_asset?.public_url ?? "";
  const sourceInvoiceNumber = textValue(custom.source_invoice_number, "");
  const adjustmentReason = textValue(custom.adjustment_reason, "");
  const reference = textValue(custom.reference, "");
  const orderNumber = textValue(custom.order_number, "");
  const deliveryInfo = textValue(custom.delivery_info, "");
  const documentTitle = documentTitlePair(document.type);
  const bilingualMode = getTemplateMode(template);

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
    buyerCr,
    buyerPhone,
    buyerAddressEn,
    buyerAddressAr,
    sellerCr,
    sellerPhone,
    sellerEmail,
    issueDate,
    supplyDate,
    dueDate,
    subtotal,
    vatTotal,
    grandTotal,
    amountWordsEn,
    amountWordsAr,
    logoUrl,
    sourceInvoiceNumber,
    adjustmentReason,
    reference,
    orderNumber,
    deliveryInfo,
    documentTitle,
    bilingualMode,
  };
}

async function resolveTemplateAssets(template?: PreviewTemplate) {
  const resolvedTemplate = await resolveTemplateWithLogo(template);
  const assets = await listPreviewAssets();
  const stampUrl = assets.find((asset) => asset.id === Number(resolvedTemplate?.settings?.stamp_asset_id ?? 0) || asset.usage === "stamp")?.public_url ?? "";
  const signatureUrl = assets.find((asset) => asset.id === Number(resolvedTemplate?.settings?.signature_asset_id ?? 0) || asset.usage === "signature")?.public_url ?? "";

  return {
    template: resolvedTemplate,
    stampUrl,
    signatureUrl,
  };
}

function buildDocumentMetaRows(document: PreviewDocument, presentation: ReturnType<typeof buildInvoicePresentation>) {
  const rows = [
    { en: documentNumberLabel(document.type).en, ar: documentNumberLabel(document.type).ar, value: document.document_number },
    { en: "Issue Date", ar: "تاريخ الإصدار", value: presentation.issueDate },
    { en: "Supply Date", ar: "تاريخ التوريد", value: presentation.supplyDate },
    { en: "Reference", ar: "المرجع", value: presentation.reference },
    { en: "Order Number", ar: "رقم الطلب", value: presentation.orderNumber },
    { en: "Due Date", ar: "تاريخ الاستحقاق", value: presentation.dueDate },
    { en: "Currency", ar: "العملة", value: presentation.currencyCode },
  ];

  return rows.filter((row) => textValue(row.value, ""));
}

function buildCustomerRows(
  document: PreviewDocument,
  presentation: ReturnType<typeof buildInvoicePresentation>,
  contact: PreviewContact | null,
) {
  const label = documentContactLabel(document.type);
  const contactBillingAddress = contact?.billing_address && typeof contact.billing_address === "object"
    ? contact.billing_address as Record<string, unknown>
    : null;
  const addressLinesEn = [
    presentation.buyerAddressEn,
    textValue(contactBillingAddress?.line_2, ""),
    textValue(document.custom_fields?.buyer_district, ""),
    [textValue(contact?.billing_address?.city, ""), textValue(document.custom_fields?.buyer_postal_code, "")].filter(Boolean).join(", "),
    [textValue(document.custom_fields?.buyer_po_box, "") ? `PO Box ${textValue(document.custom_fields?.buyer_po_box, "")}` : "", textValue(document.custom_fields?.buyer_short_address, "")].filter(Boolean).join(" · "),
    textValue(document.custom_fields?.buyer_country, ""),
  ].filter(Boolean);
  const line2Ar = textValue(contactBillingAddress?.line_2_ar, "");
  const addressRtl = [presentation.buyerAddressAr, line2Ar].filter((line) => textValue(line, "")).join(" · ");
  const addressValue = addressLinesEn.join(" · ");

  return [
    { en: label.en, ar: label.ar, value: presentation.buyerNameEn, rtl: presentation.buyerNameAr || "" },
    { en: "Address", ar: "العنوان", value: addressValue, rtl: addressRtl },
    { en: "VAT Number", ar: "الرقم الضريبي", value: presentation.buyerVat },
    { en: "CR Number", ar: "السجل التجاري", value: presentation.buyerCr },
    { en: "Phone", ar: "الهاتف", value: presentation.buyerPhone },
  ].filter((row) => textValue(row.value, "") || textValue(row.rtl, ""));
}

function buildDeliveryRows(presentation: ReturnType<typeof buildInvoicePresentation>) {
  return [
    { en: "Delivery Info", ar: "معلومات التسليم", value: presentation.deliveryInfo },
    { en: "Order Number", ar: "رقم الطلب", value: presentation.orderNumber },
  ].filter((row) => textValue(row.value, ""));
}

function buildSectionCardStyle(template: PreviewTemplate | undefined) {
  const radius = getTemplateNumber(template, "section_radius", 12);
  const border = getBooleanSetting(template, "show_card_borders", true) ? `1px solid #d8e5db` : "none";
  return `border:${border}; border-radius:${radius}px; background:white;`;
}

function buildDocumentHtml(document: PreviewDocument, template: PreviewTemplate | undefined, contact: PreviewContact | null, assets: { stampUrl: string; signatureUrl: string }, qrDataUrl: string | null) {
  const presentation = buildInvoicePresentation(document, template, contact);
  const fontFamily = getTemplateSetting(template, "font_family", documentFontStack);
  const fontSize = Math.max(11, getTemplateNumber(template, "font_size", 12));
  const titleSize = Math.max(24, getTemplateNumber(template, "title_font_size", 24));
  const spacingScale = Math.max(0.82, getTemplateNumber(template, "spacing_scale", 1));
  const sectionGap = Math.max(8, getTemplateNumber(template, "section_gap", 10));
  const canvasPadding = Math.max(16, getTemplateNumber(template, "canvas_padding", 16));
  const accent = template?.accent_color ?? "#3FAE2A";
  const isModern = getTemplateSetting(template, "layout", "classic_corporate") === "modern_carded";
  const isIndustrial = getTemplateSetting(template, "layout", "classic_corporate") === "industrial_supply";
  const frame = isIndustrial ? "#aebbc3" : isModern ? "#cfddd7" : "#cbd7d0";
  const text = isIndustrial ? "#12232c" : isModern ? "#152720" : "#13231b";
  const muted = isIndustrial ? "#4e616d" : isModern ? "#63756f" : "#5f6e68";
  const panel = isIndustrial ? "#f6f8fa" : isModern ? "#f3f8f4" : "#f7faf7";
  const accentSoft = isIndustrial ? "rgba(31,79,99,0.1)" : isModern ? "rgba(15,118,110,0.1)" : "rgba(63,174,42,0.1)";
  const divider = isIndustrial ? "rgba(83,102,118,0.28)" : isModern ? "rgba(43,96,83,0.2)" : "rgba(62,89,78,0.18)";
  const labelSize = Math.max(9, fontSize - 2);
  const currencyCode = presentation.currencyCode;
  const colorEnRaw = getTemplateSetting(template, "text_color_en", "");
  const colorArRaw = getTemplateSetting(template, "text_color_ar", "");
  const colorEn = colorEnRaw.trim() || text;
  const colorAr = colorArRaw.trim() || text;
  const logoMaxW = getTemplateNumber(template, "logo_max_width", 160);
  const logoMaxH = getTemplateNumber(template, "logo_max_height", 62);
  const showQr = ["tax_invoice", "credit_note", "debit_note"].includes(document.type) && getBooleanSetting(template, "show_qr", document.type === "tax_invoice");
  const showTotals = getBooleanSetting(template, "show_totals", true);
  const showVatSection = getBooleanSetting(template, "show_vat_section", true);
  const headerHtml = textValue(template?.header_html, "").trim();
  const footerHtml = textValue(template?.footer_html, "").trim();
  const notes = textValue(document.notes, "").trim();
  const sellerVatDigits = presentation.sellerVat.replace(/\D/g, "");
  const buyerVatDigits = presentation.buyerVat.replace(/\D/g, "");
  const submittedState = ["submitted", "reported", "cleared", "locked"].includes(document.status);
  const complianceMessages = [
    sellerVatDigits.length !== 15 ? "Seller VAT should be a 15-digit value." : "",
    buyerVatDigits && buyerVatDigits.length !== 15 ? "Buyer VAT should be a 15-digit value." : "",
    document.compliance_metadata?.xml_ready ? "UBL XML foundation prepared." : "UBL XML foundation pending.",
    submittedState ? "Editing is blocked after submission-ready status." : "Document remains editable until submission lock is applied.",
  ].filter(Boolean);
  const logoMarkup = presentation.logoUrl
    ? `<img src="${escapeAttribute(presentation.logoUrl)}" alt="Logo" style="max-width:${logoMaxW}px; max-height:${logoMaxH}px; object-fit:contain; display:block;" />`
    : "";
  const metaRows = buildDocumentMetaRows(document, presentation);
  const deliveryRows = [
    { en: "Supply Date", ar: "تاريخ التوريد", value: presentation.supplyDate },
    { en: "Delivery Note", ar: "رقم إشعار التسليم", value: textValue(document.custom_fields?.linked_delivery_note_number, "") },
    { en: "Order Number", ar: "رقم الطلب", value: presentation.orderNumber },
    { en: "Project", ar: "المشروع", value: textValue(document.custom_fields?.project, "") },
  ].filter((row) => textValue(row.value, ""));
  const customerRows = buildCustomerRows(document, presentation, contact);
  const sectionOrder = splitTemplateSections(template);

  const itemCols = resolveItemColumnsForPreview(template);
  const itemLabelDefaults = defaultItemColumnLabels();
  const bilingualHeadings = getBooleanSetting(template, "table_heading_bilingual", true);
  const riyalSym = getTemplateSetting(template, "totals_currency_symbol", "﷼");
  const tdPad = getTemplateNumber(template, "totals_card_padding_px", 10);
  const tdGap = getTemplateNumber(template, "totals_row_gap_px", 6);
  const totalsMinH = getTemplateNumber(template, "totals_card_min_height_px", 0);
  const totalsMinW = getTemplateNumber(template, "totals_block_min_width_px", 300);
  const descFr = getTemplateNumber(template, "totals_col_desc_fr", 140);
  const curFr = getTemplateNumber(template, "totals_col_currency_fr", 40);
  const amtFr = getTemplateNumber(template, "totals_col_amount_fr", 100);
  const qrPct = Math.min(50, Math.max(28, getTemplateNumber(template, "qr_card_width_pct", 38)));
  const qrImgPx = Math.min(200, Math.max(40, getTemplateNumber(template, "qr_image_max_px", 88)));
  const totalsMaxWpx = getTemplateNumber(template, "totals_card_max_width_px", 0);
  /** Primary visible width cap for totals card (Template Studio: "Totals Card Width"). */
  const totalsCardWidthPx = Math.min(720, Math.max(280, getTemplateNumber(template, "totals_card_width_px", 540)));
  const signatoryName = getTemplateSetting(template, "signatory_name", "").trim();
  const signatoryPosition = getTemplateSetting(template, "signatory_position", "").trim();
  const fmtAmt = (n: number) =>
    numericValue(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const theadRow = itemCols
    .map((col) => {
      const lab = itemLabelDefaults[col.key] ?? { en: col.key, ar: col.key };
      const en = getLabelOverride(template, "en", col.key) ?? lab.en;
      const ar = getLabelOverride(template, "ar", col.key) ?? lab.ar;
      const align = col.key === "serial" ? "center" : col.key === "description" ? "left" : "right";
      const headInner = bilingualHeadings
        ? `<div style="color:${colorEn};font-size:${labelSize}px;line-height:1.2;">${escapeHtml(en)}</div><div dir="rtl" style="color:${colorAr};font-size:${Math.max(8, labelSize - 1)}px;${arabicTextStyle()}">${escapeHtml(ar)}</div>`
        : `<span style="color:${colorEn}">${escapeHtml(en)}</span>`;
      return `<th style="width:${col.widthPct.toFixed(4)}%;border:1px solid ${divider};padding:5px 5px;text-align:${align};font-weight:800;background:${panel};vertical-align:middle;box-sizing:border-box;">${headInner}</th>`;
    })
    .join("");

  const tbodyRows = (document.lines ?? [])
    .map((line, index) => {
      const taxable = numericValue(line.gross_amount);
      const vat = getLineVatAmount(line);
      const total = showTotals ? taxable + vat : taxable;
      const descriptionAr = textValue(line.metadata?.custom_fields?.description_ar, "");
      const unitV = textValue(line.metadata?.custom_fields?.unit, "—");
      const vatRateV = `${getLineVatRate(line)}%`;
      const cells = itemCols
        .map((col) => {
          const align = col.key === "serial" ? "center" : col.key === "description" ? "left" : "right";
          let inner: string;
          switch (col.key) {
            case "serial":
              inner = String(index + 1);
              break;
            case "description":
              inner = `<div style="color:${colorEn};">${escapeHtml(line.description)}</div>${descriptionAr ? `<div dir="rtl" style="margin-top:2px;color:${colorAr};${arabicTextStyle()}">${escapeHtml(descriptionAr)}</div>` : ""}`;
              break;
            case "quantity":
              inner = numericValue(line.quantity).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
              break;
            case "unit":
              inner = escapeHtml(unitV);
              break;
            case "unit_price":
              inner = numericValue(line.unit_price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              break;
            case "taxable":
              inner = taxable.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              break;
            case "vat_rate":
              inner = escapeHtml(vatRateV);
              break;
            case "vat":
              inner = vat.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              break;
            case "total":
              inner = total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              break;
            default:
              inner = "";
          }
          const fw = col.key === "total" ? "800" : "400";
          const bg = col.key === "total" ? accentSoft : "transparent";
          return `<td style="border-bottom:1px solid ${divider};padding:5px 5px;text-align:${align};font-variant-numeric:tabular-nums;vertical-align:middle;color:${colorEn};font-weight:${fw};background:${bg};box-sizing:border-box;word-break:break-word;">${inner}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const itemsSectionHtml = `<section data-doc-section="items" style="margin-bottom:${Math.round(sectionGap)}px;max-width:100%;box-sizing:border-box;">
    <table style="width:100%;border-collapse:collapse;font-size:${fontSize}px;line-height:1.25;table-layout:fixed;box-sizing:border-box;">
      <thead><tr>${theadRow}</tr></thead>
      <tbody>${tbodyRows}</tbody>
    </table>
  </section>`;

  function totalsTripleRow(en: string, ar: string, amount: string, grand: boolean) {
    const fs = grand ? fontSize + 2 : fontSize;
    const fwEn = grand ? 900 : 600;
    const top = grand ? `border-top:2px solid ${accent};padding-top:10px;margin-top:6px;` : "";
    return `<div style="${top}display:grid;grid-template-columns:minmax(0,${descFr}fr) ${curFr}fr ${amtFr}fr;gap:4px 10px;align-items:center;padding:${tdGap}px 0;border-bottom:1px solid ${divider};font-size:${fs}px;line-height:1.2;box-sizing:border-box;">
      <div style="min-width:0;"><div style="color:${colorEn};font-weight:${fwEn};">${escapeHtml(en)}</div><div dir="rtl" style="color:${colorAr};font-weight:600;font-size:${Math.max(9, fontSize - 1)}px;${arabicTextStyle()}">${escapeHtml(ar)}</div></div>
      <div style="text-align:center;color:${colorEn};font-weight:700;font-size:${fontSize}px;padding:0 8px;white-space:nowrap;">${escapeHtml(riyalSym)}</div>
      <div style="text-align:right;font-variant-numeric:tabular-nums;color:${grand ? accent : colorEn};font-weight:${grand ? 900 : 700};white-space:nowrap;font-size:${grand ? fontSize + 3 : fontSize + 1}px;">${amount}</div>
    </div>`;
  }

  const subL = {
    en: getLabelOverride(template, "en", "subtotal") ?? "Subtotal",
    ar: getLabelOverride(template, "ar", "subtotal") ?? "المجموع الفرعي",
  };
  const tvL = {
    en: getLabelOverride(template, "en", "total_vat") ?? "Total VAT",
    ar: getLabelOverride(template, "ar", "total_vat") ?? "إجمالي ضريبة القيمة المضافة",
  };
  const gtL = {
    en: getLabelOverride(template, "en", "grand_total") ?? "Grand Total",
    ar: getLabelOverride(template, "ar", "grand_total") ?? "المجموع شامل الضريبة",
  };

  const totalsBody = [
    totalsTripleRow(subL.en, subL.ar, fmtAmt(presentation.subtotal), false),
    ...(showVatSection && getBooleanSetting(template, "totals_show_taxable_row", false)
      ? [totalsTripleRow("Taxable Amount", "المبلغ الخاضع للضريبة", fmtAmt(document.taxable_total), false)]
      : []),
    ...(showVatSection ? [totalsTripleRow(tvL.en, tvL.ar, fmtAmt(document.tax_total), false)] : []),
    totalsTripleRow(gtL.en, gtL.ar, fmtAmt(document.grand_total), true),
  ].join("");

  const qrCard =
    showQr && qrDataUrl
      ? `<div data-doc-qr-card style="flex:0 1 ${qrPct}%;max-width:calc(${qrPct}% - 6px);min-width:140px;border:1px solid ${divider};border-radius:8px;padding:8px;background:${panel};box-sizing:border-box;display:flex;flex-direction:column;align-items:flex-start;gap:6px;">
          <img src="${escapeAttribute(qrDataUrl)}" alt="ZATCA QR" width="${qrImgPx}" height="${qrImgPx}" style="width:${qrImgPx}px;height:${qrImgPx}px;object-fit:contain;border:1px solid ${frame};padding:3px;background:#fff;align-self:flex-start;" />
          <div style="font-size:10px;line-height:1.35;color:${colorEn};max-width:100%;word-break:break-word;">Phase 1 ZATCA TLV (foundation)</div>
        </div>`
      : "";

  const totalsCardLegacyMax = totalsMaxWpx > 0 ? `min(${totalsCardWidthPx}px, ${totalsMaxWpx}px)` : `${totalsCardWidthPx}px`;
  const totalsCard = `<div data-doc-totals-card style="flex:1 1 auto;min-width:min(100%,${totalsMinW}px);max-width:min(100%,${totalsCardLegacyMax});width:100%;${totalsMinH > 0 ? `min-height:${totalsMinH}px;` : ""}border:1px solid ${divider};padding:${tdPad}px;background:linear-gradient(180deg,#ffffff 0%,${panel} 100%);box-sizing:border-box;border-radius:8px;">
    ${totalsBody}
  </div>`;

  const totalsQrSection = showTotals
    ? `<section data-doc-section="totals" style="display:flex;flex-wrap:wrap;gap:12px;align-items:stretch;margin-bottom:14px;width:100%;max-width:100%;box-sizing:border-box;">
    ${showQr ? qrCard : ""}
    ${totalsCard}
  </section>`
    : "";

  const stampSigFooter = `${assets.stampUrl ? `<img src="${escapeAttribute(assets.stampUrl)}" alt="Stamp" style="max-width:96px;max-height:72px;object-fit:contain;" />` : ""}${
    assets.signatureUrl
      ? `<div data-doc-signature-block style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;">
          <img src="${escapeAttribute(assets.signatureUrl)}" alt="Signature" style="max-width:160px;max-height:56px;object-fit:contain;" />
          ${signatoryName ? `<div style="font-size:${fontSize - 2}px;color:${colorEn};line-height:1.2;">${escapeHtml(signatoryName)}</div>` : ""}
          ${signatoryPosition ? `<div style="font-size:${fontSize - 3}px;color:${colorEn};line-height:1.2;">${escapeHtml(signatoryPosition)}</div>` : ""}
        </div>`
      : ""
  }`;

  const docInfoRowsHtml = metaRows
    .map((row, idx) => {
      const bord = idx < metaRows.length - 1 ? `border-bottom:1px solid ${divider};` : "";
      return `<div data-doc-meta-row style="display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.3fr) minmax(0,.95fr);gap:6px 10px;align-items:center;padding:5px 0;${bord}font-size:${fontSize}px;line-height:1.25;box-sizing:border-box;"><div style="color:${colorEn};font-weight:700;font-size:${labelSize}px;text-transform:uppercase;letter-spacing:.04em;">${escapeHtml(row.en)}</div><div style="text-align:center;color:${colorEn};font-weight:800;font-variant-numeric:tabular-nums;min-width:0;word-break:break-word;">${escapeHtml(row.value)}</div><div dir="rtl" style="color:${colorAr};font-weight:700;font-size:${labelSize}px;text-align:right;${arabicTextStyle()}">${escapeHtml(row.ar)}</div></div>`;
    })
    .join("");

  const customerRowsHtml = customerRows
    .map((row, idx) => {
      const bord = idx < customerRows.length - 1 ? `border-bottom:1px solid ${divider};` : "";
      const rtlVal = "rtl" in row ? String(row.rtl ?? "") : "";
      const mid = `${textValue(row.value, "") ? `<div style="color:${colorEn};font-weight:600;font-variant-numeric:tabular-nums;">${escapeHtml(row.value)}</div>` : ""}${textValue(rtlVal, "") ? `<div dir="rtl" style="color:${colorAr};font-size:${Math.max(10, fontSize - 1)}px;${arabicTextStyle()}">${escapeHtml(rtlVal)}</div>` : ""}`;
      return `<div data-doc-customer-row style="display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.4fr) minmax(0,.9fr);gap:6px 10px;align-items:center;padding:5px 0;${bord}font-size:${fontSize}px;line-height:1.25;box-sizing:border-box;"><div style="color:${colorEn};font-weight:700;font-size:${labelSize}px;">${escapeHtml(row.en)}</div><div style="text-align:center;min-width:0;">${mid}</div><div dir="rtl" style="color:${colorAr};font-weight:700;font-size:${labelSize}px;text-align:right;${arabicTextStyle()}">${escapeHtml(row.ar)}</div></div>`;
    })
    .join("");

  const sectionMarkup: Record<string, string> = {
    header: `<section data-doc-section="header" style="display:grid; grid-template-columns:40% 20% 40%; gap:0; align-items:start; padding-bottom:12px; border-bottom:1px solid ${divider}; margin-bottom:12px;">
      <div style="display:grid; gap:3px; align-content:start; text-align:left; font-size:${fontSize}px; line-height:1.45; color:${colorEn}; padding-right:12px;">
        <div style="font-size:${fontSize + 6}px; font-weight:800; line-height:1.15;color:${colorEn};">${escapeHtml(presentation.sellerNameEn)}</div>
        ${presentation.sellerAddressEn ? `<div>${escapeHtml(presentation.sellerAddressEn)}</div>` : ""}
        ${presentation.sellerEmail || presentation.sellerPhone ? `<div>${escapeHtml([presentation.sellerEmail, presentation.sellerPhone].filter(Boolean).join(" / "))}</div>` : ""}
      </div>
      <div style="display:flex; justify-content:center; align-items:flex-start; min-height:64px; padding:0 8px;">${logoMarkup}</div>
      <div dir="rtl" style="display:grid; gap:3px; align-content:start; font-size:${fontSize}px; line-height:1.5; color:${colorAr}; padding-left:12px; ${arabicTextStyle()}">
        ${presentation.sellerNameAr ? `<div style="font-size:${fontSize + 6}px; font-weight:800; line-height:1.2;color:${colorAr};">${escapeHtml(presentation.sellerNameAr)}</div>` : ""}
        ${presentation.sellerAddressAr ? `<div>${escapeHtml(presentation.sellerAddressAr)}</div>` : ""}
        ${presentation.sellerVat ? `<div>الرقم الضريبي: ${escapeHtml(presentation.sellerVat)}</div>` : ""}
        ${presentation.sellerCr ? `<div>السجل التجاري: ${escapeHtml(presentation.sellerCr)}</div>` : ""}
      </div>
    </section>`,
    title: `<section data-doc-section="title" style="padding:0 0 12px;">
      <div style="display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:12px; align-items:end; border-bottom:1px solid ${divider}; padding-bottom:10px;">
        <div data-doc-title="en" style="text-align:left;">
          <div style="font-size:${fontSize - 1}px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:${colorEn}; opacity:0.82;">Document</div>
          <div style="margin-top:6px; font-size:${titleSize}px; font-weight:900; letter-spacing:.01em; line-height:1.05; color:${colorEn};">${escapeHtml(presentation.documentTitle.en)}</div>
        </div>
        <div data-doc-title="ar" dir="rtl" style="text-align:right; ${arabicTextStyle()}">
          <div style="font-size:${fontSize - 1}px; font-weight:700; letter-spacing:.08em; color:${colorAr}; opacity:0.88;">المستند</div>
          <div style="margin-top:6px; font-size:${titleSize - 1}px; font-weight:900; line-height:1.15; color:${colorAr};">${escapeHtml(presentation.documentTitle.ar)}</div>
        </div>
      </div>
    </section>`,
    "document-info": docInfoRowsHtml
      ? `<section data-doc-section="document-info" style="border:1px solid ${divider}; background:#fff; margin-bottom:12px; padding:6px 10px 8px; box-sizing:border-box; max-width:100%;">
      ${docInfoRowsHtml}
    </section>`
      : "",
    delivery: deliveryRows.length ? `<section data-doc-section="delivery" style="border:1px solid ${divider}; background:${panel}; padding:8px 12px; margin-bottom:12px; box-sizing:border-box; max-width:100%;">
      <div style="margin-bottom:6px; font-size:${labelSize}px; text-transform:uppercase; letter-spacing:.06em; font-weight:800;"><span style="color:${colorEn};">Delivery</span> <span style="color:${colorAr};" dir="rtl"> / التسليم</span></div>
      <div style="display:grid; gap:0;">
        ${deliveryRows.map((row, idx) => {
          const bord = idx < deliveryRows.length - 1 ? `border-bottom:1px solid ${divider};` : "";
          return `<div data-doc-bilingual-row="true" style="display:grid; grid-template-columns:minmax(0,.9fr) minmax(0,1.4fr) minmax(0,.9fr); gap:6px 10px; align-items:center; padding:5px 0; ${bord} font-size:${fontSize}px; line-height:1.25;"><div style="color:${colorEn}; font-weight:700;">${escapeHtml(row.en)}</div><div style="text-align:center; color:${colorEn}; font-weight:600; font-variant-numeric:tabular-nums; min-width:0; word-break:break-word;">${escapeHtml(row.value)}</div><div dir="rtl" style="color:${colorAr}; font-weight:700; text-align:right; ${arabicTextStyle()}">${escapeHtml(row.ar)}</div></div>`;
        }).join("")}
      </div>
    </section>` : "",
    customer: customerRowsHtml
      ? `<section data-doc-section="customer" style="border:1px solid ${divider}; margin-bottom:12px; background:#fff; padding:6px 10px 8px; box-sizing:border-box; max-width:100%;">
      ${customerRowsHtml}
    </section>`
      : "",
    items: itemsSectionHtml,
    totals: totalsQrSection,
    notes: notes ? `<section data-doc-section="notes" style="border-top:1px solid ${divider}; padding-top:10px; margin-bottom:10px;"><div style="font-size:${fontSize}px; line-height:1.45; color:${colorEn};">${escapeHtml(notes)}</div></section>` : "",
    footer: `<section data-doc-section="footer" style="border-top:1px solid ${divider}; padding-top:10px; display:grid; gap:8px; min-height:36px;">
      ${footerHtml ? `<div data-doc-footer-html="true" style="font-size:${fontSize - 1}px; color:${colorEn}; line-height:1.45;">${footerHtml}</div>` : ""}
      ${complianceMessages.length ? `<div data-doc-compliance="true" style="display:grid; gap:4px; border:1px solid ${divider}; background:${panel}; padding:8px; font-size:${fontSize - 1}px; color:${muted};">
        ${complianceMessages.map((message) => `<div>${escapeHtml(message)}</div>`).join("")}
      </div>` : ""}
      <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:12px; flex-wrap:wrap;">
      <div style="font-size:${fontSize - 1}px; color:${colorEn};">${escapeHtml(presentation.sellerNameEn)}${presentation.sellerVat ? ` · VAT ${escapeHtml(presentation.sellerVat)}` : ""}</div>
      <div style="display:flex; align-items:flex-end; gap:10px;">${stampSigFooter}</div>
      </div>
    </section>`,
  };

  return `<html><body style="margin:0; padding:0; background:#f1f5f1; font-family:${escapeHtml(fontFamily)}; color:${text};"><div style="max-width:794px; margin:0 auto; padding:12px; background:#ffffff; box-sizing:border-box;"><article data-doc-root="true" style="background:#ffffff; border:1px solid ${frame}; font-family:${escapeHtml(fontFamily)}; color:${text}; padding:${canvasPadding}px; max-width:100%; box-sizing:border-box;">${headerHtml ? `<section data-doc-header-html="true" style="margin-bottom:${Math.round(sectionGap)}px; border:1px solid ${divider}; background:${panel}; padding:12px; font-size:${fontSize}px; line-height:1.5;">${headerHtml}</section>` : ""}${sectionOrder.map((section) => sectionMarkup[section] ?? "").filter(Boolean).join("")}</article></div></body></html>`;
}

async function resolveTemplateWithLogo(template?: PreviewTemplate) {
  if (!template || template.logo_asset?.public_url) {
    return template;
  }

  const assets = await listPreviewAssets();
  const logoAsset = assets.find((asset) => asset.usage === "logo" || asset.type === "logo");

  if (!logoAsset) {
    return template;
  }

  return {
    ...template,
    accent_color: typeof logoAsset.metadata?.generated_theme === "object" && logoAsset.metadata?.generated_theme && typeof (logoAsset.metadata.generated_theme as Record<string, unknown>).primary === "string"
      ? String((logoAsset.metadata.generated_theme as Record<string, unknown>).primary)
      : template.accent_color,
    logo_asset: {
      id: logoAsset.id,
      public_url: logoAsset.public_url,
    },
  } as PreviewTemplate;
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
  type: "product" | "service" | "raw_material" | "finished_good";
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

export async function listPreviewVatReceivedDetails(filters?: {
  fromDate?: string | null;
  toDate?: string | null;
}) {
  const documents = await listMergedPreviewDocuments();

  return documents
    .filter((document) => document.status !== "draft")
    .filter((document) => document.type === "tax_invoice" || document.type === "debit_note")
    .filter((document) => !filters?.fromDate || document.issue_date >= filters.fromDate)
    .filter((document) => !filters?.toDate || document.issue_date <= filters.toDate)
    .map((document) => ({
      id: document.id,
      document_number: document.document_number,
      issue_date: document.issue_date,
      customer: document.contact.display_name,
      taxable_amount: roundCurrency(document.taxable_total),
      vat_amount: roundCurrency(document.tax_total),
    }));
}

export async function listPreviewVatPaidDetails(filters?: {
  fromDate?: string | null;
  toDate?: string | null;
}) {
  const documents = await listMergedPreviewDocuments();

  return documents
    .filter((document) => document.status !== "draft")
    .filter((document) => document.type === "vendor_bill" || document.type === "purchase_invoice")
    .filter((document) => !filters?.fromDate || document.issue_date >= filters.fromDate)
    .filter((document) => !filters?.toDate || document.issue_date <= filters.toDate)
    .map((document) => ({
      id: document.id,
      reference: document.document_number,
      issue_date: document.issue_date,
      vendor: document.contact.display_name,
      vat_amount: roundCurrency(document.tax_total),
      category: document.title.toLowerCase().includes("rent") ? "rent" : document.type === "vendor_bill" ? "expense" : "purchase",
    }));
}

export async function listPreviewInventoryStock() {
  const inventory = await readOptionalJsonFile<PreviewInventoryRecord[]>(previewInventoryPath, []);
  const documents = await listMergedPreviewDocuments();

  return inventory.map((record) => ({
    ...record,
    document_links: normalizePreviewDocumentLinks(record.document_links ?? [], documents),
  }));
}

export async function listPreviewInventoryAdjustments() {
  const adjustments = await readOptionalJsonFile<PreviewInventoryAdjustment[]>(previewInventoryAdjustmentsPath, []);
  const documents = await listMergedPreviewDocuments();

  return adjustments.map((adjustment) => {
    const typedAdjustment = adjustment as PreviewInventoryAdjustment & { transaction_type?: string | null; document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }> };

    return ({
    ...adjustment,
    reference: normalizePreviewReference(adjustment.reference, typedAdjustment.transaction_type === "delivery_note" ? "delivery_note" : typedAdjustment.document_links?.[0]?.documentType, documents),
    document_links: normalizePreviewDocumentLinks(typedAdjustment.document_links ?? [], documents),
  });
  });
}

export async function createPreviewInventoryRecord(payload: {
  item_id?: number | null;
  product_name: string;
  material: string;
  inventory_type: string;
  size: string;
  source: "production" | "purchase";
  code: string;
  quantity_on_hand: number;
  committed_quantity?: number | null;
  reorder_level?: number | null;
  batch_number?: string | null;
  production_date?: string | null;
  recorded_by?: string | null;
  journal_entry_number?: string | null;
  inventory_account_code?: string | null;
  inventory_account_name?: string | null;
  attachments?: Attachment[];
  document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>;
}) {
  const inventory = await listPreviewInventoryStock();
  const adjustments = await listPreviewInventoryAdjustments();
  const now = new Date().toISOString();
  const nextId = Math.max(...inventory.map((record) => record.id), 9000) + 1;

  const nextRecord: PreviewInventoryRecord = {
    id: nextId,
    item_id: payload.item_id ?? null,
    product_name: payload.product_name,
    material: payload.material,
    inventory_type: payload.inventory_type,
    size: payload.size,
    source: payload.source,
    code: payload.code,
    quantity_on_hand: roundCurrency(payload.quantity_on_hand),
    committed_quantity: roundCurrency(payload.committed_quantity ?? 0),
    reorder_level: roundCurrency(payload.reorder_level ?? 0),
    batch_number: payload.batch_number ?? null,
    production_date: payload.production_date ?? null,
    recorded_by: payload.recorded_by ?? "Workspace User",
    journal_entry_number: payload.journal_entry_number ?? `JV-INV-${nextId}`,
    inventory_account_code: payload.inventory_account_code ?? (payload.source === "production" ? "1400" : "1200"),
    inventory_account_name: payload.inventory_account_name ?? (payload.source === "production" ? "Inventory - Finished Goods" : "Inventory - Raw Materials"),
    attachments: payload.attachments ?? [],
    document_links: payload.document_links ?? [],
    created_at: now,
    updated_at: now,
  };

  const nextAdjustmentId = Math.max(...adjustments.map((entry) => entry.id), 9500) + 1;
  const nextAdjustment: PreviewInventoryAdjustment = {
    id: nextAdjustmentId,
    inventory_record_id: nextRecord.id,
    date: now.slice(0, 10),
    reference: `ADJ-2026-${nextAdjustmentId}`,
    reason: payload.source === "production" ? "Production intake" : "Purchase receipt",
    item_count: 1,
    status: "posted",
    code: nextRecord.code,
    product_name: nextRecord.product_name,
    quantity: nextRecord.quantity_on_hand,
    source: nextRecord.source,
    recorded_by: nextRecord.recorded_by,
    journal_entry_number: nextRecord.journal_entry_number,
    inventory_account_code: nextRecord.inventory_account_code,
    inventory_account_name: nextRecord.inventory_account_name,
    attachments: nextRecord.attachments ?? [],
  };

  await writeJsonFile(previewInventoryPath, [nextRecord, ...inventory]);
  await writeJsonFile(previewInventoryAdjustmentsPath, [nextAdjustment, ...adjustments]);

  return nextRecord;
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

type RenderAssetLike = {
  id: number;
  usage?: string | null;
  public_url?: string;
  publicUrl?: string;
  is_active?: boolean;
  isActive?: boolean;
};

async function resolveTemplateRenderAssets(
  template: PreviewTemplate | undefined,
  availableAssets?: RenderAssetLike[],
) {
  const assetCatalog = availableAssets?.length
    ? availableAssets.map((asset) => ({
        id: asset.id,
        usage: asset.usage ?? null,
        public_url: asset.public_url ?? asset.publicUrl ?? "",
        is_active: asset.is_active ?? asset.isActive ?? true,
        type: "document_asset",
        original_name: "workspace-asset",
        size_bytes: 0,
      }))
    : await listPreviewAssets();
  const logoAssetId = Number(template?.logo_asset_id ?? 0);
  const logoAsset = logoAssetId > 0
    ? assetCatalog.find((asset) => asset.id === logoAssetId)
    : assetCatalog.find((asset) => asset.usage === "logo");
  const resolvedTemplate = template
    ? {
        ...template,
        logo_asset: logoAsset?.public_url
          ? {
              id: logoAsset.id,
              public_url: logoAsset.public_url,
              original_name: logoAsset.original_name,
            }
          : template.logo_asset ?? null,
      }
    : template;
  const stampAssetId = Number(resolvedTemplate?.settings?.stamp_asset_id ?? 0);
  const signatureAssetId = Number(resolvedTemplate?.settings?.signature_asset_id ?? 0);
  const stampUrl = assetCatalog.find((asset) => asset.id === stampAssetId || asset.usage === "stamp")?.public_url ?? "";
  const signatureUrl = assetCatalog.find((asset) => asset.id === signatureAssetId || asset.usage === "signature")?.public_url ?? "";

  return {
    template: resolvedTemplate,
    stampUrl,
    signatureUrl,
  };
}

/**
 * V2 print HTML: implemented in `document-engine/workspace-v2-guest-pdf-orchestrate.ts` (via
 * `workspace-v2-guest-pdf-html`) so this module
 * does not statically import `react-dom/server` (Next.js constraint for shared app modules).
 * Same `WorkspaceDocumentRenderer` + wsv2-* layout as `WorkspaceDocumentPreview`.
 */
export async function renderWorkspaceDocumentHtmlV2(params: {
  document: PreviewDocument;
  template?: PreviewTemplate;
  contact?: PreviewContact | null;
}): Promise<string> {
  const { buildGuestPreviewV2PrintHtml } = await import("@/lib/document-engine/workspace-v2-guest-pdf-html");
  // GuestPrint types are a structural subset; preview rows/lines are forward-compatible.
  return buildGuestPreviewV2PrintHtml(
    params as {
      document: import("@/lib/document-engine/workspace-v2-guest-pdf-html").GuestPreviewDocument;
      template?: import("@/lib/document-engine/workspace-v2-guest-pdf-html").GuestPreviewTemplate;
      contact?: import("@/lib/document-engine/workspace-v2-guest-pdf-html").GuestPreviewContact | null;
    },
  );
}

export async function renderWorkspaceDocumentHtml(params: {
  document: PreviewDocument;
  template?: PreviewTemplate;
  contact?: PreviewContact | null;
  availableAssets?: RenderAssetLike[];
}) {
  const renderAssets = await resolveTemplateRenderAssets(params.template, params.availableAssets);
  const presentation = buildInvoicePresentation(params.document, renderAssets.template, params.contact ?? null);
  const qrDataUrl = ["tax_invoice", "credit_note", "debit_note"].includes(params.document.type) && presentation.sellerVat
    ? await buildInvoiceQrDataUrl({
        sellerNameEn: presentation.sellerNameEn,
        sellerVat: presentation.sellerVat,
        issueDate: presentation.issueDate,
        grandTotal: presentation.grandTotal,
        vatTotal: presentation.vatTotal,
      }).catch(() => null)
    : null;

  return buildDocumentHtml(
    params.document,
    renderAssets.template,
    params.contact ?? null,
    { stampUrl: renderAssets.stampUrl, signatureUrl: renderAssets.signatureUrl },
    qrDataUrl,
  );
}

export async function renderPreviewTemplateHtml(payload: {
  name: string;
  document_types?: string[] | null;
  locale_mode: string;
  accent_color: string;
  watermark_text?: string | null;
  header_html?: string | null;
  footer_html?: string | null;
  settings?: Record<string, string | number | boolean | null> | null;
  logo_asset_id?: number | null;
  is_default?: boolean;
  is_active?: boolean;
}, documentType: string) {
  const template: PreviewTemplate = {
    id: 0,
    name: payload.name,
    document_types: payload.document_types ?? [documentType],
    locale_mode: payload.locale_mode,
    accent_color: payload.accent_color,
    watermark_text: payload.watermark_text ?? null,
    header_html: payload.header_html ?? null,
    footer_html: payload.footer_html ?? null,
    settings: payload.settings ?? {},
    logo_asset_id: payload.logo_asset_id ?? null,
    is_default: Boolean(payload.is_default),
    is_active: payload.is_active ?? true,
  };
  const document: PreviewDocument = {
    id: 0,
    type: documentType,
    status: "draft",
    contact_id: 102,
    document_number: documentType === "delivery_note" ? "DN-2026-1301" : documentType === "proforma_invoice" ? "PRO-2026-1501" : documentType === "credit_note" ? "CN-2026-1201" : documentType === "debit_note" ? "DBN-2026-1202" : "INV-2026-1101",
    issue_date: "2026-04-13",
    due_date: "2026-04-20",
    supply_date: "2026-04-13",
    grand_total: documentType === "delivery_note" ? 1_000_000 : 1_150_000,
    balance_due: documentType === "delivery_note" ? 1_000_000 : 1_150_000,
    paid_total: 0,
    tax_total: documentType === "delivery_note" ? 0 : 150_000,
    taxable_total: 1_000_000,
    contact: { display_name: productionCustomer.display_name },
    title: "Template Preview Document",
    language_code: "bilingual",
    custom_fields: {
      currency: previewCompany.currency,
      seller_name_en: previewCompany.sellerName,
      seller_name_ar: previewCompany.sellerNameAr,
      seller_vat_number: previewCompany.vatNumber,
      seller_cr_number: previewCompany.registrationNumber,
      seller_email: previewCompany.sellerEmail,
      seller_phone: previewCompany.sellerPhone,
      seller_address_en: previewCompany.sellerAddressEn,
      seller_address_ar: previewCompany.sellerAddressAr,
      buyer_name_en: productionCustomer.display_name,
      buyer_name_ar: productionCustomer.display_name_ar,
      buyer_phone: productionCustomer.phone,
      buyer_vat_number: productionCustomer.vat_number,
      buyer_address_en: productionCustomer.billing_address.line_1,
      buyer_address_ar: productionCustomer.billing_address.line_1_ar,
      buyer_country: "Saudi Arabia",
      zatca_qr_required: true,
    },
    lines: [
      {
        id: 1,
        item_id: 301,
        description: "Monthly bookkeeping",
        quantity: 1,
        unit_price: 1_000_000,
        gross_amount: 1_000_000,
        metadata: { custom_fields: { description_ar: "مسك دفاتر شهري", vat_rate: 15, unit: "srv" } },
      },
    ],
    compliance_metadata: {
      zatca_ready: true,
      xml_ready: true,
      document_mode: documentType,
    },
  };
  const contact: PreviewContact = {
    id: 102,
    type: "customer",
    display_name: productionCustomer.display_name,
    display_name_ar: productionCustomer.display_name_ar,
    email: productionCustomer.email,
    phone: productionCustomer.phone,
    vat_number: productionCustomer.vat_number,
    billing_address: {
      line_1: productionCustomer.billing_address.line_1,
      line_1_ar: productionCustomer.billing_address.line_1_ar,
      city: "Jeddah",
    },
  };

  return {
    html: await renderWorkspaceDocumentHtml({ document, template, contact }),
  };
}

async function listMergedPreviewDocuments() {
  const overlayDocuments = await readOptionalJsonFile<PreviewDocument[]>(previewDocumentsPath, []);
  const merged = mergeById(seededPreviewDocuments, overlayDocuments);
  const nextSequenceByType = new Map<string, number>();

  const normalized = merged.map((document) => {
    const isLegacyDraftNumber = /^INV-DRAFT-\d+$/i.test(document.document_number) || /^BILL-DRAFT-\d+$/i.test(document.document_number);

    if (!isLegacyDraftNumber) {
      return document;
    }

    const nextSequence = (nextSequenceByType.get(document.type) ?? 5000) + 1;
    nextSequenceByType.set(document.type, nextSequence);
    const normalizedNumber = buildDocumentNumber(document.type, nextSequence);
    const customFields = { ...(document.custom_fields ?? {}) };

    if (textValue(customFields.reference, "") === document.document_number) {
      customFields.reference = normalizedNumber;
    }

    if (textValue(customFields.linked_proforma_number, "") === document.document_number) {
      customFields.linked_proforma_number = normalizedNumber;
    }

    if (textValue(customFields.linked_delivery_note_number, "") === document.document_number) {
      customFields.linked_delivery_note_number = normalizedNumber;
    }

    if (textValue(customFields.linked_tax_invoice_number, "") === document.document_number) {
      customFields.linked_tax_invoice_number = normalizedNumber;
    }

    return {
      ...document,
      document_number: normalizedNumber,
      notes: textValue(document.notes, "") === document.document_number ? normalizedNumber : document.notes,
      custom_fields: customFields,
    };
  });

  return recomputeSalesBalances(dedupeDocumentRecords(normalized));
}

function findNormalizedDocumentCandidate(type: string | undefined, documents: PreviewDocument[]) {
  if (!type) {
    return null;
  }

  return documents
    .filter((document) => document.type === type)
    .sort((left, right) => right.id - left.id)[0] ?? null;
}

function normalizePreviewReference(value: string | undefined | null, type: string | undefined, documents: PreviewDocument[]) {
  const raw = textValue(value, "");

  if (!raw) {
    return raw;
  }

  if (!/^INV-DRAFT-\d+$/i.test(raw) && !/^BILL-DRAFT-\d+$/i.test(raw) && raw !== "DN-BROWSER-LINK") {
    return raw;
  }

  return findNormalizedDocumentCandidate(type, documents)?.document_number ?? raw;
}

function normalizePreviewDocumentLinks(
  links: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>,
  documents: PreviewDocument[],
) {
  return links.map((link) => {
    const linkedDocument = link.documentId
      ? documents.find((document) => document.id === link.documentId)
      : documents.find((document) => document.type === link.documentType && document.document_number === link.documentNumber)
        ?? findNormalizedDocumentCandidate(link.documentType, documents);

    return {
      ...link,
      documentId: linkedDocument?.id ?? link.documentId ?? null,
      documentNumber: linkedDocument?.document_number ?? normalizePreviewReference(link.documentNumber, link.documentType, documents),
      status: linkedDocument?.status ?? link.status ?? null,
    };
  });
}

function dedupeDocumentRecords(documents: PreviewDocument[]) {
  const seen = new Set<string>();

  return [...documents]
    .sort((left, right) => right.id - left.id)
    .filter((document) => {
      const key = `${document.type}:${document.document_number}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .sort((left, right) => right.id - left.id);
}

function recomputeSalesBalances(documents: PreviewDocument[]) {
  const bySourceId = new Map<number, { credit: number; debit: number }>();

  documents.forEach((document) => {
    if (!document.source_document_id) {
      return;
    }

    const current = bySourceId.get(document.source_document_id) ?? { credit: 0, debit: 0 };
    if (document.type === "credit_note") {
      current.credit = roundCurrency(current.credit + document.grand_total);
    }
    if (document.type === "debit_note") {
      current.debit = roundCurrency(current.debit + document.grand_total);
    }
    bySourceId.set(document.source_document_id, current);
  });

  return documents.map((document) => {
    if (!["tax_invoice", "cash_invoice", "api_invoice", "recurring_invoice"].includes(document.type)) {
      return document;
    }

    const related = bySourceId.get(document.id) ?? { credit: 0, debit: 0 };
    const nextBalance = roundCurrency(Math.max(document.grand_total - document.paid_total - related.credit + related.debit, 0));

    return {
      ...document,
      balance_due: nextBalance,
      custom_fields: {
        ...(document.custom_fields ?? {}),
        linked_credit_total: related.credit || null,
        linked_debit_total: related.debit || null,
        payment_tracking_status: nextBalance <= 0 ? "Paid" : document.paid_total > 0 || related.credit > 0 || related.debit > 0 ? "Partial" : "Open",
      },
      status: nextBalance <= 0 && document.grand_total > 0 ? "paid" : document.status,
    };
  });
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
      ? ["vendor_bill", "purchase_invoice", "purchase_order", "purchase_credit_note"].includes(document.type)
      : filters.group === "sales"
        ? ["tax_invoice", "credit_note", "debit_note", "quotation", "proforma_invoice", "delivery_note", "cash_invoice", "recurring_invoice", "api_invoice"].includes(document.type)
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

  const contacts = await listPreviewContacts();
  const contact = contacts.find((entry) => entry.id === document.contact_id) ?? null;
  const templates = await listPreviewTemplates();
  const template = (typeof templateId === "number" && templateId > 0
    ? templates.find((entry) => entry.id === templateId)
    : document.template?.id
      ? templates.find((entry) => entry.id === document.template?.id)
      : templates.find((entry) => entry.is_default && (entry.document_types ?? []).includes(document.type))
        ?? templates.find((entry) => (entry.document_types ?? []).includes(document.type)))
    ?? undefined;

  return {
    html: await renderWorkspaceDocumentHtmlV2({ document, template, contact }),
  };
}

function sanitizePdfFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export async function getPreviewDocumentPdf(documentId: number, templateId?: number | null) {
  const preview = await getPreviewDocumentPreview(documentId, templateId);

  if (!preview) {
    return null;
  }

  const document = await getPreviewDocumentDetail(documentId);

  if (!document) {
    return null;
  }

  const bytes = await renderDocumentPdf(preview.html);

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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function paymentTrackingStatus(document: PreviewDocument) {
  if (document.balance_due <= 0 && document.grand_total > 0) {
    return "paid";
  }

  if (document.paid_total > 0 && document.balance_due > 0) {
    return "partial";
  }

  if (document.balance_due > 0 && document.due_date && document.due_date < todayIsoDate()) {
    return "overdue";
  }

  return "open";
}

function paymentTrackingLabel(document: PreviewDocument) {
  const status = paymentTrackingStatus(document);
  return {
    paid: "Paid",
    partial: "Partial",
    overdue: "Overdue",
    open: "Open",
  }[status];
}

async function findPreviewInventoryRecordByItemId(itemId: number | null | undefined) {
  if (!itemId) {
    return null;
  }

  const inventory = await listPreviewInventoryStock();
  return inventory.find((record) => record.item_id === itemId) ?? null;
}

async function savePreviewInventoryRecord(record: PreviewInventoryRecord) {
  const inventory = await listPreviewInventoryStock();
  const nextInventory = inventory.some((item) => item.id === record.id)
    ? inventory.map((item) => item.id === record.id ? record : item)
    : [record, ...inventory];
  await writeJsonFile(previewInventoryPath, nextInventory);
}

async function savePreviewInventoryAdjustment(adjustment: PreviewInventoryAdjustment & { document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>; transaction_type?: string | null }) {
  const adjustments = await readOptionalJsonFile<Array<PreviewInventoryAdjustment & { document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>; transaction_type?: string | null }>>(previewInventoryAdjustmentsPath, []);
  const nextAdjustments = adjustments.some((item) => item.id === adjustment.id)
    ? adjustments.map((item) => item.id === adjustment.id ? adjustment : item)
    : [adjustment, ...adjustments];
  await writeJsonFile(previewInventoryAdjustmentsPath, nextAdjustments);
}

function salesDocumentLink(document: PreviewDocument) {
  return {
    documentId: document.id,
    documentNumber: document.document_number,
    documentType: document.type,
    status: document.status,
  };
}

function documentPrefixByType(type: string) {
  const normalized = type.toLowerCase();
  if (normalized === "proforma_invoice") return "AHN-PRO-QMS";
  if (normalized === "delivery_note") return "AHN-DLV-QMS";
  if (["tax_invoice", "cash_invoice", "api_invoice", "recurring_invoice"].includes(normalized)) return "AHN-INV-QMS";
  if (normalized === "credit_note") return "AHN-CRN-QMS";
  if (normalized === "debit_note") return "AHN-DBN-QMS";
  if (["vendor_bill", "purchase_invoice"].includes(normalized)) return "AHN-BIL-QMS";
  if (normalized === "purchase_order") return "AHN-PO-QMS";
  return "AHN-DOC-QMS";
}

function issueStatusForType(type: string) {
  if (type === "delivery_note") {
    return "posted";
  }

  if (isSalesDocument(type)) {
    return "finalized";
  }

  return "posted";
}

function buildDocumentNumber(type: string, sequence: number, suffix?: number | null) {
  const base = `${documentPrefixByType(type)}-${String(sequence).padStart(4, "0")}`;
  return suffix && suffix > 0 ? `${base}-${suffix}` : base;
}

async function generateNextDocumentNumber(type: string, preferred?: string | null, excludeId?: number | null) {
  const requested = textValue(preferred, "").trim();
  const documents = await listMergedPreviewDocuments();
  const taken = new Set(documents.filter((entry) => entry.id !== excludeId).map((entry) => entry.document_number));

  if (requested && !taken.has(requested)) {
    return requested;
  }

  const prefix = documentPrefixByType(type);
  const usedSequences = documents
    .filter((entry) => entry.id !== excludeId && entry.document_number.startsWith(prefix))
    .map((entry) => {
      const match = entry.document_number.match(/-(\d{4})(?:-(\d+))?$/);
      return match ? Number(match[1]) : 0;
    });

  const nextSequence = Math.max(505, ...usedSequences) + 1;
  let candidate = buildDocumentNumber(type, nextSequence);

  while (taken.has(candidate)) {
    const retrySequence = Number(candidate.match(/-(\d{4})/)?.[1] ?? nextSequence) + 1;
    candidate = buildDocumentNumber(type, retrySequence);
  }

  return candidate;
}

async function buildIssuedDuplicateNumber(originalNumber: string) {
  const documents = await listMergedPreviewDocuments();
  let suffix = 1;
  let candidate = `${originalNumber}-${suffix}`;

  while (documents.some((entry) => entry.document_number === candidate)) {
    suffix += 1;
    candidate = `${originalNumber}-${suffix}`;
  }

  return candidate;
}

function buildLinkChain(document: PreviewDocument) {
  const custom = document.custom_fields ?? {};
  const chain = [
    textValue(custom.linked_proforma_number, ""),
    textValue(custom.linked_delivery_note_number, ""),
    textValue(custom.linked_tax_invoice_number, ""),
    textValue(custom.linked_payment_number, ""),
  ].filter(Boolean);

  return chain.join(" -> ");
}

async function syncLinkedDocumentFields(document: PreviewDocument) {
  const customFields = { ...(document.custom_fields ?? {}) };
  const documents = await listMergedPreviewDocuments();

  const linkedProformaNumber = textValue(customFields.linked_proforma_number, "");
  const linkedDeliveryNumber = textValue(customFields.linked_delivery_note_number, textValue(customFields.delivery_note_number, ""));
  const linkedTaxNumber = textValue(customFields.linked_tax_invoice_number, "");

  const linkedProforma = linkedProformaNumber ? documents.find((entry) => entry.document_number === linkedProformaNumber && entry.type === "proforma_invoice") : null;
  const linkedDelivery = linkedDeliveryNumber ? documents.find((entry) => entry.document_number === linkedDeliveryNumber && entry.type === "delivery_note") : null;
  const linkedTaxInvoice = linkedTaxNumber ? documents.find((entry) => entry.document_number === linkedTaxNumber && entry.type === "tax_invoice") : null;

  if (linkedProforma) {
    customFields.linked_proforma_id = linkedProforma.id;
    customFields.linked_proforma_number = linkedProforma.document_number;
    customFields.linked_proforma_status = linkedProforma.status;
  }

  if (linkedDelivery) {
    customFields.linked_delivery_note_id = linkedDelivery.id;
    customFields.linked_delivery_note_number = linkedDelivery.document_number;
    customFields.linked_delivery_note_status = linkedDelivery.status;
  }

  if (linkedTaxInvoice) {
    customFields.linked_tax_invoice_id = linkedTaxInvoice.id;
    customFields.linked_tax_invoice_number = linkedTaxInvoice.document_number;
    customFields.linked_tax_invoice_status = linkedTaxInvoice.status;
  }

  const chain = [linkedProforma, linkedDelivery, linkedTaxInvoice].filter(Boolean) as PreviewDocument[];

  if (chain.length) {
    customFields.linked_chain = chain.map((entry) => `${labelizeDocumentType(entry.type)} ${entry.document_number}`).join(" -> ");
  }

  return { ...document, custom_fields: customFields };
}

function labelizeDocumentType(type: string) {
  return type.replaceAll("_", " ");
}

async function applyPreviewDeliveryInventory(document: PreviewDocument) {
  const adjustedLines = await Promise.all((document.lines ?? []).map(async (line) => {
    const inventoryRecord = await findPreviewInventoryRecordByItemId(line.item_id ?? null);
    if (!inventoryRecord) {
      return null;
    }

    const quantity = Number(line.quantity);
    const nextOnHand = roundCurrency(Math.max(inventoryRecord.quantity_on_hand - quantity, 0));
    const now = new Date().toISOString();
    const documentLinks = [
      ...(inventoryRecord.document_links ?? []),
      salesDocumentLink(document),
    ];

    const nextInventoryRecord: PreviewInventoryRecord = {
      ...inventoryRecord,
      quantity_on_hand: nextOnHand,
      journal_entry_number: `JE-DLV-${document.id}`,
      recorded_by: textValue(document.custom_fields?.recorded_by, "Workspace User"),
      document_links: documentLinks,
      updated_at: now,
    };

    await savePreviewInventoryRecord(nextInventoryRecord);

    const nextAdjustmentId = Math.max(...(await listPreviewInventoryAdjustments()).map((entry) => entry.id), 9500) + document.id + line.id;
    await savePreviewInventoryAdjustment({
      id: nextAdjustmentId,
      inventory_record_id: inventoryRecord.id,
      date: document.issue_date,
      reference: document.document_number,
      reason: "Delivery note inventory issue",
      item_count: 1,
      status: "posted",
      code: inventoryRecord.code,
      product_name: inventoryRecord.product_name,
      quantity,
      source: inventoryRecord.source,
      recorded_by: textValue(document.custom_fields?.recorded_by, "Workspace User"),
      journal_entry_number: `JE-DLV-${document.id}`,
      inventory_account_code: inventoryRecord.inventory_account_code ?? "1150",
      inventory_account_name: inventoryRecord.inventory_account_name ?? "Inventory",
      attachments: inventoryRecord.attachments ?? [],
      document_links: documentLinks,
      transaction_type: "delivery_note",
    });

    return {
      code: inventoryRecord.code,
      onHandBefore: inventoryRecord.quantity_on_hand,
      onHandAfter: nextOnHand,
    };
  }));

  const validAdjustments = adjustedLines.filter(Boolean) as Array<{ code: string; onHandBefore: number; onHandAfter: number }>;
  if (!validAdjustments.length) {
    return document;
  }

  return {
    ...document,
    custom_fields: {
      ...(document.custom_fields ?? {}),
      delivery_status: "Delivered",
      inventory_before_after: validAdjustments.map((entry) => `${entry.code}: ${entry.onHandBefore} -> ${entry.onHandAfter}`).join(" | "),
      recorded_at: new Date().toISOString(),
    },
  };
}

function buildPreviewJournalEntries(documents: PreviewDocument[], payments: PreviewPayment[], adjustments: Array<PreviewInventoryAdjustment & { document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>; transaction_type?: string | null }>) {
  const entries: Array<{
    id: number;
    entry_number: string;
    entry_date: string;
    posting_date: string;
    reference: string;
    memo: string;
    source_type: string | null;
    source_id: number | null;
    status: string;
    created_by_name?: string | null;
    metadata?: Record<string, unknown> | null;
    lines: Array<{ id: number; line_no: number; account_id?: number; account_code?: string | null; account_name?: string | null; debit: string | number; credit: string | number; description?: string | null; document_id?: number | null; document_number?: string | null; document_type?: string | null; document_status?: string | null; inventory_item_id?: number | null }>;
  }> = [];
  let entryId = 30000;
  let lineId = 60000;

  const addEntry = (entry: Omit<(typeof entries)[number], "id">) => {
    entries.push({ ...entry, id: ++entryId });
  };

  documents.filter((document) => document.status !== "draft").forEach((document) => {
    const paymentStatus = paymentTrackingLabel(document);
    const createdBy = textValue(document.custom_fields?.recorded_by, "Workspace User");

    if (document.type === "delivery_note") {
      addEntry({
        entry_number: `JE-DLV-${document.id}`,
        entry_date: document.issue_date,
        posting_date: document.issue_date,
        reference: document.document_number,
        memo: "Delivery note stock release",
        source_type: "delivery_note",
        source_id: document.id,
        status: "posted",
        created_by_name: createdBy,
        metadata: { payment_status: paymentStatus },
        lines: [
          { id: ++lineId, line_no: 1, account_code: "5000", account_name: "Cost of Goods Sold", debit: document.taxable_total, credit: 0, description: "COGS recognized", document_id: document.id, document_number: document.document_number, document_type: document.type, document_status: document.status },
          { id: ++lineId, line_no: 2, account_code: "1150", account_name: "Inventory", debit: 0, credit: document.taxable_total, description: "Inventory released", document_id: document.id, document_number: document.document_number, document_type: document.type, document_status: document.status },
        ],
      });
      return;
    }

    if (["tax_invoice", "cash_invoice", "recurring_invoice", "api_invoice", "debit_note"].includes(document.type)) {
      addEntry({
        entry_number: `JE-SLS-${document.id}`,
        entry_date: document.issue_date,
        posting_date: document.issue_date,
        reference: document.document_number,
        memo: "Sales invoice recognition",
        source_type: document.type,
        source_id: document.id,
        status: "posted",
        created_by_name: createdBy,
        metadata: { payment_status: paymentStatus },
        lines: [
          { id: ++lineId, line_no: 1, account_code: "1100", account_name: "Accounts Receivable", debit: document.grand_total, credit: 0, description: "Receivable recognized", document_id: document.id, document_number: document.document_number, document_type: document.type, document_status: document.status },
          { id: ++lineId, line_no: 2, account_code: "4000", account_name: "Sales Revenue", debit: 0, credit: document.taxable_total, description: "Revenue recognized", document_id: document.id, document_number: document.document_number, document_type: document.type, document_status: document.status },
          { id: ++lineId, line_no: 3, account_code: "2200", account_name: "VAT Payable", debit: 0, credit: document.tax_total, description: "Output VAT recognized", document_id: document.id, document_number: document.document_number, document_type: document.type, document_status: document.status },
        ],
      });
      return;
    }

    if (document.type === "credit_note") {
      addEntry({
        entry_number: `JE-CRN-${document.id}`,
        entry_date: document.issue_date,
        posting_date: document.issue_date,
        reference: document.document_number,
        memo: "Credit note reversal",
        source_type: document.type,
        source_id: document.id,
        status: "posted",
        created_by_name: createdBy,
        metadata: { payment_status: paymentStatus },
        lines: [
          { id: ++lineId, line_no: 1, account_code: "4000", account_name: "Sales Revenue", debit: document.taxable_total, credit: 0, description: "Revenue reversed", document_id: document.id, document_number: document.document_number, document_type: document.type, document_status: document.status },
          { id: ++lineId, line_no: 2, account_code: "2200", account_name: "VAT Payable", debit: document.tax_total, credit: 0, description: "VAT reversed", document_id: document.id, document_number: document.document_number, document_type: document.type, document_status: document.status },
          { id: ++lineId, line_no: 3, account_code: "1100", account_name: "Accounts Receivable", debit: 0, credit: document.grand_total, description: "Receivable reduced", document_id: document.id, document_number: document.document_number, document_type: document.type, document_status: document.status },
        ],
      });
      return;
    }

    if (["vendor_bill", "purchase_invoice"].includes(document.type)) {
      addEntry({
        entry_number: `JE-PUR-${document.id}`,
        entry_date: document.issue_date,
        posting_date: document.issue_date,
        reference: document.document_number,
        memo: "Purchase recognition",
        source_type: document.type,
        source_id: document.id,
        status: "posted",
        created_by_name: createdBy,
        metadata: null,
        lines: [
          { id: ++lineId, line_no: 1, account_code: "6000", account_name: "Operating Expense", debit: document.taxable_total, credit: 0, description: "Expense recognized", document_id: document.id, document_number: document.document_number, document_type: document.type, document_status: document.status },
          { id: ++lineId, line_no: 2, account_code: "1300", account_name: "VAT Receivable", debit: document.tax_total, credit: 0, description: "Input VAT recognized", document_id: document.id, document_number: document.document_number, document_type: document.type, document_status: document.status },
          { id: ++lineId, line_no: 3, account_code: "2000", account_name: "Accounts Payable", debit: 0, credit: document.grand_total, description: "Payable recognized", document_id: document.id, document_number: document.document_number, document_type: document.type, document_status: document.status },
        ],
      });
    }
  });

  payments.forEach((payment) => {
    const isIncoming = payment.direction === "incoming";
    addEntry({
      entry_number: `JE-PAY-${payment.id}`,
      entry_date: payment.payment_date,
      posting_date: payment.payment_date,
      reference: payment.payment_number,
      memo: isIncoming ? "Customer payment received" : "Supplier payment posted",
      source_type: "payment",
      source_id: payment.id,
      status: "posted",
      created_by_name: "Workspace User",
      metadata: null,
      lines: [
        { id: ++lineId, line_no: 1, account_code: "1200", account_name: "Main Bank Account", debit: payment.amount, credit: 0, description: isIncoming ? "Cash received" : "Payment posted", document_id: payment.document_id ?? null, document_number: payment.document_number ?? payment.payment_number, document_type: isIncoming ? "tax_invoice" : "vendor_bill", document_status: "paid" },
        { id: ++lineId, line_no: 2, account_code: isIncoming ? "1100" : "2000", account_name: isIncoming ? "Accounts Receivable" : "Accounts Payable", debit: 0, credit: payment.amount, description: isIncoming ? "Receivable settled" : "Payable settled", document_id: payment.document_id ?? null, document_number: payment.document_number ?? payment.payment_number, document_type: isIncoming ? "tax_invoice" : "vendor_bill", document_status: "paid" },
      ],
    });
  });

  adjustments.filter((entry) => entry.transaction_type === "delivery_note").forEach((entry) => {
    if (entries.some((journal) => journal.reference === entry.reference && journal.source_type === "delivery_note")) {
      return;
    }
    addEntry({
      entry_number: entry.journal_entry_number ?? `JE-DLV-${entry.id}`,
      entry_date: entry.date,
      posting_date: entry.date,
      reference: entry.reference,
      memo: entry.reason,
      source_type: "delivery_note",
      source_id: entry.id,
      status: "posted",
      created_by_name: entry.recorded_by ?? "Workspace User",
      metadata: null,
      lines: [
        { id: ++lineId, line_no: 1, account_code: "5000", account_name: "Cost of Goods Sold", debit: entry.quantity, credit: 0, description: "COGS recognized", document_id: entry.document_links?.[0]?.documentId ?? null, document_number: entry.reference, document_type: "delivery_note", document_status: entry.status },
        { id: ++lineId, line_no: 2, account_code: "1150", account_name: "Inventory", debit: 0, credit: entry.quantity, description: "Inventory released", document_id: entry.document_links?.[0]?.documentId ?? null, document_number: entry.reference, document_type: "delivery_note", document_status: entry.status },
      ],
    });
  });

  return entries.sort((left, right) => right.entry_date.localeCompare(left.entry_date) || right.id - left.id);
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

async function listPreviewManualJournals() {
  return readOptionalJsonFile<PreviewManualJournal[]>(previewJournalsPath, []);
}

export async function createPreviewJournal(payload: {
  entry_date: string;
  posting_date?: string | null;
  reference?: string | null;
  memo?: string | null;
  metadata?: Record<string, unknown> | null;
  lines: Array<{ account_id: number; debit: number; credit: number; description?: string | null; document_id?: number | null; inventory_item_id?: number | null }>;
}) {
  const journals = await listPreviewManualJournals();
  const documents = await listMergedPreviewDocuments();
  const entryId = Math.max(...journals.map((journal) => journal.id), 39999) + 1;
  const entryNumber = `JE-MAN-${entryId}`;
  const saleIntel = (payload.metadata?.sale_intelligence as Record<string, unknown> | undefined) ?? {};
  const linkedRefs = [
    textValue(saleIntel.proforma_invoice, ""),
    textValue(saleIntel.delivery_note, ""),
    textValue(saleIntel.tax_invoice, ""),
  ].filter(Boolean);
  const sourceContext = textValue(payload.metadata?.source_context, "manual") || "manual";

  const nextJournal: PreviewManualJournal = {
    id: entryId,
    entry_number: entryNumber,
    entry_date: payload.entry_date,
    posting_date: payload.posting_date ?? payload.entry_date,
    reference: textValue(payload.reference, entryNumber),
    memo: textValue(payload.memo, "Manual journal entry"),
    source_type: sourceContext,
    source_id: null,
    status: "posted",
    created_by_name: "Workspace User",
    metadata: {
      ...(payload.metadata ?? {}),
      linked_chain: linkedRefs.join(" -> ") || null,
    },
    lines: payload.lines.map((line, index) => {
      const linkedDocument = line.document_id ? documents.find((document) => document.id === line.document_id) : null;
      return {
        id: entryId * 10 + index + 1,
        line_no: index + 1,
        account_id: line.account_id,
        account_code: defaultChartOfAccounts.find((account) => account.id === line.account_id)?.code ?? "",
        account_name: defaultChartOfAccounts.find((account) => account.id === line.account_id)?.name ?? "",
        debit: line.debit,
        credit: line.credit,
        description: line.description ?? null,
        document_id: linkedDocument?.id ?? line.document_id ?? null,
        document_number: linkedDocument?.document_number ?? null,
        document_type: linkedDocument?.type ?? null,
        document_status: linkedDocument?.status ?? null,
        inventory_item_id: line.inventory_item_id ?? null,
      };
    }),
  };

  await writeJsonFile(previewJournalsPath, [nextJournal, ...journals]);
  return nextJournal;
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
  const contact = contacts.find((item) => item.id === payload.contact_id);
  const template = templates.find((item) => item.id === payload.template_id);
  const type = payload.type ?? (kind === "sales" ? "tax_invoice" : "vendor_bill");
  const documentNumber = await generateNextDocumentNumber(type, reference || null);
  const customFields = {
    ...(payload.custom_fields ?? {}),
    reference: documentNumber,
  };
  const nextDocument: PreviewDocument = {
    id: nextId,
    type,
    status: "draft",
    contact_id: payload.contact_id,
    document_number: documentNumber,
    issue_date: payload.issue_date,
    supply_date: textValue(payload.custom_fields?.supply_date, payload.issue_date),
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
    custom_fields: customFields,
    template: template ? { id: template.id, name: template.name } : null,
    notes: payload.notes ?? "",
    compliance_metadata: kind === "sales"
      ? { zatca: { seller_name: previewCompany.sellerName, vat_number: previewCompany.vatNumber } }
      : null,
    source_document_id: null,
    reversal_of_document_id: null,
    version: 1,
    status_reason: null,
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
  const type = payload.type ?? current.type;
  const nextDocumentNumber = current.status === "draft"
    ? await generateNextDocumentNumber(type, String(payload.custom_fields?.reference ?? current.document_number), current.id)
    : current.document_number;
  const customFields = {
    ...(payload.custom_fields ?? current.custom_fields),
    reference: nextDocumentNumber,
  };
  const updated: PreviewDocument = {
    ...current,
    type,
    contact_id: payload.contact_id,
    issue_date: payload.issue_date,
    supply_date: textValue(payload.custom_fields?.supply_date, current.supply_date ?? payload.issue_date),
    due_date: payload.due_date,
    grand_total: totals.grandTotal,
    tax_total: totals.taxTotal,
    taxable_total: totals.subtotal,
    balance_due: roundCurrency(Math.max(totals.grandTotal - current.paid_total, 0)),
    contact: { display_name: contact?.display_name ?? current.contact.display_name },
    title: payload.title?.trim() || current.title,
    language_code: payload.language_code ?? current.language_code,
    sent_to_email: contact?.email ?? current.sent_to_email ?? null,
    custom_fields: customFields,
    document_number: nextDocumentNumber,
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

  const finalizedNumber = await generateNextDocumentNumber(current.type, current.document_number, current.id);
  const nextStatus = issueStatusForType(current.type);
  let updated: PreviewDocument = {
    ...current,
    document_number: finalizedNumber,
    status: nextStatus,
    custom_fields: {
      ...(current.custom_fields ?? {}),
      reference: finalizedNumber,
      recorded_by: textValue(current.custom_fields?.recorded_by, "Workspace User"),
      recorded_at: new Date().toISOString(),
      payment_tracking_status: paymentTrackingLabel(current),
    },
  };

  updated = await syncLinkedDocumentFields(updated);

  if (current.type === "delivery_note") {
    updated = await applyPreviewDeliveryInventory(updated);
  }

  if (current.type === "proforma_invoice") {
    updated = {
      ...updated,
      custom_fields: {
        ...(updated.custom_fields ?? {}),
        payment_status: textValue(updated.custom_fields?.payment_status, "Open"),
      },
    };
  }

  await saveOverlayDocument(updated);
  return updated;
}

export async function duplicatePreviewDocument(documentId: number) {
  const current = await getPreviewDocumentDetail(documentId);

  if (!current) {
    return null;
  }

  const kind = isSalesDocument(current.type) ? "sales" : "purchase";
  const duplicateNumber = await buildIssuedDuplicateNumber(current.document_number);
  const duplicate = await createPreviewDocument(kind, {
    type: current.type,
    title: `${current.title} Duplicate`,
    template_id: current.template?.id ?? null,
    language_code: current.language_code,
    custom_fields: {
      ...(current.custom_fields ?? {}),
      reference: duplicateNumber,
      duplicated_from_document_id: current.id,
      duplicated_from_document_number: current.document_number,
      duplicated_under_zatca_rule: true,
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

  const voidedOriginal: PreviewDocument = {
    ...current,
    status: "void",
    status_reason: "VOID",
    custom_fields: {
      ...(current.custom_fields ?? {}),
      void_reason: "Reissued by duplicate under ZATCA edit compliance.",
      superseded_by_document_id: duplicate?.id ?? null,
      superseded_by_document_number: duplicate?.document_number ?? duplicateNumber,
    },
  };

  await saveOverlayDocument(voidedOriginal);
  return duplicate;
}

export async function sendPreviewDocument(documentId: number, payload?: { email?: string | null; subject?: string | null }) {
  const current = await getPreviewDocument(documentId);

  if (!current) {
    return null;
  }

  const contacts = await listPreviewContacts();
  const contact = contacts.find((item) => item.id === current.contact_id) ?? null;

  const updated: PreviewDocument = {
    ...current,
    status: current.status === "draft" ? "finalized" : current.status,
    sent_at: new Date().toISOString(),
    sent_to_email: payload?.email?.trim() || current.sent_to_email || contact?.email || null,
  };

  await saveOverlayDocument(updated);
  return getPreviewDocumentDetail(updated.id);
}

export async function listPreviewPayments() {
  const overlayPayments = await readOptionalJsonFile<PreviewPayment[]>(previewPaymentsPath, []);
  const payments = mergeById(seededPreviewPayments, overlayPayments);
  const documents = await listMergedPreviewDocuments();

  return payments.map((payment) => {
    const linkedDocument = documents.find((document) => document.id === payment.document_id);

    if (!linkedDocument) {
      return {
        ...payment,
        document_number: normalizePreviewReference(payment.document_number, "tax_invoice", documents),
      };
    }

    return {
      ...payment,
      document_number: linkedDocument.document_number,
    };
  });
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
    custom_fields: {
      ...(current.custom_fields ?? {}),
      payment_status: balanceDue <= 0 ? "Paid" : paidTotal > 0 ? "Partial" : "Open",
      amount_received: paidTotal,
      receipt_date: payload.payment_date,
      payment_reference_note: payload.reference ?? null,
      payment_tracking_status: balanceDue <= 0 ? "Paid" : paidTotal > 0 ? "Partial" : "Open",
      recorded_by: textValue(current.custom_fields?.recorded_by, "Workspace User"),
      recorded_at: new Date().toISOString(),
      linked_payment_number: nextPayment.payment_number,
      linked_chain: [
        textValue(current.custom_fields?.linked_proforma_number, ""),
        textValue(current.custom_fields?.linked_delivery_note_number, ""),
        textValue(current.custom_fields?.linked_tax_invoice_number, current.document_number),
        nextPayment.payment_number,
      ].filter(Boolean).join(" -> "),
    },
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
  const journalEntries = await listPreviewJournals();

  journalEntries.forEach((entry) => {
    entry.lines.forEach((line) => {
      rows.push({
        id: ++runningId,
        entry_number: entry.entry_number,
        entry_date: entry.entry_date,
        account_code: line.account_code ?? "",
        account_name: line.account_name ?? "",
        contact_name: documents.find((document) => document.id === line.document_id)?.contact.display_name ?? payments.find((payment) => payment.document_id === line.document_id)?.contact_name ?? "",
        document_number: line.document_number ?? entry.reference,
        cost_center_code: line.account_code === "2200" || line.account_code === "1300" ? "VAT" : line.account_code === "5000" ? "COGS" : "OPS",
        cost_center_name: line.account_code === "2200" || line.account_code === "1300" ? "VAT" : line.account_code === "5000" ? "Cost of Sales" : "Operations",
        description: line.description ?? entry.memo,
        debit: numericValue(line.debit),
        credit: numericValue(line.credit),
        running_balance: 0,
      });
    });
  });

  return rows;
}

function trialBalanceRowTypeForAccount(code: string): "asset" | "liability" | "equity" | "income" | "expense" {
  const account = defaultChartOfAccounts.find((a) => a.code === code);
  if (!account) {
    return "asset";
  }
  if (account.accountClass === "income") {
    return "income";
  }
  if (account.accountClass === "expense" || account.accountClass === "cost_of_sales") {
    return "expense";
  }
  if (account.accountClass === "liability") {
    return "liability";
  }
  if (account.accountClass === "equity") {
    return "equity";
  }
  if (account.accountClass === "contra" && account.group === "contra_revenue") {
    return "expense";
  }
  if (account.accountClass === "asset" || account.accountClass === "contra") {
    return "asset";
  }
  return "asset";
}

export async function listPreviewTrialBalance() {
  const ledger = await listPreviewGeneralLedger();
  const accounts = new Map<string, { code: string; name: string; type: string; debit_total: number; credit_total: number; balance: number }>();

  ledger.forEach((row) => {
    const rowType = trialBalanceRowTypeForAccount(row.account_code);
    const name = defaultChartOfAccounts.find((a) => a.code === row.account_code)?.name ?? row.account_name;
    const current = accounts.get(row.account_code) ?? { code: row.account_code, name, type: rowType, debit_total: 0, credit_total: 0, balance: 0 };
    current.debit_total = roundCurrency(current.debit_total + row.debit);
    current.credit_total = roundCurrency(current.credit_total + row.credit);
    current.balance = roundCurrency(current.debit_total - current.credit_total);
    current.name = name;
    current.type = rowType;
    accounts.set(row.account_code, current);
  });

  return [...accounts.values()].sort((left, right) => left.code.localeCompare(right.code));
}

export async function listPreviewAuditTrail() {
  const documents = await listMergedPreviewDocuments();
  const payments = await listPreviewPayments();
  const manualJournals = await listPreviewManualJournals();
  const events = documents.map((document) => ({
    id: 9000 + document.id,
    event: document.status === "draft" ? "documents.created" : "documents.finalized",
    auditable_type: "App\\Models\\Document",
    auditable_id: document.id,
    created_at: `${document.issue_date}T09:00:00Z`,
    detail: `${labelizeDocumentType(document.type)} ${document.document_number}${document.type === "delivery_note" ? ` -> Stock impact ${textValue(document.custom_fields?.inventory_before_after, "pending")}` : ""}${document.type === "tax_invoice" ? ` -> VAT ${roundCurrency(document.tax_total)}` : ""}${buildLinkChain(document) ? ` -> Links ${buildLinkChain(document)}` : ""}${textValue(document.custom_fields?.temporary_accounting_reference, "") ? ` -> Temp ${textValue(document.custom_fields?.temporary_accounting_reference)}` : ""}${textValue(document.custom_fields?.vat_decision_summary, "") ? ` -> ${textValue(document.custom_fields?.vat_decision_summary)}` : ""}`,
    metadata: {
      journal_entry_reference: document.type === "delivery_note" ? `JE-DLV-${document.id}` : document.type === "tax_invoice" ? `JE-SLS-${document.id}` : null,
      product_or_service: (document.lines ?? []).some((line) => line.item_id) ? "product" : "service",
      linked_chain: buildLinkChain(document) || null,
      payment_status: textValue(document.custom_fields?.payment_status, "") || null,
      temporary_accounting_reference: textValue(document.custom_fields?.temporary_accounting_reference, "") || null,
      vat_decision_summary: textValue(document.custom_fields?.vat_decision_summary, "") || null,
      vat_decision_reason: textValue(document.custom_fields?.vat_decision_reason, "") || null,
    },
  }));
  const paymentEvents = payments.map((payment) => ({
    id: 9500 + payment.id,
    event: "payments.recorded",
    auditable_type: "App\\Models\\Payment",
    auditable_id: payment.id,
    created_at: `${payment.payment_date}T11:00:00Z`,
    detail: `Payment ${payment.payment_number} posted -> Linked invoice ${payment.document_number ?? "-"} -> Journal JE-PAY-${payment.id}`,
    metadata: {
      journal_entry_reference: `JE-PAY-${payment.id}`,
      linked_chain: [payment.document_number, payment.payment_number].filter(Boolean).join(" -> "),
    },
  }));

  const journalEvents = manualJournals.map((entry) => ({
    id: `journal-${entry.id}`,
    event: "journals.created",
    auditable_type: "App\\Models\\JournalEntry",
    auditable_id: entry.id,
    created_at: `${entry.entry_date}T13:00:00Z`,
    detail: `Journal ${entry.entry_number} posted${textValue(entry.metadata?.linked_chain, "") ? ` -> Links ${textValue(entry.metadata?.linked_chain)}` : ""}`,
    metadata: {
      journal_entry_reference: entry.entry_number,
      linked_chain: textValue(entry.metadata?.linked_chain, "") || null,
      source_context: textValue(entry.metadata?.source_context, "") || null,
      vat_decision_summary: textValue(entry.metadata?.vat_decision_summary, "") || null,
    },
  }));

  return [...events, ...paymentEvents, ...journalEvents].sort((left, right) => right.created_at.localeCompare(left.created_at));
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
      name: "Output VAT",
      tax_rate: 15,
      taxable_amount: roundCurrency(outputTaxableAmount),
      tax_amount: roundCurrency(outputTaxAmount),
    },
    {
      code: "P15",
      name: "Input VAT",
      tax_rate: 15,
      taxable_amount: roundCurrency(inputTaxableAmount),
      tax_amount: roundCurrency(inputTaxAmount),
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

export async function listPreviewJournals() {
  const documents = await listMergedPreviewDocuments();
  const payments = await listPreviewPayments();
  const adjustments = await readOptionalJsonFile<Array<PreviewInventoryAdjustment & { document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>; transaction_type?: string | null }>>(previewInventoryAdjustmentsPath, []);
  const autoEntries = buildPreviewJournalEntries(documents, payments, adjustments);
  const manualEntries = await listPreviewManualJournals();
  return [...manualEntries, ...autoEntries].sort((left, right) => right.entry_date.localeCompare(left.entry_date));
}

export async function createPreviewInventoryAdjustment(payload: {
  inventory_item_id: number;
  quantity_delta: number;
  unit_cost?: number | null;
  reason?: string | null;
  reference?: string | null;
  transaction_date?: string | null;
  attachments?: Attachment[];
  document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>;
}) {
  const inventory = await listPreviewInventoryStock();
  const record = inventory.find((item) => item.id === payload.inventory_item_id);
  if (!record) {
    throw new Error("Inventory record not found.");
  }

  const date = payload.transaction_date ?? todayIsoDate();
  const nextQuantity = roundCurrency(record.quantity_on_hand + payload.quantity_delta);
  const nextRecord: PreviewInventoryRecord = {
    ...record,
    quantity_on_hand: nextQuantity,
    updated_at: `${date}T09:00:00.000Z`,
    recorded_by: "Workspace User",
    journal_entry_number: `JE-ADJ-${record.id}`,
    attachments: payload.attachments ?? record.attachments ?? [],
    document_links: payload.document_links ?? record.document_links ?? [],
  };
  await savePreviewInventoryRecord(nextRecord);

  const adjustments = await readOptionalJsonFile<Array<PreviewInventoryAdjustment & { document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>; transaction_type?: string | null }>>(previewInventoryAdjustmentsPath, []);
  const nextAdjustment = {
    id: Math.max(...adjustments.map((entry) => entry.id), 9500) + 1,
    inventory_record_id: record.id,
    date,
    reference: payload.reference ?? `ADJ-${record.code}`,
    reason: payload.reason ?? "Inventory adjustment",
    item_count: 1,
    status: "posted" as const,
    code: record.code,
    product_name: record.product_name,
    quantity: Math.abs(payload.quantity_delta),
    source: record.source,
    recorded_by: "Workspace User",
    journal_entry_number: `JE-ADJ-${record.id}`,
    inventory_account_code: record.inventory_account_code ?? "1150",
    inventory_account_name: record.inventory_account_name ?? "Inventory",
    attachments: payload.attachments ?? [],
    document_links: payload.document_links ?? [],
    transaction_type: "inventory_adjustment",
  };
  await savePreviewInventoryAdjustment(nextAdjustment);
  return nextAdjustment;
}

export async function createPreviewInventorySale(payload: {
  inventory_item_id: number;
  quantity: number;
  unit_price: number;
  unit_cost?: number | null;
  reference?: string | null;
  transaction_date?: string | null;
  proforma_invoice?: string | null;
  tax_invoice?: string | null;
  delivery_note?: string | null;
  attachments?: Attachment[];
  document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>;
}) {
  const inventory = await listPreviewInventoryStock();
  const record = inventory.find((item) => item.id === payload.inventory_item_id);
  if (!record) {
    throw new Error("Inventory record not found.");
  }

  const date = payload.transaction_date ?? todayIsoDate();
  const nextQuantity = roundCurrency(Math.max(record.quantity_on_hand - payload.quantity, 0));
  const links = payload.document_links ?? [
    payload.proforma_invoice ? { documentId: null, documentNumber: payload.proforma_invoice, documentType: "proforma_invoice", status: "linked" } : null,
    payload.tax_invoice ? { documentId: null, documentNumber: payload.tax_invoice, documentType: "tax_invoice", status: "linked" } : null,
    payload.delivery_note ? { documentId: null, documentNumber: payload.delivery_note, documentType: "delivery_note", status: "linked" } : null,
  ].filter(Boolean) as Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>;

  const nextRecord: PreviewInventoryRecord = {
    ...record,
    quantity_on_hand: nextQuantity,
    updated_at: `${date}T09:00:00.000Z`,
    recorded_by: "Workspace User",
    journal_entry_number: `JE-SALE-${record.id}`,
    attachments: payload.attachments ?? record.attachments ?? [],
    document_links: [...(record.document_links ?? []), ...links],
  };
  await savePreviewInventoryRecord(nextRecord);

  const adjustments = await readOptionalJsonFile<Array<PreviewInventoryAdjustment & { document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>; transaction_type?: string | null }>>(previewInventoryAdjustmentsPath, []);
  const nextAdjustment = {
    id: Math.max(...adjustments.map((entry) => entry.id), 9500) + 1,
    inventory_record_id: record.id,
    date,
    reference: payload.reference ?? payload.delivery_note ?? `SAL-${record.code}`,
    reason: "Inventory sale",
    item_count: 1,
    status: "posted" as const,
    code: record.code,
    product_name: record.product_name,
    quantity: payload.quantity,
    source: record.source,
    recorded_by: "Workspace User",
    journal_entry_number: `JE-SALE-${record.id}`,
    inventory_account_code: record.inventory_account_code ?? "1150",
    inventory_account_name: record.inventory_account_name ?? "Inventory",
    attachments: payload.attachments ?? [],
    document_links: links,
    transaction_type: payload.delivery_note ? "delivery_note" : "inventory_sale",
  };
  await savePreviewInventoryAdjustment(nextAdjustment);
  return nextAdjustment;
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

function buildPrintableDocumentShell(previewHtml: string) {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700;800&display=swap');
          @page { margin: 10mm; size: A4; }
          html, body { margin: 0; padding: 0; background: white; color: #183226; }
          body { font-family: ${documentFontStack}; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          article { box-shadow: none !important; }
          [dir='rtl'] { font-family: ${arabicFontStack}; direction: rtl; unicode-bidi: isolate; text-align: right; }
        </style>
      </head>
      <body>${previewHtml}</body>
    </html>
  `.trim();
}

async function readPreviewReconciliationStore(): Promise<PreviewReconciliationStore> {
  return readOptionalJsonFile<PreviewReconciliationStore>(previewReconciliationPath, { statementLines: [] });
}

async function writePreviewReconciliationStore(value: PreviewReconciliationStore) {
  await writeJsonFile(previewReconciliationPath, value);
}

function previewBankAccountCatalog() {
  return defaultChartOfAccounts
    .filter((account) => account.accountClass === "asset" && ["bank"].includes(account.subtype ?? ""))
    .map((account) => ({ id: account.id, code: account.code, name: account.name, normal_balance: account.normalBalance }));
}

function amountForJournalLine(line: { debit: string | number; credit: string | number }) {
  const debit = numericValue(line.debit);
  const credit = numericValue(line.credit);
  return { debit, credit, amount: debit > 0 ? debit : credit };
}

export async function listPreviewBankAccounts() {
  const journals = await listPreviewJournals();
  const catalog = previewBankAccountCatalog();

  return catalog.map((account) => {
    const balance = journals.reduce((sum, journal) => {
      const matchedLine = journal.lines.find((line) => String(line.account_code) === account.code);
      if (!matchedLine) {
        return sum;
      }

      return sum + numericValue(matchedLine.debit) - numericValue(matchedLine.credit);
    }, 0);

    return {
      id: account.id,
      code: account.code,
      name: account.name,
      normal_balance: account.normal_balance,
      balance: roundCurrency(balance),
    };
  });
}

export async function listPreviewStatementLines(accountId: number, filters?: { status?: string | null; fromDate?: string | null; toDate?: string | null }) {
  const store = await readPreviewReconciliationStore();

  return store.statementLines
    .filter((line) => line.bank_account_id === accountId)
    .filter((line) => !filters?.status || line.status === filters.status)
    .filter((line) => !filters?.fromDate || line.transaction_date >= filters.fromDate)
    .filter((line) => !filters?.toDate || line.transaction_date <= filters.toDate)
    .sort((left, right) => right.transaction_date.localeCompare(left.transaction_date) || right.id - left.id);
}

export async function importPreviewStatementLines(accountId: number, lines: Array<{
  transaction_date: string;
  value_date?: string | null;
  reference?: string | null;
  description?: string | null;
  debit?: number | null;
  credit?: number | null;
  running_balance?: number | null;
}>) {
  const store = await readPreviewReconciliationStore();
  const existing = store.statementLines.filter((line) => line.bank_account_id === accountId);
  let nextId = Math.max(9700, ...store.statementLines.map((line) => line.id)) + 1;
  const warnings: string[] = [];
  const created: PreviewStatementLine[] = [];
  let skippedRows = 0;

  for (const input of lines) {
    const duplicate = existing.find((line) =>
      line.transaction_date === input.transaction_date
      && (line.reference ?? "") === (input.reference ?? "")
      && numericValue(line.debit) === numericValue(input.debit)
      && numericValue(line.credit) === numericValue(input.credit)
    );

    if (duplicate) {
      skippedRows += 1;
      warnings.push(`Skipped duplicate reference ${input.reference ?? "without reference"} on ${input.transaction_date}.`);
      continue;
    }

    const createdLine: PreviewStatementLine = {
      id: nextId,
      bank_account_id: accountId,
      transaction_date: input.transaction_date,
      value_date: input.value_date ?? null,
      reference: input.reference ?? null,
      description: input.description ?? null,
      debit: roundCurrency(numericValue(input.debit)),
      credit: roundCurrency(numericValue(input.credit)),
      running_balance: roundCurrency(numericValue(input.running_balance)),
      status: "unmatched",
      matched_journal_line_id: null,
      reconciled_at: null,
      notes: null,
    };
    nextId += 1;
    created.push(createdLine);
    existing.push(createdLine);
  }

  await writePreviewReconciliationStore({ statementLines: [...store.statementLines, ...created] });

  return {
    data: created,
    summary: {
      totalRows: lines.length,
      validRows: lines.length,
      invalidRows: 0,
      importedRows: created.length,
      skippedRows,
      failedRows: 0,
      generatedRecords: created.map((line) => ({ id: line.id, reference: line.reference, transactionDate: line.transaction_date })),
      warnings,
      errors: [],
    },
  };
}

export async function listPreviewStatementLineCandidates(accountId: number, statementLineId: number) {
  const journals = await listPreviewJournals();
  const store = await readPreviewReconciliationStore();
  const account = previewBankAccountCatalog().find((entry) => entry.id === accountId);
  const statementLine = store.statementLines.find((line) => line.id === statementLineId && line.bank_account_id === accountId);
  if (!statementLine || !account) {
    return [];
  }

  const usedJournalLineIds = new Set(store.statementLines.map((line) => line.matched_journal_line_id).filter((value): value is number => typeof value === "number"));
  const amount = statementLine.debit > 0 ? statementLine.debit : statementLine.credit;
  const targetSide = statementLine.debit > 0 ? "credit" : "debit";

  return journals
    .flatMap((journal) => journal.lines.map((line) => ({ journal, line })))
    .filter(({ line }) => String(line.account_code ?? "") === account.code)
    .filter(({ line }) => !usedJournalLineIds.has(line.id))
    .filter(({ line }) => amountForJournalLine(line)[targetSide] === amount)
    .slice(0, 20)
    .map(({ journal, line }) => ({
      id: line.id,
      description: line.description ?? journal.memo ?? journal.reference,
      debit: numericValue(line.debit),
      credit: numericValue(line.credit),
      journalEntryNumber: journal.entry_number,
      journalEntryDate: journal.entry_date,
      journalEntryDescription: journal.memo,
    }));
}

export async function matchPreviewStatementLine(accountId: number, statementLineId: number, journalLineId: number) {
  const store = await readPreviewReconciliationStore();
  const statementLines = store.statementLines.map((line) => {
    if (line.id !== statementLineId || line.bank_account_id !== accountId) {
      return line;
    }

    return {
      ...line,
      matched_journal_line_id: journalLineId,
      status: "matched" as const,
    };
  });

  await writePreviewReconciliationStore({ statementLines });
  return statementLines.find((line) => line.id === statementLineId) ?? null;
}

export async function reconcilePreviewStatementLines(accountId: number, statementLineIds: number[]) {
  const store = await readPreviewReconciliationStore();
  let reconciledCount = 0;
  const statementLines = store.statementLines.map((line) => {
    if (line.bank_account_id !== accountId || !statementLineIds.includes(line.id) || line.status !== "matched") {
      return line;
    }

    reconciledCount += 1;
    return {
      ...line,
      status: "reconciled" as const,
      reconciled_at: todayIsoDate(),
    };
  });

  await writePreviewReconciliationStore({ statementLines });
  return { reconciled_count: reconciledCount };
}
