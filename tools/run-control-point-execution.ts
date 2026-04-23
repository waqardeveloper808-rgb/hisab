import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { standardsControlPoints } from "@/data/standards/control-points";
import {
  evaluateControlPointExecution,
  getControlPointEvidenceSamples,
  getControlPointExecutionMap,
} from "@/backend/app/Support/Standards/control-point-execution";

type SummaryCounts = Record<"PASS" | "PARTIAL" | "FAIL" | "BLOCKED", number>;

function timestampLabel() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  return `${date}_${time}`;
}

function summarizeCounts(results: Array<{ status: keyof SummaryCounts }>) {
  return results.reduce<SummaryCounts>(
    (counts, result) => {
      counts[result.status] += 1;
      return counts;
    },
    { PASS: 0, PARTIAL: 0, FAIL: 0, BLOCKED: 0 },
  );
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeMarkdown(filePath: string, content: string) {
  await writeFile(filePath, `${content.trim()}\n`, "utf8");
}

async function run() {
  const startedAt = Date.now();
  const runLabel = process.env.RUN_LABEL ?? timestampLabel();
  const outputRoot = process.env.OUTPUT_DIR ?? path.join(process.cwd(), "artifacts", `control_point_execution_${runLabel}`);
  const docsDir = path.join(outputRoot, "docs");
  const reportsDir = path.join(outputRoot, "reports");
  const logsDir = path.join(outputRoot, "logs");

  await mkdir(docsDir, { recursive: true });
  await mkdir(reportsDir, { recursive: true });
  await mkdir(logsDir, { recursive: true });

  const executionMap = getControlPointExecutionMap(standardsControlPoints);
  const executionResults = standardsControlPoints.map((controlPoint) => ({
    id: controlPoint.id,
    module_code: controlPoint.module_code,
    title: controlPoint.title,
    linked_project_modules: controlPoint.linked_project_modules,
    result: evaluateControlPointExecution(controlPoint),
  }));
  const evidenceSamples = getControlPointEvidenceSamples(standardsControlPoints);
  const counts = summarizeCounts(executionResults.map((entry) => ({ status: entry.result.status })));
  const blockedEntries = executionResults.filter((entry) => entry.result.status === "BLOCKED");
  const durationMs = Date.now() - startedAt;

  await writeJson(path.join(reportsDir, "control-point-execution-map.json"), executionMap);
  await writeJson(path.join(reportsDir, "control-point-execution-results.json"), executionResults);
  await writeJson(path.join(reportsDir, "evidence-samples.json"), evidenceSamples);
  await writeJson(path.join(reportsDir, "summary.json"), {
    runLabel,
    outputRoot,
    generatedAt: new Date().toISOString(),
    totalControlPoints: standardsControlPoints.length,
    counts,
    durationMs,
  });

  await writeMarkdown(
    path.join(docsDir, "summary.md"),
    `# Control Point Execution Summary

- Run label: ${runLabel}
- Output directory: ${outputRoot}
- Total control points: ${standardsControlPoints.length}
- PASS: ${counts.PASS}
- PARTIAL: ${counts.PARTIAL}
- FAIL: ${counts.FAIL}
- BLOCKED: ${counts.BLOCKED}
- Duration: ${durationMs} ms`,
  );

  await writeMarkdown(
    path.join(logsDir, "execution-log.md"),
    `# Control Point Execution Log

Generated ${standardsControlPoints.length} execution results.

${executionResults
      .slice(0, 60)
      .map((entry) => `- ${entry.id} [${entry.result.status}] score=${entry.result.score} coverage=${entry.result.evidence_coverage}: ${entry.result.audit_reason}`)
      .join("\n")}`,
  );

  await writeMarkdown(
    path.join(logsDir, "execution-time-report.md"),
    `# Execution Time Report

- Started at: ${new Date(startedAt).toISOString()}
- Completed at: ${new Date().toISOString()}
- Duration ms: ${durationMs}
- Average per control ms: ${(durationMs / Math.max(1, standardsControlPoints.length)).toFixed(2)}`,
  );

  await writeMarkdown(
    path.join(logsDir, "blockers.md"),
    `# Execution Blockers

${blockedEntries.length === 0 ? "No blocked controls remained after execution." : blockedEntries.map((entry) => `- ${entry.id}: ${entry.result.audit_reason}`).join("\n")}`,
  );

  process.stdout.write(`${JSON.stringify({ outputRoot, counts, durationMs }, null, 2)}\n`);
}

void run();