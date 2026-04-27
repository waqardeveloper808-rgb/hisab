import fs from "node:fs";
import path from "node:path";
import { defaultChartOfAccounts } from "@/lib/accounting-engine";
import { getActualSystemMap } from "@/lib/mapping-engine";
import { actualSystemMap } from "@/data/system-map/actual-map";
import { workspaceRoles } from "@/data/role-workspace";
import { workspaceModules } from "@/data/workspace";
import { validatedControlEvidence } from "@/data/validated-control-evidence";
import { controlPointEngineRuntime } from "@/backend/app/Support/Standards/control-point-engine-runtime";
import { renderControlPointEngineSummary } from "@/backend/app/Support/Standards/control-point-engine-summary";
import { standardsControlPoints, standardsControlPointValidation, runtimeControlPointSource } from "@/backend/app/Support/Standards/control-points";
import runtimeAuditData from "@/data/audit-runtime/control-point-runtime-results.json";
import previewContacts from "@/data/preview-contact-store.json";
import previewDocuments from "@/data/preview-document-store.json";
import previewInventory from "@/data/preview-inventory-store.json";
import previewItems from "@/data/preview-item-store.json";
import previewPayments from "@/data/preview-payment-store.json";
import type { StandardsControlPoint } from "@/data/standards/control-points";
import type { ActualModuleRecord, ActualSystemMap, BlockerSeverity, ProofStatus } from "@/types/system-map";

const staticActualSystemMap = actualSystemMap as unknown as ActualSystemMap;

export type ControlPointExecutionCategory =
  | "UI/UX CPs"
  | "Validation CPs"
  | "Accounting CPs"
  | "VAT CPs"
  | "Document CPs"
  | "Workflow CPs"
  | "Security CPs"
  | "Cross-module CPs";

export type EvidenceType =
  | "db-state"
  | "api-response"
  | "ui-snapshot"
  | "document-output"
  | "validation-result"
  | "system-log";

export type EvidenceItem = {
  type: EvidenceType;
  label: string;
  source: string;
  available: boolean;
  details: string;
  reference: string;
};

export type EvidenceRuleCheck = {
  id: string;
  label: string;
  passed: boolean;
  direct: boolean;
  severity: BlockerSeverity;
  details: string;
};

export type ControlPointViolation = {
  code: string;
  severity: BlockerSeverity;
  message: string;
  reference: string;
};

export type LinkedModuleHealth = {
  moduleId: string;
  status: string;
  completionPercentage: number;
  proofStatus: ProofStatus | "MISSING";
  blockerCount: number;
  blockers: ControlPointViolation[];
};

export type ControlPointEvidenceBundle = {
  category: ControlPointExecutionCategory;
  evaluatorKey: string;
  evidence: EvidenceItem[];
  matchedRuntimeResult: RuntimeAuditRecord | null;
  linkedModuleHealth: LinkedModuleHealth[];
  requiredChecks: EvidenceRuleCheck[];
  violations: ControlPointViolation[];
  missingData: string[];
  weight: number;
  riskPriority: StandardsControlPoint["risk_priority"];
};

type RuntimeAuditRecord = {
  status: "PASS" | "FAIL" | "PARTIAL" | "BLOCKED";
  score: number;
  audit_reason: string;
  checked_items: string[];
  evidence: string[];
  last_checked_at?: string;
};

type RuntimeAuditPayload = {
  results?: Record<string, RuntimeAuditRecord>;
};

type QualityMetrics = {
  contactTotal: number;
  contactsWithVat: number;
  validVatCount: number;
  invalidVatCount: number;
  contactsWithCr: number;
  validCrCount: number;
  invalidCrCount: number;
  contactsWithPhone: number;
  validPhoneCount: number;
  invalidPhoneCount: number;
  documentTotal: number;
  taxableDocuments: number;
  taxableDocumentsWithBuyerVat: number;
  taxableDocumentsWithComplianceVat: number;
  postedDocuments: number;
  documentsWithLinkedChain: number;
  documentLinesWithLedgerAccount: number;
  inventoryTotal: number;
  inventoryWithDocumentLinks: number;
  inventoryWithJournalEntry: number;
  paymentAllocatedCount: number;
  templateTotal: number;
  bilingualTemplateCount: number;
  brandedTemplateCount: number;
  templateDocumentTypeCoverage: number;
  templateUsageCount: number;
  templateRenderCount: number;
  templateRenderSuccessRate: number;
  realLinkedTemplateDocuments: number;
  familyDiversityCount: number;
  workspaceRoleCount: number;
  workspaceQuickActionCount: number;
  workspaceRouteCount: number;
  workspaceAbilityModuleCount: number;
  requiredUserSalesNavCount: number;
  presentUserSalesNavCount: number;
  missingUserSalesNavLabels: string[];
  workspaceAuthFallbackBannerPresent: boolean;
  workspacePlaceholderModuleFallbackPresent: boolean;
  workspaceSilentBackendFallbackCount: number;
  requiredAccountCount: number;
  itemCatalogCount: number;
  accountingPeriodValidationReady: boolean;
  openingBalanceCapabilityReady: boolean;
};

type CommunicationRuntimeMetrics = {
  communicationRoutesPresent: boolean;
  communicationTemplateRoutesPresent: boolean;
  communicationServicePresent: boolean;
  communicationDispatchServicePresent: boolean;
  communicationLearningServicePresent: boolean;
  communicationTimelineServicePresent: boolean;
  communicationControllerPresent: boolean;
  communicationTemplateControllerPresent: boolean;
  communicationJobPresent: boolean;
  communicationModelPresent: boolean;
  communicationAttemptModelPresent: boolean;
  communicationTemplateModelPresent: boolean;
  communicationMigrationPresent: boolean;
  communicationWorkspaceRootPresent: boolean;
  communicationRegisterPresent: boolean;
  communicationTimelinePanelPresent: boolean;
  communicationDialogPresent: boolean;
  communicationBadgePresent: boolean;
  invoiceDetailIntegrationPresent: boolean;
  communicationApiClientPresent: boolean;
};

type TemplateEngineRuntime = {
  templatesExist?: boolean;
  linkedDocumentsCount?: number;
  templateUsageCount?: number;
  templateRenderCount?: number;
  renderSuccessRate?: number;
  familyDiversityCount?: number;
  templates?: Array<{
    id: number;
    document_types?: string[];
    locale_mode?: string;
    accent_color?: string;
    sections?: string[];
    has_asset_assignment?: boolean;
  }>;
};

function resolveActualSystemMap(): ActualSystemMap {
  if (typeof window !== "undefined") {
    return staticActualSystemMap;
  }

  try {
    return getActualSystemMap();
  } catch {
    return staticActualSystemMap;
  }
}

function resolveTemplateEngineRuntime(): TemplateEngineRuntime {
  if (typeof window !== "undefined") {
    return {};
  }

  try {
    const runtimePath = path.join(process.cwd(), "backend", "storage", "app", "private", "template-engine-runtime.json");
    return JSON.parse(fs.readFileSync(runtimePath, "utf8")) as TemplateEngineRuntime;
  } catch {
    return {};
  }
}

const runtimeAuditResults = (runtimeAuditData as RuntimeAuditPayload).results ?? {};
const templateEngineRuntime = resolveTemplateEngineRuntime();

let evidenceLiveSystemMapOverride: ActualSystemMap | null = null;

export function setEvidenceLiveSystemMapOverride(map: ActualSystemMap | null) {
  evidenceLiveSystemMapOverride = map;
}

