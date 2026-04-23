import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3006";
const outputDir = path.join(process.cwd(), "qa_reports", "phase1_ui_completion_20260418");

async function ensureDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

async function shot(locator, name) {
  const filePath = path.join(outputDir, name);
  await locator.screenshot({ path: filePath });
  return path.relative(process.cwd(), filePath).replaceAll("\\", "/");
}

function formCardFromLabel(page, labelText) {
  return page.getByText(labelText, { exact: true }).locator("xpath=ancestor::div[1]/ancestor::div[1]").first();
}

async function gotoWorkspace(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-inspector-shell="workspace"]', { timeout: 20000 });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1520, height: 1180 } });
const page = await context.newPage();

try {
  await ensureDir();
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    screenshots: {},
  };

  await gotoWorkspace(page, "/workspace/user/customers");
  await page.getByRole("button", { name: "Add Customer" }).click();
  await page.waitForSelector('text=Customer name', { timeout: 15000 });
  report.screenshots.customerForm = await shot(formCardFromLabel(page, "Customer name"), "01-customer-form-grid.png");

  await gotoWorkspace(page, "/workspace/user/products");
  await page.getByRole("button", { name: "Add Product" }).click();
  await page.waitForSelector('text=Sale price', { timeout: 15000 });
  report.screenshots.productForm = await shot(formCardFromLabel(page, "Sale price"), "02-product-form-grid.png");

  await gotoWorkspace(page, "/workspace/invoices/new?documentType=tax_invoice");
  await page.waitForSelector('[data-inspector-workflow-form="invoice"]', { timeout: 15000 });
  report.screenshots.invoiceForm = await shot(page.locator('[data-inspector-workflow-form="invoice"]').first(), "03-invoice-form-grid.png");

  await gotoWorkspace(page, "/workspace/user/payments");
  await page.getByRole("button", { name: "Record Payment" }).first().click();
  await page.waitForSelector('[data-inspector-payment-document-select="true"]', { timeout: 15000 });
  await page.locator('[data-inspector-payment-submit="true"]').click();
  await page.waitForSelector('[data-inspector-payment-next-actions="true"]', { timeout: 15000 });
  report.screenshots.workflowButtons = await shot(page.locator('[data-inspector-payment-next-actions="true"]').first(), "04-workflow-next-actions.png");

  await gotoWorkspace(page, "/workspace/user/invoices");
  await page.locator('main [role="button"][tabindex="0"]').first().click();
  await page.waitForSelector('[data-inspector-document-view="invoice"]', { timeout: 15000 });
  report.screenshots.detailPage = await shot(page.locator('[data-inspector-document-view="invoice"]').first(), "05-detail-page-clean-layout.png");

  await fs.writeFile(path.join(outputDir, "phase1-ui-proof-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
  await browser.close();
}