import type { ModuleExecutionStatus } from "@/types/system-map";

export type MasterDesignModuleId =
  | "identity-workspace"
  | "company-profile"
  | "contacts-counterparties"
  | "product-item-service"
  | "document-engine"
  | "communication-engine"
  | "template-engine"
  | "accounting-engine"
  | "inventory-engine"
  | "tax-vat-engine"
  | "reports-engine"
  | "import-engine"
  | "workflow-intelligence"
  | "compliance-layer"
  | "proof-layer"
  | "ui-ux-shell"
  | "country-service-architecture"
  | "end-to-end-workflow-proof";

export type MasterDesignCountryScope = "shared-platform" | "ksa" | "france-readiness" | "future-country-slot";

export type MasterDesignModuleSpec = {
  id: MasterDesignModuleId;
  name: string;
  description: string;
  countryScope: MasterDesignCountryScope;
  requiredFeatures: string[];
  requiredLinkages: MasterDesignModuleId[];
  requiredUiExpectations: string[];
  requiredProofExpectations: string[];
  definitionOfDone: string[];
};

export type MasterDesignTargetMap = {
  productName: string;
  phase: "Phase 1";
  activeCountryProduct: "KSA";
  futureCountryProducts: string[];
  modules: MasterDesignModuleSpec[];
  sharedPlatformRules: string[];
  franceReadinessRequirements: string[];
  updatedAt: string;
};

export type MasterDesignNodeType =
  | "system"
  | "category"
  | "sub-category"
  | "standard"
  | "audit"
  | "workflow"
  | "risk"
  | "evidence";

export type MasterDesignHierarchyNodeSpec = {
  id: string;
  parentId: string | null;
  title: string;
  type: MasterDesignNodeType;
  description: string;
  status: ModuleExecutionStatus;
  completionPercentage: number;
  childCount: number;
  completedChildren: number;
  partialChildren: number;
  blockedChildren: number;
  blockerCount: number;
  linkedStandards: string[];
  linkedAudits: string[];
  linkedWorkflows: string[];
  linkedModuleIds: MasterDesignModuleId[];
  fakeCompleteRisk: string | null;
  topBlockerHint: string | null;
  children: MasterDesignHierarchyNodeSpec[];
};