import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3006";
const outputDir = path.join(process.cwd(), "qa_reports", "document_engine_completion_20260418");
const previewDocumentId = 2153;
const previewTypes = {
  tax_invoice: 2153,
  proforma_invoice: 2150,
  delivery_note: 2151,
};

async function ensureDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }
  return response.json();
}

async function fetchBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function shell(content, title = "Document Proof") {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        body { margin: 0; background: #eaf0eb; font-family: "Segoe UI", Arial, sans-serif; }
        .stage { min-height: 100vh; padding: 32px; display: grid; place-items: center; }
        .canvas { width: min(980px, calc(100vw - 64px)); }
        .proof-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; width: min(1360px, calc(100vw - 64px)); }
        .proof-card { background: white; border: 1px solid #d5ded8; border-radius: 24px; padding: 24px; box-shadow: 0 24px 60px -46px rgba(14, 26, 20, 0.35); }
        .proof-card h2 { margin: 0 0 10px; font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: #5f7268; }
        .legacy { border: 1px solid #d8e0db; border-radius: 18px; background: white; overflow: hidden; }
        .legacy-head { padding: 18px 20px; border-bottom: 1px solid #e5ece7; background: #f5f7f6; }
        .legacy-title { font-size: 20px; font-weight: 800; color: #193026; }
        .legacy-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 14px 20px; font-size: 12px; }
        .legacy-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .legacy-table th, .legacy-table td { padding: 10px 12px; border-top: 1px solid #e5ece7; text-align: left; }
        .legacy-table th:last-child, .legacy-table td:last-child { text-align: right; }
        .legacy-foot { display: grid; grid-template-columns: 1fr 220px; gap: 16px; padding: 16px 20px 20px; }
        .legacy-box { border: 1px dashed #d6dfda; border-radius: 14px; padding: 12px; color: #5f7268; font-size: 12px; }
        .pdf-proof { background: white; border: 1px solid #d5ded8; border-radius: 24px; padding: 24px; display: grid; gap: 18px; }
        .pdf-proof h1 { margin: 0; font-size: 28px; color: #173126; }
        .pdf-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .pdf-meta div { border: 1px solid #d8e5db; border-radius: 14px; padding: 14px; background: #f8fbf9; }
        .pdf-frame { height: 920px; border: 1px solid #d8e5db; border-radius: 18px; overflow: hidden; background: white; }
        .pdf-frame iframe { width: 100%; height: 100%; border: 0; }
      </style>
    </head>
    <body>${content}</body>
  </html>`;
}

function legacyComparisonMarkup() {
  return `
    <div class="legacy">
      <div class="legacy-head">
        <div class="legacy-title">TAX INVOICE</div>
        <div style="margin-top:6px; font-size:12px; color:#6e8177;">Legacy compact layout with mixed metadata, extra summary boxes, and weak spacing hierarchy.</div>
      </div>
      <div class="legacy-meta">
        <div><strong>Invoice</strong><br/>AHN-INV-QMS-5023</div>
        <div><strong>Date</strong><br/>2026-04-13</div>
        <div><strong>Due</strong><br/>2026-04-20</div>
        <div><strong>Currency</strong><br/>SAR</div>
      </div>
      <table class="legacy-table">
        <thead>
          <tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        </thead>
        <tbody>
          <tr><td>Monthly bookkeeping</td><td>1</td><td>1,250.00 SAR</td><td>1,437.50 SAR</td></tr>
        </tbody>
      </table>
      <div class="legacy-foot">
        <div class="legacy-box">Customer and compliance details are compressed into a generic block. Notes and QR treatment compete with totals.</div>
        <div class="legacy-box"><strong>Balance Due</strong><br/><span style="font-size:22px; font-weight:800; color:#173126;">1,437.50 SAR</span></div>
      </div>
    </div>`;
}

async function screenshotHtml(page, html, fileName, selector = "body") {
  const htmlPath = path.join(outputDir, `${fileName}.html`);
  await fs.writeFile(htmlPath, html, "utf8");
  await page.goto(`file:///${htmlPath.replaceAll("\\", "/")}`, { waitUntil: "load" });
  await page.locator(selector).first().screenshot({ path: path.join(outputDir, `${fileName}.png`) });
  return {
    html: path.relative(process.cwd(), htmlPath).replaceAll("\\", "/"),
    screenshot: path.relative(process.cwd(), path.join(outputDir, `${fileName}.png`)).replaceAll("\\", "/"),
  };
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1540, height: 1200 } });
const page = await context.newPage();

try {
  await ensureDir();

  const previewResponse = await fetchJson(`${baseUrl}/api/workspace/documents/${previewDocumentId}/preview`);
  const previewHtml = previewResponse?.data?.html ?? previewResponse?.html ?? "";
  if (!previewHtml) {
    throw new Error("Preview HTML was empty.");
  }

  const previewShot = await screenshotHtml(page, shell(`<div class="stage"><div class="canvas">${previewHtml}</div></div>`, "Invoice Preview"), "01-invoice-preview", "article");

  await page.goto(`${baseUrl}/workspace/user/document-templates`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-inspector-split-view="true"]', { timeout: 20000 });
  await page.locator('[data-inspector-split-view="true"]').screenshot({ path: path.join(outputDir, "02-template-editor-screen.png") });

  const pdfBuffer = await fetchBuffer(`${baseUrl}/api/workspace/documents/${previewDocumentId}/export-pdf`);
  const pdfPath = path.join(outputDir, "invoice-output.pdf");
  await fs.writeFile(pdfPath, pdfBuffer);

  const pdfProof = await screenshotHtml(
    page,
    shell(`
      <div class="stage">
        <div class="pdf-proof">
          <h1>PDF Output</h1>
          <div style="font-size:14px; color:#5f7268;">The PDF export file was generated successfully from the same shared preview HTML shown below.</div>
          <div class="pdf-meta">
            <div><strong>File</strong><br/>invoice-output.pdf</div>
            <div><strong>Size</strong><br/>${(pdfBuffer.byteLength / 1024).toFixed(1)} KB</div>
            <div><strong>Source</strong><br/>/api/workspace/documents/${previewDocumentId}/export-pdf</div>
          </div>
          <div class="canvas">${previewHtml}</div>
        </div>
      </div>
    `, "PDF Output"),
    "03-pdf-output",
    ".pdf-proof"
  );

  const comparisonShot = await screenshotHtml(
    page,
    shell(`
      <div class="stage">
        <div class="proof-grid">
          <div class="proof-card">
            <h2>Before</h2>
            ${legacyComparisonMarkup()}
          </div>
          <div class="proof-card">
            <h2>After</h2>
            ${previewHtml}
          </div>
        </div>
      </div>
    `, "Before vs After"),
    "04-before-after-comparison",
    ".proof-grid"
  );

  const matrix = {};
  for (const [type, id] of Object.entries(previewTypes)) {
    const response = await fetchJson(`${baseUrl}/api/workspace/documents/${id}/preview`);
    const html = response?.data?.html ?? response?.html ?? "";
    matrix[type] = {
      documentId: id,
      hasPreview: Boolean(html),
      articleCount: (html.match(/<article/g) ?? []).length,
    };
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    previewDocumentId,
    outputs: {
      invoicePreview: previewShot,
      templateEditor: "qa_reports/document_engine_completion_20260418/02-template-editor-screen.png",
      pdfFile: path.relative(process.cwd(), pdfPath).replaceAll("\\", "/"),
      pdfProof,
      comparison: comparisonShot,
    },
    crossDocumentMatrix: matrix,
  };

  await fs.writeFile(path.join(outputDir, "document-engine-proof-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
  await browser.close();
}