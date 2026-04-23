import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { standardsControlPoints } from "@/data/standards/control-points";
import { evaluateControlPointExecution, getControlPointExecutionMap } from "@/backend/app/Support/Standards/control-point-execution";
import { buildControlPointRiskSummary } from "@/backend/app/Support/Standards/risk-engine";

type BaselineExecutionEntry = {
  id: string;
  module_code: string;
  title: string;
  result: {
    status: "PASS" | "PARTIAL" | "FAIL" | "BLOCKED";
    score: number;
    audit_reason: string;
    evidence: string[];
  };
};

function timestampLabel() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  return `${date}_${time}`;
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(filePath: string, value: string) {
  await writeFile(filePath, `${value.trim()}\n`, "utf8");
}

async function findLatestBaselineResults(artifactsRoot: string) {
  if (process.env.BASELINE_RESULTS) {
    return process.env.BASELINE_RESULTS;
  }

  const entries = await readdir(artifactsRoot, { withFileTypes: true });
  const latest = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("control_point_execution_"))
    .map((entry) => entry.name)
    .sort()
    .at(-1);

  return latest ? path.join(artifactsRoot, latest, "reports", "control-point-execution-results.json") : null;
}

async function readBaselineResults(filePath: string | null) {
  if (!filePath) {
    return [] as BaselineExecutionEntry[];
  }
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content) as BaselineExecutionEntry[];
}

function summarizeCounts(results: Array<{ result: { status: string } }>) {
  return results.reduce((counts, entry) => {
    const status = entry.result.status;
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  }, {} as Record<string, number>);
}

function buildWeaknessAnalysis(baseline: BaselineExecutionEntry[]) {
  const passEntries = baseline.filter((entry) => entry.result.status === "PASS");
  const genericWorkspaceEvidencePasses = passEntries.filter((entry) => entry.result.evidence.some((line) => line.includes("Workspace roles") || line.includes("Workspace quick actions") || line.includes("Workspace modules")));
  const repeatedReasons = Object.entries(passEntries.reduce<Record<string, number>>((map, entry) => {
    map[entry.result.audit_reason] = (map[entry.result.audit_reason] ?? 0) + 1;
    return map;
  }, {})).sort((left, right) => right[1] - left[1]).slice(0, 10).map(([reason, count]) => ({ reason, count }));
  const overScoredPasses = passEntries.filter((entry) => entry.result.score >= 85);

  return {
    baseline_total_controls: baseline.length,
    baseline_status_counts: summarizeCounts(baseline),
    weaknesses: [
      {
        id: "runtime-result-override",
        severity: "critical",
        finding: "The old evaluator allowed explicit runtime payload states to dominate final control status rather than treating them as only one evidence source.",
      },
      {
        id: "category-wide-pass",
        severity: "critical",
        finding: "The old evaluator granted PASS from broad category heuristics such as workspace route presence, generic document evidence, and average linked-module health.",
      },
      {
        id: "missing-negative-validation",
        severity: "critical",
        finding: "The old evaluator did not convert preview contamination, placeholder routes, proof instability, invalid data, or missing clause-specific proof into explicit FAIL outcomes.",
      },
      {
        id: "no-direct-check-requirement",
        severity: "high",
        finding: "The old evaluator did not require direct clause-specific checks for PASS, allowing generic truthy evidence to satisfy specific controls.",
      },
    ],
    repeated_pass_reasons: repeatedReasons,
    generic_workspace_evidence_pass_count: genericWorkspaceEvidencePasses.length,
    over_scored_pass_count: overScoredPasses.length,
    recommended_hardening: [
      "Require all direct control checks to pass before PASS is possible.",
      "Convert critical and high-severity blocker signals into FAIL conditions.",
      "Treat missing control-specific evidence as PARTIAL or FAIL instead of PASS.",
      "Apply weighted risk scoring by control weight and risk priority.",
    ],
  };
}

