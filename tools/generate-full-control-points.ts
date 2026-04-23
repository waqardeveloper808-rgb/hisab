import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import masterDesign from "@/master_design/master_design_vNext.json";
import promptEngine from "@/system/prompt_engine_v4.json";
import { workspaceModules } from "@/data/workspace";
import { ksaPhase1Modules } from "@/data/master-design/ksa-phase1";
import { workspaceRoles } from "@/data/role-workspace";
import { actualSystemMap } from "@/data/system-map/actual-map";
import { controlModuleRegistry, type ControlModuleCode } from "@/backend/app/Support/Standards/v2/control-module-registry";
import type { V2ControlPoint } from "@/backend/app/Support/Standards/v2/control-point-schema";
import { validateV2ControlPointSet } from "@/backend/app/Support/Standards/v2/control-point-governance";

type ExtractionEntry = {
  module_code: ControlModuleCode;
  source_standard_document: string;
  source_file: string;
  source_standard_clause: string;
  title: string;
  description: string;
  control_rule: string;
  applicability: string[];
  conditions: string[];
  evaluation_method: string;
  scoring_logic: string;
  evidence_requirement: string[];
  nonconformity: string;
  control_weight: number;
  risk_priority: V2ControlPoint["risk_priority"];
  evaluation_frequency: string;
  control_owner: string;
  evaluator: string;
  reviewer: string;
  linked_project_modules: string[];
  linked_files: string[];
  implementation_status: string;
  extraction_origin: string;
};

type ExtractionMap = {
  generated_at: string;
  source_documents: Array<{ label: string; file: string }>;
  total_extraction_items: number;
  extraction_items: ExtractionEntry[];
};

const root = process.cwd();
const requiredModuleCodes: ControlModuleCode[] = [
  "ACC",
  "TAX",
  "IVC",
  "INV",
  "AUD",
  "UX",
  "USR",
  "ADM",
  "AST",
  "ACP",
  "VAL",
  "SEC",
  "TMP",
  "DOC",
  "XMD",
  "FRM",
  "BRD",
];

const moduleNameByCode = new Map(controlModuleRegistry.map((module) => [module.code, module.name]));
const moduleOrder = new Map(controlModuleRegistry.map((module, index) => [module.code, index + 1]));
const phase1ById = new Map(ksaPhase1Modules.map((module) => [module.id, module]));
const actualById = new Map(actualSystemMap.modules.map((module) => [module.id, module]));
const architectureByName = new Map((masterDesign.module_architecture ?? []).map((module) => [module.name, module]));

const sourceDocuments = [
  { label: "Master Design vNext / Module Architecture", file: "master_design/master_design_vNext.json" },
  { label: "Prompt Engine v4", file: "system/prompt_engine_v4.json" },
  { label: "KSA Phase 1 Module Specs", file: "data/master-design/ksa-phase1.ts" },
  { label: "Workspace Role Definition", file: "data/role-workspace.ts" },
  { label: "Workspace Module Directory", file: "data/workspace.ts" },
];

const entries: ExtractionEntry[] = [];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function getApplicability(scope: string | undefined, forceGlobal = false) {
  if (forceGlobal) {
    return ["KSA", "Gulf", "EU", "Global"];
  }
  if (scope === "ksa") {
    return ["KSA", "Gulf"];
  }
  if (scope === "future-country-slot") {
    return ["KSA", "Gulf", "EU", "Global", "France"];
  }
  return ["KSA", "Gulf", "EU", "Global"];
}

function getImplementationStatus(moduleCode: ControlModuleCode) {
  const controlStatusMap: Record<ControlModuleCode, string> = {
    ACC: actualById.get("accounting-engine")?.status === "COMPLETE" ? "implemented" : "partial",
    TAX: "partial",
    IVC: "partial",
    INV: "partial",
    AUD: "partial",
    UX: "partial",
    USR: "partial",
    ADM: "partial",
    AST: "partial",
    ACP: "partial",
    DOC: "partial",
    TMP: "partial",
    VAL: "partial",
    SEC: "partial",
    BRD: "partial",
    XMD: "partial",
    FRM: "partial",
  };
  return controlStatusMap[moduleCode];
}

