/**
 * PDF ↔ preview parity harness (programmatic PDF + optional Playwright E2E).
 *
 * Programmatic (default): 7 document schemas × 3 languages → PDF bytes, raster PNG
 * via Chromium `file://` PDF (same approach as `pdf_zatca_parity_batch.ts`).
 *
 * E2E (--e2e <baseUrl>): opens workspace registers that use `WorkspaceRegister` +
 * `WorkspacePreviewPanel`, captures `.wsv2-doc-paper`, triggers real PDF download,
 * rasterizes PDF, writes pixel diff when dimensions match.
 *
 * Run:
 *   npx tsx tools/pdf_preview_pdf_parity_check.ts <artifactEvidenceDir>
 *   npx tsx tools/pdf_preview_pdf_parity_check.ts <artifactEvidenceDir> --e2e http://127.0.0.1:3000
 *   npx tsx tools/pdf_preview_pdf_parity_check.ts <artifactEvidenceDir> --e2e-only --e2e http://127.0.0.1:3000
 *
 * E2E language subset (default `bilingual` to keep CI wall-clock sane; programmatic
 * matrix still covers all 3 languages):
 *   --e2e-langs=english,arabic,bilingual
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { chromium, type Download } from "playwright";
import { invoices } from "../data/workspace/invoices";
import { quotations } from "../data/workspace/quotations";
import { creditNotes } from "../data/workspace/credit-notes";
import { debitNotes } from "../data/workspace/debit-notes";
import { proformaInvoices } from "../data/workspace/proforma-invoices";
import {
  DOCUMENT_TEMPLATE_SCHEMAS,
  type DocumentTemplateSchema,
  type LangMode,
  type SchemaDocType,
} from "../lib/workspace/document-template-schemas";
import { buildInvoicePdf } from "../lib/workspace/exports/pdf";
import { defaultTemplateUi } from "../lib/workspace/template-ui-settings";
import { previewCompany } from "../data/preview-company";
import { customers } from "../data/workspace/customers";
import type { DocumentRecord } from "../lib/workspace/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const REQUIRED: SchemaDocType[] = [
  "tax_invoice",
  "quotation",
  "proforma_invoice",
  "credit_note",
  "debit_note",
  "delivery_note",
  "purchase_order",
];

const LANGS: LangMode[] = ["english", "arabic", "bilingual"];

const E2E_ROUTES: Partial<Record<SchemaDocType, string>> = {
  tax_invoice: "/workspace/user/invoices",
  quotation: "/workspace/user/quotations",
  proforma_invoice: "/workspace/user/proforma-invoices",
  credit_note: "/workspace/user/credit-notes",
  debit_note: "/workspace/user/debit-notes",
};

function seller(): Parameters<typeof buildInvoicePdf>[0]["seller"] {
  return {
    name: previewCompany.sellerName,
    nameAr: previewCompany.sellerNameAr,
    vatNumber: previewCompany.vatNumber,
    registrationNumber: previewCompany.registrationNumber,
    addressEn: previewCompany.sellerAddressEn,
    addressAr: previewCompany.sellerAddressAr,
    email: previewCompany.sellerEmail,
    phone: previewCompany.sellerPhone,
  };
}

function customerFor(doc: DocumentRecord) {
  const c = customers.find((x) => x.id === doc.customerId);
  if (!c) return { name: "—" };
  return {
    name: c.legalName ?? "—",
    nameAr: c.legalNameAr,
    vatNumber: c.vatNumber,
    city: c.city,
    addressEn: c.addressEn ?? c.city,
    addressAr: c.addressAr,
    email: c.email,
    phone: c.phone,
  };
}

function stressDoc(base: DocumentRecord): DocumentRecord {
  const lines = [...base.lines];
  if (lines[0]) {
    lines[0] = {
      ...lines[0],
      description:
        "توصيل بضائع — Cold chain item with Arabic label that must wrap inside the description column without overlapping VAT columns. SKU-AR-999",
    };
  }
  return { ...base, lines };
}

function pickDocForSchema(slug: SchemaDocType): DocumentRecord {
  switch (slug) {
    case "tax_invoice":
    case "simplified_tax_invoice":
      return stressDoc(invoices[0]!);
    case "quotation":
      return stressDoc(quotations[0]!);
    case "proforma_invoice":
      return stressDoc(proformaInvoices[0]!);
    case "credit_note":
      return stressDoc(creditNotes[0]!);
    case "debit_note":
      return stressDoc(debitNotes[0]!);
    case "delivery_note":
    case "purchase_order":
      return stressDoc(invoices[0]!);
    default:
      return stressDoc(invoices[0]!);
  }
}

function assertPdfMagic(bytes: Uint8Array, path: string): void {
  const head = String.fromCharCode(...bytes.slice(0, 5));
  if (!head.startsWith("%PDF-")) {
    throw new Error(`Not a PDF (missing %PDF-): ${path}`);
  }
}

/**
 * Rasterize page 1 via Chromium + data-URL iframe. Plain `file://` PDF opens as a
 * download in Playwright and does not paint to a page (Windows/Chromium behaviour).
 */