async function run() {
  const startedAt = Date.now();
  const runLabel = process.env.RUN_LABEL ?? timestampLabel();
  const artifactsRoot = path.join(process.cwd(), "artifacts");
  const outputRoot = process.env.OUTPUT_DIR ?? path.join(artifactsRoot, `audit_hardening_${runLabel}`);
  await mkdir(outputRoot, { recursive: true });

  const baselineResultsPath = await findLatestBaselineResults(artifactsRoot);
  const baselineResults = await readBaselineResults(baselineResultsPath);
  const weaknessAnalysis = buildWeaknessAnalysis(baselineResults);

  const hardenedResults = standardsControlPoints.map((controlPoint) => ({
    id: controlPoint.id,
    module_code: controlPoint.module_code,
    module_name: controlPoint.module_name,
    title: controlPoint.title,
    risk_priority: controlPoint.risk_priority,
    control_weight: controlPoint.control_weight,
    linked_project_modules: controlPoint.linked_project_modules,
    result: evaluateControlPointExecution(controlPoint),
  }));
  const riskSummary = buildControlPointRiskSummary(hardenedResults.map((entry) => ({
    controlPoint: standardsControlPoints.find((controlPoint) => controlPoint.id === entry.id)!,
    result: entry.result,
  })));
  const executionMap = getControlPointExecutionMap(standardsControlPoints);
  const counts = summarizeCounts(hardenedResults);
  const durationMs = Date.now() - startedAt;

  await writeJson(path.join(outputRoot, "audit-weakness-analysis.json"), weaknessAnalysis);
  await writeJson(path.join(outputRoot, "audit-hardened-results.json"), hardenedResults);
  await writeJson(path.join(outputRoot, "risk-summary.json"), riskSummary);
  await writeJson(path.join(outputRoot, "control-point-execution-map.json"), executionMap);

  await writeText(path.join(outputRoot, "execution-log.md"), `# Audit Hardening Execution Log\n\nGenerated ${hardenedResults.length} hardened control results.\n\n${hardenedResults.slice(0, 80).map((entry) => `- ${entry.id} [${entry.result.status}] score=${entry.result.score} weighted=${entry.result.weighted_score} risk=${entry.result.risk_level}: ${entry.result.audit_reason}`).join("\n")}`);
  await writeText(path.join(outputRoot, "execution-time-report.md"), `# Execution Time Report\n\n- Started at: ${new Date(startedAt).toISOString()}\n- Completed at: ${new Date().toISOString()}\n- Duration ms: ${durationMs}\n- Average per control ms: ${(durationMs / Math.max(1, hardenedResults.length)).toFixed(2)}`);
  await writeText(path.join(outputRoot, "blockers.md"), `# Audit Hardening Blockers\n\n${riskSummary.critical_failures.length ? riskSummary.critical_failures.map((failure) => `- ${failure}`).join("\n") : "No critical failures remained after hardening."}`);
  await writeText(path.join(outputRoot, "summary.md"), `# Audit Hardening Summary\n\n- Baseline PASS/PARTIAL/FAIL/BLOCKED: ${weaknessAnalysis.baseline_status_counts.PASS ?? 0}/${weaknessAnalysis.baseline_status_counts.PARTIAL ?? 0}/${weaknessAnalysis.baseline_status_counts.FAIL ?? 0}/${weaknessAnalysis.baseline_status_counts.BLOCKED ?? 0}\n- Hardened PASS/PARTIAL/FAIL/BLOCKED: ${counts.PASS ?? 0}/${counts.PARTIAL ?? 0}/${counts.FAIL ?? 0}/${counts.BLOCKED ?? 0}\n- System risk level: ${riskSummary.system_risk_level}\n- System risk score: ${riskSummary.system_risk_score}\n- Weak modules: ${riskSummary.weak_modules.map((module) => `${module.module_code}:${module.risk_level}`).join(", ")}\n- Critical failures: ${riskSummary.critical_failures.length}\n- Output root: ${outputRoot}\n- Duration ms: ${durationMs}`);

  process.stdout.write(`${JSON.stringify({ outputRoot, counts, systemRiskLevel: riskSummary.system_risk_level, durationMs }, null, 2)}\n`);
}

void run();