function addEntry(entry: ExtractionEntry) {
  entries.push({
    ...entry,
    applicability: uniqueStrings(entry.applicability),
    conditions: uniqueStrings(entry.conditions),
    evidence_requirement: uniqueStrings(entry.evidence_requirement),
    linked_project_modules: uniqueStrings(entry.linked_project_modules),
    linked_files: uniqueStrings(entry.linked_files),
  });
}

function createRuleEntry(params: {
  module_code: ControlModuleCode;
  source_standard_document: string;
  source_file: string;
  source_standard_clause: string;
  title: string;
  description: string;
  control_rule: string;
  applicability: string[];
  linked_project_modules: string[];
  linked_files: string[];
  evaluation_method: string;
  evidence_requirement: string[];
  nonconformity: string;
  control_weight: number;
  risk_priority: V2ControlPoint["risk_priority"];
  evaluation_frequency: string;
  control_owner: string;
  evaluator: string;
  reviewer: string;
  implementation_status: string;
  extraction_origin: string;
}) {
  addEntry({
    ...params,
    conditions: [`When the system executes the standard clause '${params.source_standard_clause}'.`],
    scoring_logic: `Pass when evidence confirms '${params.control_rule}' and fail when the clause is absent, bypassed, or unverifiable.`,
  });
}

function addArchitectureModuleControls(moduleCode: ControlModuleCode, architectureName: string, linkedProjectModules: string[], controlOwner: string, sourceFile = "master_design/master_design_vNext.json") {
  const architecture = architectureByName.get(architectureName) as {
    processing_logic: string;
    validation_rules: string[];
    traceability_rules: string[];
    report_impact: string[];
    accounting_impact: string;
  } | undefined;

  if (!architecture) {
    return;
  }

  createRuleEntry({
    module_code: moduleCode,
    source_standard_document: "Master Design vNext / Module Architecture",
    source_file: sourceFile,
    source_standard_clause: `${architectureName}.processing_logic`,
    title: `${architectureName} processing contract`.
      replace(/ Engine$/, "")
      .replace(/ Layer$/, "")
      .replace(/ /g, " "),
    description: architecture.processing_logic,
    control_rule: architecture.processing_logic,
    applicability: getApplicability("shared-platform", moduleCode === "ACC" || moduleCode === "TAX" || moduleCode === "IVC" || moduleCode === "INV" ? false : true),
    linked_project_modules: linkedProjectModules,
    linked_files: [sourceFile],
    evaluation_method: `Review the implementation path that fulfills ${architectureName.toLowerCase()} processing responsibilities.`,
    evidence_requirement: ["service implementation trace", "workflow execution evidence"],
    nonconformity: `${architectureName} processing responsibilities are not enforceable in runtime behavior.`,
    control_weight: 8,
    risk_priority: moduleCode === "ACC" || moduleCode === "TAX" || moduleCode === "IVC" || moduleCode === "INV" ? "critical" : "high",
    evaluation_frequency: "Per release and quarterly control review",
    control_owner: controlOwner,
    evaluator: `${controlOwner} reviewer`,
    reviewer: "Standards governance reviewer",
    implementation_status: getImplementationStatus(moduleCode),
    extraction_origin: "module_architecture.processing_logic",
  });

  architecture.validation_rules.forEach((rule, index) => {
    createRuleEntry({
      module_code: moduleCode,
      source_standard_document: "Master Design vNext / Module Architecture",
      source_file: sourceFile,
      source_standard_clause: `${architectureName}.validation_rules[${index}]`,
      title: rule,
      description: `Validation rule from ${architectureName}: ${rule}`,
      control_rule: rule,
      applicability: getApplicability("shared-platform", moduleCode === "ACC" || moduleCode === "TAX" || moduleCode === "IVC" || moduleCode === "INV" ? false : true),
      linked_project_modules: linkedProjectModules,
      linked_files: [sourceFile],
      evaluation_method: `Execute the validation path and confirm the system enforces '${rule}'.`,
      evidence_requirement: ["validation result", "API or UI blocking evidence"],
      nonconformity: `The system does not enforce '${rule}'.`,
      control_weight: 9,
      risk_priority: rule.toLowerCase().includes("must") || rule.toLowerCase().includes("balance") ? "critical" : "high",
      evaluation_frequency: "Per release and quarterly control review",
      control_owner: controlOwner,
      evaluator: `${controlOwner} reviewer`,
      reviewer: "Standards governance reviewer",
      implementation_status: getImplementationStatus(moduleCode),
      extraction_origin: "module_architecture.validation_rules",
    });
  });

  architecture.traceability_rules.forEach((rule, index) => {
    createRuleEntry({
      module_code: moduleCode,
      source_standard_document: "Master Design vNext / Module Architecture",
      source_file: sourceFile,
      source_standard_clause: `${architectureName}.traceability_rules[${index}]`,
      title: rule,
      description: `Traceability requirement from ${architectureName}: ${rule}`,
      control_rule: rule,
      applicability: getApplicability("shared-platform", true),
      linked_project_modules: linkedProjectModules,
      linked_files: [sourceFile],
      evaluation_method: `Inspect persisted identifiers and confirm the system retains the traceability required by '${rule}'.`,
      evidence_requirement: ["stored linkage sample", "lookup evidence"],
      nonconformity: `Required traceability is missing for '${rule}'.`,
      control_weight: 8,
      risk_priority: "high",
      evaluation_frequency: "Per release and quarterly control review",
      control_owner: controlOwner,
      evaluator: `${controlOwner} reviewer`,
      reviewer: "Standards governance reviewer",
      implementation_status: getImplementationStatus(moduleCode),
      extraction_origin: "module_architecture.traceability_rules",
    });
  });
}