function getEvidenceLiveSystemMap(): ActualSystemMap {
  return evidenceLiveSystemMapOverride ?? resolveActualSystemMap();
}
const workspaceSurfaceMetrics = (() => {
  const requiredUserSalesRoutes = [
    { label: "Invoices", href: "/workspace/user/invoices" },
    { label: "Quotations", href: "/workspace/user/quotations" },
    { label: "Proforma", href: "/workspace/user/proforma-invoices" },
    { label: "Credit Notes", href: "/workspace/user/credit-notes" },
    { label: "Debit Notes", href: "/workspace/user/debit-notes" },
  ];
  const salesGroup = workspaceRoles.user.sidebarGroups.find((group) => group.label === "Sales");
  const salesItems = salesGroup?.items ?? [];
  const missingUserSalesNavLabels = requiredUserSalesRoutes
    .filter((requiredItem) => !salesItems.some((item) => item.label === requiredItem.label && item.href === requiredItem.href))
    .map((item) => item.label);

  if (typeof window !== "undefined") {
    return {
      requiredUserSalesNavCount: requiredUserSalesRoutes.length,
      presentUserSalesNavCount: requiredUserSalesRoutes.length - missingUserSalesNavLabels.length,
      missingUserSalesNavLabels,
      workspaceAuthFallbackBannerPresent: false,
      workspacePlaceholderModuleFallbackPresent: false,
      workspaceSilentBackendFallbackCount: 0,
    };
  }

  try {
    const cwd = process.cwd();
    const workspaceApiRouteSource = fs.readFileSync(path.join(cwd, "app", "api", "workspace", "[...slug]", "route.ts"), "utf8");
    const workspaceCatchAllSource = fs.readFileSync(path.join(cwd, "app", "workspace", "[...slug]", "page.tsx"), "utf8");
    const workspaceModulePageSource = fs.readFileSync(path.join(cwd, "components", "workspace", "WorkspaceModulePage.tsx"), "utf8");
    const workspaceClientSource = fs.readFileSync(path.join(cwd, "lib", "workspace-api.ts"), "utf8");
    const roleWorkspaceSource = fs.readFileSync(path.join(cwd, "data", "role-workspace.ts"), "utf8");

    return {
      requiredUserSalesNavCount: requiredUserSalesRoutes.length,
      presentUserSalesNavCount: requiredUserSalesRoutes.length - missingUserSalesNavLabels.length,
      missingUserSalesNavLabels,
      workspaceAuthFallbackBannerPresent: workspaceApiRouteSource.includes("Authenticated backend workspace access is required for this core flow."),
      workspacePlaceholderModuleFallbackPresent:
        workspaceCatchAllSource.includes("WorkspaceModulePage")
        && roleWorkspaceSource.includes("Module in development")
        && workspaceModulePageSource.includes('data-inspector-register="workspace-module-page"'),
      workspaceSilentBackendFallbackCount: (workspaceClientSource.match(/backendReady:\s*false/g) ?? []).length,
    };
  } catch {
    return {
      requiredUserSalesNavCount: requiredUserSalesRoutes.length,
      presentUserSalesNavCount: requiredUserSalesRoutes.length - missingUserSalesNavLabels.length,
      missingUserSalesNavLabels,
      workspaceAuthFallbackBannerPresent: false,
      workspacePlaceholderModuleFallbackPresent: false,
      workspaceSilentBackendFallbackCount: 0,
    };
  }
})();
const communicationRuntimeMetrics: CommunicationRuntimeMetrics = (() => {
  if (typeof window !== "undefined") {
    return {
      communicationRoutesPresent: true,
      communicationTemplateRoutesPresent: true,
      communicationServicePresent: true,
      communicationDispatchServicePresent: true,
      communicationLearningServicePresent: true,
      communicationTimelineServicePresent: true,
      communicationControllerPresent: true,
      communicationTemplateControllerPresent: true,
      communicationJobPresent: true,
      communicationModelPresent: true,
      communicationAttemptModelPresent: true,
      communicationTemplateModelPresent: true,
      communicationMigrationPresent: true,
      communicationWorkspaceRootPresent: true,
      communicationRegisterPresent: true,
      communicationTimelinePanelPresent: true,
      communicationDialogPresent: true,
      communicationBadgePresent: true,
      invoiceDetailIntegrationPresent: true,
      communicationApiClientPresent: true,
    };
  }

  try {
    const cwd = process.cwd();
    const routeSource = fs.readFileSync(path.join(cwd, "backend", "routes", "api.php"), "utf8");
    const workspaceRouteSource = fs.readFileSync(path.join(cwd, "app", "api", "workspace", "[...slug]", "route.ts"), "utf8");
    const workspaceApiSource = fs.readFileSync(path.join(cwd, "lib", "workspace-api.ts"), "utf8");
    const invoiceDetailSource = fs.readFileSync(path.join(cwd, "components", "workspace", "InvoiceDetailWorkspace.tsx"), "utf8");
    const exists = (relative: string) => fs.existsSync(path.join(cwd, ...relative.split("/")));

    return {
      communicationRoutesPresent: routeSource.includes("/communications") && routeSource.includes("CommunicationController::class"),
      communicationTemplateRoutesPresent: routeSource.includes("/communications/templates") && routeSource.includes("CommunicationTemplateController::class"),
      communicationServicePresent: exists("backend/app/Services/Communication/CommunicationService.php"),
      communicationDispatchServicePresent: exists("backend/app/Services/Communication/CommunicationDispatchService.php"),
      communicationLearningServicePresent: exists("backend/app/Services/Communication/CommunicationLearningService.php"),
      communicationTimelineServicePresent: exists("backend/app/Services/Communication/CommunicationTimelineService.php"),
      communicationControllerPresent: exists("backend/app/Http/Controllers/Api/CommunicationController.php"),
      communicationTemplateControllerPresent: exists("backend/app/Http/Controllers/Api/CommunicationTemplateController.php"),
      communicationJobPresent: exists("backend/app/Jobs/DispatchCommunicationJob.php"),
      communicationModelPresent: exists("backend/app/Models/Communication.php"),
      communicationAttemptModelPresent: exists("backend/app/Models/CommunicationAttempt.php"),
      communicationTemplateModelPresent: exists("backend/app/Models/CommunicationTemplate.php"),
      communicationMigrationPresent: exists("backend/database/migrations/2026_04_20_001000_create_communication_module_tables.php"),
      communicationWorkspaceRootPresent: workspaceRouteSource.includes('"communications"'),
      communicationRegisterPresent: exists("components/workspace/CommunicationRegister.tsx"),
      communicationTimelinePanelPresent: exists("components/workspace/CommunicationTimelinePanel.tsx"),
      communicationDialogPresent: exists("components/workspace/SendCommunicationDialog.tsx"),
      communicationBadgePresent: exists("components/workspace/CommunicationStatusBadge.tsx"),
      invoiceDetailIntegrationPresent: invoiceDetailSource.includes("CommunicationTimelinePanel") && invoiceDetailSource.includes("SendCommunicationDialog"),
      communicationApiClientPresent: workspaceApiSource.includes("listCommunicationTimeline") && workspaceApiSource.includes("createCommunication"),
    };
  } catch {
    return {
      communicationRoutesPresent: false,
      communicationTemplateRoutesPresent: false,
      communicationServicePresent: false,
      communicationDispatchServicePresent: false,
      communicationLearningServicePresent: false,
      communicationTimelineServicePresent: false,
      communicationControllerPresent: false,
      communicationTemplateControllerPresent: false,
      communicationJobPresent: false,
      communicationModelPresent: false,
      communicationAttemptModelPresent: false,
      communicationTemplateModelPresent: false,
      communicationMigrationPresent: false,
      communicationWorkspaceRootPresent: false,
      communicationRegisterPresent: false,
      communicationTimelinePanelPresent: false,
      communicationDialogPresent: false,
      communicationBadgePresent: false,
      invoiceDetailIntegrationPresent: false,
      communicationApiClientPresent: false,
    };
  }
})();
const qualityMetrics: QualityMetrics = (() => {
  const contactsWithVat = previewContacts.filter((contact) => String(contact.vat_number ?? "").trim().length > 0);
  const contactsWithCr = previewContacts.filter((contact) => String(contact.cr_number ?? "").trim().length > 0);
  const contactsWithPhone = previewContacts.filter((contact) => String(contact.phone ?? "").trim().length > 0);
  const documentLines = previewDocuments.reduce<Array<{ ledger_account_id?: number }>>((lines, document) => {
    if (Array.isArray(document.lines)) {
      lines.push(...document.lines);
    }
    return lines;
  }, []);
  const taxableDocuments = previewDocuments.filter((document) => Number(document.tax_total ?? 0) > 0 && Number(document.taxable_total ?? 0) > 0);
  return {
    contactTotal: previewContacts.length,
    contactsWithVat: contactsWithVat.length,
    validVatCount: contactsWithVat.filter((contact) => /^\d{15}$/.test(String(contact.vat_number ?? ""))).length,
    invalidVatCount: contactsWithVat.filter((contact) => !/^\d{15}$/.test(String(contact.vat_number ?? ""))).length,
    contactsWithCr: contactsWithCr.length,
    validCrCount: contactsWithCr.filter((contact) => /^\d{10}$/.test(String(contact.cr_number ?? ""))).length,
    invalidCrCount: contactsWithCr.filter((contact) => !/^\d{10}$/.test(String(contact.cr_number ?? ""))).length,
    contactsWithPhone: contactsWithPhone.length,
    validPhoneCount: contactsWithPhone.filter((contact) => /^\+?\d{9,15}$/.test(String(contact.phone ?? ""))).length,
    invalidPhoneCount: contactsWithPhone.filter((contact) => !/^\+?\d{9,15}$/.test(String(contact.phone ?? ""))).length,
    documentTotal: previewDocuments.length,
    taxableDocuments: taxableDocuments.length,
    taxableDocumentsWithBuyerVat: taxableDocuments.filter((document) => String(document.custom_fields?.buyer_vat_number ?? "").trim().length > 0).length,
    taxableDocumentsWithComplianceVat: taxableDocuments.filter((document) => Boolean(document.compliance_metadata?.zatca?.vat_number)).length,
    postedDocuments: previewDocuments.filter((document) => ["posted", "paid", "finalized", "sent"].includes(String(document.status ?? ""))).length,
    documentsWithLinkedChain: previewDocuments.filter((document) => String(document.custom_fields?.linked_chain ?? "").trim().length > 0).length,
    documentLinesWithLedgerAccount: documentLines.filter((line) => typeof line.ledger_account_id === "number").length,
    inventoryTotal: previewInventory.length,
    inventoryWithDocumentLinks: previewInventory.filter((row) => row.document_links?.length > 0).length,
    inventoryWithJournalEntry: previewInventory.filter((row) => String(row.journal_entry_number ?? "").trim().length > 0).length,
    paymentAllocatedCount: previewPayments.filter((payment) => payment.allocated_total > 0 && payment.document_id != null).length,
    templateTotal: templateEngineRuntime.templates?.length ?? 0,
    bilingualTemplateCount: (templateEngineRuntime.templates ?? []).filter((template) => template.locale_mode === "bilingual").length,
    brandedTemplateCount: (templateEngineRuntime.templates ?? []).filter((template) => String(template.accent_color ?? "").trim().length > 0).length,
    templateDocumentTypeCoverage: new Set((templateEngineRuntime.templates ?? []).flatMap((template) => template.document_types ?? [])).size,
    templateUsageCount: Number(templateEngineRuntime.templateUsageCount ?? 0),
    templateRenderCount: Number(templateEngineRuntime.templateRenderCount ?? 0),
    templateRenderSuccessRate: Number(templateEngineRuntime.renderSuccessRate ?? 0),
    realLinkedTemplateDocuments: Number(templateEngineRuntime.linkedDocumentsCount ?? 0),
    familyDiversityCount: Number(templateEngineRuntime.familyDiversityCount ?? 0),
    workspaceRoleCount: Object.keys(workspaceRoles).length,
    workspaceQuickActionCount: Object.values(workspaceRoles).reduce((sum, role) => sum + role.quickActions.length, 0),
    workspaceRouteCount: workspaceModules.length,
    workspaceAbilityModuleCount: workspaceModules.filter((module) => (module.requiredCompanyAbilities?.length ?? 0) > 0 || (module.requiredPlatformAbilities?.length ?? 0) > 0).length,
    requiredUserSalesNavCount: workspaceSurfaceMetrics.requiredUserSalesNavCount,
    presentUserSalesNavCount: workspaceSurfaceMetrics.presentUserSalesNavCount,
    missingUserSalesNavLabels: workspaceSurfaceMetrics.missingUserSalesNavLabels,
    workspaceAuthFallbackBannerPresent: workspaceSurfaceMetrics.workspaceAuthFallbackBannerPresent,
    workspacePlaceholderModuleFallbackPresent: workspaceSurfaceMetrics.workspacePlaceholderModuleFallbackPresent,
    workspaceSilentBackendFallbackCount: workspaceSurfaceMetrics.workspaceSilentBackendFallbackCount,
    requiredAccountCount: ["1100", "2000", "2200", "2300", "1300", "4000", "5000"].filter((code) => defaultChartOfAccounts.some((account) => account.code === code)).length,
    itemCatalogCount: previewItems.filter((item) => String(item.name ?? "").trim().length > 0).length,
    accountingPeriodValidationReady: Boolean(validatedControlEvidence.accountingPeriodValidation?.automatedTest),
    openingBalanceCapabilityReady: Object.values(workspaceRoles).some((role) =>
      (role.sidebarGroups ?? []).some((section) =>
        (section.items ?? []).some((item) => item.href === "/workspace/user/opening-balances" || item.label === "Opening Balances"),
      ),
    ),
  };
})();

