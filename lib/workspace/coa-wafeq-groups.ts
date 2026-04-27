/**
 * Wafeq-style COA hierarchy labels mapped to Hisabix account classes / groups.
 * Does not change account codes — use for navigation, help, and reporting labels only.
 */

export type CoaWafeqSection = {
  id: string;
  label: string;
  subgroups: { id: string; label: string; accountGroupHints: string[] }[];
};

export const WAFEQ_STYLE_COA_HIERARCHY: CoaWafeqSection[] = [
  {
    id: "assets",
    label: "Assets",
    subgroups: [
      { id: "cash", label: "Cash and Cash Equivalents", accountGroupHints: ["current_asset"] },
      { id: "bank", label: "Bank Accounts", accountGroupHints: ["current_asset"] },
      { id: "ar", label: "Accounts Receivable", accountGroupHints: ["current_asset", "receivable"] },
      { id: "ret_ar", label: "Retention Receivable", accountGroupHints: ["current_asset"] },
      { id: "emp_adv", label: "Employee Advances", accountGroupHints: ["current_asset", "advance"] },
      { id: "prepaid", label: "Prepaid Expenses", accountGroupHints: ["current_asset", "prepaid"] },
      { id: "rm_inv", label: "Raw Material Inventory", accountGroupHints: ["current_asset", "inventory"] },
      { id: "wip", label: "Work in Progress", accountGroupHints: ["current_asset", "inventory"] },
      { id: "fg", label: "Finished Goods Inventory", accountGroupHints: ["current_asset", "inventory"] },
      { id: "fa", label: "Fixed Assets", accountGroupHints: ["non_current_asset", "fixed_asset"] },
      { id: "ad", label: "Accumulated Depreciation", accountGroupHints: ["contra_asset"] },
    ],
  },
  {
    id: "liabilities",
    label: "Liabilities",
    subgroups: [
      { id: "ap", label: "Accounts Payable", accountGroupHints: ["current_liability", "payable"] },
      { id: "ret_ap", label: "Retention Payable", accountGroupHints: ["current_liability"] },
      { id: "vat_pl", label: "VAT Payable / Receivable (net display)", accountGroupHints: ["current_liability", "current_asset", "tax"] },
      { id: "payroll", label: "Payroll Payable", accountGroupHints: ["current_liability"] },
      { id: "bonus_p", label: "Bonus Payable", accountGroupHints: ["current_liability"] },
      { id: "profit_sh_p", label: "Profit Sharing Payable", accountGroupHints: ["current_liability"] },
      { id: "accrued", label: "Accrued Expenses", accountGroupHints: ["current_liability"] },
      { id: "unearned", label: "Unearned Revenue", accountGroupHints: ["current_liability"] },
      { id: "loans", label: "Loans", accountGroupHints: ["non_current_liability", "current_liability"] },
    ],
  },
  {
    id: "equity",
    label: "Equity",
    subgroups: [
      { id: "capital", label: "Owner Capital", accountGroupHints: ["equity"] },
      { id: "drawings", label: "Drawings", accountGroupHints: ["equity"] },
      { id: "re", label: "Retained Earnings", accountGroupHints: ["equity"] },
      { id: "cyp", label: "Current Year P/L", accountGroupHints: ["equity"] },
    ],
  },
  {
    id: "income",
    label: "Income",
    subgroups: [
      { id: "sales", label: "Sales Revenue", accountGroupHints: ["operating_revenue", "other_revenue"] },
      { id: "service", label: "Service Revenue", accountGroupHints: ["operating_revenue"] },
      { id: "other_sales", label: "Other Sales", accountGroupHints: ["other_revenue"] },
      { id: "sales_ret", label: "Sales Returns", accountGroupHints: ["contra_revenue"] },
      { id: "disc", label: "Sales Discounts", accountGroupHints: ["contra_revenue"] },
      { id: "dn_adj", label: "Debit Note Revenue Adjustment", accountGroupHints: ["operating_revenue"] },
      { id: "cn_adj", label: "Credit Note Sales Adjustment", accountGroupHints: ["contra_revenue"] },
    ],
  },
  {
    id: "cos",
    label: "Cost of Sales",
    subgroups: [
      { id: "cogs", label: "COGS", accountGroupHints: ["cost_of_goods_sold"] },
      { id: "rm_cons", label: "Raw Material Consumed", accountGroupHints: ["cost_of_goods_sold"] },
      { id: "labor", label: "Direct Labor", accountGroupHints: ["cost_of_goods_sold", "operating_expense"] },
      { id: "oh", label: "Production Overhead", accountGroupHints: ["cost_of_goods_sold", "operating_expense"] },
      { id: "def_loss", label: "Inventory Defect / Loss", accountGroupHints: ["cost_of_goods_sold", "operating_expense"] },
      { id: "rework", label: "Inventory Repair / Rework", accountGroupHints: ["cost_of_goods_sold", "operating_expense"] },
    ],
  },
  {
    id: "expense",
    label: "Expenses",
    subgroups: [
      { id: "rent", label: "Rent", accountGroupHints: ["operating_expense"] },
      { id: "util", label: "Utilities", accountGroupHints: ["operating_expense"] },
      { id: "sal", label: "Salaries", accountGroupHints: ["payroll"] },
      { id: "bonus_e", label: "Bonus Expense", accountGroupHints: ["payroll", "operating_expense"] },
      { id: "psh_e", label: "Profit Sharing Expense", accountGroupHints: ["payroll"] },
      { id: "bank_ch", label: "Bank Charges", accountGroupHints: ["financial", "operating_expense"] },
      { id: "maint", label: "Maintenance", accountGroupHints: ["operating_expense"] },
      { id: "trans", label: "Transport", accountGroupHints: ["operating_expense"] },
      { id: "depr", label: "Depreciation Expense", accountGroupHints: ["operating_expense"] },
      { id: "prof", label: "Professional Fees", accountGroupHints: ["operating_expense"] },
      { id: "misc", label: "Miscellaneous", accountGroupHints: ["operating_expense", "financial"] },
    ],
  },
  {
    id: "other",
    label: "Other income / Other expense / Clearing",
    subgroups: [
      { id: "gain_loss", label: "Gain / Loss", accountGroupHints: ["other_revenue", "operating_expense", "financial"] },
      { id: "suspense", label: "Suspense / Clearing", accountGroupHints: ["current_asset", "current_liability"] },
    ],
  },
];

/** Resolves a Wafeq section/subgroup path from loose account class/group keys (e.g. COA metadata). */
export function accountGroupToWafeqPath(
  groupHints: string[] | string | null | undefined,
): { section: string; subgroup: string; sectionLabel: string; subgroupLabel: string } | null {
  const hints: string[] = Array.isArray(groupHints)
    ? groupHints
    : typeof groupHints === "string" && groupHints
      ? [groupHints]
      : [];
  const normalized = hints.map((h) => h.toLowerCase().trim()).filter(Boolean);
  if (normalized.length === 0) return null;

  for (const section of WAFEQ_STYLE_COA_HIERARCHY) {
    for (const sub of section.subgroups) {
      if (sub.accountGroupHints.some((hint) => normalized.some((g) => g.includes(hint) || hint.includes(g)))) {
        return { section: section.id, subgroup: sub.id, sectionLabel: section.label, subgroupLabel: sub.label };
      }
    }
  }
  return null;
}
