import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3006";
const outputDir = path.join(process.cwd(), "qa_reports", "ui_density_20260418");

async function ensureDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

async function shot(page, name, locator = null, fullPage = true) {
  const filePath = path.join(outputDir, name);
  if (locator) {
    await locator.screenshot({ path: filePath });
  } else {
    await page.screenshot({ path: filePath, fullPage });
  }
  return path.relative(process.cwd(), filePath).replaceAll("\\", "/");
}

async function gotoRoute(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-inspector-shell="workspace"]', { timeout: 20000 });
}

async function ensureSalesGroupOpen(page) {
  const salesNav = page.locator('nav[aria-label="Sales"]');
  if (await salesNav.count()) {
    return;
  }
  await page.getByRole("button", { name: /^Sales$/ }).click();
  await page.waitForSelector('nav[aria-label="Sales"]', { timeout: 10000 });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1500, height: 1200 } });
const page = await context.newPage();

try {
  await ensureDir();
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    screenshots: {},
  };

  await gotoRoute(page, "/workspace/invoices/new?documentType=tax_invoice");
  await ensureSalesGroupOpen(page);
  report.screenshots.sidebar = await shot(page, "01-sidebar-collapsed-sales.png", page.locator("aside").first());
  report.screenshots.invoiceCreate = await shot(page, "02-invoice-create-screen.png", page.locator('[data-inspector-workflow-form="invoice"]').first());
  report.screenshots.lineItems = await shot(page, "03-line-items-table.png", page.locator('[data-inspector-workflow-step="line-editor"]').first());

  await gotoRoute(page, "/workspace/user/invoice-templates");
  report.screenshots.formGrid = await shot(page, "04-form-grid-template-editor.png", page.locator("main").first());

  await gotoRoute(page, "/workspace/user/invoices");
  const firstInvoiceRow = page.locator('main [role="button"][tabindex="0"]').first();
  await firstInvoiceRow.click();
  await page.waitForSelector('[data-inspector-document-view="invoice"]', { timeout: 15000 });
  report.screenshots.detailPage = await shot(page, "05-invoice-detail-hierarchy.png", page.locator('[data-inspector-document-view="invoice"]').first());

  await fs.writeFile(path.join(outputDir, "ui-density-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
  await browser.close();
}