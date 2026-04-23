import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.VALIDATION_BASE_URL ?? "http://127.0.0.1:3006";
const headed = process.env.VALIDATION_HEADED === "1";
const outputDir = path.join(process.cwd(), "qa_reports", "invoice_stability_suite");
const previewStorePath = path.join(process.cwd(), "data", "preview-document-store.json");

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function screenshot(page, name) {
  const filePath = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

async function readPreviewStore() {
  return JSON.parse(await fs.readFile(previewStorePath, "utf8"));
}

async function registerEntries() {
  const response = await fetch(`${baseUrl}/api/workspace/reports/invoice-register`);
  const payload = await response.json();
  return payload.data;
}

async function newInvoice(page) {
  await page.goto(`${baseUrl}/workspace/invoices/new`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-inspector-workflow-form="invoice"]');
}

async function selectCustomer(page, name) {
  const trigger = page.getByRole("button", { name: "Customer" }).first();
  await trigger.click();
  await page.getByPlaceholder("Search customer name, city, phone, or email").fill(name);
  await page.getByRole("button", { name: new RegExp(name, "i") }).first().click();
}

async function selectFirstSuggestedItem(page, namePattern = /Monthly bookkeeping/i) {
  const suggestionsVisible = await page.waitForSelector("text=Frequent items", { timeout: 10000 }).then(() => true).catch(() => false);

  if (suggestionsVisible) {
    await page.getByRole("button", { name: namePattern }).first().click();
    return { suggestionsVisible: true, source: "suggestions" };
  }

  const lineEditor = page.locator('[data-inspector-workflow-step="line-editor"]');
  await lineEditor.locator('button[aria-haspopup="listbox"]').first().click();
  await page.getByPlaceholder("Search item name or code").fill("Monthly");
  await page.getByRole("button", { name: namePattern }).first().click();
  return { suggestionsVisible: false, source: "picker-fallback" };
}

async function addSecondLineItem(page, query, itemName) {
  const lineEditor = page.locator('[data-inspector-workflow-step="line-editor"]');
  await lineEditor.getByRole("button", { name: "Add line" }).click();
  await lineEditor.locator('button[aria-haspopup="listbox"]').nth(1).click();
  await page.getByPlaceholder("Search item name or code").fill(query);
  await page.getByRole("button", { name: new RegExp(itemName, "i") }).click();
  return lineEditor;
}

async function issueInvoice(page) {
  const createResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/api/workspace/sales-documents") && !response.url().includes("/finalize"), { timeout: 10000 });
  const finalizeResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/api/workspace/sales-documents/") && response.url().includes("/finalize"), { timeout: 10000 });
  await page.getByRole("button", { name: "Issue / Send" }).first().click({ force: true });
  const createResponse = await createResponsePromise;
  const finalizeResponse = await finalizeResponsePromise;
  const createPayload = await createResponse.json();
  const finalizePayload = await finalizeResponse.json();
  await page.waitForSelector("text=is ready.");
  return {
    createPayload,
    finalizePayload,
    heading: await page.locator("h3").filter({ hasText: /is ready\./ }).first().textContent(),
  };
}

async function verifyStoredAndRegistered(documentNumber) {
  const store = await readPreviewStore();
  const stored = store.find((entry) => entry.document_number === documentNumber) ?? null;
  const register = await registerEntries();
  const registerHit = register.find((entry) => entry.document_number === documentNumber || entry.number === documentNumber) ?? null;
  return { stored, registerHit };
}

async function runScenario1(page, report) {
  await newInvoice(page);
  await selectCustomer(page, "Al Noor Trading");
  const suggestionState = await selectFirstSuggestedItem(page);
  report.scenario1 = {
    suggestionState,
    before: await screenshot(page, "scenario-1-before-issue"),
  };
  const submit = await issueInvoice(page);
  const verification = await verifyStoredAndRegistered(submit.finalizePayload.data.document_number);
  report.scenario1.after = await screenshot(page, "scenario-1-after-issue");
  report.scenario1.documentNumber = submit.finalizePayload.data.document_number;
  report.scenario1.verification = verification;
}

async function runScenario2(page, report) {
  await newInvoice(page);
  await selectCustomer(page, "Diagnostic Customer");
  await page.getByLabel("Currency").fill("USD");
  const suggestionState = await selectFirstSuggestedItem(page, /Monthly bookkeeping|papers|Thermal invoice paper/i);
  report.scenario2 = {
    suggestionState,
  };
  await page.getByRole("button", { name: "Issue / Send" }).first().click({ force: true });
  await page.waitForSelector("text=Buyer VAT number is required for this VAT/ZATCA decision path.");
  report.scenario2.screenshot = await screenshot(page, "scenario-2-missing-vat");
  report.scenario2.message = await page.locator("text=Buyer VAT number is required for this VAT/ZATCA decision path.").first().textContent();
}

async function runScenario3(page, report) {
  await newInvoice(page);
  await selectCustomer(page, "Al Noor Trading");
  const suggestionState = await selectFirstSuggestedItem(page);
  const lineEditor = await addSecondLineItem(page, "Thermal", "Thermal invoice paper");
  await lineEditor.locator('input[type="number"]').nth(4).fill("19");
  await page.waitForSelector("text=requested 19, available 18");
  report.scenario3 = {
    suggestionState,
    beforeRedirect: await screenshot(page, "scenario-3-low-stock"),
  };
  await lineEditor.getByRole("button", { name: "Open stock" }).first().click();
  await page.waitForURL(/\/workspace\/user\/stock/);
  report.scenario3.stock = await screenshot(page, "scenario-3-stock-page");
  await page.getByRole("link", { name: "Return to invoice" }).click();
  await page.waitForURL(/resumeDraft=1/);
  await wait(300);
  const removeButtons = page.locator('[data-inspector-workflow-step="line-editor"]').getByRole("button", { name: "Remove" });
  if (await removeButtons.count()) {
    await removeButtons.last().click();
  }
  const submit = await issueInvoice(page);
  const verification = await verifyStoredAndRegistered(submit.finalizePayload.data.document_number);
  report.scenario3.after = await screenshot(page, "scenario-3-after-issue");
  report.scenario3.documentNumber = submit.finalizePayload.data.document_number;
  report.scenario3.verification = verification;
}

async function runScenario4(page, report) {
  let failFirstTranslate = true;
  await page.route("**/api/platform/translate", async (route) => {
    if (failFirstTranslate) {
      failFirstTranslate = false;
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Forced translation retry validation" }),
      });
      return;
    }

    await route.continue();
  });
  await newInvoice(page);
  await selectCustomer(page, "Al Noor Trading");
  const suggestionState = await selectFirstSuggestedItem(page);
  const lineEditor = page.locator('[data-inspector-workflow-step="line-editor"]');
  const descriptionInput = lineEditor.getByPlaceholder("Description").first();
  await descriptionInput.fill("monthly bookkeeping support");
  await lineEditor.getByRole("button", { name: "Translate" }).first().click();
  await page.waitForSelector("text=Translation failed. Edit manually.");
  await lineEditor.getByRole("button", { name: "Retry" }).first().click();
  await page.waitForSelector("text=Arabic description updated.");
  const arabicValue = await lineEditor.getByPlaceholder("Arabic").first().inputValue();
  const submit = await issueInvoice(page);
  const verification = await verifyStoredAndRegistered(submit.finalizePayload.data.document_number);
  report.scenario4 = {
    suggestionState,
    screenshot: await screenshot(page, "scenario-4-translate-retry"),
    arabicValue,
    documentNumber: submit.finalizePayload.data.document_number,
    verification,
  };
  await page.unroute("**/api/platform/translate");
}

