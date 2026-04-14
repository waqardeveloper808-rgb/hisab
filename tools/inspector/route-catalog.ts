import { existsSync } from "node:fs";
import path from "node:path";

export type RouteVerdict = "PASS" | "FAIL" | "AUTH_LIMITED" | "PLACEHOLDER" | "EMPTY_VALID";
export type ZatcaStatus = "VALID" | "INVALID" | "NOT_AVAILABLE";
export type ConfidenceLevel = "low" | "medium" | "high";

export type NetworkCall = {
  method: string;
  status: number;
  url: string;
  resourceType: string;
};

export type NetworkFailure = NetworkCall & {
  reason?: string;
};

export type WhyAnalysis = {
  symptom: string;
  evidence: string[];
  why1?: string;
  why2?: string;
  why3?: string;
  why4?: string;
  why5?: string;
  root_cause: string;
  confidence_level: ConfidenceLevel;
  confirmed: string[];
  likely: string[];
  possible: string[];
  recommended_fix: string;
};

export type FiveWhysReport = {
  analyses: WhyAnalysis[];
};

export type ZatcaComparison = {
  field: string;
  qrValue: string;
  pageValue: string;
  matches: boolean;
};

export type ZatcaDetails = {
  source_route?: string;
  qr_selector?: string;
  qr_screenshot_path?: string;
  qr_base64?: string;
  decoded_payload?: string;
  extracted_fields?: Record<string, string>;
  comparisons?: ZatcaComparison[];
  issues?: string[];
};

export type RouteReport = {
  route: string;
  verdict: RouteVerdict;
  table_found: boolean;
  row_count: number;
  filters_found: boolean;
  actions_found: string[];
  filler_text_found: boolean;
  network_failures: NetworkFailure[];
  ui_findings: string[];
  logic_findings: string[];
  visual_findings: string[];
  architecture_findings: string[];
  zatca_check: ZatcaStatus;
  five_whys: FiveWhysReport;
  root_cause_summary: string;
  recommended_fixes: string[];
  screenshot_path: string;
  api_calls: NetworkCall[];
  evidence: string[];
  zatca_details?: ZatcaDetails;
};

export type InspectRouteConfig = {
  key: string;
  path: string;
  directPageFile: string;
  expectedRegister: boolean;
  expectedWorkflow?: boolean;
  requiredWorkflowMarkers?: string[];
  supportsZatca: boolean;
  createActionLabels: string[];
  requiredCreateHrefIncludes?: string[];
  placeholderMarkers: string[];
};

export type RouteCodeSignals = {
  directPageExists: boolean;
  catchAllExists: boolean;
  usesCatchAll: boolean;
};

export const inspectedRoutes: InspectRouteConfig[] = [
  {
    key: "workspace-invoices-new",
    path: "/workspace/invoices/new",
    directPageFile: "app/workspace/invoices/new/page.tsx",
    expectedRegister: false,
    expectedWorkflow: true,
    requiredWorkflowMarkers: ["contact", "items", "document", "payment", "line-editor"],
    supportsZatca: false,
    createActionLabels: ["Save draft", "Issue document"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Current workload"],
  },
  {
    key: "workspace-user-invoices",
    path: "/workspace/user/invoices",
    directPageFile: "app/workspace/user/invoices/page.tsx",
    expectedRegister: true,
    supportsZatca: true,
    createActionLabels: ["Create Invoice"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-customers",
    path: "/workspace/user/customers",
    directPageFile: "app/workspace/user/customers/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: ["Add Customer", "Create Customer"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-payments",
    path: "/workspace/user/payments",
    directPageFile: "app/workspace/user/payments/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: ["Record Payment", "Create Payment"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-vendors",
    path: "/workspace/user/vendors",
    directPageFile: "app/workspace/user/vendors/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: ["Add Vendor", "Create Vendor"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-document-templates",
    path: "/workspace/user/document-templates",
    directPageFile: "app/workspace/user/document-templates/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: ["Create Template", "Add Template", "Save"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-chart-of-accounts",
    path: "/workspace/user/chart-of-accounts",
    directPageFile: "app/workspace/user/chart-of-accounts/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: ["Create Account", "Add Account"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-bills",
    path: "/workspace/user/bills",
    directPageFile: "app/workspace/user/bills/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: ["Create Bill"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-quotations",
    path: "/workspace/user/quotations",
    directPageFile: "app/workspace/user/quotations/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: ["Create Quotation"],
    requiredCreateHrefIncludes: ["documentType=quotation"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-proforma-invoices",
    path: "/workspace/user/proforma-invoices",
    directPageFile: "app/workspace/user/proforma-invoices/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: ["Create Proforma"],
    requiredCreateHrefIncludes: ["documentType=proforma_invoice"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-purchase-orders",
    path: "/workspace/user/purchase-orders",
    directPageFile: "app/workspace/user/purchase-orders/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: ["Create Purchase Order"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-expenses",
    path: "/workspace/user/expenses",
    directPageFile: "app/workspace/user/expenses/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: ["Capture Expense"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-products",
    path: "/workspace/user/products",
    directPageFile: "app/workspace/user/products/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: ["Add Product", "Create Item"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-branches",
    path: "/workspace/user/branches",
    directPageFile: "app/workspace/user/branches/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: ["Add Branch"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-projects",
    path: "/workspace/user/projects",
    directPageFile: "app/workspace/user/projects/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: ["Add Project"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-cost-centers",
    path: "/workspace/user/cost-centers",
    directPageFile: "app/workspace/user/cost-centers/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: ["Add Cost Center", "Create Cost Center"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-journal-entries",
    path: "/workspace/user/journal-entries",
    directPageFile: "app/workspace/user/journal-entries/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: ["New Journal Entry"],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-reports",
    path: "/workspace/user/reports",
    directPageFile: "app/workspace/user/reports/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: [],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
  {
    key: "workspace-user-vat",
    path: "/workspace/user/vat",
    directPageFile: "app/workspace/user/vat/page.tsx",
    expectedRegister: true,
    supportsZatca: false,
    createActionLabels: [],
    placeholderMarkers: ["Alerts and pending work", "Related workflow links", "Return to User Workspace"],
  },
];

export function getRouteCodeSignals(workspaceRoot: string, route: InspectRouteConfig): RouteCodeSignals {
  const directPageExists = existsSync(path.join(workspaceRoot, route.directPageFile));
  const catchAllExists = existsSync(path.join(workspaceRoot, "app/workspace/[...slug]/page.tsx"));

  return {
    directPageExists,
    catchAllExists,
    usesCatchAll: !directPageExists && catchAllExists,
  };
}

export function slugifyRoute(routePath: string) {
  return routePath.replace(/^\//, "").replace(/[\/]+/g, "-");
}