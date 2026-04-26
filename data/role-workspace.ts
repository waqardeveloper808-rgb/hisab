export type WorkspaceRoleKey = "user" | "admin" | "assistant" | "agent";

export type WorkspaceButtonVariant = "primary" | "secondary" | "tertiary" | "muted";

export type WorkspaceQuickAction = {
  label: string;
  href: string;
  variant?: WorkspaceButtonVariant;
};

export type WorkspaceNavItem = {
  label: string;
  href: string;
  matchPrefixes?: string[];
};

export type WorkspaceNavGroup = {
  label: string;
  items: WorkspaceNavItem[];
};

export type WorkspaceRoleDefinition = {
  key: WorkspaceRoleKey;
  label: string;
  homeHref: string;
  eyebrow: string;
  title: string;
  description: string;
  quickActions: WorkspaceQuickAction[];
  sidebarGroups: WorkspaceNavGroup[];
  priorities: string[];
};

export type WorkspaceModuleMetric = {
  label: string;
  value: string;
  detail: string;
};

export type WorkspaceModuleAlert = {
  title: string;
  detail: string;
};

export type WorkspaceModulePageDefinition = {
  role: WorkspaceRoleKey;
  title: string;
  description: string;
  metrics: WorkspaceModuleMetric[];
  alerts: WorkspaceModuleAlert[];
  quickActions: WorkspaceQuickAction[];
  relatedLinks: Array<{
    title: string;
    description: string;
    href: string;
  }>;
};

export const workspaceRoleOrder: WorkspaceRoleKey[] = ["user", "admin", "assistant", "agent"];

