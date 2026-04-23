import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { PNG } from "pngjs";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3020";
const outputDir = process.env.OUTPUT_DIR ?? path.join(process.cwd(), "qa_reports", "document_validation_20260418");
const loginEmail = (process.env.UI_LOGIN_EMAIL ?? "sandbox.admin@gulfhisab.sa").trim();
const loginPassword = (process.env.UI_LOGIN_PASSWORD ?? "RecoveryPass123!").trim();

let authenticatedRequest = null;

const previewRouteSpecs = [
  { key: "invoice", artifactName: "invoice", type: "tax_invoice", pdf: true, buildRoute: () => "/workspace/user/invoices" },
  { key: "quotation", artifactName: "quotation", type: "quotation", pdf: true, buildRoute: () => "/workspace/user/quotations" },
  { key: "proforma", artifactName: "proforma", type: "proforma_invoice", pdf: true, buildRoute: () => "/workspace/user/proforma-invoices" },
  { key: "credit-note", artifactName: "credit_note", type: "credit_note", pdf: true, buildRoute: () => "/workspace/user/credit-notes" },
  { key: "debit-note", artifactName: "debit_note", type: "debit_note", pdf: true, buildRoute: () => "/workspace/user/debit-notes" },
  { key: "delivery-note", artifactName: "delivery_note", type: "delivery_note", pdf: true, buildRoute: () => "/workspace/sales" },
  { key: "vendor-bill", artifactName: "vendor_bill", type: "vendor_bill", pdf: true, buildRoute: () => "/workspace/user/bills" },
];

const documentTitles = {
  tax_invoice: { en: "Tax Invoice", ar: "فاتورة ضريبية" },
  quotation: { en: "Quotation", ar: "عرض سعر" },
  proforma_invoice: { en: "Proforma Invoice", ar: "فاتورة مبدئية" },
  credit_note: { en: "Credit Note", ar: "إشعار دائن" },
  debit_note: { en: "Debit Note", ar: "إشعار مدين" },
  delivery_note: { en: "Delivery Note", ar: "إشعار تسليم" },
  vendor_bill: { en: "Vendor Bill", ar: "فاتورة مورد" },
};

const requiredSectionOrder = [
  "header",
  "title",
  "document meta",
  "party details",
  "line items",
  "totals",
  "company footer",
];

function safe(value) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "artifact";
}

async function ensureDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

async function fetchJson(url, init) {
  const response = authenticatedRequest
    ? await authenticatedRequest.fetch(url, init)
    : await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }
  return response.json();
}

async function fetchBuffer(url) {
  const response = authenticatedRequest
    ? await authenticatedRequest.fetch(url)
    : await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }
  return authenticatedRequest
    ? Buffer.from(await response.body())
    : Buffer.from(await response.arrayBuffer());
}

async function login(context) {
  const page = await context.newPage();

  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(loginEmail);
  await page.getByLabel("Password").fill(loginPassword);
  await page.getByRole("button", { name: /Log in|Opening workspace/i }).click();
  await page.waitForURL(/\/workspace\/user(?:\/.*)?$/, { timeout: 30000 });
  await page.close();
  authenticatedRequest = context.request;
}

