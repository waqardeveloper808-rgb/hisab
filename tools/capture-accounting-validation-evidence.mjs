import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const repoRoot = process.cwd();
const outputDir = path.join(repoRoot, "qa_reports", "core_validation_20260417");
const jsonPath = path.join(outputDir, "real-accounting-validation.json");
const htmlPath = path.join(outputDir, "real-accounting-validation.html");

if (!fs.existsSync(jsonPath)) {
  throw new Error(`Validation JSON not found at ${jsonPath}`);
}

const evidence = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const renderRows = (rows) => rows.map((row) => `
  <tr>
    <td>${escapeHtml(row.account_code)}</td>
    <td>${escapeHtml(row.account_name)}</td>
    <td class="num">${Number(row.debit ?? 0).toFixed(2)}</td>
    <td class="num">${Number(row.credit ?? 0).toFixed(2)}</td>
  </tr>`).join("");

const renderList = (items, cls = "") => items.map((item) => `<li class="${cls}">${escapeHtml(item)}</li>`).join("");

const isLegacyWorkflowShape = Boolean(evidence.workflow?.invoice_payment_flow);
const invoiceFlow = isLegacyWorkflowShape ? evidence.workflow.invoice_payment_flow : null;
const inventoryFlow = isLegacyWorkflowShape ? evidence.workflow.inventory_link_flow : null;
const journalIntelligence = isLegacyWorkflowShape ? evidence.workflow.journal_intelligence : evidence.scenarios?.journal_intelligence ?? null;
const scenarioA = evidence.scenarios?.scenario_a_proforma_first ?? null;
const scenarioB = evidence.scenarios?.scenario_b_delivery_first ?? null;
const scenarioC = evidence.scenarios?.scenario_c_tax_invoice_unpaid ?? null;
const scenarioD = evidence.scenarios?.scenario_d_payment_after_tax_invoice ?? null;
const scenarioE = evidence.scenarios?.scenario_e_partial_prepayment ?? null;

function renderScenarioRows() {
  if (isLegacyWorkflowShape) {
    return `
      <li>Create product: item ${escapeHtml(String(invoiceFlow.steps.product_created.item_id))}</li>
      <li>Add inventory: ${invoiceFlow.steps.inventory_added.quantity_on_hand.toFixed(2)} units at ${invoiceFlow.steps.inventory_added.unit_cost.toFixed(2)}</li>
      <li>Create invoice: ${escapeHtml(invoiceFlow.steps.invoice_created.document_number)} total ${invoiceFlow.steps.invoice_created.grand_total.toFixed(2)}</li>
      <li>Record payment: ${invoiceFlow.steps.payment_recorded.amount.toFixed(2)}</li>
      <li>Inventory after invoice/payment: ${invoiceFlow.inventory.quantity_after_invoice_and_payment.toFixed(2)}</li>
    `;
  }

  return `
    <li>Proforma-first flow: ${escapeHtml(String(scenarioA?.artifacts?.proforma_number ?? "-"))} with commercial-only payment tracking preserved.</li>
    <li>Delivery-first flow: ${escapeHtml(String(scenarioB?.artifacts?.delivery_note_number ?? "-"))} reduced stock and posted COGS only.</li>
    <li>Tax invoice flow: ${escapeHtml(String(scenarioC?.artifacts?.tax_invoice_number ?? "-"))} posted receivable, revenue, and VAT.</li>
    <li>Payment clearing: document status moved to ${escapeHtml(String(scenarioD?.artifacts?.document_status ?? "-"))} after cash/AR clearing.</li>
    <li>Advance flow: paid total ${escapeHtml(String(scenarioE?.artifacts?.paid_total ?? "-"))}, balance due ${escapeHtml(String(scenarioE?.artifacts?.balance_due ?? "-"))}.</li>
  `;
}

function renderPassFailRows() {
  if (isLegacyWorkflowShape) {
    return `
      <li>Double entry correct: ${invoiceFlow.checks.double_entry_correct}</li>
      <li>VAT correct: ${invoiceFlow.checks.vat_correct}</li>
      <li>Invoice auto reduces inventory: ${invoiceFlow.checks.invoice_auto_reduces_inventory}</li>
      <li>Invoice auto generates COGS: ${invoiceFlow.checks.invoice_auto_generates_cogs}</li>
      <li>Integrated sale workflow pass: ${invoiceFlow.checks.integrated_sale_workflow_pass}</li>
    `;
  }

  return Object.entries(evidence.self_check ?? {}).map(([label, value]) => (
    `<li>${escapeHtml(label.replaceAll("_", " "))}: ${escapeHtml(String(value))}</li>`
  )).join("");
}

