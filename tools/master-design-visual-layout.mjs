import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const repoRoot = process.cwd();
const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3006").trim().replace(/\/$/, "");
const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const artifactDir = path.resolve(process.env.OUTPUT_DIR ?? path.join(repoRoot, "artifacts", `master_design_ui_only_${timestamp}`));

const dirs = {
  root: artifactDir,
  screenshots: path.join(artifactDir, "screenshots"),
  logs: path.join(artifactDir, "logs"),
  reports: path.join(artifactDir, "reports"),
};

const executionLog = [];
const validationResults = [];

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
  const access = validationResults.find((item) => item.type === "access");
  const home = validationResults.find((item) => item.type === "home-categories");
  const standards = validationResults.find((item) => item.type === "standards-category");
  const formStandards = validationResults.find((item) => item.type === "form-standards-category");
  const detail = validationResults.find((item) => item.type === "detail-panel");
  const navigation = validationResults.find((item) => item.type === "navigation");
  const summary = validationResults.find((item) => item.type === "summary-strip");
  const existing = validationResults.find((item) => item.type === "existing-features");

  return [
    "# Master Design Visual Layout Validation",
    "",
    `Generated: ${now()}`,
    `Base URL: ${baseUrl}`,
    "",
    "## Validation Status",
    `- Access: ${access?.worked ? "pass" : "fail"}`,
    `- Level 1 main category cards: ${home?.worked ? "pass" : "fail"}`,
    `- Level 2 standards drill-down: ${standards?.worked ? "pass" : "fail"}`,
    `- Level 3 form standards drill-down: ${formStandards?.worked ? "pass" : "fail"}`,
    `- Detail panel: ${detail?.worked ? "pass" : "fail"}`,
    `- Breadcrumb and back navigation: ${navigation?.worked ? "pass" : "fail"}`,
    `- Summary strip visible: ${summary?.worked ? "pass" : "fail"}`,
    `- Existing progress table and execution summary: ${existing?.worked ? "pass" : "fail"}`,
    "",
    "## Observed State",
    `- Access final URL: ${access?.finalUrl ?? "n/a"}`,
    `- Home categories count: ${home?.cardCount ?? 0}`,
    `- Standards section title: ${standards?.currentTitle ?? "n/a"}`,
    `- Form Standards section title: ${formStandards?.currentTitle ?? "n/a"}`,
    `- Detail panel title: ${detail?.detailTitle ?? "n/a"}`,
    `- Breadcrumb labels: ${(navigation?.breadcrumbLabels ?? []).join(" > ")}`,
    `- Summary strip visible: ${summary?.summaryVisible ?? false}`,
    `- Progress table visible: ${existing?.progressTableVisible ?? false}`,
    `- Execution summary visible: ${existing?.executionSummaryVisible ?? false}`,
  ].join("\n");
}