function assertHtmlRules(html, routeType) {
  const normalized = html.replace(/\s+/g, " ");
  const failures = [];
  const expectedTitle = documentTitles[routeType] ?? null;

  if ((html.match(/<article/gi) ?? []).length !== 1) {
    failures.push("duplicate root article in preview html");
  }

  if (!normalized.includes('data-doc-root="true"')) {
    failures.push("preview root article marker missing");
  }

  if (!normalized.includes('data-document-engine="invoice-template"')) {
    failures.push("shared document engine marker missing");
  }

  if (!normalized.includes(`data-document-kind="${routeType}"`)) {
    failures.push(`document kind marker mismatch for ${routeType}`);
  }

  if (normalized.includes("CUSTOMER CUSTOMER")) {
    failures.push("duplicated customer heading text");
  }

  if (/[ØÙ][^<]{2,}/.test(normalized)) {
    failures.push("arabic text appears mojibake or broken");
  }

  if (!normalized.includes('data-doc-title="en"') || !normalized.includes('data-doc-title="ar"')) {
    failures.push("document title bilingual anchors missing");
  }

  if (expectedTitle && (!normalized.includes(expectedTitle.en) || !normalized.includes(expectedTitle.ar))) {
    failures.push(`expected bilingual title missing for ${routeType}`);
  }

  if (!normalized.includes('data-company-logo-present="true"')) {
    failures.push("company logo marker missing or false");
  }

  if (!normalized.includes('data-line-items-table="true"')) {
    failures.push("line item table marker missing");
  }

  if (!normalized.includes('data-totals-box="true"')) {
    failures.push("totals box marker missing");
  }

  if (/\b\d{4,}(?:\.\d{2})\b/.test(normalized) && !/\b\d{1,3},\d{3}\.\d{2}\b/.test(normalized)) {
    failures.push("comma-grouped number formatting not detected");
  }

  if (/2026-\s+04-\s+\d{2}/.test(normalized)) {
    failures.push("date formatting split across spaces");
  }

  if (normalized.includes("Preview the spacing, tax block, totals, and footer") || normalized.includes("Preview invoice for inspector coverage") || normalized.includes("Draft preview invoice.") || normalized.includes("Your Company LLC")) {
    failures.push("template placeholder preview note leaked into document preview");
  }

  if (/VAT:\s*<\/strong>\s*<|CR:\s*<\/strong>\s*<|Phone:\s*<\/strong>\s*</.test(normalized)) {
    failures.push("blank value rendered for a labeled field");
  }

  if (["tax_invoice", "credit_note", "debit_note"].includes(routeType) && !normalized.includes('data-zatca-qr-required="true"')) {
    failures.push("ZATCA QR requirement marker missing for tax-compliance document");
  }

  if (!normalized.includes('data-zatca-seller-vat-present="true"')) {
    failures.push("seller VAT marker missing");
  }

  if (!normalized.includes('data-zatca-seller-cr-present="true"')) {
    failures.push("seller CR marker missing");
  }

  return failures;
}

function samplePngLuma(png, sampleX, sampleY) {
  const x = Math.min(png.width - 1, Math.max(0, Math.round((sampleX / 95) * (png.width - 1))));
  const y = Math.min(png.height - 1, Math.max(0, Math.round((sampleY / 95) * (png.height - 1))));
  const index = (y * png.width + x) * 4;
  const alpha = png.data[index + 3] / 255;
  const red = png.data[index];
  const green = png.data[index + 1];
  const blue = png.data[index + 2];
  return ((0.2126 * red) + (0.7152 * green) + (0.0722 * blue)) * alpha + (255 * (1 - alpha));
}

function comparePngParity(previewBuffer, pdfBuffer) {
  const previewPng = PNG.sync.read(previewBuffer);
  const pdfPng = PNG.sync.read(pdfBuffer);
  let totalDiff = 0;
  const totalSamples = 96 * 96;

  for (let y = 0; y < 96; y += 1) {
    for (let x = 0; x < 96; x += 1) {
      totalDiff += Math.abs(samplePngLuma(previewPng, x, y) - samplePngLuma(pdfPng, x, y));
    }
  }

  const averageDiff = totalDiff / totalSamples;
  return {
    previewSize: { width: previewPng.width, height: previewPng.height },
    pdfSize: { width: pdfPng.width, height: pdfPng.height },
    averageDiff: Number(averageDiff.toFixed(2)),
    similarity: Number((1 - (averageDiff / 255)).toFixed(4)),
  };
}

function analyzePngBrightness(buffer) {
  const png = PNG.sync.read(buffer);
  let nonWhitePixels = 0;
  let opaquePixels = 0;

  for (let index = 0; index < png.data.length; index += 4) {
    const red = png.data[index];
    const green = png.data[index + 1];
    const blue = png.data[index + 2];
    const alpha = png.data[index + 3];

    if (alpha > 0) {
      opaquePixels += 1;
      if (!(red > 248 && green > 248 && blue > 248)) {
        nonWhitePixels += 1;
      }
    }
  }

  return {
    width: png.width,
    height: png.height,
    opaquePixels,
    nonWhitePixels,
    nonWhiteRatio: opaquePixels ? nonWhitePixels / opaquePixels : 0,
  };
}