function addPhase1ModuleControls(moduleCode: ControlModuleCode, phase1Id: string, sourceFile = "data/master-design/ksa-phase1.ts") {
  const module = phase1ById.get(phase1Id);
  if (!module) {
    return;
  }

  const owner = module.name;
  module.requiredFeatures.forEach((feature, index) => {
    createRuleEntry({
      module_code: moduleCode,
      source_standard_document: "KSA Phase 1 Module Specs",
      source_file: sourceFile,
      source_standard_clause: `${phase1Id}.requiredFeatures[${index}]`,
      title: `${module.name} feature - ${feature}`,
      description: `${module.name} must provide the required feature '${feature}'.`,
      control_rule: `${module.name} must provide ${feature} as a real runtime capability.`,
      applicability: getApplicability(module.countryScope),
      linked_project_modules: [phase1Id, ...module.requiredLinkages],
      linked_files: [sourceFile],
      evaluation_method: `Verify that '${feature}' exists as a persisted, routed, or API-backed capability.`,
      evidence_requirement: ["feature proof", "route or API evidence"],
      nonconformity: `${module.name} does not provide the required feature '${feature}'.`,
      control_weight: 8,
      risk_priority: phase1Id === "accounting-engine" || phase1Id === "document-engine" || phase1Id === "tax-vat-engine" ? "critical" : "high",
      evaluation_frequency: "Per release and quarterly control review",
      control_owner: owner,
      evaluator: `${owner} reviewer`,
      reviewer: "Phase 1 governance reviewer",
      implementation_status: getImplementationStatus(moduleCode),
      extraction_origin: "ksa_phase1.requiredFeatures",
    });
  });

  module.requiredUiExpectations.forEach((expectation, index) => {
    createRuleEntry({
      module_code: moduleCode,
      source_standard_document: "KSA Phase 1 Module Specs",
      source_file: sourceFile,
      source_standard_clause: `${phase1Id}.requiredUiExpectations[${index}]`,
      title: `${module.name} UI expectation - ${expectation}`,
      description: `${module.name} must visibly satisfy the UI expectation '${expectation}'.`,
      control_rule: `${module.name} must expose ${expectation} without placeholder overclaim.`,
      applicability: getApplicability(module.countryScope),
      linked_project_modules: [phase1Id, "ui-ux-shell", ...module.requiredLinkages],
      linked_files: [sourceFile],
      evaluation_method: `Review the routed UI and confirm '${expectation}' is visible and operational.`,
      evidence_requirement: ["UI screenshot or DOM evidence", "route proof"],
      nonconformity: `${module.name} does not satisfy the UI expectation '${expectation}'.`,
      control_weight: 7,
      risk_priority: moduleCode === "UX" || moduleCode === "USR" || moduleCode === "ADM" || moduleCode === "AST" || moduleCode === "ACP" ? "high" : "medium",
      evaluation_frequency: "Per release and monthly UX review",
      control_owner: owner,
      evaluator: `${owner} reviewer`,
      reviewer: "Phase 1 governance reviewer",
      implementation_status: getImplementationStatus(moduleCode),
      extraction_origin: "ksa_phase1.requiredUiExpectations",
    });
  });

  module.requiredProofExpectations.forEach((expectation, index) => {
    createRuleEntry({
      module_code: moduleCode,
      source_standard_document: "KSA Phase 1 Module Specs",
      source_file: sourceFile,
      source_standard_clause: `${phase1Id}.requiredProofExpectations[${index}]`,
      title: `${module.name} proof expectation - ${expectation}`,
      description: `${module.name} must produce the proof expectation '${expectation}'.`,
      control_rule: `${module.name} must produce evidence that '${expectation}'.`,
      applicability: getApplicability(module.countryScope, true),
      linked_project_modules: [phase1Id, "proof-layer", ...module.requiredLinkages],
      linked_files: [sourceFile],
      evaluation_method: `Run the proof path and verify evidence exists for '${expectation}'.`,
      evidence_requirement: ["proof artifact", "execution summary"],
      nonconformity: `${module.name} cannot produce proof for '${expectation}'.`,
      control_weight: 8,
      risk_priority: "high",
      evaluation_frequency: "Per release and before acceptance",
      control_owner: owner,
      evaluator: `${owner} reviewer`,
      reviewer: "Proof governance reviewer",
      implementation_status: getImplementationStatus(moduleCode),
      extraction_origin: "ksa_phase1.requiredProofExpectations",
    });
  });
}

