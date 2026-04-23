import fs from "node:fs";
import path from "node:path";
import type { MasterDesignCountryScope, MasterDesignModuleId } from "@/types/master-design";
import type {
  ActualModuleRecord,
  ActualSubsystemRecord,
  ActualSystemMap,
  BackendLinkageStrength,
  BlockerSeverity,
  ConfidenceLevel,
  ContaminationSeverity,
  ModuleExecutionStatus,
  ModuleFileRecord,
  ModuleFileRole,
  ProofStatus,
  RuntimeSignalStatus,
  RuntimeVerificationSignal,
  SystemBlocker,
} from "@/types/system-map";

type ScannedFile = {
  path: string;
  absolutePath: string;
  content: string;
  imports: string[];
  role: ModuleFileRole;
  isPreview: boolean;
  isProof: boolean;
  isPlaceholder: boolean;
  isFallback: boolean;
  isFranceSpecific: boolean;
  isKsaSpecific: boolean;
};

type ModuleScanRule = {
  id: MasterDesignModuleId;
  name: string;
  description: string;
  countryScope: MasterDesignCountryScope;
  filePatterns: RegExp[];
  routePatterns?: RegExp[];
  backendKeywords?: string[];
  backendExpectation?: "required" | "optional" | "controller-or-service";
  backendRoutePatterns?: RegExp[];
  controllerPatterns?: RegExp[];
  servicePatterns?: RegExp[];
  proofPatterns?: RegExp[];
  dependencySignals?: Partial<Record<MasterDesignModuleId, RegExp[]>>;
};

type ControllerMetadata = {
  name: string;
  path: string;
  methods: string[];
  servicePaths: string[];
};

type BackendRouteDefinition = {
  method: string;
  path: string;
  controllerName: string;
  action: string;
  controllerPath: string | null;
  servicePaths: string[];
};

type ModuleContext = {
  rule: ModuleScanRule;
  files: ScannedFile[];
  routes: string[];
  proofFiles: ScannedFile[];
  dependencyHits: MasterDesignModuleId[];
  blockers: SystemBlocker[];
  fakeCompleteFlags: string[];
  whatWorks: string[];
  whatIsBroken: string[];
  whatIsMissing: string[];
  implementedFeatures: string[];
  implementedLinkages: MasterDesignModuleId[];
  proofStatus: ProofStatus;
  proofSummary: string;
  runtimeVerificationStatus: RuntimeSignalStatus;
  runtimeVerificationSummary: string;
  runtimeSignals: RuntimeVerificationSignal[];
  structuralStatus: ModuleExecutionStatus;
  runtimeStatus: ModuleExecutionStatus;
  backendLinkageStrength: BackendLinkageStrength;
  backendSummary: string;
  controllerPaths: string[];
  servicePaths: string[];
  backendRoutes: string[];
  contaminationSeverity: ContaminationSeverity;
  contaminationSummary: string;
  contaminationFiles: string[];
  summary: string;
  completionPercentage: number;
  status: ModuleExecutionStatus;
  subsystemIds: string[];
  nextStepRecommendation: string;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number;
  confidenceSummary: string;
};

const ROOT = process.cwd();
const SCAN_PATHS = [
  "app",
  "components/workspace",
  "components/workflow",
  "backend/app/Http/Controllers/Api",
  "backend/app/Services",
  "backend/routes/api.php",
  "lib",
  "data/master-design",
  "tools/capture-document-validation.mjs",
  "tools/capture-sales-workflow-evidence.mjs",
  "tools/prove-accounting-ui-workflow.mjs",
  "tools/ui-api-proof.json",
  "tools/phase1-live-proof.json",
  "docs/master-design.md",
  "docs/master-design-vnext.md",
  "docs/prompt-engine-v4.md",
];
const FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".php", ".json"]);
const RUNTIME_LOGS = [
  "artifacts/phase1_freeze_baseline_20260419_02_recovery/logs/document-validation.log",
  "artifacts/phase1_freeze_baseline_20260419_02_recovery/logs/sales-workflow-capture.log",
  "artifacts/phase1_freeze_baseline_20260419_02_recovery/logs/prove-accounting-ui-workflow-rerun.log",
  "artifacts/phase1_freeze_baseline_20260419_02_recovery/logs/prove-accounting-ui-workflow.log",
];

