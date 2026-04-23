import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3006").trim();
const outputDir = (process.env.OUTPUT_DIR ?? path.join(process.cwd(), "qa_reports", "sales_workflow_20260417")).trim();
const loginEmail = (process.env.UI_LOGIN_EMAIL ?? "sandbox.admin@gulfhisab.sa").trim();
const loginPassword = (process.env.UI_LOGIN_PASSWORD ?? "RecoveryPass123!").trim();

async function ensureDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

async function shot(page, name, locator = null) {
  const filePath = path.join(outputDir, name);
  if (locator) {
    try {
      await locator.screenshot({ path: filePath, animations: "disabled", timeout: 5000 });
    } catch {
      await locator.scrollIntoViewIfNeeded();
      const box = await locator.boundingBox();
      if (!box) {
        throw new Error(`Unable to capture ${name}: target element has no bounding box.`);
      }
      await page.screenshot({
        path: filePath,
        animations: "disabled",
        clip: {
          x: Math.max(0, box.x),
          y: Math.max(0, box.y),
          width: Math.max(1, box.width),
          height: Math.max(1, box.height),
        },
      });
    }
  } else {
    await page.screenshot({ path: filePath, fullPage: true, animations: "disabled" });
  }
  return path.relative(process.cwd(), filePath).replaceAll("\\", "/");
}

async function openInventoryRecord(page) {
  const register = page.locator('[data-inspector-real-register="inventory-stock"]').first();
  await register.waitFor({ timeout: 15000 });

  const preferredRow = register.locator('[data-inspector-inventory-row]').filter({ hasText: /Thermal invoice paper|Receipt printer|paper|inventory/i }).first();
  if (await preferredRow.count()) {
    const label = (await preferredRow.textContent())?.trim() ?? "inventory row";
    await preferredRow.dblclick();
    return label;
  }

  const firstRow = register.locator('[data-inspector-inventory-row]').first();
  if (!await firstRow.count()) {
    return null;
  }
  const label = (await firstRow.textContent())?.trim() ?? "inventory row";
  await firstRow.dblclick();
  return label;
}

async function selectInventoryProduct(page, productName) {
  const select = page.locator('#inventory-product');
  await select.waitFor({ timeout: 15000 });
  const options = await select.locator('option').allTextContents();
  const match = options.find((option) => option.toLowerCase().includes(productName.toLowerCase()));
  if (match) {
    await select.selectOption({ label: match });
    return match;
  }
  return null;
}

async function ensureInventorySeed(page, productName) {
  const register = page.locator('[data-inspector-real-register="inventory-stock"]').first();
  const rows = register.locator('[data-inspector-inventory-row]');
  if (await rows.count()) {
    return;
  }

  await page.getByRole('button', { name: /Add Inventory/i }).click();
  await page.locator('[data-inspector-inventory-intake="true"]').waitFor({ timeout: 15000 });
  await selectInventoryProduct(page, productName);
  await page.getByLabel('Product name').fill(productName);
  await page.getByLabel('Material').fill('Thermal Paper Roll');
  await page.locator('#inventory-type').selectOption('trading');
  await page.getByLabel('Size').fill('80mm');
  await page.getByRole('button', { name: /^Next$/i }).click();
  await page.getByLabel('Quantity').fill('10');
  await page.getByLabel('Unit cost').fill('45');
  await page.getByLabel('Reorder level').fill('2');
  await page.getByRole('button', { name: /Create inventory/i }).click();
  await rows.first().waitFor({ timeout: 15000 });
}

async function gotoRoute(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-inspector-shell="workspace"]', { timeout: 20000 });
}

async function waitForWorkflowDirectory(page) {
  await page.waitForFunction(() => {
    const text = document.body.innerText || "";
    const match = text.match(/(\d+) saved customers/i) || text.match(/(\d+) saved suppliers/i);
    return Boolean(match && Number(match[1]) > 0);
  }, { timeout: 20000 });
}

async function login(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(loginEmail);
  await page.getByLabel("Password").fill(loginPassword);
  await page.getByRole("button", { name: /Log in|Opening workspace/i }).click();
  await page.waitForURL(/\/workspace\/user(?:\/.*)?$/, { timeout: 30000 });
}