function addRoleWorkspaceControls(moduleCode: ControlModuleCode, roleKey: keyof typeof workspaceRoles) {
  const role = workspaceRoles[roleKey];
  const sourceFile = "data/role-workspace.ts";
  role.priorities.forEach((priority, index) => {
    createRuleEntry({
      module_code: moduleCode,
      source_standard_document: "Workspace Role Definition",
      source_file: sourceFile,
      source_standard_clause: `${roleKey}.priorities[${index}]`,
      title: `${role.label} priority - ${priority}`,
      description: `${role.label} must satisfy the role priority '${priority}'.`,
      control_rule: priority,
      applicability: ["KSA", "Gulf", "Global"],
      linked_project_modules: ["identity-workspace", "ui-ux-shell", "workflow-intelligence"],
      linked_files: [sourceFile],
      evaluation_method: `Inspect the ${role.label.toLowerCase()} shell and confirm the priority is reflected in navigation and available actions.`,
      evidence_requirement: ["workspace screenshot", "route ownership evidence"],
      nonconformity: `${role.label} does not satisfy the priority '${priority}'.`,
      control_weight: 7,
      risk_priority: "high",
      evaluation_frequency: "Per release and monthly workspace review",
      control_owner: role.label,
      evaluator: `${role.label} reviewer`,
      reviewer: "Workspace governance reviewer",
      implementation_status: getImplementationStatus(moduleCode),
      extraction_origin: "role_workspace.priorities",
    });
  });

  role.sidebarGroups.forEach((group, index) => {
    createRuleEntry({
      module_code: moduleCode,
      source_standard_document: "Workspace Role Definition",
      source_file: sourceFile,
      source_standard_clause: `${roleKey}.sidebarGroups[${index}]`,
      title: `${role.label} sidebar group - ${group.label}`,
      description: `${role.label} must expose the '${group.label}' navigation group with direct access to its operational routes.`,
      control_rule: `${role.label} must expose the '${group.label}' navigation group and its routes as first-class workspace navigation.`,
      applicability: ["KSA", "Gulf", "Global"],
      linked_project_modules: ["identity-workspace", "ui-ux-shell"],
      linked_files: [sourceFile],
      evaluation_method: `Review ${role.label.toLowerCase()} navigation and confirm the '${group.label}' group is present with direct route access.`,
      evidence_requirement: ["sidebar evidence", "route list evidence"],
      nonconformity: `${role.label} does not expose the '${group.label}' navigation group correctly.`,
      control_weight: 6,
      risk_priority: "medium",
      evaluation_frequency: "Per release and monthly workspace review",
      control_owner: role.label,
      evaluator: `${role.label} reviewer`,
      reviewer: "Workspace governance reviewer",
      implementation_status: getImplementationStatus(moduleCode),
      extraction_origin: "role_workspace.sidebarGroups",
    });
  });
}