const MODULE_RULES: ModuleScanRule[] = [
  {
    id: "identity-workspace",
    name: "Identity & Workspace",
    description: "Workspace layout, auth gate, access state, and route ownership.",
    countryScope: "shared-platform",
    filePatterns: [/app\/workspace\/layout\.tsx$/, /components\/workspace\/WorkspaceShell\.tsx$/, /lib\/(auth-session|access-control|server-access|workspace-path|subscription-access)\.ts$/],
    routePatterns: [/^\/workspace$/, /^\/workspace\/user$/, /^\/workspace\/admin$/, /^\/workspace\/assistant$/, /^\/workspace\/agent$/],
    backendKeywords: ["workspace", "auth", "login", "register"],
    backendExpectation: "controller-or-service",
    backendRoutePatterns: [/\/auth\//],
    controllerPatterns: [/AuthController/, /AccessProfileController/],
    dependencySignals: {
      "ui-ux-shell": [/WorkspaceShell/],
    },
  },
  {
    id: "company-profile",
    name: "Company Profile Master System",
    description: "Company identity, seller legal data, and rendered business profile ownership.",
    countryScope: "ksa",
    filePatterns: [/components\/workspace\/SettingsOverview\.tsx$/, /components\/workflow\/TransactionForm\.tsx$/, /lib\/workspace-api\.ts$/],
    routePatterns: [/\/settings\/company/, /\/company/],
    backendKeywords: ["company", "settings", "seller"],
    backendRoutePatterns: [/\/companies$/, /\/companies\/\{company\}\/settings/],
    controllerPatterns: [/CompanySetupController/, /SettingsController/],
    servicePatterns: [/CompanyProvisioningService/],
    dependencySignals: {
      "document-engine": [/TransactionForm/, /workspace-preview/],
      "tax-vat-engine": [/vat/i, /seller_vat_number/],
      "compliance-layer": [/zatca/i, /compliance/i],
    },
  },
  {
    id: "contacts-counterparties",
    name: "Contacts & Counterparties",
    description: "Customer and vendor registers with import and downstream document linkage.",
    countryScope: "ksa",
    filePatterns: [/CustomersRegister\.tsx$/, /VendorsRegister\.tsx$/, /ContactsOverview\.tsx$/, /lib\/directory-import\.ts$/],
    routePatterns: [/\/customers/, /\/vendors/, /\/contacts/],
    backendKeywords: ["contact", "customer", "vendor", "supplier"],
    backendRoutePatterns: [/\/companies\/\{company\}\/contacts/],
    controllerPatterns: [/ContactController/],
    servicePatterns: [/PlanLimitService/],
    proofPatterns: [/QuickCreateContactForm/],
    dependencySignals: {
      "document-engine": [/workspace-api/, /TransactionForm/],
      "tax-vat-engine": [/vat/i],
      "reports-engine": [/report/i],
    },
  },
  {
    id: "product-item-service",
    name: "Product / Item / Service System",
    description: "Item register, catalog persistence, and tax/account classification linkage.",
    countryScope: "shared-platform",
    filePatterns: [/ProductsServicesRegister\.tsx$/, /QuickCreateItemForm\.tsx$/, /LineItemsEditor\.tsx$/, /components\/workflow\/WorkspaceDataProvider\.tsx$/, /lib\/workspace-api\.ts$/],
    routePatterns: [/\/products/, /\/items/, /\/services/],
    backendKeywords: ["item", "product", "inventory"],
    backendRoutePatterns: [/\/companies\/\{company\}\/(items|products|services)/, /\/companies\/\{company\}\/products\/search/, /\/companies\/\{company\}\/products\/stock/],
    controllerPatterns: [/ItemController/, /ProductController/, /ServiceController/],
    proofPatterns: [/QuickCreateItemForm/, /LineItemsEditor/],
    dependencySignals: {
      "document-engine": [/LineItemsEditor/, /TransactionForm/],
      "inventory-engine": [/inventory/i, /stock/i],
      "accounting-engine": [/ledger_account/i, /accounting/i],
    },
  },
  {
    id: "document-engine",
    name: "Document Engine",
    description: "Operational document workflow, detail views, document center, and invoice flows.",
    countryScope: "ksa",
    filePatterns: [/Invoice(Register|DetailWorkspace)\.tsx$/, /DocumentCenterOverview\.tsx$/, /components\/workflow\/TransactionForm\.tsx$/],
    routePatterns: [/\/invoices/, /\/documents/, /\/workspace\/invoices/],
    backendKeywords: ["document", "invoice", "credit", "debit", "payment"],
    backendRoutePatterns: [/\/companies\/\{company\}\/(documents|sales-documents|purchase-documents)/],
    controllerPatterns: [/DocumentCenterController/, /SalesDocumentController/, /PurchaseDocumentController/, /PaymentController/],
    servicePatterns: [/DocumentWorkflowService/, /SalesDocumentService/, /PurchaseDocumentService/, /PaymentService/],
    proofPatterns: [/tools\/capture-document-validation\.mjs$/, /tools\/capture-sales-workflow-evidence\.mjs$/],
    dependencySignals: {
      "template-engine": [/template/i],
      "accounting-engine": [/journal/i, /ledger/i],
      "inventory-engine": [/inventory/i, /stock/i],
      "tax-vat-engine": [/vat/i, /zatca/i],
      "compliance-layer": [/compliance/i, /zatca/i],
    },
  },
  {
    id: "communication-engine",
    name: "Communication Engine",
    description: "Communication persistence, templates, retries, source timelines, and delivery orchestration.",
    countryScope: "shared-platform",
    filePatterns: [/Communication(Register|TimelinePanel|StatusBadge|SendCommunicationDialog)\.tsx$/, /Communication(Service|DispatchService|RetryService|ResolverService|LearningService|TimelineService)\.php$/, /Communication(Controller|TemplateController)\.php$/],
    routePatterns: [/\/communications/, /\/workspace\/communications/],
    backendKeywords: ["communication", "timeline", "retry", "dispatch", "template"],
    backendRoutePatterns: [/\/companies\/\{company\}\/communications/],
    controllerPatterns: [/CommunicationController/, /CommunicationTemplateController/],
    servicePatterns: [/CommunicationService/, /CommunicationDispatchService/, /CommunicationRetryService/, /CommunicationLearningService/],
    dependencySignals: {
      "document-engine": [/DocumentCenterController/, /InvoiceDetailWorkspace/],
      "ui-ux-shell": [/CommunicationRegister/, /SendCommunicationDialog/],
      "workflow-intelligence": [/learning/i, /timeline/i],
    },
  },
  {
    id: "template-engine",
    name: "Template Engine",
    description: "Template authoring, layout editing, and document presentation templates.",
    countryScope: "shared-platform",
    filePatterns: [/TemplatesOverview\.tsx$/, /DocumentTemplatesRegister\.tsx$/, /LayoutEditorPanel\.tsx$/, /layout-engine\.ts$/, /TemplateEngineRuntimeService\.php$/, /DocumentTemplateRendererService\.php$/, /DocumentTemplateController\.php$/],
    routePatterns: [/\/template/, /\/invoice-templates/, /\/document-templates/],
    backendKeywords: ["template"],
    backendRoutePatterns: [/\/companies\/\{company\}\/templates/],
    controllerPatterns: [/DocumentTemplateController/],
    servicePatterns: [/DocumentTemplateRendererService/],
    dependencySignals: {
      "document-engine": [/document/i, /invoice/i],
      "company-profile": [/logo/i, /branding/i],
    },
  },
  {
    id: "accounting-engine",
    name: "Accounting Engine",
    description: "Chart of accounts, journal entries, ledger, reports, and posting logic.",
    countryScope: "shared-platform",
    filePatterns: [/accounting-engine\.ts$/, /ChartOfAccountsRegister\.tsx$/, /JournalEntriesRegister\.tsx$/, /BooksOverview\.tsx$/, /AccountingReportPage\.tsx$/],
    routePatterns: [/\/chart-of-accounts/, /\/journal-entries/, /\/ledger/, /\/books/],
    backendKeywords: ["journal", "ledger", "account", "trial balance", "profit", "balance sheet"],
    backendRoutePatterns: [/\/companies\/\{company\}\/(accounts|journals|reports)\//],
    controllerPatterns: [/ChartOfAccountsController/, /ManualJournalController/, /ReportController/],
    servicePatterns: [/ManualJournalService/, /LedgerService/, /AccountingIntegrityService/],
    proofPatterns: [/tools\/prove-accounting-ui-workflow\.mjs$/, /ui-api-proof\.json$/],
    dependencySignals: {
      "document-engine": [/document/i, /invoice/i],
      "inventory-engine": [/inventory/i, /stock/i],
      "tax-vat-engine": [/vat/i],
      "reports-engine": [/report/i],
    },
  },
  {
    id: "inventory-engine",
    name: "Inventory Engine",
    description: "Stock register, adjustments, inventory sales linkage, and inventory proof.",
    countryScope: "shared-platform",
    filePatterns: [/StockRegister\.tsx$/, /InventoryAdjustmentsRegister\.tsx$/, /DocumentLink(Trigger|PreviewModal)\.tsx$/, /lib\/workspace-api\.ts$/],
    routePatterns: [/\/stock/, /\/inventory-adjustments/],
    backendKeywords: ["inventory", "stock", "adjustment"],
    backendRoutePatterns: [/\/companies\/\{company\}\/inventory\//],
    controllerPatterns: [/InventoryController/],
    servicePatterns: [/InventoryService/],
    proofPatterns: [/tools\/capture-sales-workflow-evidence\.mjs$/],
    dependencySignals: {
      "product-item-service": [/item/i, /product/i],
      "document-engine": [/document/i, /invoice/i],
      "accounting-engine": [/journal/i, /account/i],
    },
  },
  {
    id: "tax-vat-engine",
    name: "Tax / VAT Engine",
    description: "KSA VAT and country-readiness logic with compliance and reporting ties.",
    countryScope: "ksa",
    filePatterns: [/zatca-engine\.ts$/, /country-foundation\.ts$/, /VatOverview\.tsx$/],
    routePatterns: [/\/vat/],
    backendKeywords: ["vat", "tax", "zatca", "compliance"],
    servicePatterns: [/TaxCalculationService/],
    proofPatterns: [/zatca-engine\.test\.ts$/],
    dependencySignals: {
      "contacts-counterparties": [/buyer/i, /seller/i],
      "document-engine": [/document/i, /invoice/i],
      "reports-engine": [/report/i],
      "compliance-layer": [/compliance/i, /submission/i],
    },
  },
  {
    id: "reports-engine",
    name: "Reports Engine",
    description: "Accounting and operational reporting surfaces and analytics.",
    countryScope: "shared-platform",
    filePatterns: [/AccountingReportPage\.tsx$/, /ReportsOverview\.tsx$/, /report-analytics\.ts$/, /ReviewDashboard\.tsx$/],
    routePatterns: [/\/reports/, /trial-balance/, /balance-sheet/, /profit/],
    backendKeywords: ["report", "trial balance", "ledger", "aging"],
    backendRoutePatterns: [/\/companies\/\{company\}\/reports\//],
    controllerPatterns: [/ReportController/],
    proofPatterns: [/report-analytics\.test\.ts$/],
    dependencySignals: {
      "accounting-engine": [/ledger/i, /journal/i],
      "tax-vat-engine": [/vat/i],
      "document-engine": [/document/i, /invoice/i],
    },
  },
  {
    id: "import-engine",
    name: "Import Engine",
    description: "Directory and reconciliation imports plus import/export controls.",
    countryScope: "shared-platform",
    filePatterns: [/directory-import\.ts$/, /reconciliation-import\.ts$/, /ImportExportControls\.tsx$/, /ReconciliationPage\.tsx$/],
    routePatterns: [/\/reconciliation/, /\/workspace\/user\/import/],
    backendKeywords: ["import", "reconciliation"],
    backendRoutePatterns: [/\/companies\/\{company\}\/reconciliation\//],
    controllerPatterns: [/ReconciliationController/],
    proofPatterns: [/directory-import\.test\.ts$/, /reconciliation-import\.test\.ts$/],
    dependencySignals: {
      "contacts-counterparties": [/contact/i],
      "reports-engine": [/report/i],
    },
  },
  {
    id: "workflow-intelligence",
    name: "Workflow / Intelligence Layer",
    description: "Workflow intelligence, command surfaces, and audit suggestion layer.",
    countryScope: "shared-platform",
    filePatterns: [/intelligence-layer\.ts$/, /CommandPalette\.tsx$/, /audit-(collector|runner|rules|store|prompt-generator)\.ts$/],
    routePatterns: [/\/system\/master-design/, /\/agents/, /\/assistant/],
    backendKeywords: ["audit", "agent", "assistant"],
    proofPatterns: [/intelligence-layer\.test\.ts$/],
    dependencySignals: {
      "document-engine": [/document/i],
      "reports-engine": [/report/i],
    },
  },
  {
    id: "compliance-layer",
    name: "Compliance Layer",
    description: "Submission, QR, readiness, and compliance state tracking.",
    countryScope: "ksa",
    filePatterns: [/zatca-engine\.ts$/, /ZatcaQrPanel\.tsx$/],
    routePatterns: [/\/vat/, /\/invoices/],
    backendKeywords: ["compliance", "submission", "zatca", "qr"],
    controllerPatterns: [/DocumentCenterController/, /SalesDocumentController/],
    servicePatterns: [/DocumentWorkflowService/, /SalesDocumentService/, /TaxCalculationService/],
    proofPatterns: [/tools\/capture-document-validation\.mjs$/],
    dependencySignals: {
      "tax-vat-engine": [/vat/i, /zatca/i],
      "document-engine": [/document/i],
    },
  },
  {
    id: "proof-layer",
    name: "Proof Layer",
    description: "Workflow capture scripts and test assets used as operational proof.",
    countryScope: "shared-platform",
    filePatterns: [/tools\/(capture|prove).+\.(mjs|js)$/, /ui-api-proof.*\.json$/, /phase1-live-proof\.json$/],
    proofPatterns: [/tools\/(capture|prove).+\.(mjs|js)$/],
    dependencySignals: {
      "document-engine": [/document/i, /invoice/i],
      "accounting-engine": [/accounting/i, /journal/i],
      "inventory-engine": [/inventory/i, /stock/i],
    },
  },
  {
    id: "ui-ux-shell",
    name: "UI / UX Shell",
    description: "Workspace shell, navigation, and routed workspace presentation layer.",
    countryScope: "shared-platform",
    filePatterns: [/WorkspaceShell\.tsx$/, /WorkspaceModulePage\.tsx$/, /WorkspaceRoleHeader\.tsx$/, /WorkspaceModeNotice\.tsx$/, /app\/workspace\/\[\.\.\.slug\]\/page\.tsx$/],
    routePatterns: [/^\/workspace/, /\/system\/master-design/],
    backendKeywords: ["workspace"],
    backendExpectation: "optional",
    dependencySignals: {
      "identity-workspace": [/auth/i, /workspace/i],
    },
  },
  {
    id: "country-service-architecture",
    name: "Country Service Architecture",
    description: "Country ownership, cross-country readiness, and preview separation boundaries.",
    countryScope: "future-country-slot",
    filePatterns: [/country-foundation\.ts$/, /zatca-engine\.ts$/, /components\/workflow\/TransactionForm\.tsx$/, /lib\/workspace-api\.ts$/],
    backendKeywords: ["country", "zatca", "vat"],
    proofPatterns: [/zatca-engine\.test\.ts$/],
    dependencySignals: {
      "tax-vat-engine": [/vat/i, /zatca/i],
      "compliance-layer": [/compliance/i],
    },
  },
  {
    id: "end-to-end-workflow-proof",
    name: "End-to-End Workflow Proof",
    description: "Joined-up validation across document, inventory, accounting, and payment flows.",
    countryScope: "shared-platform",
    filePatterns: [/tools\/(capture-document-validation|capture-sales-workflow-evidence|prove-accounting-ui-workflow)\.mjs$/, /ui-api-proof.*\.json$/],
    backendKeywords: ["document", "inventory", "payment", "journal"],
    proofPatterns: [/tools\/(capture-document-validation|capture-sales-workflow-evidence|prove-accounting-ui-workflow)\.mjs$/],
    dependencySignals: {
      "document-engine": [/document/i],
      "inventory-engine": [/inventory/i],
      "accounting-engine": [/accounting/i, /journal/i],
      "proof-layer": [/proof/i],
    },
  },
];

function normalizePath(value: string) {
  return value.replace(/\\/g, "/");
}

function readTextFile(filePath: string) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function inferFileRole(relativePath: string): ModuleFileRole {
  if (/tools\//.test(relativePath) || /\.test\./.test(relativePath)) {
    return "proof";
  }
  if (/workspace-preview|preview-/.test(relativePath)) {
    return "preview";
  }
  if (/^app\/api\//.test(relativePath)) {
    return "api";
  }
  if (/^app\//.test(relativePath)) {
    return "route";
  }
  if (/^backend\/app\/Services\//.test(relativePath)) {
    return "service";
  }
  if (/^backend\//.test(relativePath)) {
    return "backend";
  }
  if (/^lib\//.test(relativePath)) {
    return "engine";
  }
  if (/^data\//.test(relativePath)) {
    return "data";
  }
  return "ui";
}

function walkDirectory(dirPath: string, output: ScannedFile[]) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(absolutePath, output);
      continue;
    }

    const extension = path.extname(entry.name);
    if (!FILE_EXTENSIONS.has(extension)) {
      continue;
    }

    const relativePath = normalizePath(path.relative(ROOT, absolutePath));
    const content = readTextFile(absolutePath);
    const imports = Array.from(content.matchAll(/from\s+["']([^"']+)["']/g)).map((match) => match[1]);
    output.push({
      path: relativePath,
      absolutePath,
      content,
      imports,
      role: inferFileRole(relativePath),
      isPreview: /workspace-preview|data-inspector-preview-surface|previewCompany|seededPreview/i.test(content) || /(^|\/)preview-[^/]+/.test(relativePath),
      isProof: /tools\/(capture|prove)|\.test\.|ui-api-proof|phase1-live-proof/i.test(relativePath),
      isPlaceholder: /data-inspector-register="placeholder"|findWorkspaceModulePage\(/i.test(content),
      isFallback: /workspace-preview|previewCompany|seededPreview|seededContacts|seededItems|fallbackContact|fallbackItem/i.test(content) || /(^|\/)preview-[^/]+/.test(relativePath),
      isFranceSpecific: /france|tva|french/i.test(content) || /france/i.test(relativePath),
      isKsaSpecific: /ksa|zatca|sar|vat/i.test(content) || /zatca|ksa/i.test(relativePath),
    });
  }
}

function scanPath(relativePath: string, output: ScannedFile[]) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return;
  }

  const stats = fs.statSync(absolutePath);
  if (stats.isDirectory()) {
    walkDirectory(absolutePath, output);
    return;
  }

  const extension = path.extname(absolutePath);
  if (!FILE_EXTENSIONS.has(extension)) {
    return;
  }

  const normalizedPath = normalizePath(relativePath);
  const content = readTextFile(absolutePath);
  const imports = Array.from(content.matchAll(/from\s+["']([^"']+)["']/g)).map((match) => match[1]);
  output.push({
    path: normalizedPath,
    absolutePath,
    content,
    imports,
    role: inferFileRole(normalizedPath),
    isPreview: /workspace-preview|data-inspector-preview-surface|previewCompany|seededPreview/i.test(content) || /(^|\/)preview-[^/]+/.test(normalizedPath),
    isProof: /tools\/(capture|prove)|\.test\.|ui-api-proof|phase1-live-proof/i.test(normalizedPath),
    isPlaceholder: /data-inspector-register="placeholder"|findWorkspaceModulePage\(/i.test(content),
    isFallback: /workspace-preview|previewCompany|seededPreview|seededContacts|seededItems|fallbackContact|fallbackItem/i.test(content) || /(^|\/)preview-[^/]+/.test(normalizedPath),
    isFranceSpecific: /france|tva|french/i.test(content) || /france/i.test(normalizedPath),
    isKsaSpecific: /ksa|zatca|sar|vat/i.test(content) || /zatca|ksa/i.test(normalizedPath),
  });
}

function readOptionalJson(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  } catch {
    return null;
  }
}

function readTemplateEngineRuntime() {
  const runtime = readOptionalJson(path.join(ROOT, "backend", "storage", "app", "private", "template-engine-runtime.json"));

  return runtime && typeof runtime === "object"
    ? runtime as {
        templatesExist?: boolean;
        linkedDocumentsCount?: number;
        templateRenderCount?: number;
        renderSuccessRate?: number;
        familyDiversityCount?: number;
      }
    : {};
}

function getRecentLogSignal(label: string, relativePath: string, maxAgeHours = 24): RuntimeVerificationSignal {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return {
      id: `log:${relativePath}`,
      label,
      status: "missing",
      summary: "No recent success log was found.",
      evidence: [relativePath],
    };
  }

  const stats = fs.statSync(absolutePath);
  const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
  const content = readTextFile(absolutePath);
  const success = /exit code 0|completed|success|passed|verified/i.test(content);
  const status: RuntimeSignalStatus = success && ageHours <= maxAgeHours ? "verified" : success ? "partial" : "missing";

  return {
    id: `log:${relativePath}`,
    label,
    status,
    summary: success
      ? `Log exists and ${ageHours <= maxAgeHours ? "was updated recently" : "appears stale"}.`
      : "Log exists but does not contain a clear recent success marker.",
    evidence: [relativePath, new Date(stats.mtimeMs).toISOString()],
  };
}