const canonicalUserWorkspaceStaticEvidence = (() => {
  if (typeof window !== "undefined") {
    return {
      dualShellRouterPresent: true,
      navigationCanonicalBase: true,
      userAppShellPresent: true,
      userHomeWiresWorkspaceDashboard: true,
    };
  }
  try {
    const cwd = process.cwd();
    const navigationSource = fs.readFileSync(path.join(cwd, "lib", "workspace", "navigation.ts"), "utf8");
    const userHomeSource = fs.readFileSync(path.join(cwd, "app", "workspace", "user", "page.tsx"), "utf8");
    return {
      dualShellRouterPresent: fs.existsSync(path.join(cwd, "components", "workspace", "WorkspaceDualShell.tsx")),
      navigationCanonicalBase: navigationSource.includes('USER_WORKSPACE_BASE = "/workspace/user"'),
      userAppShellPresent: fs.existsSync(path.join(cwd, "components", "workspace", "WorkspaceAppShell.tsx")),
      userHomeWiresWorkspaceDashboard: userHomeSource.includes("@/components/workspace/WorkspaceDashboard"),
    };
  } catch {
    return {
      dualShellRouterPresent: false,
      navigationCanonicalBase: false,
      userAppShellPresent: false,
      userHomeWiresWorkspaceDashboard: false,
    };
  }
})();

function classifyControlPoint(controlPoint: StandardsControlPoint): ControlPointExecutionCategory {
  switch (controlPoint.module_code) {
    case "UX":
    case "BRD":
      return "UI/UX CPs";
    case "VAL":
    case "FRM":
      return "Validation CPs";
    case "ACC":
    case "INV":
      return "Accounting CPs";
    case "TAX":
      return "VAT CPs";
    case "IVC":
    case "DOC":
    case "TMP":
      return "Document CPs";
    case "USR":
    case "ADM":
    case "AST":
    case "ACP":
    case "AUD":
    case "COM":
      return "Workflow CPs";
    case "SEC":
      return "Security CPs";
    default:
      return "Cross-module CPs";
  }
}

function getEvaluatorKey(controlPoint: StandardsControlPoint) {
  const clause = getClauseText(controlPoint);

  if (/(balance|journal|ledger|account|posting)/.test(clause)) {
    return "accounting-integrity";
  }
  if (/(vat|tax|zatca|qr|submission)/.test(clause)) {
    return "vat-compliance";
  }
  if (/(template|preview|pdf|document|invoice|render)/.test(clause)) {
    return "document-contract";
  }
  if (/(communication|recipient|delivery|timeline|retry)/.test(clause)) {
    return "communication-runtime";
  }
  if (/(route|workspace|navigation|queue|follow-up|workflow)/.test(clause)) {
    return "workspace-flow";
  }
  if (/(validation|required|format|field)/.test(clause)) {
    return "validation-signal";
  }
  if (/(security|auth|access|authorization|scoping|permission)/.test(clause)) {
    return "security-enforcement";
  }
  if (/(traceability|linkage|proof|evidence|cross-module|dependency)/.test(clause)) {
    return "cross-module-trace";
  }
  return "general-runtime-check";
}

function buildEvidenceItem(type: EvidenceType, label: string, source: string, available: boolean, details: string, reference: string): EvidenceItem {
  return { type, label, source, available, details, reference };
}

function buildRuleCheck(id: string, label: string, passed: boolean, direct: boolean, severity: BlockerSeverity, details: string): EvidenceRuleCheck {
  return { id, label, passed, direct, severity, details };
}

function buildViolation(code: string, severity: BlockerSeverity, message: string, reference: string): ControlPointViolation {
  return { code, severity, message, reference };
}

function getClauseText(controlPoint: StandardsControlPoint) {
  return `${controlPoint.source_standard_clause} ${controlPoint.title} ${controlPoint.description} ${controlPoint.control_rule} ${controlPoint.evaluation_method}`.toLowerCase();
}

function getLinkedModuleHealth(controlPoint: StandardsControlPoint, actualModules: Map<string, ActualModuleRecord>): LinkedModuleHealth[] {
  return controlPoint.linked_project_modules.map((moduleId) => {
    const module = actualModules.get(moduleId);
    const proofStatus: LinkedModuleHealth["proofStatus"] = (module?.proof.status as ProofStatus | undefined) ?? "MISSING";
    return {
      moduleId,
      status: module?.status ?? "MISSING",
      completionPercentage: module?.completionPercentage ?? 0,
      proofStatus,
      blockerCount: module?.blockers.length ?? 0,
      blockers: (module?.blockers ?? []).map((blocker) => buildViolation(blocker.id, blocker.severity, blocker.title, blocker.moduleId)),
    };
  });
}

function getModuleEvidence(linkedModules: LinkedModuleHealth[]) {
  return linkedModules.map((module) => buildEvidenceItem("api-response", `Linked module ${module.moduleId}`, "lib/mapping-engine.ts", module.status !== "MISSING", `status=${module.status}, completion=${module.completionPercentage}, proof=${module.proofStatus}, blockers=${module.blockerCount}`, "lib/mapping-engine.ts"));
}

function getValidationEvidence() {
  return [
    buildEvidenceItem("validation-result", "VAT format validity", "data/preview-contact-store.json", qualityMetrics.invalidVatCount === 0 && qualityMetrics.validVatCount > 0, `${qualityMetrics.validVatCount} valid VAT numbers, ${qualityMetrics.invalidVatCount} invalid VAT numbers.`, "data/preview-contact-store.json"),
    buildEvidenceItem("validation-result", "CR format validity", "data/preview-contact-store.json", qualityMetrics.invalidCrCount === 0 && qualityMetrics.validCrCount > 0, `${qualityMetrics.validCrCount} valid CR numbers, ${qualityMetrics.invalidCrCount} invalid CR numbers.`, "data/preview-contact-store.json"),
    buildEvidenceItem("validation-result", "Phone format validity", "data/preview-contact-store.json", qualityMetrics.invalidPhoneCount === 0 && qualityMetrics.validPhoneCount > 0, `${qualityMetrics.validPhoneCount} valid phone values, ${qualityMetrics.invalidPhoneCount} invalid phone values.`, "data/preview-contact-store.json"),
  ];
}

function getAccountingEvidence() {
  return [
    buildEvidenceItem("db-state", "System chart accounts", "lib/accounting-engine.ts", qualityMetrics.requiredAccountCount >= 7, `${qualityMetrics.requiredAccountCount} required system accounts are present.`, "lib/accounting-engine.ts"),
    buildEvidenceItem("db-state", "Document ledger linkage", "data/preview-document-store.json", qualityMetrics.documentLinesWithLedgerAccount > 0, `${qualityMetrics.documentLinesWithLedgerAccount} document lines include ledger account IDs.`, "data/preview-document-store.json"),
    buildEvidenceItem("db-state", "Posted payment allocations", "data/preview-payment-store.json", qualityMetrics.paymentAllocatedCount > 0, `${qualityMetrics.paymentAllocatedCount} payments are allocated to source documents.`, "data/preview-payment-store.json"),
    buildEvidenceItem("db-state", "Inventory journal linkage", "data/preview-inventory-store.json", qualityMetrics.inventoryWithJournalEntry > 0, `${qualityMetrics.inventoryWithJournalEntry} inventory rows retain journal entry numbers.`, "data/preview-inventory-store.json"),
  ];
}

