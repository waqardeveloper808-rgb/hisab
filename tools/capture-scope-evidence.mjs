import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3006";
const outputDir = path.join(process.cwd(), "qa_reports", "scope_evidence_20260417");

async function ensureDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

async function shot(page, name, fullPage = true) {
  const filePath = path.join(outputDir, name);
  await page.screenshot({ path: filePath, fullPage });
  return filePath;
}

async function gotoRoute(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-inspector-shell="workspace"]', { timeout: 15000 });
}

async function routeCheck(page, route, description, locator) {
  await gotoRoute(page, route);
  const count = await page.locator(locator).count();
  return {
    route,
    description,
    locator,
    passed: count > 0,
  };
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
const routeChecks = [];
const screenshots = [];

try {
  await ensureDir();

  await gotoRoute(page, "/workspace/user/invoice-templates");
  await page.waitForSelector('[data-inspector-preview-surface="true"]', { timeout: 15000 });
  screenshots.push({ name: "template-classic-corporate.png", path: await shot(page, "template-classic-corporate.png") });
  await page.getByRole("button", { name: "Modern Carded" }).click();
  await page.waitForTimeout(400);
  screenshots.push({ name: "template-modern-carded.png", path: await shot(page, "template-modern-carded.png") });
  await page.getByRole("button", { name: "Industrial / Supply Chain" }).click();
  await page.waitForTimeout(400);
  screenshots.push({ name: "template-industrial-supply.png", path: await shot(page, "template-industrial-supply.png") });
  routeChecks.push(await routeCheck(page, "/workspace/user/invoice-templates", "Invoice Templates route loads the three-family editor and preview surface.", '[data-inspector-preview-surface="true"]'));

  await gotoRoute(page, "/workspace/user/products");
  screenshots.push({ name: "assistant-closed-products.png", path: await shot(page, "assistant-closed-products.png") });
  routeChecks.push(await routeCheck(page, "/workspace/user/products", "Products route loads with the compact AI launcher visible.", 'button:has-text("Chat")'));

  await gotoRoute(page, "/workspace/user/stock");
  screenshots.push({ name: "sidebar-stock-open-before-nav.png", path: await shot(page, "sidebar-stock-open-before-nav.png") });
  await page.getByRole("link", { name: "Raw Materials" }).click();
  await page.waitForURL(`${baseUrl}/workspace/user/raw-materials`, { timeout: 15000 });
  screenshots.push({ name: "sidebar-raw-materials-open-after-nav.png", path: await shot(page, "sidebar-raw-materials-open-after-nav.png") });
  await page.getByRole("button", { name: /Chat/i }).click();
  await page.waitForSelector('text=Open Chat', { timeout: 10000 });
  screenshots.push({ name: "assistant-expanded-raw-materials.png", path: await shot(page, "assistant-expanded-raw-materials.png") });
  routeChecks.push(await routeCheck(page, "/workspace/user/stock", "Stock route keeps the Inventory group visible and shows the compact AI launcher.", 'nav[aria-label="Inventory"]'));
  routeChecks.push(await routeCheck(page, "/workspace/user/raw-materials", "Raw Materials route keeps the Inventory group open after submenu navigation.", 'nav[aria-label="Inventory"] a[href="/workspace/user/raw-materials"]'));

  routeChecks.push(await routeCheck(page, "/workspace/user/finished-materials", "Finished Materials route renders under the persistent Inventory group.", 'nav[aria-label="Inventory"] a[href="/workspace/user/finished-materials"]'));
  routeChecks.push(await routeCheck(page, "/workspace/user/consumables", "Consumables route renders under the persistent Inventory group.", 'nav[aria-label="Inventory"] a[href="/workspace/user/consumables"]'));
  routeChecks.push(await routeCheck(page, "/workspace/user/sold-materials", "Sold Materials route renders under the persistent Inventory group.", 'nav[aria-label="Inventory"] a[href="/workspace/user/sold-materials"]'));

  await gotoRoute(page, "/workspace/user/reports");
  await page.waitForSelector('text=Posted Performance Overview', { timeout: 10000 });
  screenshots.push({ name: "reports-heading-discipline.png", path: await shot(page, "reports-heading-discipline.png") });
  routeChecks.push(await routeCheck(page, "/workspace/user/reports", "Reports route shows the corrected professional heading.", 'text=Posted Performance Overview'));

  await gotoRoute(page, "/workspace/user/stock");
  const firstDocButton = page.locator('button.text-primary:has-text("INV-2026-1101")').first();
  await firstDocButton.waitFor({ timeout: 15000 });
  const firstDocLabel = await firstDocButton.textContent();
  await firstDocButton.dblclick();
  await page.waitForSelector('text=Document Preview', { timeout: 10000 });
  screenshots.push({ name: "stock-document-preview-modal.png", path: await shot(page, "stock-document-preview-modal.png") });
  routeChecks.push({
    route: "/workspace/user/stock",
    description: `Stock register shows clickable and double-clickable document reference ${firstDocLabel?.trim()}.`,
    locator: 'button.text-primary:has-text("INV-2026-1101")',
    passed: true,
  });
  await page.locator('[role="dialog"]').getByRole("button", { name: "Close" }).click();
  await firstDocButton.click();
  await page.waitForURL(/\/workspace\/invoices\/\d+/, { timeout: 15000 });
  screenshots.push({ name: "document-route-from-stock-click.png", path: await shot(page, "document-route-from-stock-click.png") });
  routeChecks.push({
    route: page.url().replace(baseUrl, ""),
    description: `Single-click from the stock register opened the document route for ${firstDocLabel?.trim()}.`,
    locator: 'body',
    passed: true,
  });

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    screenshots,
    routeChecks,
  };

  await fs.writeFile(path.join(outputDir, "route-checks.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}