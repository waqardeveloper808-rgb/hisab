import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { chromium } from "playwright";

const execFileAsync = promisify(execFile);

const repoRoot = process.cwd();
const frontendBaseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3006").trim().replace(/\/$/, "");
const backendBaseUrl = (process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:8000").trim().replace(/\/$/, "");
const companyId = Number(process.env.COMPANY_ID ?? "2");
const actorId = Number(process.env.ACTOR_ID ?? "2");
const loginEmail = (process.env.UI_LOGIN_EMAIL ?? "sandbox.admin@gulfhisab.sa").trim();
const loginPassword = (process.env.UI_LOGIN_PASSWORD ?? "RecoveryPass123!").trim();
const backendEnvPath = path.join(repoRoot, "backend", ".env");
const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const artifactDir = path.resolve(process.env.OUTPUT_DIR ?? path.join(repoRoot, "artifacts", `compliant_dummy_data_${timestamp}`));

const dirs = {
  api: path.join(artifactDir, "api"),
  db: path.join(artifactDir, "db"),
  reports: path.join(artifactDir, "reports"),
  proof: path.join(artifactDir, "proof"),
  proofUi: path.join(artifactDir, "proof", "ui"),
  logs: path.join(artifactDir, "logs"),
  docs: path.join(artifactDir, "docs"),
};

const runTag = `CDM-${timestamp}`;
const requiredCounts = {
  customers: 10,
  vendors: 10,
  products: 10,
  invoices: 10,
  payments: 10,
  vendorBills: 10,
  inventoryMovements: 10,
};

const vatValues = [
  "300000000000003",
  "300000000000013",
  "300000000000023",
  "300000000000033",
  "300000000000043",
  "300000000000053",
  "300000000000063",
  "300000000000073",
  "300000000000083",
  "300000000000093",
  "300000000000103",
  "300000000000113",
  "300000000000123",
  "300000000000133",
  "300000000000143",
  "300000000000153",
  "300000000000163",
  "300000000000173",
  "300000000000183",
  "300000000000193",
  "300000000000203",
  "300000000000213",
];

const cityPresets = [
  { city: "Riyadh", district: "Al Olaya", street: "King Fahd Road", postal: "12214", additional: "4321", building: "8101", shortAddress: "8101 King Fahd Rd" },
  { city: "Jeddah", district: "Al Rawdah", street: "Prince Sultan Road", postal: "23432", additional: "5432", building: "8202", shortAddress: "8202 Prince Sultan Rd" },
  { city: "Dammam", district: "Al Faisaliyah", street: "King Saud Road", postal: "32271", additional: "6543", building: "8303", shortAddress: "8303 King Saud Rd" },
  { city: "Khobar", district: "Al Ulaya", street: "Custodian of the Two Holy Mosques Road", postal: "34447", additional: "7654", building: "8404", shortAddress: "8404 Ulaya Rd" },
  { city: "Madinah", district: "Al Khalidiyyah", street: "Abu Bakr Al Siddiq Road", postal: "42317", additional: "8765", building: "8505", shortAddress: "8505 Abu Bakr Rd" },
];

const logLines = [];

async function ensureDirs() {
  await Promise.all(Object.values(dirs).map((dir) => fs.mkdir(dir, { recursive: true })));
}

async function readDotEnvValue(filePath, key) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
    return match ? match[1].trim().replace(/^"|"$/g, "") : null;
  } catch {
    return null;
  }
}

async function appendLog(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  logLines.push(line);
  await fs.writeFile(path.join(dirs.logs, "execution.log"), `${logLines.join("\n")}\n`, "utf8");
  console.log(line);
}

async function saveJson(relativePath, value) {
  const filePath = path.join(artifactDir, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return filePath;
}

async function saveText(relativePath, value) {
  const filePath = path.join(artifactDir, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value, "utf8");
  return filePath;
}

function workspaceHeaders(workspaceToken, extra = {}) {
  return {
    Accept: "application/json",
    "X-Gulf-Hisab-Workspace-Token": workspaceToken,
    "X-Gulf-Hisab-Actor-Id": String(actorId),
    ...extra,
  };
}

async function backendJson(url, { method = "GET", headers = {}, body } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`${method} ${url} failed: ${response.status} ${response.statusText} ${JSON.stringify(json)}`);
  }

  return json;
}

function digitsOnly(value) {
  return String(value ?? "").replace(/\D+/g, "");
}

function isValidVat(value) {
  const normalized = digitsOnly(value);
  return /^3\d{13}3$/.test(normalized);
}