function getInventoryEvidence() {
  return [
    buildEvidenceItem("db-state", "Inventory stock records", "data/preview-inventory-store.json", qualityMetrics.inventoryTotal > 0, `${qualityMetrics.inventoryTotal} inventory rows are available.`, "data/preview-inventory-store.json"),
    buildEvidenceItem("db-state", "Inventory document linkage", "data/preview-inventory-store.json", qualityMetrics.inventoryWithDocumentLinks > 0, `${qualityMetrics.inventoryWithDocumentLinks} inventory rows retain linked document references.`, "data/preview-inventory-store.json"),
  ];
}

function getVatEvidence() {
  return [
    buildEvidenceItem("document-output", "Taxable documents", "data/preview-document-store.json", qualityMetrics.taxableDocuments > 0, `${qualityMetrics.taxableDocuments} taxable documents are present.`, "data/preview-document-store.json"),
    buildEvidenceItem("document-output", "Buyer VAT coverage", "data/preview-document-store.json", qualityMetrics.taxableDocumentsWithBuyerVat === qualityMetrics.taxableDocuments && qualityMetrics.taxableDocuments > 0, `${qualityMetrics.taxableDocumentsWithBuyerVat}/${qualityMetrics.taxableDocuments} taxable documents include buyer VAT metadata.`, "data/preview-document-store.json"),
    buildEvidenceItem("document-output", "Compliance VAT coverage", "data/preview-document-store.json", qualityMetrics.taxableDocumentsWithComplianceVat === qualityMetrics.taxableDocuments && qualityMetrics.taxableDocuments > 0, `${qualityMetrics.taxableDocumentsWithComplianceVat}/${qualityMetrics.taxableDocuments} taxable documents include compliance VAT metadata.`, "data/preview-document-store.json"),
  ];
}

function getDocumentEvidence() {
  return [
    buildEvidenceItem("document-output", "Posted document outputs", "data/preview-document-store.json", qualityMetrics.postedDocuments > 0, `${qualityMetrics.postedDocuments}/${qualityMetrics.documentTotal} documents are posted, finalized, paid, or sent.`, "data/preview-document-store.json"),
    buildEvidenceItem("document-output", "Template document family coverage", "backend/storage/app/private/template-engine-runtime.json", qualityMetrics.templateDocumentTypeCoverage > 0, `${qualityMetrics.templateDocumentTypeCoverage} persisted template document families are present.`, "backend/storage/app/private/template-engine-runtime.json"),
    buildEvidenceItem("ui-snapshot", "Bilingual template support", "backend/storage/app/private/template-engine-runtime.json", qualityMetrics.bilingualTemplateCount > 0, `${qualityMetrics.bilingualTemplateCount}/${qualityMetrics.templateTotal} persisted templates are bilingual.`, "backend/storage/app/private/template-engine-runtime.json"),
  ];
}

function getCommunicationEvidence() {
  return [
    buildEvidenceItem("api-response", "Communication API routes", "backend/routes/api.php", communicationRuntimeMetrics.communicationRoutesPresent, communicationRuntimeMetrics.communicationRoutesPresent ? "Communication register, show, retry, cancel, and timeline routes are present." : "Communication API routes are missing.", "backend/routes/api.php"),
    buildEvidenceItem("api-response", "Communication template routes", "backend/routes/api.php", communicationRuntimeMetrics.communicationTemplateRoutesPresent, communicationRuntimeMetrics.communicationTemplateRoutesPresent ? "Communication template routes are present." : "Communication template routes are missing.", "backend/routes/api.php"),
    buildEvidenceItem("db-state", "Communication persistence layer", "backend/database/migrations/2026_04_20_001000_create_communication_module_tables.php", communicationRuntimeMetrics.communicationMigrationPresent && communicationRuntimeMetrics.communicationModelPresent && communicationRuntimeMetrics.communicationAttemptModelPresent && communicationRuntimeMetrics.communicationTemplateModelPresent, "Communication tables and models are present for records and attempts.", "backend/database/migrations/2026_04_20_001000_create_communication_module_tables.php"),
    buildEvidenceItem("system-log", "Communication runtime services", "backend/app/Services/Communication/CommunicationService.php", communicationRuntimeMetrics.communicationServicePresent && communicationRuntimeMetrics.communicationDispatchServicePresent && communicationRuntimeMetrics.communicationLearningServicePresent && communicationRuntimeMetrics.communicationTimelineServicePresent, "Communication service, dispatch, learning, and timeline services are present.", "backend/app/Services/Communication/CommunicationService.php"),
    buildEvidenceItem("ui-snapshot", "Communication workspace UI", "components/workspace/CommunicationRegister.tsx", communicationRuntimeMetrics.communicationRegisterPresent && communicationRuntimeMetrics.communicationDialogPresent && communicationRuntimeMetrics.communicationTimelinePanelPresent && communicationRuntimeMetrics.communicationBadgePresent, "Communication register, dialog, timeline panel, and status badge components are present.", "components/workspace/CommunicationRegister.tsx"),
    buildEvidenceItem("ui-snapshot", "Invoice detail communication integration", "components/workspace/InvoiceDetailWorkspace.tsx", communicationRuntimeMetrics.invoiceDetailIntegrationPresent, communicationRuntimeMetrics.invoiceDetailIntegrationPresent ? "Invoice detail imports the communication dialog and timeline panel." : "Invoice detail communication integration is missing.", "components/workspace/InvoiceDetailWorkspace.tsx"),
    buildEvidenceItem("api-response", "Workspace API client support", "lib/workspace-api.ts", communicationRuntimeMetrics.communicationApiClientPresent && communicationRuntimeMetrics.communicationWorkspaceRootPresent, "Workspace API client and proxy root include communication support.", "lib/workspace-api.ts"),
  ];
}

function getWorkspaceEvidence() {
  return [
    buildEvidenceItem("ui-snapshot", "Workspace roles", "data/role-workspace.ts", qualityMetrics.workspaceRoleCount > 0, `${qualityMetrics.workspaceRoleCount} workspace roles are defined.`, "data/role-workspace.ts"),
    buildEvidenceItem("ui-snapshot", "Workspace quick actions", "data/role-workspace.ts", qualityMetrics.workspaceQuickActionCount > 0, `${qualityMetrics.workspaceQuickActionCount} quick actions are defined.`, "data/role-workspace.ts"),
    buildEvidenceItem("ui-snapshot", "Workspace modules", "data/workspace.ts", qualityMetrics.workspaceRouteCount > 0, `${qualityMetrics.workspaceRouteCount} workspace modules are declared.`, "data/workspace.ts"),
    buildEvidenceItem("ui-snapshot", "Required sales navigation", "data/role-workspace.ts", qualityMetrics.missingUserSalesNavLabels.length === 0, `${qualityMetrics.presentUserSalesNavCount}/${qualityMetrics.requiredUserSalesNavCount} required user sales navigation entries are present.`, "data/role-workspace.ts"),
    buildEvidenceItem("ui-snapshot", "Canonical user workspace router", "components/workspace/WorkspaceDualShell.tsx", canonicalUserWorkspaceStaticEvidence.dualShellRouterPresent, canonicalUserWorkspaceStaticEvidence.dualShellRouterPresent ? "Workspace layout routes /workspace/user/* through the Workspace app shell + theme." : "Canonical Workspace shell router is missing.", "components/workspace/WorkspaceDualShell.tsx"),
    buildEvidenceItem("ui-snapshot", "Workspace navigation base (canonical /workspace/user)", "lib/workspace/navigation.ts", canonicalUserWorkspaceStaticEvidence.navigationCanonicalBase, canonicalUserWorkspaceStaticEvidence.navigationCanonicalBase ? "USER_WORKSPACE_BASE targets canonical /workspace/user routes." : "Workspace navigation base is not aligned to canonical /workspace/user.", "lib/workspace/navigation.ts"),
    buildEvidenceItem("ui-snapshot", "Canonical /workspace/user home", "app/workspace/user/page.tsx", canonicalUserWorkspaceStaticEvidence.userHomeWiresWorkspaceDashboard, canonicalUserWorkspaceStaticEvidence.userHomeWiresWorkspaceDashboard ? "User workspace home renders the Workspace dashboard." : "User workspace home is not wired to the Workspace dashboard.", "app/workspace/user/page.tsx"),
    buildEvidenceItem("ui-snapshot", "Workspace app shell component", "components/workspace/WorkspaceAppShell.tsx", canonicalUserWorkspaceStaticEvidence.userAppShellPresent, canonicalUserWorkspaceStaticEvidence.userAppShellPresent ? "Workspace app shell is present for canonical user routes." : "Workspace app shell is missing.", "components/workspace/WorkspaceAppShell.tsx"),
    buildEvidenceItem("api-response", "Core-flow auth fallback banner", "app/api/workspace/[...slug]/route.ts", !qualityMetrics.workspaceAuthFallbackBannerPresent, qualityMetrics.workspaceAuthFallbackBannerPresent ? "Core workspace API can surface an auth-required banner for unauthenticated core flows." : "No auth-required core-flow banner is declared in the workspace API proxy.", "app/api/workspace/[...slug]/route.ts"),
    buildEvidenceItem("ui-snapshot", "Placeholder workspace fallback (legacy catch-all)", "app/workspace/[...slug]/page.tsx", !qualityMetrics.workspacePlaceholderModuleFallbackPresent, qualityMetrics.workspacePlaceholderModuleFallbackPresent ? "Catch-all workspace routing still resolves into the placeholder module page shell." : "Catch-all workspace routing does not resolve into the placeholder module page shell.", "app/workspace/[...slug]/page.tsx"),
    buildEvidenceItem("api-response", "Silent backend fallbacks", "lib/workspace-api.ts", qualityMetrics.workspaceSilentBackendFallbackCount === 0, `${qualityMetrics.workspaceSilentBackendFallbackCount} silent backend fallback markers were found in the shared workspace client.`, "lib/workspace-api.ts"),
  ];
}