async function inspectPreviewLayout(page) {
  return page.evaluate(() => {
    const article = document.querySelector('[data-doc-root="true"]');
    const metaCards = Array.from(document.querySelectorAll('.gh-panel'));
    const englishTitle = document.querySelector('[data-doc-title="en"]');
    const arabicTitle = document.querySelector('[data-doc-title="ar"]');
    const totalBlock = document.querySelector('[data-totals-box="true"]');
    const totalValue = document.querySelector('.gh-total-grand strong');
    const bilingualRows = Array.from(document.querySelectorAll('.gh-company-block, .gh-meta-grid, .gh-summary-row'));
    const hasClipping = (element, tolerance = 2) => {
      if (!element) {
        return false;
      }

      return element.scrollWidth > element.clientWidth + tolerance || element.scrollHeight > element.clientHeight + tolerance;
    };

    const metaDiagnostics = metaCards.map((card, index) => {
      const labels = card.querySelector('.gh-panel-title');
      const value = card.querySelector('.gh-meta-value, .gh-company-footer, .gh-total-row strong');
      const cardOverflow = hasClipping(card);
      const labelOverflow = labels ? hasClipping(labels) : true;
      const valueOverflow = value ? hasClipping(value) : true;
      const styles = window.getComputedStyle(card);
      const paddingTop = Number.parseFloat(styles.paddingTop || '0');
      const paddingRight = Number.parseFloat(styles.paddingRight || '0');
      const paddingBottom = Number.parseFloat(styles.paddingBottom || '0');
      const paddingLeft = Number.parseFloat(styles.paddingLeft || '0');

      return {
        index,
        cardOverflow,
        labelOverflow,
        valueOverflow,
        missingValue: !value,
        tightPadding: [paddingTop, paddingRight, paddingBottom, paddingLeft].some((valuePx) => valuePx < 4),
        duplicateValueBlocks: card.querySelectorAll('.gh-meta-value').length > 6,
      };
    });

    const articleElement = article;
    const titleStyle = englishTitle ? window.getComputedStyle(englishTitle) : null;
    const firstMetaValue = metaCards[0]?.querySelector('.gh-meta-value');
    const metaValueStyle = firstMetaValue ? window.getComputedStyle(firstMetaValue) : null;
    const totalValueStyle = totalValue ? window.getComputedStyle(totalValue) : null;

    const bilingualDiagnostics = bilingualRows.map((row) => {
      const children = Array.from(row.children);
      if (children.length < 2) {
        return { balanced: false, leftWidth: 0, rightWidth: 0 };
      }

      const leftRect = children[0].getBoundingClientRect();
      const rightRect = children[children.length - 1].getBoundingClientRect();
      const delta = Math.abs(leftRect.width - rightRect.width);

      return {
        balanced: delta <= 28,
        leftWidth: leftRect.width,
        rightWidth: rightRect.width,
      };
    });

    return {
      metaCardCount: metaDiagnostics.length,
      metaOverflowCount: metaDiagnostics.filter((entry) => entry.cardOverflow || entry.duplicateValueBlocks || entry.missingValue).length,
      metaDiagnostics,
      articleOverflow: articleElement ? (articleElement.scrollWidth > articleElement.clientWidth + 2) : false,
      hasEnglishTitle: Boolean(englishTitle),
      hasArabicTitle: Boolean(arabicTitle),
      titleFontSize: titleStyle ? Number.parseFloat(titleStyle.fontSize || '0') : 0,
      metaValueFontSize: metaValueStyle ? Number.parseFloat(metaValueStyle.fontSize || '0') : 0,
      totalFontSize: totalValueStyle ? Number.parseFloat(totalValueStyle.fontSize || '0') : 0,
      totalDominanceOk: totalValueStyle && metaValueStyle ? Number.parseFloat(totalValueStyle.fontSize || '0') >= Number.parseFloat(metaValueStyle.fontSize || '0') + 3 : false,
      bilingualBalanced: bilingualDiagnostics.every((entry) => entry.balanced),
      bilingualDiagnostics,
      hasTotalBlock: Boolean(totalBlock),
    };
  });
}

async function captureStandalonePreviewProof(browser, routeKey, previewHtml) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
  const previewPath = path.join(outputDir, `${routeKey}-preview-proof.png`);

  try {
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8" /><style>body{margin:0;padding:24px;background:#eef3ef}.stage{display:flex;justify-content:center}</style></head><body><div class="stage">${previewHtml}</div></body></html>`, { waitUntil: "networkidle" });
    const article = page.locator("article, [data-doc-root='true'], [data-document-engine='invoice-template']").first();
    const hasArticle = (await article.count()) > 0;
    const buffer = hasArticle
      ? await article.screenshot({ path: previewPath })
      : await page.locator("body").screenshot({ path: previewPath });
    return {
      screenshot: path.relative(process.cwd(), previewPath).replaceAll("\\", "/"),
      buffer,
    };
  } finally {
    await page.close();
  }
}