export const workspaceRoles: Record<WorkspaceRoleKey, WorkspaceRoleDefinition> = {
  user: {
    key: "user",
    label: "User Workspace",
    homeHref: "/workspace/user",
    eyebrow: "Business Operations",
    title: "User Workspace",
    description: "Run sales, purchases, accounting, products, VAT, and operational setup from one business-first workspace.",
    quickActions: [
      { label: "Create Invoice", href: "/workspace/invoices/new", variant: "primary" },
      { label: "Record Payment", href: "/workspace/user/customer-payments", variant: "secondary" },
      { label: "Add Customer", href: "/workspace/user/customers", variant: "secondary" },
      { label: "Add Bill", href: "/workspace/bills/new", variant: "secondary" },
      { label: "View VAT Summary", href: "/workspace/user/vat", variant: "tertiary" },
    ],
    priorities: [
      "Keep receivables, payables, and VAT visible without leaving the main workflow.",
      "Move from task to module directly instead of routing through abstract overview pages.",
      "Keep every daily action one click away from the role home and sidebar.",
    ],
    sidebarGroups: [
      {
        label: "Dashboard",
        items: [
          { label: "Overview", href: "/workspace/user", matchPrefixes: ["/workspace/user", "/workspace/user/dashboard", "/workspace/dashboard"] },
        ],
      },
      {
        label: "Sales",
        items: [
          { label: "Invoices", href: "/workspace/user/invoices", matchPrefixes: ["/workspace/user/invoices", "/workspace/invoices", "/workspace/sales"] },
          { label: "Quotations", href: "/workspace/user/quotations", matchPrefixes: ["/workspace/user/quotations"] },
          { label: "Proforma", href: "/workspace/user/proforma-invoices", matchPrefixes: ["/workspace/user/proforma-invoices"] },
          { label: "Credit Notes", href: "/workspace/user/credit-notes", matchPrefixes: ["/workspace/user/credit-notes"] },
          { label: "Debit Notes", href: "/workspace/user/debit-notes", matchPrefixes: ["/workspace/user/debit-notes"] },
        ],
      },
      {
        label: "Purchases",
        items: [
          { label: "Bills", href: "/workspace/user/bills", matchPrefixes: ["/workspace/user/bills", "/workspace/bills"] },
          { label: "Vendors", href: "/workspace/user/vendors", matchPrefixes: ["/workspace/user/vendors", "/workspace/user/vendor-payments"] },
        ],
      },
      {
        label: "Inventory",
        items: [
          { label: "Products & Services", href: "/workspace/user/products-services", matchPrefixes: ["/workspace/user/products-services", "/workspace/user/products"] },
          { label: "Stock movements", href: "/workspace/user/stock-movements", matchPrefixes: ["/workspace/user/stock-movements", "/workspace/user/stock"] },
          { label: "Raw Materials", href: "/workspace/user/raw-materials", matchPrefixes: ["/workspace/user/raw-materials"] },
          { label: "Finished Materials", href: "/workspace/user/finished-materials", matchPrefixes: ["/workspace/user/finished-materials"] },
          { label: "Consumables", href: "/workspace/user/consumables", matchPrefixes: ["/workspace/user/consumables"] },
          { label: "Sold Materials", href: "/workspace/user/sold-materials", matchPrefixes: ["/workspace/user/sold-materials"] },
          { label: "Inventory Adjustments", href: "/workspace/user/inventory-adjustments", matchPrefixes: ["/workspace/user/inventory-adjustments"] },
        ],
      },
      {
        label: "Accounting",
        items: [
          { label: "Chart of Accounts", href: "/workspace/user/chart-of-accounts", matchPrefixes: ["/workspace/user/chart-of-accounts"] },
          { label: "Journal Entries", href: "/workspace/user/journal-entries", matchPrefixes: ["/workspace/user/journal-entries"] },
          { label: "Ledger", href: "/workspace/user/ledger", matchPrefixes: ["/workspace/user/ledger", "/workspace/accounting/books"] },
          { label: "Opening Balances", href: "/workspace/user/opening-balances", matchPrefixes: ["/workspace/user/opening-balances"] },
        ],
      },
      {
        label: "Banking",
        items: [
          { label: "Bank Accounts", href: "/workspace/user/banking", matchPrefixes: ["/workspace/user/banking", "/workspace/banking"] },
          { label: "Reconciliation", href: "/workspace/user/reconciliation", matchPrefixes: ["/workspace/user/reconciliation"] },
        ],
      },
      {
        label: "VAT / Compliance",
        items: [
          { label: "VAT Dashboard", href: "/workspace/user/vat", matchPrefixes: ["/workspace/user/vat", "/workspace/vat"] },
          { label: "VAT Summary", href: "/workspace/user/reports/vat-summary", matchPrefixes: ["/workspace/user/reports/vat-summary"] },
        ],
      },
      {
        label: "Reports",
        items: [
          { label: "Trial Balance", href: "/workspace/user/reports/trial-balance", matchPrefixes: ["/workspace/user/reports/trial-balance"] },
          { label: "Profit & Loss", href: "/workspace/user/reports/profit-loss", matchPrefixes: ["/workspace/user/reports/profit-loss"] },
          { label: "Balance Sheet", href: "/workspace/user/reports/balance-sheet", matchPrefixes: ["/workspace/user/reports/balance-sheet"] },
          { label: "Cash Flow", href: "/workspace/user/reports/cash-flow", matchPrefixes: ["/workspace/user/reports/cash-flow"] },
          { label: "Receivables Aging", href: "/workspace/user/reports/receivables-aging", matchPrefixes: ["/workspace/user/reports/receivables-aging"] },
          { label: "Payables Aging", href: "/workspace/user/reports/payables-aging", matchPrefixes: ["/workspace/user/reports/payables-aging"] },
          { label: "All Reports", href: "/workspace/user/reports", matchPrefixes: ["/workspace/user/reports", "/workspace/reports"] },
        ],
      },
      {
        label: "Templates",
        items: [
          { label: "Template studio (V2)", href: "/workspace/user/templates/studio", matchPrefixes: ["/workspace/user/templates/studio", "/workspace/settings/templates"] },
          { label: "Document templates (V2)", href: "/workspace/user/templates", matchPrefixes: ["/workspace/user/templates"] },
          { label: "Invoice Templates", href: "/workspace/user/invoice-templates", matchPrefixes: ["/workspace/user/invoice-templates", "/workspace/user/document-templates"] },
          { label: "Quotation Templates", href: "/workspace/user/quotation-templates", matchPrefixes: ["/workspace/user/quotation-templates"] },
          { label: "Proforma Templates", href: "/workspace/user/proforma-templates", matchPrefixes: ["/workspace/user/proforma-templates"] },
          { label: "Credit Note Templates", href: "/workspace/user/credit-note-templates", matchPrefixes: ["/workspace/user/credit-note-templates"] },
          { label: "Debit Note Templates", href: "/workspace/user/debit-note-templates", matchPrefixes: ["/workspace/user/debit-note-templates"] },
          { label: "Purchase / Expense Templates", href: "/workspace/user/purchase-templates", matchPrefixes: ["/workspace/user/purchase-templates"] },
        ],
      },
      {
        label: "Settings",
        items: [
          { label: "User Profile", href: "/workspace/user/settings/profile", matchPrefixes: ["/workspace/user/settings/profile", "/workspace/settings/profile"] },
          { label: "Company Profile", href: "/workspace/user/settings/company", matchPrefixes: ["/workspace/user/settings/company", "/workspace/settings", "/workspace/settings/company"] },
          { label: "Users", href: "/workspace/settings/users" },
          { label: "Accounting Settings", href: "/workspace/settings/accounting", matchPrefixes: ["/workspace/settings/accounting"] },
        ],
      },
    ],
  },
  admin: {
    key: "admin",
    label: "Admin Workspace",
    homeHref: "/workspace/admin",
    eyebrow: "Platform Control",
    title: "Admin Workspace",
    description: "Manage platform customers, plans, support accounts, audit, integrations, and access governance from one control surface.",
    quickActions: [
      { label: "Review Customers", href: "/workspace/admin/customers", variant: "primary" },
      { label: "Review Plans", href: "/workspace/admin/plans", variant: "secondary" },
      { label: "Open Audit", href: "/workspace/admin/audit", variant: "secondary" },
      { label: "Manage Support Accounts", href: "/workspace/admin/support-accounts", variant: "secondary" },
      { label: "Review Integrations", href: "/workspace/admin/integrations", variant: "tertiary" },
    ],
    priorities: [
      "Keep customer, subscription, and support-account decisions grounded in live platform state.",
      "Separate platform control from the operating workspace used by customers.",
      "Make route quality and governance visible without burying them under generic platform labels.",
    ],
    sidebarGroups: [
      {
        label: "Platform Control",
        items: [
          { label: "Customers", href: "/workspace/admin/customers" },
          { label: "Plans", href: "/workspace/admin/plans" },
          { label: "Support Accounts", href: "/workspace/admin/support-accounts" },
          { label: "Audit", href: "/workspace/admin/audit" },
          { label: "System Health", href: "/workspace/admin/system-health" },
        ],
      },
      {
        label: "Commercial Operations",
        items: [
          { label: "Agents", href: "/workspace/admin/agents" },
          { label: "Integrations", href: "/workspace/admin/integrations" },
          { label: "Document Templates", href: "/workspace/admin/document-templates" },
        ],
      },
      {
        label: "Access / Governance",
        items: [
          { label: "Access Management", href: "/workspace/admin/access-management" },
          { label: "Company Reviews", href: "/workspace/admin/company-reviews" },
        ],
      },
      {
        label: "AI Review",
        items: [
          { label: "Review Dashboard", href: "/workspace/admin/review", matchPrefixes: ["/workspace/admin/review"] },
          { label: "Findings", href: "/workspace/admin/review/findings" },
          { label: "Module Health", href: "/workspace/admin/review/modules" },
          { label: "Route Health", href: "/workspace/admin/review/routes" },
          { label: "Prompt Generator", href: "/workspace/admin/review/prompts" },
          { label: "Audit History", href: "/workspace/admin/review/history" },
        ],
      },
    ],
  },
  assistant: {
    key: "assistant",
    label: "Assistant Workspace",
    homeHref: "/workspace/assistant",
    eyebrow: "Support Operations",
    title: "Assistant Workspace",
    description: "Handle help queue work, onboarding, invoice guidance, AI assistance, and customer follow-up from one operational support surface.",
    quickActions: [
      { label: "Open Help Queue", href: "/workspace/assistant/help-queue", variant: "primary" },
      { label: "Start Customer Follow-up", href: "/workspace/assistant/customer-follow-up", variant: "secondary" },
      { label: "Open AI Help", href: "/workspace/assistant/ai-help", variant: "secondary" },
      { label: "Guide Invoice Creation", href: "/workspace/assistant/invoice-help", variant: "secondary" },
      { label: "Review Pending Customer Tasks", href: "/workspace/assistant/pending-tasks", variant: "tertiary" },
    ],
    priorities: [
      "Keep follow-up, onboarding, and help intake visible in the same workspace.",
      "Use operational queues and customer health signals instead of vague support placeholders.",
      "Move directly from issue context into the next customer-facing action.",
    ],
    sidebarGroups: [
      {
        label: "Support Queue",
        items: [
          { label: "Help Queue", href: "/workspace/assistant/help-queue" },
          { label: "AI Help", href: "/workspace/assistant/ai-help", matchPrefixes: ["/workspace/help/ai"] },
          { label: "Invoice Help", href: "/workspace/assistant/invoice-help" },
        ],
      },
      {
        label: "Customer Success",
        items: [
          { label: "Customer Follow-up", href: "/workspace/assistant/customer-follow-up" },
          { label: "Onboarding", href: "/workspace/assistant/onboarding" },
          { label: "Pending Tasks", href: "/workspace/assistant/pending-tasks" },
        ],
      },
      {
        label: "Knowledge / Escalations",
        items: [
          { label: "Help Center", href: "/workspace/assistant/help-center", matchPrefixes: ["/workspace/help"] },
          { label: "Customer Accounts", href: "/workspace/assistant/customer-accounts", matchPrefixes: ["/workspace/admin/customers"] },
        ],
      },
    ],
  },
  agent: {
    key: "agent",
    label: "Agent Workspace",
    homeHref: "/workspace/agent",
    eyebrow: "Revenue Pipeline",
    title: "Agent Workspace",
    description: "Work leads, referrals, assigned accounts, follow-ups, and outreach tasks from one commercially focused pipeline workspace.",
    quickActions: [
      { label: "Add Lead", href: "/workspace/agent/leads", variant: "primary" },
      { label: "Record Follow-up", href: "/workspace/agent/follow-ups", variant: "secondary" },
      { label: "Open Assigned Accounts", href: "/workspace/agent/assigned-accounts", variant: "secondary" },
      { label: "View Pipeline", href: "/workspace/agent/pipeline", variant: "secondary" },
      { label: "Review Pending Outreach", href: "/workspace/agent/pending-outreach", variant: "tertiary" },
    ],
    priorities: [
      "Keep commercial follow-up and account ownership visible, not buried inside generic partner pages.",
      "Make leads, outreach, and assigned-client actions obvious from the first screen.",
      "Keep pipeline actions tied to the real signup and referral flow.",
    ],
    sidebarGroups: [
      {
        label: "Pipeline",
        items: [
          { label: "Leads", href: "/workspace/agent/leads" },
          { label: "Referrals", href: "/workspace/agent/referrals" },
          { label: "Assigned Accounts", href: "/workspace/agent/assigned-accounts" },
          { label: "Pipeline", href: "/workspace/agent/pipeline" },
        ],
      },
      {
        label: "Outreach",
        items: [
          { label: "Follow-ups", href: "/workspace/agent/follow-ups" },
          { label: "Pending Outreach", href: "/workspace/agent/pending-outreach" },
          { label: "Activity Log", href: "/workspace/agent/activity" },
        ],
      },
    ],
  },
};

