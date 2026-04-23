/* ─── Gulf Hisab AI Review Assistant — Core Types ─── */

// ─── Severity & Status ───
export type FindingSeverity = "critical" | "major" | "medium" | "minor";
export type FindingStatus = "new" | "confirmed" | "in_progress" | "resolved" | "regression" | "ignored";
export type FindingCategory =
  | "layout_density"
  | "workflow_behavior"
  | "shell_navigation"
  | "form_quality"
  | "accounting_logic"
  | "document_engine"
  | "inventory_logic"
  | "product_maturity"
  | "compliance"
  | "prompt_quality"
  | "wrong_action_contamination"
  | "branding"
  | "runtime_error";

export type AuditModule =
  | "dashboard"
  | "sales"
  | "purchases"
  | "inventory"
  | "accounting"
  | "banking"
  | "vat"
  | "reports"
  | "contacts"
  | "templates"
  | "settings"
  | "admin"
  | "assistant"
  | "agent"
  | "shell"
  | "public"
  | "ai_review";

// ─── Evidence ───
export type EvidenceType = "screenshot" | "dom_snapshot" | "console_log" | "network_log" | "pdf_capture" | "code_snippet" | "note";

export type EvidenceItem = {
  id: string;
  type: EvidenceType;
  label: string;
  content: string; // base64 for images, text for logs, path for files
  capturedAt: string;
  findingId?: string;
};

// ─── Finding ───
export type AuditFinding = {
  id: string;
  title: string;
  module: AuditModule;
  route: string;
  category: FindingCategory;
  severity: FindingSeverity;
  status: FindingStatus;
  description: string;
  rootCause: string;
  evidence: string[]; // evidence IDs
  suggestedFixes: string[];
  generatedPrompt: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  auditRunId?: string;
};

// ─── Route Health ───
export type RouteHealthStatus = "healthy" | "placeholder" | "broken" | "partial" | "unaudited";

export type RouteHealthEntry = {
  route: string;
  module: AuditModule;
  owner: string; // component name
  status: RouteHealthStatus;
  isReachable: boolean;
  isPlaceholder: boolean;
  isDataBacked: boolean;
  hasRuntimeErrors: boolean;
  lastAuditedAt?: string;
  openFindings: number;
};

// ─── Module Health ───
export type ModuleHealthEntry = {
  module: AuditModule;
  label: string;
  implementationStatus: "real" | "partial" | "placeholder" | "missing";
  openFindings: number;
  criticalFindings: number;
  placeholderCount: number;
  brokenRouteCount: number;
  weakLayoutCount: number;
  logicFlawCount: number;
  score: number; // 0-100
};

// ─── Audit Run ───
export type AuditRunStatus = "running" | "completed" | "failed" | "partial";

export type AuditRun = {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: AuditRunStatus;
  scope: "full" | "module" | "route";
  scopeTarget?: string;
  findingsCreated: number;
  findingsResolved: number;
  regressions: number;
  routesAudited: number;
  screenshotsCaptured: number;
};

// ─── Audit Overview KPIs ───
export type AuditOverviewKpis = {
  totalOpenFindings: number;
  criticalFindings: number;
  majorFindings: number;
  regressions: number;
  placeholderPages: number;
  brokenRoutes: number;
  documentEngineIssues: number;
  accountingEngineIssues: number;
  inventoryIssues: number;
  lastFullAuditAt?: string;
  lastRuntimeAuditAt?: string;
};

// ─── Prompt Generation ───
export type PromptMode = "copilot" | "claude" | "internal_task" | "regression_retest";

export type GeneratedPrompt = {
  id: string;
  findingId?: string;
  module?: AuditModule;
  mode: PromptMode;
  title: string;
  prompt: string;
  acceptanceCriteria: string[];
  validationChecklist: string[];
  createdAt: string;
};

// ─── Model Adapter ───
export type ModelProvider = "gpt" | "claude" | "gemini" | "local";