function toRoutePath(routeSegment: string) {
  if (!routeSegment) {
    return "/";
  }

  const parts = routeSegment.split("/").filter(Boolean).map((part) => (part.startsWith("(") ? "" : part)).filter(Boolean);
  return `/${parts.join("/")}`;
}

function buildRoutes(files: ScannedFile[]) {
  return files.flatMap((file) => {
    if (!file.path.startsWith("app/")) {
      return [] as string[];
    }
    if (file.path.endsWith("/page.tsx")) {
      return [toRoutePath(file.path.slice(4, -"/page.tsx".length))];
    }
    if (file.path.endsWith("/route.ts")) {
      return [toRoutePath(file.path.slice(4, -"/route.ts".length))];
    }
    return [] as string[];
  });
}

function countKeywordHits(content: string, keywords: string[]) {
  const lower = content.toLowerCase();
  return keywords.filter((keyword) => lower.includes(keyword.toLowerCase())).length;
}

function parseControllerMetadata(files: ScannedFile[]) {
  const controllerFiles = files.filter((file) => /^backend\/app\/Http\/Controllers\/Api\/.+Controller\.php$/.test(file.path));
  const controllerMap = new Map<string, ControllerMetadata>();

  for (const file of controllerFiles) {
    const name = file.path.split("/").pop()?.replace(/\.php$/, "") ?? file.path;
    const servicePaths = Array.from(file.content.matchAll(/use\s+App\\Services\\([^;]+);/g)).map((match) => `backend/app/Services/${match[1]}.php`);
    const methods = Array.from(file.content.matchAll(/public function\s+(\w+)\s*\(/g)).map((match) => match[1]);
    controllerMap.set(name, { name, path: file.path, methods, servicePaths });
  }

  return controllerMap;
}

function parseBackendRoutes(apiContent: string, controllerMap: Map<string, ControllerMetadata>) {
  const aliasMap = new Map<string, string>();
  for (const match of apiContent.matchAll(/use\s+App\\Http\\Controllers\\Api\\([^;]+);/g)) {
    aliasMap.set(match[1], match[1]);
  }

  const routeDefinitions: BackendRouteDefinition[] = [];
  const prefixStack: string[] = [];
  const lines = apiContent.split(/\r?\n/);

  for (const line of lines) {
    const prefixMatch = line.match(/Route::prefix\('([^']+)'\)->group/);
    if (prefixMatch) {
      prefixStack.push(prefixMatch[1]);
      continue;
    }

    if (/^\s*\}\);/.test(line) && prefixStack.length > 0) {
      prefixStack.pop();
      continue;
    }

    const routeMatch = line.match(/Route::(get|post|put|patch|delete)\('([^']+)',\s*\[([^:]+)::class,\s*'([^']+)'\]\);/i);
    if (!routeMatch) {
      continue;
    }

    const controllerName = aliasMap.get(routeMatch[3].trim()) ?? routeMatch[3].trim();
    const controller = controllerMap.get(controllerName);
    const fullPath = normalizePath(`/${prefixStack.filter(Boolean).join("/")}/${routeMatch[2]}`.replace(/\/+/g, "/"));

    routeDefinitions.push({
      method: routeMatch[1].toUpperCase(),
      path: fullPath,
      controllerName,
      action: routeMatch[4].trim(),
      controllerPath: controller?.path ?? null,
      servicePaths: controller?.servicePaths ?? [],
    });
  }

  return routeDefinitions;
}

