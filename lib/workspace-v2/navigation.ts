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

/** Canonical user workspace (Workspace V2 implementation). */
export const V2_BASE = "/workspace/user";

/** Temporary alias during migration; same UI as {@link V2_BASE}. */
export const V2_ALIAS_BASE = "/workspace-v2/user";

export const dashboardLink: NavLink = {
  id: "dashboard",
  label: "Dashboard",
  href: `${V2_BASE}/dashboard`,
  icon: LayoutDashboard,
};

export const navGroups: NavGroup[] = [
  {
    id: "sales",
    label: "Sales",
    icon: Receipt,
    links: [
      { id: "invoices", label: "Tax invoices", href: `${V2_BASE}/invoices`, icon: FileText },
      { id: "quotations", label: "Quotations", href: `${V2_BASE}/quotations`, icon: FileBadge },
      { id: "proforma", label: "Proforma invoices", href: `${V2_BASE}/proforma-invoices`, icon: ClipboardList },
      { id: "credit-notes", label: "Credit notes", href: `${V2_BASE}/credit-notes`, icon: FileMinus },
      { id: "debit-notes", label: "Debit notes", href: `${V2_BASE}/debit-notes`, icon: FilePlus },
      { id: "customer-payments", label: "Customer payments", href: `${V2_BASE}/customer-payments`, icon: Wallet },
    ],
  },
  {
    id: "purchases",
    label: "Purchases",
    icon: ShoppingCart,
    links: [
      { id: "bills", label: "Bills", href: `${V2_BASE}/bills`, icon: FileText },
      { id: "supplier-payments", label: "Supplier payments", href: `${V2_BASE}/supplier-payments`, icon: CreditCard },
      { id: "cash-expenses", label: "Cash expenses", href: `${V2_BASE}/cash-expenses`, icon: Banknote },
      { id: "purchase-debit-notes", label: "Debit notes (purchase)", href: `${V2_BASE}/debit-notes`, icon: FilePlus },
      { id: "purchase-orders", label: "Purchase orders", href: `${V2_BASE}/purchase-orders`, icon: FileInput },
      { id: "vendors", label: "Vendor records", href: `${V2_BASE}/vendor-records`, icon: Truck },
      { id: "supplier-credits", label: "Supplier credits", href: `${V2_BASE}/supplier-credits`, icon: FileMinus },
      { id: "purchase-returns", label: "Purchase returns", href: `${V2_BASE}/purchase-returns`, icon: ArrowLeftRight },
      { id: "recurring-bills", label: "Recurring bills", href: `${V2_BASE}/recurring-bills`, icon: Repeat },
      { id: "expense-categories", label: "Expense categories", href: `${V2_BASE}/expense-categories`, icon: Tag },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Boxes,
    links: [
      { id: "stock", label: "Stock movements", href: `${V2_BASE}/stock-movements`, icon: PackageSearch },
      { id: "products", label: "Products & services", href: `${V2_BASE}/products-services`, icon: ShoppingBag },
    ],
  },
  {
    id: "accounting",
    label: "Accounting",
    icon: BookOpenText,
    links: [
      { id: "ledger", label: "Ledger view", href: `${V2_BASE}/dashboard?focus=ledger`, icon: BookOpenText },
      { id: "journal", label: "Journal entries", href: `${V2_BASE}/dashboard?focus=journal`, icon: ClipboardList },
    ],
  },
  {
    id: "vat",
    label: "VAT / Tax",
    icon: FileBadge,
    links: [
      { id: "vat-summary", label: "VAT summary", href: `${V2_BASE}/dashboard?focus=vat`, icon: FileBadge },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: ClipboardList,
    links: [
      { id: "reports-hub", label: "Reports", href: `${V2_BASE}/reports`, icon: ClipboardList },
    ],
  },
  {
    id: "import",
    label: "Import",
    icon: Import,
    links: [
      { id: "import-hub", label: "Import data", href: `${V2_BASE}/import`, icon: FileDown },
    ],
  },
  {
    id: "templates",
    label: "Templates",
    icon: LayoutTemplate,
    links: [
      { id: "templates-list", label: "Document templates", href: `${V2_BASE}/templates`, icon: LayoutTemplate },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    links: [
      { id: "settings-profile", label: "User profile", href: `${V2_BASE}/settings/profile`, icon: Settings },
      { id: "settings-company", label: "Company profile", href: `${V2_BASE}/settings/company`, icon: Store },
    ],
  },
  {
    id: "help",
    label: "Help",
    icon: CircleHelp,
    links: [
      { id: "help-center", label: "Help center", href: `${V2_BASE}/help`, icon: CircleHelp },
    ],
  },
];
