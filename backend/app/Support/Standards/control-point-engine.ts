import { buildControlPointEngineSummary, renderControlPointEngineSummary } from "@/backend/app/Support/Standards/control-point-engine-summary";
import { buildControlPointEnginePrecheck, buildControlPointEngineRuntime, controlPointEngineRuntime, engineRegisteredControlPoints } from "@/backend/app/Support/Standards/control-point-engine-runtime";
import { controlPointAuditSummary, controlPointRiskSummary, evaluateControlPoints, getControlPointRootCause } from "@/lib/control-point-audit-engine";
import { getActualSystemMap, getPriorityModulesFromActualMap } from "@/lib/mapping-engine";
import type { ControlPointAuditStatus } from "@/lib/control-point-audit-engine";
import type { ActualModuleRecord, ModuleExecutionStatus, SystemBlocker } from "@/types/system-map";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export { controlPointEngineRuntime, engineRegisteredControlPoints };

export const controlPointEnginePrecheck = buildControlPointEnginePrecheck();
export const controlPointEngineSummary = buildControlPointEngineSummary(controlPointEngineRuntime);
export const controlPointEngineSummaryMarkdown = renderControlPointEngineSummary(controlPointEngineSummary);

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
  const auditRows = evaluateControlPoints();

  const moduleHealth = actual.modules.map((module) => {
    const relatedRows = auditRows.filter((row) => row.controlPoint.linked_project_modules.includes(module.id));
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
    failingAreas: auditRows
      .filter((row) => row.result.status !== "PASS")
      .map((row) => ({
        controlPointId: row.controlPoint.id,
        title: row.controlPoint.title,
        status: row.result.status,
        exactCauses: getControlPointRootCause(row.controlPoint.id),
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

async function readRuntimeAuditSnapshot() {
  const collectorProgram = [
    'import * as controlPointAuditEngine from "./lib/control-point-audit-engine.ts";',
    'const controlPointAuditApi = controlPointAuditEngine.default ?? controlPointAuditEngine;',
    'const rows = controlPointAuditApi.evaluateControlPoints();',
    'const summary = rows.reduce((acc, row) => {',
    '  acc.total += 1;',
    '  const key = row.result.status.toLowerCase();',
    '  acc[key] += 1;',
    '  return acc;',
    '}, { total: 0, pass: 0, partial: 0, fail: 0, blocked: 0 });',
    'process.stdout.write(JSON.stringify({ summary, rows }, null, 2));',
  ].join("\n");

  const { stdout } = await execFileAsync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "-e", collectorProgram], {
    cwd: process.cwd(),
    env: process.env,
    maxBuffer: 1024 * 1024 * 16,
  });

  return JSON.parse(stdout) as {
    summary: { total: number; pass: number; partial: number; fail: number; blocked: number };
    rows: Array<{
      controlPoint: {
        id: string;
        title: string;
        linked_project_modules?: string[];
      };
      result: {
        status: "PASS" | "FAIL" | "PARTIAL" | "BLOCKED";
        audit_reason?: string;
      };
    }>;
  };
}

export async function getSystemState(): Promise<SystemState> {
  const actual = getActualSystemMap();

  try {
    const runtimeSnapshot = await readRuntimeAuditSnapshot();
    const auditRows = runtimeSnapshot.rows;

    const moduleHealth = actual.modules.map((module) => {
      const relatedRows = auditRows.filter((row) => (row.controlPoint.linked_project_modules ?? []).includes(module.id));
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

    const hasFailures = runtimeSnapshot.summary.fail > 0 || runtimeSnapshot.summary.blocked > 0;
    const hasPartials = runtimeSnapshot.summary.partial > 0;

    return {
      generatedAt: new Date().toISOString(),
      risk: {
        level: hasFailures ? "critical" : hasPartials ? "medium" : "low",
        score: hasFailures ? 85 : hasPartials ? 45 : 0,
      },
      audit: runtimeSnapshot.summary,
      moduleHealth,
      failingAreas: auditRows
        .filter((row) => row.result.status !== "PASS")
        .map((row) => ({
          controlPointId: row.controlPoint.id,
          title: row.controlPoint.title,
          status: row.result.status,
          exactCauses: getControlPointRootCause(row.controlPoint.id).length
            ? getControlPointRootCause(row.controlPoint.id)
            : row.result.audit_reason
              ? [row.result.audit_reason]
              : [],
        })),
      priorityModules: getPriorityModulesFromActualMap(actual).map((module) => ({
        id: module.id,
        name: module.name,
        reason: module.nextStepRecommendation || module.blockers[0]?.title || module.summary,
      })),
      moduleMap: actual.modules,
      blockers: actual.modules.flatMap((module) => module.blockers),
    };
  } catch {
    return buildLegacySystemState();
  }
}