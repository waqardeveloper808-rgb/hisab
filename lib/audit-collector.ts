/* ─── Gulf Hisab AI Review Assistant — Route & Codebase Collector ─── */

import type { AuditModule, RouteHealthEntry } from "./audit-types";

// ─── Known Route Registry ───
// Statically derived from the app/ directory structure and role-workspace.ts

export type KnownRoute = {
  route: string;
  module: AuditModule;
  owner: string;
  isPlaceholder: boolean;
  label: string;
};

export const KNOWN_ROUTES: KnownRoute[] = [
  // ─── User Workspace ───
  { route: "/workspace/user", module: "dashboard", owner: "UserWorkspaceHome", isPlaceholder: false, label: "User Home" },
  { route: "/workspace/dashboard", module: "dashboard", owner: "DashboardOverview", isPlaceholder: false, label: "Dashboard" },

  // Sales
  { route: "/workspace/sales", module: "sales", owner: "SalesOverview", isPlaceholder: false, label: "Sales Overview" },
  { route: "/workspace/user/invoices", module: "sales", owner: "InvoiceRegister", isPlaceholder: false, label: "Tax Invoices" },
  { route: "/workspace/user/quotations", module: "sales", owner: "DocumentCenterOverview", isPlaceholder: false, label: "Quotations" },
  { route: "/workspace/user/proforma-invoices", module: "sales", owner: "DocumentCenterOverview", isPlaceholder: false, label: "Proforma Invoices" },
  { route: "/workspace/user/credit-notes", module: "sales", owner: "DocumentCenterOverview", isPlaceholder: false, label: "Credit Notes" },
  { route: "/workspace/user/debit-notes", module: "sales", owner: "DocumentCenterOverview", isPlaceholder: false, label: "Debit Notes" },
  { route: "/workspace/user/customers", module: "sales", owner: "CustomersRegister", isPlaceholder: false, label: "Customers" },
  { route: "/workspace/user/customer-payments", module: "sales", owner: "PaymentsRegister", isPlaceholder: false, label: "Customer Payments" },
  { route: "/workspace/invoices/new", module: "sales", owner: "TransactionForm", isPlaceholder: false, label: "New Invoice" },

  // Purchases
  { route: "/workspace/purchases", module: "purchases", owner: "PurchasesOverview", isPlaceholder: false, label: "Purchases Overview" },
  { route: "/workspace/user/bills", module: "purchases", owner: "DocumentCenterOverview", isPlaceholder: false, label: "Bills" },
  { route: "/workspace/user/expenses", module: "purchases", owner: "ExpensesRegister", isPlaceholder: false, label: "Expenses" },
  { route: "/workspace/user/purchase-orders", module: "purchases", owner: "DocumentCenterOverview", isPlaceholder: false, label: "Purchase Orders" },
  { route: "/workspace/user/vendor-payments", module: "purchases", owner: "SupplierPaymentsRegister", isPlaceholder: false, label: "Supplier Payments" },
  { route: "/workspace/user/vendors", module: "purchases", owner: "VendorsRegister", isPlaceholder: false, label: "Vendors" },
  { route: "/workspace/bills/new", module: "purchases", owner: "TransactionForm", isPlaceholder: false, label: "New Bill" },

  // Inventory
  { route: "/workspace/user/products", module: "inventory", owner: "ProductsServicesRegister", isPlaceholder: false, label: "Products & Services" },
  { route: "/workspace/user/stock", module: "inventory", owner: "StockRegister", isPlaceholder: false, label: "Stock Register" },
  { route: "/workspace/user/inventory-adjustments", module: "inventory", owner: "InventoryAdjustmentsRegister", isPlaceholder: false, label: "Inventory Adjustments" },

  // Accounting
  { route: "/workspace/accounting", module: "accounting", owner: "AccountingOverview", isPlaceholder: false, label: "Accounting Overview" },
  { route: "/workspace/user/chart-of-accounts", module: "accounting", owner: "ChartOfAccountsRegister", isPlaceholder: false, label: "Chart of Accounts" },
  { route: "/workspace/user/journal-entries", module: "accounting", owner: "JournalEntriesRegister", isPlaceholder: false, label: "Journal Entries" },
  { route: "/workspace/user/ledger", module: "accounting", owner: "BooksOverview", isPlaceholder: false, label: "General Ledger" },
  { route: "/workspace/user/opening-balances", module: "accounting", owner: "OpeningBalancesPage", isPlaceholder: false, label: "Opening Balances" },

  // Banking
  { route: "/workspace/banking", module: "banking", owner: "BankingOverview", isPlaceholder: false, label: "Banking Overview" },
  { route: "/workspace/user/banking", module: "banking", owner: "BankAccountsRegister", isPlaceholder: false, label: "Bank Accounts" },
  { route: "/workspace/user/reconciliation", module: "banking", owner: "ReconciliationPage", isPlaceholder: false, label: "Reconciliation" },

  // VAT
  { route: "/workspace/vat", module: "vat", owner: "VatOverview", isPlaceholder: false, label: "VAT Dashboard" },
  { route: "/workspace/user/vat", module: "vat", owner: "VatOverview", isPlaceholder: false, label: "VAT Overview" },

  // Reports
  { route: "/workspace/reports", module: "reports", owner: "ReportsOverview", isPlaceholder: false, label: "Reports" },
  { route: "/workspace/reports/registers", module: "reports", owner: "RegistersOverview", isPlaceholder: false, label: "Registers" },
  { route: "/workspace/user/reports", module: "reports", owner: "ReportsOverview", isPlaceholder: false, label: "Reports" },
  { route: "/workspace/user/reports/trial-balance", module: "reports", owner: "AccountingReportPage", isPlaceholder: false, label: "Trial Balance" },
  { route: "/workspace/user/reports/profit-loss", module: "reports", owner: "AccountingReportPage", isPlaceholder: false, label: "Profit & Loss" },
  { route: "/workspace/user/reports/balance-sheet", module: "reports", owner: "AccountingReportPage", isPlaceholder: false, label: "Balance Sheet" },
  { route: "/workspace/user/reports/cash-flow", module: "reports", owner: "AccountingReportPage", isPlaceholder: false, label: "Cash Flow" },
  { route: "/workspace/user/reports/receivables-aging", module: "reports", owner: "AccountingReportPage", isPlaceholder: false, label: "Receivables Aging" },
  { route: "/workspace/user/reports/payables-aging", module: "reports", owner: "AccountingReportPage", isPlaceholder: false, label: "Payables Aging" },
  { route: "/workspace/user/reports/vat-summary", module: "reports", owner: "AccountingReportPage", isPlaceholder: false, label: "VAT Summary" },

  // Templates
  { route: "/workspace/user/invoice-templates", module: "templates", owner: "DocumentTemplatesRegister", isPlaceholder: false, label: "Invoice Templates" },
  { route: "/workspace/user/document-templates", module: "templates", owner: "DocumentTemplatesRegister", isPlaceholder: false, label: "All Templates" },
  { route: "/workspace/settings/templates", module: "templates", owner: "DocumentTemplatesRegister", isPlaceholder: false, label: "Template Settings" },
  { route: "/workspace/user/quotation-templates", module: "templates", owner: "DocumentTemplatesRegister", isPlaceholder: false, label: "Quotation Templates" },
  { route: "/workspace/user/proforma-templates", module: "templates", owner: "DocumentTemplatesRegister", isPlaceholder: false, label: "Proforma Templates" },
  { route: "/workspace/user/credit-note-templates", module: "templates", owner: "DocumentTemplatesRegister", isPlaceholder: false, label: "Credit Note Templates" },
  { route: "/workspace/user/debit-note-templates", module: "templates", owner: "DocumentTemplatesRegister", isPlaceholder: false, label: "Debit Note Templates" },
  { route: "/workspace/user/purchase-templates", module: "templates", owner: "DocumentTemplatesRegister", isPlaceholder: false, label: "Purchase Templates" },

  // Contacts
  { route: "/workspace/contacts", module: "contacts", owner: "ContactsOverview", isPlaceholder: false, label: "Contacts" },

  // Settings
  { route: "/workspace/settings", module: "settings", owner: "SettingsOverview", isPlaceholder: false, label: "Settings" },
  { route: "/workspace/settings/users", module: "settings", owner: "CompanyUsersOverview", isPlaceholder: false, label: "Users" },
  { route: "/workspace/settings/company", module: "settings", owner: "SettingsOverview", isPlaceholder: false, label: "Company Profile" },
  { route: "/workspace/settings/accounting", module: "settings", owner: "SettingsOverview", isPlaceholder: false, label: "Accounting Settings" },

  // Payments
  { route: "/workspace/user/payments", module: "sales", owner: "PaymentsRegister", isPlaceholder: false, label: "Payments" },

  // Admin Workspace
  { route: "/workspace/admin", module: "admin", owner: "AdminWorkspaceHome", isPlaceholder: false, label: "Admin Home" },
  { route: "/workspace/admin/customers", module: "admin", owner: "PlatformCustomersOverview", isPlaceholder: false, label: "Platform Customers" },
  { route: "/workspace/admin/plans", module: "admin", owner: "PlansOverview", isPlaceholder: false, label: "Plans" },
  { route: "/workspace/admin/support-accounts", module: "admin", owner: "SupportAccountsOverview", isPlaceholder: false, label: "Support Accounts" },
  { route: "/workspace/admin/audit", module: "admin", owner: "SystemAuditDashboard", isPlaceholder: false, label: "System Audit" },
  { route: "/workspace/admin/agents", module: "admin", owner: "PlatformAgentsOverview", isPlaceholder: false, label: "Platform Agents" },
  { route: "/workspace/admin/system-health", module: "admin", owner: "catch-all", isPlaceholder: true, label: "System Health" },
  { route: "/workspace/admin/integrations", module: "admin", owner: "catch-all", isPlaceholder: true, label: "Integrations" },
  { route: "/workspace/admin/access-management", module: "admin", owner: "catch-all", isPlaceholder: true, label: "Access Management" },
  { route: "/workspace/admin/company-reviews", module: "admin", owner: "catch-all", isPlaceholder: true, label: "Company Reviews" },
  { route: "/workspace/admin/document-templates", module: "admin", owner: "catch-all", isPlaceholder: true, label: "Admin Templates" },
  { route: "/workspace/admin/review", module: "ai_review", owner: "ReviewDashboard", isPlaceholder: false, label: "AI Review Dashboard" },

  // Assistant Workspace
  { route: "/workspace/assistant", module: "assistant", owner: "AssistantWorkspaceHome", isPlaceholder: false, label: "Assistant Home" },
  { route: "/workspace/assistant/help-queue", module: "assistant", owner: "catch-all", isPlaceholder: true, label: "Help Queue" },
  { route: "/workspace/assistant/customer-follow-up", module: "assistant", owner: "catch-all", isPlaceholder: true, label: "Customer Follow-up" },
  { route: "/workspace/assistant/ai-help", module: "assistant", owner: "catch-all", isPlaceholder: true, label: "AI Help" },
  { route: "/workspace/assistant/invoice-help", module: "assistant", owner: "catch-all", isPlaceholder: true, label: "Invoice Help" },
  { route: "/workspace/assistant/onboarding", module: "assistant", owner: "catch-all", isPlaceholder: true, label: "Onboarding" },
  { route: "/workspace/assistant/pending-tasks", module: "assistant", owner: "catch-all", isPlaceholder: true, label: "Pending Tasks" },
  { route: "/workspace/assistant/help-center", module: "assistant", owner: "catch-all", isPlaceholder: true, label: "Help Center" },
  { route: "/workspace/assistant/customer-accounts", module: "assistant", owner: "catch-all", isPlaceholder: true, label: "Customer Accounts" },

  // Agent Workspace
  { route: "/workspace/agent", module: "agent", owner: "AgentWorkspaceHome", isPlaceholder: false, label: "Agent Home" },
  { route: "/workspace/agent/leads", module: "agent", owner: "catch-all", isPlaceholder: true, label: "Leads" },
  { route: "/workspace/agent/referrals", module: "agent", owner: "catch-all", isPlaceholder: true, label: "Referrals" },
  { route: "/workspace/agent/assigned-accounts", module: "agent", owner: "catch-all", isPlaceholder: true, label: "Assigned Accounts" },
  { route: "/workspace/agent/pipeline", module: "agent", owner: "catch-all", isPlaceholder: true, label: "Pipeline" },
  { route: "/workspace/agent/follow-ups", module: "agent", owner: "catch-all", isPlaceholder: true, label: "Follow-ups" },
  { route: "/workspace/agent/pending-outreach", module: "agent", owner: "catch-all", isPlaceholder: true, label: "Pending Outreach" },
  { route: "/workspace/agent/activity", module: "agent", owner: "catch-all", isPlaceholder: true, label: "Activity Log" },

  // Help
  { route: "/workspace/help", module: "settings", owner: "HelpPage", isPlaceholder: false, label: "Help" },
  { route: "/workspace/help/faq", module: "settings", owner: "HelpFaqPage", isPlaceholder: false, label: "FAQ" },
  { route: "/workspace/help/ai", module: "settings", owner: "HelpAssistant", isPlaceholder: false, label: "AI Help" },

  // Admin sub-pages
  { route: "/workspace/user/branches", module: "settings", owner: "BranchesRegister", isPlaceholder: false, label: "Branches" },
  { route: "/workspace/user/cost-centers", module: "settings", owner: "CostCentersOverview", isPlaceholder: false, label: "Cost Centers" },
  { route: "/workspace/user/projects", module: "settings", owner: "ProjectsRegister", isPlaceholder: false, label: "Projects" },
];

