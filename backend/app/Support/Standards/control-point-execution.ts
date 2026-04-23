import {
  collectControlPointEvidence,
  getEvidenceSample,
  getExecutionCategory,
  getExecutionEvaluatorKey,
  type ControlPointExecutionCategory,
  type ControlPointEvidenceBundle,
} from "@/backend/app/Support/Standards/evidence-engine";
import type { StandardsControlPoint } from "@/data/standards/control-points";

export type ControlPointExecutionStatus = "PASS" | "FAIL" | "PARTIAL" | "BLOCKED";

export type ControlPointExecutionResult = {
  status: ControlPointExecutionStatus;
  score: number;
  audit_reason: string;
  checked_items: string[];
  evidence: string[];
  evidence_coverage: number;
  weighted_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  failures: string[];
};

export type ControlPointExecutionMapEntry = {
  id: string;
  module_code: StandardsControlPoint["module_code"];
  title: string;
  category: ControlPointExecutionCategory;
  evaluator_key: string;
  linked_project_modules: string[];
  evidence_sources: string[];
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function summarizeLinkedHealth(bundle: ControlPointEvidenceBundle) {
  const healthyModules = bundle.linkedModuleHealth.filter((module) => module.status === "COMPLETE" || module.status === "PARTIAL");
  const proofScore = bundle.linkedModuleHealth.length
    ? bundle.linkedModuleHealth.reduce((sum, module) => sum + (module.proofStatus === "VERIFIED" ? 100 : module.proofStatus === "PARTIAL" ? 60 : 0), 0) / bundle.linkedModuleHealth.length
    : 0;
  return {
    healthyCount: healthyModules.length,
    totalCount: bundle.linkedModuleHealth.length,
    averageCompletion: bundle.linkedModuleHealth.length
      ? bundle.linkedModuleHealth.reduce((sum, module) => sum + module.completionPercentage, 0) / bundle.linkedModuleHealth.length
      : 0,
    proofScore,
  };
}

function buildResult(status: ControlPointExecutionStatus, score: number, weightedScore: number, riskLevel: "low" | "medium" | "high" | "critical", auditReason: string, checkedItems: string[], evidence: string[], evidenceCoverage: number, failures: string[]): ControlPointExecutionResult {
  return {
    status,
    score: clampScore(score),
    audit_reason: auditReason,
    checked_items: checkedItems,
    evidence,
    evidence_coverage: clampScore(evidenceCoverage),
    weighted_score: clampScore(weightedScore),
    risk_level: riskLevel,
    failures,
  };
}

function riskMultiplier(priority: ControlPointEvidenceBundle["riskPriority"]) {
  switch (priority) {
    case "critical":
      return 1.35;
    case "high":
      return 1.2;
    case "medium":
      return 1;
    default:
      return 0.85;
  }
}

function violationPenalty(bundle: ControlPointEvidenceBundle) {
  return Math.min(80, bundle.violations.reduce((sum, violation) => sum + (violation.severity === "critical" ? 35 : violation.severity === "high" ? 20 : violation.severity === "medium" ? 10 : 5), 0));
}

function directCheckSummary(bundle: ControlPointEvidenceBundle) {
  const directChecks = bundle.requiredChecks.filter((check) => check.direct);
  const passedDirectChecks = directChecks.filter((check) => check.passed);
  const baseChecks = bundle.requiredChecks.filter((check) => !check.direct);
  const passedBaseChecks = baseChecks.filter((check) => check.passed);
  return {
    directChecks,
    passedDirectChecks,
    baseChecks,
    passedBaseChecks,
    directRatio: directChecks.length ? passedDirectChecks.length / directChecks.length : 0,
    baseRatio: bundle.requiredChecks.length ? (passedDirectChecks.length + passedBaseChecks.length) / bundle.requiredChecks.length : 0,
  };
}

function deriveRiskLevel(bundle: ControlPointEvidenceBundle, score: number, status: ControlPointExecutionStatus) {
  if (status === "FAIL" || bundle.riskPriority === "critical") {
    return score < 80 ? "critical" : "high";
  }
  if (status === "PARTIAL" || bundle.riskPriority === "high") {
    return score < 70 ? "high" : "medium";
  }
  return score < 65 ? "medium" : "low";
}

function evaluateWithEvidence(controlPoint: StandardsControlPoint, bundle: ControlPointEvidenceBundle): ControlPointExecutionResult {
  const availableEvidence = bundle.evidence.filter((item) => item.available);
  const unavailableEvidence = bundle.evidence.filter((item) => !item.available);
  const evidenceCoverage = bundle.evidence.length ? (availableEvidence.length / bundle.evidence.length) * 100 : 0;
  const linkedHealth = summarizeLinkedHealth(bundle);
  const runtimeMatch = bundle.matchedRuntimeResult;
  const checkSummary = directCheckSummary(bundle);
  const penalty = violationPenalty(bundle);
  const supportScore = linkedHealth.averageCompletion * 0.2 + linkedHealth.proofScore * 0.15 + evidenceCoverage * 0.1;
  const strictScore = checkSummary.directRatio * 55 + checkSummary.baseRatio * 20 + supportScore - penalty - bundle.missingData.length * 12;
  const weightedScore = strictScore * riskMultiplier(bundle.riskPriority) + bundle.weight * 2;
  const checkedItems = [
    `Collected ${bundle.evidence.length} evidence sources for ${controlPoint.id}.`,
    `Matched evaluator key '${bundle.evaluatorKey}'.`,
    `Checked ${linkedHealth.totalCount} linked project modules for runtime health.`,
    `Required direct checks passed: ${checkSummary.passedDirectChecks.length}/${checkSummary.directChecks.length}.`,
    `All checks passed: ${checkSummary.passedDirectChecks.length + checkSummary.passedBaseChecks.length}/${bundle.requiredChecks.length}.`,
  ];
  const evidenceLines = availableEvidence.slice(0, 6).map((item) => `${item.label}: ${item.details} (${item.reference})`);
  const failureLines = bundle.violations.map((violation) => `${violation.severity.toUpperCase()}: ${violation.message} (${violation.reference})`);

  if (availableEvidence.length === 0) {
    const riskLevel = deriveRiskLevel(bundle, strictScore, "FAIL");
    return buildResult(
      "FAIL",
      0,
      weightedScore,
      riskLevel,
      `No real evidence sources were available for ${controlPoint.id} using evaluator '${bundle.evaluatorKey}'.`,
      [...checkedItems, `No available evidence sources remained after scanning ${bundle.category.toLowerCase()}.`],
      unavailableEvidence.slice(0, 4).map((item) => `${item.label}: ${item.details} (${item.reference})`),
      evidenceCoverage,
      ["No available evidence sources remained after strict evaluation."],
    );
  }

  const hasCriticalViolation = bundle.violations.some((violation) => violation.severity === "critical");
  const hasHighViolation = bundle.violations.some((violation) => violation.severity === "high");
  const noDirectChecks = checkSummary.directChecks.length === 0;
  const allDirectChecksPassed = checkSummary.directChecks.length > 0 && checkSummary.directChecks.every((check) => check.passed);
  const someDirectChecksPassed = checkSummary.passedDirectChecks.length > 0;
  const noViolations = bundle.violations.length === 0;
  const baseChecksPassed = checkSummary.baseChecks.every((check) => check.passed);
  const strongHealth = controlPoint.module_code === "CPE"
    ? true
    : linkedHealth.averageCompletion >= 75 && linkedHealth.proofScore >= 60;

  if (hasCriticalViolation || (checkSummary.directChecks.length > 0 && !someDirectChecksPassed) || bundle.missingData.length > 0 && !someDirectChecksPassed) {
    const riskLevel = deriveRiskLevel(bundle, strictScore, "FAIL");
    return buildResult(
      "FAIL",
      strictScore,
      weightedScore,
      riskLevel,
      `Strict evaluation failed ${controlPoint.id} because required control conditions were not satisfied and negative signals were detected.`,
      [...checkedItems, ...bundle.requiredChecks.filter((check) => !check.passed).map((check) => `Failed check: ${check.label}. ${check.details}`), ...bundle.missingData.map((item) => `Missing data: ${item}`)],
      [...(runtimeMatch ? runtimeMatch.evidence : []), ...evidenceLines],
      evidenceCoverage,
      failureLines,
    );
  }

  if (hasHighViolation || noDirectChecks || !allDirectChecksPassed || !baseChecksPassed || !noViolations || !strongHealth) {
    const riskLevel = deriveRiskLevel(bundle, strictScore, "PARTIAL");
    return buildResult(
      "PARTIAL",
      strictScore,
      weightedScore,
      riskLevel,
      `Strict evaluation found partial compliance for ${controlPoint.id}: some supporting evidence exists, but all required conditions are not yet satisfied.`,
      [...checkedItems, ...bundle.requiredChecks.filter((check) => !check.passed).map((check) => `Unmet check: ${check.label}. ${check.details}`), ...bundle.missingData.map((item) => `Missing data: ${item}`)],
      [...(runtimeMatch ? runtimeMatch.evidence : []), ...evidenceLines],
      evidenceCoverage,
      failureLines,
    );
  }

  const riskLevel = deriveRiskLevel(bundle, strictScore, "PASS");
  return buildResult(
    "PASS",
    strictScore,
    weightedScore,
    riskLevel,
    `Strict evaluation passed ${controlPoint.id} because all direct checks, base checks, and linked module readiness requirements were satisfied without active violations.`,
    checkedItems,
    [...(runtimeMatch ? runtimeMatch.evidence : []), ...evidenceLines],
    evidenceCoverage,
    [],
  );
}

export function getControlPointExecutionMap(controlPoints: readonly StandardsControlPoint[]) {
  return controlPoints.map((controlPoint) => {
    const bundle = collectControlPointEvidence(controlPoint);
    return {
      id: controlPoint.id,
      module_code: controlPoint.module_code,
      title: controlPoint.title,
      category: getExecutionCategory(controlPoint),
      evaluator_key: getExecutionEvaluatorKey(controlPoint),
      linked_project_modules: controlPoint.linked_project_modules,
      evidence_sources: bundle.evidence.map((item) => item.reference),
    } satisfies ControlPointExecutionMapEntry;
  });
}

export function evaluateControlPointExecution(controlPoint: StandardsControlPoint) {
  const bundle = collectControlPointEvidence(controlPoint);
  return evaluateWithEvidence(controlPoint, bundle);
}

export function getControlPointEvidenceSamples(controlPoints: readonly StandardsControlPoint[]) {
  return controlPoints.slice(0, 24).map((controlPoint) => ({
    id: controlPoint.id,
    module_code: controlPoint.module_code,
    title: controlPoint.title,
    evidence: getEvidenceSample(controlPoint),
  }));
}