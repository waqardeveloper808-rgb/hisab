import type { StandardsControlPoint } from "@/data/standards/control-points";
import type { ControlPointExecutionResult } from "@/backend/app/Support/Standards/control-point-execution";

export type ModuleRiskRecord = {
  module_code: string;
  module_name: string;
  control_count: number;
  pass_count: number;
  partial_count: number;
  fail_count: number;
  blocked_count: number;
  weighted_score: number;
  risk_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  weak_control_ids: string[];
  critical_failures: string[];
};

export type ControlPointRiskSummary = {
  system_risk_score: number;
  system_risk_level: "low" | "medium" | "high" | "critical";
  critical_failures: string[];
  weak_modules: ModuleRiskRecord[];
  modules: ModuleRiskRecord[];
};

type EvaluatedControlPoint = {
  controlPoint: StandardsControlPoint;
  result: ControlPointExecutionResult;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function deriveRiskLevel(score: number) {
  if (score >= 75) {
    return "critical";
  }
  if (score >= 55) {
    return "high";
  }
  if (score >= 30) {
    return "medium";
  }
  return "low";
}

export function buildControlPointRiskSummary(entries: EvaluatedControlPoint[]): ControlPointRiskSummary {
  const moduleMap = new Map<string, ModuleRiskRecord>();

  for (const entry of entries) {
    const existing = moduleMap.get(entry.controlPoint.module_code) ?? {
      module_code: entry.controlPoint.module_code,
      module_name: entry.controlPoint.module_name,
      control_count: 0,
      pass_count: 0,
      partial_count: 0,
      fail_count: 0,
      blocked_count: 0,
      weighted_score: 0,
      risk_score: 0,
      risk_level: "low",
      weak_control_ids: [],
      critical_failures: [],
    };

    existing.control_count += 1;
    existing.weighted_score += entry.result.weighted_score;
    if (entry.result.status === "PASS") {
      existing.pass_count += 1;
    }
    if (entry.result.status === "PARTIAL") {
      existing.partial_count += 1;
      existing.weak_control_ids.push(entry.controlPoint.id);
    }
    if (entry.result.status === "FAIL") {
      existing.fail_count += 1;
      existing.weak_control_ids.push(entry.controlPoint.id);
      existing.critical_failures.push(...entry.result.failures);
    }
    if (entry.result.status === "BLOCKED") {
      existing.blocked_count += 1;
      existing.weak_control_ids.push(entry.controlPoint.id);
    }

    moduleMap.set(entry.controlPoint.module_code, existing);
  }

  const modules = Array.from(moduleMap.values()).map((module) => {
    const normalizedWeightedScore = module.control_count ? module.weighted_score / module.control_count : 0;
    const failurePressure = module.fail_count * 24 + module.partial_count * 10 + module.blocked_count * 16;
    const riskScore = clamp(100 - normalizedWeightedScore + failurePressure);
    return {
      ...module,
      weighted_score: clamp(normalizedWeightedScore),
      risk_score: riskScore,
      risk_level: deriveRiskLevel(riskScore),
      weak_control_ids: Array.from(new Set(module.weak_control_ids)),
      critical_failures: Array.from(new Set(module.critical_failures)).slice(0, 20),
    } satisfies ModuleRiskRecord;
  }).sort((left, right) => right.risk_score - left.risk_score);

  const systemRiskScore = clamp(modules.length ? modules.reduce((sum, module) => sum + module.risk_score, 0) / modules.length : 0);

  return {
    system_risk_score: systemRiskScore,
    system_risk_level: deriveRiskLevel(systemRiskScore),
    critical_failures: Array.from(new Set(modules.flatMap((module) => module.critical_failures))).slice(0, 40),
    weak_modules: modules.filter((module) => module.fail_count > 0 || module.partial_count > 0).slice(0, 12),
    modules,
  };
}