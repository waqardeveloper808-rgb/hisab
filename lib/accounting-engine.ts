/**
 * Gulf Hisab — Accounting Engine Core
 *
 * Real double-entry accounting engine. Types, chart of accounts,
 * journal model, posting rules, balance computation, and reporting.
 *
 * Pure TypeScript — zero runtime dependencies.
 * Consumed by server (API routes, preview layer) and client (registers, forms).
 */

/* ================================================================
   LAYER A — CHART OF ACCOUNTS TYPES
   ================================================================ */

export type AccountClass = "asset" | "liability" | "equity" | "income" | "expense" | "cost_of_sales" | "contra";

export type AccountGroup =
  | "current_asset" | "non_current_asset" | "current_liability" | "non_current_liability"
  | "equity" | "operating_revenue" | "other_revenue" | "cost_of_goods_sold"
  | "operating_expense" | "payroll" | "financial" | "contra_asset" | "contra_revenue";

export type NormalBalance = "debit" | "credit";

/** Cash flow statement classification (Wafeq-style). */
export type CashFlowType = "operating" | "investing" | "financing" | "cash" | "non_cash";

export interface Account {
  id: number;
  code: string;
  /** Pre–3-digit migration code, preserved for audit. */
  legacyCode?: string | null;
  name: string;
  nameAr?: string | null;
  accountClass: AccountClass;
  group: AccountGroup;
  subtype: string;
  normalBalance: NormalBalance;
  parentCode?: string | null;
  isActive: boolean;
  isPostingAllowed: boolean;
  isSystem: boolean;
  description?: string | null;
  cashFlowType: CashFlowType;
  /** Enable in payment/bank pay-from selectors. */
  enablePayments: boolean;
  showInExpenseClaims: boolean;
  /** Summary folder row (Wafeq group) — not postable. */
  isFolder: boolean;
  reportMapping: string;
  taxRelevant: boolean;
}

export function normalBalanceForClass(cls: AccountClass): NormalBalance {
  switch (cls) {
    case "asset": case "expense": case "cost_of_sales": return "debit";
    case "liability": case "equity": case "income": return "credit";
    case "contra": return "credit";
  }
}

/* ================================================================
   LAYER A.1 — COMPREHENSIVE CHART OF ACCOUNTS
   Matches backend ComprehensiveChartOfAccountsSeeder exactly.
   ================================================================ */

/** Optional workspace session override; when null, `defaultChartOfAccounts` is authoritative. */
let workspaceChartOfAccountsSnapshot: Account[] | null = null;

export function getActiveChartOfAccounts(): Account[] {
  return workspaceChartOfAccountsSnapshot ?? defaultChartOfAccounts;
}

/** Replace the in-memory chart (preview / client session). Pass null to clear override. */
export function setWorkspaceChartOfAccountsSnapshot(next: Account[] | null): void {
  workspaceChartOfAccountsSnapshot = next;
}

