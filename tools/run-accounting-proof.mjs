import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const baseUrl = process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:8001";
const workspaceToken = process.env.WORKSPACE_TOKEN ?? "diag-proxy-token";
const artifactDir = process.env.OUTPUT_DIR;

if (!artifactDir) {
  throw new Error("OUTPUT_DIR is required.");
}

const apiDir = path.join(artifactDir, "api");
const reportsDir = path.join(artifactDir, "reports");
const proofDir = path.join(artifactDir, "proof");

async function ensureDirs() {
  await fs.mkdir(apiDir, { recursive: true });
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.mkdir(proofDir, { recursive: true });
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

async function saveJson(relativePath, data) {
  const target = path.join(artifactDir, relativePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(data, null, 2));
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
    debit: debit.toFixed(2),
    credit: credit.toFixed(2),
    balanced: Math.abs(debit - credit) < 0.0001,
  };
}

function normalizeJournal(entry) {
  return {
    id: entry.id,
    entry_number: entry.entry_number,
    source_type: entry.source_type,
    source_id: entry.source_id,
    reference: entry.reference,
    description: entry.description,
    document_numbers: entry.document_numbers ?? [],
    lines: (entry.lines ?? []).map((line) => ({
      account_code: line.account_code,
      account_name: line.account_name,
      document_number: line.document_number,
      description: line.description,
      debit: Number(line.debit ?? 0).toFixed(2),
      credit: Number(line.credit ?? 0).toFixed(2),
    })),
    totals: journalTotals(entry.lines ?? []),
  };
}