async function selectEntity(page, label, placeholderPattern, query, preferredOptions) {
  await page.getByRole("button", { name: label, exact: true }).click();
  const searchInput = page.getByPlaceholder(placeholderPattern).last();
  await searchInput.fill(query);
  await page.waitForTimeout(350);

  for (const preferred of preferredOptions) {
    const option = page.getByRole("button", { name: new RegExp(preferred, "i") }).first();
    if (await option.count()) {
      const labelText = (await option.textContent())?.trim() ?? preferred;
      await option.click();
      return labelText;
    }
  }

  const firstOption = page.locator('[role="listbox"] button').first();
  const fallback = ((await firstOption.textContent()) ?? "").trim();
  await firstOption.click();
  return fallback;
}

async function fillInvoiceBase(page, { itemQuery = "UI Proof", quantity = "1", linkedProforma = "", linkedDelivery = "", linkedTax = "", receiver = "Recovery Customer 1" } = {}) {
  await waitForWorkflowDirectory(page);
  const customer = await selectEntity(page, "Customer", /Search customer/i, "Recovery Customer", ["Recovery Customer 1", "Recovery Imported Customer"]);
  const item = await selectEntity(page, "Product or service", /Search item name or code/i, itemQuery, ["UI Proof Product", "Recovery Product 1", "Recovery Imported Service"]);
  await page.getByLabel("Qty").fill(quantity);

  if (linkedProforma) {
    await fillVisibleField(page, "Linked Proforma", linkedProforma);
  }
  if (linkedDelivery) {
    await fillVisibleField(page, "Linked Delivery Note", linkedDelivery);
  }
  if (linkedTax) {
    await fillVisibleField(page, "Linked Tax Invoice", linkedTax);
  }
  await fillVisibleField(page, "Receiver / Customer", receiver);

  return { customer, item };
}

