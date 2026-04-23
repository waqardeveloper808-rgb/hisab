import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type AiMonitorEntry = {
  engine: string;
  status: "PASS" | "PARTIAL" | "FAIL";
  expected_behavior: string;
  observed_behavior: string;
  drift_detected: boolean;
  probable_root_cause: string;
  recommended_correction_path: string[];
};

export type AiMonitorReport = {
  generated_at: string;
  status: "PASS" | "PARTIAL" | "FAIL";
  entries: AiMonitorEntry[];
};

function summarizeStatus(entries: AiMonitorEntry[]): "PASS" | "PARTIAL" | "FAIL" {
  if (entries.every((entry) => entry.status === "PASS")) {
    return "PASS";
  }
  if (entries.every((entry) => entry.status === "FAIL")) {
    return "FAIL";
  }
  return "PARTIAL";
}

export function buildAiMonitorReport(input: {
  sessionOk: boolean;
  registerSummary: { allPassed: boolean; registerCount: number };
  auditStatus: { pass: number; fail: number; partial: number };
  accountingStatus: "PASS" | "PARTIAL" | "FAIL";
  moduleStatus: "PASS" | "PARTIAL" | "FAIL";
}) {
  const entries: AiMonitorEntry[] = [
    {
      engine: "session-engine",
      status: input.sessionOk ? "PASS" : "FAIL",
      expected_behavior: "Workspace session resolves to an authenticated actor and active company.",
      observed_behavior: input.sessionOk ? "Live session proof and access profile both resolved successfully." : "Session proof failed or returned no active company.",
      drift_detected: !input.sessionOk,
      probable_root_cause: input.sessionOk ? "none" : "Workspace session bootstrap drifted from live auth flow.",
      recommended_correction_path: ["lib/auth-session.ts", "app/api/auth/login/route.ts", "app/api/workspace/[...slug]/route.ts"],
    },
    {
      engine: "workspace-visibility-engine",
      status: input.registerSummary.allPassed ? "PASS" : "FAIL",
      expected_behavior: "Each required live register shows at least 10 visible rows under the active session.",
      observed_behavior: `${input.registerSummary.registerCount} registers were audited; allPassed=${input.registerSummary.allPassed}.`,
      drift_detected: !input.registerSummary.allPassed,
      probable_root_cause: input.registerSummary.allPassed ? "none" : "One or more live register pages are not rendering the seeded tenant data visibly.",
      recommended_correction_path: ["tools/run-live-register-visibility-proof.mjs", "components/workspace/InvoiceRegister.tsx", "components/workspace/StockRegister.tsx", "components/workspace/VatOverview.tsx"],
    },
    {
      engine: "audit-engine",
      status: input.auditStatus.fail === 0 ? (input.auditStatus.partial === 0 ? "PASS" : "PARTIAL") : "FAIL",
      expected_behavior: "Control-point audit should produce evidence-based PASS/PARTIAL/FAIL states.",
      observed_behavior: `pass=${input.auditStatus.pass} fail=${input.auditStatus.fail} partial=${input.auditStatus.partial}`,
      drift_detected: input.auditStatus.fail > 0 || input.auditStatus.partial > 0,
      probable_root_cause: input.auditStatus.fail > 0 || input.auditStatus.partial > 0 ? "Some control points still rely on weaker route/API probes than the live UI evidence." : "none",
      recommended_correction_path: ["lib/control-point-audit-engine.ts", "backend/app/Support/Standards/control-point-registry.ts", "lib/root-cause-engine.ts"],
    },
    {
      engine: "accounting-engine",
      status: input.accountingStatus,
      expected_behavior: "Accounting workflows should preserve balanced journals, VAT, receivables, and inventory linkage.",
      observed_behavior: `accounting logical audit status=${input.accountingStatus}`,
      drift_detected: input.accountingStatus !== "PASS",
      probable_root_cause: input.accountingStatus === "PASS" ? "none" : "Accounting workflow evidence still shows missing invariant coverage.",
      recommended_correction_path: ["backend/app/Support/Audit/accounting-logical-audit-engine.ts", "tools/prove-accounting-ui-workflow.mjs"],
    },
    {
      engine: "module-function-engine",
      status: input.moduleStatus,
      expected_behavior: "Modules should respond to list/fetch/create/filter probes without silent failures.",
      observed_behavior: `module function audit status=${input.moduleStatus}`,
      drift_detected: input.moduleStatus !== "PASS",
      probable_root_cause: input.moduleStatus === "PASS" ? "none" : "One or more modules lack full probe coverage or failed a live route contract.",
      recommended_correction_path: ["backend/app/Support/Audit/module-function-audit-engine.ts", "tools/run-monster-system-recovery.ts"],
    },
  ];

  return {
    generated_at: new Date().toISOString(),
    status: summarizeStatus(entries),
    entries,
  } satisfies AiMonitorReport;
}

export async function writeAiMonitorReport(input: Parameters<typeof buildAiMonitorReport>[0], targetFilePath = path.join(process.cwd(), "artifacts", "ai-monitor-report.json")) {
  const report = buildAiMonitorReport(input);
  await mkdir(path.dirname(targetFilePath), { recursive: true });
  await writeFile(targetFilePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}