function addWorkspaceModuleControls(moduleCode: ControlModuleCode, slugs: string[]) {
  const sourceFile = "data/workspace.ts";
  workspaceModules
    .filter((module) => slugs.includes(module.slug))
    .forEach((module) => {
      module.highlights.forEach((highlight, index) => {
        createRuleEntry({
          module_code: moduleCode,
          source_standard_document: "Workspace Module Directory",
          source_file: sourceFile,
          source_standard_clause: `${module.slug}.highlights[${index}]`,
          title: `${module.title} highlight - ${highlight}`,
          description: `${module.title} must satisfy the highlighted workspace rule '${highlight}'.`,
          control_rule: `${module.title} must deliver '${highlight}' through the shipped workspace route and actions.`,
          applicability: ["KSA", "Gulf", "Global"],
          linked_project_modules: ["identity-workspace", "ui-ux-shell"],
          linked_files: [sourceFile],
          evaluation_method: `Inspect ${module.href} and confirm '${highlight}' is visible and actionable.`,
          evidence_requirement: ["route screenshot", "action evidence"],
          nonconformity: `${module.title} does not deliver the highlight '${highlight}'.`,
          control_weight: 6,
          risk_priority: "medium",
          evaluation_frequency: "Per release and monthly workspace review",
          control_owner: module.title,
          evaluator: `${module.title} reviewer`,
          reviewer: "Workspace governance reviewer",
          implementation_status: getImplementationStatus(moduleCode),
          extraction_origin: "workspace_modules.highlights",
        });
      });
    });
}

function addConstitutionControls() {
  (masterDesign.constitution?.non_negotiable_rules ?? []).forEach((rule: string, index: number) => {
    const moduleCode: ControlModuleCode = rule.includes("account") || rule.includes("inventory") ? "ACC" : "XMD";
    createRuleEntry({
      module_code: moduleCode,
      source_standard_document: "Master Design vNext / Constitution",
      source_file: "master_design/master_design_vNext.json",
      source_standard_clause: `constitution.non_negotiable_rules[${index}]`,
      title: rule,
      description: `Non-negotiable system rule: ${rule}`,
      control_rule: rule,
      applicability: ["KSA", "Gulf", "EU", "Global"],
      linked_project_modules: moduleCode === "ACC" ? ["accounting-engine", "document-engine", "inventory-engine"] : ["workflow-intelligence", "proof-layer", "ui-ux-shell"],
      linked_files: ["master_design/master_design_vNext.json"],
      evaluation_method: `Inspect runtime behavior and confirm the system does not violate '${rule}'.`,
      evidence_requirement: ["runtime proof", "control center evidence"],
      nonconformity: `System behavior violates the non-negotiable rule '${rule}'.`,
      control_weight: 10,
      risk_priority: "critical",
      evaluation_frequency: "Per release and pre-deployment review",
      control_owner: "System Governance",
      evaluator: "Governance reviewer",
      reviewer: "Architecture reviewer",
      implementation_status: getImplementationStatus(moduleCode),
      extraction_origin: "constitution.non_negotiable_rules",
    });
  });

  (masterDesign.evidence_law ?? []).forEach((rule: string, index: number) => {
    createRuleEntry({
      module_code: "AUD",
      source_standard_document: "Master Design vNext / Evidence Law",
      source_file: "master_design/master_design_vNext.json",
      source_standard_clause: `evidence_law[${index}]`,
      title: `Evidence law - ${rule}`,
      description: `Evidence law requires '${rule}' for completion claims.`,
      control_rule: `Every governed workflow must produce ${rule.replaceAll("_", " ")}.`,
      applicability: ["KSA", "Gulf", "EU", "Global"],
      linked_project_modules: ["proof-layer", "workflow-intelligence", "reports-engine"],
      linked_files: ["master_design/master_design_vNext.json", "system/prompt_engine_v4.json"],
      evaluation_method: `Review generated evidence and confirm '${rule}' exists for the governed workflow.`,
      evidence_requirement: ["artifact evidence", "execution summary"],
      nonconformity: `Required evidence '${rule}' is missing from the governed workflow.`,
      control_weight: 8,
      risk_priority: "high",
      evaluation_frequency: "Per run and acceptance review",
      control_owner: "Proof Layer",
      evaluator: "Proof reviewer",
      reviewer: "Governance reviewer",
      implementation_status: getImplementationStatus("AUD"),
      extraction_origin: "evidence_law",
    });
  });

  createRuleEntry({
    module_code: "AUD",
    source_standard_document: "Prompt Engine v4",
    source_file: "system/prompt_engine_v4.json",
    source_standard_clause: "decision_rules.complete",
    title: "Completion requires evidence and passing checks",
    description: promptEngine.decision_rules.complete,
    control_rule: "Completion must only be granted when definition of done is satisfied with evidence and passing checks.",
    applicability: ["KSA", "Gulf", "EU", "Global"],
    linked_project_modules: ["proof-layer", "workflow-intelligence"],
    linked_files: ["system/prompt_engine_v4.json"],
    evaluation_method: "Review completion decisions against evidence outputs and test results.",
    evidence_requirement: ["decision log", "test results", "evidence outputs"],
    nonconformity: "A task is marked complete without evidence or passing checks.",
    control_weight: 8,
    risk_priority: "high",
    evaluation_frequency: "Per run and acceptance review",
    control_owner: "Prompt Governance",
    evaluator: "Prompt governance reviewer",
    reviewer: "Architecture reviewer",
    implementation_status: getImplementationStatus("AUD"),
    extraction_origin: "prompt_engine.decision_rules",
  });
}