function getBackendMatches(rule: ModuleScanRule, backendRoutes: BackendRouteDefinition[]) {
  return backendRoutes.filter((route) => {
    const routeMatched = rule.backendRoutePatterns?.some((pattern) => pattern.test(route.path)) ?? false;
    const controllerMatched = rule.controllerPatterns?.some((pattern) => pattern.test(route.controllerName) || pattern.test(route.controllerPath ?? "")) ?? false;
    const serviceMatched = rule.servicePatterns?.some((pattern) => route.servicePaths.some((servicePath) => pattern.test(servicePath))) ?? false;

    if (routeMatched || controllerMatched || serviceMatched) {
      return true;
    }

    if (!rule.backendKeywords?.length) {
      return false;
    }

    const haystack = `${route.path} ${route.controllerName} ${route.servicePaths.join(" ")}`.toLowerCase();
    return rule.backendKeywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
  });
}

function getBackendLinkageStrength(rule: ModuleScanRule, hasUiSurface: boolean, backendMatches: BackendRouteDefinition[], dependencyHits: MasterDesignModuleId[]) {
  if (rule.backendExpectation === "optional" && hasUiSurface && backendMatches.length === 0) {
    return dependencyHits.length > 0 ? "linked" as BackendLinkageStrength : "ui-only" as BackendLinkageStrength;
  }
  if (hasUiSurface && backendMatches.length === 0) {
    return "ui-only" as BackendLinkageStrength;
  }
  if (!hasUiSurface && backendMatches.length > 0) {
    return "backend-only" as BackendLinkageStrength;
  }
  if (backendMatches.length === 0) {
    return "none" as BackendLinkageStrength;
  }

  const controllerCount = new Set(backendMatches.map((route) => route.controllerPath).filter(Boolean)).size;
  const serviceCount = new Set(backendMatches.flatMap((route) => route.servicePaths)).size;
  if (rule.backendExpectation === "controller-or-service" && controllerCount > 0 && dependencyHits.length > 0) {
    return backendMatches.length >= 3 ? "strong" : "linked";
  }
  if (controllerCount > 0 && serviceCount > 0 && dependencyHits.length > 0) {
    return backendMatches.length >= 3 ? "strong" : "linked";
  }
  return "weak";
}

function getContaminationSeverity(moduleId: MasterDesignModuleId, previewFiles: ScannedFile[], fallbackFiles: ScannedFile[]) {
  const files = [...previewFiles, ...fallbackFiles].map((file) => file.path);
  if (!files.length) {
    return {
      severity: "none" as ContaminationSeverity,
      summary: "No preview or fallback contamination detected in this module.",
      files,
    };
  }

  if (["document-engine", "accounting-engine", "inventory-engine", "product-item-service", "company-profile", "country-service-architecture"].includes(moduleId)) {
    return {
      severity: "blocking" as ContaminationSeverity,
      summary: "Preview or fallback logic is still mixed into a core operational path.",
      files,
    };
  }

  return {
    severity: "warning" as ContaminationSeverity,
    summary: "Preview or fallback logic is still present and lowers runtime trust.",
    files,
  };
}

function deriveStructuralStatus(hasFiles: boolean, hasRoutes: boolean, missingRoutes: string[], backendStrength: BackendLinkageStrength) {
  if (!hasFiles) {
    return "MISSING" as ModuleExecutionStatus;
  }
  if (!hasRoutes || missingRoutes.length > 0 || backendStrength === "none") {
    return "PARTIAL" as ModuleExecutionStatus;
  }
  return "COMPLETE" as ModuleExecutionStatus;
}

function deriveRuntimeStatus(structuralStatus: ModuleExecutionStatus, contaminationSeverity: ContaminationSeverity, backendStrength: BackendLinkageStrength, proofStatus: ProofStatus, requiresProof: boolean) {
  if (structuralStatus === "MISSING") {
    return "MISSING" as ModuleExecutionStatus;
  }
  if (contaminationSeverity === "blocking") {
    return "BLOCKED" as ModuleExecutionStatus;
  }
  if (contaminationSeverity === "warning") {
    return "PARTIAL" as ModuleExecutionStatus;
  }
  if (backendStrength === "none" || backendStrength === "ui-only" || backendStrength === "weak") {
    return "PARTIAL" as ModuleExecutionStatus;
  }
  if (requiresProof && proofStatus !== "VERIFIED") {
    return "PARTIAL" as ModuleExecutionStatus;
  }
  return structuralStatus;
}