const moduleOverrides: Record<string, Omit<WorkspaceModulePageDefinition, "role">> = {
  "/workspace/user/invoices": {
    title: "Invoices",
    description: "Create, review, and chase customer invoices from the sales flow instead of navigating through a generic dashboard.",
    metrics: [
      { label: "Open invoices", value: "Receivables", detail: "Keep unpaid sales documents visible for same-day follow-up." },
      { label: "Due today", value: "Collection queue", detail: "Review invoices that need calls, reminders, or payment allocation." },
      { label: "Draft to send", value: "Sales pipeline", detail: "Move new invoices from draft to sent without leaving the workspace." },
    ],
    alerts: [
      { title: "Unpaid invoice reminders", detail: "Use this page as the sales follow-up starting point before balances age further." },
      { title: "Allocation gaps", detail: "Match incoming cash to invoices so reporting and VAT stay clean." },
    ],
    quickActions: [
      { label: "Create Invoice", href: "/workspace/invoices/new", variant: "primary" },
      { label: "Open Sales Overview", href: "/workspace/sales", variant: "secondary" },
      { label: "Open Reports", href: "/workspace/reports/registers", variant: "tertiary" },
    ],
    relatedLinks: [
      { title: "Customer balances", description: "Move from invoices into customer payment follow-up.", href: "/workspace/user/customers" },
      { title: "Payment desk", description: "Record receipts and review allocation gaps.", href: "/workspace/user/payments" },
      { title: "VAT review", description: "Keep sales tax visible before filing time.", href: "/workspace/user/vat" },
    ],
  },
  "/workspace/user/proforma-invoices": {
    title: "Proforma Invoices",
    description: "Prepare customer-facing proformas in the sales flow before conversion to a live tax invoice.",
    metrics: [
      { label: "Pending approval", value: "Offer stage", detail: "Keep non-posting sales commitments visible before final issue." },
      { label: "Conversion ready", value: "Sales pipeline", detail: "Move accepted proformas into invoice execution without losing context." },
      { label: "Customer review", value: "Pre-billing", detail: "Stay in the same register while reviewing rendered output and follow-up status." },
    ],
    alerts: [
      { title: "Convert accepted proformas", detail: "Review accepted pre-billing documents and move them into the tax invoice flow." },
      { title: "Watch aging offers", detail: "Keep pending customer decisions visible before deals stall." },
    ],
    quickActions: [
      { label: "Create Proforma", href: "/workspace/invoices/new?documentType=proforma_invoice", variant: "primary" },
      { label: "Open Sales Overview", href: "/workspace/sales", variant: "secondary" },
      { label: "Open Invoices", href: "/workspace/user/invoices", variant: "tertiary" },
    ],
    relatedLinks: [
      { title: "Quotations", description: "Start with a quotation when pricing still needs negotiation.", href: "/workspace/user/quotations" },
      { title: "Invoices", description: "Move into live billing once the customer is ready to be invoiced.", href: "/workspace/user/invoices" },
      { title: "Customers", description: "Keep customer payment and approval context nearby.", href: "/workspace/user/customers" },
    ],
  },
  "/workspace/admin/system-health": {
    title: "System Health",
    description: "Track route integrity, platform readiness, and control-surface issues that affect live customer workspaces.",
    metrics: [
      { label: "Route checks", value: "Workspace coverage", detail: "Confirm every visible entry point resolves to a valid screen." },
      { label: "Support readiness", value: "Admin operations", detail: "Keep support accounts and control pages available for daily use." },
      { label: "Subscription visibility", value: "Commercial integrity", detail: "Make sure plan and customer surfaces expose the real paid-state story." },
    ],
    alerts: [
      { title: "Navigation gaps", detail: "Use this page to review any module families that still need route hardening." },
      { title: "Review admin access", detail: "Keep platform-control pages restricted to the right staff roles." },
    ],
    quickActions: [
      { label: "Open Audit", href: "/workspace/admin/audit", variant: "primary" },
      { label: "Review Customers", href: "/workspace/admin/customers", variant: "secondary" },
      { label: "Review Support Accounts", href: "/workspace/admin/support-accounts", variant: "tertiary" },
    ],
    relatedLinks: [
      { title: "Audit checks", description: "Run the live route and content review surface.", href: "/workspace/admin/audit" },
      { title: "Customer control", description: "Inspect account status and subscription impact.", href: "/workspace/admin/customers" },
      { title: "Plan control", description: "Make sure live pricing and plan state are coherent.", href: "/workspace/admin/plans" },
    ],
  },
  "/workspace/assistant/help-queue": {
    title: "Help Queue",
    description: "Work the day’s incoming support demand with a queue that connects directly to AI help, onboarding, and customer follow-up.",
    metrics: [
      { label: "Queue shape", value: "Customer help load", detail: "Triage the issues that block invoice creation, onboarding, or billing clarity." },
      { label: "Escalations", value: "Support pressure", detail: "Keep issues that need product or admin review visible." },
      { label: "Follow-up due", value: "Customer callbacks", detail: "Move queue items into explicit next actions before the day ends." },
    ],
    alerts: [
      { title: "Invoice help backlog", detail: "Customers stuck on billing or invoice flows should be moved into guided help quickly." },
      { title: "Onboarding risk", detail: "Trial customers with no clear next step should be contacted before churn risk rises." },
    ],
    quickActions: [
      { label: "Open AI Help", href: "/workspace/help/ai", variant: "primary" },
      { label: "Start Customer Follow-up", href: "/workspace/assistant/customer-follow-up", variant: "secondary" },
      { label: "Open Help Center", href: "/workspace/help", variant: "tertiary" },
    ],
    relatedLinks: [
      { title: "Invoice guidance", description: "Jump into the invoice help workflow for customers who are blocked on documents.", href: "/workspace/assistant/invoice-help" },
      { title: "Pending tasks", description: "Review the list of customer actions that still need completion.", href: "/workspace/assistant/pending-tasks" },
      { title: "Customer accounts", description: "Open customer records when support needs account context.", href: "/workspace/assistant/customer-accounts" },
    ],
  },
  "/workspace/agent/leads": {
    title: "Leads",
    description: "Track top-of-funnel opportunities, assigned follow-up, and the actions required to move prospects into the live signup flow.",
    metrics: [
      { label: "New leads", value: "Pipeline intake", detail: "Capture every new lead before it disappears into chat history or notes." },
      { label: "Follow-up due", value: "Next contact", detail: "Keep scheduled calls and messages visible for the day." },
      { label: "Trial-ready", value: "Conversion candidates", detail: "Move qualified leads directly into the Hisabix signup flow." },
    ],
    alerts: [
      { title: "Stale opportunities", detail: "Leads without follow-up should be recycled into the outreach list before they go cold." },
      { title: "Assigned-account overlap", detail: "Keep ownership clear when an account is already being worked by another agent or team member." },
    ],
    quickActions: [
      { label: "Open Pipeline", href: "/workspace/agent/pipeline", variant: "primary" },
      { label: "Record Follow-up", href: "/workspace/agent/follow-ups", variant: "secondary" },
      { label: "Open Signup Flow", href: "/register?plan=zatca-monthly", variant: "tertiary" },
    ],
    relatedLinks: [
      { title: "Assigned accounts", description: "Review customers already mapped to this agent for follow-up or expansion.", href: "/workspace/agent/assigned-accounts" },
      { title: "Referrals", description: "Track referred businesses tied to the agent code.", href: "/workspace/agent/referrals" },
      { title: "Pending outreach", description: "Work the tasks that still need a call, message, or demo handoff.", href: "/workspace/agent/pending-outreach" },
    ],
  },
};

