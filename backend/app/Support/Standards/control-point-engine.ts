import { buildControlPointEngineSummary, renderControlPointEngineSummary } from "@/backend/app/Support/Standards/control-point-engine-summary";
import { buildControlPointEnginePrecheck, buildControlPointEngineRuntime, controlPointEngineRuntime, engineRegisteredControlPoints } from "@/backend/app/Support/Standards/control-point-engine-runtime";
import { evaluateControlPointExecution, getControlPointEvidenceSamples } from "@/backend/app/Support/Standards/control-point-execution";
import { getActualSystemMap, getPriorityModulesFromActualMap } from "@/lib/mapping-engine";
import type { ControlPointAuditStatus } from "@/backend/app/Support/Standards/control-point-engine-types";
import type { ActualModuleRecord, ModuleExecutionStatus, SystemBlocker } from "@/types/system-map";

export { controlPointEngineRuntime, engineRegisteredControlPoints };

export const controlPointEnginePrecheck = buildControlPointEnginePrecheck();
export const controlPointEngineSummary = buildControlPointEngineSummary(controlPointEngineRuntime);
export const controlPointEngineSummaryMarkdown = renderControlPointEngineSummary(controlPointEngineSummary);

const controlPointExecutionRows = engineRegisteredControlPoints.map((controlPoint) => ({
  controlPoint,
  result: evaluateControlPointExecution(controlPoint),
}));

export const controlPointAuditSummary = controlPointExecutionRows.reduce((summary, row) => {
  summary.totalCount += 1;
  const status = row.result.status;
  if (status === "PASS") summary.passCount += 1;
  if (status === "FAIL") summary.failCount += 1;
  if (status === "PARTIAL") summary.partialCount += 1;
  if (status === "BLOCKED") summary.blockedCount += 1;
  return summary;
}, {
  totalCount: 0,
  passCount: 0,
  failCount: 0,
  partialCount: 0,
  blockedCount: 0,
});

export const controlPointRiskSummary = {
  system_risk_level: controlPointAuditSummary.failCount > 0
    ? "critical"
    : controlPointAuditSummary.blockedCount > 0
      ? "high"
      : controlPointAuditSummary.partialCount > 0
        ? "medium"
        : "low",
  system_risk_score: controlPointAuditSummary.failCount > 0
    ? 95
    : controlPointAuditSummary.blockedCount > 0
      ? 80
      : controlPointAuditSummary.partialCount > 0
        ? 45
        : 0,
  modules: engineRegisteredControlPoints.map((controlPoint) => ({
    module_code: controlPoint.module_code,
    module_name: controlPoint.module_name,
    risk_level: controlPoint.severity,
  })),
};

export function rebuildControlPointEngine() {
  const runtime = buildControlPointEngineRuntime();
  return {
    runtime,
    summary: buildControlPointEngineSummary(runtime),
    summaryMarkdown: renderControlPointEngineSummary(buildControlPointEngineSummary(runtime)),
  };
}

export function hydrateControlPointEngineAuditStatuses(auditStatusMap: ReadonlyMap<string, ControlPointAuditStatus>) {
  return {
    ...controlPointEngineRuntime,
    registered_control_points: controlPointEngineRuntime.registered_control_points.map((controlPoint) => ({
      ...controlPoint,
      audit_status: auditStatusMap.get(controlPoint.id) ?? controlPoint.audit_status,
    })),
  };
}

type SystemState = {
  generatedAt: string;
  risk: {
    level: "low" | "medium" | "high" | "critical";
    score: number;
  };
  audit: {
    total: number;
    pass: number;
    fail: number;
    partial: number;
    blocked: number;
  };
  moduleHealth: Array<{
    id: string;
    name: string;
    status: ModuleExecutionStatus;
    completionPercentage: number;
    dependencies: string[];
    blockerCount: number;
    failCount: number;
    partialCount: number;
  }>;
  failingAreas: Array<{
    controlPointId: string;
    title: string;
    status: string;
    exactCauses: string[];
  }>;
  priorityModules: Array<{
    id: string;
    name: string;
    reason: string;
  }>;
  moduleMap: ActualModuleRecord[];
  blockers: SystemBlocker[];
};

function buildLegacySystemState(): SystemState {
  const actual = getActualSystemMap();

  const moduleHealth = actual.modules.map((module) => {
    const relatedRows = controlPointExecutionRows.filter((row) => row.controlPoint.linked_project_modules.includes(module.id));
    return {
      id: module.id,
      name: module.name,
      status: module.status,
      completionPercentage: module.completionPercentage,
      dependencies: module.dependencies,
      blockerCount: module.blockers.length,
      failCount: relatedRows.filter((row) => row.result.status === "FAIL").length,
      partialCount: relatedRows.filter((row) => row.result.status === "PARTIAL").length,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    risk: {
      level: controlPointRiskSummary.system_risk_level,
      score: controlPointRiskSummary.system_risk_score,
    },
    audit: {
      total: controlPointAuditSummary.totalCount,
      pass: controlPointAuditSummary.passCount,
      fail: controlPointAuditSummary.failCount,
      partial: controlPointAuditSummary.partialCount,
      blocked: controlPointAuditSummary.blockedCount,
    },
    moduleHealth,
    failingAreas: controlPointExecutionRows
      .filter((row) => row.result.status !== "PASS")
      .map((row) => ({
        controlPointId: row.controlPoint.id,
        title: row.controlPoint.title,
        status: row.result.status,
        exactCauses: row.result.failures.length ? row.result.failures : [row.result.audit_reason],
      })),
    priorityModules: getPriorityModulesFromActualMap(actual).map((module) => ({
      id: module.id,
      name: module.name,
      reason: module.nextStepRecommendation || module.blockers[0]?.title || module.summary,
    })),
    moduleMap: actual.modules,
    blockers: actual.modules.flatMap((module) => module.blockers),
  };
}

export async function getSystemState(): Promise<SystemState> {
  return buildLegacySystemState();
}

export function getControlPointRootCause(controlPointId: string) {
  const row = controlPointExecutionRows.find((entry) => entry.controlPoint.id === controlPointId);
  return row?.result.failures.length ? row.result.failures : row ? [row.result.audit_reason] : [];
}

export function getControlPointEvidenceSamplesSnapshot() {
  return getControlPointEvidenceSamples(engineRegisteredControlPoints);
}