function recommendNextStep(blockers: SystemBlocker[], contaminationSeverity: ContaminationSeverity, backendStrength: BackendLinkageStrength, missingRoutes: string[], moduleName?: string) {
  if (blockers.length > 0) {
    const blocker = blockers[0];
    if (blocker.id.includes("missing-routes") && blocker.routePaths?.length) {
      return `Add owned route coverage for ${moduleName ?? blocker.moduleId}: ${blocker.routePaths.join(", ")}.`;
    }
    if (blocker.id.includes("missing-backend-linkage") && (blocker.controllerPaths?.length || blocker.servicePaths?.length)) {
      const controller = blocker.controllerPaths?.[0] ?? "the matching controller";
      const service = blocker.servicePaths?.[0] ?? "the matching service";
      return `Bind ${moduleName ?? blocker.moduleId} to backend ownership through ${controller} and ${service}.`;
    }
    if (blocker.nextStepRecommendation && !/tighten remaining target gaps|wire this module to owned backend routes/i.test(blocker.nextStepRecommendation)) {
      return blocker.nextStepRecommendation;
    }
    return `Resolve ${blocker.title.toLowerCase()} in ${moduleName ?? blocker.moduleId}.`;
  }
  if (contaminationSeverity === "blocking" || contaminationSeverity === "warning") {
    return `Remove preview and fallback behavior from the live ${moduleName ?? "module"} path.`;
  }
  if (backendStrength === "none" || backendStrength === "ui-only" || backendStrength === "weak") {
    return `Map ${moduleName ?? "this module"} to owned backend routes, controllers, and services.`;
  }
  if (missingRoutes.length > 0) {
    return `Add the missing routed entry points for ${moduleName ?? "this module"}: ${missingRoutes.join(", ")}.`;
  }
  return `Complete the remaining ${moduleName ?? "module"} evidence gaps shown in the current audit.`;
}

function summarizeRuntimeSignals(signals: RuntimeVerificationSignal[]) {
  if (!signals.length) {
    return {
      status: "missing" as RuntimeSignalStatus,
      summary: "No lightweight runtime verification signals were collected.",
    };
  }
  if (signals.some((signal) => signal.status === "blocked")) {
    return {
      status: "blocked" as RuntimeSignalStatus,
      summary: "A runtime verification signal is currently blocked.",
    };
  }
  if (signals.every((signal) => signal.status === "verified")) {
    return {
      status: "verified" as RuntimeSignalStatus,
      summary: "All lightweight runtime verification signals passed.",
    };
  }
  if (signals.some((signal) => signal.status === "verified" || signal.status === "partial")) {
    return {
      status: "partial" as RuntimeSignalStatus,
      summary: "Some runtime verification signals passed, but coverage is incomplete.",
    };
  }
  return {
    status: "missing" as RuntimeSignalStatus,
    summary: "Runtime verification signals are present but not yet confirming behavior.",
  };
}

function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 75) {
    return "high";
  }
  if (score >= 45) {
    return "medium";
  }
  return "low";
}

function buildConfidence(structuralStatus: ModuleExecutionStatus, runtimeStatus: ModuleExecutionStatus, runtimeVerificationStatus: RuntimeSignalStatus, backendStrength: BackendLinkageStrength, contaminationSeverity: ContaminationSeverity, proofStatus: ProofStatus, blockerCount: number) {
  let score = 0;
  score += structuralStatus === "COMPLETE" ? 25 : structuralStatus === "PARTIAL" ? 12 : 0;
  score += runtimeStatus === "COMPLETE" ? 25 : runtimeStatus === "PARTIAL" ? 12 : 0;
  score += runtimeVerificationStatus === "verified" ? 20 : runtimeVerificationStatus === "partial" ? 10 : 0;
  score += backendStrength === "strong" ? 15 : backendStrength === "linked" ? 10 : backendStrength === "weak" ? 4 : 0;
  score += proofStatus === "VERIFIED" ? 10 : proofStatus === "PARTIAL" ? 4 : 0;
  score -= contaminationSeverity === "blocking" ? 25 : contaminationSeverity === "warning" ? 12 : contaminationSeverity === "informational" ? 4 : 0;
  score -= blockerCount * 4;
  score = Math.max(0, Math.min(100, score));
  const level = getConfidenceLevel(score);
  return {
    level,
    score,
    summary: level === "high"
      ? "The engine has strong structural, runtime, and linkage evidence for this module."
      : level === "medium"
        ? "The engine has useful evidence for this module, but some uncertainty remains."
        : "The engine has limited trustworthy evidence for this module and should be treated cautiously.",
  };
}

function buildBlocker(id: string, title: string, moduleId: MasterDesignModuleId, severity: BlockerSeverity, rootCause: string, dependencyImpact: string, filePaths: string[], options?: {
  routePaths?: string[];
  controllerPaths?: string[];
  servicePaths?: string[];
  contaminationSeverity?: ContaminationSeverity;
  nextStepRecommendation?: string;
}): SystemBlocker {
  return { id, title, moduleId, severity, rootCause, dependencyImpact, filePaths, ...options };
}

function deriveDecisionStatus(params: {
  hasFiles: boolean;
  structuralStatus: ModuleExecutionStatus;
  runtimeStatus: ModuleExecutionStatus;
  runtimeVerificationStatus: RuntimeSignalStatus;
  backendStrength: BackendLinkageStrength;
  contaminationSeverity: ContaminationSeverity;
  fakeCompleteFlags: string[];
  blockers: SystemBlocker[];
  requiresProof: boolean;
  proofStatus: ProofStatus;
}): ModuleExecutionStatus {
  const { hasFiles, structuralStatus, runtimeStatus, runtimeVerificationStatus, backendStrength, contaminationSeverity, fakeCompleteFlags, blockers, requiresProof, proofStatus } = params;
  if (!hasFiles || blockers.some((blocker) => blocker.severity === "critical") || runtimeVerificationStatus === "blocked" || runtimeStatus === "BLOCKED") {
    return "BLOCKED";
  }
  if (fakeCompleteFlags.length > 0 || (structuralStatus === "COMPLETE" && (backendStrength === "weak" || backendStrength === "ui-only" || runtimeVerificationStatus === "missing"))) {
    return "FAKE-COMPLETE";
  }
  if (structuralStatus === "COMPLETE" && runtimeStatus === "COMPLETE" && runtimeVerificationStatus === "verified" && (backendStrength === "linked" || backendStrength === "strong") && contaminationSeverity === "none" && (!requiresProof || proofStatus === "VERIFIED")) {
    return "COMPLETE";
  }
  return "PARTIAL";
}

function summarizeModuleStatus(blockers: SystemBlocker[], fakeCompleteFlags: string[], missingRoutes: string[], missingBackend: boolean, files: ScannedFile[], proofFiles: ScannedFile[], requiresProof: boolean): ModuleExecutionStatus {
  if (!files.length || blockers.some((blocker) => blocker.severity === "critical")) {
    return "BLOCKED";
  }
  if (fakeCompleteFlags.length > 0) {
    return "FAKE-COMPLETE";
  }
  if (missingRoutes.length > 0 || missingBackend || (requiresProof && proofFiles.length === 0)) {
    return "PARTIAL";
  }
  return "COMPLETE";
}

function summarizeProofStatus(proofFiles: ScannedFile[], blockers: SystemBlocker[], requiresProof: boolean, runtimeVerificationStatus: RuntimeSignalStatus): ProofStatus {
  if (!requiresProof) {
    return "VERIFIED";
  }

  if (!proofFiles.length) {
    return "MISSING";
  }
  if (blockers.some((blocker) => blocker.moduleId === "proof-layer" || blocker.moduleId === "end-to-end-workflow-proof")) {
    return "BLOCKED";
  }
  if (runtimeVerificationStatus === "verified") {
    return "VERIFIED";
  }
  return proofFiles.length >= 2 ? "VERIFIED" : "PARTIAL";
}

function computeCompletion(rule: ModuleScanRule, files: ScannedFile[], routes: string[], proofFiles: ScannedFile[], blockers: SystemBlocker[], fakeCompleteFlags: string[], missingRoutes: string[], missingBackend: boolean, linkageCount: number) {
  const signals = [
    files.length > 0,
    routes.length > 0 || !rule.routePatterns?.length,
    proofFiles.length > 0 || !rule.proofPatterns?.length,
    !missingBackend,
    linkageCount > 0 || !rule.dependencySignals,
  ];
  const matchedSignals = signals.filter(Boolean).length;
  let score = Math.round((matchedSignals / signals.length) * 100);
  score -= blockers.reduce((total, blocker) => total + (blocker.severity === "critical" ? 30 : blocker.severity === "high" ? 18 : blocker.severity === "medium" ? 10 : 5), 0);
  score -= fakeCompleteFlags.length * 8;
  score -= missingRoutes.length * 10;
  return Math.max(0, Math.min(100, score));
}

