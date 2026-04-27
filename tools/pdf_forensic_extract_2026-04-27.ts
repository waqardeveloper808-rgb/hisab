/**
 * Forensic extraction — run from repo root:
 *   npx tsx tools/pdf_forensic_extract_2026-04-27.ts
 * Output: artifacts/pdf_forensic_html_compare_2026-04-27/
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { getSchemaForKind } from "../lib/workspace/document-template-schemas";
import { defaultTemplateUi } from "../lib/workspace/template-ui-settings";
import type { Customer, DocumentRecord } from "../lib/workspace/types";
import { getPreviewDocumentPdf, getPreviewDocumentPreview } from "../lib/workspace-preview";
import { renderDocumentPdf } from "../lib/document-engine/index";
import * as Wdr from "../components/workspace/WorkspaceDocumentRenderer";

const { WorkspaceDocumentRenderer, makeRendererCustomer, makeRendererSeller } = Wdr;

const OUT = join(process.cwd(), "artifacts", "pdf_forensic_html_compare_2026-04-27");
const DOC_ID = 1101;
const TEMPLATE_ID = 801;

const forensicDoc: DocumentRecord = {
  id: "forensic-1101",
  number: "INV-2026-1101",
  kind: "invoice",
  customerId: "cust-forensic-102",
  issueDate: "2026-04-10",
  dueDate: "2026-04-17",
  status: "partially_paid",
  currency: "SAR",
  subtotal: 4000,
  vat: 600,
  total: 4600,
  balance: 1850,
  templateId: "tmpl-standard",
  notes: "",
  lines: [
    {
      id: "forensic-ln-1",
      description: "Monthly bookkeeping",
      quantity: 1,
      unitPrice: 4000,
      vatRate: 0.15,
    },
  ],
};

const forensicCustomer: Customer = {
  id: "cust-forensic-102",
  legalName: "Desert Retail Co.",
  legalNameAr: "شركة صحراء للتجزئة",
  email: "ap@desertretail.sa",
  phone: "+966500000102",
  city: "Jeddah",
  vatNumber: "301112223330003",
  addressEn: "Prince Sultan Street, Al Zahra, Jeddah 23425, Saudi Arabia",
  addressAr: "شارع الأمير سلطان، حي الزهراء، جدة 23425، المملكة العربية السعودية",
  outstandingBalance: 1850,
};

function isFullHtmlDocument(html: string) {
  const t = html.trim();
  return /^<!doctype/i.test(t) || /^<html[\s>]/i.test(t);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  await writeFile(
    join(OUT, "preview-url.txt"),
    [
      "V2 live document preview (register + preview drawer), representative URL pattern:",
      "http://127.0.0.1:3000/workspace/user/invoices?doc=<id>",
      "Example with bundled demo data: ?doc=inv-2026-0218 (different primary key than forensic document 1101).",
      "Static HTML snapshot preview-dom.html uses the same business content as preview document id 1101 (INV-2026-1101).",
      "",
    ].join("\n"),
    "utf8",
  );

  await writeFile(
    join(OUT, "pdf-download-url.txt"),
    [
      "Guest preview mode — HTML→Chromium→PDF (lib/document-engine):",
      `http://127.0.0.1:3000/api/workspace/documents/${DOC_ID}/export-pdf?mode=preview&template_id=${TEMPLATE_ID}`,
      "Required: Header `X-Workspace-Mode: preview` (or query `?mode=preview`) when session is guest.",
      "",
      "Note: In-app V2 `WorkspaceTemplateStudio` PDF button uses client-side `buildInvoicePdf` (pdf-lib) — no shared HTML with this route.",
      "",
    ].join("\n"),
    "utf8",
  );

  const prev = await getPreviewDocumentPreview(DOC_ID, TEMPLATE_ID);
  if (!prev) throw new Error("getPreviewDocumentPreview returned null");
  const pdfApi = await getPreviewDocumentPdf(DOC_ID, TEMPLATE_ID);
  if (!pdfApi) throw new Error("getPreviewDocumentPdf returned null");

  await writeFile(join(OUT, "pdf-input.html"), prev.html, "utf8");
  await writeFile(join(OUT, "downloaded.pdf"), Buffer.from(pdfApi.bytes));

  const schema = getSchemaForKind(forensicDoc.kind);
  const v2Inner = renderToStaticMarkup(
    React.createElement(WorkspaceDocumentRenderer, {
      schema,
      doc: forensicDoc,
      seller: makeRendererSeller(),
      customer: makeRendererCustomer(forensicCustomer),
      language: "bilingual",
      style: "standard",
      qrImageDataUrl: null,
      ui: defaultTemplateUi(),
      templateId: forensicDoc.templateId,
    }),
  );
  const previewHtml = [
    "<!DOCTYPE html>",
    "<html><head><meta charset=\"utf-8\"/><title>forensic V2 preview (static)</title>",
    `<link rel="stylesheet" href="${pathToFileURL(join(process.cwd(), "app", "workspace", "workspace.css")).href}" />`,
    "</head><body style=\"margin:0;background:#0f1310;\">",
    '<div class="wsv2-doc-paper" data-lang="bilingual">',
    v2Inner,
    "</div></body></html>",
  ].join("\n");
  await writeFile(join(OUT, "preview-dom.html"), previewHtml, "utf8");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 960, height: 1400 });
    await page.goto(pathToFileURL(join(OUT, "preview-dom.html")).href, { waitUntil: "networkidle" });
    await page.screenshot({ path: join(OUT, "preview-screenshot.png"), fullPage: true });

    const htmlForShot = prev.html;
    const printable = isFullHtmlDocument(htmlForShot) ? htmlForShot : `<html><body>${htmlForShot}</body></html>`;
    await page.setContent(printable, { waitUntil: "domcontentloaded" });
    await page.setViewportSize({ width: 900, height: 1400 });
    await page.screenshot({ path: join(OUT, "pdf-page-1.png"), fullPage: true });

    const bytes2 = await renderDocumentPdf(prev.html);
    if (bytes2.byteLength !== pdfApi.bytes.byteLength) {
      await writeFile(
        join(OUT, "forensic-pdf-size-delta.txt"),
        `getPreviewDocumentPdf: ${pdfApi.bytes.byteLength}\nrenderDocumentPdf: ${bytes2.byteLength}\n`,
        "utf8",
      );
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
