import type { MasterDesignModuleId } from "@/types/master-design";

export type ControlPointSeverity = "low" | "medium" | "high" | "critical";
export type ControlPointPriority = "future" | "near" | "immediate";
export type ControlPointImplementationStatus = "not_implemented" | "partial" | "implemented" | "future_ready";
export type ControlPointAuditMethod = "manual" | "semi-automatic" | "automatic";
export type ControlPointEvidence =
  | "test result"
  | "validation log"
  | "journal payload sample"
  | "report snapshot"
  | "document sample"
  | "template preview"
  | "ui evidence"
  | "access log"
  | "policy sample"
  | "structured payload"
  | "compliance sample"
  | "master data sample";

export type ControlPointApplicability = "KSA" | "Gulf" | "EU" | "Global";

export type ControlPointCategoryCode = "ACC" | "INV" | "VAT" | "DOC" | "TMP" | "UIX" | "FRM" | "VAL" | "SEC" | "BRD" | "XMD";

export type ControlPointCategoryName =
  | "Accounting"
  | "Inventory"
  | "VAT / Tax / Compliance"
  | "Documents"
  | "Template Engine"
  | "UI / UX"
  | "Forms / Registers"
  | "Input Validation / Data Standards"
  | "Security / Audit"
  | "Branding / Identity Standards"
  | "Cross-Module / System Integrity";

export type ControlPointCategoryDefinition = {
  code: ControlPointCategoryCode;
  name: ControlPointCategoryName;
  expectedCount: number;
  parentNodeId: string;
  parentNodeTitle: string;
  defaultOwner: string;
  defaultModules: MasterDesignModuleId[];
};

export const controlPointCategoryDefinitions = [
  {
    code: "ACC",
    name: "Accounting",
    expectedCount: 22,
    parentNodeId: "accounting-standards",
    parentNodeTitle: "Accounting Standards",
    defaultOwner: "Accounting Core",
    defaultModules: ["accounting-engine", "reports-engine", "workflow-intelligence"],
  },
  {
    code: "INV",
    name: "Inventory",
    expectedCount: 15,
    parentNodeId: "inventory-standards",
    parentNodeTitle: "Inventory Standards",
    defaultOwner: "Inventory Core",
    defaultModules: ["inventory-engine", "accounting-engine", "workflow-intelligence"],
  },
  {
    code: "VAT",
    name: "VAT / Tax / Compliance",
    expectedCount: 24,
    parentNodeId: "vat-compliance-standards",
    parentNodeTitle: "VAT / Compliance Standards",
    defaultOwner: "Tax and Compliance",
    defaultModules: ["tax-vat-engine", "document-engine", "compliance-layer"],
  },
  {
    code: "DOC",
    name: "Documents",
    expectedCount: 14,
    parentNodeId: "document-standards",
    parentNodeTitle: "Document Standards",
    defaultOwner: "Document Core",
    defaultModules: ["document-engine", "template-engine", "compliance-layer"],
  },
  {
    code: "TMP",
    name: "Template Engine",
    expectedCount: 12,
    parentNodeId: "template-standards",
    parentNodeTitle: "Template Standards",
    defaultOwner: "Template Engine",
    defaultModules: ["template-engine", "document-engine", "ui-ux-shell"],
  },
  {
    code: "UIX",
    name: "UI / UX",
    expectedCount: 11,
    parentNodeId: "ux-standards",
    parentNodeTitle: "UI / UX Standards",
    defaultOwner: "Experience Layer",
    defaultModules: ["ui-ux-shell", "workflow-intelligence", "identity-workspace"],
  },
  {
    code: "FRM",
    name: "Forms / Registers",
    expectedCount: 12,
    parentNodeId: "form-standards",
    parentNodeTitle: "Form Standards",
    defaultOwner: "Operations UX",
    defaultModules: ["ui-ux-shell", "workflow-intelligence", "document-engine"],
  },
  {
    code: "VAL",
    name: "Input Validation / Data Standards",
    expectedCount: 18,
    parentNodeId: "validation-standards",
    parentNodeTitle: "Validation Standards",
    defaultOwner: "Validation Layer",
    defaultModules: ["ui-ux-shell", "company-profile", "contacts-counterparties"],
  },
  {
    code: "SEC",
    name: "Security / Audit",
    expectedCount: 15,
    parentNodeId: "security-audit-standards",
    parentNodeTitle: "Security / Audit Standards",
    defaultOwner: "Security and Governance",
    defaultModules: ["identity-workspace", "proof-layer", "compliance-layer"],
  },
  {
    code: "BRD",
    name: "Branding / Identity Standards",
    expectedCount: 9,
    parentNodeId: "branding-standards",
    parentNodeTitle: "Branding Standards",
    defaultOwner: "Brand Governance",
    defaultModules: ["template-engine", "document-engine", "ui-ux-shell"],
  },
  {
    code: "XMD",
    name: "Cross-Module / System Integrity",
    expectedCount: 10,
    parentNodeId: "cross-module-standards",
    parentNodeTitle: "Cross-Module Integrity Standards",
    defaultOwner: "Platform Integrity",
    defaultModules: ["workflow-intelligence", "document-engine", "accounting-engine", "tax-vat-engine"],
  },
] as const satisfies readonly ControlPointCategoryDefinition[];

export const controlPointCategoryCodes = controlPointCategoryDefinitions.map((category) => category.code);
export const controlPointCategoryNames = controlPointCategoryDefinitions.map((category) => category.name);

export const controlPointCategoryMap = new Map(controlPointCategoryDefinitions.map((category) => [category.code, category]));

export function getControlPointCategoryDefinition(code: ControlPointCategoryCode) {
  const category = controlPointCategoryMap.get(code);
  if (!category) {
    throw new Error(`Unknown control point category: ${code}`);
  }

  return category;
}