export type ModelRequest = {
  provider: ModelProvider;
  operation: "generateAudit" | "summarizeFindings" | "generatePrompt" | "compareScreens" | "analyzeModule";
  context: Record<string, unknown>;
};

export type ModelResponse = {
  provider: ModelProvider;
  operation: string;
  result: unknown;
  tokensUsed?: number;
  timestamp: string;
};

// ─── Audit Rule ───
export type AuditRule = {
  id: string;
  category: FindingCategory;
  name: string;
  description: string;
  check: (context: AuditRuleContext) => AuditRuleResult[];
};

export type AuditRuleContext = {
  route: string;
  module: AuditModule;
  componentSource?: string;
  domSnapshot?: string;
  consoleErrors?: string[];
  networkFailures?: Array<{ url: string; status: number; method: string }>;
  existingFindings?: AuditFinding[];
};

export type AuditRuleResult = {
  title: string;
  severity: FindingSeverity;
  category: FindingCategory;
  description: string;
  rootCause: string;
  suggestedFixes: string[];
  evidence: string[];
  confidence: number; // 0-1
};

// ─── Density Audit ───
export type DensityScore = {
  route: string;
  score: number; // 0-100
  wastedRegions: string[];
  elementsToShrink: string[];
  recommendedChanges: string[];
};

// ─── Document Engine Audit ───
export type DocumentTypeAudit = {
  documentType: string;
  registerMode: "correct" | "violation";
  previewMode: "correct" | "violation";
  filterBehavior: "correct" | "violation";
  actionBar: "present" | "missing" | "incomplete";
  previewPdfParity: "match" | "mismatch" | "untested";
  issues: string[];
  screenshots: string[];
};

// ─── Accounting Engine Audit ───
export type AccountingAudit = {
  coaCompleteness: number; // 0-100
  journalPostingRules: "complete" | "partial" | "missing";
  trialBalanceLinkage: boolean;
  profitLossLinkage: boolean;
  balanceSheetLinkage: boolean;
  cashFlowReadiness: boolean;
  reconciliationReadiness: boolean;
  attachmentSupport: boolean;
  inventoryAccountLinkage: boolean;
  issues: string[];
};

// ─── Store (localStorage shape) ───
export type AuditStore = {
  findings: AuditFinding[];
  evidence: EvidenceItem[];
  routes: RouteHealthEntry[];
  modules: ModuleHealthEntry[];
  runs: AuditRun[];
  prompts: GeneratedPrompt[];
  lastUpdated: string;
};

export const AUDIT_STORE_KEY = "gulf-hisab-audit-store";

export const SEVERITY_WEIGHT: Record<FindingSeverity, number> = {
  critical: 20,
  major: 12,
  medium: 6,
  minor: 3,
};

export const CATEGORY_LABELS: Record<FindingCategory, string> = {
  layout_density: "Layout Density",
  workflow_behavior: "Workflow Behavior",
  shell_navigation: "Shell / Navigation",
  form_quality: "Form Quality",
  accounting_logic: "Accounting Logic",
  document_engine: "Document Engine",
  inventory_logic: "Inventory Logic",
  product_maturity: "Product Maturity",
  compliance: "Compliance",
  prompt_quality: "Prompt Quality",
  wrong_action_contamination: "Wrong Action Contamination",
  branding: "Branding",
  runtime_error: "Runtime Error",
};

export const MODULE_LABELS: Record<AuditModule, string> = {
  dashboard: "Dashboard",
  sales: "Sales",
  purchases: "Purchases",
  inventory: "Inventory",
  accounting: "Accounting",
  banking: "Banking",
  vat: "VAT / Compliance",
  reports: "Reports",
  contacts: "Contacts",
  templates: "Templates",
  settings: "Settings",
  admin: "Admin",
  assistant: "Assistant",
  agent: "Agent",
  shell: "Shell / Navigation",
  public: "Public Website",
  ai_review: "AI Review",
};
