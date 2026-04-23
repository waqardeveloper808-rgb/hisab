import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { collectUiAuditOptional } from "./lib/audit-ui-collector.mjs";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3006").trim();
const backendBaseUrl = (process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:8000").trim();
const companyId = Number(process.env.COMPANY_ID ?? "2");
const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const artifactRoot = path.join(root, "artifacts", `real_defect_fix_${stamp}`);
const proofRoot = path.join(artifactRoot, "proof");
const screenshotsRoot = path.join(artifactRoot, "screenshots");
const reportsRoot = path.join(artifactRoot, "reports");
const logsRoot = path.join(artifactRoot, "logs");

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function runNodeScript(scriptPath, extraEnv = {}) {
  const env = {
    ...process.env,
    BASE_URL: baseUrl,
    BACKEND_BASE_URL: backendBaseUrl,
    COMPANY_ID: String(companyId),
    ...extraEnv,
  };
  return execFileAsync(process.execPath, [scriptPath], {
    cwd: root,
    env,
    maxBuffer: 1024 * 1024 * 64,
  });
}

async function listMatchingDirs(parentDir, prefix) {
  const entries = await fs.readdir(parentDir, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
    .map((entry) => path.join(parentDir, entry.name));
}

async function newestDir(parentDir, prefix) {
  const matches = await listMatchingDirs(parentDir, prefix);
  if (!matches.length) {
    return null;
  }

  const withStats = await Promise.all(matches.map(async (dirPath) => ({
    dirPath,
    stat: await fs.stat(dirPath),
  })));

  withStats.sort((left, right) => right.stat.mtimeMs - left.stat.mtimeMs);
  return withStats[0]?.dirPath ?? null;
}

async function copyDir(sourceDir, targetDir) {
  await fs.mkdir(targetDir, { recursive: true });
  await fs.cp(sourceDir, targetDir, { recursive: true, force: true });
}

function pick(source, keys) {
  return Object.fromEntries(keys.filter((key) => key in source).map((key) => [key, source[key]]));
}

async function main() {
  const controlPointAuditEngine = await import("../lib/control-point-audit-engine.ts");
  const rootCauseEngine = await import("../lib/root-cause-engine.ts");
  const runRealControlPointAudit = controlPointAuditEngine.runRealControlPointAudit;
  const writeRootCauseReport = rootCauseEngine.writeRootCauseReport;

  if (typeof runRealControlPointAudit !== "function") {
    throw new Error("runRealControlPointAudit is not available from lib/control-point-audit-engine.ts");
  }

  if (typeof writeRootCauseReport !== "function") {
    throw new Error("writeRootCauseReport is not available from lib/root-cause-engine.ts");
  }

  await Promise.all([ensureDir(artifactRoot), ensureDir(proofRoot), ensureDir(screenshotsRoot), ensureDir(reportsRoot), ensureDir(logsRoot)]);

  const executionLines = [
    `# Real Defect Fix Execution ${stamp}`,
    "",
    `- base_url: ${baseUrl}`,
    `- backend_base_url: ${backendBaseUrl}`,
    `- company_id: ${companyId}`,
    `- artifact_root: ${artifactRoot}`,
    "",
  ];

  const auditReport = await runRealControlPointAudit({
    artifactRoot: reportsRoot,
    backendBaseUrl,
    companyId,
  });
  executionLines.push(`- engine_audit: ${path.join(reportsRoot, "engine-audit-report.json")}`);

  const rootCausePayload = await writeRootCauseReport(
    auditReport.results.map((record) => ({
      control_point_id: record.control_point_id,
      evidence: record.evidence,
    })),
    path.join(reportsRoot, "root-cause-report.json"),
  );
  executionLines.push(`- root_cause_report: ${path.join(reportsRoot, "root-cause-report.json")}`);

  const uiAudit = await collectUiAuditOptional({
    artifactDir: artifactRoot,
    baseUrl,
  });

  await fs.writeFile(path.join(reportsRoot, "dashboard-source-proof.json"), `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    uiAudit,
    auditSummary: auditReport.summary,
    failingControlPoints: rootCausePayload.results.slice(0, 12),
  }, null, 2)}\n`, "utf8");
  executionLines.push(`- dashboard_source_proof: ${path.join(reportsRoot, "dashboard-source-proof.json")}`);

  const salesProofDir = path.join(proofRoot, "sales_workflow");
  await ensureDir(salesProofDir);
  const salesRun = await runNodeScript(path.join("tools", "capture-sales-workflow-evidence.mjs"), {
    OUTPUT_DIR: salesProofDir,
    UI_LOGIN_EMAIL: process.env.UI_LOGIN_EMAIL ?? "sandbox.admin@gulfhisab.sa",
    UI_LOGIN_PASSWORD: process.env.UI_LOGIN_PASSWORD ?? "RecoveryPass123!",
  });
  await fs.writeFile(path.join(logsRoot, "sales-workflow.log"), `${salesRun.stdout}\n${salesRun.stderr}`.trim() + "\n", "utf8");
  await fs.copyFile(path.join(salesProofDir, "browser-workflow-report.json"), path.join(reportsRoot, "invoice-proof.json"));
  executionLines.push(`- invoice_proof: ${path.join(reportsRoot, "invoice-proof.json")}`);

  const documentProofDir = path.join(proofRoot, "document_validation");
  await ensureDir(documentProofDir);
  const documentRun = await runNodeScript(path.join("tools", "capture-document-validation.mjs"), {
    OUTPUT_DIR: documentProofDir,
    UI_LOGIN_EMAIL: process.env.UI_LOGIN_EMAIL ?? "sandbox.admin@gulfhisab.sa",
    UI_LOGIN_PASSWORD: process.env.UI_LOGIN_PASSWORD ?? "RecoveryPass123!",
  });
  await fs.writeFile(path.join(logsRoot, "document-validation.log"), `${documentRun.stdout}\n${documentRun.stderr}`.trim() + "\n", "utf8");

  const qaReportsRoot = path.join(root, "qa_reports");
  const accountingBefore = await newestDir(qaReportsRoot, "accounting_ui_workflow_");
  const accountingRun = await runNodeScript(path.join("tools", "prove-accounting-ui-workflow.mjs"), {
    BASE_URL: baseUrl,
    BACKEND_BASE_URL: backendBaseUrl,
    COMPANY_ID: String(companyId),
  });
  await fs.writeFile(path.join(logsRoot, "accounting-ui-workflow.log"), `${accountingRun.stdout}\n${accountingRun.stderr}`.trim() + "\n", "utf8");
  const accountingAfter = await newestDir(qaReportsRoot, "accounting_ui_workflow_");
  if (!accountingAfter || accountingAfter === accountingBefore) {
    throw new Error("Accounting proof directory was not created.");
  }

  const copiedAccountingDir = path.join(proofRoot, path.basename(accountingAfter));
  await copyDir(accountingAfter, copiedAccountingDir);
  const accountingProof = JSON.parse(await fs.readFile(path.join(accountingAfter, "ui-api-proof.json"), "utf8"));

  const accountingSummary = {
    generatedAt: accountingProof.generatedAt,
    uiValidation: accountingProof.uiValidation,
    apiValidation: accountingProof.apiValidation,
    requestResponseTrace: accountingProof.requestResponseTrace,
    failedResponses: accountingProof.failedResponses,
    remaining: accountingProof.remaining,
  };
  const inventorySummary = {
    generatedAt: accountingProof.generatedAt,
    product: accountingProof.product,
    inventory: accountingProof.inventory,
    uiValidation: pick(accountingProof.uiValidation ?? {}, ["inventoryRegister", "inventoryDetails", "inventoryNoFakeError"]),
    apiValidation: pick(accountingProof.apiValidation ?? {}, ["inventoryStock", "inventoryMovement", "inventoryPayloadStructured"]),
    remaining: accountingProof.remaining,
  };
  const vatSummary = {
    generatedAt: accountingProof.generatedAt,
    uiValidation: pick(accountingProof.uiValidation ?? {}, ["vatOverview", "vatNoFakeError", "vatZeroStateAccepted"]),
    apiValidation: pick(accountingProof.apiValidation ?? {}, ["vatSummary", "vatStructuredPayload", "vatTotals"]),
    requestResponseTrace: accountingProof.requestResponseTrace,
  };

  await fs.writeFile(path.join(reportsRoot, "accounting-proof.json"), `${JSON.stringify(accountingSummary, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(reportsRoot, "inventory-proof.json"), `${JSON.stringify(inventorySummary, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(reportsRoot, "vat-proof.json"), `${JSON.stringify(vatSummary, null, 2)}\n`, "utf8");
  executionLines.push(`- accounting_proof: ${path.join(reportsRoot, "accounting-proof.json")}`);
  executionLines.push(`- inventory_proof: ${path.join(reportsRoot, "inventory-proof.json")}`);
  executionLines.push(`- vat_proof: ${path.join(reportsRoot, "vat-proof.json")}`);

  const screenshotSources = [
    path.join(artifactRoot, "screenshots"),
    salesProofDir,
    copiedAccountingDir,
    documentProofDir,
  ];
  for (const source of screenshotSources) {
    const entries = await fs.readdir(source, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (!entry.isFile() || !/\.(png|jpg|jpeg|webp)$/i.test(entry.name)) {
        continue;
      }
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(screenshotsRoot, `${path.basename(source)}-${entry.name}`);
      await fs.copyFile(sourcePath, targetPath).catch(() => undefined);
    }
  }

  await fs.writeFile(path.join(artifactRoot, "execution-log.md"), `${executionLines.join("\n")}\n`, "utf8");
  process.stdout.write(`${artifactRoot}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