function deriveSubsystemIds(files: ScannedFile[]) {
  const subsystemIds = new Set<string>();
  for (const file of files) {
    if (/workspace-preview/.test(file.path)) {
      subsystemIds.add("preview-layer");
    }
    if (/app\/api\//.test(file.path)) {
      subsystemIds.add("next-api-route");
    }
    if (/backend\/app\/Services\//.test(file.path)) {
      subsystemIds.add("backend-service");
    }
    if (/tools\//.test(file.path)) {
      subsystemIds.add("proof-script");
    }
  }
  return Array.from(subsystemIds);
}

function getFileDetails(files: ScannedFile[], blockerPaths: Set<string>): ModuleFileRecord[] {
  return files.map((file) => ({
    path: file.path,
    role: file.role,
    notes: [
      ...(file.isPreview ? ["preview usage detected"] : []),
      ...(file.isFallback ? ["fallback or seeded data detected"] : []),
      ...(file.isPlaceholder ? ["placeholder or scaffold marker detected"] : []),
      ...(file.isFranceSpecific ? ["France-specific logic present"] : []),
      ...(file.isKsaSpecific ? ["KSA-specific logic present"] : []),
    ],
    causesBlockage: blockerPaths.has(file.path),
  }));
}

function buildRuntimeSignals(rule: ModuleScanRule, matchedRoutes: string[], backendMatches: BackendRouteDefinition[], proofFiles: ScannedFile[]) {
  const signals: RuntimeVerificationSignal[] = [];
  const templateRuntime = rule.id === "template-engine" ? readTemplateEngineRuntime() : null;

  signals.push({
    id: `${rule.id}:route-alignment`,
    label: "Route ownership alignment",
    status: matchedRoutes.length > 0 || !rule.routePatterns?.length ? "verified" : "missing",
    summary: matchedRoutes.length > 0
      ? `${matchedRoutes.length} owned routes were confirmed from the Next app surface.`
      : rule.routePatterns?.length
        ? "Expected owned routes were not confirmed from the Next app surface."
        : "This module does not require owned app routes.",
    evidence: matchedRoutes,
  });

  signals.push({
    id: `${rule.id}:backend-alignment`,
    label: "Backend route/controller alignment",
    status: backendMatches.length > 0 ? "verified" : rule.backendKeywords?.length ? "missing" : "partial",
    summary: backendMatches.length > 0
      ? `${backendMatches.length} backend route mappings were confirmed.`
      : rule.backendKeywords?.length
        ? "No matching backend route ownership was confirmed."
        : "Backend linkage is not a primary signal for this module.",
    evidence: backendMatches.map((route) => `${route.method} ${route.path}`),
  });

  if (rule.id === "identity-workspace") {
    const authConfigured = fs.existsSync(path.join(ROOT, ".env.local")) || fs.existsSync(path.join(ROOT, "backend", ".env"));
    signals.push({
      id: `${rule.id}:auth-config`,
      label: "Auth/config presence",
      status: authConfigured ? "verified" : "missing",
      summary: authConfigured ? "At least one frontend or backend environment file exists." : "No frontend or backend environment file was found.",
      evidence: [authConfigured ? ".env.local or backend/.env" : "missing env file"],
    });
  }

  if (rule.id === "document-engine" || rule.id === "compliance-layer") {
    signals.push(getRecentLogSignal("Document validation recency", RUNTIME_LOGS[0]));
  }
  if (rule.id === "inventory-engine" || rule.id === "end-to-end-workflow-proof") {
    signals.push(getRecentLogSignal("Sales workflow recency", RUNTIME_LOGS[1]));
  }
  if (rule.id === "accounting-engine" || rule.id === "end-to-end-workflow-proof") {
    signals.push(getRecentLogSignal("Accounting workflow recency", RUNTIME_LOGS[2]));
  }
  if (rule.proofPatterns?.length) {
    signals.push({
      id: `${rule.id}:proof-asset`,
      label: "Proof asset presence",
      status: proofFiles.length > 0 ? "verified" : "missing",
      summary: proofFiles.length > 0 ? `${proofFiles.length} proof assets were detected for this module.` : "No proof assets were detected for this module.",
      evidence: proofFiles.map((file) => file.path),
    });
  }

  if (rule.id === "template-engine") {
    signals.push({
      id: `${rule.id}:templates-exist`,
      label: "Persisted templates exist",
      status: templateRuntime?.templatesExist ? "verified" : "missing",
      summary: templateRuntime?.templatesExist ? "Real persisted templates exist in backend runtime state." : "No persisted runtime template state was found.",
      evidence: ["backend/storage/app/private/template-engine-runtime.json"],
    });
    signals.push({
      id: `${rule.id}:template-linkage`,
      label: "Templates are linked to documents",
      status: (templateRuntime?.linkedDocumentsCount ?? 0) > 0 ? "verified" : "missing",
      summary: `${templateRuntime?.linkedDocumentsCount ?? 0} real documents are linked to templates.`,
      evidence: ["backend/storage/app/private/template-engine-runtime.json"],
    });
    signals.push({
      id: `${rule.id}:template-renders`,
      label: "Template rendering executed successfully",
      status: (templateRuntime?.templateRenderCount ?? 0) > 0 && (templateRuntime?.renderSuccessRate ?? 0) >= 1 ? "verified" : (templateRuntime?.templateRenderCount ?? 0) > 0 ? "partial" : "missing",
      summary: `${templateRuntime?.templateRenderCount ?? 0} renders executed with success rate ${templateRuntime?.renderSuccessRate ?? 0}.`,
      evidence: ["backend/storage/app/private/template-engine-runtime.json"],
    });
    signals.push({
      id: `${rule.id}:family-diversity`,
      label: "Template family diversity is real",
      status: (templateRuntime?.familyDiversityCount ?? 0) >= 3 ? "verified" : "missing",
      summary: `${templateRuntime?.familyDiversityCount ?? 0} real template families are persisted.`,
      evidence: ["backend/storage/app/private/template-engine-runtime.json"],
    });
  }

  return signals;
}

