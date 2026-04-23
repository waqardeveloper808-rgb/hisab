import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.VALIDATION_BASE_URL ?? "http://127.0.0.1:3006";
const outputDir = path.join(process.cwd(), "qa_reports");
const headed = process.env.VALIDATION_HEADED === "1";

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickPickerAndChoose(page, trigger, placeholder, query, optionName) {
  await trigger.click();
  const input = page.getByPlaceholder(placeholder);
  await input.fill(query);
  await page.getByRole("button", { name: new RegExp(optionName, "i") }).click();
}

async function readVisibleFeedback(page) {
  const texts = await page.locator("text=/Choose a saved|Buyer VAT number is required|Buyer address is required|This transaction could not be posted|Stock is short|Select the original invoice/").allTextContents().catch(() => []);
  return texts.filter(Boolean);
}

async function clickIssueAndCapture(page) {
  const createResponsePromise = page.waitForResponse((response) => {
    return response.request().method() === "POST"
      && response.url().includes("/api/workspace/sales-documents")
      && !response.url().includes("/finalize");
  }, { timeout: 7000 }).catch(() => null);
  const finalizeResponsePromise = page.waitForResponse((response) => {
    return response.request().method() === "POST"
      && response.url().includes("/api/workspace/sales-documents/")
      && response.url().includes("/finalize");
  }, { timeout: 7000 }).catch(() => null);

  const stickyIssueButton = page.locator('[data-inspector-workflow-submit="true"]').first();
  await stickyIssueButton.scrollIntoViewIfNeeded().catch(() => {});
  await stickyIssueButton.click({ force: true });

  let createResponse = await createResponsePromise;
  let finalizeResponse = await finalizeResponsePromise;

  if (!createResponse || !finalizeResponse) {
    await page.evaluate(() => {
      const button = document.querySelector('[data-inspector-workflow-submit="true"]');
      if (button instanceof HTMLButtonElement) {
        button.click();
      }
    });
    createResponse = createResponse ?? await page.waitForResponse((response) => {
      return response.request().method() === "POST"
        && response.url().includes("/api/workspace/sales-documents")
        && !response.url().includes("/finalize");
    }, { timeout: 7000 }).catch(() => null);
    finalizeResponse = finalizeResponse ?? await page.waitForResponse((response) => {
      return response.request().method() === "POST"
        && response.url().includes("/api/workspace/sales-documents/")
        && response.url().includes("/finalize");
    }, { timeout: 7000 }).catch(() => null);
  }

  return {
    createResponse,
    finalizeResponse,
    feedback: await readVisibleFeedback(page),
    stickyIssueDisabled: await stickyIssueButton.isDisabled().catch(() => null),
  };
}

