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
  UserCircle,
  Users,
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
      { id: "customers", label: "Customers", href: `${USER_WORKSPACE_BASE}/customers`, icon: Users },
      { id: "quotations", label: "Quotations", href: `${USER_WORKSPACE_BASE}/quotations`, icon: FileBadge },
      { id: "proforma", label: "Proforma invoices", href: `${USER_WORKSPACE_BASE}/proforma-invoices`, icon: ClipboardList },
      { id: "invoices", label: "Tax invoices", href: `${USER_WORKSPACE_BASE}/invoices`, icon: FileText },
      { id: "credit-notes", label: "Credit notes", href: `${USER_WORKSPACE_BASE}/credit-notes`, icon: FileMinus },
      { id: "debit-notes", label: "Debit notes", href: `${USER_WORKSPACE_BASE}/debit-notes`, icon: FilePlus },
      { id: "delivery-notes", label: "Delivery notes (stock link)", href: `${USER_WORKSPACE_BASE}/stock-movements`, icon: PackageSearch },
      { id: "customer-statement-rpt", label: "Customer statement", href: `${USER_WORKSPACE_BASE}/reports/customer-statement`, icon: FileText },
      { id: "aged-ar", label: "Aged receivables", href: `${USER_WORKSPACE_BASE}/reports/receivables-aging`, icon: BarChart3 },
      { id: "customer-payments", label: "Customer payments", href: `${USER_WORKSPACE_BASE}/customer-payments`, icon: Wallet },
    ],
  },
  {
    id: "purchases",
    label: "Purchases",
    icon: ShoppingCart,
    links: [
      { id: "vendors", label: "Suppliers (vendors)", href: `${USER_WORKSPACE_BASE}/vendors`, icon: UserCircle },
      { id: "purchase-orders", label: "Purchase orders", href: `${USER_WORKSPACE_BASE}/purchase-orders`, icon: FileInput },
      { id: "bills", label: "Bills", href: `${USER_WORKSPACE_BASE}/bills`, icon: FileText },
      { id: "supplier-credits", label: "Supplier credit notes", href: `${USER_WORKSPACE_BASE}/supplier-credits`, icon: FileMinus },
      { id: "purchase-debit-notes", label: "Supplier debit notes", href: `${USER_WORKSPACE_BASE}/debit-notes`, icon: FilePlus },
      { id: "supplier-statement", label: "Supplier statement", href: `${USER_WORKSPACE_BASE}/reports/supplier-statement`, icon: FileText },
      { id: "aged-ap", label: "Aged payables", href: `${USER_WORKSPACE_BASE}/reports/payables-aging`, icon: BarChart3 },
      { id: "supplier-payments", label: "Supplier payments", href: `${USER_WORKSPACE_BASE}/supplier-payments`, icon: CreditCard },
      { id: "cash-expenses", label: "Cash expenses", href: `${USER_WORKSPACE_BASE}/cash-expenses`, icon: Banknote },
      { id: "vendor-records", label: "Vendor records", href: `${USER_WORKSPACE_BASE}/vendor-records`, icon: Truck },
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
      { id: "products", label: "Products & services", href: `${USER_WORKSPACE_BASE}/products-services`, icon: ShoppingBag },
      { id: "raw-materials", label: "Raw materials", href: `${USER_WORKSPACE_BASE}/raw-materials`, icon: PackageSearch },
      { id: "finished", label: "Finished goods", href: `${USER_WORKSPACE_BASE}/finished-materials`, icon: PackageSearch },
      { id: "stock", label: "Stock movements", href: `${USER_WORKSPACE_BASE}/stock-movements`, icon: PackageSearch },
      { id: "inv-adj", label: "Inventory adjustments", href: `${USER_WORKSPACE_BASE}/inventory-adjustments`, icon: ArrowLeftRight },
      { id: "inv-val", label: "Inventory valuation (report)", href: `${USER_WORKSPACE_BASE}/reports/inventory-valuation`, icon: BarChart3 },
      { id: "cogs-rpt", label: "COGS (report)", href: `${USER_WORKSPACE_BASE}/reports/cogs`, icon: BarChart3 },
      { id: "defective", label: "Defective inventory (report)", href: `${USER_WORKSPACE_BASE}/reports/defective-inventory`, icon: BarChart3 },
      { id: "repair", label: "Repair / rework (report)", href: `${USER_WORKSPACE_BASE}/reports/repair-inventory`, icon: BarChart3 },
      { id: "inv-rpt-move", label: "Inventory movement (report)", href: `${USER_WORKSPACE_BASE}/reports/inventory-movement`, icon: BarChart3 },
    ],
  },
  {
    id: "accounting",
    label: "Accounting",
    icon: BookOpenText,
    links: [
      { id: "acct-hub", label: "Accounting overview", href: `${USER_WORKSPACE_BASE}/accounting`, icon: BookOpenText },
      { id: "coa", label: "Chart of accounts", href: `${USER_WORKSPACE_BASE}/chart-of-accounts`, icon: Network },
      { id: "manual-journals", label: "Manual journals", href: `${USER_WORKSPACE_BASE}/manual-journals`, icon: FileText },
      { id: "journal", label: "Journal entries", href: `${USER_WORKSPACE_BASE}/journal-entries`, icon: ClipboardList },
      { id: "ledger", label: "General ledger", href: `${USER_WORKSPACE_BASE}/ledger`, icon: Rows3 },
      { id: "trial-balance", label: "Trial balance", href: `${USER_WORKSPACE_BASE}/reports/trial-balance`, icon: BarChart3 },
      { id: "soa", label: "Statement of account", href: `${USER_WORKSPACE_BASE}/reports/statement-of-account`, icon: FileText },
      { id: "opening-balances", label: "Opening balances", href: `${USER_WORKSPACE_BASE}/opening-balances`, icon: FileDown },
      { id: "tax-rates", label: "Tax rates", href: `${USER_WORKSPACE_BASE}/tax-rates`, icon: Tag },
      { id: "bank-accounts", label: "Bank accounts", href: `${USER_WORKSPACE_BASE}/bank-accounts`, icon: Landmark },
      { id: "fixed-assets", label: "Fixed assets", href: `${USER_WORKSPACE_BASE}/fixed-assets`, icon: Building2 },
      { id: "cost-centers", label: "Cost centers", href: `${USER_WORKSPACE_BASE}/cost-centers`, icon: Network },
      { id: "projects", label: "Projects", href: `${USER_WORKSPACE_BASE}/projects`, icon: BarChart3 },
      { id: "branches", label: "Branches", href: `${USER_WORKSPACE_BASE}/branches`, icon: Building2 },
      { id: "audit-rpt", label: "Audit trail", href: `${USER_WORKSPACE_BASE}/reports/audit-trail`, icon: ClipboardList },
      { id: "period-closing", label: "Period closing", href: `${USER_WORKSPACE_BASE}/period-closing`, icon: FileBadge },
      { id: "recurring-journals", label: "Recurring journals", href: `${USER_WORKSPACE_BASE}/recurring-journals`, icon: Repeat },
      { id: "journal-templates", label: "Journal templates", href: `${USER_WORKSPACE_BASE}/manual-journal-templates`, icon: LayoutTemplate },
    ],
  },
  {
    id: "banking",
    label: "Banking",
    icon: Landmark,
    links: [
      { id: "bank-accounts", label: "Bank accounts", href: `${USER_WORKSPACE_BASE}/bank-accounts`, icon: Landmark },
      { id: "banking-hub", label: "Cash & banking hub", href: `${USER_WORKSPACE_BASE}/banking`, icon: Banknote },
      { id: "bank-reconciliation", label: "Bank reconciliation", href: `${USER_WORKSPACE_BASE}/bank-reconciliation`, icon: ArrowLeftRight },
      { id: "reconciliation-alt", label: "Reconciliation (alt)", href: `${USER_WORKSPACE_BASE}/reconciliation`, icon: ArrowLeftRight },
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
