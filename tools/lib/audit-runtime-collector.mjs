import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { appendCommandOutput, appendExecutionLog, writeJson, writeText } from "./audit-artifact-writer.mjs";

const execFileAsync = promisify(execFile);

function toMarkdown(result) {
  const lines = [
    "# Runtime Control Point Results",
    "",
    `- status: ${result.status}`,
    `- total: ${result.summary.total}`,
    `- pass: ${result.summary.pass}`,
    `- partial: ${result.summary.partial}`,
    `- fail: ${result.summary.fail}`,
    `- blocked: ${result.summary.blocked}`,
    `- weak_modules: ${result.weakModules.length}`,
    `- critical_failures: ${result.criticalFailures.length}`,
    "",
    "## Weak Modules",
    ...(result.weakModules.length ? result.weakModules.map((item) => `- ${item.module}: ${item.count} non-pass control points`) : ["- none"]),
    "",
    "## Critical Failures",
    ...(result.criticalFailures.length ? result.criticalFailures.map((item) => `- ${item.id} ${item.module_code}: ${item.audit_reason}`) : ["- none"]),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

export async function collectRuntimeAudit({ artifactDir, repoRoot }) {
  const startedAt = new Date().toISOString();
  await appendExecutionLog(artifactDir, `- stage_runtime_collect_start: ${startedAt}`);
  const runner = process.execPath;
  const tsxCliPath = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
  const collectorProgram = [
    'import * as controlPointAuditEngine from "./lib/control-point-audit-engine.ts";',
    'import * as mappingEngine from "./lib/mapping-engine.ts";',
    'const controlPointAuditApi = controlPointAuditEngine.default ?? controlPointAuditEngine;',
    'const mappingApi = mappingEngine.default ?? mappingEngine;',
    'const rows = controlPointAuditApi.evaluateControlPoints();',
    'const map = mappingApi.getActualSystemMap();',
    'const summary = rows.reduce((acc, row) => {',
    '  acc.total += 1;',
    '  const key = row.result.status.toLowerCase();',
    '  acc[key] += 1;',
    '  return acc;',
    '}, { total: 0, pass: 0, partial: 0, fail: 0, blocked: 0 });',
    'const weakModules = Object.values(rows.reduce((acc, row) => {',
    '  const moduleKey = row.controlPoint.module_code;',
    '  acc[moduleKey] ??= { module: moduleKey, count: 0, statuses: [] };',
    '  if (row.result.status !== "PASS") {',
    '    acc[moduleKey].count += 1;',
    '    acc[moduleKey].statuses.push({ id: row.controlPoint.id, status: row.result.status, score: row.result.score });',
    '  }',
    '  return acc;',
    '}, {})).filter((entry) => entry.count > 0).sort((a, b) => b.count - a.count);',
    'const criticalFailures = rows.filter((row) => row.result.status === "FAIL" || row.result.status === "BLOCKED").map((row) => ({',
    '  id: row.controlPoint.id,',
    '  title: row.controlPoint.title,',
    '  module_code: row.controlPoint.module_code,',
    '  audit_reason: row.result.audit_reason,',
    '  score: row.result.score,',
    '}));',
    'const moduleHealthSummary = map.modules.map((module) => ({',
    '  id: module.id,',
    '  status: module.status,',
    '  completionPercentage: module.completionPercentage,',
    '  proofStatus: module.proof.status,',
    '  blockerCount: module.blockers.length,',
    '}));',
    'process.stdout.write(`${JSON.stringify({',
    '  generatedAt: new Date().toISOString(),',
    '  summary,',
    '  weakModules,',
    '  criticalFailures,',
    '  moduleHealthSummary,',
    '  rows: rows.map((row) => ({',
    '    controlPoint: {',
    '      id: row.controlPoint.id,',
    '      title: row.controlPoint.title,',
    '      module_code: row.controlPoint.module_code,',
    '      module_name: row.controlPoint.module_name,',
    '    },',
    '    result: row.result,',
    '  })),',
    '}, null, 2)}\\n`);',
  ].join("\n");
  const command = [tsxCliPath, "-e", collectorProgram];

  try {
    const { stdout, stderr } = await execFileAsync(runner, command, {
      cwd: repoRoot,
      maxBuffer: 1024 * 1024 * 16,
      env: process.env,
    });
    await appendCommandOutput(artifactDir, `$ ${runner} ${command.join(" ")}`);
    if (stderr.trim()) {
      await appendCommandOutput(artifactDir, stderr.trim());
    }
    await appendCommandOutput(artifactDir, stdout.trim());
    const parsed = JSON.parse(stdout);
    const status = parsed.summary.fail > 0 || parsed.summary.blocked > 0 ? "fail" : parsed.summary.partial > 0 ? "partial" : "pass";
    await writeJson(path.join(artifactDir, "runtime-control-point-results.json"), parsed);
    await writeText(path.join(artifactDir, "runtime-control-point-results.md"), toMarkdown({ ...parsed, status }));
    await appendExecutionLog(artifactDir, `- stage_runtime_collect_end: ${new Date().toISOString()}`);
    return {
      collector: "runtime",
      status,
      startedAt,
      endedAt: new Date().toISOString(),
      output: parsed,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await appendCommandOutput(artifactDir, `$ ${runner} ${command.join(" ")}`);
    await appendCommandOutput(artifactDir, `runtime collector failed: ${message}`);
    const failurePayload = {
      generatedAt: new Date().toISOString(),
      status: "fail",
      summary: { total: 0, pass: 0, partial: 0, fail: 0, blocked: 0 },
      weakModules: [],
      criticalFailures: [],
      moduleHealthSummary: [],
      rows: [],
      error: message,
    };
    await writeJson(path.join(artifactDir, "runtime-control-point-results.json"), failurePayload);
    await writeText(path.join(artifactDir, "runtime-control-point-results.md"), `# Runtime Control Point Results\n\n- status: fail\n- error: ${message}\n`);
    await appendExecutionLog(artifactDir, `- stage_runtime_collect_end: ${new Date().toISOString()}`);
    return {
      collector: "runtime",
      status: "fail",
      startedAt,
      endedAt: new Date().toISOString(),
      output: failurePayload,
      error: message,
    };
  }
}