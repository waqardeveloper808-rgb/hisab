import type { MasterDesignModuleSpec, MasterDesignTargetMap } from "@/types/master-design";
import type { ActualModuleRecord, ActualSystemMap, BlockerSeverity, ComparisonModuleResult, ComparisonReport, ComparisonTrackedTaskSpec, ConfidenceLevel, ControlSurfaceValidationState, DerivedSubmoduleStatus, ExecutionSummaryRecord, ExecutionTaskRecord, ModuleExecutionStatus, ModuleProgressGroup } from "@/types/system-map";

const severityOrder: Record<BlockerSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function findMissingStrings(required: string[], implemented: string[]) {
  const implementedSet = new Set(implemented.map(normalize));
  return required.filter((item) => !implementedSet.has(normalize(item)));
}

function highestSeverity(module: ActualModuleRecord): BlockerSeverity | null {
  if (!module.blockers.length) {
    return null;
  }

  return [...module.blockers].sort((left, right) => severityOrder[right.severity] - severityOrder[left.severity])[0].severity;
}

function deriveCompletionPercentage(actual: ActualModuleRecord, missingFeatures: string[], missingLinkages: ActualModuleRecord["id"][], missingProof: string[]) {
  let score = actual.completionPercentage;
  if (missingFeatures.length > 0) {
    score -= Math.min(18, missingFeatures.length * 3);
  }
  if (missingLinkages.length > 0) {
    score -= Math.min(12, missingLinkages.length * 4);
  }
  if (missingProof.length > 0 && actual.proof.status !== "VERIFIED") {
    score -= 8;
  }
  return Math.max(0, Math.min(100, score));
}

function deriveStatus(actual: ActualModuleRecord, missingFeatures: string[], missingLinkages: ActualModuleRecord["id"][], missingProof: string[]): ModuleExecutionStatus {
  if (actual.runtimeStatus === "BLOCKED" || actual.blockers.some((blocker) => blocker.severity === "critical")) {
    return "BLOCKED";
  }

  if (actual.fakeCompleteFlags.length > 0) {
    return "FAKE-COMPLETE";
  }

  if (actual.criticalFiles.length === 0 || actual.structuralStatus === "MISSING") {
    return "MISSING";
  }

  if (
    actual.structuralStatus === "COMPLETE"
    && actual.runtimeStatus === "COMPLETE"
    && actual.backendLinkage.strength !== "none"
    && actual.backendLinkage.strength !== "ui-only"
    && !missingFeatures.length
    && !missingLinkages.length
    && !missingProof.length
    && actual.contamination.severity === "none"
  ) {
    return "COMPLETE";
  }

  if (actual.status === "PARTIAL" || actual.structuralStatus === "PARTIAL" || actual.runtimeStatus === "PARTIAL") {
    return "PARTIAL";
  }

  return "PARTIAL";
}