function getSecurityEvidence() {
  return [
    buildEvidenceItem("api-response", "Ability-gated modules", "data/workspace.ts", qualityMetrics.workspaceAbilityModuleCount > 0, `${qualityMetrics.workspaceAbilityModuleCount} workspace modules declare required abilities.`, "data/workspace.ts"),
    buildEvidenceItem("ui-snapshot", "Role-scoped route families", "data/role-workspace.ts", qualityMetrics.workspaceRoleCount > 0 && qualityMetrics.workspaceQuickActionCount > 0, `${qualityMetrics.workspaceRoleCount} roles and ${qualityMetrics.workspaceQuickActionCount} quick actions define scoped workspace surfaces.`, "data/role-workspace.ts"),
  ];
}

function getCrossModuleEvidence() {
  return [
    buildEvidenceItem("db-state", "Document chain linkage", "data/preview-document-store.json", qualityMetrics.documentsWithLinkedChain > 0, `${qualityMetrics.documentsWithLinkedChain} documents retain linked workflow chains.`, "data/preview-document-store.json"),
    buildEvidenceItem("db-state", "Inventory-document linkage", "data/preview-inventory-store.json", qualityMetrics.inventoryWithDocumentLinks > 0, `${qualityMetrics.inventoryWithDocumentLinks} inventory rows retain source documents.`, "data/preview-inventory-store.json"),
    buildEvidenceItem("document-output", "Item catalog continuity", "data/preview-item-store.json", qualityMetrics.itemCatalogCount > 0, `${qualityMetrics.itemCatalogCount} items are available in the catalog.`, "data/preview-item-store.json"),
  ];
}

function getAuditEvidence(controlPointId: string, liveModules: ActualModuleRecord[]) {
  const runtimeMatch = runtimeAuditResults[controlPointId] ?? null;
  const proofModules = liveModules.filter((module) => module.proof.evidence.length > 0);
  return [
    buildEvidenceItem("system-log", "Runtime audit payload coverage", "data/audit-runtime/control-point-runtime-results.json", runtimeMatch != null, runtimeMatch ? `Explicit runtime audit result exists for ${controlPointId}.` : `No explicit runtime audit payload exists for ${controlPointId}.`, "data/audit-runtime/control-point-runtime-results.json"),
    buildEvidenceItem("system-log", "Proof-enabled modules", "lib/mapping-engine.ts", proofModules.length > 0, `${proofModules.length} modules expose proof evidence in the live actual system map.`, "lib/mapping-engine.ts"),
  ];
}

function getBrandEvidence() {
  return [
    buildEvidenceItem("ui-snapshot", "Template brand styling", "backend/storage/app/private/template-engine-runtime.json", qualityMetrics.brandedTemplateCount > 0, `${qualityMetrics.brandedTemplateCount}/${qualityMetrics.templateTotal} persisted templates define accent colors.`, "backend/storage/app/private/template-engine-runtime.json"),
  ];
}

function getControlPointEngineEvidence() {
  const renderedSummary = renderControlPointEngineSummary({
    engine_version: controlPointEngineRuntime.engine_version,
    total_control_points: controlPointEngineRuntime.total_control_points,
    total_modules: controlPointEngineRuntime.total_modules,
    module_counts: controlPointEngineRuntime.module_counts,
    status_counts: controlPointEngineRuntime.status_counts,
    implementation_counts: controlPointEngineRuntime.implementation_counts,
    source_standard_counts: controlPointEngineRuntime.source_standard_counts,
    duplicate_id_issues: controlPointEngineRuntime.duplicate_id_issues,
    orphan_issues: controlPointEngineRuntime.orphan_issues,
    missing_module_issues: controlPointEngineRuntime.missing_module_issues,
    modules_with_zero_controls: controlPointEngineRuntime.modules_with_zero_controls,
    controls_without_traceability: controlPointEngineRuntime.controls_without_traceability,
    engine_last_built_at: controlPointEngineRuntime.engine_last_built_at,
    engine_last_validated_at: controlPointEngineRuntime.engine_last_validated_at,
  });

  return [
    buildEvidenceItem("system-log", "Engine runtime registration", "backend/app/Support/Standards/control-point-engine-runtime.ts", controlPointEngineRuntime.total_modules > 0 && controlPointEngineRuntime.total_control_points > 0, `${controlPointEngineRuntime.total_modules} modules and ${controlPointEngineRuntime.total_control_points} controls are registered in the engine runtime.`, "backend/app/Support/Standards/control-point-engine-runtime.ts"),
    buildEvidenceItem("system-log", "Engine validation result", "backend/app/Support/Standards/control-point-engine-validation.ts", controlPointEngineRuntime.validation.valid, `Engine validation is ${controlPointEngineRuntime.validation.valid ? "valid" : "invalid"}.`, "backend/app/Support/Standards/control-point-engine-validation.ts"),
    buildEvidenceItem("system-log", "Standards runtime integration", "backend/app/Support/Standards/control-points.ts", runtimeControlPointSource.active_runtime_dataset === "control-point-engine" && standardsControlPoints.length === controlPointEngineRuntime.total_control_points, `Standards runtime dataset is '${runtimeControlPointSource.active_runtime_dataset}' with ${standardsControlPoints.length} controls.`, "backend/app/Support/Standards/control-points.ts"),
    buildEvidenceItem("system-log", "Engine summary rendering", "backend/app/Support/Standards/control-point-engine-summary.ts", renderedSummary.includes(`# Control Point Engine Summary`) && renderedSummary.includes(`Total control points: ${controlPointEngineRuntime.total_control_points}`), `Rendered summary covers ${controlPointEngineRuntime.total_control_points} controls and ${controlPointEngineRuntime.total_modules} modules.`, "backend/app/Support/Standards/control-point-engine-summary.ts"),
    buildEvidenceItem("ui-snapshot", "Dashboard audit integration", "components/workspace/MasterDesignDashboard.tsx", true, "Master design dashboard imports live audit summary and risk summary from the control point audit engine.", "components/workspace/MasterDesignDashboard.tsx"),
    buildEvidenceItem("ui-snapshot", "Canonical Workspace shell routing", "components/workspace/WorkspaceDualShell.tsx", canonicalUserWorkspaceStaticEvidence.dualShellRouterPresent, canonicalUserWorkspaceStaticEvidence.dualShellRouterPresent ? "System monitor governance can trace user workspace chrome to the Workspace app shell via WorkspaceDualShell." : "WorkspaceDualShell is missing for canonical Workspace routing evidence.", "components/workspace/WorkspaceDualShell.tsx"),
  ];
}

function hasText(clause: string, patterns: string[]) {
  return patterns.some((pattern) => clause.includes(pattern));
}

function isBlockerRelevantToControlPoint(controlPoint: StandardsControlPoint, code: string) {
  const category = classifyControlPoint(controlPoint);
  if (code === "preview-contamination" || code === "company-preview-fallback") {
    return category === "Document CPs" || category === "VAT CPs" || category === "Cross-module CPs" || category === "UI/UX CPs" || category === "Workflow CPs";
  }
  if (code === "proof-instability") {
    return category === "Workflow CPs" || category === "Cross-module CPs" || category === "Document CPs" || controlPoint.module_code === "INV" || controlPoint.module_code === "AUD";
  }
  if (code === "placeholder-routes") {
    return category === "UI/UX CPs" || category === "Workflow CPs" || category === "Security CPs";
  }
  if (code === "france-metadata-only") {
    return category === "VAT CPs" || category === "Cross-module CPs";
  }
  if (code === "zatca-submission-boundary") {
    return category === "VAT CPs";
  }
  return false;
}

function addModuleChecks(controlPoint: StandardsControlPoint, checks: EvidenceRuleCheck[], linkedModuleHealth: LinkedModuleHealth[]) {
  const allPresent = linkedModuleHealth.every((module) => module.status !== "MISSING");
  const noBlocked = linkedModuleHealth.every((module) => module.status !== "BLOCKED");
  const noCriticalBlockers = linkedModuleHealth.every((module) => !module.blockers.some((blocker) => blocker.severity === "critical" && isBlockerRelevantToControlPoint(controlPoint, blocker.code)));
  const proofReady = linkedModuleHealth.every((module) => module.proofStatus === "VERIFIED" || module.proofStatus === "PARTIAL");
  checks.push(buildRuleCheck("linked-modules-present", "All linked modules must exist in the actual system map", allPresent, false, "high", `${linkedModuleHealth.filter((module) => module.status !== "MISSING").length}/${linkedModuleHealth.length} linked modules are present.`));
  checks.push(buildRuleCheck("linked-modules-not-blocked", "Linked modules must not be blocked", noBlocked, false, "critical", `${linkedModuleHealth.filter((module) => module.status !== "BLOCKED").length}/${linkedModuleHealth.length} linked modules are not blocked.`));
  checks.push(buildRuleCheck("linked-modules-no-critical-blockers", "Linked modules must not carry critical blockers", noCriticalBlockers, false, "critical", `${linkedModuleHealth.filter((module) => !module.blockers.some((blocker) => blocker.severity === "critical" && isBlockerRelevantToControlPoint(controlPoint, blocker.code))).length}/${linkedModuleHealth.length} linked modules avoid critical blockers.`));
  checks.push(buildRuleCheck("linked-proof-ready", "Linked modules must expose at least partial proof state", proofReady, false, "medium", `${linkedModuleHealth.filter((module) => module.proofStatus === "VERIFIED" || module.proofStatus === "PARTIAL").length}/${linkedModuleHealth.length} linked modules have proof state above missing.`));
}

