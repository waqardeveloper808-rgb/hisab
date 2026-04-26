import { buildControlPointEngineSummary, renderControlPointEngineSummary } from "@/backend/app/Support/Standards/control-point-engine-summary";
import { buildControlPointEnginePrecheck, buildControlPointEngineRuntime, controlPointEngineRuntime, engineRegisteredControlPoints } from "@/backend/app/Support/Standards/control-point-engine-runtime";
import { evaluateControlPointExecution, getControlPointEvidenceSamples } from "@/backend/app/Support/Standards/control-point-execution";
import { buildSystemMonitorControlPoints } from "@/lib/audit-engine/build-monitor-points";
import {
  computeSummary,
  controlPointsForGroupUnique,
  controlPointsForModuleId,
  healthPercentFromSummary,
  topCriticalFails,
} from "@/lib/audit-engine/summary";
import { getActualSystemMap, getPriorityModulesFromActualMap } from "@/lib/mapping-engine";
import { MONITOR_GROUP_DEFS } from "@/lib/audit-engine/monitor-groups";
import type { SystemMonitorControlPoint } from "@/lib/audit-engine/monitor-types";
import type { ControlPointAuditStatus } from "@/backend/app/Support/Standards/control-point-engine-types";
import type { ActualModuleRecord, ModuleExecutionStatus, SystemBlocker } from "@/types/system-map";

export { controlPointEngineRuntime, engineRegisteredControlPoints };

export const controlPointEnginePrecheck = buildControlPointEnginePrecheck();
export const controlPointEngineSummary = buildControlPointEngineSummary(controlPointEngineRuntime);
export const controlPointEngineSummaryMarkdown = renderControlPointEngineSummary(controlPointEngineSummary);

type RiskLevel = "low" | "medium" | "high" | "critical";

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

export const controlPointRiskSummary: {
  system_risk_level: RiskLevel;
  system_risk_score: number;
  modules: Array<{
    module_code: string;
    module_name: string;
    risk_level: RiskLevel;
  }>;
} = {
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
    risk_level: controlPoint.risk_priority,
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
  controlPoints: SystemMonitorControlPoint[];
  moduleHealth: Array<{
    id: string;
    name: string;
    status: ModuleExecutionStatus;
    completionPercentage: number;
    dependencies: string[];
    blockerCount: number;
    passCount: number;
    failCount: number;
    partialCount: number;
    blockedCount: number;
    totalControlPoints: number;
    healthPercent: number;
    engineDisplayStatus: "PASS" | "FAIL" | "PARTIAL" | "BLOCKED";
  }>;
  groupScope: Array<{
    id: string;
    name: string;
    passCount: number;
    failCount: number;
    partialCount: number;
    blockedCount: number;
    totalControlPoints: number;
    healthPercent: number;
    scopeLabel: string;
  }>;
  failingAreas: Array<{
    controlPointId: string;
    title: string;
    status: string;
    exactCauses: string[];
    severity: string;
    module: string;
    timestamp: string;
  }>;
  priorityModules: Array<{
    id: string;
    name: string;
    reason: string;
  }>;
  moduleMap: ActualModuleRecord[];
  blockers: SystemBlocker[];
};

function riskFromSummary(fail: number, partial: number, blocked: number): { level: "low" | "medium" | "high" | "critical"; score: number } {
  const score = Math.min(100, fail * 3 + blocked * 4 + partial * 1);
  if (fail > 0) return { level: "critical", score };
  if (blocked > 0) return { level: "high", score };
  if (partial > 0) return { level: "medium", score };
  return { level: "low", score: 0 };
}

function buildLegacySystemState(): SystemState {
  const actual = getActualSystemMap();
  const generatedAt = new Date().toISOString();
  const controlPoints = buildSystemMonitorControlPoints(generatedAt);
  const engineSummary = computeSummary(controlPoints);

  const moduleHealth = actual.modules.map((module) => {
    const related = controlPointsForModuleId(controlPoints, module.id);
    const s = computeSummary(related);
    const total = related.length;
    const healthPercent = healthPercentFromSummary(s, total);
    const engineDisplayStatus: "PASS" | "FAIL" | "PARTIAL" | "BLOCKED" =
      s.fail > 0 ? "FAIL" : s.partial > 0 ? "PARTIAL" : s.blocked > 0 ? "BLOCKED" : "PASS";
    return {
      id: module.id,
      name: module.name,
      status: module.status,
      completionPercentage: healthPercent,
      dependencies: module.dependencies,
      blockerCount: module.blockers.length,
      passCount: s.pass,
      failCount: s.fail,
      partialCount: s.partial,
      blockedCount: s.blocked,
      totalControlPoints: total,
      healthPercent,
      engineDisplayStatus,
    };
  });

  const groupScope = MONITOR_GROUP_DEFS.map((g) => {
    const unique = controlPointsForGroupUnique(controlPoints, g.modules);
    const s = computeSummary(unique);
    const total = unique.length;
    return {
      id: g.id,
      name: g.name,
      passCount: s.pass,
      failCount: s.fail,
      partialCount: s.partial,
      blockedCount: s.blocked,
      totalControlPoints: total,
      healthPercent: healthPercentFromSummary(s, total),
      scopeLabel: "Unique control points with any link to a module in this group (counted once).",
    };
  });

  const risk = riskFromSummary(engineSummary.fail, engineSummary.partial, engineSummary.blocked);
  const topFails = topCriticalFails(controlPoints, 10);

  return {
    generatedAt,
    risk,
    audit: {
      total: controlPoints.length,
      pass: engineSummary.pass,
      fail: engineSummary.fail,
      partial: engineSummary.partial,
      blocked: engineSummary.blocked,
    },
    controlPoints,
    moduleHealth,
    groupScope,
    failingAreas: topFails.map((row) => ({
      controlPointId: row.id,
      title: row.title,
      status: row.status,
      exactCauses: [row.root_cause_hint || row.actual_behavior],
      severity: row.severity,
      module: row.module,
      timestamp: row.timestamp,
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

export function getFreshSystemMonitorState(): SystemState {
  return buildLegacySystemState();
}

export async function getSystemState(): Promise<SystemState> {
  return getFreshSystemMonitorState();
}

export function getControlPointRootCause(controlPointId: string) {
  const row = controlPointExecutionRows.find((entry) => entry.controlPoint.id === controlPointId);
  return row?.result.failures.length ? row.result.failures : row ? [row.result.audit_reason] : [];
}

export function getControlPointEvidenceSamplesSnapshot() {
  return getControlPointEvidenceSamples(engineRegisteredControlPoints);
}
