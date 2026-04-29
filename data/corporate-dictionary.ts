export type DictionaryConfidence = "High" | "Medium";

export type CorporateDictionaryEntry = {
  domain: string;
  contextKey: string;
  english: string;
  arabic: string;
  confidence: DictionaryConfidence;
  notes?: string;
};

type TerminologyRouteRequirement = {
  contextKey: string;
  requiredText: string;
};

type DiscouragedTerminology = {
  phrase: string;
  preferredContextKey: string;
  note: string;
};

export type TerminologyRouteProfile = {
  route: string;
  label: string;
  requirements: TerminologyRouteRequirement[];
  discouraged: DiscouragedTerminology[];
};

export const corporateDictionary: CorporateDictionaryEntry[] = [
  { domain: "Accounting", contextKey: "accounting.ledger", english: "General Ledger", arabic: "دفتر الأستاذ العام", confidence: "High" },
  { domain: "Accounting", contextKey: "accounting.trial_balance", english: "Trial Balance", arabic: "ميزان المراجعة", confidence: "High" },
  { domain: "Accounting", contextKey: "accounting.profit_and_loss", english: "Profit and Loss", arabic: "قائمة الأرباح والخسائر", confidence: "High" },
  { domain: "Sales & Documents", contextKey: "documents.quote", english: "Quotation", arabic: "عرض سعر", confidence: "High" },
  { domain: "Sales & Documents", contextKey: "documents.tax_invoice", english: "Tax Invoice", arabic: "فاتورة ضريبية", confidence: "High" },
  { domain: "Sales & Documents", contextKey: "documents.credit_note", english: "Credit Note", arabic: "إشعار دائن", confidence: "High" },
  { domain: "Sales & Documents", contextKey: "documents.debit_note", english: "Debit Note", arabic: "إشعار مدين", confidence: "High" },
  { domain: "Sales & Documents", contextKey: "documents.purchase_order", english: "Purchase Order", arabic: "أمر شراء", confidence: "High" },
  { domain: "Sales & Documents", contextKey: "documents.vendor_bill", english: "Vendor Bill", arabic: "فاتورة مورد", confidence: "High" },
  { domain: "Sales & Documents", contextKey: "documents.bill", english: "Bill", arabic: "فاتورة", confidence: "Medium", notes: "In AP context can be 'فاتورة مورد'." },
  { domain: "Sales & Documents", contextKey: "documents.purchase_invoice", english: "Purchase Invoice", arabic: "فاتورة شراء", confidence: "High" },
  { domain: "VAT & ZATCA", contextKey: "vat.vat", english: "Value Added Tax (VAT)", arabic: "ضريبة القيمة المضافة", confidence: "High" },
  { domain: "VAT & ZATCA", contextKey: "vat.output_tax", english: "Output Tax", arabic: "ضريبة المخرجات", confidence: "High" },
  { domain: "VAT & ZATCA", contextKey: "vat.input_tax", english: "Input Tax", arabic: "ضريبة المدخلات", confidence: "High" },
  { domain: "VAT & ZATCA", contextKey: "vat.tax_summary", english: "Tax Summary", arabic: "ملخص الضريبة", confidence: "High" },
  { domain: "Contacts & Master Data", contextKey: "party.customer", english: "Customer", arabic: "عميل", confidence: "High" },
  { domain: "Contacts & Master Data", contextKey: "party.supplier", english: "Supplier", arabic: "مورد", confidence: "High" },
  { domain: "Payments & Banking", contextKey: "payment.payment", english: "Payment", arabic: "دفعة", confidence: "High" },
  { domain: "Reports & Analysis", contextKey: "report.report", english: "Report", arabic: "تقرير", confidence: "High" },
  { domain: "Reports & Analysis", contextKey: "report.dashboard", english: "Dashboard", arabic: "لوحة المعلومات", confidence: "High" },
  { domain: "Reports & Analysis", contextKey: "report.invoice_register", english: "Invoice Register", arabic: "سجل الفواتير", confidence: "High" },
  { domain: "Reports & Analysis", contextKey: "report.receivables_aging", english: "Receivables Aging", arabic: "أعمار الذمم المدينة", confidence: "High" },
  { domain: "Reports & Analysis", contextKey: "report.payables_aging", english: "Payables Aging", arabic: "أعمار الذمم الدائنة", confidence: "High" },
  { domain: "Reports & Analysis", contextKey: "report.general_ledger", english: "General Ledger Report", arabic: "تقرير دفتر الأستاذ العام", confidence: "High" },
  { domain: "Reports & Analysis", contextKey: "report.vat_report", english: "VAT Report", arabic: "تقرير ضريبة القيمة المضافة", confidence: "High" },
];

export const terminologyRouteProfiles: TerminologyRouteProfile[] = [
  {
    route: "/workspace/dashboard",
    label: "Dashboard",
    requirements: [
      { contextKey: "report.dashboard", requiredText: "Dashboard" },
      { contextKey: "party.customer", requiredText: "Top customers" },
    ],
    discouraged: [],
  },
  {
    route: "/workspace/purchases",
    label: "Purchases",
    requirements: [
      { contextKey: "documents.vendor_bill", requiredText: "Vendor bills" },
      { contextKey: "documents.purchase_order", requiredText: "purchase orders" },
      { contextKey: "documents.debit_note", requiredText: "debit notes" },
    ],
    discouraged: [
      {
        phrase: "supplier bill",
        preferredContextKey: "documents.vendor_bill",
        note: "The workbook marks generic 'Bill' as medium confidence in AP context; prefer 'Vendor Bill' on purchase surfaces.",
      },
      {
        phrase: "create bill",
        preferredContextKey: "documents.vendor_bill",
        note: "Primary purchase actions should use the canonical AP term from the dictionary.",
      },
    ],
  },
  {
    route: "/workspace/vat",
    label: "VAT",
    requirements: [
      { contextKey: "vat.vat", requiredText: "VAT" },
      { contextKey: "vat.output_tax", requiredText: "Output tax" },
      { contextKey: "vat.input_tax", requiredText: "Input tax" },
      { contextKey: "vat.tax_summary", requiredText: "VAT summary" },
    ],
    discouraged: [],
  },
  {
    route: "/workspace/reports",
    label: "Reports",
    requirements: [
      { contextKey: "report.report", requiredText: "Reports" },
      { contextKey: "accounting.profit_and_loss", requiredText: "Profit and loss" },
      { contextKey: "accounting.trial_balance", requiredText: "Trial balance" },
      { contextKey: "report.receivables_aging", requiredText: "Receivables aging" },
      { contextKey: "report.payables_aging", requiredText: "Payables aging" },
    ],
    discouraged: [],
  },
  {
    route: "/workspace/reports/registers",
    label: "Registers",
    requirements: [
      { contextKey: "report.invoice_register", requiredText: "Invoice register" },
      { contextKey: "documents.vendor_bill", requiredText: "Vendor bills register" },
      { contextKey: "payment.payment", requiredText: "Payments register" },
    ],
    discouraged: [
      {
        phrase: "bills register",
        preferredContextKey: "documents.vendor_bill",
        note: "The purchase register should carry the canonical AP label backed by the workbook.",
      },
    ],
  },
  {
    route: "/workspace/user/ledger",
    label: "Books",
    requirements: [
      { contextKey: "report.general_ledger", requiredText: "General ledger" },
      { contextKey: "accounting.trial_balance", requiredText: "Trial balance" },
    ],
    discouraged: [],
  },
];

export function getDictionaryEntry(contextKey: string) {
  return corporateDictionary.find((entry) => entry.contextKey === contextKey) ?? null;
}