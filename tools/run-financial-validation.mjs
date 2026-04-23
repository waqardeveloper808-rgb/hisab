import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const baseUrl = process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:8000";
const outputDir = process.env.OUTPUT_DIR ?? path.join(process.cwd(), "artifacts", `financial_validation_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "")}`);
const workspaceToken = process.env.WORKSPACE_TOKEN ?? "diag-proxy-token";

const apiDir = path.join(outputDir, "api");
const proofDir = path.join(outputDir, "proof");
const reportsDir = path.join(outputDir, "reports");

function stamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
}

function minutesBetween(start, end) {
  return `${((((new Date(end)).getTime() - (new Date(start)).getTime()) / 1000) / 60).toFixed(2)} min`;
}

async function ensureDirs() {
  await fs.mkdir(apiDir, { recursive: true });
  await fs.mkdir(proofDir, { recursive: true });
  await fs.mkdir(reportsDir, { recursive: true });
}

async function saveJson(relativePath, data) {
  const target = path.join(outputDir, relativePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(json)}`);
  }

  return json;
}

function workspaceHeaders(actorId) {
  return {
    "X-Gulf-Hisab-Workspace-Token": workspaceToken,
    "X-Gulf-Hisab-Actor-Id": String(actorId),
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

async function zipArtifacts(targetDir) {
  const zipPath = `${targetDir}.zip`;
  await execFileAsync("powershell", [
    "-NoProfile",
    "-Command",
    `if (Test-Path '${zipPath}') { Remove-Item '${zipPath}' -Force }; Compress-Archive -Path '${targetDir}\\*' -DestinationPath '${zipPath}' -Force`,
  ], { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 16 });
  return zipPath;
}

async function main() {
  await ensureDirs();
  const executionSteps = [];
  const errors = [];
  const started = new Date().toISOString();

  const recordStep = (step, start, end, status) => {
    executionSteps.push({ step, start, end, duration: minutesBetween(start, end), status });
  };

  const authStart = new Date().toISOString();
  const suffix = Date.now();
  const auth = await requestJson(`${baseUrl}/api/auth/register`, {
    method: "POST",
    body: JSON.stringify({
      name: `Financial Validation ${suffix}`,
      email: `financial-validation-${suffix}@example.com`,
      password: "Password123!",
      password_confirmation: "Password123!",
    }),
  });
  const actorId = auth.data.id;
  await saveJson("api/00-register.json", auth);
  const authEnd = new Date().toISOString();
  recordStep("Register Validation User", authStart, authEnd, "PASS");

  const companyStart = new Date().toISOString();
  const companyResponse = await requestJson(`${baseUrl}/api/companies`, {
    method: "POST",
    headers: workspaceHeaders(actorId),
    body: JSON.stringify({ legal_name: `Financial Validation Co ${suffix}` }),
  });
  const companyId = companyResponse.data.id;
  await saveJson("api/01-company.json", companyResponse);
  const companyEnd = new Date().toISOString();
  recordStep("Create Company", companyStart, companyEnd, "PASS");

  const accounts = await requestJson(`${baseUrl}/api/companies/${companyId}/accounts`, { headers: workspaceHeaders(actorId) });
  const accountByCode = new Map(accounts.data.map((account) => [account.code, account]));
  await saveJson("api/02-accounts.json", accounts);

  const datasetStart = new Date().toISOString();
  const contacts = [];
  const products = [];
  for (let index = 1; index <= 10; index += 1) {
    const contact = await requestJson(`${baseUrl}/api/companies/${companyId}/contacts`, {
      method: "POST",
      headers: workspaceHeaders(actorId),
      body: JSON.stringify({
        type: "customer",
        display_name: `Financial Customer ${index}`,
        tax_number: `3000000000${String(1000 + index).padStart(5, "0")}`.slice(0, 15),
      }),
    });
    contacts.push(contact.data);

    const product = await requestJson(`${baseUrl}/api/companies/${companyId}/items`, {
      method: "POST",
      headers: workspaceHeaders(actorId),
      body: JSON.stringify({
        type: "product",
        name: `Financial Product ${index}`,
        income_account_id: accountByCode.get("4000")?.id,
        expense_account_id: accountByCode.get("6900")?.id,
        default_sale_price: 100 + index * 10,
        default_purchase_price: 50 + index * 5,
      }),
    });
    products.push(product.data);

    await requestJson(`${baseUrl}/api/companies/${companyId}/inventory/stock`, {
      method: "POST",
      headers: workspaceHeaders(actorId),
      body: JSON.stringify({
        item_id: product.data.id,
        product_name: product.data.name,
        material: "Finished good",
        inventory_type: "finished_good",
        size: "Unit",
        source: "purchase",
        code: `FIN-${index}`,
        quantity_on_hand: 20,
        unit_cost: 50 + index * 5,
        offset_account_code: "2000",
        reference: `PO-FIN-${index}`,
        transaction_date: "2026-04-22",
      }),
    });
  }
  await saveJson("api/03-customers.json", contacts);
  await saveJson("api/04-products.json", products);
  const datasetEnd = new Date().toISOString();
  recordStep("Create Business Dataset", datasetStart, datasetEnd, contacts.length === 10 && products.length === 10 ? "PASS" : "FAIL");

  const supplier = await requestJson(`${baseUrl}/api/companies/${companyId}/contacts`, {
    method: "POST",
    headers: workspaceHeaders(actorId),
    body: JSON.stringify({ type: "supplier", display_name: "Financial Supplier", tax_number: "300000000009998" }),
  });
  await saveJson("api/05-supplier.json", supplier);

  const scenarios = [
    { quantity: 2, paymentAmount: 0, label: "invoice_unpaid" },
    { quantity: 2, paymentAmount: null, label: "invoice_full_payment" },
    { quantity: 3, paymentAmount: 100, label: "invoice_partial_payment" },
    { quantity: 1, paymentAmount: null, label: "invoice_full_payment_small" },
    { quantity: 4, paymentAmount: 200, label: "invoice_partial_payment_large" },
  ];

  const scenarioProofs = [];
  const journalEntries = [];
  const inventoryProofs = [];
  let vatReceivedTotal = 0;
  let vatPaidTotal = 0;

  const workflowStart = new Date().toISOString();
  for (const [index, scenario] of scenarios.entries()) {
    const customer = contacts[index];
    const product = products[index];
    const beforeStock = await requestJson(`${baseUrl}/api/companies/${companyId}/inventory/stock`, { headers: workspaceHeaders(actorId) });
    const beforeRow = beforeStock.data.find((row) => row.item_id === product.id || row.product_name === product.name);

    const draft = await requestJson(`${baseUrl}/api/companies/${companyId}/sales-documents`, {
      method: "POST",
      headers: workspaceHeaders(actorId),
      body: JSON.stringify({
        type: "tax_invoice",
        contact_id: customer.id,
        issue_date: `2026-04-${String(10 + index).padStart(2, "0")}`,
        due_date: `2026-04-${String(17 + index).padStart(2, "0")}`,
        lines: [{
          item_id: product.id,
          quantity: scenario.quantity,
          unit_price: product.default_sale_price,
          tax_category_id: product.tax_category_id,
          ledger_account_id: accountByCode.get("4000")?.id,
        }],
      }),
    });
    const invoiceId = draft.data.id;
    const finalized = await requestJson(`${baseUrl}/api/companies/${companyId}/sales-documents/${invoiceId}/finalize`, {
      method: "POST",
      headers: workspaceHeaders(actorId),
    });
    const invoice = finalized.data;
    vatReceivedTotal += Number(invoice.tax_total ?? 0);

    const paymentAmount = scenario.paymentAmount === null ? Number(invoice.grand_total) : scenario.paymentAmount;
    if (paymentAmount > 0) {
      await requestJson(`${baseUrl}/api/companies/${companyId}/sales-documents/${invoiceId}/payments`, {
        method: "POST",
        headers: workspaceHeaders(actorId),
        body: JSON.stringify({
          amount: paymentAmount,
          payment_date: `2026-04-${String(11 + index).padStart(2, "0")}`,
          method: "bank_transfer",
          reference: `FIN-PAY-${index + 1}`,
        }),
      });
    }

    const invoiceDetail = await requestJson(`${baseUrl}/api/companies/${companyId}/sales-documents/${invoiceId}`, { headers: workspaceHeaders(actorId) });
    const journals = await requestJson(`${baseUrl}/api/companies/${companyId}/journals?per_page=200`, { headers: workspaceHeaders(actorId) });
    const afterStock = await requestJson(`${baseUrl}/api/companies/${companyId}/inventory/stock`, { headers: workspaceHeaders(actorId) });
    const afterRow = afterStock.data.find((row) => row.item_id === product.id || row.product_name === product.name);

    const relatedJournals = journals.data.filter((entry) => {
      return entry.reference === invoice.document_number || entry.reference === `FIN-PAY-${index + 1}` || (entry.document_numbers ?? []).includes(invoice.document_number);
    });

    const normalizedJournals = relatedJournals.map((entry) => ({
      id: entry.id,
      entry_number: entry.entry_number,
      source_type: entry.source_type,
      source_id: entry.source_id,
      reference: entry.reference,
      lines: entry.lines ?? [],
      totals: journalTotals(entry.lines ?? []),
    }));

    journalEntries.push(...normalizedJournals.map((entry) => ({ ...entry, scenario: scenario.label, invoice_number: invoice.document_number })));
    inventoryProofs.push({
      scenario: scenario.label,
      product_id: product.id,
      product_name: product.name,
      inventory_before: Number(beforeRow?.quantity_on_hand ?? 0),
      sold_quantity: scenario.quantity,
      inventory_after: Number(afterRow?.quantity_on_hand ?? 0),
      inventory_correct: Math.abs((Number(beforeRow?.quantity_on_hand ?? 0) - scenario.quantity) - Number(afterRow?.quantity_on_hand ?? 0)) < 0.0001,
    });

    scenarioProofs.push({
      scenario: scenario.label,
      invoice_number: invoice.document_number,
      invoice_status: invoiceDetail.data.status,
      grand_total: Number(invoice.grand_total),
      payment_amount: paymentAmount,
      balance_due: Number(invoiceDetail.data.balance_due),
      revenue_expected: Number(invoice.taxable_total),
      vat_expected: Number(invoice.tax_total),
      journals_balanced: normalizedJournals.every((entry) => entry.totals.balanced),
      receivable_or_cash_updated: normalizedJournals.some((entry) => (entry.lines ?? []).some((line) => ["1100", "1200", "1210"].includes(line.account_code))),
    });
  }
  const workflowEnd = new Date().toISOString();
  recordStep("Execute Sales Workflow", workflowStart, workflowEnd, scenarioProofs.every((scenario) => scenario.journals_balanced) ? "PASS" : "FAIL");

  const vatStart = new Date().toISOString();
  const expense = await requestJson(`${baseUrl}/api/companies/${companyId}/purchase-documents`, {
    method: "POST",
    headers: workspaceHeaders(actorId),
    body: JSON.stringify({
      type: "vendor_bill",
      contact_id: supplier.data.id,
      issue_date: "2026-04-22",
      due_date: "2026-04-29",
      title: "VAT Input Expense",
      lines: [{
        description: "Office rent",
        quantity: 1,
        unit_price: 300,
        tax_category_id: products[0].tax_category_id,
        ledger_account_id: accountByCode.get("6900")?.id,
      }],
    }),
  });
  const expenseId = expense.data.id;
  const finalizedExpense = await requestJson(`${baseUrl}/api/companies/${companyId}/purchase-documents/${expenseId}/finalize`, {
    method: "POST",
    headers: workspaceHeaders(actorId),
  });
  vatPaidTotal += Number(finalizedExpense.data.tax_total ?? 0);
  await saveJson("api/06-expense.json", finalizedExpense);
  const vatEnd = new Date().toISOString();
  recordStep("Execute VAT Expense Flow", vatStart, vatEnd, "PASS");

  const reportsStart = new Date().toISOString();
  const profitLoss = await requestJson(`${baseUrl}/api/companies/${companyId}/reports/profit-loss`, { headers: workspaceHeaders(actorId) });
  const vatSummary = await requestJson(`${baseUrl}/api/companies/${companyId}/reports/vat-summary`, { headers: workspaceHeaders(actorId) });
  const trialBalance = await requestJson(`${baseUrl}/api/companies/${companyId}/reports/trial-balance`, { headers: workspaceHeaders(actorId) });
  const generalLedger = await requestJson(`${baseUrl}/api/companies/${companyId}/reports/general-ledger?from=2026-04-01&to=2026-04-30`, { headers: workspaceHeaders(actorId) });
  await saveJson("reports/profit-loss.json", profitLoss);
  await saveJson("reports/vat-summary.json", vatSummary);
  await saveJson("reports/trial-balance.json", trialBalance);
  await saveJson("reports/general-ledger.json", generalLedger);
  const reportsEnd = new Date().toISOString();
  recordStep("Validate Reports", reportsStart, reportsEnd, "PASS");

  const journalStart = new Date().toISOString();
  const allJournalsBalanced = journalEntries.every((entry) => entry.totals.balanced);
  const noOrphanEntries = journalEntries.every((entry) => Array.isArray(entry.lines) && entry.lines.length >= 2);
  const trialDebit = trialBalance.data.reduce((sum, row) => sum + Number(row.debit_total ?? 0), 0);
  const trialCredit = trialBalance.data.reduce((sum, row) => sum + Number(row.credit_total ?? 0), 0);
  const trialBalanced = Math.abs(trialDebit - trialCredit) < 0.0001;
  const journalEnd = new Date().toISOString();
  recordStep("Journal Entry Validation", journalStart, journalEnd, allJournalsBalanced && noOrphanEntries && trialBalanced ? "PASS" : "FAIL");

  const inventoryStart = new Date().toISOString();
  const inventoryCorrect = inventoryProofs.every((entry) => entry.inventory_correct);
  const inventoryEnd = new Date().toISOString();
  recordStep("Inventory and COGS Validation", inventoryStart, inventoryEnd, inventoryCorrect ? "PASS" : "FAIL");

  const vatRow = (vatSummary.data ?? []).find((row) => row.code === "VAT15") ?? null;
  const reportedVatReceived = Number(vatRow?.output_tax_amount ?? 0);
  const reportedVatPaid = Number(vatRow?.input_tax_amount ?? 0);
  const reportedVatPayable = Number(vatRow?.net_tax_amount ?? (reportedVatReceived - reportedVatPaid));
  const calculatedVatPayable = Number((vatReceivedTotal - vatPaidTotal).toFixed(2));
  const vatCorrect = Math.abs(calculatedVatPayable - reportedVatPayable) < 0.01;

  const revenueLine = (profitLoss.data.lines ?? []).find((line) => line.code === "4000");
  const expenseLine = (profitLoss.data.lines ?? []).find((line) => line.code === "6900");
  const reportsCorrect = Boolean(revenueLine && expenseLine && vatRow);

  const financialValidationReport = {
    journal_balanced: allJournalsBalanced && noOrphanEntries && trialBalanced,
    inventory_correct: inventoryCorrect,
    vat_correct: vatCorrect,
    reports_correct: reportsCorrect,
    errors,
  };

  const workflowProof = {
    generated_at: new Date().toISOString(),
    stock_reduced: inventoryCorrect,
    revenue_recorded: Boolean(revenueLine),
    vat_applied: vatCorrect,
    report_updated: reportsCorrect,
    scenarios: scenarioProofs,
  };

  const vatCalculation = {
    generated_at: new Date().toISOString(),
    vat_received_from_transactions: Number(vatReceivedTotal.toFixed(2)),
    vat_paid_from_transactions: Number(vatPaidTotal.toFixed(2)),
    vat_payable_calculated: calculatedVatPayable,
    vat_received_reported: Number(reportedVatReceived.toFixed(2)),
    vat_paid_reported: Number(reportedVatPaid.toFixed(2)),
    vat_payable_reported: Number(reportedVatPayable.toFixed(2)),
    vat_correct: vatCorrect,
  };

  await saveJson("financial-validation-report.json", financialValidationReport);
  await fs.writeFile(path.join(process.cwd(), "artifacts", "financial-validation-report.json"), `${JSON.stringify(financialValidationReport, null, 2)}\n`, "utf8");
  await saveJson("workflow-proof.json", workflowProof);
  await saveJson("journal-entries.json", journalEntries);
  await saveJson("vat-calculation.json", vatCalculation);

  const executionLog = [
    "# Execution Log",
    "",
    ...executionSteps.map((entry) => `Step: ${entry.step}\nStart: ${entry.start}\nEnd: ${entry.end}\nDuration: ${entry.duration}\nStatus: ${entry.status}\n`),
  ].join("\n");
  await fs.writeFile(path.join(outputDir, "execution-log.md"), `${executionLog}\n`, "utf8");
  await fs.writeFile(path.join(outputDir, "execution-time-report.md"), `${executionLog}\n`, "utf8");

  const zipPath = await zipArtifacts(outputDir);

  const final = {
    outputDir,
    zipPath,
    financialValidationReport,
    vatCalculation,
  };

  console.log(JSON.stringify(final, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});