function renderJournalTables() {
  if (isLegacyWorkflowShape) {
    return `
      <div class="grid two">
        <div>
          <h3>Invoice Journal ${escapeHtml(invoiceFlow.journal_entries.invoice.entry_number)}</h3>
          <table>
            <thead><tr><th>Code</th><th>Account</th><th>Debit</th><th>Credit</th></tr></thead>
            <tbody>${renderRows(invoiceFlow.journal_entries.invoice.lines)}</tbody>
          </table>
        </div>
        <div>
          <h3>Payment Journal ${escapeHtml(invoiceFlow.journal_entries.payment.entry_number)}</h3>
          <table>
            <thead><tr><th>Code</th><th>Account</th><th>Debit</th><th>Credit</th></tr></thead>
            <tbody>${renderRows(invoiceFlow.journal_entries.payment.lines)}</tbody>
          </table>
        </div>
      </div>
      <div class="grid two" style="margin-top: 14px;">
        <div class="callout"><h3>Inventory Sale Journal ${escapeHtml(inventoryFlow.journal_entry.entry_number)}</h3><table><thead><tr><th>Code</th><th>Account</th><th>Debit</th><th>Credit</th></tr></thead><tbody>${renderRows(inventoryFlow.journal_entry.lines)}</tbody></table></div>
        <div class="callout"><h3>Journal Intelligence</h3><p class="subtle">${escapeHtml(journalIntelligence.ui_prompt_rule)}</p><pre>${escapeHtml(JSON.stringify(journalIntelligence.stored_metadata, null, 2))}</pre></div>
      </div>
    `;
  }

  return `
    <div class="grid two">
      <div>
        <h3>Delivery COGS Journal</h3>
        <table>
          <thead><tr><th>Code</th><th>Debit</th><th>Credit</th></tr></thead>
          <tbody>${(scenarioB?.artifacts?.journal_lines ?? []).map((row) => `
            <tr>
              <td>${escapeHtml(row.account_code)}</td>
              <td class="num">${Number(row.debit ?? 0).toFixed(2)}</td>
              <td class="num">${Number(row.credit ?? 0).toFixed(2)}</td>
            </tr>`).join("")}</tbody>
        </table>
      </div>
      <div>
        <h3>Payment Clearing Journal</h3>
        <table>
          <thead><tr><th>Code</th><th>Debit</th><th>Credit</th></tr></thead>
          <tbody>${(scenarioD?.artifacts?.payment_journal ?? []).map((row) => `
            <tr>
              <td>${escapeHtml(row.account_code)}</td>
              <td class="num">${Number(row.debit ?? 0).toFixed(2)}</td>
              <td class="num">${Number(row.credit ?? 0).toFixed(2)}</td>
            </tr>`).join("")}</tbody>
        </table>
      </div>
    </div>
    <div class="grid two" style="margin-top: 14px;">
      <div class="callout"><h3>Journal Intelligence</h3><pre>${escapeHtml(JSON.stringify(journalIntelligence?.artifacts?.metadata ?? {}, null, 2))}</pre></div>
      <div class="callout"><h3>Register Integrity</h3><ul>
        <li>Proforma references traceable: ${escapeHtml(String(scenarioA?.checks?.linked_references_traceable ?? false))}</li>
        <li>Delivery references traceable: ${escapeHtml(String(scenarioB?.checks?.linked_references_traceable ?? false))}</li>
        <li>Payment status visible: ${escapeHtml(String(scenarioD?.checks?.payment_status_updated_in_register ?? false))}</li>
      </ul></div>
    </div>
  `;
}