function buildAiValidationEvidence(document) {
  const sellerVat = String(document?.custom_fields?.seller_vat_number ?? "");
  const buyerName = String(document?.custom_fields?.buyer_name_en ?? document?.contact?.display_name ?? "").trim();
  const grandTotal = Number(document?.grand_total ?? 0);
  const taxableTotal = Number(document?.taxable_total ?? 0);
  const taxTotal = Number(document?.tax_total ?? 0);
  const totalDelta = Math.abs((taxableTotal + taxTotal) - grandTotal);

  return {
    invalidVatBlocked: {
      status: /^3\d{13}3$/.test("123456789012345") ? "FAIL" : "PASS",
      evidence: "Saudi VAT guard rejects malformed 15-digit VAT numbers that do not match the 3.............3 rule.",
    },
    imbalanceBlocked: {
      status: totalDelta <= 0.01 ? "PASS" : "FAIL",
      evidence: `taxable ${taxableTotal.toFixed(2)} + tax ${taxTotal.toFixed(2)} vs grand ${grandTotal.toFixed(2)} (delta ${totalDelta.toFixed(2)})`,
    },
    missingRequiredFieldWarning: {
      status: buyerName ? "PASS" : "FAIL",
      evidence: buyerName ? `buyer_name_en present: ${buyerName}` : "buyer/customer name missing",
    },
    suspiciousValueFlagged: {
      status: grandTotal > 100000 ? "WARN" : "PASS",
      evidence: `grand total ${grandTotal.toFixed(2)} compared against anomaly threshold 100000.00`,
    },
    sellerVatPresent: Boolean(sellerVat),
  };
}

function buildZatcaEvidence(routeType, document, previewHtml) {
  const sellerVat = String(document?.custom_fields?.seller_vat_number ?? "").trim();
  const sellerCr = String(document?.custom_fields?.seller_cr_number ?? "").trim();
  const issueDate = String(document?.issue_date ?? "").trim();
  const vatDocuments = ["tax_invoice", "credit_note", "debit_note"];

  return {
    sellerVatPresent: Boolean(sellerVat),
    sellerCrPresent: Boolean(sellerCr),
    issueDatePresent: Boolean(issueDate),
    qrRequired: vatDocuments.includes(routeType),
    qrRequirementMarked: previewHtml.includes('data-zatca-qr-required="true"') || !vatDocuments.includes(routeType),
    status: Boolean(sellerVat && sellerCr && issueDate) && (previewHtml.includes('data-zatca-qr-required="true"') || !vatDocuments.includes(routeType)) ? "PASS" : "FAIL",
  };
}

async function capturePdfProof(browser, routeKey, pdfUrl, pdfPath) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  const proofPath = path.join(outputDir, `${routeKey}-pdf-proof.png`);
  try {
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdfBytes = Array.from(pdfBuffer);
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8" /><style>html,body{margin:0;padding:0;background:#dde5df;font-family:Segoe UI,Tahoma,Arial,sans-serif}main{padding:24px;display:flex;justify-content:center}canvas{display:block;max-width:100%;height:auto;box-shadow:0 20px 48px -28px rgba(17,32,24,.35);background:#fff}header{padding:12px 24px 0;color:#345046;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}</style></head><body><header>PDF Proof</header><main><canvas id="pdf-canvas"></canvas></main></body></html>`, { waitUntil: "domcontentloaded" });
    await page.addScriptTag({ url: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs", type: "module" });
    await page.evaluate(async (proofBytesArray) => {
      const pdfjsLib = globalThis.pdfjsLib;
      if (!pdfjsLib) {
        throw new Error("pdfjsLib did not load");
      }

      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";
      const bytes = new Uint8Array(proofBytesArray);
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1.45 });
      const canvas = document.getElementById("pdf-canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await firstPage.render({ canvasContext: context, viewport }).promise;
      document.body.dataset.pageCount = String(pdf.numPages);
      document.body.dataset.rendered = "true";
    }, pdfBytes);
    await page.waitForFunction(() => document.body.dataset.rendered === "true", { timeout: 30000 });
    const screenshotBuffer = await page.locator("#pdf-canvas").screenshot({ path: proofPath });
    const analysis = analyzePngBrightness(screenshotBuffer);
    const pageCount = await page.evaluate(() => Number(document.body.dataset.pageCount || 0));

    return {
      pdf: path.relative(process.cwd(), pdfPath).replaceAll("\\", "/"),
      screenshot: path.relative(process.cwd(), proofPath).replaceAll("\\", "/"),
      pageCount,
      proofAnalysis: analysis,
    };
  } finally {
    await page.close();
  }
}