async function runScenario5(page, report) {
  await newInvoice(page);
  await page.getByRole("button", { name: "Issue / Send" }).first().click({ force: true });
  await page.waitForSelector("text=Choose a customer before moving on.");
  report.scenario5 = {
    screenshot: await screenshot(page, "scenario-5-partial-data-block"),
    message: await page.locator("text=Choose a customer before moving on.").first().textContent(),
  };
}

async function runConsecutive(page, report) {
  report.consecutiveRuns = [];
  for (let index = 1; index <= 3; index += 1) {
    await newInvoice(page);
    await selectCustomer(page, "Al Noor Trading");
    const suggestionState = await selectFirstSuggestedItem(page);
    const submit = await issueInvoice(page);
    const verification = await verifyStoredAndRegistered(submit.finalizePayload.data.document_number);
    report.consecutiveRuns.push({
      run: index,
      suggestionState,
      documentNumber: submit.finalizePayload.data.document_number,
      verification,
    });
  }
  await page.getByRole("link", { name: "Open Invoice Register" }).first().click();
  await page.waitForURL(/\/workspace\/user\/invoices/);
  report.registerScreenshot = await screenshot(page, "scenario-register-multiple-invoices");
}

async function main() {
  await ensureDir(outputDir);
  const browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1400 } });
  const page = await context.newPage();
  const report = { baseUrl, timestamp: new Date().toISOString() };

  try {
    await runScenario1(page, report);
    await runScenario2(page, report);
    await runScenario3(page, report);
    await runScenario4(page, report);
    await runScenario5(page, report);
    await runConsecutive(page, report);

    const reportPath = path.join(outputDir, "stability-report.json");
    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ ok: true, reportPath, report }, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : null }, null, 2));
  process.exitCode = 1;
});