function addCoverageControls() {
  addArchitectureModuleControls("ACC", "Accounting Engine", ["accounting-engine", "document-engine", "inventory-engine", "reports-engine"], "Accounting Engine");
  addArchitectureModuleControls("IVC", "Invoice Engine", ["document-engine", "accounting-engine", "tax-vat-engine"], "Document Engine");
  addArchitectureModuleControls("INV", "Inventory Engine", ["inventory-engine", "document-engine", "accounting-engine"], "Inventory Engine");
  addArchitectureModuleControls("TAX", "VAT Engine", ["tax-vat-engine", "document-engine", "reports-engine", "company-profile"], "VAT Engine");
  addArchitectureModuleControls("AUD", "Traceability Engine", ["proof-layer", "accounting-engine", "document-engine", "reports-engine"], "Traceability Engine");
  addArchitectureModuleControls("XMD", "Integrity Enforcement Engine", ["workflow-intelligence", "accounting-engine", "document-engine", "inventory-engine"], "Integrity Enforcement Engine");
  addArchitectureModuleControls("VAL", "UI Validation Layer", ["ui-ux-shell", "identity-workspace", "document-engine"], "UI Validation Layer");
  addArchitectureModuleControls("SEC", "API Layer", ["identity-workspace", "ui-ux-shell", "workflow-intelligence"], "API Layer");
  addArchitectureModuleControls("AUD", "Testing Layer", ["proof-layer", "workflow-intelligence"], "Testing Layer");

  addPhase1ModuleControls("USR", "identity-workspace");
  addPhase1ModuleControls("DOC", "document-engine");
  addPhase1ModuleControls("TMP", "template-engine");
  addPhase1ModuleControls("ACC", "accounting-engine");
  addPhase1ModuleControls("INV", "inventory-engine");
  addPhase1ModuleControls("TAX", "tax-vat-engine");
  addPhase1ModuleControls("AUD", "proof-layer");
  addPhase1ModuleControls("UX", "ui-ux-shell");
  addPhase1ModuleControls("XMD", "country-service-architecture");
  addPhase1ModuleControls("XMD", "end-to-end-workflow-proof");
  addPhase1ModuleControls("VAL", "import-engine");
  addPhase1ModuleControls("AUD", "workflow-intelligence");

  addRoleWorkspaceControls("USR", "user");
  addRoleWorkspaceControls("ADM", "admin");
  addRoleWorkspaceControls("AST", "assistant");
  addRoleWorkspaceControls("ACP", "agent");

  addWorkspaceModuleControls("ACP", ["agents", "company-users"]);
  addWorkspaceModuleControls("ADM", ["admin-plans", "admin-agents", "admin-customers", "support-accounts"]);
  addWorkspaceModuleControls("AST", ["help"]);
  addWorkspaceModuleControls("BRD", ["company-users"]);

  createRuleEntry({
    module_code: "BRD",
    source_standard_document: "KSA Phase 1 Module Specs",
    source_file: "data/master-design/ksa-phase1.ts",
    source_standard_clause: "template-engine.requiredFeatures[2]",
    title: "Template assets must stay assigned through one contract",
    description: "Template engine must own asset assignment so logos and brand assets remain consistent across live output.",
    control_rule: "Template asset assignment must be persisted once and reused consistently by live document rendering.",
    applicability: ["KSA", "Gulf", "Global"],
    linked_project_modules: ["template-engine", "document-engine", "company-profile"],
    linked_files: ["data/master-design/ksa-phase1.ts"],
    evaluation_method: "Inspect template persistence and rendered output to confirm brand assets remain consistent.",
    evidence_requirement: ["template asset record", "rendered output sample"],
    nonconformity: "Brand assets diverge between template configuration and rendered output.",
    control_weight: 6,
    risk_priority: "medium",
    evaluation_frequency: "Per release and template review",
    control_owner: "Template Engine",
    evaluator: "Template reviewer",
    reviewer: "Brand governance reviewer",
    implementation_status: getImplementationStatus("BRD"),
    extraction_origin: "brand_asset_contract",
  });

  createRuleEntry({
    module_code: "FRM",
    source_standard_document: "Master Design vNext / Module Architecture",
    source_file: "master_design/master_design_vNext.json",
    source_standard_clause: "UI Validation Layer.validation_rules",
    title: "Operational forms must block invalid business actions",
    description: "Operational forms and registers must surface validation clearly and block invalid issue paths.",
    control_rule: "Required fields and invalid business inputs must block the action at the form or register surface with visible feedback.",
    applicability: ["KSA", "Gulf", "Global"],
    linked_project_modules: ["ui-ux-shell", "identity-workspace", "document-engine"],
    linked_files: ["master_design/master_design_vNext.json", "data/workspace.ts"],
    evaluation_method: "Execute representative form and register flows and confirm invalid business actions are blocked with visible guidance.",
    evidence_requirement: ["UI validation evidence", "blocking message evidence"],
    nonconformity: "Invalid business actions can pass through operational forms or registers without visible blocking guidance.",
    control_weight: 8,
    risk_priority: "high",
    evaluation_frequency: "Per release and monthly UX review",
    control_owner: "UI Validation Layer",
    evaluator: "UI validation reviewer",
    reviewer: "Workspace governance reviewer",
    implementation_status: getImplementationStatus("FRM"),
    extraction_origin: "form_register_surface_rule",
  });
}

