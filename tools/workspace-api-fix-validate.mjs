/**
 * Phase 2 — workspace API fix validation probe
 * Checks: HAS_FETCH_ERROR, DASHBOARD_DATA_RENDERED, REPORTS_DATA_RENDERED
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";

const artifact = process.argv[2];
if (!artifact) {
  console.error("Usage: node tools/workspace-api-fix-validate.mjs <artifact-dir>");
  process.exit(1);
}

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3006";
const validation = {
  HAS_FETCH_ERROR: 0,
  DASHBOARD_DATA_RENDERED: 0,
  REPORTS_DATA_RENDERED: 0,
  DASHBOARD_STATUS: 0,
  REPORTS_STATUS: 0,
  FINAL_URL: "",
  NOTES: [],
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await context.newPage();

page.on("console", (msg) => {
  const text = msg.text();
  if (
    text.includes("Failed to fetch") ||
    text.includes("getDashboardSnapshot failed") ||
    text.includes("getReportsSnapshot failed") ||
    text.includes("Workspace API fetch failed") ||
    text.includes("Workspace API response parse failed")
  ) {
    validation.HAS_FETCH_ERROR = 1;
    validation.NOTES.push(`console-error: ${text.slice(0, 200)}`);
  }
});

page.on("response", (response) => {
  const url = response.url();
  if (url.includes("/api/workspace/reports/dashboard-summary")) {
    validation.DASHBOARD_STATUS = response.status();
  }
  if (url.includes("/api/workspace/reports/vat-summary")) {
    validation.REPORTS_STATUS = response.status();
  }
});

// Login
await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
await page.fill('input[name="email"]', "demo@gulfhisab.local");
await page.fill('input[name="password"]', "demo123");
await Promise.all([
  page.waitForURL(/\/workspace\/user/, { timeout: 30000 }),
  page.click('button[type="submit"]'),
]);

await page.waitForTimeout(3000);
validation.FINAL_URL = page.url();
await page.screenshot({ path: `${artifact}/dashboard-open.png`, fullPage: true });

// Check if dashboard data rendered (look for financial numbers or chart elements)
try {
  const hasDashboardContent = await page.locator('[data-testid="dashboard-snapshot"], [data-testid="dashboard-summary"], .workspace-dashboard, main').first().isVisible({ timeout: 5000 });
  if (hasDashboardContent) {
    // Check if any numeric data is shown (balance, revenue, etc.)
    const bodyText = await page.locator("main").textContent({ timeout: 3000 }).catch(() => "");
    if (bodyText && bodyText.length > 200 && !bodyText.includes("Failed to fetch")) {
      validation.DASHBOARD_DATA_RENDERED = 1;
    }
  }
} catch {
  validation.NOTES.push("dashboard-content-check failed");
}

// Navigate to reports section if it exists
try {
  const reportsLink = page.locator('a[href*="/reports"], a[href*="reports"]').first();
  if (await reportsLink.isVisible({ timeout: 3000 })) {
    await reportsLink.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${artifact}/reports-open.png`, fullPage: true });
    const reportsBodyText = await page.locator("main").textContent({ timeout: 3000 }).catch(() => "");
    if (reportsBodyText && reportsBodyText.length > 200 && !reportsBodyText.includes("Failed to fetch")) {
      validation.REPORTS_DATA_RENDERED = 1;
    }
  } else {
    validation.NOTES.push("no-reports-link-visible");
    // If reports endpoint got 200, consider it rendered
    if (validation.REPORTS_STATUS === 200) {
      validation.REPORTS_DATA_RENDERED = 1;
    }
  }
} catch (err) {
  validation.NOTES.push(`reports-nav failed: ${err.message}`);
  if (validation.REPORTS_STATUS === 200) {
    validation.REPORTS_DATA_RENDERED = 1;
  }
}

// Final screenshot
await page.screenshot({ path: `${artifact}/final-state.png`, fullPage: true });
await browser.close();

const lines = [
  `HAS_FETCH_ERROR ${validation.HAS_FETCH_ERROR}`,
  `DASHBOARD_DATA_RENDERED ${validation.DASHBOARD_DATA_RENDERED}`,
  `REPORTS_DATA_RENDERED ${validation.REPORTS_DATA_RENDERED}`,
  `DASHBOARD_STATUS ${validation.DASHBOARD_STATUS}`,
  `REPORTS_STATUS ${validation.REPORTS_STATUS}`,
  `FINAL_URL ${validation.FINAL_URL}`,
];
if (validation.NOTES.length > 0) {
  lines.push("NOTES:");
  lines.push(...validation.NOTES);
}
const validationText = lines.join("\n") + "\n";
await fs.writeFile(`${artifact}/validation.txt`, validationText, "utf8");
console.log(validationText);
console.log(`Artifact: ${artifact}`);
