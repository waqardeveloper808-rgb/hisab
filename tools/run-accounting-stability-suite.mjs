import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

async function readDotEnvValue(filePath, key) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
    return match ? match[1].trim().replace(/^"|"$/g, "") : null;
  } catch {
    return null;
  }
}

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3006";
const backendBaseUrl = process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:8000";
const companyId = process.env.COMPANY_ID ?? "2";
const backendEnvPath = path.join(process.cwd(), "backend", ".env");
const apiToken = process.env.API_TOKEN ?? process.env.WORKSPACE_API_TOKEN ?? await readDotEnvValue(backendEnvPath, "WORKSPACE_API_TOKEN") ?? "";
const actorId = process.env.ACTOR_ID ?? process.env.WORKSPACE_API_USER_ID ?? await readDotEnvValue(backendEnvPath, "WORKSPACE_API_USER_ID") ?? "";
const suiteStamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const outputDir = path.join(process.cwd(), "qa_reports", `accounting_stability_suite_${suiteStamp}`);

if (!apiToken || !actorId) {
  throw new Error("Workspace runtime auth values are not configured.");
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function backendFetch(apiPath, init = {}) {
  const response = await fetch(`${backendBaseUrl}/api/companies/${companyId}/${apiPath}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "X-Gulf-Hisab-Workspace-Token": apiToken,
      "X-Gulf-Hisab-Actor-Id": actorId,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Backend request failed for ${apiPath}: ${response.status} ${await response.text()}`);
  }

  return response;
}

async function backendJson(apiPath, init = {}) {
  const response = await backendFetch(apiPath, init);
  return response.json();
}

async function waitForBackendRecord(fetcher, predicate, description, attempts = 24, delayMs = 500) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const payload = await fetcher();
    const match = predicate(payload);
    if (match) {
      return match;
    }
    await wait(delayMs);
  }

  throw new Error(`Timed out waiting for backend record: ${description}`);
}

async function gotoRoute(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-inspector-shell="workspace"]', { timeout: 20000 });
}

async function setupLiveWorkspaceRouting(page) {
  await page.route("**/api/workspace/**", async (route) => {
    const request = route.request();
    const requestUrl = new URL(request.url());
    const backendPath = requestUrl.pathname.replace("/api/workspace/", "");
    const targetUrl = `${backendBaseUrl}/api/companies/${companyId}/${backendPath}${requestUrl.search}`;
    const headers = {
      Accept: request.headers().accept ?? "application/json",
      "X-Gulf-Hisab-Workspace-Token": apiToken,
      "X-Gulf-Hisab-Actor-Id": actorId,
    };

    if (request.headers()["content-type"]) {
      headers["Content-Type"] = request.headers()["content-type"];
    }

    const response = await fetch(targetUrl, {
      method: request.method(),
      headers,
      body: ["GET", "HEAD"].includes(request.method()) ? undefined : request.postDataBuffer(),
    });

    const responseHeaders = Object.fromEntries(response.headers.entries());
    delete responseHeaders["content-encoding"];
    delete responseHeaders["content-length"];
    responseHeaders["x-workspace-mode"] = "live-routed";

    await route.fulfill({
      status: response.status,
      headers: responseHeaders,
      body: Buffer.from(await response.arrayBuffer()),
    });
  });
}

async function capture(page, filePath, locator) {
  await ensureDir(path.dirname(filePath));
  if (locator) {
    await locator.screenshot({ path: filePath });
  } else {
    await page.screenshot({ path: filePath, fullPage: true });
  }
  return path.relative(process.cwd(), filePath).replaceAll("\\", "/");
}