function scanModule(rule: ModuleScanRule, files: ScannedFile[], allRoutes: string[], backendRoutesContent: string, backendRoutes: BackendRouteDefinition[]): ModuleContext {
  const matchedFiles = files.filter((file) => rule.filePatterns.some((pattern) => pattern.test(file.path)));
  const matchedRoutes = allRoutes.filter((route) => rule.routePatterns?.some((pattern) => pattern.test(route)) ?? false);
  const proofFiles = files.filter((file) => rule.proofPatterns?.some((pattern) => pattern.test(file.path) || pattern.test(file.content)) ?? false);
  const dependencyHits = Array.from(new Set(Object.entries(rule.dependencySignals ?? {}).flatMap(([moduleId, patterns]) => matchedFiles.some((file) => patterns.some((pattern) => pattern.test(file.content) || pattern.test(file.path))) ? [moduleId as MasterDesignModuleId] : [])));
  const backendMatches = getBackendMatches(rule, backendRoutes);
  const backendHits = backendMatches.length > 0 ? backendMatches.length : countKeywordHits(backendRoutesContent, rule.backendKeywords ?? []);
  const missingRoutes = (rule.routePatterns ?? []).filter((pattern) => !matchedRoutes.some((route) => pattern.test(route))).map((pattern) => pattern.source);
  const missingBackend = (rule.backendKeywords?.length ?? 0) > 0 && backendHits === 0;
  const blockers: SystemBlocker[] = [];
  const fakeCompleteFlags: string[] = [];
  const whatWorks: string[] = [];
  const whatIsBroken: string[] = [];
  const whatIsMissing: string[] = [];
  const implementedFeatures: string[] = [];

  if (matchedFiles.length > 0) {
    whatWorks.push(`${matchedFiles.length} supporting files detected in the live project scan.`);
    implementedFeatures.push(`${matchedFiles.length} scanned implementation files`);
  }
  if (matchedRoutes.length > 0) {
    whatWorks.push(`${matchedRoutes.length} live routes detected.`);
    implementedFeatures.push(`${matchedRoutes.length} active routes`);
  } else if (rule.routePatterns?.length) {
    whatIsMissing.push("Expected routes were not detected from the app scan.");
  }
  if (proofFiles.length > 0) {
    whatWorks.push(`${proofFiles.length} proof or test artifacts detected.`);
    implementedFeatures.push(`${proofFiles.length} proof assets`);
  }

  const previewFiles = matchedFiles.filter((file) => file.isPreview);
  const fallbackFiles = matchedFiles.filter((file) => file.isFallback && (file.role === "preview" || /WorkspaceDataProvider\.tsx$/.test(file.path)));
  const contamination = getContaminationSeverity(rule.id, previewFiles, fallbackFiles);
  const controllerPaths = Array.from(new Set(backendMatches.map((route) => route.controllerPath).filter((value): value is string => Boolean(value))));
  const servicePaths = Array.from(new Set(backendMatches.flatMap((route) => route.servicePaths)));
  const backendRouteLabels = Array.from(new Set(backendMatches.map((route) => `${route.method} ${route.path}`)));
  if (previewFiles.length > 0 && ["document-engine", "template-engine", "product-item-service", "reports-engine", "company-profile", "country-service-architecture"].includes(rule.id)) {
    blockers.push(buildBlocker(`${rule.id}-preview-contamination`, `${rule.name} still depends on preview or fallback layers`, rule.id, contamination.severity === "blocking" ? "critical" : "high", `${rule.name} includes preview-backed files inside the live implementation path.`, "This keeps core workflow truth mixed with preview/demo state.", previewFiles.map((file) => file.path), { routePaths: matchedRoutes, controllerPaths, servicePaths, contaminationSeverity: contamination.severity, nextStepRecommendation: "Remove preview-backed files from the live execution path for this module." }));
    whatIsBroken.push("Preview-backed files are still part of the live implementation path.");
  }

  if (fallbackFiles.length > 0) {
    blockers.push(buildBlocker(`${rule.id}-fallback-data`, `${rule.name} uses fallback or seeded data paths`, rule.id, contamination.severity === "blocking" ? "high" : "medium", `${rule.name} contains fallback, seeded, or demo-state logic in scanned files.`, "Completion cannot be treated as authoritative while seeded or fallback state drives behavior.", fallbackFiles.map((file) => file.path), { routePaths: matchedRoutes, controllerPaths, servicePaths, contaminationSeverity: contamination.severity, nextStepRecommendation: "Replace seeded or fallback data paths with live owned data flow." }));
    whatIsBroken.push("Fallback or seeded data paths were detected.");
  }

  const placeholderFiles = matchedFiles.filter((file) => file.isPlaceholder && (/app\/workspace\/\[\.\.\.slug\]\/page\.tsx$/.test(file.path) || /WorkspaceModulePage\.tsx$/.test(file.path)));
  if (placeholderFiles.length > 0) {
    blockers.push(buildBlocker(`${rule.id}-placeholder-surface`, `${rule.name} includes placeholder or scaffolded surfaces`, rule.id, "high", `${rule.name} still exposes placeholder or scaffolded content markers.`, "This overstates shipped depth and keeps route truth unreliable.", placeholderFiles.map((file) => file.path), { routePaths: matchedRoutes, contaminationSeverity: contamination.severity, nextStepRecommendation: "Remove placeholder markers from the claimed live route surface." }));
    fakeCompleteFlags.push("UI surface exists but placeholder markers remain in the scanned files.");
  }

  if (missingRoutes.length > 0) {
    blockers.push(buildBlocker(`${rule.id}-missing-routes`, `${rule.name} is missing expected route coverage`, rule.id, "medium", `${rule.name} did not satisfy one or more expected route patterns in the app scan.`, "The module cannot be treated as end-to-end reachable from the current route surface.", matchedFiles.map((file) => file.path), { routePaths: matchedRoutes, controllerPaths, servicePaths, contaminationSeverity: contamination.severity, nextStepRecommendation: "Add the missing owned routes or stop claiming them in this module." }));
    whatIsMissing.push("Some expected routes were not found in the app directory.");
  }

  if (missingBackend) {
    blockers.push(buildBlocker(`${rule.id}-missing-backend-linkage`, `${rule.name} lacks clear backend linkage`, rule.id, "medium", `${rule.name} files exist, but matching backend route keywords were not found in backend/routes/api.php.`, "UI presence without route-level backend linkage reduces trust in operational completeness.", matchedFiles.map((file) => file.path), { routePaths: matchedRoutes, controllerPaths, servicePaths, contaminationSeverity: contamination.severity, nextStepRecommendation: "Map this module to real backend routes, controllers, and services." }));
    whatIsMissing.push("Backend linkage could not be confirmed from backend route definitions.");
  }

  if (rule.id === "country-service-architecture") {
    const franceFiles = files.filter((file) => file.isFranceSpecific);
    const ksaFiles = files.filter((file) => file.isKsaSpecific);
    if (franceFiles.length <= 2) {
      blockers.push(buildBlocker("country-service-architecture-france-readiness", "France remains metadata-only in the current project state", rule.id, "high", "The real scan found only light France-specific logic compared with extensive KSA-specific implementation.", "Country separation is not yet product-grade for France expansion.", franceFiles.map((file) => file.path), { routePaths: matchedRoutes, controllerPaths, servicePaths, contaminationSeverity: contamination.severity, nextStepRecommendation: "Add real France product-layer modules before claiming country readiness." }));
      whatIsMissing.push("France-specific product logic is still minimal in the scanned codebase.");
    }
    if (ksaFiles.length > franceFiles.length * 3) {
      whatIsBroken.push("Country implementation weight is heavily concentrated in KSA-specific files.");
    }
  }

  if (rule.id === "proof-layer" || rule.id === "end-to-end-workflow-proof") {
    const requiredProofPaths = [
      /tools\/capture-document-validation\.mjs$/,
      /tools\/capture-sales-workflow-evidence\.mjs$/,
      /tools\/prove-accounting-ui-workflow\.mjs$/,
    ];
    const hasFullProofChain = requiredProofPaths.every((pattern) => files.some((file) => pattern.test(file.path)));
    if (!hasFullProofChain) {
      blockers.push(buildBlocker(`${rule.id}-missing-proof-assets`, `${rule.name} is missing one or more proof assets`, rule.id, "critical", "The real scan could not confirm the full proof asset chain for document, sales, and accounting workflows.", "Phase 1 workflow proof cannot be treated as complete.", proofFiles.map((file) => file.path), { routePaths: matchedRoutes, controllerPaths, servicePaths, contaminationSeverity: contamination.severity, nextStepRecommendation: "Restore the missing proof asset chain for this workflow." }));
    }
  }

  const runtimeSignals = buildRuntimeSignals(rule, matchedRoutes, backendMatches, proofFiles);
  const runtimeVerification = summarizeRuntimeSignals(runtimeSignals);
  const requiresProof = (rule.proofPatterns?.length ?? 0) > 0;
  const proofStatus = summarizeProofStatus(proofFiles, blockers, requiresProof, runtimeVerification.status);
  const backendLinkageStrength = getBackendLinkageStrength(rule, matchedFiles.length > 0 || matchedRoutes.length > 0, backendMatches, dependencyHits);
  const structuralStatus = deriveStructuralStatus(matchedFiles.length > 0, matchedRoutes.length > 0 || !rule.routePatterns?.length, missingRoutes, backendLinkageStrength);
  const runtimeStatus = runtimeVerification.status === "blocked"
    ? "BLOCKED"
    : runtimeVerification.status === "missing" && structuralStatus === "COMPLETE" && (backendLinkageStrength === "weak" || backendLinkageStrength === "ui-only")
      ? "PARTIAL"
      : deriveRuntimeStatus(structuralStatus, contamination.severity, backendLinkageStrength, proofStatus, requiresProof);
  const completionPercentage = computeCompletion(rule, matchedFiles, matchedRoutes, proofFiles, blockers, fakeCompleteFlags, missingRoutes, missingBackend, dependencyHits.length);
  const status = deriveDecisionStatus({
    hasFiles: matchedFiles.length > 0,
    structuralStatus,
    runtimeStatus,
    runtimeVerificationStatus: runtimeVerification.status,
    backendStrength: backendLinkageStrength,
    contaminationSeverity: contamination.severity,
    fakeCompleteFlags,
    blockers,
    requiresProof,
    proofStatus,
  });
  const summary = matchedFiles.length ? `${matchedFiles.length} files, ${matchedRoutes.length} routes, ${proofFiles.length} proof assets, ${blockers.length} blockers detected from live repo scan.` : "No matching implementation files were found in the live repo scan.";
  const confidence = buildConfidence(structuralStatus, runtimeStatus, runtimeVerification.status, backendLinkageStrength, contamination.severity, proofStatus, blockers.length);

  if (!matchedFiles.length) {
    whatIsMissing.push("No implementation files matched this module during the repo scan.");
  }
  if (!dependencyHits.length && rule.dependencySignals) {
    whatIsMissing.push("No live dependency signals were detected from scanned imports or content.");
  }

  return {
    rule,
    files: matchedFiles,
    routes: matchedRoutes,
    proofFiles,
    dependencyHits,
    blockers,
    fakeCompleteFlags,
    whatWorks,
    whatIsBroken,
    whatIsMissing,
    implementedFeatures,
    implementedLinkages: dependencyHits,
    proofStatus,
    proofSummary: !requiresProof ? "This module does not require a dedicated proof asset to be considered live-scanned." : proofStatus === "VERIFIED" ? `Live scan found ${proofFiles.length} proof assets for this module.` : proofStatus === "MISSING" ? "No proof assets were detected by the live scan." : "Live scan found proof assets, but blockers still affect proof confidence.",
    runtimeVerificationStatus: runtimeVerification.status,
    runtimeVerificationSummary: runtimeVerification.summary,
    runtimeSignals,
    structuralStatus,
    runtimeStatus,
    backendLinkageStrength,
    backendSummary: backendMatches.length > 0 ? `${backendMatches.length} backend routes mapped through ${controllerPaths.length} controllers and ${servicePaths.length} services.` : "No strong backend ownership chain was found for this module.",
    controllerPaths,
    servicePaths,
    backendRoutes: backendRouteLabels,
    contaminationSeverity: contamination.severity,
    contaminationSummary: contamination.summary,
    contaminationFiles: contamination.files,
    summary,
    completionPercentage,
    status,
    subsystemIds: deriveSubsystemIds(matchedFiles),
    nextStepRecommendation: recommendNextStep(blockers, contamination.severity, backendLinkageStrength, missingRoutes, rule.name),
    confidenceLevel: confidence.level,
    confidenceScore: confidence.score,
    confidenceSummary: confidence.summary,
  };
}