function normalizePhone(value) {
  const digits = digitsOnly(value);
  if (digits.startsWith("966")) {
    return `+${digits}`;
  }
  if (digits.startsWith("0")) {
    return `+966${digits.slice(1)}`;
  }
  return `+${digits}`;
}

function isValidPhone(value) {
  const normalized = normalizePhone(value);
  return /^\+?\d{9,15}$/.test(normalized);
}

function buildAddress(index) {
  const preset = cityPresets[index % cityPresets.length];
  return {
    building_number: preset.building,
    street_name: preset.street,
    district: preset.district,
    city: preset.city,
    postal_code: preset.postal,
    secondary_number: preset.additional,
    country: "SA",
    short_address: preset.shortAddress,
  };
}

function validateAddress(address) {
  return Boolean(
    address
    && /^\d{4}$/.test(String(address.building_number ?? ""))
    && String(address.street_name ?? "").trim().length > 0
    && String(address.district ?? "").trim().length > 0
    && String(address.city ?? "").trim().length > 0
    && /^\d{5}$/.test(String(address.postal_code ?? ""))
    && /^\d{4}$/.test(String(address.secondary_number ?? ""))
    && String(address.country ?? "").toUpperCase() === "SA"
  );
}

function vatAt(index) {
  return vatValues[index];
}

function customerPayload(index, accounts) {
  const address = buildAddress(index);
  return {
    type: "customer",
    display_name: `${runTag} Customer ${String(index + 1).padStart(2, "0")}`,
    legal_name: `${runTag} Customer Legal ${String(index + 1).padStart(2, "0")}`,
    email: `${runTag.toLowerCase()}-customer-${index + 1}@example.sa`,
    phone: normalizePhone(`0555000${String(100 + index).padStart(3, "0")}`),
    city: address.city,
    country: "SA",
    tax_number: vatAt(index),
    billing_address: address,
    currency_code: "SAR",
    receivable_account_id: accounts.get("1100")?.id,
  };
}

function supplierPayload(index, accounts) {
  const address = buildAddress(index + 10);
  return {
    type: "supplier",
    display_name: `${runTag} Supplier ${String(index + 1).padStart(2, "0")}`,
    legal_name: `${runTag} Supplier Legal ${String(index + 1).padStart(2, "0")}`,
    email: `${runTag.toLowerCase()}-supplier-${index + 1}@example.sa`,
    phone: normalizePhone(`0555111${String(100 + index).padStart(3, "0")}`),
    city: address.city,
    country: "SA",
    tax_number: vatAt(index + 10),
    billing_address: address,
    currency_code: "SAR",
    payable_account_id: accounts.get("2000")?.id,
  };
}

function productPayload(index, accounts) {
  return {
    type: "product",
    inventory_classification: "inventory_tracked",
    sku: `${runTag}-SKU-${String(index + 1).padStart(2, "0")}`,
    name: `${runTag} Product ${String(index + 1).padStart(2, "0")}`,
    description: `Compliant inventory product ${index + 1}`,
    default_sale_price: 150 + index * 15,
    default_purchase_price: 90 + index * 10,
    income_account_id: accounts.get("4000")?.id,
    expense_account_id: accounts.get("5000")?.id ?? accounts.get("6900")?.id,
  };
}

function journalTotals(lines) {
  const debit = lines.reduce((sum, line) => sum + Number(line.debit ?? 0), 0);
  const credit = lines.reduce((sum, line) => sum + Number(line.credit ?? 0), 0);
  return {
    debit: Number(debit.toFixed(2)),
    credit: Number(credit.toFixed(2)),
    balanced: Math.abs(debit - credit) < 0.0001,
  };
}

function validateContactRecord(record) {
  return {
    display_name: Boolean(String(record.display_name ?? record.displayName ?? "").trim()),
    tax_number: isValidVat(record.tax_number ?? record.taxNumber),
    phone: isValidPhone(record.phone),
    billing_address: validateAddress(record.billing_address ?? record.billingAddress),
  };
}

async function zipArtifacts(targetDir) {
  const zipPath = `${targetDir}.zip`;
  await execFileAsync("powershell", [
    "-NoProfile",
    "-Command",
    `if (Test-Path '${zipPath}') { Remove-Item '${zipPath}' -Force }; Compress-Archive -Path '${targetDir}\\*' -DestinationPath '${zipPath}' -Force`,
  ], { cwd: repoRoot, maxBuffer: 1024 * 1024 * 32 });
  return zipPath;
}

