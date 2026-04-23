import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3006";
const outputDir = process.env.OUTPUT_DIR ?? path.join(root, "qa_reports", `master_design_control_surface_${Date.now()}`);
const buildPassed = String(process.env.BUILD_PASSED ?? "false").toLowerCase() === "true";
const stableValidationPath = path.join(root, "logs", "master-design-control-surface-refinement.json");

async function ensureDir(target) {
  await fs.mkdir(target, { recursive: true });
}

async function readJsonFromPage(page) {
  const content = await page.locator("body").textContent();
  if (!content) {
    throw new Error("Master Design status API returned an empty body.");
  }
  return JSON.parse(content);
}

async function waitForRefreshLabelChange(page, previousLabel, timeoutMs = 6000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await page.waitForTimeout(500);
    const nextLabel = (await page.locator("text=/Updated .*/").first().textContent())?.trim() ?? "";
    if (nextLabel && nextLabel !== previousLabel) {
      return nextLabel;
    }
  }

  return previousLabel;
}

async function main() {
  const proofDir = path.join(outputDir, "proof");
  const reportDir = path.join(outputDir, "reports");
  const logsDir = path.join(outputDir, "logs");
  await Promise.all([ensureDir(outputDir), ensureDir(proofDir), ensureDir(reportDir), ensureDir(logsDir), ensureDir(path.dirname(stableValidationPath))]);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });

  let routeOpened = false;
  let tableVisible = false;
  let executionSummaryVisible = false;
  let refreshWorked = false;
  let engineQuerySucceeded = false;
  let engineSnapshot = null;
  const notes = [];

  try {
    await page.goto(`${baseUrl}/workspace/master-design`, { waitUntil: "networkidle", timeout: 45000 });
    routeOpened = true;

    const progressTable = page.locator('[data-inspector-master-design-progress-table="true"]').first();
    const executionSummary = page.locator('[data-inspector-master-design-execution-summary="true"]').first();
    await progressTable.waitFor({ state: "visible", timeout: 20000 });
    await executionSummary.waitFor({ state: "visible", timeout: 20000 });
    tableVisible = await progressTable.isVisible();
    executionSummaryVisible = await executionSummary.isVisible();

    const beforeRefreshLabel = (await page.locator("text=/Updated .*/").first().textContent())?.trim() ?? "";
    await page.getByRole("button", { name: "Refresh" }).first().click();
    await page.waitForLoadState("networkidle");
    const afterRefreshLabel = await waitForRefreshLabelChange(page, beforeRefreshLabel);
    refreshWorked = beforeRefreshLabel !== "" && afterRefreshLabel !== "" && beforeRefreshLabel !== afterRefreshLabel;
    if (!refreshWorked) {
      notes.push(`Refresh label did not change: before='${beforeRefreshLabel}' after='${afterRefreshLabel}'`);
    }

    await page.screenshot({ path: path.join(proofDir, "01-master-design-full-page.png"), fullPage: true });
    await progressTable.screenshot({ path: path.join(proofDir, "02-module-progress-table.png") });
    await executionSummary.screenshot({ path: path.join(proofDir, "03-execution-summary.png") });

    await page.goto(`${baseUrl}/api/master-design/status`, { waitUntil: "networkidle", timeout: 30000 });
    const payload = await readJsonFromPage(page);
    engineSnapshot = payload;
    engineQuerySucceeded = Boolean(payload?.data?.comparison?.executionSummary && payload?.data?.comparison?.modules?.length);
    await fs.writeFile(path.join(reportDir, "master-design-engine-output.json"), JSON.stringify(payload, null, 2));
  } finally {
    await browser.close();
  }

  const validationState = {
    updatedAt: new Date().toISOString(),
    buildPassed,
    routeOpened,
    moduleProgressTableVisible: tableVisible,
    executionSummaryVisible,
    refreshWorked,
    engineQuerySucceeded,
    screenshots: [
      path.join(proofDir, "01-master-design-full-page.png"),
      path.join(proofDir, "02-module-progress-table.png"),
      path.join(proofDir, "03-execution-summary.png"),
    ],
    notes,
  };

  await fs.writeFile(stableValidationPath, JSON.stringify(validationState, null, 2));
  await fs.writeFile(path.join(reportDir, "master-design-control-surface-validation.json"), JSON.stringify(validationState, null, 2));
  await fs.writeFile(path.join(logsDir, "capture-master-design-control-surface.log"), [
    `baseUrl=${baseUrl}`,
    `routeOpened=${routeOpened}`,
    `moduleProgressTableVisible=${tableVisible}`,
    `executionSummaryVisible=${executionSummaryVisible}`,
    `refreshWorked=${refreshWorked}`,
    `engineQuerySucceeded=${engineQuerySucceeded}`,
    `buildPassed=${buildPassed}`,
    ...notes,
  ].join("\n"));

  await fs.writeFile(path.join(reportDir, "master-design-control-surface-report.json"), JSON.stringify({
    validationState,
    engineSummary: engineSnapshot?.data?.comparison?.executionSummary ?? null,
    counts: engineSnapshot?.data?.comparison?.counts ?? null,
  }, null, 2));

  process.stdout.write(JSON.stringify({
    outputDir,
    validationState,
    engineOutputPath: path.join(reportDir, "master-design-engine-output.json"),
  }, null, 2));
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});