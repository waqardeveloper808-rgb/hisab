import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

/** tsx does not auto-load `.env.local`; Next.js-only vars must exist for audit collector + workspace API. */
function loadDotenvLocal(): void {
  const filePath = path.join(process.cwd(), ".env.local");
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotenvLocal();

/**
 * Audit engine CLI — used by npm scripts:
 * - audit:control-points:stable → --scope=full_system
 * - audit:control-points:runtime → --scope=full_system (same registry; uses live collector when BASE_URL reachable)
 * - audit:control-points:ui → --scope=route --route=/workspace/admin/audit
 *
 * Env: BASE_URL or GULF_HISAB_BASE_URL (default http://127.0.0.1:3000). For local proof runs, start `next start` and set BASE_URL to the same origin (e.g. http://127.0.0.1:3010).
 */
import { loadControlPointRegistry } from "@/lib/audit-engine/registry";
import { collectLiveAuditRuntimeContext } from "@/lib/audit-engine/live-collector";
import { runAuditExecution } from "@/lib/audit-engine/orchestrator";

type CliOptions = {
  scope: "full_system" | "module" | "route" | "workflow" | "selected_controls";
  module?: string;
  routePattern?: string;
  workflowIdentifier?: string;
  controlIds?: string[];
  outputDir: string;
};

function parseArgs(argv: string[]): CliOptions {
  const scopeArg = argv.find((value) => value.startsWith("--scope="))?.split("=")[1];
  const scope = (scopeArg === "module" || scopeArg === "route" || scopeArg === "workflow" || scopeArg === "selected_controls" ? scopeArg : "full_system") as CliOptions["scope"];
  const module = argv.find((value) => value.startsWith("--module="))?.split("=")[1];
  const routePattern = argv.find((value) => value.startsWith("--route="))?.split("=")[1];
  const workflowIdentifier = argv.find((value) => value.startsWith("--workflow="))?.split("=")[1];
  const controlIds = argv.find((value) => value.startsWith("--control-ids="))?.split("=")[1]?.split(",").map((value) => value.trim()).filter(Boolean);
  const outputDir = argv.find((value) => value.startsWith("--output-dir="))?.split("=")[1]
    ?? path.join(process.cwd(), "artifacts", `audit_engine_cli_${new Date().toISOString().replace(/[:.]/g, "-")}`);

  return { scope, module, routePattern, workflowIdentifier, controlIds, outputDir };
}

async function writeReport(outputDir: string, fileName: string, value: unknown) {
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, fileName), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const registry = await loadControlPointRegistry();
  const origin = process.env.BASE_URL ?? process.env.GULF_HISAB_BASE_URL ?? "http://127.0.0.1:3000";
  const cookie = process.env.AUDIT_COOKIE ?? null;
  const liveContext = await collectLiveAuditRuntimeContext(origin, cookie, {
    scope: options.scope,
    module: options.module,
    route_pattern: options.routePattern,
    workflow_identifier: options.workflowIdentifier,
    control_ids: options.controlIds,
  }, registry);
  const execution = await runAuditExecution({
    request: {
      scope: options.scope,
      module: options.module,
      route_pattern: options.routePattern,
      workflow_identifier: options.workflowIdentifier,
      control_ids: options.controlIds,
    },
    context: liveContext,
  });

  await writeReport(options.outputDir, "audit-run.json", execution.session);
  await writeReport(options.outputDir, "audit-summary.json", execution.summary);
  await writeReport(options.outputDir, "control-results.json", execution.control_results);
  await writeReport(options.outputDir, "retest-queue.json", execution.retest_queue);

  process.stdout.write(`${JSON.stringify({
    outputDir: options.outputDir,
    auditId: execution.session.audit_id,
    summary: execution.summary,
    sessionStatus: execution.session.status,
  }, null, 2)}\n`);
}

main().catch((error) => {
  const fallbackOptions = parseArgs(process.argv.slice(2));
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack ?? "" : "";
  process.stderr.write(`${JSON.stringify({
    status: "fail",
    scope: fallbackOptions.scope,
    message,
    stack,
  }, null, 2)}\n`);
  process.exitCode = 1;
});
