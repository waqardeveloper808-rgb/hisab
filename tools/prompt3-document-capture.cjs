/**
 * Prompt 3 — browser capture for template preview API (requires `npm run dev`).
 * Writes PNGs + JSON/MD to PROMPT3_OUT (default: repo sibling artifact folder).
 *
 *   set PROMPT3_OUT=C:\hisab-prompt-3-doc-compliance\storage\app\agent-output\prompt-3-document-compliance-20260430-120001
 *   node tools/prompt3-document-capture.cjs
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const ARTIFACT =
  process.env.PROMPT3_OUT ||
  path.resolve(__dirname, "../../hisab-prompt-3-doc-compliance/storage/app/agent-output/prompt-3-document-compliance-20260430-120001");
const BASE = process.env.PROMPT3_BASE || "http://127.0.0.1:3000";

const basePayload = {
  name: "Prompt-3 validation",
  locale_mode: "bilingual",
  accent_color: "#3FAE2A",
  header_html: null,
  footer_html: null,
  settings: {
    show_qr: true,
    layout: "classic_corporate",
    show_totals: true,
    show_vat_section: true,
    font_family: "Segoe UI",
    font_size: 12,
    section_order: "header,title,document-info,delivery,customer,items,totals,notes,footer",
  },
};

async function postPreview(documentType, extras = {}) {
  const body = {
    ...basePayload,
    document_type: documentType,
    document_types: [documentType],
    ...extras,
  };
  const res = await fetch(`${BASE}/api/workspace/templates/preview?mode=preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Workspace-Mode": "preview",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${documentType}: HTTP ${res.status} ${text.slice(0, 500)}`);
  const j = JSON.parse(text);
  return j.data.html;
}

async function analyze(page) {
  return page.evaluate(() => {
    const root = document.querySelector("article[data-doc-root]");
    const qr = document.querySelector("[data-doc-qr-card]");
    const rw = root ? root.clientWidth : 0;
    const scroll = root && root.scrollWidth > rw + 1 ? root.scrollWidth - rw : 0;
    const bodyOverflow =
      document.body.scrollWidth > document.body.clientWidth + 1
        ? document.body.scrollWidth - document.body.clientWidth
        : 0;
    const text = document.body.innerText || "";
    return {
      hasQrCard: Boolean(qr),
      amountInWordsMention: /\bAmount in words\b/i.test(text) || /المبلغ كتابة/i.test(text),
      rootScrollOverflowPx: scroll,
      bodyScrollOverflowPx: bodyOverflow,
    };
  });
}

async function main() {
  if (!fs.existsSync(ARTIFACT)) {
    fs.mkdirSync(ARTIFACT, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 900, height: 1280 },
    extraHTTPHeaders: { "X-Workspace-Mode": "preview" },
  });
  const page = await context.newPage();
  const results = [];

  async function capture(fileBase, documentType, extras, expectQr) {
    const html = await postPreview(documentType, extras);
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    try {
      await page.evaluate(() => document.fonts.ready);
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(500);
    const metrics = await analyze(page);
    const png = path.join(ARTIFACT, `${fileBase}.png`);
    await page.screenshot({ path: png, fullPage: true });
    const qrOk = metrics.hasQrCard === expectQr;
    const noWords = !metrics.amountInWordsMention;
    const noHoriz = metrics.rootScrollOverflowPx === 0 && metrics.bodyScrollOverflowPx < 4;
    results.push({
      file: `${fileBase}.png`,
      documentType,
      expectQr,
      metrics,
      qrOk,
      noWords,
      noHoriz,
      pass: qrOk && noWords && noHoriz,
    });
  }

  await capture("doc-tax_invoice", "tax_invoice", {}, false);
  await capture("doc-quotation", "quotation", {}, false);
  await capture("doc-proforma_invoice", "proforma_invoice", {}, false);
  await capture("doc-credit_note", "credit_note", {}, false);
  await capture("doc-debit_note", "debit_note", {}, false);
  await capture("doc-delivery_note", "delivery_note", {}, false);
  await capture("doc-purchase_order", "purchase_order", {}, false);
  await capture(
    "doc-tax_invoice-simplified",
    "tax_invoice",
    { preview_custom_fields: { zatca_invoice_category: "simplified", zatca_qr_required: true } },
    true,
  );
  await capture(
    "doc-credit_note-simplified-qr",
    "credit_note",
    { preview_custom_fields: { zatca_show_simplified_qr: true } },
    true,
  );

  try {
    await page.goto(`${BASE}/workspace/admin/document-templates?mode=preview`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(ARTIFACT, "00-template-studio-admin.png"), fullPage: true });
    results.push({ file: "00-template-studio-admin.png", route: "/workspace/admin/document-templates", pass: true });
  } catch (e) {
    fs.writeFileSync(path.join(ARTIFACT, "00-template-studio-error.txt"), String(e?.stack || e), "utf8");
    results.push({ file: "00-template-studio-admin.png", error: String(e), pass: false });
  }

  await browser.close();

  fs.writeFileSync(path.join(ARTIFACT, "capture-results.json"), JSON.stringify(results, null, 2), "utf8");

  const lines = ["# Automated capture checks\n\n"];
  let allPass = true;
  for (const r of results) {
    if (r.route) {
      lines.push(`- **${r.file}**: opened \`${r.route}\`.\n`);
      continue;
    }
    if (r.error) {
      allPass = false;
      lines.push(`- **${r.file}**: ERROR ${r.error}\n`);
      continue;
    }
    if (!r.pass) allPass = false;
    lines.push(
      `- **${r.file}** (${r.documentType}): QR=${r.metrics.hasQrCard} (expected ${r.expectQr}) QR_ok=${r.qrOk} amountWords=${r.metrics.amountInWordsMention} overflowRoot=${r.metrics.rootScrollOverflowPx} overflowBody=${r.metrics.bodyScrollOverflowPx} => **${r.pass ? "PASS" : "FAIL"}**\n`,
    );
  }
  fs.writeFileSync(path.join(ARTIFACT, "capture-validation.md"), lines.join(""), "utf8");
  process.exitCode = allPass ? 0 : 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