function defaultModuleDefinition(role: WorkspaceRoleKey, item: WorkspaceNavItem): WorkspaceModulePageDefinition {
  const roleLabel = workspaceRoles[role].label.replace(" Workspace", "");

  // Determine module-contextual actions based on the route to avoid wrong-action contamination
  const href = item.href;
  let contextualActions: WorkspaceQuickAction[] = [];

  if (href.includes("inventory") || href.includes("stock") || href.includes("product")) {
    contextualActions = [
      { label: "Products & Services", href: "/workspace/user/products", variant: "primary" },
      { label: "View Stock", href: "/workspace/user/stock", variant: "secondary" },
    ];
  } else if (href.includes("vendor-payment") || href.includes("supplier")) {
    contextualActions = [
      { label: "View Bills", href: "/workspace/user/bills", variant: "primary" },
      { label: "View Vendors", href: "/workspace/user/vendors", variant: "secondary" },
    ];
  } else if (href.includes("reconcil") || href.includes("banking")) {
    contextualActions = [
      { label: "Banking Overview", href: "/workspace/banking", variant: "primary" },
    ];
  } else if (href.includes("ledger") || href.includes("opening-balance") || href.includes("chart-of-accounts") || href.includes("journal")) {
    contextualActions = [
      { label: "Chart of Accounts", href: "/workspace/user/chart-of-accounts", variant: "primary" },
      { label: "Journal Entries", href: "/workspace/user/journal-entries", variant: "secondary" },
    ];
  } else if (href.includes("report") || href.includes("trial-balance") || href.includes("profit-loss") || href.includes("balance-sheet") || href.includes("cash-flow") || href.includes("aging") || href.includes("vat-summary")) {
    contextualActions = [
      { label: "Reports Overview", href: "/workspace/reports", variant: "primary" },
    ];
  } else if (href.includes("template")) {
    contextualActions = [
      { label: "Invoice Templates", href: "/workspace/user/invoice-templates", variant: "primary" },
      { label: "All Templates", href: "/workspace/user/document-templates", variant: "secondary" },
    ];
  } else if (href.includes("setting") || href.includes("company")) {
    contextualActions = [
      { label: "Settings", href: "/workspace/settings", variant: "primary" },
    ];
  } else {
    // Fallback: use home link only, never show cross-module actions
    contextualActions = [
      { label: `${roleLabel} Home`, href: workspaceRoles[role].homeHref, variant: "primary" },
    ];
  }

  return {
    role,
    title: item.label,
    description: `${item.label} is being built. Use the linked routes for related workflows.`,
    metrics: [],
    alerts: [
      { title: "Module in development", detail: "This route will have a dedicated operational screen. Related working routes are linked below." },
    ],
    quickActions: contextualActions,
    relatedLinks: [
      { title: `${workspaceRoles[role].label} home`, description: "Return to the main workspace.", href: workspaceRoles[role].homeHref },
    ],
  };
}