function recommendAction(module: ActualModuleRecord, missingFeatures: string[], missingLinkages: ActualModuleRecord["id"][], missingProof: string[]) {
  if (module.nextStepRecommendation) {
    return module.nextStepRecommendation;
  }

  if (module.blockers.length) {
    return `Resolve ${module.blockers[0].title.toLowerCase()} for ${module.name}.`;
  }

  if (missingFeatures.length) {
    return `Implement the missing ${module.name} requirement: ${missingFeatures[0]}.`;
  }

  if (missingLinkages.length) {
    return `Link ${module.name} to ${missingLinkages[0]} through the owned route and data path.`;
  }

  if (missingProof.length) {
    return `Strengthen proof for ${module.name}: ${missingProof[0]}.`;
  }

  return `Close the remaining ${module.name} gaps shown in the current audit output.`;
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

function getModuleGroup(moduleId: MasterDesignModuleSpec["id"]): ModuleProgressGroup {
  switch (moduleId) {
    case "identity-workspace":
    case "ui-ux-shell":
    case "workflow-intelligence":
      return "Core platform";
    case "company-profile":
    case "contacts-counterparties":
    case "product-item-service":
    case "document-engine":
    case "template-engine":
    case "compliance-layer":
      return "Commercial flows";
    case "accounting-engine":
    case "inventory-engine":
    case "tax-vat-engine":
      return "Accounting / inventory / VAT";
    case "reports-engine":
    case "import-engine":
    case "proof-layer":
    case "end-to-end-workflow-proof":
      return "Reports / import / proof";
    case "country-service-architecture":
      return "Country readiness";
    default:
      return "Core platform";
  }
}

function hasRouteCoverageIssue(actual: ActualModuleRecord) {
  return actual.blockers.some((blocker) => /missing expected route coverage|route coverage|missing-routes/i.test(`${blocker.id} ${blocker.title} ${blocker.rootCause}`));
}

function hasPlaceholderIssue(actual: ActualModuleRecord) {
  return actual.fakeCompleteFlags.length > 0 || actual.blockers.some((blocker) => /placeholder|catch-all|route truth|overclaim/i.test(`${blocker.id} ${blocker.title} ${blocker.rootCause}`));
}

function toFeatureStatus(actual: ActualModuleRecord, isMissing: boolean): DerivedSubmoduleStatus {
  if (!isMissing) {
    return "complete";
  }

  return actual.blockers.some((blocker) => blocker.severity === "critical" || blocker.severity === "high") ? "blocked" : "missing";
}

function toLinkageStatus(isMissing: boolean): DerivedSubmoduleStatus {
  return isMissing ? "missing" : "complete";
}

function toProofStatus(status: ActualModuleRecord["proof"]["status"]): DerivedSubmoduleStatus {
  switch (status) {
    case "VERIFIED":
      return "complete";
    case "PARTIAL":
      return "partial";
    case "BLOCKED":
      return "blocked";
    default:
      return "missing";
  }
}

function toUiExpectationStatus(expectation: string, actual: ActualModuleRecord): DerivedSubmoduleStatus {
  const normalized = normalize(expectation);

  if (/no placeholder|truthful|no catch-all|live control center|real implemented modules|misleading/.test(normalized)) {
    if (hasPlaceholderIssue(actual)) {
      return "blocked";
    }
    return actual.criticalRoutes.length > 0 ? "complete" : "missing";
  }

  if (/route|screen|register|dashboard|view|page|tab|shell|navigation|canvas|detail|drill-down/.test(normalized)) {
    if (hasRouteCoverageIssue(actual)) {
      return "missing";
    }
    if (actual.criticalRoutes.length > 0 && actual.structuralStatus === "COMPLETE") {
      return "complete";
    }
    if (actual.criticalRoutes.length > 0 || actual.structuralStatus === "PARTIAL") {
      return "partial";
    }
    return "missing";
  }

  if (/preview|render/.test(normalized)) {
    if (actual.contamination.severity === "none") {
      return "complete";
    }
    return actual.contamination.severity === "blocking" ? "blocked" : "partial";
  }

  if (actual.structuralStatus === "COMPLETE") {
    return "partial";
  }

  if (actual.structuralStatus === "PARTIAL") {
    return "partial";
  }

  return "missing";
}

function summarizeSubmodules(statuses: DerivedSubmoduleStatus[]) {
  return {
    total: statuses.length,
    complete: statuses.filter((status) => status === "complete").length,
    partial: statuses.filter((status) => status === "partial").length,
    missing: statuses.filter((status) => status === "missing").length,
    blocked: statuses.filter((status) => status === "blocked").length,
  };
}

function buildSubmoduleSummary(target: MasterDesignModuleSpec, actual: ActualModuleRecord, missingRequiredFeatures: string[], missingLinkages: ActualModuleRecord["id"][], missingProof: string[]) {
  const featureStatuses = target.requiredFeatures.map((feature) => toFeatureStatus(actual, missingRequiredFeatures.includes(feature)));
  const uiStatuses = target.requiredUiExpectations.map((expectation) => toUiExpectationStatus(expectation, actual));
  const linkageStatuses = target.requiredLinkages.map((linkage) => toLinkageStatus(missingLinkages.includes(linkage)));
  const proofStatuses = target.requiredProofExpectations.map(() => toProofStatus(missingProof.length === 0 ? "VERIFIED" : actual.proof.status));
  return summarizeSubmodules([...featureStatuses, ...uiStatuses, ...linkageStatuses, ...proofStatuses]);
}

function taskCompleted(taskId: string, modules: ComparisonModuleResult[], actualMap: ActualSystemMap, validation: ControlSurfaceValidationState | null) {
  switch (taskId) {
    case "module-progress-table":
      return modules.length > 0 && modules.every((module) => module.submodules.total > 0 && (module.submodules.complete + module.submodules.partial + module.submodules.missing + module.submodules.blocked) === module.submodules.total);
    case "smart-submodule-counting":
      return modules.every((module) => module.submodules.total > 0 && module.submodules.complete <= module.submodules.total);
    case "execution-summary":
      return modules.length > 0;
    case "completion-feedback-loop":
      return modules.every((module) => typeof module.assignedTasks === "number" && typeof module.completedTasks === "number" && typeof module.failedTasks === "number");
    case "live-tracking-refresh":
      return validation?.refreshWorked === true && actualMap.modules.some((module) => module.id === "ui-ux-shell");
    case "control-surface-validation":
      return Boolean(validation?.buildPassed && validation.routeOpened && validation.moduleProgressTableVisible && validation.executionSummaryVisible && validation.refreshWorked && validation.engineQuerySucceeded);
    default:
      return false;
  }
}

function taskFailureReasons(taskId: string, validation: ControlSurfaceValidationState | null) {
  if (!validation) {
    return [] as string[];
  }

  if (taskId === "live-tracking-refresh") {
    return validation.refreshWorked ? [] : ["refresh verification did not pass"];
  }

  if (taskId !== "control-surface-validation") {
    return [] as string[];
  }

  const reasons: string[] = [];
  if (!validation.buildPassed) reasons.push("npm run build did not pass");
  if (!validation.routeOpened) reasons.push("master design route did not open");
  if (!validation.moduleProgressTableVisible) reasons.push("module progress table was not visible");
  if (!validation.executionSummaryVisible) reasons.push("execution summary was not visible");
  if (!validation.refreshWorked) reasons.push("refresh verification did not pass");
  if (!validation.engineQuerySucceeded) reasons.push("final engine query did not succeed");
  return reasons;
}

function buildExecutionSummary(modules: ComparisonModuleResult[], actualMap: ActualSystemMap, trackedRunName: string, trackedTasks: ComparisonTrackedTaskSpec[], validation: ControlSurfaceValidationState | null, topBlockers: ComparisonReport["topBlockers"], remainingTasks: string[], generatedAt: string): ExecutionSummaryRecord {
  const tasks: ExecutionTaskRecord[] = trackedTasks.map((task) => {
    const completed = taskCompleted(task.id, modules, actualMap, validation);
    const failures = taskFailureReasons(task.id, validation);
    return {
      id: task.id,
      title: task.title,
      moduleIds: task.moduleIds,
      status: completed ? "completed" : failures.length > 0 ? "failed" : "in-progress",
      reason: failures[0] ?? null,
      validationSignals: failures,
    };
  });

  return {
    trackedRunName,
    assignedTasksCount: tasks.length,
    completedTasksCount: tasks.filter((task) => task.status === "completed").length,
    failedTasksCount: tasks.filter((task) => task.status === "failed").length,
    failureReasons: tasks.flatMap((task) => task.validationSignals),
    remainingTasks: tasks.filter((task) => task.status !== "completed").map((task) => task.title),
    currentTopBlockers: topBlockers.map((blocker) => blocker.title),
    nextRecommendedActions: remainingTasks.slice(0, 8),
    lastUpdated: validation?.updatedAt ?? generatedAt,
    tasks,
  };
}

function compareModule(target: MasterDesignModuleSpec, actual: ActualModuleRecord | null): ComparisonModuleResult {
  if (!actual) {
    return {
      moduleId: target.id,
      moduleName: target.name,
      group: getModuleGroup(target.id),
      status: "MISSING",
      completionPercentage: 0,
      blockerSeverity: "critical",
      missingRequiredFeatures: [...target.requiredFeatures],
      missingLinkages: [...target.requiredLinkages],
      missingProof: [...target.requiredProofExpectations],
      structuralStatus: "MISSING",
      runtimeStatus: "MISSING",
      proofStatus: "MISSING",
      topBlocker: `Implement ${target.name} from the Master Design target map.`,
      confidence: {
        level: "low",
        score: 0,
      },
      submodules: {
        total: target.requiredFeatures.length + target.requiredUiExpectations.length + target.requiredLinkages.length + target.requiredProofExpectations.length,
        complete: 0,
        partial: 0,
        missing: target.requiredFeatures.length + target.requiredUiExpectations.length + target.requiredLinkages.length + target.requiredProofExpectations.length,
        blocked: 0,
      },
      assignedTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      recommendedNextAction: `Implement ${target.name} from the Master Design target map.`,
    };
  }

  const missingRequiredFeatures = findMissingStrings(target.requiredFeatures, actual.implementedFeatures);
  const implementedLinkages = new Set(actual.implementedLinkages);
  const missingLinkages = target.requiredLinkages.filter((linkage) => !implementedLinkages.has(linkage));
  const missingProof = actual.proof.status === "VERIFIED"
    ? []
    : [...target.requiredProofExpectations];
  const status = deriveStatus(actual, missingRequiredFeatures, missingLinkages, missingProof);
  const completionPercentage = deriveCompletionPercentage(actual, missingRequiredFeatures, missingLinkages, missingProof);
  const submodules = buildSubmoduleSummary(target, actual, missingRequiredFeatures, missingLinkages, missingProof);

  return {
    moduleId: target.id,
    moduleName: target.name,
    group: getModuleGroup(target.id),
    status,
    completionPercentage,
    blockerSeverity: highestSeverity(actual),
    missingRequiredFeatures,
    missingLinkages,
    missingProof,
    structuralStatus: actual.structuralStatus,
    runtimeStatus: actual.runtimeStatus,
    proofStatus: actual.proof.status,
    topBlocker: actual.blockers[0]?.title ?? null,
    confidence: {
      level: actual.confidence.level,
      score: actual.confidence.score,
    },
    submodules,
    assignedTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    recommendedNextAction: recommendAction(actual, missingRequiredFeatures, missingLinkages, missingProof),
  };
}

export function compareTargetToActual(target: MasterDesignTargetMap, actualMap: ActualSystemMap, options?: { trackedRunName?: string; trackedTasks?: ComparisonTrackedTaskSpec[]; validation?: ControlSurfaceValidationState | null; generatedAt?: string }): ComparisonReport {
  const moduleResults = target.modules.map((targetModule) => compareModule(targetModule, actualMap.modules.find((actualModule) => actualModule.id === targetModule.id) ?? null));
  const counts: Record<ModuleExecutionStatus, number> = {
    COMPLETE: 0,
    PARTIAL: 0,
    "FAKE-COMPLETE": 0,
    MISSING: 0,
    BLOCKED: 0,
  };

  moduleResults.forEach((module) => {
    counts[module.status] += 1;
  });

  const totalCompletion = moduleResults.reduce((sum, module) => sum + module.completionPercentage, 0);
  const completeModules = moduleResults.filter((module) => module.status === "COMPLETE");
  const partialModules = moduleResults.filter((module) => module.status === "PARTIAL");
  const fakeCompleteModules = moduleResults.filter((module) => module.status === "FAKE-COMPLETE");
  const blockedModules = moduleResults.filter((module) => module.status === "BLOCKED");
  const topBlockers = Array.from(
    new Map(
      actualMap.modules
        .flatMap((module) => module.blockers)
        .sort((left, right) => severityOrder[right.severity] - severityOrder[left.severity])
        .map((blocker) => [blocker.id, blocker]),
    ).values(),
  ).slice(0, 10);

  const dependencyRisks = actualMap.modules
    .filter((module) => module.dependencies.length > 0)
    .map((module) => {
      const riskyDependencies = module.dependencies.filter((dependency) => {
        const dependencyModule = moduleResults.find((entry) => entry.moduleId === dependency);
        return dependencyModule != null && dependencyModule.status !== "COMPLETE";
      });

      return {
        moduleId: module.id,
        moduleName: module.name,
        dependsOn: riskyDependencies,
        riskSummary: riskyDependencies.length
          ? `${module.name} still depends on incomplete modules: ${riskyDependencies.join(", ")}.`
          : `${module.name} has no active dependency slippage from the target map.`,
      };
    });

  const remainingTasks = moduleResults
    .filter((module) => module.status !== "COMPLETE")
    .map((module) => module.recommendedNextAction);
  const averageConfidenceScore = actualMap.modules.length > 0
    ? Math.round(actualMap.modules.reduce((sum, module) => sum + module.confidence.score, 0) / actualMap.modules.length)
    : 0;
  const engineConfidenceLevel = getConfidenceLevel(averageConfidenceScore);
  const engineConfidenceSummary = engineConfidenceLevel === "high"
    ? "The engine has broad structural, linkage, and runtime support across modules."
    : engineConfidenceLevel === "medium"
      ? "The engine is directionally useful, but some modules still carry meaningful uncertainty."
      : "The engine still has low-confidence areas and should not be treated as a sole authority without caution.";
  const controlAuthorityReady = blockedModules.length === 0 && averageConfidenceScore >= 65 && actualMap.modules.filter((module) => module.status === "FAKE-COMPLETE").length <= 1;
  const executionSummary = buildExecutionSummary(
    moduleResults,
    actualMap,
    options?.trackedRunName ?? "Untracked run",
    options?.trackedTasks ?? [],
    options?.validation ?? null,
    topBlockers,
    remainingTasks,
    options?.generatedAt ?? actualMap.updatedAt,
  );

  const moduleTaskCounts = new Map(moduleResults.map((module) => [module.moduleId, { assigned: 0, completed: 0, failed: 0 }]));
  for (const task of executionSummary.tasks) {
    for (const moduleId of task.moduleIds) {
      const countsForModule = moduleTaskCounts.get(moduleId);
      if (!countsForModule) {
        continue;
      }
      countsForModule.assigned += 1;
      if (task.status === "completed") {
        countsForModule.completed += 1;
      }
      if (task.status === "failed") {
        countsForModule.failed += 1;
      }
    }
  }

  const enrichedModuleResults = moduleResults.map((module) => {
    const taskCounts = moduleTaskCounts.get(module.moduleId);
    return {
      ...module,
      assignedTasks: taskCounts?.assigned ?? 0,
      completedTasks: taskCounts?.completed ?? 0,
      failedTasks: taskCounts?.failed ?? 0,
    };
  });

  return {
    modules: enrichedModuleResults,
    overallCompletionPercentage: Math.round(totalCompletion / moduleResults.length),
    counts,
    topBlockers,
    fakeCompleteModules,
    completeModules,
    partialModules,
    blockedModules,
    dependencyRisks,
    remainingTasks,
    engineConfidence: {
      level: engineConfidenceLevel,
      score: averageConfidenceScore,
      summary: engineConfidenceSummary,
    },
    executionSummary,
    controlAuthority: {
      ready: controlAuthorityReady,
      summary: controlAuthorityReady
        ? "The engine is trustworthy enough to guide the final Phase 1 closure pass."
        : "The engine is not yet trustworthy enough to serve as the sole control authority for final Phase 1 closure.",
    },
  };
}