function buildSubsystems(contexts: ModuleContext[]): ActualSubsystemRecord[] {
  return contexts.flatMap((context) => context.subsystemIds.map((subsystemId) => ({
    id: `${context.rule.id}:${subsystemId}`,
    name: subsystemId,
    owner: context.rule.id,
    status: context.status,
    summary: `${context.rule.name} uses ${subsystemId}.`,
    criticalFiles: context.files.map((file) => file.path).slice(0, 5),
    criticalRoutes: context.routes.slice(0, 5),
  })));
}

function buildCountryReadiness(contexts: ModuleContext[], files: ScannedFile[]) {
  const franceFiles = files.filter((file) => file.isFranceSpecific);
  const ksaFiles = files.filter((file) => file.isKsaSpecific);
  const previewFiles = files.filter((file) => file.isPreview);
  const ksaModules = contexts.filter((context) => context.rule.countryScope === "ksa");
  const franceMetadataFiles = franceFiles.filter((file) => /data\/master-design|country-foundation|master-design/i.test(file.path));
  const franceProductFiles = franceFiles.filter((file) => !franceMetadataFiles.includes(file));
  const franceStructuralFiles = franceProductFiles.filter((file) => !file.isPreview && !file.isFallback);
  const franceCompletion = Math.min(100, Math.round((franceStructuralFiles.length / Math.max(ksaFiles.length, 1)) * 100));
  const ksaCompletion = ksaModules.length > 0
    ? Math.round(ksaModules.reduce((total, context) => total + context.completionPercentage, 0) / ksaModules.length)
    : Math.min(100, Math.max(10, Math.round((ksaFiles.length / Math.max(files.length / 8, 1)) * 100)));

  return {
    ksa: {
      status: ksaCompletion >= 75 ? "active operational product" : "incomplete",
      completionPercentage: ksaCompletion,
      notes: [`${ksaFiles.length} KSA-specific files detected in the live scan.`, `${ksaModules.filter((context) => context.status === "COMPLETE").length} KSA-scoped modules are currently complete.`],
    },
    france: {
      status: franceStructuralFiles.length > 0 ? franceCompletion >= 25 ? "actual product implementation" : "structural preparation" : franceProductFiles.length > 0 ? "minimal product signals" : "metadata-only readiness",
      completionPercentage: franceCompletion,
      notes: [`${franceFiles.length} France-specific files detected, ${franceMetadataFiles.length} of them are metadata/readiness-only.`, `${franceStructuralFiles.length} France files look like structural or product-layer implementation rather than metadata.`],
    },
    trulyKsaSpecific: files.filter((file) => /zatca|ksa/i.test(file.path)).map((file) => file.path).slice(0, 6),
    wronglySharedToday: previewFiles.map((file) => file.path).slice(0, 6),
    franceSeparationNeeds: [
      "Dedicated France VAT/TVA engine files",
      "France-owned document compliance routes",
      "France proof scripts and operational UI surfaces",
    ],
  };
}

function scanRepository(): ActualSystemMap {
  const scannedFiles: ScannedFile[] = [];
  for (const scanPathValue of SCAN_PATHS) {
    scanPath(scanPathValue, scannedFiles);
  }

  const routes = buildRoutes(scannedFiles);
  const backendRoutesContent = readTextFile(path.join(ROOT, "backend", "routes", "api.php"));
  const controllerMap = parseControllerMetadata(scannedFiles);
  const backendRoutes = parseBackendRoutes(backendRoutesContent, controllerMap);
  const contexts = MODULE_RULES.map((rule) => scanModule(rule, scannedFiles, routes, backendRoutesContent, backendRoutes));

  const modules: ActualModuleRecord[] = contexts.map((context) => {
    const blockerPaths = new Set(context.blockers.flatMap((blocker) => blocker.filePaths ?? []));
    return {
      id: context.rule.id,
      name: context.rule.name,
      description: context.rule.description,
      countryScope: context.rule.countryScope,
      status: context.status,
      structuralStatus: context.structuralStatus,
      runtimeStatus: context.runtimeStatus,
      completionPercentage: context.completionPercentage,
      summary: context.summary,
      whatWorks: context.whatWorks,
      whatIsBroken: context.whatIsBroken,
      whatIsMissing: context.whatIsMissing,
      blockers: context.blockers,
      fakeCompleteFlags: context.fakeCompleteFlags,
      dependencies: context.implementedLinkages,
      proof: {
        status: context.proofStatus,
        summary: context.proofSummary,
        evidence: context.proofFiles.map((file) => file.path),
      },
      runtimeVerification: {
        status: context.runtimeVerificationStatus,
        summary: context.runtimeVerificationSummary,
        signals: context.runtimeSignals,
      },
      backendLinkage: {
        strength: context.backendLinkageStrength,
        summary: context.backendSummary,
        controllers: context.controllerPaths,
        services: context.servicePaths,
        routes: context.backendRoutes,
      },
      contamination: {
        severity: context.contaminationSeverity,
        summary: context.contaminationSummary,
        files: context.contaminationFiles,
      },
      implementedFeatures: context.implementedFeatures,
      implementedLinkages: context.implementedLinkages,
      lastUpdated: new Date().toISOString(),
      criticalFiles: context.files.map((file) => file.path).slice(0, 8),
      fileDetails: getFileDetails(context.files, blockerPaths),
      criticalRoutes: context.routes.slice(0, 8),
      criticalControllers: context.controllerPaths,
      criticalServices: context.servicePaths,
      subsystemIds: context.subsystemIds,
      nextStepRecommendation: context.nextStepRecommendation,
      confidence: {
        level: context.confidenceLevel,
        score: context.confidenceScore,
        summary: context.confidenceSummary,
      },
    };
  });

  return {
    productName: "Gulf Hisab KSA",
    phase: "Phase 1",
    modules,
    subsystems: buildSubsystems(contexts),
    countryReadiness: buildCountryReadiness(contexts, scannedFiles),
    updatedAt: new Date().toISOString(),
  };
}

export function getActualSystemMap(): ActualSystemMap {
  return scanRepository();
}

export function getActualModuleMap(): ActualModuleRecord[] {
  return getActualSystemMap().modules;
}

export function getActualModuleById(moduleId: ActualModuleRecord["id"]): ActualModuleRecord | null {
  return getActualModuleMap().find((module) => module.id === moduleId) ?? null;
}

export function getPriorityModulesFromActualMap(actualMap: ActualSystemMap = getActualSystemMap()) {
  return [...actualMap.modules]
    .filter((module) => module.status !== "COMPLETE" || module.blockers.length > 0)
    .sort((left, right) => {
      const leftWeight = left.blockers.length * 10 + (100 - left.completionPercentage);
      const rightWeight = right.blockers.length * 10 + (100 - right.completionPercentage);
      return rightWeight - leftWeight;
    });
}