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
  supportsZatca: boolean;
  createActionLabels: string[];
  placeholderMarkers: string[];
};

export type RouteCodeSignals = {
  directPageExists: boolean;
  catchAllExists: boolean;
  usesCatchAll: boolean;
};

export const inspectedRoutes: InspectRouteConfig[] = [
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