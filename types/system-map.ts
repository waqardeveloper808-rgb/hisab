import type { MasterDesignCountryScope, MasterDesignModuleId } from "@/types/master-design";

export type ModuleExecutionStatus = "COMPLETE" | "PARTIAL" | "FAKE-COMPLETE" | "MISSING" | "BLOCKED";
export type BlockerSeverity = "critical" | "high" | "medium" | "low";
export type ProofStatus = "VERIFIED" | "PARTIAL" | "MISSING" | "BLOCKED";
export type BackendLinkageStrength = "none" | "ui-only" | "backend-only" | "weak" | "linked" | "strong";
export type ContaminationSeverity = "none" | "informational" | "warning" | "blocking";
export type ConfidenceLevel = "high" | "medium" | "low";
export type RuntimeSignalStatus = "verified" | "partial" | "missing" | "blocked";
export type ModuleProgressGroup = "Core platform" | "Commercial flows" | "Accounting / inventory / VAT" | "Reports / import / proof" | "Country readiness";
export type DerivedSubmoduleStatus = "complete" | "partial" | "missing" | "blocked";
export type ExecutionTaskStatus = "completed" | "failed" | "in-progress";

export type SystemBlocker = {
  id: string;
  title: string;
  moduleId: MasterDesignModuleId;
  severity: BlockerSeverity;
  rootCause: string;
  dependencyImpact: string;
  filePaths?: string[];
  routePaths?: string[];
  controllerPaths?: string[];
  servicePaths?: string[];
  contaminationSeverity?: ContaminationSeverity;
  nextStepRecommendation?: string;
};

export type RuntimeVerificationSignal = {
  id: string;
  label: string;
  status: RuntimeSignalStatus;
  summary: string;
  evidence: string[];
};

export type ModuleFileRole = "engine" | "ui" | "api" | "route" | "service" | "data" | "preview" | "proof" | "backend";

export type ModuleFileRecord = {
  path: string;
  role: ModuleFileRole;
  notes: string[];
  causesBlockage: boolean;
};

export type ActualSubsystemRecord = {
  id: string;
  name: string;
  owner: MasterDesignModuleId;
  status: ModuleExecutionStatus;
  summary: string;
  criticalFiles: string[];
  criticalRoutes: string[];
};

export type ActualModuleRecord = {
  id: MasterDesignModuleId;
  name: string;
  description: string;
  countryScope: MasterDesignCountryScope;
  status: ModuleExecutionStatus;
  structuralStatus: ModuleExecutionStatus;
  runtimeStatus: ModuleExecutionStatus;
  completionPercentage: number;
  summary: string;
  whatWorks: string[];
  whatIsBroken: string[];
  whatIsMissing: string[];
  blockers: SystemBlocker[];
  fakeCompleteFlags: string[];
  dependencies: MasterDesignModuleId[];
  proof: {
    status: ProofStatus;
    summary: string;
    evidence: string[];
  };
  runtimeVerification: {
    status: RuntimeSignalStatus;
    summary: string;
    signals: RuntimeVerificationSignal[];
  };
  backendLinkage: {
    strength: BackendLinkageStrength;
    summary: string;
    controllers: string[];
    services: string[];
    routes: string[];
  };
  contamination: {
    severity: ContaminationSeverity;
    summary: string;
    files: string[];
  };
  implementedFeatures: string[];
  implementedLinkages: MasterDesignModuleId[];
  lastUpdated: string;
  criticalFiles: string[];
  fileDetails: ModuleFileRecord[];
  criticalRoutes: string[];
  criticalControllers: string[];
  criticalServices: string[];
  subsystemIds: string[];
  nextStepRecommendation: string;
  confidence: {
    level: ConfidenceLevel;
    score: number;
    summary: string;
  };
};

export type CountryReadinessReport = {
  ksa: {
    status: string;
    completionPercentage: number;
    notes: string[];
  };
  france: {
    status: string;
    completionPercentage: number;
    notes: string[];
  };
  trulyKsaSpecific: string[];
  wronglySharedToday: string[];
  franceSeparationNeeds: string[];
};

export type ActualSystemMap = {
  productName: string;
  phase: "Phase 1";
  modules: ActualModuleRecord[];
  subsystems: ActualSubsystemRecord[];
  countryReadiness: CountryReadinessReport;
  updatedAt: string;
};

export type ComparisonModuleResult = {
  moduleId: MasterDesignModuleId;
  moduleName: string;
  group: ModuleProgressGroup;
  status: ModuleExecutionStatus;
  completionPercentage: number;
  blockerSeverity: BlockerSeverity | null;
  missingRequiredFeatures: string[];
  missingLinkages: MasterDesignModuleId[];
  missingProof: string[];
  structuralStatus: ModuleExecutionStatus;
  runtimeStatus: ModuleExecutionStatus;
  proofStatus: ProofStatus;
  topBlocker: string | null;
  confidence: {
    level: ConfidenceLevel;
    score: number;
  };
  submodules: {
    total: number;
    complete: number;
    partial: number;
    missing: number;
    blocked: number;
  };
  assignedTasks: number;
  completedTasks: number;
  failedTasks: number;
  recommendedNextAction: string;
};

export type ExecutionTaskRecord = {
  id: string;
  title: string;
  moduleIds: MasterDesignModuleId[];
  status: ExecutionTaskStatus;
  reason: string | null;
  validationSignals: string[];
};

export type ControlSurfaceValidationState = {
  updatedAt: string;
  buildPassed: boolean;
  routeOpened: boolean;
  moduleProgressTableVisible: boolean;
  executionSummaryVisible: boolean;
  refreshWorked: boolean;
  engineQuerySucceeded: boolean;
  screenshots: string[];
  notes?: string[];
};

export type ComparisonTrackedTaskSpec = {
  id: string;
  title: string;
  moduleIds: MasterDesignModuleId[];
};

export type ExecutionSummaryRecord = {
  trackedRunName: string;
  assignedTasksCount: number;
  completedTasksCount: number;
  failedTasksCount: number;
  failureReasons: string[];
  remainingTasks: string[];
  currentTopBlockers: string[];
  nextRecommendedActions: string[];
  lastUpdated: string;
  tasks: ExecutionTaskRecord[];
};

export type ComparisonReport = {
  modules: ComparisonModuleResult[];
  overallCompletionPercentage: number;
  counts: Record<ModuleExecutionStatus, number>;
  topBlockers: SystemBlocker[];
  fakeCompleteModules: ComparisonModuleResult[];
  completeModules: ComparisonModuleResult[];
  partialModules: ComparisonModuleResult[];
  blockedModules: ComparisonModuleResult[];
  dependencyRisks: Array<{
    moduleId: MasterDesignModuleId;
    moduleName: string;
    dependsOn: MasterDesignModuleId[];
    riskSummary: string;
  }>;
  remainingTasks: string[];
  engineConfidence: {
    level: ConfidenceLevel;
    score: number;
    summary: string;
  };
  executionSummary: ExecutionSummaryRecord;
  controlAuthority: {
    ready: boolean;
    summary: string;
  };
};