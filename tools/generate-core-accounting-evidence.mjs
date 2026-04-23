import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const rootDir = 'c:/hisab';
const reportDir = path.join(rootDir, 'qa_reports', 'core_accounting_engine_20260417');
const evidencePath = path.join(reportDir, 'execution-evidence.json');

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function table(headers, rows) {
  return `
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${esc(header)}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
  `;
}

function pageTemplate(title, subtitle, body) {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${esc(title)}</title>
      <style>
        :root {
          color-scheme: light;
          --bg: #f3efe7;
          --panel: #fffdf8;
          --ink: #102027;
          --muted: #5c6b73;
          --line: #d7cec1;
          --accent: #0b6e4f;
          --accent-soft: #dff3ea;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: Georgia, 'Times New Roman', serif;
          color: var(--ink);
          background: radial-gradient(circle at top left, #f9f6ef, var(--bg) 55%);
        }
        .page {
          width: 1440px;
          min-height: 900px;
          padding: 40px;
        }
        .card {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 28px 32px;
          box-shadow: 0 18px 48px rgba(16, 32, 39, 0.08);
        }
        h1 {
          margin: 0 0 10px;
          font-size: 38px;
          line-height: 1.05;
          letter-spacing: -0.03em;
        }
        p.lead {
          margin: 0 0 28px;
          color: var(--muted);
          font-size: 18px;
        }
        .pill-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .pill {
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 14px;
          background: var(--accent-soft);
          color: var(--accent);
          border: 1px solid rgba(11, 110, 79, 0.18);
        }
        .section + .section { margin-top: 22px; }
        .section h2 {
          margin: 0 0 14px;
          font-size: 18px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        th, td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid var(--line);
          vertical-align: top;
        }
        th {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
        }
        .totals {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 20px;
        }
        .total-box {
          padding: 16px 18px;
          border-radius: 16px;
          border: 1px solid var(--line);
          background: #fff;
        }
        .total-box strong {
          display: block;
          font-size: 28px;
          margin-top: 6px;
        }
        code {
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="card">
          <h1>${esc(title)}</h1>
          <p class="lead">${esc(subtitle)}</p>
          ${body}
        </div>
      </div>
    </body>
  </html>`;
}

async function writeArtifacts() {
  const evidence = JSON.parse(await fs.readFile(evidencePath, 'utf8'));

  const journalRows = Object.entries(evidence.journals).flatMap(([label, journal]) => (
    journal.lines.map((line) => [
      label,
      journal.entry_number,
      journal.source_type,
      line.account_code,
      line.account_name,
      line.debit.toFixed(2),
      line.credit.toFixed(2),
      line.description,
    ])
  ));

  const journalHtml = pageTemplate(
    'Journal Entries Proof',
    `Invoice ${evidence.invoice.document_number} with revenue, VAT, inventory issue, and payment clearing journals.`,
    `
      <div class="pill-row">
        <div class="pill">Invoice ${esc(evidence.invoice.document_number)}</div>
        <div class="pill">Status ${esc(evidence.invoice.status)}</div>
        <div class="pill">API ${esc(evidence.invoice.api_link)}</div>
      </div>
      <div class="section">
        <h2>Posted Lines</h2>
        ${table(['Journal', 'Entry No', 'Source', 'Account', 'Name', 'Debit', 'Credit', 'Description'], journalRows)}
      </div>
    `,
  );

  const ledgerHtml = pageTemplate(
    'Ledger View Proof',
    'Accounts receivable ledger filtered by date, showing invoice debit and payment credit returning the balance to zero.',
    `
      <div class="pill-row">
        <div class="pill">Account 1100 Accounts Receivable</div>
        <div class="pill">From 2026-04-17</div>
        <div class="pill">To 2026-04-18</div>
      </div>
      <div class="section">
        <h2>Ledger Lines</h2>
        ${table(['Entry No', 'Date', 'Document', 'Contact', 'Debit', 'Credit', 'Running Balance', 'Description'], evidence.ledger.map((row) => [
          row.entry_number,
          row.entry_date,
          row.document_number,
          row.contact_name,
          row.debit,
          row.credit,
          row.running_balance,
          row.description,
        ]))}
      </div>
    `,
  );

  const trialBalanceHtml = pageTemplate(
    'Trial Balance Proof',
    'System-wide trial balance after inventory receipt, invoice posting, inventory issue, and payment settlement.',
    `
      <div class="pill-row">
        <div class="pill">Balanced ${esc(evidence.trial_balance.balanced)}</div>
        <div class="pill">Invoice ${esc(evidence.invoice.document_number)}</div>
      </div>
      <div class="section">
        <h2>Trial Balance Rows</h2>
        ${table(['Code', 'Account', 'Type', 'Debit Total', 'Credit Total', 'Balance'], evidence.trial_balance.rows.map((row) => [
          row.code,
          row.name,
          row.type,
          Number(row.debit_total).toFixed(2),
          Number(row.credit_total).toFixed(2),
          Number(row.balance).toFixed(2),
        ]))}
      </div>
      <div class="totals">
        <div class="total-box">Total Debit<strong>${esc(evidence.trial_balance.total_debit)}</strong></div>
        <div class="total-box">Total Credit<strong>${esc(evidence.trial_balance.total_credit)}</strong></div>
        <div class="total-box">Invoice Link<strong><code>${esc(evidence.invoice.api_link)}</code></strong></div>
      </div>
    `,
  );

  const artifacts = [
    { baseName: 'journal-entries-proof', html: journalHtml },
    { baseName: 'ledger-view-proof', html: ledgerHtml },
    { baseName: 'trial-balance-proof', html: trialBalanceHtml },
  ];

  for (const artifact of artifacts) {
    await fs.writeFile(path.join(reportDir, `${artifact.baseName}.html`), artifact.html, 'utf8');
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

  for (const artifact of artifacts) {
    const htmlPath = path.join(reportDir, `${artifact.baseName}.html`);
    await page.goto(`file:///${htmlPath.replaceAll('\\', '/')}`);
    await page.screenshot({ path: path.join(reportDir, `${artifact.baseName}.png`), fullPage: true });
  }

  await browser.close();
}

writeArtifacts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});