async function main() {
  await ensureDirs();
  await log(`Artifact directory ready at ${artifactDir}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1400 } });

  try {
    await log("Opening user workspace and navigating to Master Design from the sidebar.");
    await page.goto(`${baseUrl}/workspace/user`, { waitUntil: "networkidle" });
    await page.locator('aside a[href="/workspace/master-design"]').first().click();
    await page.waitForURL(`**/workspace/master-design`, { timeout: 30000 });

    const accessResult = {
      type: "access",
      worked: page.url().endsWith("/workspace/master-design"),
      finalUrl: page.url(),
      sidebarLinkVisible: await page.locator('aside a[href="/workspace/master-design"]').count().catch(() => 0) >= 0,
    };
    await addResult(accessResult);

    await log("Capturing Master Design home with main category cards.");
    const rootCards = page.locator('[data-inspector-master-design-card]');
    const rootTitles = await rootCards.locator('h3').allTextContents();
    await page.screenshot({ path: path.join(dirs.screenshots, 'master-design-home-main-category-cards.png'), fullPage: true });
    const requiredLevelOneCards = [
      'Core System',
      'Engine System',
      'Layer System',
      'Workflow System',
      'Standards',
      'Audits',
      'Navigation / Workspace',
      'UX / UI',
      'Security',
      'Templates',
      'Reports',
      'Proof System',
    ];
    await addResult({
      type: "home-categories",
      worked: requiredLevelOneCards.every((title) => rootTitles.includes(title)) && rootTitles.length === requiredLevelOneCards.length,
      cardCount: rootTitles.length,
      categories: rootTitles,
    });

    await log("Capturing summary strip visibility.");
    await page.locator('[data-inspector-master-design-summary-strip="true"]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(dirs.screenshots, 'summary-strip-visible.png'), fullPage: true });
    const summaryText = await page.locator('[data-inspector-master-design-summary-strip="true"]').textContent();
    await addResult({
      type: "summary-strip",
      worked: await page.locator('[data-inspector-master-design-summary-strip="true"]').isVisible()
        && summaryText?.includes('Whole-system summary')
        && summaryText?.includes('Top blocker summary'),
      summaryVisible: await page.locator('[data-inspector-master-design-summary-strip="true"]').isVisible(),
      summaryText,
    });

    await log("Opening Standards category.");
    await page.locator('[data-inspector-master-design-card="standards"]').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(dirs.screenshots, 'standards-category-open.png'), fullPage: true });
    await addResult({
      type: "standards-category",
      worked: (await page.locator('[data-inspector-master-design-current-title="true"]').textContent()) === "Standards",
      currentTitle: await page.locator('[data-inspector-master-design-current-title="true"]').textContent(),
      formStandardsVisible: await page.locator('[data-inspector-master-design-card="form-standards"]').count() > 0,
    });

    await log("Opening Form Standards sub-category.");
    await page.locator('[data-inspector-master-design-card="form-standards"]').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(dirs.screenshots, 'form-standards-sub-category-open.png'), fullPage: true });
    await addResult({
      type: "form-standards-category",
      worked: (await page.locator('[data-inspector-master-design-current-title="true"]').textContent()) === "Form Standards" && await page.locator('[data-inspector-master-design-card="required-field-visibility"]').count() > 0,
      currentTitle: await page.locator('[data-inspector-master-design-current-title="true"]').textContent(),
      visibleChildren: await page.locator('[data-inspector-master-design-card]').locator('h3').allTextContents(),
    });

    await log("Opening a terminal detail node.");
    await page.locator('[data-inspector-master-design-card="required-field-visibility"]').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(dirs.screenshots, 'detail-panel-open-required-field-visibility.png'), fullPage: true });
    await addResult({
      type: "detail-panel",
      worked: (await page.locator('[data-inspector-master-design-detail-title="true"]').textContent()) === "Required Field Visibility",
      detailTitle: await page.locator('[data-inspector-master-design-detail-title="true"]').textContent(),
      blockerSectionVisible: await page.getByText('Blockers', { exact: true }).count() > 0,
      evidenceVisible: await page.getByText('Right Panel Requirements', { exact: true }).count() > 0,
    });

    await log("Capturing breadcrumb and back navigation state.");
    await page.screenshot({ path: path.join(dirs.screenshots, 'breadcrumb-and-back-navigation-visible.png'), fullPage: true });
    const breadcrumbButtons = page.locator('[data-inspector-master-design-breadcrumbs="true"] button');
    const breadcrumbLabels = (await breadcrumbButtons.allTextContents()).filter((label) => label !== 'Back');
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.waitForTimeout(300);
    const backWorked = (await page.locator('[data-inspector-master-design-current-title="true"]').textContent()) === 'Standards';
    await page.getByRole('button', { name: 'Whole System', exact: true }).click();
    await page.waitForTimeout(300);
    const breadcrumbWorked = (await page.locator('[data-inspector-master-design-current-title="true"]').textContent()) === 'Whole System';
    await addResult({
      type: "navigation",
      worked: breadcrumbLabels.includes('Whole System') && breadcrumbLabels.includes('Standards') && breadcrumbLabels.includes('Form Standards') && backWorked && breadcrumbWorked,
      breadcrumbLabels,
      afterBreadcrumbTitle: await page.locator('[data-inspector-master-design-current-title="true"]').textContent(),
      backWorked,
      breadcrumbWorked,
    });

    await log("Capturing existing progress table and execution summary visibility.");
    await page.locator('[data-inspector-master-design-progress-table="true"]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(dirs.screenshots, 'existing-progress-table-visible.png'), fullPage: true });
    await addResult({
      type: "existing-features",
      worked: await page.locator('[data-inspector-master-design-progress-table="true"]').count() > 0
        && await page.locator('[data-inspector-master-design-execution-summary="true"]').count() > 0
        && await page.locator('[data-inspector-master-design-card-grid="true"]').count() > 0,
      progressTableVisible: await page.locator('[data-inspector-master-design-progress-table="true"]').isVisible(),
      executionSummaryVisible: await page.locator('[data-inspector-master-design-execution-summary="true"]').isVisible(),
      noDeadEndState: await page.locator('[data-inspector-master-design-card-grid="true"]').isVisible(),
    });

    await log("Exporting live hierarchy JSON from the page.");
    const hierarchyExport = await page.locator('#master-design-hierarchy-export').textContent();
    await writeText(path.join(dirs.root, 'hierarchy-export.json'), `${hierarchyExport ?? '{}'}\n`);

    const summary = buildSummary();
    await writeText(path.join(dirs.reports, 'validation-summary.md'), `${summary}\n`);
    await log("Validation complete.");
  } finally {
    await persist();
    await browser.close();
  }
}

main().catch(async (error) => {
  executionLog.push(`[${now()}] Runner failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
  await persist();
  process.exitCode = 1;
});