async function runDbCountProof() {
  const { stdout } = await execFileAsync("php", [path.join(repoRoot, "backend", "db_count_proof.php")], {
    cwd: path.join(repoRoot, "backend"),
    env: {
      ...process.env,
      COMPANY_ID: String(companyId),
    },
    maxBuffer: 1024 * 1024 * 8,
  });
  return JSON.parse(stdout);
}

async function loginUi(context) {
  const page = await context.newPage();
  await page.goto(`${frontendBaseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(loginEmail);
  await page.getByLabel("Password").fill(loginPassword);
  await page.getByRole("button", { name: /Log in|Opening workspace/i }).click();
  await page.waitForURL(/\/workspace\/(user|settings)(?:\/.*)?$/, { timeout: 30000 });
  return page;
}

async function capture(page, name, locator) {
  const target = locator ?? page.locator("body");
  const screenshotPath = path.join(dirs.proofUi, name);
  await target.first().screenshot({ path: screenshotPath });
  return screenshotPath;
}

async function captureUiProof(uiCustomer) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1400 } });
  const screenshots = {};

  try {
    const page = await loginUi(context);

    await page.goto(`${frontendBaseUrl}/workspace/settings/company`, { waitUntil: "networkidle" });
    await page.getByLabel("VAT Number").fill("123");
    await page.getByRole("button", { name: "Save settings" }).click();
    await page.waitForTimeout(300);
    screenshots.companyValidation = await capture(page, "01-company-validation-errors.png", page.locator("text=Company profile master").locator("..").locator("..").first());

    await page.reload({ waitUntil: "networkidle" });
    await page.goto(`${frontendBaseUrl}/workspace/user/customers`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Add Customer" }).click();
    await page.getByRole("button", { name: "Create Customer" }).click();
    await page.waitForTimeout(300);
    screenshots.customerValidation = await capture(page, "02-customer-validation-errors.png", page.locator('[data-inspector-form="customer-create"]'));

    await page.getByLabel("Customer name").fill(`${runTag} UI Customer`);
    await page.getByLabel("Email").fill(uiCustomer.email);
    await page.getByLabel("Phone").fill(uiCustomer.phone);
    await page.getByLabel("City").fill(uiCustomer.city);
    await page.getByLabel("Country").fill("SA");
    await page.getByLabel("VAT number").fill(uiCustomer.tax_number);
    await page.getByLabel("Building number").fill(uiCustomer.billing_address.building_number);
    await page.getByLabel("Street").fill(uiCustomer.billing_address.street_name);
    await page.getByLabel("District").fill(uiCustomer.billing_address.district);
    await page.getByLabel("Postal code").fill(uiCustomer.billing_address.postal_code);
    await page.getByLabel("Secondary number").fill(uiCustomer.billing_address.secondary_number);
    await page.getByRole("button", { name: "Create Customer" }).click();
    await page.locator("text=/customer was created|customer record was imported|customer created/i").first().waitFor({ timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(500);
    screenshots.customerCreateSuccess = await capture(page, "03-customer-create-success.png", page.locator('[data-inspector-real-register="customers"]'));

    await page.getByLabel("Search customers").fill(runTag);
    await page.waitForTimeout(400);
    screenshots.customerRegister = await capture(page, "04-customers-register.png", page.locator('[data-inspector-real-register="customers"]'));

    await page.goto(`${frontendBaseUrl}/workspace/user/invoices`, { waitUntil: "networkidle" });
    screenshots.invoiceRegister = await capture(page, "05-invoices-register.png");

    await page.goto(`${frontendBaseUrl}/workspace/user/journal-entries`, { waitUntil: "networkidle" });
    screenshots.journalRegister = await capture(page, "06-journal-register.png", page.locator('[data-inspector-real-register="journal-entries"]'));

    await page.goto(`${frontendBaseUrl}/workspace/user/reports/vat-summary`, { waitUntil: "networkidle" });
    screenshots.vatSummary = await capture(page, "07-vat-summary.png");

    await page.goto(`${frontendBaseUrl}/workspace/user/stock`, { waitUntil: "networkidle" });
    screenshots.inventoryRegister = await capture(page, "08-inventory-stock.png", page.locator('[data-inspector-real-register="inventory-stock"]'));
  } finally {
    await browser.close();
  }

  return screenshots;
}

async function main() {
  await ensureDirs();
  await appendLog(`Starting compliant master data seed for company ${companyId} as actor ${actorId}`);

  const workspaceToken = (process.env.WORKSPACE_API_TOKEN ?? await readDotEnvValue(backendEnvPath, "WORKSPACE_API_TOKEN") ?? "").trim();
  if (!workspaceToken) {
    throw new Error("WORKSPACE_API_TOKEN is required via env or backend/.env.");
  }

  const accountsResponse = await backendJson(`${backendBaseUrl}/api/companies/${companyId}/accounts`, {
    headers: workspaceHeaders(workspaceToken),
  });
  const accounts = new Map((accountsResponse.data ?? []).map((account) => [account.code, account]));

  const invalidPayload = {
    type: "customer",
    display_name: `${runTag} Invalid Customer`,
    email: `${runTag.toLowerCase()}-invalid@example.sa`,
    phone: "123",
    city: "Riyadh",
    country: "SA",
    tax_number: "123456789012345",
    billing_address: {
      building_number: "99",
      street_name: "",
      district: "",
      city: "",
      postal_code: "12",
      secondary_number: "1",
      country: "SA",
    },
  };

  const invalidResponse = await fetch(`${backendBaseUrl}/api/companies/${companyId}/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...workspaceHeaders(workspaceToken),
    },
    body: JSON.stringify(invalidPayload),
  });
  const invalidJson = await invalidResponse.json();
  await saveJson("api/00-invalid-contact-rejection.json", {
    status: invalidResponse.status,
    ok: invalidResponse.ok,
    body: invalidJson,
  });
  if (invalidResponse.status !== 422) {
    throw new Error(`Expected invalid contact rejection to return 422, received ${invalidResponse.status}.`);
  }

  const seeded = {
    customers: [],
    suppliers: [],
    products: [],
    stockReceipts: [],
    invoices: [],
    payments: [],
    vendorBills: [],
    journals: [],
  };
  const validationFailures = [];

  for (let index = 0; index < 10; index += 1) {
    const customerResponse = await backendJson(`${backendBaseUrl}/api/companies/${companyId}/contacts`, {
      method: "POST",
      headers: workspaceHeaders(workspaceToken),
      body: customerPayload(index, accounts),
    });
    const supplierResponse = await backendJson(`${backendBaseUrl}/api/companies/${companyId}/contacts`, {
      method: "POST",
      headers: workspaceHeaders(workspaceToken),
      body: supplierPayload(index, accounts),
    });
    const productResponse = await backendJson(`${backendBaseUrl}/api/companies/${companyId}/items`, {
      method: "POST",
      headers: workspaceHeaders(workspaceToken),
      body: productPayload(index, accounts),
    });

    const product = productResponse.data;
    const productTaxCategoryId = product.tax_category_id ?? product.taxCategory?.id ?? product.tax_category?.id;
    if (!productTaxCategoryId) {
      throw new Error(`Created product ${product.name} did not return a VAT tax category.`);
    }
    const customer = customerResponse.data;
    const supplier = supplierResponse.data;
    const receiptReference = `${runTag}-GRN-${String(index + 1).padStart(2, "0")}`;
    const receiptResponse = await backendJson(`${backendBaseUrl}/api/companies/${companyId}/inventory/stock`, {
      method: "POST",
      headers: workspaceHeaders(workspaceToken),
      body: {
        item_id: product.id,
        product_name: product.name,
        material: "Finished good",
        inventory_type: "finished_good",
        size: "Unit",
        source: "purchase",
        code: `${runTag}-LOT-${String(index + 1).padStart(2, "0")}`,
        quantity_on_hand: 25,
        unit_cost: Number(product.default_purchase_price ?? 90 + index * 10),
        offset_account_code: "2000",
        reference: receiptReference,
        transaction_date: `2026-04-${String(10 + index).padStart(2, "0")}`,
      },
    });

    const invoiceDraft = await backendJson(`${backendBaseUrl}/api/companies/${companyId}/sales-documents`, {
      method: "POST",
      headers: workspaceHeaders(workspaceToken),
      body: {
        type: "tax_invoice",
        title: `${runTag} Invoice ${String(index + 1).padStart(2, "0")}`,
        contact_id: customer.id,
        issue_date: `2026-04-${String(10 + index).padStart(2, "0")}`,
        due_date: `2026-04-${String(17 + index).padStart(2, "0")}`,
        lines: [{
          item_id: product.id,
          quantity: 2,
          unit_price: Number(product.default_sale_price ?? 150 + index * 15),
          tax_category_id: productTaxCategoryId,
          ledger_account_id: accounts.get("4000")?.id,
        }],
      },
    });
    const invoiceFinalize = await backendJson(`${backendBaseUrl}/api/companies/${companyId}/sales-documents/${invoiceDraft.data.id}/finalize`, {
      method: "POST",
      headers: workspaceHeaders(workspaceToken),
    });
    const paymentReference = `${runTag}-PAY-${String(index + 1).padStart(2, "0")}`;
    const paymentResponse = await backendJson(`${backendBaseUrl}/api/companies/${companyId}/sales-documents/${invoiceDraft.data.id}/payments`, {
      method: "POST",
      headers: workspaceHeaders(workspaceToken),
      body: {
        amount: Number(invoiceFinalize.data.grand_total),
        payment_date: `2026-04-${String(11 + index).padStart(2, "0")}`,
        method: "bank_transfer",
        reference: paymentReference,
      },
    });

    const billDraft = await backendJson(`${backendBaseUrl}/api/companies/${companyId}/purchase-documents`, {
      method: "POST",
      headers: workspaceHeaders(workspaceToken),
      body: {
        type: "vendor_bill",
        title: `${runTag} Vendor Bill ${String(index + 1).padStart(2, "0")}`,
        contact_id: supplier.id,
        issue_date: `2026-04-${String(12 + index).padStart(2, "0")}`,
        due_date: `2026-04-${String(19 + index).padStart(2, "0")}`,
        lines: [{
          description: `${runTag} VAT-bearing operating cost ${String(index + 1).padStart(2, "0")}`,
          quantity: 1,
          unit_price: 115 + index * 7,
          tax_category_id: productTaxCategoryId,
          ledger_account_id: accounts.get("6900")?.id,
        }],
      },
    });
    const billFinalize = await backendJson(`${backendBaseUrl}/api/companies/${companyId}/purchase-documents/${billDraft.data.id}/finalize`, {
      method: "POST",
      headers: workspaceHeaders(workspaceToken),
    });

    seeded.customers.push(customer);
    seeded.suppliers.push(supplier);
    seeded.products.push(product);
    seeded.stockReceipts.push(receiptResponse.data);
    seeded.invoices.push(invoiceFinalize.data);
    seeded.payments.push(paymentResponse.data);
    seeded.vendorBills.push(billFinalize.data);
  }

  const journalsResponse = await backendJson(`${backendBaseUrl}/api/companies/${companyId}/journals?per_page=250`, {
    headers: workspaceHeaders(workspaceToken),
  });
  seeded.journals = (journalsResponse.data ?? []).filter((entry) => String(entry.reference ?? "").includes(runTag));

  for (const [kind, rows] of Object.entries({ customers: seeded.customers, suppliers: seeded.suppliers })) {
    rows.forEach((row) => {
      const validation = validateContactRecord(row);
      if (!Object.values(validation).every(Boolean)) {
        validationFailures.push({ kind, id: row.id, display_name: row.display_name, validation });
      }
    });
  }

  seeded.invoices.forEach((invoice) => {
    if (Number(invoice.tax_total ?? 0) <= 0 || Number(invoice.grand_total ?? 0) <= 0) {
      validationFailures.push({ kind: "invoice", id: invoice.id, document_number: invoice.document_number, reason: "Tax or grand total missing" });
    }
  });
  seeded.payments.forEach((payment) => {
    if (Number(payment.amount ?? 0) <= 0) {
      validationFailures.push({ kind: "payment", id: payment.id, reference: payment.reference, reason: "Payment amount missing" });
    }
  });
  seeded.vendorBills.forEach((bill) => {
    if (Number(bill.tax_total ?? 0) <= 0) {
      validationFailures.push({ kind: "vendor_bill", id: bill.id, document_number: bill.document_number, reason: "Input VAT missing" });
    }
  });
  seeded.journals.forEach((entry) => {
    const totals = journalTotals(entry.lines ?? []);
    if (!totals.balanced) {
      validationFailures.push({ kind: "journal", id: entry.id, reference: entry.reference, totals });
    }
  });

  if (seeded.journals.length < requiredCounts.inventoryMovements) {
    validationFailures.push({ kind: "journal", reason: `Expected at least ${requiredCounts.inventoryMovements} tagged journal entries, found ${seeded.journals.length}` });
  }

  await saveJson("api/01-seeded-entities-preview.json", {
    runTag,
    counts: Object.fromEntries(Object.entries(seeded).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])),
    customers: seeded.customers.map((row) => ({ id: row.id, display_name: row.display_name, tax_number: row.tax_number })),
    suppliers: seeded.suppliers.map((row) => ({ id: row.id, display_name: row.display_name, tax_number: row.tax_number })),
    products: seeded.products.map((row) => ({ id: row.id, sku: row.sku, name: row.name })),
    invoices: seeded.invoices.map((row) => ({ id: row.id, document_number: row.document_number, grand_total: row.grand_total })),
    payments: seeded.payments.map((row) => ({ id: row.id, reference: row.reference, amount: row.amount })),
    vendorBills: seeded.vendorBills.map((row) => ({ id: row.id, document_number: row.document_number, tax_total: row.tax_total })),
  });

  await saveJson("reports/validation-failures.json", validationFailures);
  if (validationFailures.length) {
    throw new Error(`Validation failures detected in seeded records: ${validationFailures.length}`);
  }

  const apiProof = {
    invalidRejectionStatus: invalidResponse.status,
    createdCounts: {
      customers: seeded.customers.length,
      vendors: seeded.suppliers.length,
      products: seeded.products.length,
      invoices: seeded.invoices.length,
      payments: seeded.payments.length,
      vendorBills: seeded.vendorBills.length,
      inventoryMovements: seeded.stockReceipts.length,
      journals: seeded.journals.length,
    },
    allContactsCompliant: [...seeded.customers, ...seeded.suppliers].every((row) => Object.values(validateContactRecord(row)).every(Boolean)),
    allInvoicesTaxed: seeded.invoices.every((row) => Number(row.tax_total ?? 0) > 0),
    allVendorBillsTaxed: seeded.vendorBills.every((row) => Number(row.tax_total ?? 0) > 0),
  };
  await saveJson("reports/api-proof.json", apiProof);

  const dbProof = await runDbCountProof();
  await saveJson("db/db-proof.json", dbProof);

  const reports = {
    vatSummary: await backendJson(`${backendBaseUrl}/api/companies/${companyId}/reports/vat-summary`, { headers: workspaceHeaders(workspaceToken) }),
    trialBalance: await backendJson(`${backendBaseUrl}/api/companies/${companyId}/reports/trial-balance`, { headers: workspaceHeaders(workspaceToken) }),
    paymentsRegister: await backendJson(`${backendBaseUrl}/api/companies/${companyId}/reports/payments-register`, { headers: workspaceHeaders(workspaceToken) }),
    inventoryStock: await backendJson(`${backendBaseUrl}/api/companies/${companyId}/inventory/stock`, { headers: workspaceHeaders(workspaceToken) }),
  };
  await saveJson("reports/register-counts.json", {
    requiredCounts,
    dbProof,
    taggedCounts: apiProof.createdCounts,
  });
  await saveJson("reports/vat-summary.json", reports.vatSummary);
  await saveJson("reports/trial-balance.json", reports.trialBalance);
  await saveJson("reports/payments-register.json", reports.paymentsRegister);
  await saveJson("reports/inventory-stock.json", reports.inventoryStock);

  const uiCustomer = customerPayload(10, accounts);
  const uiProof = await captureUiProof(uiCustomer);
  await saveJson("proof/ui-screenshots.json", uiProof);

  const summaryLines = [
    `Run tag: ${runTag}`,
    `Artifact directory: ${artifactDir}`,
    `Target company: ${companyId}`,
    `Actor: ${actorId}`,
    `Invalid API rejection: ${invalidResponse.status}`,
    `Tagged customers: ${seeded.customers.length}`,
    `Tagged suppliers: ${seeded.suppliers.length}`,
    `Tagged products: ${seeded.products.length}`,
    `Tagged invoices: ${seeded.invoices.length}`,
    `Tagged payments: ${seeded.payments.length}`,
    `Tagged vendor bills: ${seeded.vendorBills.length}`,
    `Tagged inventory receipts: ${seeded.stockReceipts.length}`,
    `Tagged journals: ${seeded.journals.length}`,
  ];
  await saveText("docs/execution-log.md", `${summaryLines.map((line) => `- ${line}`).join("\n")}\n`);
  await saveText(
    "docs/execution-time-report.md",
    [
      "# Execution Time Report",
      "",
      `- Started: ${new Date().toISOString()}`,
      `- Artifact directory: ${artifactDir}`,
      `- Screenshots: ${Object.keys(uiProof).length}`,
    ].join("\n"),
  );

  const zipPath = await zipArtifacts(artifactDir);
  await appendLog(`Completed compliant master data seed. Zip: ${zipPath}`);
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  await appendLog(`FAILED: ${message}`);
  process.exitCode = 1;
});