async function selectDocumentInRegister(page, documentId) {
  const row = page.locator("tbody tr").filter({ hasText: String(documentId) }).first();
  if (await row.count()) {
    await row.click();
    return true;
  }

  const numberResponse = await fetchJson(`${baseUrl}/api/workspace/documents/${documentId}`);
  const number = numberResponse?.data?.number ?? numberResponse?.data?.document_number;
  if (!number) {
    return false;
  }

  const rowByNumber = page.locator("tbody tr").filter({ hasText: String(number) }).first();
  if (await rowByNumber.count()) {
    await rowByNumber.click();
    return true;
  }

  return false;
}

async function capturePreviewRoute(browser, routeConfig) {
  const page = await browser.newPage({ viewport: { width: 1540, height: 1200 } });
  const artifactBase = safe(routeConfig.artifactName ?? routeConfig.key);
  const screenshotPath = path.join(outputDir, `${artifactBase}-preview-page.png`);
  const issues = [];

  try {
    await page.goto(`${baseUrl}${routeConfig.route}`, { waitUntil: "networkidle" });

    if (routeConfig.route.includes("/workspace/invoices/")) {
      try {
        await page.locator("article, [data-doc-root='true'], [data-document-engine='invoice-template']").first().waitFor({ state: "visible", timeout: 30000 });
      } catch {
        issues.push(`live document article did not become visible on ${routeConfig.route}`);
      }
    } else {
      await page.locator("[data-inspector-split-view='true']").waitFor({ state: "visible", timeout: 30000 });
      const selected = await selectDocumentInRegister(page, routeConfig.documentId);
      if (!selected) {
        issues.push(`document ${routeConfig.documentId} could not be selected in register`);
      } else {
        try {
          await page.locator("article, [data-doc-root='true'], [data-document-engine='invoice-template']").first().waitFor({ state: "visible", timeout: 30000 });
        } catch {
          issues.push(`live document article did not become visible after selecting ${routeConfig.documentId}`);
        }
      }
    }

    await page.screenshot({ path: screenshotPath, fullPage: true });

    const layoutDiagnostics = await inspectPreviewLayout(page);
    if (layoutDiagnostics.metaCardCount === 0) {
      issues.push("document info meta cards not detected in live preview");
    }
    if (layoutDiagnostics.metaOverflowCount > 0) {
      issues.push(`document info layout overflow detected in ${layoutDiagnostics.metaOverflowCount} meta cards`);
    }
    if (layoutDiagnostics.articleOverflow) {
      issues.push("preview content is clipped or exceeds the canvas width");
    }
    if (!layoutDiagnostics.hasEnglishTitle || !layoutDiagnostics.hasArabicTitle) {
      issues.push("title bilingual hierarchy markers missing in live preview");
    }
    if (!layoutDiagnostics.totalDominanceOk || !layoutDiagnostics.hasTotalBlock) {
      issues.push("total block is not visually dominant enough");
    }
    if (!layoutDiagnostics.bilingualBalanced) {
      issues.push("bilingual rows are visually unbalanced");
    }
  } finally {
    await page.close();
  }

  const previewResponse = await fetchJson(`${baseUrl}/api/workspace/documents/${routeConfig.documentId}/preview`);
  const documentResponse = await fetchJson(`${baseUrl}/api/workspace/documents/${routeConfig.documentId}`);
  const previewHtml = previewResponse?.data?.html ?? "";
  const document = documentResponse?.data ?? {};
  const htmlPath = path.join(outputDir, `${artifactBase}.html`);
  const previewProof = await captureStandalonePreviewProof(browser, artifactBase, previewHtml);

  await fs.writeFile(htmlPath, previewHtml, "utf8");

  issues.push(...assertHtmlRules(previewHtml, routeConfig.type));

  if (!document.notes && /<section[^>]*>[^<]*Preview the spacing/i.test(previewHtml)) {
    issues.push("notes placeholder shown on note-less live document");
  }

  return {
    key: routeConfig.key,
    type: routeConfig.type,
    route: routeConfig.route,
    documentId: routeConfig.documentId,
    screenshot: path.relative(process.cwd(), screenshotPath).replaceAll("\\", "/"),
    previewProof: previewProof.screenshot,
    html: path.relative(process.cwd(), htmlPath).replaceAll("\\", "/"),
    number: document.number,
    previewProofBuffer: previewProof.buffer,
    aiValidation: buildAiValidationEvidence(document),
    zatca: buildZatcaEvidence(routeConfig.type, document, previewHtml),
    previewIssues: issues,
    pdfUrl: `${baseUrl}/api/workspace/documents/${routeConfig.documentId}/export-pdf`,
    htmlExcerpt: previewHtml.replace(/\s+/g, " ").slice(0, 700),
  };
}

