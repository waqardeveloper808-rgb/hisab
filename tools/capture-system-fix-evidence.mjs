import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const repoRoot = process.cwd();
const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3006").trim().replace(/\/$/, "");
const outputDir = path.resolve(process.env.OUTPUT_DIR ?? path.join(repoRoot, "artifacts", "system-fix-evidence-temp"));
const screenshotDir = path.join(outputDir, "screenshots");
const logFile = path.join(outputDir, "logs", "system-fix-evidence.log");

async function ensureDir(target) {
  await fs.mkdir(target, { recursive: true });
}

async function log(message) {
  await ensureDir(path.dirname(logFile));
  await fs.appendFile(logFile, `[${new Date().toISOString()}] ${message}\n`, "utf8");
}

async function main() {
  await ensureDir(screenshotDir);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1400 } });

  try {
    await log("Opening customer register for validation evidence.");
    await page.goto(`${baseUrl}/workspace/user/customers`, { waitUntil: "networkidle", timeout: 45000 });
    await page.locator('[data-inspector-real-register="customers"]').waitFor({ state: "visible", timeout: 20000 });
    await page.getByRole("button", { name: "Add Customer" }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Create Customer" }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotDir, "01-fixed-validation-customer.png"), fullPage: true });

    await log("Capturing customer workflow continuity evidence.");
    await page.locator('[data-inspector-detail-card="customer"]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(screenshotDir, "02-working-workflow-customer-register.png"), fullPage: true });

    await log("Opening company settings for validation and navigation evidence.");
    await page.goto(`${baseUrl}/workspace/settings/company`, { waitUntil: "networkidle", timeout: 45000 });
    await page.locator("text=Company profile master").waitFor({ state: "visible", timeout: 20000 });
    await page.screenshot({ path: path.join(screenshotDir, "03-fixed-navigation-settings.png"), fullPage: true });

    await page.getByLabel("VAT Number").fill("");
    await page.getByLabel("Postal Code").fill("");
    await page.getByRole("button", { name: "Save settings" }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotDir, "04-fixed-validation-settings.png"), fullPage: true });

    await log("Opening post-fix audit summary evidence.");
    await page.goto(`${baseUrl}/workspace/master-design`, { waitUntil: "networkidle", timeout: 45000 });
    await page.locator('[data-inspector-master-design-card="standards"]').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotDir, "05-updated-audit-results.png"), fullPage: true });
  } finally {
    await browser.close();
  }
}

main().catch(async (error) => {
  await log(`Evidence capture failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
  process.exitCode = 1;
});