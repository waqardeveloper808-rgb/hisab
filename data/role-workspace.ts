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
      { label: "Record Payment", href: "/workspace/user/payments", variant: "secondary" },
      { label: "Add Customer", href: "/workspace/user/customers", variant: "secondary" },
      { label: "Add Bill", href: "/workspace/bills/new", variant: "secondary" },
      { label: "View VAT Summary", href: "/workspace/vat", variant: "tertiary" },
    ],
    priorities: [
      "Keep receivables, payables, and VAT visible without leaving the main workflow.",
      "Move from task to module directly instead of routing through abstract overview pages.",
      "Keep every daily action one click away from the role home and sidebar.",
    ],
    sidebarGroups: [
      {
        label: "Sales",
        items: [
          { label: "Invoices", href: "/workspace/user/invoices", matchPrefixes: ["/workspace/invoices", "/workspace/sales"] },
          { label: "Quotations", href: "/workspace/user/quotations" },
          { label: "Payments", href: "/workspace/user/payments", matchPrefixes: ["/workspace/banking"] },
          { label: "Customers", href: "/workspace/user/customers", matchPrefixes: ["/workspace/contacts"] },
        ],
      },
      {
        label: "Purchases",
        items: [
          { label: "Bills", href: "/workspace/user/bills", matchPrefixes: ["/workspace/bills", "/workspace/purchases"] },
          { label: "Vendors", href: "/workspace/user/vendors" },
          { label: "Purchase Orders", href: "/workspace/user/purchase-orders" },
          { label: "Expenses", href: "/workspace/user/expenses" },
        ],
      },
      {
        label: "Accounting",
        items: [
          { label: "Dashboard", href: "/workspace/user" },
          { label: "Journal Entries", href: "/workspace/user/journal-entries", matchPrefixes: ["/workspace/accounting"] },
          { label: "Chart of Accounts", href: "/workspace/user/chart-of-accounts", matchPrefixes: ["/workspace/accounting/books"] },
          { label: "VAT", href: "/workspace/user/vat", matchPrefixes: ["/workspace/vat"] },
          { label: "Reports", href: "/workspace/user/reports", matchPrefixes: ["/workspace/reports"] },
        ],
      },
      {
        label: "Products / Inventory",
        items: [
          { label: "Products & Services", href: "/workspace/user/products" },
          { label: "Units & Pricing", href: "/workspace/user/units-pricing" },
        ],
      },
      {
        label: "Operations",
        items: [
          { label: "Branches", href: "/workspace/user/branches" },
          { label: "Projects", href: "/workspace/user/projects" },
          { label: "Cost Centers", href: "/workspace/user/cost-centers", matchPrefixes: ["/workspace/purchases/cost-centers"] },
          { label: "Bank Accounts", href: "/workspace/user/bank-accounts" },
          { label: "Fixed Assets", href: "/workspace/user/fixed-assets" },
        ],
      },
      {
        label: "Support / Settings",
        items: [
          { label: "Help", href: "/workspace/user/help", matchPrefixes: ["/workspace/help"] },
          { label: "Integrations", href: "/workspace/user/integrations" },
          { label: "Document Templates", href: "/workspace/user/document-templates", matchPrefixes: ["/workspace/settings/templates"] },
          { label: "Company Settings", href: "/workspace/user/company-settings", matchPrefixes: ["/workspace/settings"] },
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
      { label: "Trial-ready", value: "Conversion candidates", detail: "Move qualified leads directly into the Gulf Hisab signup flow." },
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

  return {
    role,
    title: item.label,
    description: `${item.label} is part of the ${roleLabel.toLowerCase()} workflow and gives this role a direct place to review work, move the next action forward, and avoid dead-end navigation.`,
    metrics: [
      { label: "Current workload", value: item.label, detail: `Use ${item.label.toLowerCase()} as a live working surface instead of a placeholder section.` },
      { label: "Pending review", value: "Action required", detail: "Surface items that need attention today before they affect cash flow, support, or conversion." },
      { label: "Linked workflow", value: roleLabel, detail: "Keep this module connected to the rest of the role workspace." },
    ],
    alerts: [
      { title: `${item.label} needs daily review`, detail: "Use this page to keep unresolved work visible and actionable." },
      { title: "Next actions should stay explicit", detail: "Move from the module into the correct document, support, or pipeline flow with one click." },
    ],
    quickActions: workspaceRoles[role].quickActions.slice(0, 3),
    relatedLinks: [
      { title: `${workspaceRoles[role].label} home`, description: "Return to the role dashboard with current state and shortcuts.", href: workspaceRoles[role].homeHref },
      { title: "Help", description: "Open practical help when the workflow needs clarification.", href: "/workspace/help" },
      { title: "Reports", description: "Cross-check the impact of the current work in the reporting area.", href: "/workspace/reports" },
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

export function findWorkspaceModulePage(slug: string[]): WorkspaceModulePageDefinition | null {
  if (!slug.length) {
    return null;
  }

  const [roleSegment, ...rest] = slug;
  if (!workspaceRoleOrder.includes(roleSegment as WorkspaceRoleKey) || !rest.length) {
    return null;
  }

  const role = roleSegment as WorkspaceRoleKey;
  const href = `/workspace/${slug.join("/")}`;
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