import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const repoRoot = process.cwd();
const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3006").trim().replace(/\/$/, "");
const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const artifactDir = path.resolve(process.env.OUTPUT_DIR ?? path.join(repoRoot, "artifacts", `control_points_integration_${timestamp}`));

const dirs = {
  root: artifactDir,
  screenshots: path.join(artifactDir, "screenshots"),
  logs: path.join(artifactDir, "logs"),
  reports: path.join(artifactDir, "reports"),
};

const executionLog = [];
const validationResults = [];

const expectedFormStandards = [
  "Required Field Visibility",
  "Inline Validation",
  "Error Clarity",
  "Save Behavior",
  "Draft Behavior",
  "Blocker Explanation Rule",
];

function now() {
  return new Date().toISOString();
}

async function ensureDirs() {
  await Promise.all(Object.values(dirs).map((dir) => fs.mkdir(dir, { recursive: true })));
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(filePath, value) {
  await fs.writeFile(filePath, value, "utf8");
}

async function persist() {
  await Promise.all([
    writeText(path.join(dirs.logs, "execution-log.md"), `${executionLog.join("\n")}\n`),
    writeJson(path.join(dirs.reports, "validation-results.json"), validationResults),
  ]);
}

async function log(message) {
  executionLog.push(`[${now()}] ${message}`);
  await persist();
}

async function addResult(result) {
  validationResults.push({ timestamp: now(), ...result });
  await persist();
}

function buildSummary() {
  const standards = validationResults.find((item) => item.type === "standards-category");
  const formStandards = validationResults.find((item) => item.type === "form-standards-view");
  const detail = validationResults.find((item) => item.type === "control-point-detail");
  const hierarchy = validationResults.find((item) => item.type === "hierarchy-export");
  const navigation = validationResults.find((item) => item.type === "navigation");

  return [
    "# Control Points Integration Validation",
    "",
    `Generated: ${now()}`,
    `Base URL: ${baseUrl}`,
    "",
    "## Validation Status",
    `- Standards category opened: ${standards?.worked ? "pass" : "fail"}`,
    `- Form Standards uses dataset children: ${formStandards?.worked ? "pass" : "fail"}`,
    `- Control point detail panel renders full rule: ${detail?.worked ? "pass" : "fail"}`,
    `- Hierarchy export reflects dynamic standards: ${hierarchy?.worked ? "pass" : "fail"}`,
    `- Navigation still works: ${navigation?.worked ? "pass" : "fail"}`,
    "",
    "## Observed State",
    `- Standards title: ${standards?.currentTitle ?? "n/a"}`,
    `- Form Standards children: ${(formStandards?.visibleChildren ?? []).join(", ")}`,
    `- Detail title: ${detail?.detailTitle ?? "n/a"}`,
    `- Detail status: ${detail?.statusText ?? "n/a"}`,
    `- Detail severity: ${detail?.severityText ?? "n/a"}`,
    `- Breadcrumb labels: ${(navigation?.breadcrumbLabels ?? []).join(" > ")}`,
  ].join("\n");
}

async function main() {
  await ensureDirs();
  await log(`Artifact directory ready at ${artifactDir}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1400 } });

  try {
    await log("Opening Master Design route.");
    await page.goto(`${baseUrl}/workspace/master-design`, { waitUntil: "networkidle", timeout: 45000 });
    await page.locator('[data-inspector-master-design-hierarchy="true"]').waitFor({ state: "visible", timeout: 20000 });

    await log("Opening Standards category.");
    await page.locator('[data-inspector-master-design-card="standards"]').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(dirs.screenshots, "01-standards-category.png"), fullPage: true });
    await addResult({
      type: "standards-category",
      worked: (await page.locator('[data-inspector-master-design-current-title="true"]').textContent()) === "Standards",
      currentTitle: await page.locator('[data-inspector-master-design-current-title="true"]').textContent(),
      visibleCards: await page.locator('[data-inspector-master-design-card]').locator('h3').allTextContents(),
    });

    await log("Opening Form Standards category.");
    await page.locator('[data-inspector-master-design-card="form-standards"]').click();
    await page.waitForTimeout(300);
    const visibleChildren = await page.locator('[data-inspector-master-design-card]').locator('h3').allTextContents();
    await page.screenshot({ path: path.join(dirs.screenshots, "02-form-standards-view.png"), fullPage: true });
    await addResult({
      type: "form-standards-view",
      worked: expectedFormStandards.every((item) => visibleChildren.includes(item)) && visibleChildren.length === expectedFormStandards.length,
      currentTitle: await page.locator('[data-inspector-master-design-current-title="true"]').textContent(),
      visibleChildren,
    });

    await log("Opening Required Field Visibility control point.");
    await page.locator('[data-inspector-master-design-card="required-field-visibility"]').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(dirs.screenshots, "03-control-point-detail-panel.png"), fullPage: true });

    const detailPanelText = await page.locator('[data-inspector-master-design-detail-panel="true"]').textContent();
    const detailStatus = await page.locator('[data-inspector-master-design-detail-panel="true"]').locator("text=NOT_IMPLEMENTED").first().textContent().catch(() => null);
    const detailSeverity = await page.locator('[data-inspector-master-design-detail-panel="true"]').locator("text=/high|medium|low|critical/").first().textContent().catch(() => null);
    await addResult({
      type: "control-point-detail",
      worked: (await page.locator('[data-inspector-master-design-detail-title="true"]').textContent()) === "Required Field Visibility"
        && (detailPanelText?.includes("Rule and Condition") ?? false)
        && (detailPanelText?.includes("Audit Steps") ?? false)
        && (detailPanelText?.includes("Evidence Required") ?? false),
      detailTitle: await page.locator('[data-inspector-master-design-detail-title="true"]').textContent(),
      statusText: detailStatus,
      severityText: detailSeverity,
      detailPanelText,
    });

    await log("Capturing proof of control-point data visibility.");
    await page.locator('[data-inspector-master-design-control-point-detail="true"]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(dirs.screenshots, "04-control-point-data-visible.png"), fullPage: true });

    await log("Exporting rendered hierarchy JSON.");
    const hierarchyExport = JSON.parse((await page.locator('#master-design-hierarchy-export').textContent()) ?? "{}");
    await writeJson(path.join(dirs.root, "mapping-output.json"), hierarchyExport);
    const standardsNode = (hierarchyExport.children ?? []).find((node) => node.id === "standards") ?? null;
    const formStandardsNode = (standardsNode?.children ?? []).find((node) => node.id === "form-standards") ?? null;
    await addResult({
      type: "hierarchy-export",
      worked: Boolean(formStandardsNode) && (formStandardsNode?.children?.length ?? 0) === expectedFormStandards.length,
      standardsChildren: (standardsNode?.children ?? []).map((node) => node.title),
      formStandardsChildren: (formStandardsNode?.children ?? []).map((node) => node.title),
    });

    await log("Validating breadcrumb and back navigation.");
    const breadcrumbLabels = (await page.locator('[data-inspector-master-design-breadcrumbs="true"] button').allTextContents()).filter((label) => label !== "Back");
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.waitForTimeout(300);
    const backWorked = (await page.locator('[data-inspector-master-design-current-title="true"]').textContent()) === "Standards";
    await page.getByRole("button", { name: "Whole System", exact: true }).click();
    await page.waitForTimeout(300);
    const breadcrumbWorked = (await page.locator('[data-inspector-master-design-current-title="true"]').textContent()) === "Whole System";
    await addResult({
      type: "navigation",
      worked: breadcrumbLabels.includes("Whole System") && breadcrumbLabels.includes("Standards") && breadcrumbLabels.includes("Form Standards") && backWorked && breadcrumbWorked,
      breadcrumbLabels,
      backWorked,
      breadcrumbWorked,
    });

    await writeText(path.join(dirs.reports, "validation-summary.md"), `${buildSummary()}\n`);
    await log("Control-point integration validation complete.");
  } finally {
    await persist();
    await browser.close();
  }

  process.stdout.write(JSON.stringify({ artifactDir, validationResults }, null, 2));
}

main().catch(async (error) => {
  executionLog.push(`[${now()}] Runner failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
  await persist();
  process.exitCode = 1;
});