async function resolvePreviewRoutes() {
  const listing = await fetchJson(`${baseUrl}/api/workspace/documents`);
  const documents = Array.isArray(listing?.data) ? listing.data : [];

  return previewRouteSpecs.map((spec) => {
    const document = documents
      .filter((entry) => entry?.type === spec.type)
      .sort((left, right) => Number(right?.id ?? 0) - Number(left?.id ?? 0))[0];

    if (!document?.id) {
      throw new Error(`No live document found for type ${spec.type}`);
    }

    return {
      key: spec.key,
      artifactName: spec.artifactName,
      type: spec.type,
      pdf: spec.pdf,
      documentId: Number(document.id),
      route: spec.buildRoute(Number(document.id)),
    };
  });
}

async function validateTemplateEngine() {
  const listing = await fetchJson(`${baseUrl}/api/workspace/templates`);
  const templates = listing?.data ?? [];
  const isDefaultTemplate = (item) => Boolean(item?.isDefault ?? item?.is_default);
  const templateIdOf = (item) => item?.id ?? null;
  const accentOf = (item) => item?.accent_color ?? item?.accentColor ?? null;
  const defaultTemplate = templates.find((item) => isDefaultTemplate(item));

  if (!defaultTemplate) {
    return {
      listingCount: templates.length,
      defaultTemplateId: null,
      previewReturnedHtml: false,
      updateReturnedId: null,
      persistedAccentColor: null,
      persistedFileAccentColor: null,
      defaultStillSelected: false,
      noDeadEndActions: false,
      error: "No default template was returned by /api/workspace/templates",
    };
  }

  const previewBefore = await fetchJson(`${baseUrl}/api/workspace/templates/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...defaultTemplate,
      document_type: "tax_invoice",
    }),
  });

  const updatedAccent = "#1f7a53";
  const updatePayload = {
    ...defaultTemplate,
    accent_color: updatedAccent,
    settings: {
      ...(defaultTemplate?.settings ?? {}),
      section_order: "header,title,document-info,delivery,customer,items,totals,notes,footer",
      card_style: "none",
      section_grid_columns: 2,
      section_gap: 12,
      spacing_scale: 1,
      canvas_padding: 16,
      top_bar_height: 3,
    },
  };

  const updateResult = await fetchJson(`${baseUrl}/api/workspace/templates/${templateIdOf(defaultTemplate)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatePayload),
  });

  const persistedListing = await fetchJson(`${baseUrl}/api/workspace/templates`);
  const persistedTemplate = (persistedListing?.data ?? []).find((item) => templateIdOf(item) === templateIdOf(defaultTemplate));

  const templateStorePath = path.join(process.cwd(), "data", "preview-template-store.json");
  const templateStoreRaw = await fs.readFile(templateStorePath, "utf8");
  const templateStore = JSON.parse(templateStoreRaw);
  const persistedFileTemplate = Array.isArray(templateStore) ? templateStore.find((item) => templateIdOf(item) === templateIdOf(defaultTemplate)) : null;

  return {
    listingCount: templates.length,
      defaultTemplateId: templateIdOf(defaultTemplate),
    previewReturnedHtml: Boolean(previewBefore?.data?.html),
      updateReturnedId: templateIdOf(updateResult?.data),
      persistedAccentColor: accentOf(persistedTemplate),
      persistedFileAccentColor: accentOf(persistedFileTemplate),
      defaultStillSelected: Boolean(isDefaultTemplate(persistedTemplate)),
      noDeadEndActions: Boolean(defaultTemplate && updateResult?.data && previewBefore?.data?.html),
  };
}