async function rasterizePdfFile(
  pdfPath: string,
  pngPath: string,
  sharedBrowser?: Awaited<ReturnType<typeof chromium.launch>>,
): Promise<boolean> {
  const ownBrowser = sharedBrowser == null;
  let browser = sharedBrowser ?? null;
  try {
    if (!browser) browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
    try {
      const bytes = readFileSync(resolve(pdfPath));
      const b64 = Buffer.from(bytes).toString("base64");
      const html = `<!DOCTYPE html><html><body style="margin:0"><iframe style="border:0;width:900px;height:1200px" src="data:application/pdf;base64,${b64}"></iframe></body></html>`;
      await page.setContent(html, { waitUntil: "load", timeout: 90_000 });
      await new Promise((r) => setTimeout(r, 2800));
      await page.screenshot({ path: pngPath, fullPage: true });
    } finally {
      await page.close().catch(() => {});
    }
    if (ownBrowser) {
      await browser.close();
    }
    return existsSync(pngPath);
  } catch {
    if (ownBrowser && browser) {
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    }
    return false;
  }
}

function diffPng(
  pathA: string,
  pathB: string,
  outPath: string,
): { ok: boolean; diffPct: number | null; note: string } {
  try {
    const a = PNG.sync.read(readFileSync(pathA));
    const b = PNG.sync.read(readFileSync(pathB));
    if (a.width !== b.width || a.height !== b.height) {
      return {
        ok: false,
        diffPct: null,
        note: `size_mismatch a=${a.width}x${a.height} b=${b.width}x${b.height}`,
      };
    }
    const w = a.width;
    const h = a.height;
    const total = w * h;
    let diffPixels = 0;
    const out = new PNG({ width: w, height: h });
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (w * y + x) << 2;
        const dr = Math.abs(a.data[i]! - b.data[i]!);
        const dg = Math.abs(a.data[i + 1]! - b.data[i + 1]!);
        const db = Math.abs(a.data[i + 2]! - b.data[i + 2]!);
        const da = Math.abs(a.data[i + 3]! - b.data[i + 3]!);
        const m = dr + dg + db + da;
        if (m > 24) {
          diffPixels++;
          out.data[i] = 255;
          out.data[i + 1] = 0;
          out.data[i + 2] = 0;
          out.data[i + 3] = 255;
        } else {
          out.data[i] = a.data[i]!;
          out.data[i + 1] = a.data[i + 1]!;
          out.data[i + 2] = a.data[i + 2]!;
          out.data[i + 3] = a.data[i + 3]!;
        }
      }
    }
    writeFileSync(outPath, PNG.sync.write(out));
    const diffPct = (diffPixels / total) * 100;
    return { ok: diffPct < 2.5, diffPct, note: "compared" };
  } catch (e) {
    return { ok: false, diffPct: null, note: e instanceof Error ? e.message : String(e) };
  }
}