function renderVatInventory() {
  if (isLegacyWorkflowShape) {
    return `
      <div class="grid two">
        <div class="callout">
          <h3>VAT Summary</h3>
          <pre>${escapeHtml(JSON.stringify(invoiceFlow.vat.summary_row, null, 2))}</pre>
        </div>
        <div class="callout">
          <h3>Inventory Values</h3>
          <ul>
            <li>After receipt: ${invoiceFlow.inventory.quantity_after_receipt.toFixed(2)}</li>
            <li>After invoice + payment: ${invoiceFlow.inventory.quantity_after_invoice_and_payment.toFixed(2)}</li>
            <li>After inventory sale flow: ${inventoryFlow.stock_after_sale.toFixed(2)}</li>
            <li>References stored on inventory sale: ${inventoryFlow.checks.references_stored}</li>
          </ul>
        </div>
      </div>
    `;
  }

  return `
    <div class="grid two">
      <div class="callout">
        <h3>VAT and Invoice Status</h3>
        <ul>
          <li>Tax invoice number: ${escapeHtml(String(scenarioC?.artifacts?.tax_invoice_number ?? "-"))}</li>
          <li>Tax invoice status: ${escapeHtml(String(scenarioC?.artifacts?.status ?? "-"))}</li>
          <li>Balance due before payment: ${escapeHtml(String(scenarioC?.artifacts?.balance_due ?? "-"))}</li>
          <li>Advance flow outstanding balance: ${escapeHtml(String(scenarioE?.artifacts?.balance_due ?? "-"))}</li>
        </ul>
      </div>
      <div class="callout">
        <h3>Inventory Values</h3>
        <ul>
          <li>Stock after delivery: ${escapeHtml(String(scenarioB?.artifacts?.stock_after_delivery?.quantity_on_hand ?? "-"))}</li>
          <li>Inventory account: ${escapeHtml(String(scenarioB?.artifacts?.stock_after_delivery?.inventory_account_code ?? "-"))}</li>
          <li>Linked document stored: ${escapeHtml(String(scenarioB?.artifacts?.stock_after_delivery?.document_links?.[0]?.documentNumber ?? "-"))}</li>
          <li>References stored on journal intelligence: ${escapeHtml(String(journalIntelligence?.checks?.references_stored ?? false))}</li>
        </ul>
      </div>
    </div>
  `;
}

