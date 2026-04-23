import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3006";
const outputDir = process.env.OUTPUT_DIR
  ? path.resolve(process.env.OUTPUT_DIR)
  : path.join(process.cwd(), "artifacts", "final_product_polish_20260419_01", "proof");

const documents = [
  { type: "tax_invoice", id: 2153, fileStem: "tax-invoice" },
  { type: "credit_note", id: 2154, fileStem: "credit-note" },
  { type: "debit_note", id: 2155, fileStem: "debit-note" },
  { type: "proforma_invoice", id: 2107, fileStem: "proforma" },
  { type: "quotation", id: 2106, fileStem: "quotation" },
  { type: "delivery_note", id: 2151, fileStem: "delivery-note" },
  { type: "purchase_order", id: 2103, fileStem: "purchase-order" },
];

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
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

function shell(content, title) {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        body { margin: 0; background: #edf3ee; font-family: "Segoe UI", Arial, sans-serif; }
        .stage { min-height: 100vh; padding: 28px; display: grid; place-items: center; }
        .canvas { width: min(980px, calc(100vw - 56px)); }
      </style>
    </head>
    <body><div class="stage"><div class="canvas">${content}</div></div></body>
  </html>`;
}

async function screenshotHtml(page, html, htmlPath, screenshotPath) {
  await fs.writeFile(htmlPath, html, "utf8");
  await page.goto(`file:///${htmlPath.replaceAll("\\", "/")}`, { waitUntil: "load" });
  await page.locator("article, [data-doc-root='true'], body").first().screenshot({ path: screenshotPath });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1540, height: 1200 } });
const page = await context.newPage();

try {
  const screenshotsDir = path.join(outputDir, "screenshots");
  const pdfDir = path.join(outputDir, "pdfs");
  const htmlDir = path.join(outputDir, "html");
  await Promise.all([ensureDir(outputDir), ensureDir(screenshotsDir), ensureDir(pdfDir), ensureDir(htmlDir)]);

  const outputs = [];

  for (const document of documents) {
    const previewResponse = await fetchJson(`${baseUrl}/api/workspace/documents/${document.id}/preview`);
    const previewHtml = previewResponse?.data?.html ?? previewResponse?.html ?? "";
    if (!previewHtml) {
      throw new Error(`Preview HTML was empty for ${document.type} (${document.id}).`);
    }

    const htmlPath = path.join(htmlDir, `${document.fileStem}.html`);
    const screenshotPath = path.join(screenshotsDir, `${document.fileStem}.png`);
    const pdfPath = path.join(pdfDir, `${document.fileStem}.pdf`);

    await screenshotHtml(page, shell(previewHtml, document.type), htmlPath, screenshotPath);
    const pdfBuffer = await fetchBuffer(`${baseUrl}/api/workspace/documents/${document.id}/export-pdf`);
    await fs.writeFile(pdfPath, pdfBuffer);

    outputs.push({
      type: document.type,
      documentId: document.id,
      htmlPath,
      screenshotPath,
      pdfPath,
      pdfSizeBytes: pdfBuffer.byteLength,
    });
  }

  await page.goto(`${baseUrl}/workspace/user/document-templates`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-inspector-split-view="true"]', { timeout: 20000 });
  const studioShot = path.join(screenshotsDir, "template-studio.png");
  await page.locator('[data-inspector-split-view="true"]').screenshot({ path: studioShot });

  await page.goto(`${baseUrl}/workspace/user/invoices`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-inspector-split-view="true"]', { timeout: 20000 });
  const registerShot = path.join(screenshotsDir, "document-register.png");
  await page.locator('[data-inspector-split-view="true"]').screenshot({ path: registerShot });

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    outputDir,
    documents: outputs,
    studioShot,
    registerShot,
  };

  await fs.writeFile(path.join(outputDir, "final-product-polish-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
  await browser.close();
}
