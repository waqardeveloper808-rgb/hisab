import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3006";
const loginEmail = process.env.LOGIN_EMAIL ?? "sandbox.admin@gulfhisab.sa";
const loginPassword = process.env.LOGIN_PASSWORD ?? "RecoveryPass123!";
const outputDir = process.env.OUTPUT_DIR ?? path.join(process.cwd(), "artifacts", `register_visibility_${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`);
const screenshotsDir = path.join(outputDir, "screenshots");

const registerSpecs = [
  { key: "customers", route: "/workspace/user/customers", file: "customer-register-proof.json", screenshot: "customers-register.png", selector: '[data-inspector-real-register="customers"]', rowSelector: 'tbody tr' },
  { key: "vendors", route: "/workspace/user/vendors", file: "vendor-register-proof.json", screenshot: "vendors-register.png", selector: '[data-inspector-real-register="vendors"]', rowSelector: 'tbody tr' },
  { key: "products", route: "/workspace/user/products", file: "product-register-proof.json", screenshot: "products-register.png", selector: '[data-inspector-real-register="products"]', rowSelector: 'tbody tr' },
  { key: "invoices", route: "/workspace/user/invoices", file: "invoice-proof.json", screenshot: "invoice-register.png", selector: '[data-inspector-real-register="invoices"]', rowSelector: '[data-inspector-register-row="true"]' },
  { key: "quotations", route: "/workspace/user/quotations", file: "quotation-proof.json", screenshot: "quotation-register.png", selector: '[data-inspector-real-register="quotations"]', rowSelector: '[data-inspector-register-row="true"]' },
  { key: "payments", route: "/workspace/user/payments", file: "payment-register-proof.json", screenshot: "payments-register.png", selector: '[data-inspector-real-register="payments"]', rowSelector: 'tbody tr' },
  { key: "journals", route: "/workspace/user/journal-entries", file: "journal-register-proof.json", screenshot: "journal-register.png", selector: '[data-inspector-real-register="journal-entries"]', rowSelector: 'tbody tr, [data-inspector-register-row="true"]' },
  { key: "inventory", route: "/workspace/user/stock", file: "inventory-proof.json", screenshot: "stock-register.png", selector: '[data-inspector-real-register="inventory-stock"]', rowSelector: '[data-inspector-register-row="true"]' },
  { key: "vat", route: "/workspace/user/vat", file: "vat-proof.json", screenshot: "vat-source-records.png", selector: '[data-inspector-vat-modal="received"]', rowSelector: '[data-inspector-register-row="true"]', openModal: { buttonText: 'See details', section: '[data-inspector-vat-section="received"]' } },
  { key: "trialBalance", route: "/workspace/user/reports/trial-balance", file: "accounting-proof.json", screenshot: "trial-balance.png", selector: 'table', rowSelector: '[data-inspector-register-row="true"]' },
];

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function maybeWaitForNetworkIdle(page) {
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => null);
}

async function login(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email").fill(loginEmail);
  await page.getByLabel("Password").fill(loginPassword);
  await Promise.all([
    page.waitForURL(/\/workspace\/user/, { timeout: 20000 }),
    page.getByRole("button", { name: /log in|opening workspace/i }).click(),
  ]);
  await page.waitForSelector('[data-inspector-shell="workspace"]', { timeout: 20000 });
}

async function countVisibleRows(container, rowSelector) {
  const rows = container.locator(rowSelector);
  const count = await rows.count();
  const texts = [];

  for (let index = 0; index < Math.min(count, 10); index += 1) {
    const text = (await rows.nth(index).innerText()).trim().replace(/\s+/g, " ");
    if (text) {
      texts.push(text);
    }
  }

  return {
    visibleRowCount: count,
    firstRows: texts,
  };
}

async function captureRegister(page, spec) {
  await page.goto(`${baseUrl}${spec.route}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-inspector-shell="workspace"]', { timeout: 20000 });
  await maybeWaitForNetworkIdle(page);

  if (spec.openModal) {
    const section = page.locator(spec.openModal.section).first();
    await section.waitFor({ timeout: 20000 });
    await section.getByRole("button", { name: spec.openModal.buttonText }).click();
  }

  const container = page.locator(spec.selector).first();
  await container.waitFor({ timeout: 20000 });
  const rowData = await countVisibleRows(container, spec.rowSelector);
  const screenshotPath = path.join(screenshotsDir, spec.screenshot);
  await container.screenshot({ path: screenshotPath });

  return {
    register: spec.key,
    route: spec.route,
    selector: spec.selector,
    visibleRowCount: rowData.visibleRowCount,
    meetsThreshold: rowData.visibleRowCount >= 10,
    firstRows: rowData.firstRows,
    screenshot: screenshotPath,
  };
}

async function main() {
  await ensureDir(outputDir);
  await ensureDir(screenshotsDir);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
  const page = await context.newPage();

  await login(page);

  const sessionResponse = await page.request.get(`${baseUrl}/api/auth/session`);
  const sessionPayload = await sessionResponse.json();
  await writeJson(path.join(outputDir, "workspace-session-proof.json"), {
    status: sessionResponse.status(),
    payload: sessionPayload,
  });

  const accessResponse = await page.request.get(`${baseUrl}/api/workspace/access-profile`);
  const accessPayload = await accessResponse.json();
  await writeJson(path.join(outputDir, "dashboard-source-proof.json"), {
    status: accessResponse.status(),
    payload: accessPayload,
  });

  const results = [];
  for (const spec of registerSpecs) {
    const result = await captureRegister(page, spec);
    results.push(result);
    await writeJson(path.join(outputDir, spec.file), result);
  }

  await writeJson(path.join(outputDir, "register-visibility-summary.json"), {
    generatedAt: new Date().toISOString(),
    baseUrl,
    allPassed: results.every((entry) => entry.meetsThreshold),
    registers: results,
  });

  await context.close();
  await browser.close();

  process.stdout.write(`${JSON.stringify({ outputDir, results }, null, 2)}\n`);
}

void main();