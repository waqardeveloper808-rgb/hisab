import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type ModuleProbeResult = {
  module: string;
  status: "PASS" | "PARTIAL" | "FAIL";
  route_open: boolean;
  list_fetch: boolean;
  create_probe: boolean;
  filter_search: boolean;
  session_context_dependency: boolean;
  live_ui_render_path: boolean;
  evidence: string[];
};

export type ModuleFunctionAuditReport = {
  generated_at: string;
  status: "PASS" | "PARTIAL" | "FAIL";
  modules: ModuleProbeResult[];
};

function summarizeStatus(modules: ModuleProbeResult[]): "PASS" | "PARTIAL" | "FAIL" {
  if (modules.every((module) => module.status === "PASS")) {
    return "PASS";
  }
  if (modules.every((module) => module.status === "FAIL")) {
    return "FAIL";
  }
  return "PARTIAL";
}

export function buildModuleFunctionAuditReport(modules: ModuleProbeResult[]): ModuleFunctionAuditReport {
  return {
    generated_at: new Date().toISOString(),
    status: summarizeStatus(modules),
    modules,
  };
}

export async function writeModuleFunctionAuditReport(modules: ModuleProbeResult[], targetFilePath = path.join(process.cwd(), "artifacts", "module-function-audit-report.json")) {
  const report = buildModuleFunctionAuditReport(modules);
  await mkdir(path.dirname(targetFilePath), { recursive: true });
  await writeFile(targetFilePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}