function safeRegex(text) {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

async function maybeReadText(locator) {
  try {
    const count = await locator.count();
    if (!count) {
      return null;
    }
    const text = await locator.first().textContent();
    return text?.trim() || null;
  } catch {
    return null;
  }
}

function findAccount(rows, code) {
  return rows.find((row) => String(row.account_code ?? row.code) === String(code)) ?? null;
}

function accountBalanceMap(rows) {
  return Object.fromEntries(rows.map((row) => [String(row.account_code ?? row.code), Number(row.balance ?? 0)]));
}

function diffBalances(beforeRows, afterRows, accountCodes) {
  const beforeMap = accountBalanceMap(beforeRows);
  const afterMap = accountBalanceMap(afterRows);
  return Object.fromEntries(accountCodes.map((code) => [code, (afterMap[code] ?? 0) - (beforeMap[code] ?? 0)]));
}

async function selectComboboxOption(page, labelText, optionText) {
  const select = page.locator(`label:has-text("${labelText}")`).locator("..").locator("select");
  await select.waitFor({ timeout: 15000 });
  const options = await select.locator("option").allTextContents();
  const match = options.find((option) => option.toLowerCase().includes(optionText.toLowerCase()));
  if (!match) {
    throw new Error(`Option not found for ${labelText}: ${optionText}`);
  }
  await select.selectOption({ label: match });
  return match;
}

async function selectDialogEntity(page, buttonName, placeholderPattern, query, preferredText) {
  await page.getByRole("button", { name: buttonName, exact: true }).first().click();
  const searchInput = page.getByPlaceholder(placeholderPattern).last();
  await searchInput.fill(query);
  await wait(400);
  const target = page.getByRole("button", { name: safeRegex(preferredText) }).first();
  await target.waitFor({ timeout: 15000 });
  await target.click();
}

async function selectLineItemAt(page, lineIndex, query, preferredText) {
  const lineEditor = page.locator('[data-inspector-workflow-step="line-editor"]').first();
  if (lineIndex > 0) {
    await lineEditor.getByRole("button", { name: /Add line/i }).click();
  }
  const browseButtons = lineEditor.getByRole("button", { name: /Browse all/i });
  await browseButtons.nth(lineIndex).click();
  const searchInput = page.getByPlaceholder(/Search item name or code/i).last();
  await searchInput.fill(query);
  await wait(400);
  const target = page.getByRole("button", { name: safeRegex(preferredText) }).first();
  await target.waitFor({ timeout: 15000 });
  await target.click();
}

async function clickIssueAndCapture(page) {
  const createResponsePromise = page.waitForResponse((response) => {
    return response.request().method() === "POST"
      && response.url().includes("/api/workspace/sales-documents")
      && !response.url().includes("/finalize");
  }, { timeout: 15000 }).catch(() => null);
  const finalizeResponsePromise = page.waitForResponse((response) => {
    return response.request().method() === "POST"
      && response.url().includes("/api/workspace/sales-documents/")
      && response.url().includes("/finalize");
  }, { timeout: 15000 }).catch(() => null);

  const submitButton = page.locator('[data-inspector-workflow-submit="true"]').last();
  await submitButton.scrollIntoViewIfNeeded().catch(() => {});
  await submitButton.click({ force: true });

  let createResponse = await createResponsePromise;
  let finalizeResponse = await finalizeResponsePromise;

  if (!createResponse || !finalizeResponse) {
    await page.evaluate(() => {
      const button = document.querySelectorAll('[data-inspector-workflow-submit="true"]');
      const target = button[button.length - 1];
      if (target instanceof HTMLButtonElement) {
        target.click();
      }
    });
    createResponse = createResponse ?? await page.waitForResponse((response) => {
      return response.request().method() === "POST"
        && response.url().includes("/api/workspace/sales-documents")
        && !response.url().includes("/finalize");
    }, { timeout: 15000 }).catch(() => null);
    finalizeResponse = finalizeResponse ?? await page.waitForResponse((response) => {
      return response.request().method() === "POST"
        && response.url().includes("/api/workspace/sales-documents/")
        && response.url().includes("/finalize");
    }, { timeout: 15000 }).catch(() => null);
  }

  return { createResponse, finalizeResponse };
}

async function setLineQuantity(page, lineIndex, quantity) {
  const lineEditor = page.locator('[data-inspector-workflow-step="line-editor"]').first();
  const quantityInput = lineEditor.locator('input[id$="-quantity"]').nth(lineIndex);
  await quantityInput.waitFor({ timeout: 15000 });
  await quantityInput.fill(String(quantity));
}

async function createProduct(page, product, artifactsDir) {
  await gotoRoute(page, "/workspace/user/products");
  await page.getByRole("button", { name: /Add Product/i }).click();
  await page.getByLabel("Name").fill(product.name);
  await page.getByLabel("Code").fill(product.code);
  await page.locator("#product-kind").selectOption("product");
  await page.getByLabel("Sale price").fill(String(product.salePrice));
  await page.getByLabel("Purchase price").fill(String(product.purchasePrice));
  await page.getByRole("button", { name: /Create Item/i }).click();

  const createdItem = await waitForBackendRecord(
    async () => backendJson("items"),
    (payload) => (payload.data ?? []).find((item) => item.name === product.name || item.sku === product.code),
    `item ${product.name}`,
  );

  await page.reload({ waitUntil: "networkidle" });
  await page.getByLabel("Search products and services").fill(product.name);
  const screenshot = await capture(page, path.join(artifactsDir, "01-product-screen.png"), page.locator('[data-inspector-real-register="products"]').first());

  return {
    id: createdItem.id,
    name: createdItem.name,
    sku: createdItem.sku,
    salePrice: Number(createdItem.default_sale_price ?? product.salePrice),
    purchasePrice: Number(createdItem.default_purchase_price ?? product.purchasePrice),
    screenshot,
  };
}

async function createStock(page, config) {
  await gotoRoute(page, "/workspace/user/stock");
  await page.getByRole("button", { name: /Add Inventory/i }).click();
  await selectComboboxOption(page, "Product", config.product.name);
  await page.getByLabel("Product name").fill(config.product.name);
  await page.getByLabel("Material").fill(config.material);
  await page.locator("#inventory-type").selectOption(config.inventoryType);
  await page.getByLabel("Size").fill(config.size);
  await page.getByRole("button", { name: /^Next$/i }).click();
  await page.getByLabel("Quantity").fill(String(config.quantity));
  if (config.unitCost !== undefined) {
    await page.getByLabel("Unit cost").fill(config.unitCost === null ? "" : String(config.unitCost));
  }
  await page.getByLabel("Reorder level").fill(String(config.reorderLevel));
  await page.getByRole("button", { name: /Create inventory/i }).click();

  const screenshot = await capture(page, path.join(config.artifactsDir, config.screenshotName ?? "02-inventory-screen.png"), page.locator('[data-inspector-real-register="inventory-stock"]').first());
  const errorText = await maybeReadText(page.locator('.border-red-200.bg-red-50'));

  if (config.expectError) {
    if (!errorText || !errorText.includes(config.expectError)) {
      throw new Error(`Expected stock intake error '${config.expectError}' but saw '${errorText ?? "<none>"}'.`);
    }
    return { screenshot, errorText };
  }

  const createdStock = await waitForBackendRecord(
    async () => backendJson("inventory/stock"),
    (payload) => (payload.data ?? []).find((row) => row.product_name === config.product.name || row.item_id === config.product.id),
    `inventory ${config.product.name}`,
  );

  return {
    id: createdStock.id,
    code: createdStock.code,
    quantityOnHand: Number(createdStock.quantity_on_hand),
    journalEntryNumber: createdStock.journal_entry_number,
    inventoryAccountCode: createdStock.inventory_account_code ?? "1300",
    screenshot,
  };
}

async function createAndIssueInvoice(page, scenario) {
  await gotoRoute(page, "/workspace/invoices/new?documentType=tax_invoice");

  if (scenario.paymentStatus === "Partial") {
    const paymentPlanning = page.locator('[data-inspector-proforma-payment-status="true"]').first();
    if (!(await paymentPlanning.evaluate((node) => node instanceof HTMLDetailsElement && node.open))) {
      await paymentPlanning.locator("summary").click();
    }
    await page.locator("#proforma-payment-status").selectOption("Partial");
    await page.getByLabel("Amount received").fill(String(scenario.partialReceivedAmount));
  }

  if (scenario.chooseCustomer !== false) {
    await selectDialogEntity(page, "Customer", /Search customer/i, scenario.customerName, scenario.customerName);
  }

  for (let index = 0; index < (scenario.lines ?? []).length; index += 1) {
    const line = scenario.lines[index];
    await selectLineItemAt(page, index, line.product.name, line.product.name);
    await setLineQuantity(page, index, line.quantity);
  }

  const { createResponse, finalizeResponse } = await clickIssueAndCapture(page);
  await wait(1200);

  const submitErrorText = await maybeReadText(page.locator('.border-red-200.bg-red-50'));
  const lineValidationText = await maybeReadText(page.locator('.border-amber-200.bg-amber-50').first());
  const successHeading = await maybeReadText(page.locator('[data-inspector-workflow-success-heading="true"]'));
  const documentNumber = await maybeReadText(page.locator('[data-inspector-workflow-document-number="true"]'));

  const screenshot = await capture(page, path.join(scenario.artifactsDir, scenario.invoiceScreenshotName ?? "03-invoice-screen.png"));

  if (scenario.expectBlockedMessage) {
    const combined = `${submitErrorText ?? ""} ${lineValidationText ?? ""}`.trim();
    if (!combined.includes(scenario.expectBlockedMessage)) {
      throw new Error(`Expected invoice blocking message '${scenario.expectBlockedMessage}' but saw '${combined || "<none>"}'.`);
    }
    return {
      blocked: true,
      submitErrorText,
      lineValidationText,
      successHeading,
      documentNumber,
      screenshot,
    };
  }

  if (!createResponse || !finalizeResponse || !documentNumber) {
    throw new Error(`Invoice submit did not succeed. submitError=${submitErrorText ?? "<none>"}; lineValidation=${lineValidationText ?? "<none>"}; successHeading=${successHeading ?? "<none>"}`);
  }

  const documentsPayload = await backendJson("reports/invoice-register");
  const createdInvoice = (documentsPayload.data ?? []).find((row) => row.document_number === documentNumber);
  if (!createdInvoice) {
    throw new Error(`Issued invoice ${documentNumber} was not found in the backend invoice register.`);
  }

  return {
    blocked: false,
    documentNumber,
    submitErrorText,
    lineValidationText,
    successHeading,
    screenshot,
    createRequestBody: (() => {
      try {
        return createResponse.request().postDataJSON();
      } catch {
        return createResponse.request().postData() ?? null;
      }
    })(),
    createResponseBody: await createResponse.json().catch(async () => createResponse.text()),
    finalizeResponseBody: await finalizeResponse.json().catch(async () => finalizeResponse.text()),
    invoice: {
      id: createdInvoice.id,
      number: createdInvoice.document_number,
      issueDate: createdInvoice.issue_date,
      grandTotal: Number(createdInvoice.grand_total),
      balanceDue: Number(createdInvoice.balance_due),
      paidTotal: Number(createdInvoice.paid_total ?? 0),
      taxableTotal: Number(createdInvoice.taxable_total ?? 0),
      taxTotal: Number(createdInvoice.tax_total ?? 0),
      status: createdInvoice.status,
    },
  };
}

async function recordPayment(page, config) {
  await gotoRoute(page, "/workspace/user/payments");
  await page.locator('[data-inspector-payment-toggle="true"]').click();
  const paymentDocumentSelect = page.locator('[data-inspector-payment-document-select="true"]');
  await paymentDocumentSelect.waitFor({ timeout: 15000 });
  const documentOptions = await paymentDocumentSelect.locator("option").allTextContents();
  const paymentOption = documentOptions.find((option) => option.includes(config.invoiceNumber));
  if (!paymentOption) {
    throw new Error(`Open payment document option was not found for ${config.invoiceNumber}.`);
  }
  await paymentDocumentSelect.selectOption({ label: paymentOption });
  await page.getByLabel("Amount").fill(String(config.amount));
  await page.getByLabel("Reference").fill(config.reference);
  await page.locator('[data-inspector-payment-submit="true"]').click();
  await page.getByText(config.reference, { exact: false }).waitFor({ timeout: 15000 });

  const screenshot = await capture(page, path.join(config.artifactsDir, config.screenshotName ?? "04-payment-screen.png"), page.locator('[data-inspector-real-register="payments"]').first());
  const paymentsPayload = await backendJson("reports/payments-register");
  const createdPayment = (paymentsPayload.data ?? []).find((row) => row.reference === config.reference);
  if (!createdPayment) {
    throw new Error(`Payment ${config.reference} was not found in backend payments register.`);
  }

  return {
    id: createdPayment.id,
    number: createdPayment.payment_number,
    reference: createdPayment.reference,
    amount: Number(createdPayment.amount),
    paymentDate: createdPayment.payment_date,
    screenshot,
  };
}

async function captureAccountingViews(page, invoiceNumber, artifactsDir, prefix = "") {
  await gotoRoute(page, `/workspace/user/journal-entries?document=${encodeURIComponent(invoiceNumber)}`);
  await page.locator('[data-inspector-real-register="journal-entries"]').getByText(invoiceNumber, { exact: false }).first().waitFor({ timeout: 15000 });
  const journalRegister = await capture(page, path.join(artifactsDir, `${prefix}05-journal-register.png`), page.locator('[data-inspector-real-register="journal-entries"]').first());
  const journalDetail = await capture(page, path.join(artifactsDir, `${prefix}06-journal-detail.png`), page.locator('[data-inspector-accounting-detail="journal-entry"]').first());

  await gotoRoute(page, `/workspace/accounting/books?document=${encodeURIComponent(invoiceNumber)}`);
  await page.getByText(invoiceNumber, { exact: false }).first().waitFor({ timeout: 15000 });
  const ledger = await capture(page, path.join(artifactsDir, `${prefix}07-ledger-view.png`));

  await gotoRoute(page, "/workspace/user/reports/trial-balance");
  await page.waitForSelector("text=Trial Balance", { timeout: 15000 });
  const trialBalance = await capture(page, path.join(artifactsDir, `${prefix}08-trial-balance.png`));

  return { journalRegister, journalDetail, ledger, trialBalance };
}

async function validateAccounting(config) {
  const journalsPayload = await backendJson("journals");
  const ledgerPayload = await backendJson("reports/general-ledger");
  const trialBalancePayload = await backendJson("reports/trial-balance");
  const invoiceRegisterPayload = await backendJson("reports/invoice-register");

  const invoiceJournals = (journalsPayload.data ?? []).filter((entry) => (entry.lines ?? []).some((line) => line.document_number === config.invoiceNumber));
  const paymentJournal = invoiceJournals.find((entry) => entry.source_type === "payment")
    ?? (config.paymentReference
      ? (journalsPayload.data ?? []).find((entry) => (entry.reference ?? "") === config.paymentReference || (entry.memo ?? "").includes(config.paymentReference))
      : null);
  const relevantJournalEntries = paymentJournal && !invoiceJournals.some((entry) => entry.id === paymentJournal.id)
    ? [...invoiceJournals, paymentJournal]
    : invoiceJournals;

  const relevantLedgerRows = (ledgerPayload.data ?? []).filter((row) => row.document_number === config.invoiceNumber || (config.paymentReference && (row.description ?? "").includes(config.paymentReference)));
  const trialBalanceRows = trialBalancePayload.data ?? [];
  const invoiceRegisterRow = (invoiceRegisterPayload.data ?? []).find((row) => row.document_number === config.invoiceNumber);
  const trialDebitTotal = trialBalanceRows.reduce((sum, row) => sum + Number(row.debit_total ?? 0), 0);
  const trialCreditTotal = trialBalanceRows.reduce((sum, row) => sum + Number(row.credit_total ?? 0), 0);
  if (trialDebitTotal !== trialCreditTotal) {
    throw new Error(`Trial balance is imbalanced after ${config.invoiceNumber}: debit=${trialDebitTotal}, credit=${trialCreditTotal}.`);
  }

  if (!relevantJournalEntries.length) {
    throw new Error(`No journals found for invoice ${config.invoiceNumber}.`);
  }
  if (!relevantLedgerRows.length) {
    throw new Error(`No ledger rows found for invoice ${config.invoiceNumber}.`);
  }

  const allJournalLines = relevantJournalEntries.flatMap((entry) => entry.lines ?? []);
  const paymentLines = paymentJournal?.lines ?? [];
  const journalLines = relevantJournalEntries.flatMap((entry) => entry.lines ?? []);
  const revenueCredit = relevantLedgerRows.filter((row) => row.account_code === "4000").reduce((sum, row) => sum + Number(row.credit ?? 0), 0);
  const vatCredit = relevantLedgerRows.filter((row) => row.account_code === "2200").reduce((sum, row) => sum + Number(row.credit ?? 0), 0);
  const cogsDebit = journalLines.filter((line) => line.account_code === "5000").reduce((sum, line) => sum + Number(line.debit ?? 0), 0);
  const inventoryCredit = journalLines.filter((line) => line.account_code === config.inventoryAccountCode).reduce((sum, line) => sum + Number(line.credit ?? 0), 0);
  const bankDebit = paymentLines.reduce((sum, line) => sum + Number(line.account_code !== "1100" ? (line.debit ?? 0) : 0), 0);
  const invoiceArDebit = relevantLedgerRows.filter((row) => row.account_code === "1100").reduce((sum, row) => sum + Number(row.debit ?? 0), 0);
  const paymentArCredit = paymentLines.filter((line) => line.account_code === "1100").reduce((sum, line) => sum + Number(line.credit ?? 0), 0);
  const receivableNetForInvoice = invoiceArDebit - paymentArCredit;

  if (revenueCredit <= 0 || vatCredit <= 0 || cogsDebit <= 0 || inventoryCredit <= 0) {
    throw new Error(`Accounting postings were incomplete for ${config.invoiceNumber}.`);
  }
  if (config.expectedPaymentAmount !== undefined && bankDebit < config.expectedPaymentAmount) {
    throw new Error(`Payment journal did not post expected bank debit for ${config.invoiceNumber}.`);
  }
  if (invoiceArDebit <= 0) {
    throw new Error(`Receivable invoice debit missing for ${config.invoiceNumber}.`);
  }
  if (config.expectReceivableCleared && (paymentArCredit <= 0 || Number(invoiceRegisterRow?.balance_due ?? 0) !== 0 || Number(receivableNetForInvoice.toFixed(2)) !== 0)) {
    throw new Error(`Receivable was not cleared for ${config.invoiceNumber}.`);
  }
  if (!config.expectReceivableCleared && (Number(invoiceRegisterRow?.balance_due ?? 0) <= 0 || Number(receivableNetForInvoice.toFixed(2)) <= 0)) {
    throw new Error(`Partial-payment scenario did not leave an open receivable for ${config.invoiceNumber}.`);
  }

  return {
    journalEntryNumbers: relevantJournalEntries.map((entry) => entry.entry_number),
    journalEntries: relevantJournalEntries.map((entry) => ({
      id: entry.id,
      entryNumber: entry.entry_number,
      sourceType: entry.source_type,
      reference: entry.reference,
      memo: entry.memo,
      lines: (entry.lines ?? []).map((line) => ({
        accountCode: line.account_code,
        accountName: line.account_name,
        documentNumber: line.document_number,
        debit: Number(line.debit),
        credit: Number(line.credit),
      })),
    })),
    ledgerRows: relevantLedgerRows.map((row) => ({
      entryNumber: row.entry_number,
      accountCode: row.account_code,
      accountName: row.account_name,
      documentNumber: row.document_number,
      debit: Number(row.debit),
      credit: Number(row.credit),
      runningBalance: Number(row.running_balance),
    })),
    trialBalanceRows,
    totals: {
      revenueCredit,
      vatCredit,
      cogsDebit,
      inventoryCredit,
      bankDebit,
      trialDebitTotal,
      trialCreditTotal,
      invoiceArDebit,
      paymentArCredit,
      receivableBalanceForInvoice: Number(receivableNetForInvoice.toFixed(2)),
      invoiceRegisterBalanceDue: Number(invoiceRegisterRow?.balance_due ?? 0),
    },
  };
}

async function runFullWorkflow(page, suiteReport, runIndex) {
  const runId = `run_${String(runIndex).padStart(2, "0")}`;
  const artifactsDir = path.join(outputDir, runId);
  await ensureDir(artifactsDir);

  const runStamp = `${suiteStamp}${String(runIndex).padStart(2, "0")}`;
  const productSeed = {
    name: `Stable Product ${runStamp}`,
    code: `STB${runStamp.slice(-8)}`,
    salePrice: 200,
    purchasePrice: 120,
  };

  const trialBefore = await backendJson("reports/trial-balance");
  const product = await createProduct(page, productSeed, artifactsDir);
  const stock = await createStock(page, {
    product,
    material: `Thermal Paper ${runIndex}`,
    inventoryType: "trading",
    size: `80mm-${runIndex}`,
    quantity: 10,
    unitCost: product.purchasePrice,
    reorderLevel: 2,
    artifactsDir,
  });

  const invoiceResult = await createAndIssueInvoice(page, {
    artifactsDir,
    customerName: suiteReport.customerName,
    lines: [{ product, quantity: 3 }],
  });
  const paymentReference = `PAY-STAB-${runStamp.slice(-8)}`;
  const payment = await recordPayment(page, {
    invoiceNumber: invoiceResult.invoice.number,
    amount: invoiceResult.invoice.balanceDue,
    reference: paymentReference,
    artifactsDir,
  });
  const screenshots = await captureAccountingViews(page, invoiceResult.invoice.number, artifactsDir);
  const accounting = await validateAccounting({
    invoiceNumber: invoiceResult.invoice.number,
    paymentReference,
    expectedPaymentAmount: invoiceResult.invoice.balanceDue,
    inventoryAccountCode: stock.inventoryAccountCode,
    expectReceivableCleared: true,
  });
  const trialAfter = await backendJson("reports/trial-balance");
  const deltas = diffBalances(trialBefore.data ?? [], trialAfter.data ?? [], ["1100", "1210", "1300", "2200", "4000", "5000"]);

  return {
    runId,
    product,
    stock,
    invoice: invoiceResult.invoice,
    payment,
    requestTrace: {
      createRequestBody: invoiceResult.createRequestBody,
      createResponseBody: invoiceResult.createResponseBody,
      finalizeResponseBody: invoiceResult.finalizeResponseBody,
    },
    uiValidation: {
      successMessageVisible: Boolean(invoiceResult.successHeading),
      documentNumberVisible: Boolean(invoiceResult.documentNumber),
      noSilentFailure: !invoiceResult.submitErrorText,
    },
    screenshots: {
      product: product.screenshot,
      inventory: stock.screenshot,
      invoice: invoiceResult.screenshot,
      payment: payment.screenshot,
      journalRegister: screenshots.journalRegister,
      journalDetail: screenshots.journalDetail,
      ledger: screenshots.ledger,
      trialBalance: screenshots.trialBalance,
    },
    accounting: {
      journalEntryNumbers: accounting.journalEntryNumbers,
      totals: accounting.totals,
      trialBalanceDeltas: deltas,
    },
    apiValidation: {
      journalEntries: accounting.journalEntries,
      ledgerRows: accounting.ledgerRows,
    },
  };
}

async function runLowStockCase(page, suiteReport) {
  const artifactsDir = path.join(outputDir, "case_low_stock");
  await ensureDir(artifactsDir);
  const seed = `${suiteStamp}LS`;
  const product = await createProduct(page, {
    name: `Low Stock Product ${seed}`,
    code: `LOW${seed.slice(-8)}`,
    salePrice: 90,
    purchasePrice: 45,
  }, artifactsDir);
  await createStock(page, {
    product,
    material: "Low Stock Material",
    inventoryType: "trading",
    size: "case-a",
    quantity: 1,
    unitCost: product.purchasePrice,
    reorderLevel: 1,
    artifactsDir,
    screenshotName: "01-inventory-screen.png",
  });

  const blocked = await createAndIssueInvoice(page, {
    artifactsDir,
    invoiceScreenshotName: "02-low-stock-error.png",
    customerName: suiteReport.customerName,
    lines: [{ product, quantity: 2 }],
    expectBlockedMessage: "requested 2, available 1",
  });

  return {
    status: "passed",
    product: { name: product.name, sku: product.sku },
    message: blocked.lineValidationText,
    screenshot: blocked.screenshot,
  };
}

async function runMissingUnitCostCase(page) {
  const artifactsDir = path.join(outputDir, "case_missing_unit_cost");
  await ensureDir(artifactsDir);
  const seed = `${suiteStamp}MC`;
  const product = await createProduct(page, {
    name: `Missing Cost Product ${seed}`,
    code: `MIS${seed.slice(-8)}`,
    salePrice: 110,
    purchasePrice: 55,
  }, artifactsDir);
  const result = await createStock(page, {
    product,
    material: "Missing Cost Material",
    inventoryType: "trading",
    size: "case-b",
    quantity: 5,
    unitCost: null,
    reorderLevel: 1,
    artifactsDir,
    screenshotName: "02-missing-unit-cost-error.png",
    expectError: "Unit cost must be greater than zero.",
  });

  return {
    status: "passed",
    message: result.errorText,
    screenshot: result.screenshot,
  };
}

async function runPartialPaymentCase(page, suiteReport) {
  const artifactsDir = path.join(outputDir, "case_partial_payment");
  await ensureDir(artifactsDir);
  const seed = `${suiteStamp}PP`;
  const product = await createProduct(page, {
    name: `Partial Payment Product ${seed}`,
    code: `PAR${seed.slice(-8)}`,
    salePrice: 150,
    purchasePrice: 90,
  }, artifactsDir);
  const stock = await createStock(page, {
    product,
    material: "Partial Payment Material",
    inventoryType: "trading",
    size: "case-c",
    quantity: 10,
    unitCost: product.purchasePrice,
    reorderLevel: 1,
    artifactsDir,
    screenshotName: "01-inventory-screen.png",
  });
  const invoiceResult = await createAndIssueInvoice(page, {
    artifactsDir,
    invoiceScreenshotName: "02-invoice-screen.png",
    customerName: suiteReport.customerName,
    paymentStatus: "Partial",
    partialReceivedAmount: 100,
    lines: [{ product, quantity: 4 }],
  });
  const partialAmount = 300;
  const paymentReference = `PAY-PART-${seed.slice(-8)}`;
  const payment = await recordPayment(page, {
    invoiceNumber: invoiceResult.invoice.number,
    amount: partialAmount,
    reference: paymentReference,
    artifactsDir,
    screenshotName: "03-payment-screen.png",
  });
  const screenshots = await captureAccountingViews(page, invoiceResult.invoice.number, artifactsDir, "04-");
  const accounting = await validateAccounting({
    invoiceNumber: invoiceResult.invoice.number,
    paymentReference,
    expectedPaymentAmount: partialAmount,
    inventoryAccountCode: stock.inventoryAccountCode,
    expectReceivableCleared: false,
  });
  const documentsPayload = await backendJson("reports/invoice-register");
  const invoiceAfterPayment = (documentsPayload.data ?? []).find((row) => row.document_number === invoiceResult.invoice.number);
  if (!invoiceAfterPayment || Number(invoiceAfterPayment.balance_due) <= 0) {
    throw new Error(`Partial payment did not leave remaining balance on ${invoiceResult.invoice.number}.`);
  }

  return {
    status: "passed",
    invoiceNumber: invoiceResult.invoice.number,
    payment,
    remainingBalance: Number(invoiceAfterPayment.balance_due),
    journalEntryNumbers: accounting.journalEntryNumbers,
    screenshots: {
      invoice: invoiceResult.screenshot,
      payment: payment.screenshot,
      journal: screenshots.journalRegister,
      ledger: screenshots.ledger,
      trialBalance: screenshots.trialBalance,
    },
  };
}

async function runMultipleLineItemsCase(page, suiteReport) {
  const artifactsDir = path.join(outputDir, "case_multiple_line_items");
  await ensureDir(artifactsDir);
  const variants = [
    { suffix: "A", salePrice: 180, purchasePrice: 100, quantity: 1 },
    { suffix: "B", salePrice: 220, purchasePrice: 130, quantity: 2 },
    { suffix: "C", salePrice: 260, purchasePrice: 150, quantity: 1 },
  ];

  const products = [];
  for (const variant of variants) {
    const product = await createProduct(page, {
      name: `Multi Line ${suiteStamp}${variant.suffix}`,
      code: `ML${suiteStamp.slice(-6)}${variant.suffix}`,
      salePrice: variant.salePrice,
      purchasePrice: variant.purchasePrice,
    }, artifactsDir);
    const stock = await createStock(page, {
      product,
      material: `Multi Material ${variant.suffix}`,
      inventoryType: "trading",
      size: `multi-${variant.suffix}`,
      quantity: 12,
      unitCost: product.purchasePrice,
      reorderLevel: 1,
      artifactsDir,
      screenshotName: `0${products.length + 1}-stock-${variant.suffix}.png`,
    });
    products.push({ product, stock, quantity: variant.quantity });
  }

  const invoiceResult = await createAndIssueInvoice(page, {
    artifactsDir,
    invoiceScreenshotName: "04-invoice-screen.png",
    customerName: suiteReport.customerName,
    lines: products.map((entry) => ({ product: entry.product, quantity: entry.quantity })),
  });
  const paymentReference = `PAY-MULTI-${suiteStamp.slice(-8)}`;
  const payment = await recordPayment(page, {
    invoiceNumber: invoiceResult.invoice.number,
    amount: invoiceResult.invoice.balanceDue,
    reference: paymentReference,
    artifactsDir,
    screenshotName: "05-payment-screen.png",
  });
  const screenshots = await captureAccountingViews(page, invoiceResult.invoice.number, artifactsDir, "06-");
  const accounting = await validateAccounting({
    invoiceNumber: invoiceResult.invoice.number,
    paymentReference,
    expectedPaymentAmount: invoiceResult.invoice.balanceDue,
    inventoryAccountCode: products[0].stock.inventoryAccountCode,
    expectReceivableCleared: true,
  });

  const expectedRevenue = products.reduce((sum, entry) => sum + (entry.product.salePrice * entry.quantity), 0);
  const expectedCost = products.reduce((sum, entry) => sum + (entry.product.purchasePrice * entry.quantity), 0);
  const expectedVat = Number((expectedRevenue * 0.15).toFixed(2));
  if (Number(accounting.totals.revenueCredit.toFixed(2)) !== Number(expectedRevenue.toFixed(2))) {
    throw new Error(`Multi-line revenue mismatch: expected ${expectedRevenue}, got ${accounting.totals.revenueCredit}.`);
  }
  if (Number(accounting.totals.vatCredit.toFixed(2)) !== expectedVat) {
    throw new Error(`Multi-line VAT mismatch: expected ${expectedVat}, got ${accounting.totals.vatCredit}.`);
  }
  if (Number(accounting.totals.cogsDebit.toFixed(2)) !== Number(expectedCost.toFixed(2))) {
    throw new Error(`Multi-line COGS mismatch: expected ${expectedCost}, got ${accounting.totals.cogsDebit}.`);
  }

  return {
    status: "passed",
    invoiceNumber: invoiceResult.invoice.number,
    payment,
    expected: { revenue: expectedRevenue, vat: expectedVat, cogs: expectedCost },
    actual: accounting.totals,
    screenshots: {
      invoice: invoiceResult.screenshot,
      journal: screenshots.journalRegister,
      ledger: screenshots.ledger,
      trialBalance: screenshots.trialBalance,
    },
  };
}

async function runInvalidDataCase(page) {
  const artifactsDir = path.join(outputDir, "case_invalid_data");
  await ensureDir(artifactsDir);
  const result = await createAndIssueInvoice(page, {
    artifactsDir,
    invoiceScreenshotName: "01-invalid-data-error.png",
    chooseCustomer: false,
    lines: [],
    expectBlockedMessage: "Choose a customer before moving on.",
  });

  return {
    status: "passed",
    message: result.submitErrorText,
    screenshot: result.screenshot,
  };
}

function verifyNoDuplicateJournalNumbers(runSummaries) {
  const seen = new Set();
  for (const run of runSummaries) {
    for (const journal of run.accounting.journalEntryNumbers) {
      if (seen.has(journal)) {
        throw new Error(`Duplicate journal number detected across stable runs: ${journal}.`);
      }
      seen.add(journal);
    }
  }
}

function verifyConsistentRunDeltas(runSummaries) {
  const reference = JSON.stringify(runSummaries[0].accounting.trialBalanceDeltas);
  for (const run of runSummaries.slice(1)) {
    if (JSON.stringify(run.accounting.trialBalanceDeltas) !== reference) {
      throw new Error(`Trial balance deltas diverged between runs. ${run.runId} does not match the baseline delta pattern.`);
    }
  }
}

async function main() {
  await ensureDir(outputDir);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
  const page = await context.newPage();
  await setupLiveWorkspaceRouting(page);

  const suiteReport = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    backendBaseUrl,
    companyId,
    actorId,
    stable: false,
    fullRuns: [],
    edgeCases: {},
    consistency: {},
    fixed: [],
    remaining: [],
  };

  const customersPayload = await backendJson("contacts?type=customer");
  const customers = customersPayload.data ?? [];
  if (!customers.length) {
    throw new Error("No customers available in backend company 2.");
  }
  suiteReport.customerName = customers[0].display_name;

  try {
    for (let runIndex = 1; runIndex <= 5; runIndex += 1) {
      suiteReport.fullRuns.push(await runFullWorkflow(page, suiteReport, runIndex));
    }

    suiteReport.edgeCases.lowStock = await runLowStockCase(page, suiteReport);
    suiteReport.edgeCases.missingUnitCost = await runMissingUnitCostCase(page);
    suiteReport.edgeCases.partialPayment = await runPartialPaymentCase(page, suiteReport);
    suiteReport.edgeCases.multipleLineItems = await runMultipleLineItemsCase(page, suiteReport);
    suiteReport.edgeCases.invalidData = await runInvalidDataCase(page);

    verifyNoDuplicateJournalNumbers(suiteReport.fullRuns);
    verifyConsistentRunDeltas(suiteReport.fullRuns);

    suiteReport.consistency = {
      trialBalanceDeltas: suiteReport.fullRuns.map((run) => ({ runId: run.runId, deltas: run.accounting.trialBalanceDeltas })),
      duplicateJournalCheck: "passed",
      repeatedDeltaCheck: "passed",
      finalTrialBalance: (await backendJson("reports/trial-balance")).data ?? [],
    };

    suiteReport.stable = true;
    await writeJson(path.join(outputDir, "stability-suite-report.json"), suiteReport);
    console.log(JSON.stringify(suiteReport, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});