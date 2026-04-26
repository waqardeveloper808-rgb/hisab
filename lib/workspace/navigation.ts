import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Banknote,
  BookOpenText,
  Boxes,
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
  LayoutDashboard,
  LayoutTemplate,
  PackageSearch,
  Receipt,
  Repeat,
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
      { id: "products", label: "Products & services", href: `${USER_WORKSPACE_BASE}/products-services`, icon: ShoppingBag },
    ],
  },
  {
    id: "accounting",
    label: "Accounting",
    icon: BookOpenText,
    links: [
      { id: "ledger", label: "Ledger view", href: `${USER_WORKSPACE_BASE}/dashboard?focus=ledger`, icon: BookOpenText },
      { id: "journal", label: "Journal entries", href: `${USER_WORKSPACE_BASE}/dashboard?focus=journal`, icon: ClipboardList },
    ],
  },
  {
    id: "vat",
    label: "VAT / Tax",
    icon: FileBadge,
    links: [
      { id: "vat-summary", label: "VAT summary", href: `${USER_WORKSPACE_BASE}/dashboard?focus=vat`, icon: FileBadge },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: ClipboardList,
    links: [
      { id: "reports-hub", label: "Reports", href: `${USER_WORKSPACE_BASE}/reports`, icon: ClipboardList },
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
