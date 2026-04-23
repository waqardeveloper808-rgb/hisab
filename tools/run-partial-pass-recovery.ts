import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { runRealControlPointAudit, runTargetedRealControlPointAudit } from "@/lib/control-point-audit-engine";
import { analyzePartialControlPoint, writePartialRootCauseReport } from "@/lib/root-cause-engine";

type PartialControlPoint = {
  id: string;
  module: string;
  reason: string;
  missing_evidence: string[];
};

type StepLog = {
  step: string;
  start: string;
  end: string;
  duration: string;
  status: string;
};

function stamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
}

function duration(start: string, end: string) {
  return `${(((new Date(end).getTime() - new Date(start).getTime()) / 1000) / 60).toFixed(2)} min`;
}

async function main() {
  const sourceDir = path.join(process.cwd(), "artifacts", "system_recovery_20260422_074206");
  const outputDir = path.join(process.cwd(), "artifacts", `system_recovery_partial_fix_${stamp()}`);
  const logs: StepLog[] = [];
  const sourceAudit = JSON.parse(await readFile(path.join(sourceDir, "engine-audit-report.json"), "utf8")) as { results: Array<{ control_point_id: string; module: string; status: string; score: number; evidence: { db_rows: number; api_status: number; route_ok: boolean; workflow_test_ok: boolean } }> };

  await mkdir(outputDir, { recursive: true });

  const extractStart = new Date().toISOString();
  const partialControls: PartialControlPoint[] = sourceAudit.results
    .filter((record) => record.status === "PARTIAL")
    .map((record) => ({
      id: record.control_point_id,
      module: record.module,
      reason: `score=${record.score}; db_rows=${record.evidence.db_rows}; api_status=${record.evidence.api_status}; route_ok=${record.evidence.route_ok}; workflow_ok=${record.evidence.workflow_test_ok}`,
      missing_evidence: [
        record.evidence.db_rows === 0 ? "DB" : null,
        record.evidence.api_status !== 200 ? "API" : null,
        !record.evidence.route_ok ? "ROUTE" : null,
        !record.evidence.workflow_test_ok ? "WORKFLOW" : null,
      ].filter((value): value is string => Boolean(value)),
    }));
  await writeFile(path.join(process.cwd(), "artifacts", "partial-control-points.json"), `${JSON.stringify(partialControls, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputDir, "partial-control-points.json"), `${JSON.stringify(partialControls, null, 2)}\n`, "utf8");
  const extractEnd = new Date().toISOString();
  logs.push({ step: "Extract Partial Control Points", start: extractStart, end: extractEnd, duration: duration(extractStart, extractEnd), status: "PASS" });

  const rootStart = new Date().toISOString();
  const partialRootCause = await writePartialRootCauseReport(partialControls.map((record) => ({
    control_point_id: record.id,
    module: record.module,
    evidence: {
      db_rows: record.missing_evidence.includes("DB") ? 0 : 1,
      api_status: record.missing_evidence.includes("API") ? 0 : 200,
      route_ok: !record.missing_evidence.includes("ROUTE"),
      workflow_test_ok: !record.missing_evidence.includes("WORKFLOW"),
    },
  })), path.join(outputDir, "partial-root-cause.json"));
  await writeFile(path.join(process.cwd(), "artifacts", "partial-root-cause.json"), `${JSON.stringify(partialRootCause, null, 2)}\n`, "utf8");
  const rootEnd = new Date().toISOString();
  logs.push({ step: "Root Cause Classification", start: rootStart, end: rootEnd, duration: duration(rootStart, rootEnd), status: "PASS" });

  const targetedStart = new Date().toISOString();
  const targetedAudit = await runTargetedRealControlPointAudit(partialControls.map((record) => record.id), { artifactRoot: outputDir, backendBaseUrl: process.env.BACKEND_BASE_URL, companyId: Number(process.env.COMPANY_ID ?? 2) });
  const targetedEnd = new Date().toISOString();
  logs.push({ step: "Targeted Audit", start: targetedStart, end: targetedEnd, duration: duration(targetedStart, targetedEnd), status: targetedAudit.summary.partial === 0 && targetedAudit.summary.fail === 0 ? "PASS" : "PARTIAL" });

  const finalStart = new Date().toISOString();
  const finalAudit = await runRealControlPointAudit({ artifactRoot: outputDir, backendBaseUrl: process.env.BACKEND_BASE_URL, companyId: Number(process.env.COMPANY_ID ?? 2) });
  const finalEnd = new Date().toISOString();
  logs.push({ step: "Final Audit", start: finalStart, end: finalEnd, duration: duration(finalStart, finalEnd), status: finalAudit.summary.partial === 0 && finalAudit.summary.fail === 0 ? "PASS" : "PARTIAL" });

  await copyFile(path.join(sourceDir, "workflow-proof.json"), path.join(outputDir, "workflow-proof.json"));

  const executionLog = [
    "# Execution Log",
    "",
    ...logs.map((log) => [`Step: ${log.step}`, `Start: ${log.start}`, `End: ${log.end}`, `Duration: ${log.duration}`, `Status: ${log.status}`, ""].join("\n")),
  ].join("\n");
  await writeFile(path.join(outputDir, "execution-log.md"), `${executionLog}\n`, "utf8");
  await writeFile(path.join(outputDir, "execution-time-report.md"), `${executionLog}\n`, "utf8");

  const blockers = finalAudit.results.filter((record) => record.status !== "PASS").map((record) => ({ id: record.control_point_id, module: record.module, reason: analyzePartialControlPoint(record.evidence) }));
  await writeFile(path.join(outputDir, "blockers.json"), `${JSON.stringify(blockers, null, 2)}\n`, "utf8");

  process.stdout.write(`${JSON.stringify({ outputDir, targetedSummary: targetedAudit.summary, finalSummary: finalAudit.summary }, null, 2)}\n`);
}

void main();