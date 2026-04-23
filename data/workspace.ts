export type WorkspaceResource = {
  title: string;
  description: string;
  href?: string;
  badge?: string;
};

export type WorkspaceModule = {
  slug: string;
  href: string;
  label: string;
  navGroup: "overview" | "operations" | "control" | "directory" | "management";
  title: string;
  summary: string;
  requiredPlatformAbilities?: string[];
  requiredCompanyAbilities?: string[];
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  highlights: string[];
  sections: {
    register?: WorkspaceResource[];
    books?: WorkspaceResource[];
    templates?: WorkspaceResource[];
    reports?: WorkspaceResource[];
    help?: WorkspaceResource[];
  };
};

export const workspaceModules: WorkspaceModule[] = [
  {
    slug: "dashboard",
    href: "/workspace/dashboard",
    label: "Dashboard",
    navGroup: "overview",
    requiredCompanyAbilities: ["workspace.reports.view", "workspace.sales.manage", "workspace.purchases.manage"],
    title: "Dashboard",
    summary: "Start with a clean view of sales, purchases, cash, VAT, and the work that needs attention today.",
    primaryAction: { label: "Create invoice", href: "/workspace/invoices/new" },
    secondaryAction: { label: "Create bill", href: "/workspace/bills/new" },
    highlights: ["One calm daily starting point", "Cash, receivables, and payables at a glance", "Fast access to the next task"],
    sections: {
      reports: [
        { title: "Daily finance summary", description: "Sales, purchases, receivables, payables, and VAT in one place.", href: "/workspace/reports" },
        { title: "Recent activity", description: "Latest invoices, bills, payments, and audit items." },
      ],
      help: [
        { title: "Need guidance", description: "Open help without leaving your daily workspace.", href: "/workspace/help" },
      ],
    },
  },
  {
    slug: "sales",
    href: "/workspace/sales",
    label: "Sales",
    navGroup: "operations",
    requiredCompanyAbilities: ["workspace.sales.manage"],
    title: "Sales",
    summary: "Manage invoices, customer balances, credit notes, and sales follow-up from one module.",
    primaryAction: { label: "New invoice", href: "/workspace/invoices/new" },
    secondaryAction: { label: "Open reports", href: "/workspace/reports/registers" },
    highlights: ["Task-first invoice creation", "Customer balances close to the transaction", "Credit and payment follow-up stays visible"],
    sections: {
      register: [
        { title: "Invoices register", description: "Track issued invoices, status, due dates, and balances.", badge: "Register" },
        { title: "Credit notes", description: "See customer credits and the reason behind each change." },
      ],
      reports: [
        { title: "Receivables aging", description: "See which customer balances need follow-up.", href: "/workspace/reports" },
        { title: "Customer statements", description: "Review invoice and payment history for one customer." },
      ],
      help: [
        { title: "Sales help", description: "Answers for invoice, payment, and credit workflows.", href: "/workspace/help/faq" },
      ],
    },
  },
  {
    slug: "purchases",
    href: "/workspace/purchases",
    label: "Purchases",
    navGroup: "operations",
    requiredCompanyAbilities: ["workspace.purchases.manage"],
    title: "Purchases",
    summary: "Capture supplier bills, payable balances, supplier credits, and payment activity without leaving the workflow.",
    primaryAction: { label: "New bill", href: "/workspace/bills/new" },
    secondaryAction: { label: "Open payables", href: "/workspace/reports" },
    highlights: ["Bills and supplier balances stay together", "Supplier credits are visible before payment", "Purchases feed the books and VAT review"],
    sections: {
      register: [
        { title: "Bills register", description: "Review open, paid, and overdue supplier bills.", badge: "Register" },
        { title: "Supplier credit notes", description: "Keep supplier returns and credits easy to trace." },
      ],
      reports: [
        { title: "Payables aging", description: "See what is due now and what is falling behind.", href: "/workspace/reports" },
      ],
      help: [
        { title: "Purchases help", description: "Guidance for supplier bills, payments, and credit workflows.", href: "/workspace/help/faq" },
      ],
    },
  },
  {
    slug: "accounting",
    href: "/workspace/accounting",
    label: "Accounting",
    navGroup: "control",
    requiredCompanyAbilities: ["workspace.accounting.view"],
    title: "Accounting",
    summary: "Review books, balances, journal impact, and period discipline from one accounting home.",
    primaryAction: { label: "Open books", href: "/workspace/accounting/books" },
    secondaryAction: { label: "Open reports", href: "/workspace/reports" },
    highlights: ["Books stay aligned to transaction flow", "Period review is separate from data entry", "Audit-ready records stay traceable"],
    sections: {
      books: [
        { title: "General ledger", description: "Book-level drilldown for account movement.", href: "/workspace/accounting/books", badge: "Books" },
        { title: "Trial balance", description: "Review the current balance of each account." },
      ],
      reports: [
        { title: "Profit and loss", description: "Measure sales, expenses, and current earnings.", href: "/workspace/reports" },
        { title: "Balance sheet", description: "Review assets, liabilities, and earnings in one view.", href: "/workspace/reports" },
      ],
    },
  },
  {
    slug: "banking",
    href: "/workspace/banking",
    label: "Banking",
    navGroup: "operations",
    requiredCompanyAbilities: ["workspace.payments.manage"],
    title: "Banking",
    summary: "Keep cash movement, incoming payments, outgoing payments, and refunds in one orderly place.",
    primaryAction: { label: "Review payments", href: "/workspace/banking" },
    highlights: ["Incoming and outgoing payment activity stays visible", "Refunds and advances do not disappear", "Cash movement stays close to the related work"],
    sections: {
      register: [
        { title: "Payment activity", description: "Track incoming, outgoing, and refund activity from one register.", badge: "Register" },
      ],
      reports: [
        { title: "Cash position", description: "See posted cash movement and where it came from." },
      ],
    },
  },
  {
    slug: "vat",
    href: "/workspace/vat",
    label: "VAT",
    navGroup: "control",
    requiredCompanyAbilities: ["workspace.vat.view"],
    title: "VAT and compliance",
    summary: "Keep VAT review, filing preparation, and compliance-ready transaction output organised without cluttering daily entry screens.",
    primaryAction: { label: "Review VAT", href: "/workspace/vat" },
    secondaryAction: { label: "Open AI help", href: "/workspace/help/ai" },
    highlights: ["VAT stays visible without taking over the form", "Sales and purchase tax positions stay together", "Compliance review is separate from daily work"],
    sections: {
      reports: [
        { title: "VAT detail", description: "Review output and input VAT by transaction type.", href: "/workspace/reports" },
        { title: "VAT summary", description: "High-level tax totals before filing.", href: "/workspace/reports" },
      ],
      help: [
        { title: "VAT answers", description: "Open VAT help and filing guidance.", href: "/workspace/help/faq" },
      ],
    },
  },
  {
    slug: "reports",
    href: "/workspace/reports",
    label: "Reports",
    navGroup: "control",
    requiredCompanyAbilities: ["workspace.reports.view"],
    title: "Reports",
    summary: "Open business summaries, finance statements, registers, and operational review points from one reporting home.",
    primaryAction: { label: "Open registers", href: "/workspace/reports/registers" },
    highlights: ["Statements and registers share one home", "Operational review is separate from transaction entry", "Owners and finance teams can read the same story"],
    sections: {
      register: [
        { title: "Registers", description: "Invoice, bill, and payment registers for day-to-day review.", href: "/workspace/reports/registers", badge: "Register" },
      ],
      reports: [
        { title: "Profit and loss", description: "See earnings and expense performance." },
        { title: "Balance sheet", description: "Review current financial position." },
        { title: "Audit trail", description: "Follow who changed what and when." },
      ],
    },
  },
  {
    slug: "contacts",
    href: "/workspace/contacts",
    label: "Contacts",
    navGroup: "directory",
    requiredCompanyAbilities: ["workspace.contacts.manage"],
    title: "Contacts",
    summary: "Manage customers and suppliers in one shared directory that supports quick search and inline add flows.",
    primaryAction: { label: "New invoice", href: "/workspace/invoices/new" },
    secondaryAction: { label: "New bill", href: "/workspace/bills/new" },
    highlights: ["Customers and suppliers share one predictable structure", "Quick create starts from the transaction, not a dead-end master list", "Search stays central to daily work"],
    sections: {
      register: [
        { title: "Customers", description: "Keep active customers ready for invoicing.", badge: "Register" },
        { title: "Suppliers", description: "Keep supplier records ready for bill capture." },
      ],
      help: [
        { title: "Directory guidance", description: "How to keep contacts clean without slowing transaction work.", href: "/workspace/help/faq" },
      ],
    },
  },
  {
    slug: "communications",
    href: "/workspace/communications",
    label: "Communications",
    navGroup: "operations",
    requiredCompanyAbilities: ["workspace.sales.manage"],
    title: "Communications",
    summary: "Track document sends, delivery attempts, retries, and in-app communication history from one register.",
    primaryAction: { label: "Open communications", href: "/workspace/communications" },
    secondaryAction: { label: "Open sales", href: "/workspace/sales" },
    highlights: ["Document sends keep a real timeline", "Retry history is visible", "Templates and delivery state stay in one runtime"],
    sections: {
      register: [
        { title: "Communication register", description: "Review email sends, in-app events, statuses, and retries.", href: "/workspace/communications", badge: "Register" },
      ],
      help: [
        { title: "Send workflow guidance", description: "Use invoice detail and communication history to resolve send issues.", href: "/workspace/help/faq" },
      ],
    },
  },
  {
    slug: "settings",
    href: "/workspace/settings",
    label: "Settings",
    navGroup: "directory",
    requiredCompanyAbilities: ["company.settings.manage"],
    title: "Settings",
    summary: "Keep company details, numbering, templates, and workspace rules in one settings home without cluttering the day-to-day modules.",
    primaryAction: { label: "Open templates", href: "/workspace/settings/templates" },
    highlights: ["Templates and numbering stay out of the transaction path", "Settings are grouped by business purpose", "Setup noise stays small once the workspace is live"],
    sections: {
      templates: [
        { title: "Document templates", description: "Invoice, bill, and credit note layouts.", href: "/workspace/settings/templates", badge: "Templates" },
        { title: "Numbering rules", description: "Keep invoice and bill references organised." },
      ],
      help: [
        { title: "Setup help", description: "Open settings and setup answers only when needed.", href: "/workspace/help" },
      ],
    },
  },
  {
    slug: "agents",
    href: "/workspace/agents",
    label: "Agents",
    navGroup: "directory",
    requiredCompanyAbilities: ["workspace.agents.view"],
    title: "Agents",
    summary: "Track referrals, trial signups, and commission visibility from one partner dashboard.",
    primaryAction: { label: "Open agent dashboard", href: "/workspace/agents" },
    highlights: ["Referral link ready to share", "Signups and commissions stay visible", "Partner sales can be measured without exports"],
    sections: {
      reports: [
        { title: "Referral summary", description: "See signups, subscriptions, and commission totals.", href: "/workspace/agents", badge: "Partner" },
      ],
      help: [
        { title: "Need selling help", description: "Use WhatsApp support when an agent needs product clarification.", href: "/workspace/help" },
      ],
    },
  },
  {
    slug: "help",
    href: "/workspace/help",
    label: "Help",
    navGroup: "directory",
    title: "Help",
    summary: "Find practical answers, browse the FAQ, and open AI help without competing with daily transaction screens.",
    primaryAction: { label: "Open AI help", href: "/workspace/help/ai" },
    secondaryAction: { label: "Browse FAQ", href: "/workspace/help/faq" },
    highlights: ["Help stays available but quiet", "Daily work does not compete with support content", "Business language stays consistent across guidance"],
    sections: {
      help: [
        { title: "Help center", description: "Start with quick answers grouped by work area.", href: "/workspace/help" },
        { title: "FAQ", description: "Browse common questions and starting points.", href: "/workspace/help/faq", badge: "FAQ" },
        { title: "AI help", description: "Ask for guided help when you need a faster answer.", href: "/workspace/help/ai", badge: "AI help" },
      ],
    },
  },
  {
    slug: "company-users",
    href: "/workspace/settings/users",
    label: "Users",
    navGroup: "directory",
    title: "Users",
    summary: "Manage accountant and admin accounts for the current business.",
    requiredCompanyAbilities: ["company.users.manage"],
    primaryAction: { label: "Manage users", href: "/workspace/settings/users" },
    highlights: ["Seat usage stays visible", "Role changes are controlled", "Internal user access stays simple"],
    sections: {
      help: [
        { title: "User management", description: "Create or disable accountant and admin accounts." },
      ],
    },
  },
  {
    slug: "admin-plans",
    href: "/workspace/admin/plans",
    label: "Plans",
    navGroup: "management",
    title: "Plans",
    summary: "Control pricing, support settings, and the offers shown on the pricing page.",
    requiredPlatformAbilities: ["platform.plans.view"],
    primaryAction: { label: "Manage plans", href: "/workspace/admin/plans" },
    highlights: ["Live pricing values", "Trial and support settings", "Marketing points stay synced to the site"],
    sections: {
      reports: [{ title: "Platform plans", description: "Edit plan offers, limits, and visibility." }],
    },
  },
  {
    slug: "admin-agents",
    href: "/workspace/admin/agents",
    label: "Agent Admin",
    navGroup: "management",
    title: "Agent Admin",
    summary: "Search, activate, and adjust referral agents across the platform.",
    requiredPlatformAbilities: ["platform.agents.view"],
    primaryAction: { label: "Manage agents", href: "/workspace/admin/agents" },
    highlights: ["Commission visibility", "Referral search", "Active and inactive control"],
    sections: {
      reports: [{ title: "Agent management", description: "Inspect referrals and commission totals." }],
    },
  },
  {
    slug: "admin-customers",
    href: "/workspace/admin/customers",
    label: "Customers",
    navGroup: "management",
    title: "Customers",
    summary: "Inspect companies, subscriptions, linked users, and referral source.",
    requiredPlatformAbilities: ["platform.customers.view"],
    primaryAction: { label: "Manage customers", href: "/workspace/admin/customers" },
    highlights: ["Company status control", "Subscription visibility", "Linked user inspection"],
    sections: {
      reports: [{ title: "Customer management", description: "Support and admin access to customer businesses." }],
    },
  },
  {
    slug: "support-accounts",
    href: "/workspace/admin/support-accounts",
    label: "Support Accounts",
    navGroup: "management",
    title: "Support Accounts",
    summary: "Create and control support and super-admin platform accounts.",
    requiredPlatformAbilities: ["platform.support_users.manage"],
    primaryAction: { label: "Manage support accounts", href: "/workspace/admin/support-accounts" },
    highlights: ["Activation control", "Permission assignment", "Support account lifecycle"],
    sections: {
      reports: [{ title: "Support accounts", description: "Limit who can operate the platform." }],
    },
  },
];

export const workspaceNavGroups = [
  { key: "overview", label: "Overview" },
  { key: "operations", label: "Daily work" },
  { key: "control", label: "Control" },
  { key: "management", label: "Platform management" },
  { key: "directory", label: "Directory and help" },
] as const;

export function getWorkspaceModule(slug: string) {
  return workspaceModules.find((module) => module.slug === slug);
}