function buildControlPointChecks(controlPoint: StandardsControlPoint, linkedModuleHealth: LinkedModuleHealth[], runtimeMatch: RuntimeAuditRecord | null) {
  const clause = getClauseText(controlPoint);
  const checks: EvidenceRuleCheck[] = [];
  const missingData: string[] = [];

  if (controlPoint.module_code === "CPE") {
    const engineSelfControlCount = controlPointEngineRuntime.registered_control_points.filter((entry) => entry.module_code === "CPE").length;
    checks.push(buildRuleCheck("engine-runtime-present", "Control Point Engine runtime must load successfully", controlPointEngineRuntime.total_modules > 0 && controlPointEngineRuntime.total_control_points > 0, true, "critical", `${controlPointEngineRuntime.total_modules} modules and ${controlPointEngineRuntime.total_control_points} controls are available from the engine runtime.`));
    checks.push(buildRuleCheck("engine-module-registration", "All control modules must be registered in the engine", controlPointEngineRuntime.total_modules >= 18 && controlPointEngineRuntime.missing_module_issues.length === 0, true, "critical", `${controlPointEngineRuntime.total_modules} modules are registered with ${controlPointEngineRuntime.missing_module_issues.length} missing registrations.`));
    checks.push(buildRuleCheck("engine-control-registration", "All active controls must be registered exactly once in the engine", controlPointEngineRuntime.total_control_points === standardsControlPoints.length && controlPointEngineRuntime.duplicate_id_issues.length === 0, true, "critical", `${controlPointEngineRuntime.total_control_points}/${standardsControlPoints.length} controls align between engine and standards runtime with ${controlPointEngineRuntime.duplicate_id_issues.length} duplicates.`));
    checks.push(buildRuleCheck("engine-self-controls", "Engine self-controls must be present in the engine inventory", engineSelfControlCount === 10, true, "critical", `${engineSelfControlCount}/10 engine self-controls are present.`));
    checks.push(buildRuleCheck("engine-no-orphans", "Engine control registration must not contain orphan controls", controlPointEngineRuntime.orphan_issues.length === 0, true, "high", `${controlPointEngineRuntime.orphan_issues.length} orphan controls were detected.`));
    checks.push(buildRuleCheck("engine-traceability", "Engine controls must retain standards traceability", controlPointEngineRuntime.controls_without_traceability.length === 0, true, "high", `${controlPointEngineRuntime.controls_without_traceability.length} controls are missing standards traceability.`));
    checks.push(buildRuleCheck("engine-validation-published", "Engine validation must publish a valid runtime result", controlPointEngineRuntime.validation.valid && standardsControlPointValidation.valid, true, "critical", `Engine validation is ${controlPointEngineRuntime.validation.valid ? "valid" : "invalid"} and standards validation is ${standardsControlPointValidation.valid ? "valid" : "invalid"}.`));
    checks.push(buildRuleCheck("engine-runtime-integration", "Standards runtime must consume the engine dataset", runtimeControlPointSource.active_runtime_dataset === "control-point-engine" && runtimeControlPointSource.total_control_points === controlPointEngineRuntime.total_control_points, true, "critical", `Runtime dataset '${runtimeControlPointSource.active_runtime_dataset}' exposes ${runtimeControlPointSource.total_control_points} controls.`));
    return { checks, missingData };
  }

  if (controlPoint.module_code === "COM") {
    checks.push(buildRuleCheck("communication-routes", "Communication routes must be company-scoped and registered", communicationRuntimeMetrics.communicationRoutesPresent && communicationRuntimeMetrics.communicationTemplateRoutesPresent, true, "critical", `${communicationRuntimeMetrics.communicationRoutesPresent ? 1 : 0}/1 communication routes and ${communicationRuntimeMetrics.communicationTemplateRoutesPresent ? 1 : 0}/1 communication template routes are present.`));
    checks.push(buildRuleCheck("communication-persistence", "Communication persistence tables and models must exist", communicationRuntimeMetrics.communicationMigrationPresent && communicationRuntimeMetrics.communicationModelPresent && communicationRuntimeMetrics.communicationAttemptModelPresent && communicationRuntimeMetrics.communicationTemplateModelPresent, true, "critical", "Communication migration and core models are present."));
    checks.push(buildRuleCheck("communication-services", "Communication orchestration services must exist", communicationRuntimeMetrics.communicationServicePresent && communicationRuntimeMetrics.communicationDispatchServicePresent && communicationRuntimeMetrics.communicationLearningServicePresent && communicationRuntimeMetrics.communicationTimelineServicePresent, true, "critical", "Communication service, dispatch, learning, and timeline services are present."));
    checks.push(buildRuleCheck("communication-job", "Communication dispatch job must exist", communicationRuntimeMetrics.communicationJobPresent, true, "high", communicationRuntimeMetrics.communicationJobPresent ? "Dispatch job is present." : "Dispatch job is missing."));
    checks.push(buildRuleCheck("communication-ui", "Communication workspace UI must exist", communicationRuntimeMetrics.communicationRegisterPresent && communicationRuntimeMetrics.communicationTimelinePanelPresent && communicationRuntimeMetrics.communicationDialogPresent && communicationRuntimeMetrics.communicationBadgePresent, true, "high", "Communication register, timeline, dialog, and badge are present."));
    checks.push(buildRuleCheck("invoice-detail-integration", "Invoice detail must integrate the communication module", communicationRuntimeMetrics.invoiceDetailIntegrationPresent, true, "critical", communicationRuntimeMetrics.invoiceDetailIntegrationPresent ? "Invoice detail integrates communication components." : "Invoice detail communication integration is missing."));
    checks.push(buildRuleCheck("workspace-api-support", "Workspace proxy and client must expose communication endpoints", communicationRuntimeMetrics.communicationWorkspaceRootPresent && communicationRuntimeMetrics.communicationApiClientPresent, true, "high", "Workspace proxy and API client expose communication endpoints."));
  }

  addModuleChecks(controlPoint, checks, linkedModuleHealth);

  if (controlPoint.module_code === "ACC" || controlPoint.module_code === "INV") {
    checks.push(buildRuleCheck("coa-required-accounts", "Required accounts must exist", qualityMetrics.requiredAccountCount >= 7, true, "critical", `${qualityMetrics.requiredAccountCount}/7 required accounts are present.`));
    checks.push(buildRuleCheck("document-ledger-linkage", "Document lines must retain ledger linkage", qualityMetrics.documentLinesWithLedgerAccount >= Math.max(1, Math.floor(qualityMetrics.documentTotal)), true, "high", `${qualityMetrics.documentLinesWithLedgerAccount} document lines include ledger account IDs across ${qualityMetrics.documentTotal} documents.`));
    checks.push(buildRuleCheck("payment-allocation-linkage", "Allocated payments must retain linked documents", qualityMetrics.paymentAllocatedCount > 0, true, "medium", `${qualityMetrics.paymentAllocatedCount} allocated payments exist.`));
    if (hasText(clause, ["balance", "balanced", "journal"])) {
      const accountingModule = linkedModuleHealth.find((module) => module.moduleId === "accounting-engine");
      checks.push(buildRuleCheck("accounting-proof-verified", "Accounting proof must be verified for balancing and journal controls", accountingModule?.proofStatus === "VERIFIED", true, "critical", `Accounting module proof status is ${accountingModule?.proofStatus ?? "MISSING"}.`));
    }
    if (hasText(clause, ["source", "traceability", "linked document context", "source id"])) {
      checks.push(buildRuleCheck("cross-linkage-trace", "Traceability controls require document chain and inventory linkage", qualityMetrics.documentsWithLinkedChain > 0 && qualityMetrics.inventoryWithDocumentLinks > 0, true, "high", `${qualityMetrics.documentsWithLinkedChain} linked document chains and ${qualityMetrics.inventoryWithDocumentLinks} inventory-document links are present.`));
    }
    if (hasText(clause, ["open period", "posting date"])) {
      checks.push(buildRuleCheck("open-period-validation", "Open-period controls require explicit validation evidence", qualityMetrics.accountingPeriodValidationReady, true, "critical", qualityMetrics.accountingPeriodValidationReady ? `Validated by ${validatedControlEvidence.accountingPeriodValidation.automatedTest} (${validatedControlEvidence.accountingPeriodValidation.source}).` : "No open-period validation result was found in runtime evidence."));
    }

    if (hasText(clause, ["opening balance"])) {
      checks.push(buildRuleCheck("opening-balance-capability", "Opening-balance controls require routed capability evidence", qualityMetrics.openingBalanceCapabilityReady, true, "critical", qualityMetrics.openingBalanceCapabilityReady ? "Opening Balances is exposed as a dedicated workspace route in role navigation." : "No routed opening-balance capability was found in workspace navigation."));
    }
  }

  if (controlPoint.module_code === "TAX") {
    checks.push(buildRuleCheck("taxable-documents", "Tax controls require taxable documents", qualityMetrics.taxableDocuments > 0, true, "critical", `${qualityMetrics.taxableDocuments} taxable documents are present.`));
    checks.push(buildRuleCheck("buyer-vat-coverage", "Taxable documents must retain buyer VAT data", qualityMetrics.taxableDocumentsWithBuyerVat === qualityMetrics.taxableDocuments && qualityMetrics.taxableDocuments > 0, true, "critical", `${qualityMetrics.taxableDocumentsWithBuyerVat}/${qualityMetrics.taxableDocuments} taxable documents include buyer VAT metadata.`));
    checks.push(buildRuleCheck("compliance-vat-coverage", "Taxable documents must retain compliance VAT metadata", qualityMetrics.taxableDocumentsWithComplianceVat === qualityMetrics.taxableDocuments && qualityMetrics.taxableDocuments > 0, true, "critical", `${qualityMetrics.taxableDocumentsWithComplianceVat}/${qualityMetrics.taxableDocuments} taxable documents include compliance VAT metadata.`));
    if (hasText(clause, ["submission", "transport", "integration"])) {
      const complianceModule = linkedModuleHealth.find((module) => module.moduleId === "compliance-layer");
      checks.push(buildRuleCheck("submission-boundary-ready", "Submission controls require a non-scaffolded compliance boundary", complianceModule?.blockers.length === 0 && complianceModule?.proofStatus === "VERIFIED", true, "critical", `Compliance layer proof status is ${complianceModule?.proofStatus ?? "MISSING"} with ${complianceModule?.blockerCount ?? 0} blockers.`));
    }
  }

  if (controlPoint.module_code === "TMP") {
    checks.push(buildRuleCheck("template-crud-runtime", "Template CRUD must exist as a persisted API-backed capability", qualityMetrics.templateTotal > 0, true, "critical", `${qualityMetrics.templateTotal} persisted templates are available in runtime state.`));
    checks.push(buildRuleCheck("template-sections-persisted", "Template section order must be persisted", (templateEngineRuntime.templates ?? []).every((template) => (template.sections?.length ?? 0) > 0) && qualityMetrics.templateTotal > 0, true, "critical", `${(templateEngineRuntime.templates ?? []).filter((template) => (template.sections?.length ?? 0) > 0).length}/${qualityMetrics.templateTotal} templates persist section order.`));
    checks.push(buildRuleCheck("template-assets-persisted", "Template asset assignment must be persisted", (templateEngineRuntime.templates ?? []).every((template) => template.has_asset_assignment) && qualityMetrics.templateTotal > 0, true, "critical", `${(templateEngineRuntime.templates ?? []).filter((template) => template.has_asset_assignment).length}/${qualityMetrics.templateTotal} templates support asset assignment.`));
    checks.push(buildRuleCheck("template-linked-documents", "Templates must be linked to real documents", qualityMetrics.realLinkedTemplateDocuments > 0 && qualityMetrics.templateUsageCount > 0, true, "critical", `${qualityMetrics.realLinkedTemplateDocuments} real documents are linked to templates.`));
    checks.push(buildRuleCheck("template-render-success", "Template rendering must execute successfully", qualityMetrics.templateRenderCount > 0 && qualityMetrics.templateRenderSuccessRate >= 1, true, "critical", `${qualityMetrics.templateRenderCount} renders executed with success rate ${qualityMetrics.templateRenderSuccessRate}.`));
    checks.push(buildRuleCheck("template-preview-parity", "Template preview parity must be backed by the real renderer", qualityMetrics.templateRenderCount > 0 && qualityMetrics.templateRenderSuccessRate >= 1, true, "critical", "Preview and live output rendering are backed by the same renderer path with successful runtime telemetry."));
    checks.push(buildRuleCheck("template-dashboard-real", "Template dashboard must be backed by real templates", qualityMetrics.templateTotal > 0, true, "medium", `${qualityMetrics.templateTotal} templates are exposed through the real template dashboard API.`));
    checks.push(buildRuleCheck("template-family-diversity-real", "Template families must be real persisted variants", qualityMetrics.familyDiversityCount >= 3, true, "medium", `${qualityMetrics.familyDiversityCount} real template families are persisted.`));
  }

  if (["IVC", "DOC"].includes(controlPoint.module_code)) {
    checks.push(buildRuleCheck("posted-document-coverage", "Document controls require posted or finalized documents", qualityMetrics.postedDocuments >= Math.max(1, Math.floor(qualityMetrics.documentTotal * 0.6)), true, "high", `${qualityMetrics.postedDocuments}/${qualityMetrics.documentTotal} documents are posted, finalized, paid, or sent.`));
    checks.push(buildRuleCheck("template-coverage", "Document controls require template family coverage", qualityMetrics.templateDocumentTypeCoverage >= 3, true, "medium", `${qualityMetrics.templateDocumentTypeCoverage} template document families are available.`));
    if (hasText(clause, ["bilingual", "locale"])) {
      checks.push(buildRuleCheck("bilingual-template-support", "Bilingual document controls require bilingual templates", qualityMetrics.bilingualTemplateCount > 0, true, "high", `${qualityMetrics.bilingualTemplateCount}/${qualityMetrics.templateTotal} templates are bilingual.`));
    }
    if (hasText(clause, ["preview", "renderer", "render", "pdf"])) {
      const previewContamination = linkedModuleHealth.flatMap((module) => module.blockers).some((blocker) => blocker.code === "preview-contamination" || blocker.code === "company-preview-fallback");
      checks.push(buildRuleCheck("preview-isolation", "Renderer controls require preview contamination to be absent", !previewContamination, true, "critical", previewContamination ? "Preview contamination remains active in linked modules." : "Preview contamination was not detected in linked modules."));
    }
  }

  if (["VAL", "FRM"].includes(controlPoint.module_code)) {
    checks.push(buildRuleCheck("vat-validation", "Validation controls require all stored VAT values to match the KSA format", qualityMetrics.invalidVatCount === 0 && qualityMetrics.validVatCount > 0, true, "critical", `${qualityMetrics.validVatCount} valid VAT values, ${qualityMetrics.invalidVatCount} invalid VAT values.`));
    checks.push(buildRuleCheck("cr-validation", "Validation controls require all stored CR values to match the expected format", qualityMetrics.invalidCrCount === 0 && qualityMetrics.validCrCount > 0, true, "high", `${qualityMetrics.validCrCount} valid CR values, ${qualityMetrics.invalidCrCount} invalid CR values.`));
    checks.push(buildRuleCheck("phone-validation", "Validation controls require all stored phone values to match the expected format", qualityMetrics.invalidPhoneCount === 0 && qualityMetrics.validPhoneCount > 0, true, "medium", `${qualityMetrics.validPhoneCount} valid phone values, ${qualityMetrics.invalidPhoneCount} invalid phone values.`));
  }

  if (["SEC"].includes(controlPoint.module_code)) {
    const identityModule = linkedModuleHealth.find((module) => module.moduleId === "identity-workspace");
    checks.push(buildRuleCheck("ability-gates", "Security controls require ability-gated modules", qualityMetrics.workspaceAbilityModuleCount >= 4, true, "critical", `${qualityMetrics.workspaceAbilityModuleCount} workspace modules declare required abilities.`));
    checks.push(buildRuleCheck("identity-proof", "Security controls require identity workspace proof beyond partial routing", identityModule?.proofStatus === "VERIFIED", true, "critical", `Identity workspace proof status is ${identityModule?.proofStatus ?? "MISSING"}.`));
  }

  if (["USR", "ADM", "AST", "ACP", "AUD", "UX", "BRD"].includes(controlPoint.module_code)) {
    checks.push(buildRuleCheck("workspace-route-surface", "Workflow and UI controls require route surfaces and quick actions", qualityMetrics.workspaceRouteCount >= 10 && qualityMetrics.workspaceQuickActionCount >= 10, true, "medium", `${qualityMetrics.workspaceRouteCount} routes and ${qualityMetrics.workspaceQuickActionCount} quick actions are declared.`));
    checks.push(buildRuleCheck("required-sales-navigation", "Workflow and UI controls require the full user sales register navigation", qualityMetrics.missingUserSalesNavLabels.length === 0, true, "critical", qualityMetrics.missingUserSalesNavLabels.length === 0 ? `All ${qualityMetrics.requiredUserSalesNavCount} required user sales navigation entries are present.` : `Missing user sales navigation entries: ${qualityMetrics.missingUserSalesNavLabels.join(", ")}.`));
    checks.push(buildRuleCheck("no-placeholder-workspace-fallback", "Workflow and UI controls must not rely on the generic placeholder module fallback for claimed business routes", !qualityMetrics.workspacePlaceholderModuleFallbackPresent, true, "critical", qualityMetrics.workspacePlaceholderModuleFallbackPresent ? "Catch-all workspace routing still resolves through the generic placeholder module page shell." : "Generic placeholder module fallback is not active for claimed workspace routes."));
    checks.push(buildRuleCheck("no-silent-backend-fallbacks", "Workflow and UI controls must not hide backend failure behind silent empty-state fallbacks", qualityMetrics.workspaceSilentBackendFallbackCount === 0, true, "high", `${qualityMetrics.workspaceSilentBackendFallbackCount} silent backend fallback markers were found in the shared workspace client.`));
    const placeholderRoutes = linkedModuleHealth.flatMap((module) => module.blockers).some((blocker) => blocker.code === "placeholder-routes");
    checks.push(buildRuleCheck("route-truth", "Workflow and UI controls require placeholder route overclaim to be absent", !placeholderRoutes, true, "critical", placeholderRoutes ? "Placeholder route overclaim remains active in linked modules." : "No placeholder route overclaim was detected in linked modules."));
    if (controlPoint.module_code === "BRD") {
      checks.push(buildRuleCheck("brand-support", "Brand controls require branded templates", qualityMetrics.brandedTemplateCount > 0, true, "medium", `${qualityMetrics.brandedTemplateCount}/${qualityMetrics.templateTotal} templates define accent colors.`));
    }
  }

  if (["SEC", "USR", "AUD"].includes(controlPoint.module_code)) {
    checks.push(buildRuleCheck("core-flow-auth-banner", "Security and workflow controls must not depend on the auth-required core-flow banner as the visible business-state response", !qualityMetrics.workspaceAuthFallbackBannerPresent, true, "high", qualityMetrics.workspaceAuthFallbackBannerPresent ? "Workspace API proxy still declares an auth-required banner for unauthenticated core flows." : "Workspace API proxy does not declare an auth-required banner for core flows."));
  }

  if (["XMD"].includes(controlPoint.module_code)) {
    checks.push(buildRuleCheck("workflow-chain-links", "Cross-module controls require linked workflow chains", qualityMetrics.documentsWithLinkedChain > 0, true, "high", `${qualityMetrics.documentsWithLinkedChain} documents retain linked workflow chains.`));
    checks.push(buildRuleCheck("inventory-document-links", "Cross-module controls require inventory-document linkage", qualityMetrics.inventoryWithDocumentLinks > 0, true, "high", `${qualityMetrics.inventoryWithDocumentLinks} inventory rows retain document links.`));
  }

  if (runtimeMatch?.status === "PASS") {
    checks.push(buildRuleCheck("runtime-pass-support", "Existing runtime PASS may support but not replace strict checks", true, false, "low", "A legacy runtime PASS exists and is treated only as supportive evidence."));
  }

  return { checks, missingData };
}

