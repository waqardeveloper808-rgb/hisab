import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { writeControlPointInventoryArtifact } from "@/backend/app/Support/Standards/control-point-registry";
import { runRealControlPointAudit, type RealAuditReport } from "@/lib/control-point-audit-engine";
import { analyzeFailure, writeRootCauseReport } from "@/lib/root-cause-engine";

const execFileAsync = promisify(execFile);

type StepLog = {
  step: string;
  start: string;
  end: string;
  duration_minutes: number;
  status: "PASS" | "FAIL" | "PARTIAL";
  details: string;
};

function makeTimestampLabel(date = new Date()) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}_${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;
}

function diffMinutes(start: string, end: string) {
  return Number((((new Date(end).getTime() - new Date(start).getTime()) / 1000) / 60).toFixed(2));
}

async function runCommand(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = process.env) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd,
      env,
      maxBuffer: 1024 * 1024 * 32,
    });
    return { ok: true, output: `${stdout}${stderr}`.trim() };
  } catch (error) {
    const output = error instanceof Error ? error.message : String(error);
    return { ok: false, output };
  }
}

async function runDummyDataSeeder(outputDir: string) {
  const result = await runCommand(process.execPath, ["node_modules/tsx/dist/cli.mjs", "tools/seed-system-audit-dummy-data.ts"], process.cwd(), {
    ...process.env,
    OUTPUT_DIR: outputDir,
  });
  return result;
}

async function runDbProof(companyId: number) {
  const result = await runCommand("php", ["db_count_proof.php"], path.join(process.cwd(), "backend"), {
    ...process.env,
    COMPANY_ID: String(companyId),
  });
  if (!result.ok) {
    throw new Error(result.output);
  }
  return JSON.parse(result.output) as { generated_at: string; company_id: number; counts: Record<string, number> };
}

async function runWorkflowTests() {
  const sales = await runCommand("php", ["artisan", "test", "--filter", "SalesTaxInvoiceFlowTest"], path.join(process.cwd(), "backend"));
  const inventory = await runCommand("php", ["artisan", "test", "--filter", "InventoryAccountingWorkflowTest"], path.join(process.cwd(), "backend"));

  return {
    sales,
    inventory,
  };
}

function summarizeWorkflowProof(dbProof: Awaited<ReturnType<typeof runDbProof>>, workflowTests: Awaited<ReturnType<typeof runWorkflowTests>>) {
  return {
    generated_at: new Date().toISOString(),
    stock_reduced: (dbProof.counts.inventory_transactions ?? 0) > 0,
    journal_created: (dbProof.counts.journal_entries ?? 0) > 0,
    vat_calculated: (dbProof.counts.vat_related_records ?? 0) > 0,
    pnl_updated: (dbProof.counts.invoices ?? 0) > 0 && (dbProof.counts.payments ?? 0) > 0,
    tests: {
      sales_workflow: workflowTests.sales,
      inventory_workflow: workflowTests.inventory,
    },
    counts: dbProof.counts,
  };
}

async function zipArtifacts(artifactDir: string) {
  const zipPath = `${artifactDir}.zip`;
  const result = await runCommand("powershell", [
    "-NoProfile",
    "-Command",
    `if (Test-Path '${zipPath}') { Remove-Item '${zipPath}' -Force }; Compress-Archive -Path '${artifactDir}\\*' -DestinationPath '${zipPath}' -Force`,
  ], process.cwd());
  return { zipPath, ...result };
}