export const defaultChartOfAccounts: Account[] = [
  // ═══ ASSETS — Current (1000 series) ═══════════════════════
  {
    id: 75,
    code: "100",
    legacyCode: null,
    name: "Cash and Cash Equivalents",
    nameAr: "النقد وما في حكمه",
    accountClass: "asset",
    group: "current_asset",
    subtype: "cash",
    normalBalance: "debit",
    isActive: true,
    isPostingAllowed: false,
    isSystem: true,
    cashFlowType: "cash",
    enablePayments: false,
    showInExpenseClaims: false,
    isFolder: true,
    reportMapping: "gl",
    taxRelevant: false,
    parentCode: null,
  },
  { id: 1, code: "101", legacyCode: "1010", name: "Cash in Hand", nameAr: "النقد في الصندوق", accountClass: "asset", group: "current_asset", subtype: "cash", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "cash", enablePayments: true, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false, parentCode: "100" },
  {
    id: 2,
    code: "102",
    legacyCode: "1020",
    name: "Petty Cash",
    nameAr: "صندوق المصروفات النثرية / المصروفات النقدية الصغيرة",
    accountClass: "asset",
    group: "current_asset",
    subtype: "cash",
    normalBalance: "debit",
    isActive: true,
    isPostingAllowed: true,
    isSystem: true,
    cashFlowType: "cash",
    enablePayments: true,
    showInExpenseClaims: false,
    isFolder: false,
    reportMapping: "gl",
    taxRelevant: false,
    parentCode: "100",
  },
  { id: 3, code: "103", legacyCode: "1050", name: "Undeposited Funds", nameAr: "أموال غير مودعة", accountClass: "asset", group: "current_asset", subtype: "cash", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "cash", enablePayments: true, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false, parentCode: "100" },
  { id: 4, code: "110", legacyCode: "1100", name: "Accounts Receivable", nameAr: "ذمم مدينة", accountClass: "asset", group: "current_asset", subtype: "receivable", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: true, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 5, code: "111", legacyCode: "1110", name: "Allowance for Doubtful Debts", nameAr: "مخصص ديون مشكوك فيها", accountClass: "contra", group: "contra_asset", subtype: "contra_asset", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "investing", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 6, code: "113", legacyCode: "1150", name: "Inventory — Trading", nameAr: "مخزون تجاري", accountClass: "asset", group: "current_asset", subtype: "inventory", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 7, code: "115", legacyCode: "1151", name: "Inventory — Raw Materials", nameAr: "مخزون مواد خام", accountClass: "asset", group: "current_asset", subtype: "inventory", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 8, code: "116", legacyCode: "1152", name: "Inventory — Finished Goods", nameAr: "مخزون بضاعة تامة", accountClass: "asset", group: "current_asset", subtype: "inventory", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 9, code: "117", legacyCode: "1153", name: "Work in Progress", nameAr: "إنتاج تحت التشغيل", accountClass: "asset", group: "current_asset", subtype: "inventory", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 10, code: "120", legacyCode: "1200", name: "Main Bank Account", nameAr: "الحساب البنكي الرئيسي", accountClass: "asset", group: "current_asset", subtype: "bank", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "cash", enablePayments: true, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 11, code: "121", legacyCode: "1210", name: "Secondary Bank Account", nameAr: "الحساب البنكي الثانوي", accountClass: "asset", group: "current_asset", subtype: "bank", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "cash", enablePayments: true, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 12, code: "122", legacyCode: "1220", name: "Bank Clearing Account", nameAr: "حساب مقاصة بنكي", accountClass: "asset", group: "current_asset", subtype: "bank", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "cash", enablePayments: true, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 13, code: "130", legacyCode: "1300", name: "VAT Receivable (Input VAT)", nameAr: "ضريبة المدخلات", accountClass: "asset", group: "current_asset", subtype: "tax", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: true, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: true },
  { id: 14, code: "124", legacyCode: "1400", name: "Prepaid Expenses", nameAr: "مصروفات مدفوعة مقدماً", accountClass: "asset", group: "current_asset", subtype: "prepaid", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 15, code: "125", legacyCode: "1410", name: "Supplier Advances", nameAr: "سلف الموردين", accountClass: "asset", group: "current_asset", subtype: "advance", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: true, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 16, code: "126", legacyCode: "1420", name: "Employee Advances", nameAr: "سلف الموظفين", accountClass: "asset", group: "current_asset", subtype: "advance", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 17, code: "127", legacyCode: "1430", name: "Other Receivables", nameAr: "ذمم مدينة أخرى", accountClass: "asset", group: "current_asset", subtype: "receivable", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  // ═══ ASSETS — Non-Current (1500 series) ═══════════════════
  { id: 18, code: "131", legacyCode: "1500", name: "Property / Building", nameAr: "عقارات / مباني", accountClass: "asset", group: "non_current_asset", subtype: "fixed_asset", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "investing", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 19, code: "132", legacyCode: "1510", name: "Machinery / Equipment", nameAr: "آلات / معدات", accountClass: "asset", group: "non_current_asset", subtype: "fixed_asset", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "investing", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 20, code: "133", legacyCode: "1520", name: "Vehicles", nameAr: "مركبات", accountClass: "asset", group: "non_current_asset", subtype: "fixed_asset", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "investing", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 21, code: "134", legacyCode: "1530", name: "Furniture / Fixtures", nameAr: "أثاث / تجهيزات", accountClass: "asset", group: "non_current_asset", subtype: "fixed_asset", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "investing", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 22, code: "135", legacyCode: "1540", name: "Computers / IT Equipment", nameAr: "حواسيب / معدات تقنية", accountClass: "asset", group: "non_current_asset", subtype: "fixed_asset", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "investing", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 23, code: "139", legacyCode: "1590", name: "Accumulated Depreciation", nameAr: "إهلاك متراكم", accountClass: "contra", group: "contra_asset", subtype: "contra_asset", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "investing", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 24, code: "138", legacyCode: "1600", name: "Long-term Deposits", nameAr: "ودائع طويلة الأجل", accountClass: "asset", group: "non_current_asset", subtype: "other", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  // ═══ LIABILITIES — Current (2000 series) ══════════════════
  { id: 25, code: "200", legacyCode: "2000", name: "Accounts Payable", nameAr: "ذمم دائنة", accountClass: "liability", group: "current_liability", subtype: "payable", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: true, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 26, code: "201", legacyCode: "2100", name: "Accrued Expenses", nameAr: "مصروفات مستحقة", accountClass: "liability", group: "current_liability", subtype: "accrual", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 27, code: "202", legacyCode: "2110", name: "Salaries Payable", nameAr: "رواتب مستحقة", accountClass: "liability", group: "current_liability", subtype: "accrual", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 28, code: "203", legacyCode: "2120", name: "Bonus Payable", nameAr: "مكافآت مستحقة", accountClass: "liability", group: "current_liability", subtype: "accrual", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 29, code: "220", legacyCode: "2200", name: "VAT Payable (Output VAT)", nameAr: "ضريبة المخرجات", accountClass: "liability", group: "current_liability", subtype: "tax", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: true, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: true },
  { id: 30, code: "221", legacyCode: "2210", name: "Tax Payable", nameAr: "ضريبة مستحقة الدفع", accountClass: "liability", group: "current_liability", subtype: "tax", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: true },
  { id: 31, code: "230", legacyCode: "2300", name: "Customer Advances", nameAr: "سلف العملاء", accountClass: "liability", group: "current_liability", subtype: "advance", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: true, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 32, code: "231", legacyCode: "2310", name: "Deferred Revenue (Short-term)", nameAr: "إيرادات مؤجلة", accountClass: "liability", group: "current_liability", subtype: "deferred", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 33, code: "240", legacyCode: "2400", name: "Short-term Loans", nameAr: "قروض قصيرة الأجل", accountClass: "liability", group: "current_liability", subtype: "loan", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "financing", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 34, code: "241", legacyCode: "2410", name: "Bank Overdraft", nameAr: "تسهيلات بنكية", accountClass: "liability", group: "current_liability", subtype: "loan", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "financing", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 35, code: "250", legacyCode: "2500", name: "Other Payables", nameAr: "ذمم دائنة أخرى", accountClass: "liability", group: "current_liability", subtype: "other", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  // ═══ LIABILITIES — Non-Current (2600 series) ══════════════
  { id: 36, code: "260", legacyCode: "2600", name: "Long-term Loans", nameAr: "قروض طويلة الأجل", accountClass: "liability", group: "non_current_liability", subtype: "loan", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "financing", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 37, code: "261", legacyCode: "2610", name: "Lease Liabilities", nameAr: "التزامات الإيجار", accountClass: "liability", group: "non_current_liability", subtype: "lease", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "financing", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 38, code: "262", legacyCode: "2620", name: "End-of-Service Benefit", nameAr: "مكافأة نهاية الخدمة", accountClass: "liability", group: "non_current_liability", subtype: "provision", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 39, code: "263", legacyCode: "2630", name: "Deferred Revenue (Long-term)", nameAr: "إيرادات مؤجلة طويلة", accountClass: "liability", group: "non_current_liability", subtype: "deferred", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  // ═══ EQUITY (3000 series) ═════════════════════════════════
  { id: 40, code: "300", legacyCode: "3000", name: "Owner Capital / Share Capital", nameAr: "رأس المال", accountClass: "equity", group: "equity", subtype: "capital", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: true, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 41, code: "310", legacyCode: "3100", name: "Drawings / Owner Withdrawals", nameAr: "مسحوبات شخصية", accountClass: "equity", group: "equity", subtype: "drawing", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 42, code: "320", legacyCode: "3200", name: "Retained Earnings", nameAr: "أرباح محتجزة", accountClass: "equity", group: "equity", subtype: "retained", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: true, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 43, code: "330", legacyCode: "3300", name: "Current Year Earnings", nameAr: "أرباح السنة الحالية", accountClass: "equity", group: "equity", subtype: "current_year", normalBalance: "credit", isActive: false, isPostingAllowed: false, isSystem: true, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 44, code: "340", legacyCode: "3400", name: "Reserves", nameAr: "احتياطيات", accountClass: "equity", group: "equity", subtype: "reserve", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 45, code: "390", legacyCode: "3900", name: "Opening Balance Equity", nameAr: "حقوق ملكية افتتاحية", accountClass: "equity", group: "equity", subtype: "opening", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: true, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  // ═══ INCOME / REVENUE (4000 series) ═══════════════════════
  { id: 46, code: "400", legacyCode: "4000", name: "Sales Revenue", nameAr: "إيرادات المبيعات", accountClass: "income", group: "operating_revenue", subtype: "operating", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: true, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 47, code: "401", legacyCode: "4010", name: "Service Revenue", nameAr: "إيرادات الخدمات", accountClass: "income", group: "operating_revenue", subtype: "operating", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 48, code: "402", legacyCode: "4020", name: "Other Operating Revenue", nameAr: "إيرادات تشغيلية أخرى", accountClass: "income", group: "operating_revenue", subtype: "operating", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 49, code: "410", legacyCode: "4100", name: "Discount Received", nameAr: "خصم مكتسب", accountClass: "income", group: "other_revenue", subtype: "other", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 50, code: "420", legacyCode: "4200", name: "Gain on Disposal", nameAr: "أرباح بيع أصول", accountClass: "income", group: "other_revenue", subtype: "other", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 51, code: "430", legacyCode: "4300", name: "Finance Income", nameAr: "إيرادات مالية", accountClass: "income", group: "other_revenue", subtype: "financial", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 52, code: "450", legacyCode: "4500", name: "Sales Discount", nameAr: "خصم مبيعات", accountClass: "contra", group: "contra_revenue", subtype: "contra_revenue", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 53, code: "490", legacyCode: "4900", name: "Miscellaneous Income", nameAr: "إيرادات متنوعة", accountClass: "income", group: "other_revenue", subtype: "other", normalBalance: "credit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  // ═══ COST OF SALES / DIRECT (5000 series) ═════════════════
  { id: 54, code: "500", legacyCode: "5000", name: "Cost of Goods Sold", nameAr: "تكلفة البضاعة المباعة", accountClass: "cost_of_sales", group: "cost_of_goods_sold", subtype: "cogs", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: true, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 55, code: "501", legacyCode: "5010", name: "Direct Materials Consumed", nameAr: "مواد مباشرة مستهلكة", accountClass: "cost_of_sales", group: "cost_of_goods_sold", subtype: "direct", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 56, code: "502", legacyCode: "5020", name: "Direct Labor", nameAr: "عمالة مباشرة", accountClass: "cost_of_sales", group: "cost_of_goods_sold", subtype: "direct", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 57, code: "503", legacyCode: "5030", name: "Production Overhead Absorbed", nameAr: "أعباء إنتاج ممتصة", accountClass: "cost_of_sales", group: "cost_of_goods_sold", subtype: "overhead", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 58, code: "504", legacyCode: "5040", name: "Purchase Variance", nameAr: "فروقات الشراء", accountClass: "cost_of_sales", group: "cost_of_goods_sold", subtype: "variance", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 59, code: "505", legacyCode: "5050", name: "Inventory Adjustment", nameAr: "تسوية مخزون", accountClass: "cost_of_sales", group: "cost_of_goods_sold", subtype: "adjustment", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  // ═══ OPERATING EXPENSES (6000 series) ═════════════════════
  { id: 60, code: "600", legacyCode: "6000", name: "Rent Expense", nameAr: "مصروف الإيجار", accountClass: "expense", group: "operating_expense", subtype: "operating", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 61, code: "601", legacyCode: "6010", name: "Utilities Expense", nameAr: "مصروف المرافق", accountClass: "expense", group: "operating_expense", subtype: "operating", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: true, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 62, code: "602", legacyCode: "6020", name: "Office Supplies", nameAr: "مستلزمات مكتبية", accountClass: "expense", group: "operating_expense", subtype: "operating", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: true, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 63, code: "603", legacyCode: "6030", name: "Internet / Communication", nameAr: "إنترنت / اتصالات", accountClass: "expense", group: "operating_expense", subtype: "operating", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: true, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 64, code: "604", legacyCode: "6040", name: "Fuel / Travel", nameAr: "وقود / سفر", accountClass: "expense", group: "operating_expense", subtype: "operating", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: true, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 65, code: "605", legacyCode: "6050", name: "Maintenance Expense", nameAr: "مصروف صيانة", accountClass: "expense", group: "operating_expense", subtype: "operating", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: true, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 66, code: "606", legacyCode: "6060", name: "Insurance Expense", nameAr: "مصروف تأمين", accountClass: "expense", group: "operating_expense", subtype: "operating", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: true, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 67, code: "607", legacyCode: "6070", name: "Marketing Expense", nameAr: "مصروف تسويق", accountClass: "expense", group: "operating_expense", subtype: "operating", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: true, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 68, code: "608", legacyCode: "6080", name: "Professional Fees", nameAr: "أتعاب مهنية", accountClass: "expense", group: "operating_expense", subtype: "operating", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: true, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 69, code: "610", legacyCode: "6100", name: "Salaries Expense", nameAr: "مصروف الرواتب", accountClass: "expense", group: "payroll", subtype: "payroll", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 70, code: "611", legacyCode: "6110", name: "Bonus Expense", nameAr: "مصروف مكافآت", accountClass: "expense", group: "payroll", subtype: "payroll", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 71, code: "612", legacyCode: "6120", name: "Overtime Expense", nameAr: "مصروف عمل إضافي", accountClass: "expense", group: "payroll", subtype: "payroll", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 72, code: "620", legacyCode: "6200", name: "Bank Charges", nameAr: "عمولات بنكية", accountClass: "expense", group: "financial", subtype: "financial", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 73, code: "630", legacyCode: "6300", name: "Depreciation Expense", nameAr: "مصروف إهلاك", accountClass: "expense", group: "operating_expense", subtype: "non_cash", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "non_cash", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
  { id: 74, code: "690", legacyCode: "6900", name: "Miscellaneous Expense", nameAr: "مصروفات متنوعة", accountClass: "expense", group: "operating_expense", subtype: "other", normalBalance: "debit", isActive: true, isPostingAllowed: true, isSystem: false, cashFlowType: "operating", enablePayments: false, showInExpenseClaims: false, isFolder: false, reportMapping: "gl", taxRelevant: false },
];

/** Snapshot clone for session reset — no shared object references with defaults. */
export function cloneDefaultChartOfAccounts(): Account[] {
  return defaultChartOfAccounts.map((a) => ({ ...a }));
}

/** Numeric band for new posting accounts (3-digit COA conventions). */
export function accountCodeBand(account: Pick<Account, "accountClass" | "group">): [number, number] {
  const cls = account.accountClass;
  const group = account.group;
  if (cls === "contra") {
    return group === "contra_revenue" ? [400, 499] : [100, 199];
  }
  switch (cls) {
    case "asset":
      return [100, 199];
    case "liability":
      return [200, 299];
    case "equity":
      return [300, 399];
    case "income":
      return [400, 499];
    case "cost_of_sales":
      return [500, 599];
    case "expense":
      return [600, 699];
    default:
      return [100, 199];
  }
}

function defaultGroupForNewAccount(cls: AccountClass): AccountGroup {
  switch (cls) {
    case "asset":
      return "current_asset";
    case "liability":
      return "current_liability";
    case "equity":
      return "equity";
    case "income":
      return "operating_revenue";
    case "expense":
      return "operating_expense";
    case "cost_of_sales":
      return "cost_of_goods_sold";
    case "contra":
      return "contra_asset";
    default:
      return "current_asset";
  }
}

/** Next free code in the class band for a new root-level account. */
export function suggestNextRootCode(accounts: Account[], cls: AccountClass): string {
  const [lo, hi] = accountCodeBand({ accountClass: cls, group: defaultGroupForNewAccount(cls) });
  const used = new Set(accounts.map((a) => a.code));
  for (let n = lo; n <= hi; n++) {
    const c = String(n);
    if (!used.has(c)) return c;
  }
  return "";
}

/** Next free child code under `parent` (same class / band). */
export function suggestNextChildCode(parent: Account, accounts: Account[]): string {
  const [lo, hi] = accountCodeBand(parent);
  const used = new Set(accounts.map((a) => a.code));
  const siblings = accounts.filter((a) => a.parentCode === parent.code);
  const parentNum = parseInt(parent.code, 10);
  let start: number;
  if (siblings.length === 0) {
    start = Number.isNaN(parentNum) ? lo : parentNum + 1;
  } else {
    const nums = siblings.map((s) => parseInt(s.code, 10)).filter((n) => !Number.isNaN(n));
    start = Math.max(...nums, Number.isNaN(parentNum) ? lo : parentNum) + 1;
  }
  for (let n = Math.max(start, lo); n <= hi; n++) {
    const c = String(n);
    if (!used.has(c)) return c;
  }
  return "";
}

/* ================================================================
   HELPERS
   ================================================================ */

export function findAccountByCode(code: string): Account | undefined {
  return getActiveChartOfAccounts().find((a) => a.code === code || a.legacyCode === code);
}

export function findAccountById(id: number): Account | undefined {
  return getActiveChartOfAccounts().find((a) => a.id === id);
}

export function findAccountsByClass(cls: AccountClass): Account[] {
  return getActiveChartOfAccounts().filter((a) => a.accountClass === cls);
}

export function searchAccounts(query: string): Account[] {
  const pool = getActiveChartOfAccounts();
  const q = query.toLowerCase().trim();
  if (!q) return pool.filter((a) => a.isActive);
  return pool.filter(
    (a) =>
      a.isActive &&
      (a.code.includes(q) ||
        (a.legacyCode && a.legacyCode.includes(q)) ||
        a.name.toLowerCase().includes(q) ||
        (a.nameAr && a.nameAr.includes(q)) ||
        a.subtype.includes(q) ||
        a.accountClass.includes(q) ||
        a.group.includes(q)),
  );
}

/* ================================================================
   LAYER B — JOURNAL MODEL
   ================================================================ */

export type JournalStatus = "draft" | "posted" | "reversed" | "locked";

export interface JournalEntry {
  id: number;
  entryNumber: string;
  entryDate: string;
  postingDate: string;
  reference: string;
  memo: string;
  sourceDocumentType?: string | null;
  sourceDocumentId?: number | null;
  status: JournalStatus;
  createdBy: string;
  approvedBy?: string | null;
  reversedFromId?: number | null;
  createdAt: string;
  updatedAt: string;
  lines: JournalLine[];
  attachments?: Attachment[];
}

export interface JournalLine {
  lineNumber: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  taxCode?: string | null;
  contactId?: number | null;
  costCenterId?: number | null;
  costCenterCode?: string | null;
  projectId?: number | null;
  inventoryItemId?: number | null;
  documentReference?: string | null;
  memo?: string | null;
}

/* ================================================================
   LAYER B.1 — JOURNAL VALIDATION
   ================================================================ */

export interface JournalValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateJournalEntry(entry: JournalEntry): JournalValidationResult {
  const errors: string[] = [];

  if (!entry.entryDate) errors.push("Entry date is required.");
  if (!entry.lines.length) errors.push("At least one journal line is required.");

  const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.005) {
    errors.push("Journal is unbalanced: debits " + totalDebit.toFixed(2) + " != credits " + totalCredit.toFixed(2) + ".");
  }

  for (const line of entry.lines) {
    if (!line.accountCode) {
      errors.push("Line " + line.lineNumber + ": account is required.");
      continue;
    }
    const account = findAccountByCode(line.accountCode);
    if (!account) {
      errors.push("Line " + line.lineNumber + ": account " + line.accountCode + " not found.");
      continue;
    }
    if (!account.isActive) errors.push("Line " + line.lineNumber + ": account " + line.accountCode + " is inactive.");
    if (account.isFolder) errors.push("Line " + line.lineNumber + ": account " + line.accountCode + " is a header — post to a leaf account.");
    if (!account.isPostingAllowed) errors.push("Line " + line.lineNumber + ": account " + line.accountCode + " does not allow posting.");
    if (line.debit < 0 || line.credit < 0) errors.push("Line " + line.lineNumber + ": negative amounts not allowed.");
    if (line.debit > 0 && line.credit > 0) errors.push("Line " + line.lineNumber + ": cannot have both debit and credit.");
    if (line.debit === 0 && line.credit === 0) errors.push("Line " + line.lineNumber + ": debit or credit must be non-zero.");
  }

  return { valid: errors.length === 0, errors };
}

/* ================================================================
   LAYER C — POSTING ENGINE / POSTING RULES
   ================================================================ */

export type PostingRuleSource =
  | "sales_invoice" | "customer_payment" | "credit_note" | "debit_note"
  | "purchase_bill" | "supplier_payment" | "cash_expense"
  | "customer_advance" | "advance_applied"
  | "supplier_advance" | "supplier_advance_applied"
  | "inventory_purchase" | "inventory_adjustment" | "inventory_consumption"
  | "manual_journal" | "opening_balance";

export interface PostingContext {
  source: PostingRuleSource;
  date: string;
  reference: string;
  contactName?: string;
  documentNumber?: string;
  taxableAmount: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount?: number;
  bankAccountCode?: string;
  expenseAccountCode?: string;
  revenueAccountCode?: string;
  inventoryAccountCode?: string;
  costCenterCode?: string;
  memo?: string;
}

function round(n: number): number { return Math.round(n * 100) / 100; }

export function generatePostingLines(ctx: PostingContext): JournalLine[] {
  const lines: JournalLine[] = [];
  let lineNum = 0;

  function add(code: string, name: string, debit: number, credit: number, memo?: string): void {
    lines.push({
      lineNumber: ++lineNum,
      accountId: 0,
      accountCode: code,
      accountName: name,
      debit: round(debit),
      credit: round(credit),
      costCenterCode: ctx.costCenterCode ?? null,
      memo: memo ?? ctx.memo ?? null,
    });
  }

  const bank = ctx.bankAccountCode ?? "120";
  const revenue = ctx.revenueAccountCode ?? "400";
  const expense = ctx.expenseAccountCode ?? "600";

  switch (ctx.source) {
    case "sales_invoice":
      add("110", "Accounts Receivable", ctx.grandTotal, 0, "Invoice receivable");
      add(revenue, "Revenue", 0, ctx.taxableAmount, "Sales revenue");
      if (ctx.taxAmount > 0) add("220", "VAT Payable (Output VAT)", 0, ctx.taxAmount, "Output VAT");
      break;
    case "customer_payment":
      add(bank, "Bank/Cash", ctx.paidAmount ?? ctx.grandTotal, 0, "Payment received");
      add("110", "Accounts Receivable", 0, ctx.paidAmount ?? ctx.grandTotal, "Receivable settled");
      break;
    case "credit_note":
      add(revenue, "Revenue", ctx.taxableAmount, 0, "Credit note reversal");
      if (ctx.taxAmount > 0) add("220", "VAT Payable (Output VAT)", ctx.taxAmount, 0, "Output VAT reversal");
      add("110", "Accounts Receivable", 0, ctx.grandTotal, "Receivable reduced");
      break;
    case "debit_note":
      add("110", "Accounts Receivable", ctx.grandTotal, 0, "Debit note receivable");
      add(revenue, "Revenue", 0, ctx.taxableAmount, "Additional revenue");
      if (ctx.taxAmount > 0) add("220", "VAT Payable (Output VAT)", 0, ctx.taxAmount, "Additional VAT");
      break;
    case "customer_advance":
      add(bank, "Bank/Cash", ctx.grandTotal, 0, "Advance received");
      add("230", "Customer Advances", 0, ctx.grandTotal, "Customer advance liability");
      break;
    case "advance_applied":
      add("230", "Customer Advances", ctx.grandTotal, 0, "Advance applied");
      add("110", "Accounts Receivable", 0, ctx.grandTotal, "Receivable cleared");
      break;
    case "purchase_bill":
      add(expense, "Expense", ctx.taxableAmount, 0, "Purchase expense");
      if (ctx.taxAmount > 0) add("130", "VAT Receivable (Input VAT)", ctx.taxAmount, 0, "Input VAT");
      add("200", "Accounts Payable", 0, ctx.grandTotal, "Vendor payable");
      break;
    case "cash_expense":
      add(expense, "Expense", ctx.taxableAmount, 0, "Cash expense");
      if (ctx.taxAmount > 0) add("130", "VAT Receivable (Input VAT)", ctx.taxAmount, 0, "Input VAT");
      add(bank, "Bank/Cash", 0, ctx.grandTotal, "Cash paid out");
      break;
    case "supplier_payment":
      add("200", "Accounts Payable", ctx.paidAmount ?? ctx.grandTotal, 0, "Payable settled");
      add(bank, "Bank/Cash", 0, ctx.paidAmount ?? ctx.grandTotal, "Cash paid out");
      break;
    case "supplier_advance":
      add("125", "Supplier Advances", ctx.grandTotal, 0, "Advance to supplier");
      add(bank, "Bank/Cash", 0, ctx.grandTotal, "Cash paid out");
      break;
    case "supplier_advance_applied":
      add("200", "Accounts Payable", ctx.grandTotal, 0, "Payable cleared");
      add("125", "Supplier Advances", 0, ctx.grandTotal, "Advance applied");
      break;
    case "inventory_purchase":
      add(ctx.inventoryAccountCode ?? "113", "Inventory", ctx.taxableAmount, 0, "Inventory in");
      if (ctx.taxAmount > 0) add("130", "VAT Receivable (Input VAT)", ctx.taxAmount, 0, "Input VAT");
      add("200", "Accounts Payable", 0, ctx.grandTotal, "Vendor payable");
      break;
    case "inventory_adjustment":
      add("505", "Inventory Adjustment", Math.abs(ctx.grandTotal), 0, "Adjustment out");
      add(ctx.inventoryAccountCode ?? "113", "Inventory", 0, Math.abs(ctx.grandTotal), "Inventory decreased");
      break;
    case "inventory_consumption":
      add("500", "Cost of Goods Sold", ctx.grandTotal, 0, "COGS recognized");
      add(ctx.inventoryAccountCode ?? "113", "Inventory", 0, ctx.grandTotal, "Inventory consumed");
      break;
    case "manual_journal":
      break; // Lines supplied directly
    case "opening_balance":
      add("390", "Opening Balance Equity", 0, ctx.grandTotal, "Opening balance");
      break;
  }

  return lines;
}

/* ================================================================
   LAYER D — BALANCE COMPUTATION
   ================================================================ */

export interface AccountBalance {
  code: string;
  name: string;
  nameAr?: string | null;
  accountClass: AccountClass;
  group: AccountGroup;
  normalBalance: NormalBalance;
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

export function computeBalances(lines: JournalLine[]): AccountBalance[] {
  const map = new Map<string, AccountBalance>();
  for (const line of lines) {
    const account = findAccountByCode(line.accountCode);
    if (!account) continue;
    let bal = map.get(line.accountCode);
    if (!bal) {
      bal = { code: account.code, name: account.name, nameAr: account.nameAr, accountClass: account.accountClass, group: account.group, normalBalance: account.normalBalance, debitTotal: 0, creditTotal: 0, balance: 0 };
      map.set(line.accountCode, bal);
    }
    bal.debitTotal = round(bal.debitTotal + line.debit);
    bal.creditTotal = round(bal.creditTotal + line.credit);
    bal.balance = account.normalBalance === "debit" ? round(bal.debitTotal - bal.creditTotal) : round(bal.creditTotal - bal.debitTotal);
  }
  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}

export function trialBalanceCheck(balances: AccountBalance[]): { totalDebit: number; totalCredit: number; balanced: boolean } {
  let totalDebit = 0;
  let totalCredit = 0;
  for (const bal of balances) {
    totalDebit += bal.debitTotal;
    totalCredit += bal.creditTotal;
  }
  return { totalDebit: round(totalDebit), totalCredit: round(totalCredit), balanced: Math.abs(totalDebit - totalCredit) < 0.01 };
}

export function profitAndLoss(balances: AccountBalance[]): {
  revenue: AccountBalance[]; costOfSales: AccountBalance[]; expenses: AccountBalance[];
  revenueTotal: number; costOfSalesTotal: number; grossProfit: number;
  expenseTotal: number; operatingProfit: number; netProfit: number;
} {
  const revenue = balances.filter((b) => b.accountClass === "income");
  const costOfSales = balances.filter((b) => b.accountClass === "cost_of_sales");
  const expenses = balances.filter((b) => b.accountClass === "expense");
  const revenueTotal = round(revenue.reduce((s, b) => s + Math.abs(b.balance), 0));
  const costOfSalesTotal = round(costOfSales.reduce((s, b) => s + Math.abs(b.balance), 0));
  const grossProfit = round(revenueTotal - costOfSalesTotal);
  const expenseTotal = round(expenses.reduce((s, b) => s + Math.abs(b.balance), 0));
  const operatingProfit = round(grossProfit - expenseTotal);
  return { revenue, costOfSales, expenses, revenueTotal, costOfSalesTotal, grossProfit, expenseTotal, operatingProfit, netProfit: operatingProfit };
}

export function balanceSheet(balances: AccountBalance[]): {
  currentAssets: AccountBalance[]; nonCurrentAssets: AccountBalance[];
  currentLiabilities: AccountBalance[]; nonCurrentLiabilities: AccountBalance[];
  equity: AccountBalance[];
  assetTotal: number; liabilityTotal: number; equityTotal: number;
} {
  const currentAssets = balances.filter((b) => b.accountClass === "asset" && b.group === "current_asset");
  const nonCurrentAssets = balances.filter((b) => b.accountClass === "asset" && b.group === "non_current_asset");
  const currentLiabilities = balances.filter((b) => b.accountClass === "liability" && b.group === "current_liability");
  const nonCurrentLiabilities = balances.filter((b) => b.accountClass === "liability" && b.group === "non_current_liability");
  const equity = balances.filter((b) => b.accountClass === "equity");
  const assetTotal = round([...currentAssets, ...nonCurrentAssets].reduce((s, b) => s + Math.abs(b.balance), 0));
  const liabilityTotal = round([...currentLiabilities, ...nonCurrentLiabilities].reduce((s, b) => s + Math.abs(b.balance), 0));
  const equityTotal = round(equity.reduce((s, b) => s + Math.abs(b.balance), 0));
  return { currentAssets, nonCurrentAssets, currentLiabilities, nonCurrentLiabilities, equity, assetTotal, liabilityTotal, equityTotal };
}

/* ================================================================
   LAYER E — ATTACHMENT MODEL
   ================================================================ */

export type AttachmentDocumentTag =
  | "invoice_pdf" | "supplier_bill" | "delivery_note" | "goods_receipt"
  | "signed_paper" | "customs_document" | "transport_document" | "receipt"
  | "payroll_document" | "contract_reference" | "bank_statement"
  | "journal_support" | "other";

export interface Attachment {
  id: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  documentTag: AttachmentDocumentTag;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
  description?: string | null;
}

/* ================================================================
   LAYER F — INVENTORY ACCOUNTING LINKAGE
   ================================================================ */

export type InventoryClassification = "raw_material" | "trading" | "finished_goods" | "spare_parts" | "consumables";

export interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  classification: InventoryClassification;
  costAccountCode: string;
  revenueAccountCode?: string;
  inventoryAccountCode: string;
  unitCost: number;
  quantityOnHand: number;
  reorderLevel?: number;
}

export type StockMovementType = "purchase" | "sale" | "adjustment_up" | "adjustment_down" | "transfer" | "consumption" | "return";

export interface StockMovement {
  id: number;
  itemId: number;
  movementType: StockMovementType;
  quantity: number;
  unitCost: number;
  totalValue: number;
  sourceDocumentType?: string;
  sourceDocumentId?: number;
  warehouseFrom?: string;
  warehouseTo?: string;
  date: string;
  journalEntryId?: number;
}

/* ================================================================
   LAYER G — RECONCILIATION MODEL
   ================================================================ */

export interface BankStatementLine {
  id: number;
  bankAccountId: number;
  transactionDate: string;
  valueDate?: string;
  reference?: string;
  description?: string;
  debit: number;
  credit: number;
  runningBalance: number;
  status: "unmatched" | "matched" | "reconciled";
  matchedJournalLineId?: number | null;
  reconciledAt?: string | null;
  notes?: string | null;
}

export interface ReconciliationSheet {
  bankAccountCode: string;
  bankAccountName: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  closingBalance: number;
  statementLines: BankStatementLine[];
  unmatchedCount: number;
  matchedCount: number;
  reconciledCount: number;
}

/* ================================================================
   LAYER H — ACCOUNTING PERIOD
   ================================================================ */

export interface AccountingPeriod {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: "open" | "locked" | "closed";
}

/** Wafeq-style COA section labels; maps to `accountGroupHints` (see `lib/workspace/coa-wafeq-groups.ts`). */
export { WAFEQ_STYLE_COA_HIERARCHY, accountGroupToWafeqPath } from "./workspace/coa-wafeq-groups";