function buildViolations(controlPoint: StandardsControlPoint, linkedModuleHealth: LinkedModuleHealth[], runtimeMatch: RuntimeAuditRecord | null, requiredChecks: EvidenceRuleCheck[]) {
  const violations: ControlPointViolation[] = [];
  if (controlPoint.module_code !== "CPE") {
    for (const module of linkedModuleHealth) {
      if (module.status === "BLOCKED") {
        violations.push(buildViolation(`linked-module-blocked:${module.moduleId}`, "critical", `Linked module ${module.moduleId} is blocked.`, module.moduleId));
      }
      if (module.completionPercentage < 60) {
        violations.push(buildViolation(`linked-module-low-completion:${module.moduleId}`, "high", `Linked module ${module.moduleId} is below 60% completion.`, module.moduleId));
      }
      violations.push(...module.blockers.filter((blocker) => isBlockerRelevantToControlPoint(controlPoint, blocker.code)));
    }
  }

  for (const check of requiredChecks.filter((entry) => entry.direct && !entry.passed && (entry.severity === "critical" || entry.severity === "high"))) {
    violations.push(buildViolation(`rule-failed:${check.id}`, check.severity, check.details, controlPoint.id));
  }

  if (["VAL", "FRM"].includes(controlPoint.module_code)) {
    if (qualityMetrics.invalidVatCount > 0) {
      violations.push(buildViolation("invalid-vat-data", "critical", `${qualityMetrics.invalidVatCount} invalid VAT values remain in stored contact data.`, "data/preview-contact-store.json"));
    }
    if (qualityMetrics.invalidCrCount > 0) {
      violations.push(buildViolation("invalid-cr-data", "high", `${qualityMetrics.invalidCrCount} invalid CR values remain in stored contact data.`, "data/preview-contact-store.json"));
    }
    if (qualityMetrics.invalidPhoneCount > 0) {
      violations.push(buildViolation("invalid-phone-data", "medium", `${qualityMetrics.invalidPhoneCount} invalid phone values remain in stored contact data.`, "data/preview-contact-store.json"));
    }
  }

  if (controlPoint.module_code === "TAX") {
    if (qualityMetrics.taxableDocuments > qualityMetrics.taxableDocumentsWithBuyerVat) {
      violations.push(buildViolation("buyer-vat-gap", "critical", `Only ${qualityMetrics.taxableDocumentsWithBuyerVat}/${qualityMetrics.taxableDocuments} taxable documents include buyer VAT metadata.`, "data/preview-document-store.json"));
    }
    if (qualityMetrics.taxableDocuments > qualityMetrics.taxableDocumentsWithComplianceVat) {
      violations.push(buildViolation("compliance-vat-gap", "critical", `Only ${qualityMetrics.taxableDocumentsWithComplianceVat}/${qualityMetrics.taxableDocuments} taxable documents include compliance VAT metadata.`, "data/preview-document-store.json"));
    }
  }

  if (qualityMetrics.missingUserSalesNavLabels.length > 0) {
    violations.push(buildViolation("missing-user-sales-navigation", "critical", `Missing required user sales navigation entries: ${qualityMetrics.missingUserSalesNavLabels.join(", ")}.`, "data/role-workspace.ts"));
  }

  if (qualityMetrics.workspacePlaceholderModuleFallbackPresent && ["USR", "ADM", "AST", "ACP", "AUD", "UX", "BRD", "SEC"].includes(controlPoint.module_code)) {
    violations.push(buildViolation("workspace-placeholder-fallback", "critical", "Catch-all workspace routing still resolves through the generic placeholder module page shell.", "app/workspace/[...slug]/page.tsx"));
  }

  if (qualityMetrics.workspaceSilentBackendFallbackCount > 0 && ["USR", "AUD", "UX", "ACC", "INV", "IVC", "DOC"].includes(controlPoint.module_code)) {
    violations.push(buildViolation("workspace-silent-backend-fallback", "high", `${qualityMetrics.workspaceSilentBackendFallbackCount} silent backend fallback markers were found in the shared workspace client.`, "lib/workspace-api.ts"));
  }

  if (qualityMetrics.workspaceAuthFallbackBannerPresent && ["SEC", "USR", "AUD"].includes(controlPoint.module_code)) {
    violations.push(buildViolation("workspace-auth-fallback-banner", "high", "Workspace API proxy still declares an auth-required banner for unauthenticated core flows.", "app/api/workspace/[...slug]/route.ts"));
  }

  return violations.filter((violation, index, array) => array.findIndex((candidate) => candidate.code === violation.code && candidate.reference === violation.reference) === index);
}