// ─── Derive Route Health from Known Routes ───
export function buildRouteHealthFromRegistry(openFindings: Map<string, number>): RouteHealthEntry[] {
  return KNOWN_ROUTES.map((r) => ({
    route: r.route,
    module: r.module,
    owner: r.owner,
    status: r.isPlaceholder ? "placeholder" : "healthy",
    isReachable: true,
    isPlaceholder: r.isPlaceholder,
    isDataBacked: !r.isPlaceholder,
    hasRuntimeErrors: false,
    openFindings: openFindings.get(r.route) ?? 0,
  }));
}

// ─── Module summary ───
export function buildModuleHealthFromRoutes(routes: RouteHealthEntry[], findings: { module: AuditModule; severity: string; category: string }[]): import("./audit-types").ModuleHealthEntry[] {
  const modules: AuditModule[] = ["dashboard", "sales", "purchases", "inventory", "accounting", "banking", "vat", "reports", "contacts", "templates", "settings", "admin", "assistant", "agent", "ai_review"];
  const labels: Record<string, string> = {
    dashboard: "Dashboard", sales: "Sales", purchases: "Purchases", inventory: "Inventory",
    accounting: "Accounting", banking: "Banking", vat: "VAT / Compliance", reports: "Reports",
    contacts: "Contacts", templates: "Templates", settings: "Settings", admin: "Admin",
    assistant: "Assistant", agent: "Agent", ai_review: "AI Review",
  };

  return modules.map((mod) => {
    const modRoutes = routes.filter((r) => r.module === mod);
    const modFindings = findings.filter((f) => f.module === mod);
    const placeholders = modRoutes.filter((r) => r.isPlaceholder).length;
    const broken = modRoutes.filter((r) => r.status === "broken").length;
    const total = modRoutes.length;
    const realCount = total - placeholders - broken;
    const implStatus = total === 0 ? "missing" : placeholders === total ? "placeholder" : realCount < total ? "partial" : "real";

    return {
      module: mod,
      label: labels[mod] ?? mod,
      implementationStatus: implStatus as "real" | "partial" | "placeholder" | "missing",
      openFindings: modFindings.length,
      criticalFindings: modFindings.filter((f) => f.severity === "critical").length,
      placeholderCount: placeholders,
      brokenRouteCount: broken,
      weakLayoutCount: modFindings.filter((f) => f.category === "layout_density").length,
      logicFlawCount: modFindings.filter((f) => ["accounting_logic", "inventory_logic", "document_engine"].includes(f.category)).length,
      score: Math.max(0, 100 - modFindings.reduce((s, f) => s + (f.severity === "critical" ? 20 : f.severity === "major" ? 12 : 6), 0)),
    };
  });
}

// ─── Route lookup helpers ───
export function getRouteModule(route: string): AuditModule {
  const known = KNOWN_ROUTES.find((r) => r.route === route);
  if (known) return known.module;
  if (route.includes("/sales") || route.includes("/invoices") || route.includes("/quotation") || route.includes("/credit-note") || route.includes("/debit-note") || route.includes("/customer")) return "sales";
  if (route.includes("/purchase") || route.includes("/bill") || route.includes("/expense") || route.includes("/vendor")) return "purchases";
  if (route.includes("/product") || route.includes("/stock") || route.includes("/inventory")) return "inventory";
  if (route.includes("/accounting") || route.includes("/journal") || route.includes("/ledger") || route.includes("/chart-of-accounts") || route.includes("/opening-balance")) return "accounting";
  if (route.includes("/banking") || route.includes("/reconciliation")) return "banking";
  if (route.includes("/vat")) return "vat";
  if (route.includes("/report")) return "reports";
  if (route.includes("/template")) return "templates";
  if (route.includes("/setting")) return "settings";
  if (route.includes("/admin")) return "admin";
  if (route.includes("/assistant")) return "assistant";
  if (route.includes("/agent")) return "agent";
  return "dashboard";
}
