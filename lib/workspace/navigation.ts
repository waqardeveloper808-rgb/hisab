import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Banknote,
  BarChart3,
  BookOpenText,
  Boxes,
  Building2,
  CircleHelp,
  ClipboardList,
  CreditCard,
  FileBadge,
  FileDown,
  FileInput,
  FileMinus,
  FilePlus,
  FileText,
  Import,
  Landmark,
  LayoutDashboard,
  LayoutTemplate,
  LineChart,
  Network,
  PackageSearch,
  PieChart,
  Receipt,
  Repeat,
  Rows3,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  Wallet,
} from "lucide-react";

export type NavLink = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  links: NavLink[];
};

/** Canonical user workspace application routes. */
export const USER_WORKSPACE_BASE = "/workspace/user";

export const dashboardLink: NavLink = {
  id: "dashboard",
  label: "Dashboard",
  href: `${USER_WORKSPACE_BASE}/dashboard`,
  icon: LayoutDashboard,
};

export const navGroups: NavGroup[] = [
  {
    id: "sales",
    label: "Sales",
    icon: Receipt,
    links: [
      { id: "invoices", label: "Tax invoices", href: `${USER_WORKSPACE_BASE}/invoices`, icon: FileText },
      { id: "quotations", label: "Quotations", href: `${USER_WORKSPACE_BASE}/quotations`, icon: FileBadge },
      { id: "proforma", label: "Proforma invoices", href: `${USER_WORKSPACE_BASE}/proforma-invoices`, icon: ClipboardList },
      { id: "credit-notes", label: "Credit notes", href: `${USER_WORKSPACE_BASE}/credit-notes`, icon: FileMinus },
      { id: "debit-notes", label: "Debit notes", href: `${USER_WORKSPACE_BASE}/debit-notes`, icon: FilePlus },
      { id: "customer-payments", label: "Customer payments", href: `${USER_WORKSPACE_BASE}/customer-payments`, icon: Wallet },
    ],
  },
  {
    id: "purchases",
    label: "Purchases",
    icon: ShoppingCart,
    links: [
      { id: "bills", label: "Bills", href: `${USER_WORKSPACE_BASE}/bills`, icon: FileText },
      { id: "supplier-payments", label: "Supplier payments", href: `${USER_WORKSPACE_BASE}/supplier-payments`, icon: CreditCard },
      { id: "cash-expenses", label: "Cash expenses", href: `${USER_WORKSPACE_BASE}/cash-expenses`, icon: Banknote },
      { id: "purchase-debit-notes", label: "Debit notes (purchase)", href: `${USER_WORKSPACE_BASE}/debit-notes`, icon: FilePlus },
      { id: "purchase-orders", label: "Purchase orders", href: `${USER_WORKSPACE_BASE}/purchase-orders`, icon: FileInput },
      { id: "vendors", label: "Vendor records", href: `${USER_WORKSPACE_BASE}/vendor-records`, icon: Truck },
      { id: "supplier-credits", label: "Supplier credits", href: `${USER_WORKSPACE_BASE}/supplier-credits`, icon: FileMinus },
      { id: "purchase-returns", label: "Purchase returns", href: `${USER_WORKSPACE_BASE}/purchase-returns`, icon: ArrowLeftRight },
      { id: "recurring-bills", label: "Recurring bills", href: `${USER_WORKSPACE_BASE}/recurring-bills`, icon: Repeat },
      { id: "expense-categories", label: "Expense categories", href: `${USER_WORKSPACE_BASE}/expense-categories`, icon: Tag },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Boxes,
    links: [
      { id: "stock", label: "Stock movements", href: `${USER_WORKSPACE_BASE}/stock-movements`, icon: PackageSearch },
      { id: "inv-rpt-move", label: "Inventory movement (report)", href: `${USER_WORKSPACE_BASE}/reports/inventory-movement`, icon: BarChart3 },
      { id: "products", label: "Products & services", href: `${USER_WORKSPACE_BASE}/products-services`, icon: ShoppingBag },
    ],
  },
  {
    id: "accounting",
    label: "Accounting",
    icon: BookOpenText,
    links: [
      { id: "acct-hub", label: "Accounting hub", href: `${USER_WORKSPACE_BASE}/accounting`, icon: BookOpenText },
      { id: "manual-journals", label: "Manual journals", href: `${USER_WORKSPACE_BASE}/manual-journals`, icon: FileText },
      { id: "journal", label: "Journal entries", href: `${USER_WORKSPACE_BASE}/journal-entries`, icon: ClipboardList },
      { id: "coa", label: "Chart of accounts", href: `${USER_WORKSPACE_BASE}/chart-of-accounts`, icon: Network },
      { id: "ledger", label: "General ledger", href: `${USER_WORKSPACE_BASE}/ledger`, icon: Rows3 },
      { id: "opening-balances", label: "Opening balances", href: `${USER_WORKSPACE_BASE}/opening-balances`, icon: FileDown },
      { id: "tax-rates", label: "Tax rates", href: `${USER_WORKSPACE_BASE}/tax-rates`, icon: Tag },
      { id: "fixed-assets", label: "Fixed assets", href: `${USER_WORKSPACE_BASE}/fixed-assets`, icon: Building2 },
      { id: "cost-centers", label: "Cost centers", href: `${USER_WORKSPACE_BASE}/cost-centers`, icon: Network },
      { id: "projects", label: "Projects", href: `${USER_WORKSPACE_BASE}/projects`, icon: BarChart3 },
      { id: "branches", label: "Branches", href: `${USER_WORKSPACE_BASE}/branches`, icon: Building2 },
      { id: "recurring-journals", label: "Recurring journals", href: `${USER_WORKSPACE_BASE}/recurring-journals`, icon: Repeat },
      { id: "journal-templates", label: "Journal templates", href: `${USER_WORKSPACE_BASE}/manual-journal-templates`, icon: LayoutTemplate },
      { id: "period-closing", label: "Period closing", href: `${USER_WORKSPACE_BASE}/period-closing`, icon: FileBadge },
    ],
  },
  {
    id: "banking",
    label: "Banking",
    icon: Landmark,
    links: [
      { id: "bank-accounts", label: "Bank accounts", href: `${USER_WORKSPACE_BASE}/bank-accounts`, icon: Landmark },
      { id: "bank-reconciliation", label: "Bank reconciliation", href: `${USER_WORKSPACE_BASE}/bank-reconciliation`, icon: ArrowLeftRight },
    ],
  },
  {
    id: "vat",
    label: "VAT / Tax",
    icon: FileBadge,
    links: [
      { id: "vat-dashboard", label: "VAT dashboard", href: `${USER_WORKSPACE_BASE}/vat`, icon: FileBadge },
      { id: "tax-rates-vat", label: "Tax rates", href: `${USER_WORKSPACE_BASE}/tax-rates`, icon: Tag },
      { id: "vat-summary", label: "VAT summary (report)", href: `${USER_WORKSPACE_BASE}/reports/vat-summary`, icon: PieChart },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    links: [
      { id: "reports-hub", label: "Reports hub", href: `${USER_WORKSPACE_BASE}/reports`, icon: BarChart3 },
      { id: "rep-pl", label: "Profit & loss", href: `${USER_WORKSPACE_BASE}/reports/profit-loss`, icon: LineChart },
      { id: "rep-bs", label: "Balance sheet", href: `${USER_WORKSPACE_BASE}/reports/balance-sheet`, icon: PieChart },
      { id: "rep-cf", label: "Cash flow", href: `${USER_WORKSPACE_BASE}/reports/cash-flow`, icon: LineChart },
      { id: "rep-tb", label: "Trial balance", href: `${USER_WORKSPACE_BASE}/reports/trial-balance`, icon: Rows3 },
      { id: "rep-gl", label: "General ledger", href: `${USER_WORKSPACE_BASE}/reports/general-ledger`, icon: BookOpenText },
      { id: "rep-ar", label: "Aged receivables", href: `${USER_WORKSPACE_BASE}/reports/receivables-aging`, icon: FileText },
      { id: "rep-ap", label: "Aged payables", href: `${USER_WORKSPACE_BASE}/reports/payables-aging`, icon: FileText },
      { id: "rep-audit", label: "Audit trail", href: `${USER_WORKSPACE_BASE}/reports/audit-trail`, icon: ClipboardList },
    ],
  },
  {
    id: "import",
    label: "Import",
    icon: Import,
    links: [
      { id: "import-hub", label: "Import data", href: `${USER_WORKSPACE_BASE}/import`, icon: FileDown },
    ],
  },
  {
    id: "templates",
    label: "Templates",
    icon: LayoutTemplate,
    links: [
      { id: "templates-list", label: "Document templates", href: `${USER_WORKSPACE_BASE}/templates`, icon: LayoutTemplate },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    links: [
      { id: "settings-profile", label: "User profile", href: `${USER_WORKSPACE_BASE}/settings/profile`, icon: Settings },
      { id: "settings-company", label: "Company profile", href: `${USER_WORKSPACE_BASE}/settings/company`, icon: Store },
    ],
  },
  {
    id: "help",
    label: "Help",
    icon: CircleHelp,
    links: [
      { id: "help-center", label: "Help center", href: `${USER_WORKSPACE_BASE}/help`, icon: CircleHelp },
    ],
  },
];