function dedupeEntries(extractionItems: ExtractionEntry[]) {
  const seen = new Set<string>();
  return extractionItems.filter((entry) => {
    const key = [entry.module_code, entry.source_standard_document, entry.source_standard_clause, slugify(entry.control_rule)].join("::");
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildControlPoints(extractionItems: ExtractionEntry[]) {
  const grouped = new Map<ControlModuleCode, ExtractionEntry[]>();
  for (const entry of extractionItems) {
    const existing = grouped.get(entry.module_code) ?? [];
    existing.push(entry);
    grouped.set(entry.module_code, existing);
  }

  const controlPoints: V2ControlPoint[] = [];
  for (const moduleCode of requiredModuleCodes) {
    const moduleEntries = grouped.get(moduleCode) ?? [];
    const ordered = moduleEntries.sort((left, right) => left.source_standard_clause.localeCompare(right.source_standard_clause) || left.title.localeCompare(right.title));
    ordered.forEach((entry, index) => {
      controlPoints.push({
        id: `CP-${moduleCode}-${String(index + 1).padStart(3, "0")}`,
        version: "2.0.0",
        module_code: moduleCode,
        module_name: moduleNameByCode.get(moduleCode) ?? moduleCode,
        chapter_number: `${moduleOrder.get(moduleCode) ?? 99}.${index + 1}`,
        title: entry.title,
        source_standard_clause: entry.source_standard_clause,
        source_standard_document: entry.source_standard_document,
        description: entry.description,
        control_rule: entry.control_rule,
        applicability: entry.applicability,
        conditions: entry.conditions,
        evaluation_method: entry.evaluation_method,
        scoring_logic: entry.scoring_logic,
        evidence_requirement: entry.evidence_requirement,
        nonconformity: entry.nonconformity,
        control_weight: entry.control_weight,
        risk_priority: entry.risk_priority,
        evaluation_frequency: entry.evaluation_frequency,
        control_owner: entry.control_owner,
        evaluator: entry.evaluator,
        reviewer: entry.reviewer,
        linked_project_modules: entry.linked_project_modules,
        linked_files: entry.linked_files,
        migration_action: "replace",
        implementation_status: entry.implementation_status,
        status: "active",
      });
    });
  }

  return controlPoints;
}

function buildCoverage(controlPoints: V2ControlPoint[]) {
  const coverage = requiredModuleCodes.map((moduleCode) => ({
    module_code: moduleCode,
    module_name: moduleNameByCode.get(moduleCode) ?? moduleCode,
    count: controlPoints.filter((controlPoint) => controlPoint.module_code === moduleCode).length,
  }));
  return {
    total_modules: requiredModuleCodes.length,
    covered_modules: coverage.filter((row) => row.count > 0).length,
    missing_modules: coverage.filter((row) => row.count === 0).map((row) => row.module_code),
    coverage,
  };
}

function buildValidation(controlPoints: V2ControlPoint[]) {
  const governance = validateV2ControlPointSet(controlPoints);
  const emptyFieldIds = controlPoints
    .filter((controlPoint) => Object.entries(controlPoint).some(([, value]) => Array.isArray(value) ? value.length === 0 : typeof value === "string" ? value.trim().length === 0 : false))
    .map((controlPoint) => controlPoint.id);
  const coverage = buildCoverage(controlPoints);
  const orphanControlPoints = controlPoints.filter((controlPoint) => controlPoint.linked_project_modules.length === 0).map((controlPoint) => controlPoint.id);
  return {
    generated_at: new Date().toISOString(),
    total_control_points: controlPoints.length,
    duplicate_ids: governance.duplicateIds,
    missing_modules: coverage.missing_modules,
    empty_field_ids: emptyFieldIds,
    invalid_schema_ids: governance.missingRequiredFields,
    orphan_control_points: orphanControlPoints,
    valid: governance.valid && coverage.missing_modules.length === 0 && emptyFieldIds.length === 0 && orphanControlPoints.length === 0,
  };
}

function renderDataset(controlPoints: V2ControlPoint[]) {
  return [
    'import type { V2ControlPoint } from "@/backend/app/Support/Standards/v2/control-point-schema";',
    "",
    "export const v2ControlPoints: readonly V2ControlPoint[] = ",
    `${JSON.stringify(controlPoints, null, 2)} as const;`,
    "",
  ].join("\n");
}

async function writeArtifacts(outputDir: string, extractionMap: ExtractionMap, coverage: ReturnType<typeof buildCoverage>, validation: ReturnType<typeof buildValidation>) {
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "standards-extraction-map.json"), `${JSON.stringify(extractionMap, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputDir, "control-point-module-coverage.json"), `${JSON.stringify(coverage, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputDir, "control-point-full-validation.json"), `${JSON.stringify(validation, null, 2)}\n`, "utf8");
}

async function main() {
  addConstitutionControls();
  addCoverageControls();

  const extractionItems = dedupeEntries(entries);
  const extractionMap: ExtractionMap = {
    generated_at: new Date().toISOString(),
    source_documents: sourceDocuments,
    total_extraction_items: extractionItems.length,
    extraction_items: extractionItems,
  };

  const controlPoints = buildControlPoints(extractionItems);
  const coverage = buildCoverage(controlPoints);
  const validation = buildValidation(controlPoints);

  const datasetFile = path.join(root, "backend", "app", "Support", "Standards", "v2", "control-points.v2.ts");
  await writeFile(datasetFile, renderDataset(controlPoints), "utf8");

  const outputDir = process.env.OUTPUT_DIR;
  if (outputDir) {
    await writeArtifacts(outputDir, extractionMap, coverage, validation);
  }

  process.stdout.write(`${JSON.stringify({
    datasetFile,
    totalControlPoints: controlPoints.length,
    coverage,
    validation,
  }, null, 2)}\n`);
}

void main();