function extractNumber(text, prefixes) {
  const patternByPrefix = {
    PRO: /(?:AHN-PRO-QMS-|PRO-)\d+/i,
    DN: /(?:AHN-DLV-QMS-|DN-)\d+/i,
    TINV: /(?:AHN-INV-QMS-|TINV-)\d+/i,
    INV: /(?:AHN-INV-QMS-|INV-)\d+/i,
  };

  for (const prefix of prefixes) {
    const pattern = patternByPrefix[prefix] ?? new RegExp(`${prefix}-\\d+`, "i");
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return null;
}

function extractSummaryValue(text, label) {
  const compact = text.replace(/\s+/g, " ");
  const match = compact.match(new RegExp(`${label}\\s+([0-9.,]+\\s+SAR)`, "i"));
  return match?.[1] ?? "";
}

async function submitDocument(page) {
  await page.getByRole("button", { name: /Issue document/i }).click();
  await page.waitForTimeout(1200);
  const bodyText = await page.locator("body").textContent();
  const successCard = page.locator("text=/is ready\\.|Draft saved\\./i").first();
  if (await successCard.count()) {
    await successCard.waitFor({ timeout: 10000 });
  }
  return bodyText ?? "";
}

async function chooseSelectByText(page, label, text) {
  const select = page.locator(`label:has-text("${label}")`).locator("..").locator("select");
  const options = await select.locator("option").allTextContents();
  const match = options.find((option) => option.includes(text));
  if (match) {
    await select.selectOption({ label: match });
    return match;
  }
  return null;
}

async function fillVisibleField(page, label, value) {
  const field = page.getByLabel(label).filter({ visible: true }).first();
  if (await field.count()) {
    await field.fill(value);
    return true;
  }
  return false;
}

async function ensureDetailsOpen(page, summaryText) {
  const details = page.locator(`details:has(summary:has-text("${summaryText}"))`).first();
  if (!await details.count()) {
    return;
  }

  const isOpen = await details.evaluate((node) => node.hasAttribute("open"));
  if (!isOpen) {
    await details.locator("summary").click();
  }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
const page = await context.newPage();

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  screenshots: [],
  routes: [],
  visibleValues: {},
  warnings: [],
};

try {
  await ensureDir();
  await login(page);

  await gotoRoute(page, "/workspace/invoices/new?documentType=proforma_invoice");
  const proformaBase = await fillInvoiceBase(page, { itemQuery: "UI Proof", quantity: "1" });
  await ensureDetailsOpen(page, "Proforma payment tracking");
  await page.locator('#proforma-payment-status').selectOption("Partial");
  await page.getByLabel("Payment method").fill("bank_transfer");
  await page.getByLabel("Amount received").fill("50");
  await page.getByLabel("Receipt date").fill("2026-04-17");
  await page.getByLabel("Reference No. / Note").fill("ADV-TRACK-BROWSER-001");
  report.screenshots.push({
    step: "proforma_form",
    path: await shot(page, "01-proforma-creation-form.png", page.locator('[data-inspector-workflow-form="invoice"]').first()),
  });
  const proformaBody = await submitDocument(page);
  const proformaNumber = extractNumber(proformaBody, ["PRO"]);
  report.visibleValues.proforma = {
    customer: proformaBase.customer,
    item: proformaBase.item,
    paymentStatus: "Partial",
    amountReceived: "50",
    receiptDate: "2026-04-17",
    referenceNote: "ADV-TRACK-BROWSER-001",
    documentNumber: proformaNumber,
  };
  report.routes.push({ step: "proforma_creation", route: "/workspace/invoices/new?documentType=proforma_invoice" });
  report.screenshots.push({ step: "proforma_result", path: await shot(page, "02-proforma-result.png") });

  await gotoRoute(page, "/workspace/invoices/new?documentType=delivery_note");
  const deliveryBase = await fillInvoiceBase(page, { itemQuery: "UI Proof", quantity: "1", linkedProforma: proformaNumber ?? "" });
  report.screenshots.push({
    step: "delivery_note_form",
    path: await shot(page, "03-delivery-note-form.png", page.locator('[data-inspector-workflow-form="invoice"]').first()),
  });
  const deliveryBody = await submitDocument(page);
  const deliveryNumber = extractNumber(deliveryBody, ["DN"]);
  report.visibleValues.deliveryNote = {
    customer: deliveryBase.customer,
    item: deliveryBase.item,
    linkedProforma: proformaNumber,
    receiver: "Recovery Customer 1",
    documentNumber: deliveryNumber,
  };
  report.routes.push({ step: "delivery_note_creation", route: "/workspace/invoices/new?documentType=delivery_note" });
  report.screenshots.push({ step: "delivery_note_result", path: await shot(page, "04-delivery-note-result.png") });
  if (!deliveryNumber) {
    report.warnings.push("Delivery note number was not detected from the result screen.");
  }

  await gotoRoute(page, "/workspace/invoices/new?documentType=tax_invoice");
  const taxBase = await fillInvoiceBase(page, { itemQuery: "UI Proof", quantity: "1", linkedProforma: proformaNumber ?? "", linkedDelivery: deliveryNumber ?? "" });
  const summaryText = (await page.locator('text=/Invoice summary/i').locator('..').textContent()) ?? (await page.locator('body').textContent()) ?? "";
  const vatValue = extractSummaryValue(summaryText, "VAT");
  const totalValue = extractSummaryValue(summaryText, "Total");
  report.screenshots.push({
    step: "tax_invoice_form",
    path: await shot(page, "05-tax-invoice-form.png", page.locator('[data-inspector-workflow-form="invoice"]').first()),
  });
  const taxBody = await submitDocument(page);
  const taxNumber = extractNumber(taxBody, ["TINV", "INV"]);
  report.visibleValues.taxInvoice = {
    customer: taxBase.customer,
    item: taxBase.item,
    linkedProforma: proformaNumber,
    linkedDelivery: deliveryNumber,
    vatSummaryValue: vatValue,
    totalSummaryValue: totalValue,
    documentNumber: taxNumber,
  };
  report.routes.push({ step: "tax_invoice_creation", route: "/workspace/invoices/new?documentType=tax_invoice" });
  report.screenshots.push({ step: "tax_invoice_result", path: await shot(page, "06-tax-invoice-result.png") });

  await gotoRoute(page, "/workspace/user/payments");
  await page.getByRole("button", { name: /Record Payment/i }).click();
  const incomingOption = taxNumber ? await chooseSelectByText(page, "Open document", taxNumber) : null;
  await page.getByLabel("Reference").fill("PAY-BROWSER-001");
  report.screenshots.push({ step: "payment_form", path: await shot(page, "07-payment-entry-form.png") });
  await page.getByRole("button", { name: /Create Payment/i }).click();
  await page.waitForTimeout(1200);
  const paymentRow = page.locator('table tbody tr').nth(0);
  const paymentVisible = ((await paymentRow.textContent()) ?? "").trim();
  report.visibleValues.payment = {
    openDocumentOption: incomingOption,
    reference: "PAY-BROWSER-001",
    row: paymentVisible,
  };
  report.routes.push({ step: "payment_entry", route: "/workspace/user/payments" });
  report.screenshots.push({ step: "payment_result", path: await shot(page, "08-payment-entry-result.png") });

  await gotoRoute(page, "/workspace/user/stock");
  await ensureInventorySeed(page, taxBase.item);
  const stockRecordLabel = await openInventoryRecord(page);
  if (!stockRecordLabel) {
    throw new Error("Inventory register did not contain any rows after inventory seeding.");
  }
  await page.waitForSelector('text=Inventory Preview', { timeout: 10000 });
  const stockModal = page.locator('[role="dialog"]').first();
  const stockModalTextBefore = (await stockModal.textContent()) ?? "";
  const onHandBefore = stockModalTextBefore.match(/On hand:\s*\d+/i)?.[0] ?? "";
  await page.getByLabel("Customer / receiver").fill("Recovery Customer 1");
  await page.getByLabel("Quantity sold").fill("1");
  await page.getByLabel("Unit price").fill("85");
  if (proformaNumber) {
    await chooseSelectByText(page, "Proforma invoice", proformaNumber);
  }
  if (taxNumber) {
    await chooseSelectByText(page, "Tax invoice", taxNumber);
  }
  if (deliveryNumber) {
    await page.getByLabel("Delivery note").fill(deliveryNumber);
  }
  await page.locator('label:has-text("Payment status")').locator('..').locator('select').selectOption("Fully Received");
  report.screenshots.push({ step: "inventory_reduction_form", path: await shot(page, "09-inventory-reduction-form.png") });
  await page.getByRole("button", { name: /Post delivery release/i }).click();
  await page.waitForTimeout(1200);
  const stockModalTextAfter = (await stockModal.textContent()) ?? "";
  const onHandAfter = stockModalTextAfter.match(/On hand:\s*\d+/i)?.[0] ?? "";
  const linkedDocs = await stockModal.locator('li').allTextContents();
  report.visibleValues.inventoryReduction = {
    stockRecord: stockRecordLabel,
    onHandBefore,
    onHandAfter,
    linkedDocuments: linkedDocs.map((value) => value.trim()).filter(Boolean),
  };
  report.routes.push({ step: "inventory_reduction", route: "/workspace/user/stock" });
  report.screenshots.push({ step: "inventory_reduction_result", path: await shot(page, "10-inventory-reduction-result.png") });

  await gotoRoute(page, "/workspace/user/journal-entries");
  await page.waitForSelector('[data-inspector-real-register="journal-entries"]', { timeout: 10000 });
  const journalRows = await page.locator('table tbody tr').evaluateAll((rows) => rows.slice(0, 5).map((row) => row.textContent?.trim() ?? ""));
  report.visibleValues.journalEntries = journalRows;
  report.routes.push({ step: "journal_entries", route: "/workspace/user/journal-entries" });
  report.screenshots.push({ step: "journal_entries", path: await shot(page, "11-journal-entries.png") });

  await gotoRoute(page, "/workspace/user/reports/vat-summary");
  const vatKpis = await page.locator('text=/Total Taxable|Total Tax|Tax Codes/i').evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ""));
  const vatTableFirstRow = (await page.locator('table tbody tr').first().textContent())?.trim() ?? "";
  report.visibleValues.vat = {
    kpis: vatKpis,
    firstRow: vatTableFirstRow,
  };
  report.routes.push({ step: "vat_summary", route: "/workspace/user/reports/vat-summary" });
  report.screenshots.push({ step: "vat_summary", path: await shot(page, "12-vat-summary.png") });

  await gotoRoute(page, "/workspace/user/proforma-invoices");
  const proformaRegisterRow = proformaNumber
    ? page.locator(`text=${proformaNumber}`).first()
    : page.locator('table tbody tr').first();
  await proformaRegisterRow.waitFor({ timeout: 10000 });
  const registerText = (await page.locator('table').first().textContent())?.trim() ?? "";
  report.visibleValues.registerLinks = {
    proformaRegisterContains: proformaNumber,
    trackingText: registerText,
  };
  report.routes.push({ step: "register_links", route: "/workspace/user/proforma-invoices" });
  report.screenshots.push({ step: "register_links", path: await shot(page, "13-register-links.png") });

  await fs.writeFile(path.join(outputDir, "browser-workflow-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
  await browser.close();
}