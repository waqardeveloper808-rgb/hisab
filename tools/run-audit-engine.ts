import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
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
  const origin = process.env.BASE_URL ?? process.env.GULF_HISAB_BASE_URL ?? "http://127.0.0.1:3006";
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
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