async function saveDownload(d: Download, dest: string): Promise<void> {
  await d.saveAs(dest);
}

async function runE2eCase(
  baseUrl: string,
  slug: SchemaDocType,
  route: string,
  language: LangMode,
  outDir: string,
  logLines: string[],
): Promise<{ pass: boolean; note: string }> {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const logPath = join(outDir, "console.log");
  const consoleBuf: string[] = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on("console", (msg) => consoleBuf.push(`[${msg.type()}] ${msg.text()}`));
    page.on("pageerror", (err) => consoleBuf.push(`[pageerror] ${err.message}`));

    const doc = pickDocForSchema(slug);
    const base = baseUrl.replace(/\/$/, "");
    const url = `${base}${route}?doc=${encodeURIComponent(doc.id)}`;
    await page.goto(url, { waitUntil: "load", timeout: 120_000 });
    await new Promise((r) => setTimeout(r, 4000));
    await page.waitForSelector(".wsv2-doc-paper", { state: "visible", timeout: 120_000 });

    const tabLabel = language === "english" ? "EN" : language === "arabic" ? "AR" : "EN + AR";
    await page.getByRole("tab", { name: tabLabel }).click();
    await new Promise((r) => setTimeout(r, 500));

    const paper = page.locator(".wsv2-doc-paper");
    const previewPng = join(outDir, "preview.png");
    await paper.screenshot({ path: previewPng });

    const downloadPromise = page.waitForEvent("download", { timeout: 120_000 });
    await page.getByRole("button", { name: "Download PDF" }).click();
    const dl = await downloadPromise;
    const pdfPath = join(outDir, "download.pdf");
    await saveDownload(dl, pdfPath);

    const downloadedRaster = join(outDir, "download-pdf-raster.png");
    const rasterOk = await rasterizePdfFile(pdfPath, downloadedRaster);
    if (!rasterOk) {
      writeFileSync(logPath, consoleBuf.join("\n"), "utf8");
      return { pass: false, note: "pdf_raster_failed" };
    }

    const progRaster = join(outDir, "programmatic-pdf-raster.png");
    const pathParity = existsSync(progRaster)
      ? diffPng(progRaster, downloadedRaster, join(outDir, "parity-programmatic-vs-download.png"))
      : { ok: false, diffPct: null, note: "missing_programmatic_raster" };

    const previewVsPdf = diffPng(
      previewPng,
      downloadedRaster,
      join(outDir, "visual-diff-preview-vs-pdf.png"),
    );

    const passPath = pathParity.diffPct != null && pathParity.diffPct < 1.5;
    const ok = passPath;
    logLines.push(
      `E2E ${slug} ${language}: programmatic_vs_download_diff=${pathParity.diffPct ?? "n/a"} pathParity=${passPath} preview_vs_pdf_diff=${previewVsPdf.diffPct ?? "n/a"} note=${pathParity.note}/${previewVsPdf.note}`,
    );
    writeFileSync(
      join(outDir, "diff-summary.txt"),
      `programmatic_vs_download_diff_pct=${pathParity.diffPct ?? "null"}\npreview_vs_download_pdf_diff_pct=${previewVsPdf.diffPct ?? "null"}\npath_parity_pass=${passPath}\n`,
      "utf8",
    );
    writeFileSync(logPath, consoleBuf.join("\n"), "utf8");
    return { pass: ok, note: pathParity.note };
  } catch (e) {
    consoleBuf.push(String(e));
    writeFileSync(logPath, consoleBuf.join("\n"), "utf8");
    return { pass: false, note: e instanceof Error ? e.message : String(e) };
  } finally {
    await browser.close();
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const e2eOnly = argv.includes("--e2e-only");
  const e2eIdx = argv.indexOf("--e2e");
  const e2eBase = e2eIdx >= 0 ? argv[e2eIdx + 1] : null;
  const e2eLangsArg = argv.find((a) => a.startsWith("--e2e-langs="))?.slice("--e2e-langs=".length);
  const e2eLangs: LangMode[] = e2eLangsArg
    ? (e2eLangsArg.split(",").map((s) => s.trim()).filter(Boolean) as LangMode[])
    : (["bilingual"] as LangMode[]);
  const dirArg = argv.find(
    (a) => !a.startsWith("--") && a !== e2eBase && a !== "--e2e-only",
  );
  const evidenceRoot = dirArg
    ? resolve(dirArg)
    : join(root, "artifacts", "pdf_preview_pdf_parity_default_evidence");

  mkdirSync(evidenceRoot, { recursive: true });
  const logLines: string[] = [];
  logLines.push(`evidenceRoot=${evidenceRoot}`);
  logLines.push(`time=${new Date().toISOString()}`);

  if (e2eOnly && !e2eBase) {
    throw new Error("--e2e-only requires --e2e <baseUrl>");
  }

  if (e2eOnly) {
    logLines.push("skip_programmatic=1 (--e2e-only)");
  } else {
    const rasterBrowser = await chromium.launch({ headless: true });
    try {
      for (const slug of REQUIRED) {
        const schema: DocumentTemplateSchema = DOCUMENT_TEMPLATE_SCHEMAS[slug];
        if (!schema) {
          logLines.push(`MISSING_SCHEMA ${slug}`);
          continue;
        }
        const doc = pickDocForSchema(slug);
        for (const language of LANGS) {
          const caseDir = join(evidenceRoot, slug, language);
          mkdirSync(caseDir, { recursive: true });
          const r = await buildInvoicePdf({
            doc,
            schema,
            language,
            seller: seller(),
            customer: customerFor(doc),
            ui: defaultTemplateUi(),
            templateId: doc.templateId,
          });
          const pdfPath = join(caseDir, "programmatic.pdf");
          writeFileSync(pdfPath, r.bytes);
          assertPdfMagic(r.bytes, pdfPath);
          const pngPath = join(caseDir, "programmatic-pdf-raster.png");
          const shot = await rasterizePdfFile(pdfPath, pngPath, rasterBrowser);
          writeFileSync(
            join(caseDir, "programmatic-meta.txt"),
            `warnings=${JSON.stringify(r.warnings)}\nraster_ok=${shot}\n`,
            "utf8",
          );
          logLines.push(`OK programmatic ${slug} ${language} bytes=${r.bytes.length} raster=${shot}`);
        }
      }
    } finally {
      await rasterBrowser.close().catch(() => {});
    }
  }

  if (e2eBase) {
    logLines.push(`--e2e base=${e2eBase} langs=${e2eLangs.join(",")}`);
    for (const slug of REQUIRED) {
      const route = E2E_ROUTES[slug];
      for (const language of e2eLangs) {
        const caseDir = join(evidenceRoot, slug, language);
        mkdirSync(caseDir, { recursive: true });
        if (!route) {
          writeFileSync(
            join(caseDir, "e2e-skipped.txt"),
            `No WorkspaceRegister route for ${slug}; programmatic PDF only.\n`,
          );
          logLines.push(`SKIP_E2E ${slug} ${language} (no route)`);
          continue;
        }
        const res = await runE2eCase(e2eBase, slug, route, language, caseDir, logLines);
        writeFileSync(
          join(caseDir, "e2e-result.txt"),
          `pass=${res.pass}\nnote=${res.note}\n`,
          "utf8",
        );
      }
    }
  }

  writeFileSync(join(evidenceRoot, "parity-run-log.txt"), logLines.join("\n"), "utf8");
  console.log(logLines.join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
