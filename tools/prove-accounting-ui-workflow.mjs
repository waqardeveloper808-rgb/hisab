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
const loginEmail = process.env.LOGIN_EMAIL ?? "sandbox.admin@gulfhisab.sa";
const loginPassword = process.env.LOGIN_PASSWORD ?? "RecoveryPass123!";
const backendEnvPath = path.join(process.cwd(), "backend", ".env");
const apiToken = process.env.API_TOKEN ?? process.env.WORKSPACE_API_TOKEN ?? await readDotEnvValue(backendEnvPath, "WORKSPACE_API_TOKEN") ?? "";
const actorId = process.env.ACTOR_ID ?? process.env.WORKSPACE_API_USER_ID ?? await readDotEnvValue(backendEnvPath, "WORKSPACE_API_USER_ID") ?? "";
const runStamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const outputDir = process.env.OUTPUT_DIR ?? path.join(process.cwd(), "qa_reports", `accounting_ui_workflow_${runStamp}`);

if (!apiToken || !actorId) {
  throw new Error("Workspace runtime auth values are not configured.");
}

async function ensureDir() {
  await fs.mkdir(outputDir, { recursive: true });
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

async function waitForBackendRecord(fetcher, predicate, description, attempts = 20, delayMs = 500) {
  for (let index = 0; index < attempts; index += 1) {
    const result = await fetcher();
    const match = predicate(result);
    if (match) {
      return match;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(`Timed out waiting for backend record: ${description}`);
}

async function capture(page, name, locator) {
  const filePath = path.join(outputDir, name);
  if (locator) {
    await locator.screenshot({ path: filePath });
  } else {
    await page.screenshot({ path: filePath, fullPage: true });
  }
  return path.relative(process.cwd(), filePath).replaceAll("\\", "/");
}

async function readRequiredText(locator, description) {
  await locator.waitFor({ timeout: 15000 });
  const value = (await locator.textContent())?.trim();
  if (!value) {
    throw new Error(`Expected ${description} to be visible.`);
  }
  return value;
}

async function gotoRoute(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-inspector-shell="workspace"]', { timeout: 20000 });
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => null);
}

async function loginToWorkspace(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email").fill(loginEmail);
  await page.getByLabel("Password").fill(loginPassword);
  await Promise.all([
    page.waitForURL(/\/workspace\/user/, { timeout: 20000 }),
    page.getByRole("button", { name: /log in|opening workspace/i }).click(),
  ]);
  await page.waitForSelector('[data-inspector-shell="workspace"]', { timeout: 20000 });
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
  await page.waitForTimeout(500);

  const target = page.getByRole("button", { name: new RegExp(preferredText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }).first();
  await target.waitFor({ timeout: 15000 });
  const text = (await target.textContent())?.trim() ?? preferredText;
  await target.click();
  return text;
}

async function selectLineItem(page, query, preferredText) {
  const lineEditor = page.locator('[data-inspector-workflow-step="line-editor"]').first();
  const browseButton = lineEditor.getByRole("button", { name: /Browse all/i }).first();
  await browseButton.click();
  const searchInput = page.getByPlaceholder(/Search item name or code/i).last();
  await searchInput.fill(query);
  await page.waitForTimeout(500);

  const target = page.getByRole("button", { name: new RegExp(preferredText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }).first();
  await target.waitFor({ timeout: 15000 });
  await target.click();
}

async function setFirstLineQuantity(page, quantity) {
  const lineEditor = page.locator('[data-inspector-workflow-step="line-editor"]').first();
  const quantityInput = lineEditor.locator('input[type="number"]').first();
  await quantityInput.waitFor({ timeout: 15000 });
  await quantityInput.fill(String(quantity));
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
  return rows.find((row) => String(row.account_code ?? row.code) === code) ?? null;
}

async function main() {
  await ensureDir();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
  const page = await context.newPage();
  await loginToWorkspace(page);

  const customersPayload = await backendJson("contacts?type=customer");
  const customers = customersPayload.data ?? [];
  if (!customers.length) {
    throw new Error("No customers available in backend company 2.");
  }

  const chosenCustomer = customers[0];
  const customerName = chosenCustomer.display_name;
  const productName = `UI Proof Product ${runStamp}`;
  const productCode = `UIP${runStamp.slice(-6)}`;
  const paymentReference = `PAY-UI-${runStamp.slice(-6)}`;
  const quantity = 3;
  const unitPrice = 200;
  const purchasePrice = 120;
  const vatRate = 15;
  const inventoryQuantity = 10;
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    backendBaseUrl,
    companyId,
    actorId,
    product: null,
    inventory: null,
    invoice: null,
    payment: null,
    uiValidation: {},
    apiValidation: {},
    screenshots: {},
    failedResponses: [],
    browserConsole: [],
    fixed: [],
    remaining: [],
    requestResponseTrace: {
      invoiceCreateRequest: null,
      invoiceCreateResponse: null,
      invoiceFinalizeResponse: null,
      submitErrorText: null,
      lineValidationText: null,
      successHeading: null,
      documentNumber: null,
      urlAfterSubmit: null,
    },
  };

  page.on("console", (message) => {
    report.browserConsole.push(`[${message.type()}] ${message.text()}`);
  });

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

  await gotoRoute(page, "/workspace/user/products");
  await page.getByRole("button", { name: /Add Product/i }).click();
  await page.getByLabel("Name").fill(productName);
  await page.getByLabel("Code").fill(productCode);
  await page.locator("#product-kind").selectOption("product");
  await page.getByLabel("Sale price").fill(String(unitPrice));
  await page.getByLabel("Purchase price").fill(String(purchasePrice));
  await page.getByRole("button", { name: /Create Item/i }).click();
  const createdItem = await waitForBackendRecord(
    async () => backendJson("items"),
    (payload) => (payload.data ?? []).find((item) => item.name === productName || item.sku === productCode),
    `item ${productName}`,
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.getByLabel("Search products and services").fill(productName);
  report.screenshots.product = await capture(page, "01-product-screen.png", page.locator('[data-inspector-real-register="products"]').first());
  report.product = {
    id: createdItem.id,
    name: createdItem.name,
    sku: createdItem.sku,
    salePrice: Number(createdItem.default_sale_price ?? unitPrice),
    purchasePrice: Number(createdItem.default_purchase_price ?? purchasePrice),
  };

  await gotoRoute(page, "/workspace/user/stock");
  await page.getByRole("button", { name: /Add Inventory/i }).click();
  await selectComboboxOption(page, "Product", productName);
  await page.getByLabel("Product name").fill(productName);
  await page.getByLabel("Material").fill("Thermal Paper Roll");
  await page.locator("#inventory-type").selectOption("trading");
  await page.getByLabel("Size").fill("80mm");
  await page.getByRole("button", { name: /^Next$/i }).click();
  await page.getByLabel("Quantity").fill(String(inventoryQuantity));
  await page.getByLabel("Unit cost").fill(String(purchasePrice));
  await page.getByLabel("Reorder level").fill("2");
  await page.getByRole("button", { name: /Create inventory/i }).click();
  report.screenshots.inventory = await capture(page, "02-inventory-screen.png", page.locator('[data-inspector-real-register="inventory-stock"]').first());

  const createdStock = await waitForBackendRecord(
    async () => backendJson("inventory/stock"),
    (payload) => (payload.data ?? []).find((row) => row.product_name === productName || row.item_id === createdItem.id),
    `inventory ${productName}`,
  );
  await page.reload({ waitUntil: "networkidle" });
  report.inventory = {
    id: createdStock.id,
    code: createdStock.code,
    quantityOnHand: Number(createdStock.quantity_on_hand),
    journalEntryNumber: createdStock.journal_entry_number,
    inventoryAccountCode: createdStock.inventory_account_code ?? createdStock.inventoryAccountCode ?? "1300",
  };

  await gotoRoute(page, "/workspace/invoices/new?documentType=tax_invoice");
  await selectDialogEntity(page, "Customer", /Search customer/i, customerName, customerName);
  await selectLineItem(page, productName, productName);
  await setFirstLineQuantity(page, quantity);
  const createInvoiceResponse = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/api/workspace/sales-documents") && !response.url().includes("/finalize"), { timeout: 15000 });
  const finalizeInvoiceResponse = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/api/workspace/sales-documents/") && response.url().includes("/finalize"), { timeout: 15000 });
  await page.locator('[data-inspector-workflow-submit="true"]').first().click();
  const createResponse = await createInvoiceResponse;
  const finalizeResponse = await finalizeInvoiceResponse;
  report.requestResponseTrace.invoiceCreateRequest = (() => {
    try {
      const body = createResponse.request().postDataJSON();
      return body ?? createResponse.request().postData() ?? null;
    } catch {
      return createResponse.request().postData() ?? null;
    }
  })();
  try {
    report.requestResponseTrace.invoiceCreateResponse = await createResponse.json();
  } catch {
    report.requestResponseTrace.invoiceCreateResponse = await createResponse.text();
  }
  try {
    report.requestResponseTrace.invoiceFinalizeResponse = await finalizeResponse.json();
  } catch {
    report.requestResponseTrace.invoiceFinalizeResponse = await finalizeResponse.text();
  }
  report.requestResponseTrace.urlAfterSubmit = page.url();
  await page.waitForTimeout(1500);
  report.requestResponseTrace.submitErrorText = await maybeReadText(page.locator('.border-red-200.bg-red-50'));
  report.requestResponseTrace.lineValidationText = await maybeReadText(page.locator('.border-amber-200.bg-amber-50').first());
  report.requestResponseTrace.successHeading = await maybeReadText(page.locator('[data-inspector-workflow-success-heading="true"]'));
  report.requestResponseTrace.documentNumber = await maybeReadText(page.locator('[data-inspector-workflow-document-number="true"]'));
  if (!report.requestResponseTrace.documentNumber) {
    report.screenshots.invoiceFailure = await capture(page, '03-invoice-submit-failure.png');
    await fs.writeFile(path.join(outputDir, 'ui-api-proof.json'), JSON.stringify(report, null, 2));
    throw new Error(`Invoice submit did not render success. submitError=${report.requestResponseTrace.submitErrorText ?? '<none>'}; lineValidation=${report.requestResponseTrace.lineValidationText ?? '<none>'}; heading=${report.requestResponseTrace.successHeading ?? '<none>'}`);
  }
  const invoiceNumber = report.requestResponseTrace.documentNumber;
  report.screenshots.invoice = await capture(page, "03-invoice-screen.png");

  const documentsPayload = await backendJson("reports/invoice-register");
  const createdInvoice = (documentsPayload.data ?? []).find((row) => row.document_number === invoiceNumber);
  if (!createdInvoice) {
    throw new Error(`Issued invoice ${invoiceNumber} was not found in the backend invoice register.`);
  }
  report.invoice = {
    id: createdInvoice.id,
    number: createdInvoice.document_number,
    issueDate: createdInvoice.issue_date,
    grandTotal: Number(createdInvoice.grand_total),
    balanceDue: Number(createdInvoice.balance_due),
  };

  await gotoRoute(page, "/workspace/user/payments");
  await page.locator('[data-inspector-payment-toggle="true"]').click();
  const paymentDocumentSelect = page.locator('[data-inspector-payment-document-select="true"]');
  await paymentDocumentSelect.waitFor({ timeout: 15000 });
  const documentOptions = await paymentDocumentSelect.locator("option").allTextContents();
  const paymentOption = documentOptions.find((option) => option.includes(invoiceNumber));
  if (!paymentOption) {
    throw new Error(`Open payment document option was not found for ${invoiceNumber}.`);
  }
  await paymentDocumentSelect.selectOption({ label: paymentOption });
  const amountValue = report.invoice.balanceDue || createdInvoice.balance_due;
  await page.getByLabel("Amount").fill(String(amountValue));
  await page.getByLabel("Reference").fill(paymentReference);
  await page.locator('[data-inspector-payment-submit="true"]').click();
  await page.getByText(paymentReference, { exact: false }).waitFor({ timeout: 15000 });
  report.screenshots.payment = await capture(page, "04-payment-screen.png", page.locator('[data-inspector-real-register="payments"]').first());

  const paymentsPayload = await backendJson("reports/payments-register");
  const createdPayment = (paymentsPayload.data ?? []).find((row) => row.reference === paymentReference);
  if (!createdPayment) {
    throw new Error(`Payment ${paymentReference} was not found in backend payments register.`);
  }
  report.payment = {
    id: createdPayment.id,
    number: createdPayment.payment_number,
    reference: createdPayment.reference,
    amount: Number(createdPayment.amount),
    paymentDate: createdPayment.payment_date,
  };

  await gotoRoute(page, `/workspace/user/journal-entries?document=${encodeURIComponent(invoiceNumber)}`);
  await page.locator('[data-inspector-real-register="journal-entries"]').getByText(invoiceNumber, { exact: false }).first().waitFor({ timeout: 15000 });
  report.screenshots.journalRegister = await capture(page, "05-journal-register.png", page.locator('[data-inspector-real-register="journal-entries"]').first());
  report.screenshots.journalDetail = await capture(page, "06-journal-detail.png", page.locator('[data-inspector-accounting-detail="journal-entry"]').first());

  await gotoRoute(page, `/workspace/accounting/books?document=${encodeURIComponent(invoiceNumber)}`);
  await page.getByText(invoiceNumber, { exact: false }).first().waitFor({ timeout: 15000 });
  report.screenshots.ledger = await capture(page, "07-ledger-view.png");

  await gotoRoute(page, "/workspace/user/reports/trial-balance");
  await page.waitForSelector("text=Trial Balance", { timeout: 15000 });
  report.screenshots.trialBalance = await capture(page, "08-trial-balance.png");

  const journalsPayload = await backendJson(`journals?document_number=${encodeURIComponent(invoiceNumber)}`);
  const generalLedgerPayload = await backendJson(`reports/general-ledger?document_number=${encodeURIComponent(invoiceNumber)}&limit=2000`);
  const trialBalancePayload = await backendJson("reports/trial-balance");

  const invoiceJournals = (journalsPayload.data ?? []).filter((entry) => (entry.document_number ?? "") === invoiceNumber || (entry.lines ?? []).some((line) => line.document_number === invoiceNumber));
  const paymentJournal = (journalsPayload.data ?? []).find((entry) => (entry.reference ?? "") === paymentReference || (entry.memo ?? "").includes(paymentReference));
  const relevantJournalEntries = paymentJournal && !invoiceJournals.some((entry) => entry.id === paymentJournal.id)
    ? [...invoiceJournals, paymentJournal]
    : invoiceJournals;

  if (relevantJournalEntries.length < 2) {
    throw new Error(`Expected invoice and payment journals for ${invoiceNumber}, found ${relevantJournalEntries.length}.`);
  }

  const relevantLedgerRows = (generalLedgerPayload.data ?? []).filter((row) => row.document_number === invoiceNumber || (row.reference ?? "") === invoiceNumber || (row.description ?? "").includes(paymentReference));
  if (!relevantLedgerRows.length) {
    throw new Error(`No general ledger rows found for invoice ${invoiceNumber} or payment ${paymentReference}.`);
  }

  const arRows = relevantLedgerRows.filter((row) => row.account_code === "1100");
  const revenueRow = relevantJournalEntries.flatMap((entry) => entry.lines ?? []).find((line) => line.account_code === "4000");
  const vatRow = relevantJournalEntries.flatMap((entry) => entry.lines ?? []).find((line) => line.account_code === "2200");
  const cogsRow = relevantJournalEntries.flatMap((entry) => entry.lines ?? []).find((line) => line.account_code === "5000");
  const expectedInventoryAccountCode = report.inventory.inventoryAccountCode ?? "1300";
  const inventoryRow = relevantJournalEntries.flatMap((entry) => entry.lines ?? []).find((line) => line.account_code === expectedInventoryAccountCode);

  if (!arRows.some((row) => Number(row.debit) > 0) || !arRows.some((row) => Number(row.credit) > 0)) {
    throw new Error("Receivable ledger movement did not show both invoice debit and payment credit.");
  }
  if (!revenueRow || Number(revenueRow.credit) <= 0) {
    throw new Error("Revenue credit was not found.");
  }
  if (!vatRow || Number(vatRow.credit) <= 0) {
    throw new Error("VAT credit was not found.");
  }
  if (!cogsRow || Number(cogsRow.debit) <= 0) {
    throw new Error("COGS debit was not found.");
  }
  if (!inventoryRow || Number(inventoryRow.credit) <= 0) {
    throw new Error("Inventory reduction credit was not found.");
  }

  const trialBalanceRows = trialBalancePayload.data ?? [];
  const arBalance = findAccount(trialBalanceRows, "1100");
  const revenueBalance = findAccount(trialBalanceRows, "4000");
  const vatBalance = findAccount(trialBalanceRows, "2200");
  const cogsBalance = findAccount(trialBalanceRows, "5000");
  const inventoryBalance = findAccount(trialBalanceRows, expectedInventoryAccountCode);
  const trialDebitTotal = trialBalanceRows.reduce((sum, row) => sum + Number(row.debit_total ?? 0), 0);
  const trialCreditTotal = trialBalanceRows.reduce((sum, row) => sum + Number(row.credit_total ?? 0), 0);

  report.uiValidation = {
    invoiceNumber,
    paymentReference,
    journalEntryNumbers: relevantJournalEntries.map((entry) => entry.entry_number),
    arDebitExists: true,
    revenueCreditExists: true,
    vatCreditExists: true,
    cogsDebitExists: true,
    inventoryReduced: true,
    paymentClearsReceivable: arBalance ? Number(arBalance.balance) === 0 : false,
  };

  report.apiValidation = {
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
    trialBalance: {
      accounts: {
        accountsReceivable: arBalance,
        salesRevenue: revenueBalance,
        vatPayable: vatBalance,
        cogs: cogsBalance,
        inventory: inventoryBalance,
      },
      debitTotal: trialDebitTotal,
      creditTotal: trialCreditTotal,
    },
  };

  await fs.writeFile(path.join(outputDir, "ui-api-proof.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  await context.close();
  await browser.close();
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});