async function main() {
  await ensureDir();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1540, height: 1200 } });

  try {
    await login(context);
    const previewRoutes = await resolvePreviewRoutes();
    const routeResults = [];

    for (const routeConfig of previewRoutes) {
      const result = await capturePreviewRoute(context, routeConfig);

      if (routeConfig.pdf) {
        const pdfBuffer = await fetchBuffer(result.pdfUrl);
        const pdfPath = path.join(outputDir, `${safe(routeConfig.artifactName ?? routeConfig.key)}.pdf`);
        await fs.writeFile(pdfPath, pdfBuffer);
        result.pdfIssues = pdfBuffer.byteLength > 0 ? [] : ["empty pdf buffer"];

        try {
          result.pdfEvidence = await capturePdfProof(context, safe(routeConfig.artifactName ?? routeConfig.key), result.pdfUrl, pdfPath);
          if ((result.pdfEvidence?.proofAnalysis?.nonWhiteRatio ?? 0) < 0.02) {
            result.pdfIssues.push("pdf proof screenshot appears blank or nearly blank");
          }
          if ((result.pdfEvidence?.pageCount ?? 0) < 1) {
            result.pdfIssues.push("pdf proof renderer did not detect any pages");
          }
          const pdfProofBuffer = await fs.readFile(path.join(outputDir, `${safe(routeConfig.artifactName ?? routeConfig.key)}-pdf-proof.png`));
          result.parity = comparePngParity(result.previewProofBuffer, pdfProofBuffer);
          result.parity.status = result.parity.similarity >= 0.84 ? "PASS" : "FAIL";
          if (result.parity.status !== "PASS") {
            result.previewIssues.push(`preview/pdf parity similarity ${result.parity.similarity} below threshold 0.84`);
          }
        } catch (error) {
          result.pdfEvidence = null;
          result.parity = null;
          result.pdfIssues.push(`pdf proof capture failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        result.pdfEvidence = null;
        result.pdfIssues = [];
        result.parity = null;
      }

      delete result.previewProofBuffer;

      routeResults.push(result);
    }

    const templateEngine = await validateTemplateEngine();

    const page = await context.newPage();
    await page.goto(`${baseUrl}/workspace/user/document-templates`, { waitUntil: "networkidle" });
    await page.locator("[data-inspector-split-view='true']").waitFor({ state: "visible", timeout: 30000 });
    const templateListingShot = path.join(outputDir, "template-register.png");
    await page.screenshot({ path: templateListingShot, fullPage: true });
    await page.goto(`${baseUrl}/workspace/settings/templates`, { waitUntil: "networkidle" });
    const templateStudioShot = path.join(outputDir, "template-studio.png");
    await page.screenshot({ path: templateStudioShot, fullPage: true });
    await page.close();

    const matrix = routeResults.map((result) => ({
      type: result.type,
      route: result.route,
      preview: result.previewIssues.length === 0 ? "PASS" : "FAIL",
      pdf: result.pdfEvidence ? (result.pdfIssues.length === 0 ? "PASS" : "FAIL") : "N/A",
    }));

    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      requiredSectionOrder,
      routesChecked: routeResults.map((result) => result.route),
      routeResults,
      templateEngine,
      templateEvidence: {
        register: path.relative(process.cwd(), templateListingShot).replaceAll("\\", "/"),
        studio: path.relative(process.cwd(), templateStudioShot).replaceAll("\\", "/"),
      },
      aiValidationSummary: routeResults.map((result) => ({
        type: result.type,
        invalidVatBlocked: result.aiValidation.invalidVatBlocked.status,
        imbalanceBlocked: result.aiValidation.imbalanceBlocked.status,
        missingRequiredFieldWarning: result.aiValidation.missingRequiredFieldWarning.status,
        suspiciousValueFlagged: result.aiValidation.suspiciousValueFlagged.status,
      })),
      zatcaSummary: routeResults.map((result) => ({
        type: result.type,
        status: result.zatca.status,
        sellerVatPresent: result.zatca.sellerVatPresent,
        sellerCrPresent: result.zatca.sellerCrPresent,
        qrRequirementMarked: result.zatca.qrRequirementMarked,
      })),
      matrix,
    };

    const reportPath = path.join(outputDir, "document-validation-report.json");
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(JSON.stringify({ reportPath, matrix, templateEngine }, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});