async function main() {
  await ensureDirs();

  const suffix = Date.now();
  const auth = await requestJson(`${baseUrl}/api/auth/register`, {
    method: "POST",
    body: JSON.stringify({
      name: `Accounting Proof ${suffix}`,
      email: `accounting-proof-${suffix}@example.com`,
      password: "Password123!",
      password_confirmation: "Password123!",
    }),
  });
  const actorId = auth.data.id;
  await saveJson("api/00-register.json", auth);

  const companyResponse = await requestJson(`${baseUrl}/api/companies`, {
    method: "POST",
    headers: workspaceHeaders(actorId),
    body: JSON.stringify({ legal_name: `Accounting Proof Co ${suffix}` }),
  });
  const companyId = companyResponse.data.id;
  await saveJson("api/01-create-company.json", companyResponse);

  const contactCustomer = await requestJson(`${baseUrl}/api/companies/${companyId}/contacts`, {
    method: "POST",
    headers: workspaceHeaders(actorId),
    body: JSON.stringify({ type: "customer", display_name: "Proof Customer", tax_number: "300000000009991" }),
  });
  const customerId = contactCustomer.data.id;
  await saveJson("api/02-create-customer.json", contactCustomer);

  const contactSupplier = await requestJson(`${baseUrl}/api/companies/${companyId}/contacts`, {
    method: "POST",
    headers: workspaceHeaders(actorId),
    body: JSON.stringify({ type: "supplier", display_name: "Proof Supplier", tax_number: "300000000009992" }),
  });
  const supplierId = contactSupplier.data.id;
  await saveJson("api/03-create-supplier.json", contactSupplier);

  const accounts = await requestJson(`${baseUrl}/api/companies/${companyId}/accounts`, {
    headers: workspaceHeaders(actorId),
  });
  await saveJson("api/04-accounts.json", accounts);

  const accountByCode = new Map(accounts.data.map((account) => [account.code, account]));
  const settings = await requestJson(`${baseUrl}/api/companies/${companyId}/settings`, {
    headers: workspaceHeaders(actorId),
  });
  await saveJson("api/05-settings.json", settings);

  const itemResponse = await requestJson(`${baseUrl}/api/companies/${companyId}/items`, {
    method: "POST",
    headers: workspaceHeaders(actorId),
    body: JSON.stringify({
      type: "product",
      name: "Proof Product",
      income_account_id: accountByCode.get("4000")?.id,
      expense_account_id: accountByCode.get("6900")?.id,
      default_sale_price: 100,
      default_purchase_price: 50,
    }),
  });
  const itemId = itemResponse.data.id;
  const vat15Id = itemResponse.data.tax_category_id ?? itemResponse.data.tax_category?.id ?? itemResponse.data.taxCategory?.id;
  if (!vat15Id) {
    throw new Error("Default VAT category not resolved from created item.");
  }
  await saveJson("api/06-create-item.json", itemResponse);

  const flow1Inventory = await requestJson(`${baseUrl}/api/companies/${companyId}/inventory/stock`, {
    method: "POST",
    headers: workspaceHeaders(actorId),
    body: JSON.stringify({
      item_id: itemId,
      product_name: "Proof Product",
      material: "Finished good",
      inventory_type: "finished_good",
      size: "Unit",
      source: "purchase",
      code: `PRF-${suffix}`,
      quantity_on_hand: 10,
      unit_cost: 50,
      offset_account_code: "2000",
      reference: "PO-PROOF-001",
      transaction_date: "2026-04-19",
    }),
  });
  await saveJson("api/07-flow1-add-inventory.json", flow1Inventory);

  const flow1InvoiceDraft = await requestJson(`${baseUrl}/api/companies/${companyId}/sales-documents`, {
    method: "POST",
    headers: workspaceHeaders(actorId),
    body: JSON.stringify({
      type: "tax_invoice",
      contact_id: customerId,
      issue_date: "2026-04-19",
      due_date: "2026-04-26",
      lines: [{
        item_id: itemId,
        quantity: 2,
        unit_price: 100,
        tax_category_id: vat15Id,
        ledger_account_id: accountByCode.get("4000")?.id,
      }],
    }),
  });
  const invoiceId = flow1InvoiceDraft.data.id;
  await saveJson("api/08-flow1-create-invoice.json", flow1InvoiceDraft);

  const flow1Finalize = await requestJson(`${baseUrl}/api/companies/${companyId}/sales-documents/${invoiceId}/finalize`, {
    method: "POST",
    headers: workspaceHeaders(actorId),
  });
  await saveJson("api/09-flow1-finalize-invoice.json", flow1Finalize);

  const flow1Payment = await requestJson(`${baseUrl}/api/companies/${companyId}/sales-documents/${invoiceId}/payments`, {
    method: "POST",
    headers: workspaceHeaders(actorId),
    body: JSON.stringify({
      amount: 230,
      payment_date: "2026-04-19",
      method: "bank_transfer",
      reference: "PAY-PROOF-001",
    }),
  });
  await saveJson("api/10-flow1-payment.json", flow1Payment);

  const invoiceDoc = await requestJson(`${baseUrl}/api/companies/${companyId}/sales-documents/${invoiceId}`, {
    headers: workspaceHeaders(actorId),
  });
  await saveJson("api/11-flow1-invoice-document.json", invoiceDoc);

  const stockAfterFlow1 = await requestJson(`${baseUrl}/api/companies/${companyId}/inventory/stock`, {
    headers: workspaceHeaders(actorId),
  });
  await saveJson("api/12-flow1-stock-after.json", stockAfterFlow1);

  const journalsAfterFlow1 = await requestJson(`${baseUrl}/api/companies/${companyId}/journals?per_page=100`, {
    headers: workspaceHeaders(actorId),
  });
  await saveJson("api/13-flow1-journals.json", journalsAfterFlow1);

  const expenseDraft = await requestJson(`${baseUrl}/api/companies/${companyId}/purchase-documents`, {
    method: "POST",
    headers: workspaceHeaders(actorId),
    body: JSON.stringify({
      type: "vendor_bill",
      contact_id: supplierId,
      issue_date: "2026-04-19",
      due_date: "2026-04-26",
      title: "Office expense with VAT",
      notes: "rent and utilities",
      lines: [{
        description: "Office rent",
        quantity: 1,
        unit_price: 300,
        tax_category_id: vat15Id,
        ledger_account_id: accountByCode.get("6900")?.id,
      }],
    }),
  });
  const expenseId = expenseDraft.data.id;
  await saveJson("api/20-flow2-create-expense.json", expenseDraft);

  const expenseFinalize = await requestJson(`${baseUrl}/api/companies/${companyId}/purchase-documents/${expenseId}/finalize`, {
    method: "POST",
    headers: workspaceHeaders(actorId),
  });
  await saveJson("api/21-flow2-finalize-expense.json", expenseFinalize);

  const expenseDoc = await requestJson(`${baseUrl}/api/companies/${companyId}/purchase-documents/${expenseId}`, {
    headers: workspaceHeaders(actorId),
  });
  await saveJson("api/22-flow2-expense-document.json", expenseDoc);

  const creditNoteResponse = await requestJson(`${baseUrl}/api/companies/${companyId}/sales-documents/${invoiceId}/credit-notes`, {
    method: "POST",
    headers: workspaceHeaders(actorId),
    body: JSON.stringify({
      issue_date: "2026-04-19",
      notes: "Partial return",
      lines: [{
        source_line_id: invoiceDoc.data.lines[0].id,
        quantity: 1,
      }],
    }),
  });
  const creditNoteId = creditNoteResponse.data.id;
  await saveJson("api/30-flow3-credit-note.json", creditNoteResponse);

  const creditNoteDoc = await requestJson(`${baseUrl}/api/companies/${companyId}/sales-documents/${creditNoteId}`, {
    headers: workspaceHeaders(actorId),
  }).catch(async () => {
    const docs = await requestJson(`${baseUrl}/api/companies/${companyId}/sales-documents`, { headers: workspaceHeaders(actorId) });
    return { data: docs.data.find((doc) => doc.id === creditNoteId) };
  });
  await saveJson("api/31-flow3-credit-note-document.json", creditNoteDoc);

  const compoundEntry = await requestJson(`${baseUrl}/api/companies/${companyId}/journals`, {
    method: "POST",
    headers: workspaceHeaders(actorId),
    body: JSON.stringify({
      entry_date: "2026-04-19",
      posting_date: "2026-04-19",
      reference: "CMP-ENTRY-001",
      description: "Compound receivable settlement",
      memo: "Dr Cash 950 / Dr Discount 50 / Cr AR 1000",
      status: "posted",
      lines: [
        {
          account_id: accountByCode.get("1210")?.id ?? accountByCode.get("1200")?.id,
          debit: 950,
          credit: 0,
          description: "Cash received",
        },
        {
          account_id: accountByCode.get("4500")?.id,
          debit: 50,
          credit: 0,
          description: "Discount allowed",
        },
        {
          account_id: accountByCode.get("1100")?.id,
          debit: 0,
          credit: 1000,
          description: "Accounts receivable cleared",
          document_id: invoiceId,
        },
      ],
    }),
  });
  await saveJson("api/40-flow4-compound-entry.json", compoundEntry);

  const trialBalance = await requestJson(`${baseUrl}/api/companies/${companyId}/reports/trial-balance`, {
    headers: workspaceHeaders(actorId),
  });
  const profitLoss = await requestJson(`${baseUrl}/api/companies/${companyId}/reports/profit-loss`, {
    headers: workspaceHeaders(actorId),
  });
  const vatDetail = await requestJson(`${baseUrl}/api/companies/${companyId}/reports/vat-detail`, {
    headers: workspaceHeaders(actorId),
  });
  const balanceSheet = await requestJson(`${baseUrl}/api/companies/${companyId}/reports/balance-sheet`, {
    headers: workspaceHeaders(actorId),
  });
  const generalLedgerAr = await requestJson(`${baseUrl}/api/companies/${companyId}/reports/general-ledger?account_code=1100&from=2026-04-19&to=2026-04-19`, {
    headers: workspaceHeaders(actorId),
  });
  const auditTrail = await requestJson(`${baseUrl}/api/companies/${companyId}/reports/audit-trail?from=2026-04-19&to=2026-04-19`, {
    headers: workspaceHeaders(actorId),
  });

  await saveJson("reports/trial-balance.json", trialBalance);
  await saveJson("reports/profit-loss.json", profitLoss);
  await saveJson("reports/vat-detail.json", vatDetail);
  await saveJson("reports/balance-sheet.json", balanceSheet);
  await saveJson("reports/general-ledger-ar.json", generalLedgerAr);
  await saveJson("reports/audit-trail.json", auditTrail);

  const allJournals = journalsAfterFlow1.data.concat((await requestJson(`${baseUrl}/api/companies/${companyId}/journals?per_page=100`, {
    headers: workspaceHeaders(actorId),
  })).data).reduce((acc, entry) => {
    acc.set(entry.id, entry);
    return acc;
  }, new Map());

  const journalList = [...allJournals.values()].map(normalizeJournal);
  await saveJson("reports/journal-register.json", journalList);

  const invoiceNumber = invoiceDoc.data.document_number;
  const flow1RevenueJournal = journalList.find((entry) => entry.source_type === "document" && entry.reference === invoiceNumber);
  const flow1InventoryJournal = journalList.find((entry) => entry.source_type === "document_inventory" && entry.reference === invoiceNumber);
  const flow1PaymentJournal = journalList.find((entry) => entry.source_type === "payment" && entry.reference === "PAY-PROOF-001");
  const flow2ExpenseJournal = journalList.find((entry) => entry.source_type === "document" && entry.reference === expenseDoc.data.document_number);
  const flow3CreditJournal = journalList.find((entry) => entry.source_type === "document" && (entry.description ?? "").includes("Credit note reversal"));
  const flow4CompoundJournal = journalList.find((entry) => entry.reference === "CMP-ENTRY-001");

  const vatRow = (vatDetail.data ?? []).find((row) => row.code === "VAT15") ?? null;
  const revenueInPnL = (profitLoss.data.lines ?? []).find((line) => line.code === "4000") ?? null;
  const expenseInPnL = (profitLoss.data.lines ?? []).find((line) => line.code === "6900") ?? null;
  const arLedgerRows = generalLedgerAr.data.filter((row) => row.document_number === invoiceNumber);

  const summary = {
    generated_at: new Date().toISOString(),
    backend_base_url: baseUrl,
    artifact_dir: artifactDir,
    company_id: companyId,
    actor_id: actorId,
    flow_1: {
      product_created: itemId,
      inventory_reduced: Number(stockAfterFlow1.data[0].quantity_on_hand) === 8,
      vat_calculated: vatRow ? Number(vatRow.output_tax_amount) >= 15 : false,
      receivable_cleared_on_payment: Number(invoiceDoc.data.balance_due) === 0,
      invoice_number: invoiceNumber,
      journals: [flow1RevenueJournal, flow1InventoryJournal, flow1PaymentJournal],
    },
    flow_2: {
      expense_document_number: expenseDoc.data.document_number,
      vat_paid_recorded: vatRow ? Number(vatRow.input_tax_amount) >= 45 : false,
      expense_journal: flow2ExpenseJournal,
    },
    flow_3: {
      credit_note_number: creditNoteResponse.data.document_number,
      reversal_journal: flow3CreditJournal,
      vat_adjustment_present: flow3CreditJournal?.lines?.some((line) => line.account_code === "2200" && Number(line.debit) > 0) ?? false,
    },
    flow_4: {
      compound_entry_reference: "CMP-ENTRY-001",
      compound_entry: flow4CompoundJournal,
    },
    reports: {
      revenue: revenueInPnL,
      expense: expenseInPnL,
      net_result: profitLoss.data.net_profit,
      vat_received: vatRow?.output_tax_amount ?? null,
      vat_paid: vatRow?.input_tax_amount ?? null,
      vat_payable: vatRow ? (Number(vatRow.output_tax_amount) - Number(vatRow.input_tax_amount)).toFixed(2) : null,
    },
    traceability: {
      invoice_to_journal_to_report: {
        invoice_number: invoiceNumber,
        journal_entry: flow1RevenueJournal?.entry_number,
        appears_in_profit_loss: Boolean(revenueInPnL),
        appears_in_vat_report: Boolean(vatRow && Number(vatRow.output_tax_amount) > 0),
        ar_ledger_rows: arLedgerRows,
      },
    },
    validation_status: {
      double_entry: journalList.every((entry) => entry.totals.balanced),
      compound_entry: Boolean(flow4CompoundJournal?.totals?.balanced),
      inventory_linkage: Boolean(flow1InventoryJournal),
      vat_logic: Boolean(vatRow),
      reports: Boolean(revenueInPnL && expenseInPnL),
    },
  };

  await saveJson("reports/summary.json", summary);

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Accounting Engine Proof</title>
  <style>
    body { font-family: Segoe UI, sans-serif; margin: 24px; color: #111827; background: #f4f6f8; }
    h1, h2 { margin: 0 0 12px; }
    .card { background: white; border-radius: 14px; padding: 20px; margin: 0 0 18px; box-shadow: 0 8px 24px rgba(15,23,42,0.08); }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 14px; }
    .ok { color: #166534; font-weight: 700; }
    pre { white-space: pre-wrap; font-size: 12px; background: #f8fafc; padding: 12px; border-radius: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Accounting Engine Proof</h1>
    <p>Company ID: ${companyId}</p>
    <p>Invoice traceability: ${invoiceNumber} -> ${flow1RevenueJournal?.entry_number ?? "missing"} -> P&L/VAT</p>
  </div>
  <div class="card">
    <h2>Validation Status</h2>
    <table>
      <tr><th>Validation</th><th>Status</th></tr>
      ${Object.entries(summary.validation_status).map(([key, value]) => `<tr><td>${key}</td><td class="${value ? "ok" : ""}">${value ? "PASS" : "FAIL"}</td></tr>`).join("")}
    </table>
  </div>
  <div class="card">
    <h2>Reports</h2>
    <pre>${JSON.stringify(summary.reports, null, 2)}</pre>
  </div>
  <div class="card">
    <h2>Flow Journals</h2>
    <pre>${JSON.stringify({ flow1RevenueJournal, flow1InventoryJournal, flow1PaymentJournal, flow2ExpenseJournal, flow3CreditJournal, flow4CompoundJournal }, null, 2)}</pre>
  </div>
</body>
</html>`;

  const htmlPath = path.join(proofDir, "accounting-proof-summary.html");
  await fs.writeFile(htmlPath, html);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });
  await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`);
  await page.screenshot({ path: path.join(proofDir, "01-accounting-proof-summary.png"), fullPage: true });
  await page.locator(".card").nth(1).screenshot({ path: path.join(proofDir, "02-validation-status.png") });
  await page.locator(".card").nth(2).screenshot({ path: path.join(proofDir, "03-report-summary.png") });
  await browser.close();

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});