function renderReportOutput() {
  if (isLegacyWorkflowShape) {
    return `
      <div class="grid two">
        <div class="callout">
          <h3>P&amp;L Snapshot</h3>
          <pre>${escapeHtml(JSON.stringify(invoiceFlow.reports.profit_loss, null, 2))}</pre>
        </div>
        <div class="callout">
          <h3>Summary</h3>
          <p><strong>Completed</strong></p>
          <ul>${renderList(evidence.summary.completed)}</ul>
          <p style="margin-top:12px;"><strong>Failed</strong></p>
          <ul>${renderList(evidence.summary.failed)}</ul>
        </div>
      </div>
    `;
  }

  return `
    <div class="grid two">
      <div class="callout">
        <h3>Summary</h3>
        <p><strong>Completed</strong></p>
        <ul>${renderList(evidence.summary.completed)}</ul>
        <p style="margin-top:12px;"><strong>Failed</strong></p>
        <ul>${renderList(evidence.summary.failed)}</ul>
      </div>
      <div class="callout">
        <h3>Scenario Status</h3>
        <ul>
          ${Object.entries(evidence.scenarios ?? {}).map(([label, scenario]) => `<li>${escapeHtml(label.replaceAll("_", " "))}: ${escapeHtml(String(scenario.pass ?? false))}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;
}

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Core Accounting Validation</title>
  <style>
    :root {
      --bg: #f4efe7;
      --paper: #fffdf9;
      --ink: #1f2937;
      --muted: #6b7280;
      --line: #d6c7b2;
      --pass: #1f7a4f;
      --fail: #b42318;
      --accent: #8a5a2b;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      background: radial-gradient(circle at top, #fbf7f1 0%, var(--bg) 68%);
      color: var(--ink);
    }
    main {
      width: min(1180px, calc(100vw - 32px));
      margin: 24px auto 40px;
      display: grid;
      gap: 18px;
    }
    section {
      background: color-mix(in srgb, var(--paper) 92%, white 8%);
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 20px 22px;
      box-shadow: 0 18px 50px rgba(79, 52, 27, 0.08);
    }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 34px; }
    h2 { font-size: 22px; margin-bottom: 10px; }
    h3 { font-size: 16px; margin-bottom: 10px; }
    p.subtle { color: var(--muted); margin-top: 6px; }
    .grid { display: grid; gap: 14px; }
    .grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .hero {
      background: linear-gradient(135deg, rgba(138,90,43,0.12), rgba(255,255,255,0.9));
    }
    .badge {
      display: inline-block;
      border-radius: 999px;
      padding: 7px 12px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .pass { background: rgba(31,122,79,0.12); color: var(--pass); }
    .fail { background: rgba(180,35,24,0.12); color: var(--fail); }
    .metric {
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 14px;
      background: rgba(255,255,255,0.8);
    }
    .metric .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
    .metric .value { font-size: 26px; font-weight: 700; margin-top: 6px; }
    .split { display: grid; gap: 16px; grid-template-columns: 1.1fr 0.9fr; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { border-bottom: 1px solid var(--line); padding: 8px 6px; text-align: left; }
    th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    ul { margin: 10px 0 0; padding-left: 18px; }
    li { margin: 6px 0; }
    .status-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
    .callout { padding: 14px 16px; border-radius: 16px; border: 1px solid var(--line); background: rgba(255,255,255,0.82); }
    pre {
      margin: 0;
      white-space: pre-wrap;
      font: 12px/1.5 Consolas, monospace;
      background: #faf6ef;
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 12px;
      overflow: auto;
    }
    @media (max-width: 900px) {
      .grid.two, .split { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <section class="hero" id="overview">
      <div class="status-row">
        <span class="badge ${evidence.summary.failed.length === 0 ? "pass" : "fail"}">${escapeHtml(evidence.verdict)}</span>
        ${Object.entries(evidence.self_check ?? {}).slice(0, 2).map(([label, value]) => `<span class="badge ${value ? "pass" : "fail"}">${escapeHtml(label.replaceAll("_", " "))}: ${escapeHtml(String(value))}</span>`).join("")}
      </div>
      <h1>Core Accounting Validation</h1>
      <p class="subtle">Generated ${escapeHtml(evidence.generated_at)}</p>
      <div class="grid two" style="margin-top: 16px;">
        <div class="metric"><div class="label">Completed Checks</div><div class="value">${evidence.summary.completed.length}</div></div>
        <div class="metric"><div class="label">Failed Checks</div><div class="value">${evidence.summary.failed.length}</div></div>
      </div>
    </section>

    <section id="workflow">
      <h2>Workflow Validation</h2>
      <div class="split">
        <div class="callout">
          <h3>Mandatory Flow Result</h3>
          <ul>${renderScenarioRows()}</ul>
        </div>
        <div class="callout">
          <h3>Pass / Fail Flags</h3>
          <ul>${renderPassFailRows()}</ul>
        </div>
      </div>
    </section>

    <section id="journals">
      <h2>Journal Entry Evidence</h2>
      ${renderJournalTables()}
    </section>

    <section id="vat-inventory">
      <h2>VAT and Inventory Evidence</h2>
      ${renderVatInventory()}
    </section>

    <section id="reports">
      <h2>Report Output</h2>
      ${renderReportOutput()}
    </section>

    ${evidence.summary.reasons ? `<section id="reasons"><h2>Reasons</h2><ul>${renderList(evidence.summary.reasons)}</ul></section>` : ""}
  </main>
</body>
</html>`;

fs.writeFileSync(htmlPath, html);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 2200 }, deviceScaleFactor: 1 });
await page.goto(`file:///${htmlPath.replaceAll("\\", "/")}`);
await page.screenshot({ path: path.join(outputDir, "accounting-validation-overview.png"), fullPage: false });
await page.locator("#workflow").screenshot({ path: path.join(outputDir, "accounting-validation-workflow.png") });
await page.locator("#journals").screenshot({ path: path.join(outputDir, "accounting-validation-journals.png") });
await page.locator("#vat-inventory").screenshot({ path: path.join(outputDir, "accounting-validation-vat-inventory.png") });
await page.locator("#reports").screenshot({ path: path.join(outputDir, "accounting-validation-reports.png") });
await browser.close();

console.log(JSON.stringify({
  html: path.relative(repoRoot, htmlPath),
  screenshots: [
    path.relative(repoRoot, path.join(outputDir, "accounting-validation-overview.png")),
    path.relative(repoRoot, path.join(outputDir, "accounting-validation-workflow.png")),
    path.relative(repoRoot, path.join(outputDir, "accounting-validation-journals.png")),
    path.relative(repoRoot, path.join(outputDir, "accounting-validation-vat-inventory.png")),
    path.relative(repoRoot, path.join(outputDir, "accounting-validation-reports.png")),
  ],
}, null, 2));