async function main() {
  await ensureDir(outputDir);

  const browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1400 } });
  const page = await context.newPage();
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
  const browserConsole = [];
  page.on("console", (message) => {
    browserConsole.push(`[${message.type()}] ${message.text()}`);
  });
  const report = {
    baseUrl,
    timestamp: new Date().toISOString(),
    translator: null,
    recommendedItems: [],
    autoFill: null,
    stockWarning: null,
    stockRedirect: null,
    submitResult: null,
    screenshots: {},
    browserConsole,
    failedResponses: [],
  };

  page.on("response", async (response) => {
    if (response.status() < 400) {
      return;
    }

    let body = "";
    try {
      body = (await response.text()).slice(0, 400);
    } catch {
      body = "<unavailable>";
    }

    report.failedResponses.push({
      status: response.status(),
      url: response.url(),
      method: response.request().method(),
      body,
    });
  });

  try {
    await page.goto(`${baseUrl}/workspace/invoices/new`, { waitUntil: "networkidle" });
    await page.waitForSelector('[data-inspector-workflow-form="invoice"]');

    const customerTrigger = page.getByRole("button", { name: "Customer" }).first();
    await clickPickerAndChoose(page, customerTrigger, "Search customer name, city, phone, or email", "Al Noor", "Al Noor Trading");

    await page.waitForSelector("text=Frequent items");
    report.recommendedItems = await page.locator("text=Frequent items").locator("../..").getByRole("button").allTextContents();

    const fullPagePath = path.join(outputDir, "invoice-workflow-full-page.png");
    await page.screenshot({ path: fullPagePath, fullPage: true });
    report.screenshots.fullPage = fullPagePath;

    await page.getByRole("button", { name: /Monthly bookkeeping/i }).click();

    const lineEditor = page.locator('[data-inspector-workflow-step="line-editor"]');
    const descriptionInput = lineEditor.getByPlaceholder("Description").first();
    const arabicInput = lineEditor.getByPlaceholder("Arabic").first();
    const numericInputs = lineEditor.locator('input[type="number"]');
    const firstPriceInput = numericInputs.nth(1);

    report.autoFill = {
      description: await descriptionInput.inputValue(),
      price: await firstPriceInput.inputValue(),
    };

    await descriptionInput.fill("monthly bookkeeping support");
    await lineEditor.getByRole("button", { name: "Translate" }).first().click();
    await page.waitForSelector("text=Translation failed. Edit manually.");
    await lineEditor.getByRole("button", { name: "Retry" }).first().click();
    await page.waitForSelector("text=Arabic description updated.");
    await page.waitForFunction(() => {
      const input = document.querySelector('[data-inspector-workflow-step="line-editor"] input[placeholder="Arabic"]');
      return input instanceof HTMLInputElement && input.value.trim().length > 0;
    });
    report.translator = {
      source: "monthly bookkeeping support",
      result: await arabicInput.inputValue(),
      feedback: await lineEditor.locator("text=Arabic description updated.").first().textContent(),
    };

    await lineEditor.getByRole("button", { name: "Add line" }).click();
    await lineEditor.locator('button[aria-haspopup="listbox"]').nth(1).click();
    await page.getByPlaceholder("Search item name or code").fill("Thermal");
    await page.getByRole("button", { name: /Thermal invoice paper/i }).click();

    const secondRowQuantityInput = numericInputs.nth(4);
    await secondRowQuantityInput.fill("19");
    await page.waitForSelector("text=/requested 19, available \\d+/", { timeout: 10000 });
    report.stockWarning = await lineEditor.locator("text=/requested 19, available \\d+/").first().textContent();

    const lineItemsPath = path.join(outputDir, "invoice-workflow-line-items.png");
    await lineEditor.screenshot({ path: lineItemsPath });
    report.screenshots.lineItems = lineItemsPath;

    await lineEditor.getByRole("button", { name: "Open stock" }).first().click();
    await page.waitForURL(/\/workspace\/user\/stock/);
    report.stockRedirect = {
      url: page.url(),
      returnButtonVisible: await page.getByRole("link", { name: "Return to invoice" }).isVisible(),
    };

    const stockPath = path.join(outputDir, "invoice-workflow-stock-return.png");
    await page.screenshot({ path: stockPath, fullPage: true });
    report.screenshots.stock = stockPath;

    await page.getByRole("link", { name: "Return to invoice" }).click();
    await page.waitForURL(/\/workspace\/invoices\/new/);
    await wait(300);

    const removeButtons = lineEditor.getByRole("button", { name: "Remove" });
    if (await removeButtons.count()) {
      await removeButtons.last().click();
      await wait(300);
    }

    const issueAttempt = await clickIssueAndCapture(page);

    if (!issueAttempt.createResponse || !issueAttempt.finalizeResponse) {
      throw new Error(`Issue action did not dispatch expected requests. Feedback: ${issueAttempt.feedback.join(" | ") || "none"}. Disabled: ${String(issueAttempt.stickyIssueDisabled)}. BrowserConsole: ${browserConsole.join(" || ") || "none"}`);
    }

    const createPayload = await issueAttempt.createResponse.json();
    const finalizePayload = await issueAttempt.finalizeResponse.json();

    await wait(1000);

    const successHeading = page.locator('[data-inspector-workflow-success-heading="true"]').first();
    const successVisible = await successHeading.isVisible().catch(() => false);
    const documentNumber = await page.locator('[data-inspector-workflow-document-number="true"]').first().textContent().catch(() => null);

    report.submitResult = {
      createStatus: issueAttempt.createResponse.status(),
      finalizeStatus: issueAttempt.finalizeResponse.status(),
      createdDocumentNumber: createPayload?.data?.document_number ?? null,
      finalizedDocumentNumber: finalizePayload?.data?.document_number ?? null,
      feedback: issueAttempt.feedback,
      successVisible,
      documentHeader: successVisible ? await successHeading.textContent() : null,
      documentNumber,
      nextAction: await page.locator('[data-inspector-workflow-next-action="true"]').first().textContent().catch(() => null),
      actions: await page.locator('a,button').evaluateAll((nodes) => nodes.map((node) => (node.textContent || "").trim()).filter((text) => ["Create Delivery Note", "Record Payment", "Open Invoice Register"].includes(text))),
    };

    const submitPath = path.join(outputDir, "invoice-workflow-submit-result.png");
    await page.screenshot({ path: submitPath, fullPage: true });
    report.screenshots.submitResult = submitPath;

    await page.getByRole("link", { name: "Open Invoice Register" }).first().click();
    await page.waitForURL(/\/workspace\/user\/invoices/);
    await page.waitForSelector(`text=${report.submitResult.finalizedDocumentNumber}`);
    const registerPath = path.join(outputDir, "invoice-workflow-register.png");
    await page.screenshot({ path: registerPath, fullPage: true });
    report.screenshots.register = registerPath;

    const reportPath = path.join(outputDir, "invoice-workflow-validation.json");
    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ ok: true, reportPath, report }, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : null,
  }, null, 2));
  process.exitCode = 1;
});