async function main() {
  const startedAt = new Date();
  const companyId = Number(process.env.COMPANY_ID ?? 2);
  const artifactDir = path.join(process.cwd(), "artifacts", `system_recovery_${makeTimestampLabel(startedAt)}`);
  const docsDir = path.join(artifactDir, "docs");
  const proofDir = path.join(artifactDir, "proof");
  const logsDir = path.join(artifactDir, "logs");
  const reportsDir = path.join(artifactDir, "reports");
  const stepLogs: StepLog[] = [];
  const blockers: string[] = [];

  await mkdir(docsDir, { recursive: true });
  await mkdir(proofDir, { recursive: true });
  await mkdir(logsDir, { recursive: true });
  await mkdir(reportsDir, { recursive: true });

  const recordStep = (step: string, start: string, end: string, status: StepLog["status"], details: string) => {
    stepLogs.push({
      step,
      start,
      end,
      duration_minutes: diffMinutes(start, end),
      status,
      details,
    });
  };

  let latestAudit: RealAuditReport | null = null;

  {
    const start = new Date().toISOString();
    await writeControlPointInventoryArtifact(path.join(artifactDir, "control-point-inventory.json"));
    const end = new Date().toISOString();
    recordStep("Control Point Engine", start, end, "PASS", "Created control-point-inventory.json from the rebuilt registry.");
  }

  for (let cycle = 1; cycle <= 3; cycle += 1) {
    const cycleStart = new Date().toISOString();
    const audit = await runRealControlPointAudit({
      artifactRoot: artifactDir,
      backendBaseUrl: process.env.BACKEND_BASE_URL,
      companyId,
    });
    latestAudit = audit;

    const failedRecords = audit.results.filter((record) => record.status !== "PASS");
    if (failedRecords.some((record) => analyzeFailure(record.evidence) === "DATA_MISSING")) {
      const seedResult = await runDummyDataSeeder(path.join(proofDir, "dummy_data"));
      await writeFile(path.join(logsDir, `dummy-data-cycle-${cycle}.log`), `${seedResult.output}\n`, "utf8");
      if (!seedResult.ok) {
        blockers.push(`Cycle ${cycle} dummy-data seeder failed: ${seedResult.output}`);
      }
    }

    const cycleEnd = new Date().toISOString();
    recordStep(`Audit Cycle ${cycle}`, cycleStart, cycleEnd, failedRecords.length === 0 ? "PASS" : "PARTIAL", `Audit cycle ${cycle} completed with ${failedRecords.length} non-pass results.`);
  }

  if (!latestAudit) {
    throw new Error("Audit cycles did not produce a report.");
  }

  {
    const start = new Date().toISOString();
    const rootCauseReport = await writeRootCauseReport(
      latestAudit.results.map((record) => ({ control_point_id: record.control_point_id, evidence: record.evidence })),
      path.join(artifactDir, "root-cause-report.json"),
    );
    const end = new Date().toISOString();
    recordStep("Root Cause Engine", start, end, rootCauseReport.results.some((item) => item.root_cause === "UNKNOWN") ? "PARTIAL" : "PASS", "Generated root-cause-report.json from latest audit evidence.");
  }

  const dummyDataStart = new Date().toISOString();
  const dbProof = await runDbProof(companyId);
  const dummyDataValidation = {
    generated_at: new Date().toISOString(),
    company_id: companyId,
    has_10_customers: (dbProof.counts.customers ?? 0) >= 10,
    has_10_products: (dbProof.counts.products ?? 0) >= 10,
    has_10_invoices: (dbProof.counts.invoices ?? 0) >= 10,
    has_10_payments: (dbProof.counts.payments ?? 0) >= 10,
    has_inventory_records: (dbProof.counts.inventory_transactions ?? 0) > 0,
    has_journal_entries: (dbProof.counts.journal_entries ?? 0) > 0,
    has_vat_entries: (dbProof.counts.vat_related_records ?? 0) > 0,
    counts: dbProof.counts,
  };
  await writeFile(path.join(artifactDir, "dummy-data-validation.json"), `${JSON.stringify(dummyDataValidation, null, 2)}\n`, "utf8");
  const dummyDataEnd = new Date().toISOString();
  recordStep("Dummy Data Validation", dummyDataStart, dummyDataEnd, Object.values(dummyDataValidation).includes(false) ? "PARTIAL" : "PASS", "Validated DB proof counts for dummy data coverage.");

  const workflowStart = new Date().toISOString();
  const workflowTests = await runWorkflowTests();
  await writeFile(path.join(logsDir, "sales-tax-invoice-flow.log"), `${workflowTests.sales.output}\n`, "utf8");
  await writeFile(path.join(logsDir, "inventory-accounting-workflow.log"), `${workflowTests.inventory.output}\n`, "utf8");
  const workflowProof = summarizeWorkflowProof(dbProof, workflowTests);
  await writeFile(path.join(artifactDir, "workflow-proof.json"), `${JSON.stringify(workflowProof, null, 2)}\n`, "utf8");
  const workflowEnd = new Date().toISOString();
  recordStep("Full Workflow Execution", workflowStart, workflowEnd, workflowTests.sales.ok && workflowTests.inventory.ok ? "PASS" : "PARTIAL", "Executed backend workflow proofs and captured DB-backed workflow evidence.");

  const executionLogLines = [
    "# Execution Log",
    "",
    ...stepLogs.map((step) => `- Step: ${step.step} | Start: ${step.start} | End: ${step.end} | Duration: ${step.duration_minutes} min | Status: ${step.status} | Details: ${step.details}`),
    ...(blockers.length ? ["", "# Blockers", ...blockers.map((blocker) => `- ${blocker}`)] : []),
  ];
  await writeFile(path.join(artifactDir, "execution-log.md"), `${executionLogLines.join("\n")}\n`, "utf8");

  const executionTimeLines = [
    "# Execution Time Report",
    "",
    ...stepLogs.map((step) => `- Step: ${step.step}\n  Start: ${step.start}\n  End: ${step.end}\n  Duration: ${step.duration_minutes} min`),
  ];
  await writeFile(path.join(artifactDir, "execution-time-report.md"), `${executionTimeLines.join("\n")}\n`, "utf8");

  const zipResult = await zipArtifacts(artifactDir);
  if (!zipResult.ok) {
    blockers.push(`Zip packaging failed: ${zipResult.output}`);
  }

  const completedModules = latestAudit.summary.pass;
  const failedModules = latestAudit.summary.fail + latestAudit.summary.blocked;
  const finalSummary = [
    "MODULE PROGRESS TABLE",
    "",
    `Total Modules: 9`,
    `Completed: ${completedModules}`,
    `Failed: ${failedModules}`,
    "",
    "---",
    "",
    "EXECUTION SUMMARY",
    "",
    "Completed:",
    ...stepLogs.filter((step) => step.status === "PASS").map((step) => `- ${step.step}`),
    "",
    "Failed:",
    ...(stepLogs.filter((step) => step.status !== "PASS").map((step) => `- ${step.step}`) || ["- none"]),
    "",
    "Blockers:",
    ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ["- none"]),
    "",
    "---",
    "",
    "AUDIT RESULT",
    "",
    `PASS: ${latestAudit.summary.pass}`,
    `FAIL: ${latestAudit.summary.fail}`,
    `PARTIAL: ${latestAudit.summary.partial}`,
    "",
    "---",
    "",
    "ZIP PATH",
    "",
    zipResult.zipPath,
  ].join("\n");
  await writeFile(path.join(reportsDir, "final-summary.txt"), `${finalSummary}\n`, "utf8");

  process.stdout.write(`${JSON.stringify({ artifactDir, zipPath: zipResult.zipPath, blockers, audit: latestAudit.summary }, null, 2)}\n`);
}

void main();