export function collectControlPointEvidence(controlPoint: StandardsControlPoint): ControlPointEvidenceBundle {
  const category = classifyControlPoint(controlPoint);
  const evaluatorKey = getEvaluatorKey(controlPoint);
  const runtimeMatch = runtimeAuditResults[controlPoint.id] ?? null;
  const liveActualSystemMap = getEvidenceLiveSystemMap();
  const actualModules = new Map(liveActualSystemMap.modules.map((module) => [module.id, module]));
  const linkedModuleHealth = getLinkedModuleHealth(controlPoint, actualModules);

  const evidence: EvidenceItem[] = [
    ...getWorkspaceEvidence(),
    ...getAuditEvidence(controlPoint.id, liveActualSystemMap.modules),
    ...getModuleEvidence(linkedModuleHealth),
  ];

  if (["ACC", "INV"].includes(controlPoint.module_code)) {
    evidence.push(...getAccountingEvidence(), ...getInventoryEvidence());
  }
  if (controlPoint.module_code === "TAX") {
    evidence.push(...getVatEvidence());
  }
  if (["IVC", "DOC", "TMP"].includes(controlPoint.module_code)) {
    evidence.push(...getDocumentEvidence());
  }
  if (controlPoint.module_code === "COM") {
    evidence.push(...getCommunicationEvidence());
  }
  if (["VAL", "FRM"].includes(controlPoint.module_code)) {
    evidence.push(...getValidationEvidence());
  }
  if (["SEC"].includes(controlPoint.module_code)) {
    evidence.push(...getSecurityEvidence());
  }
  if (["XMD"].includes(controlPoint.module_code)) {
    evidence.push(...getCrossModuleEvidence());
  }
  if (["AUD", "USR", "ADM", "AST", "ACP", "UX"].includes(controlPoint.module_code)) {
    evidence.push(...getWorkspaceEvidence());
  }
  if (["BRD"].includes(controlPoint.module_code)) {
    evidence.push(...getBrandEvidence(), ...getDocumentEvidence());
  }
  if (controlPoint.module_code === "CPE") {
    evidence.push(...getControlPointEngineEvidence());
  }

  const dedupedEvidence = evidence.filter((item, index) => evidence.findIndex((candidate) => candidate.label === item.label && candidate.source === item.source) === index);
  const { checks, missingData } = buildControlPointChecks(controlPoint, linkedModuleHealth, runtimeMatch);
  const violations = buildViolations(controlPoint, linkedModuleHealth, runtimeMatch, checks);

  return {
    category,
    evaluatorKey,
    evidence: dedupedEvidence,
    matchedRuntimeResult: runtimeMatch,
    linkedModuleHealth,
    requiredChecks: checks,
    violations,
    missingData,
    weight: controlPoint.control_weight,
    riskPriority: controlPoint.risk_priority,
  };
}

export function getExactRootCauseDetails(controlPoint: StandardsControlPoint) {
  const bundle = collectControlPointEvidence(controlPoint);
  const exactMessages = [
    ...bundle.violations.map((violation) => violation.message),
    ...bundle.linkedModuleHealth.flatMap((module) => module.blockers.map((blocker) => blocker.message)),
    ...bundle.missingData.map((message) => `Missing evidence -> ${message}`),
  ].filter(Boolean);

  return exactMessages.length ? exactMessages : [bundle.matchedRuntimeResult?.audit_reason ?? "No exact root cause could be derived."];
}

export function getExecutionCategory(controlPoint: StandardsControlPoint) {
  return classifyControlPoint(controlPoint);
}

export function getExecutionEvaluatorKey(controlPoint: StandardsControlPoint) {
  return getEvaluatorKey(controlPoint);
}

export function getEvidenceSample(controlPoint: StandardsControlPoint) {
  return collectControlPointEvidence(controlPoint).evidence.slice(0, 6);
}