export function getWorkspaceRoleFromPath(pathname: string): WorkspaceRoleKey {
  if (pathname === "/workspace/admin" || pathname.startsWith("/workspace/admin/")) {
    return "admin";
  }

  if (pathname === "/workspace/assistant" || pathname.startsWith("/workspace/assistant/")) {
    return "assistant";
  }

  if (pathname === "/workspace/agent" || pathname.startsWith("/workspace/agent/")) {
    return "agent";
  }

  return "user";
}

export function findActiveWorkspaceNavItem(pathname: string, role: WorkspaceRoleKey) {
  const items = workspaceRoles[role].sidebarGroups.flatMap((group) => group.items);

  return items.find((item) => {
    const prefixes = [item.href, ...(item.matchPrefixes ?? [])];
    return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }) ?? null;
}

export function getWorkspaceModulePageByHref(href: string): WorkspaceModulePageDefinition | null {
  const role = workspaceRoleOrder.find((candidate) => href.startsWith(`${workspaceRoles[candidate].homeHref}/`));

  if (!role) {
    return null;
  }

  const item = workspaceRoles[role].sidebarGroups.flatMap((group) => group.items).find((entry) => entry.href === href);
  if (!item || href === workspaceRoles[role].homeHref) {
    return null;
  }

  const override = moduleOverrides[href];
  if (override) {
    return {
      role,
      ...override,
    };
  }

  return defaultModuleDefinition(role, item);
}

export function findWorkspaceModulePage(slug: string[]): WorkspaceModulePageDefinition | null {
  if (!slug.length) {
    return null;
  }

  const [roleSegment, ...rest] = slug;
  if (!workspaceRoleOrder.includes(roleSegment as WorkspaceRoleKey) || !rest.length) {
    return null;
  }

  const href = `/workspace/${slug.join("/")}`;
  return getWorkspaceModulePageByHref(href);
}

export function resolveWorkspaceModulePage(slug: string[]): WorkspaceModulePageDefinition | null {
  return findWorkspaceModulePage(slug);
}