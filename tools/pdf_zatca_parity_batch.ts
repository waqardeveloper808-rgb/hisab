/**
 * Generate workspace PDFs (EN / AR / bilingual) per schema for parity / PDF-A3 evidence.
 * Run: npx tsx tools/pdf_zatca_parity_batch.ts [outputDir]
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { invoices } from "../data/workspace/invoices";
import { quotations } from "../data/workspace/quotations";
import { creditNotes } from "../data/workspace/credit-notes";
import { debitNotes } from "../data/workspace/debit-notes";
import { proformaInvoices } from "../data/workspace/proforma-invoices";
import { customers } from "../data/workspace/customers";
import {
  DOCUMENT_TEMPLATE_SCHEMAS,
  type DocumentTemplateSchema,
  type LangMode,
  type SchemaDocType,
} from "../lib/workspace/document-template-schemas";
import { buildInvoicePdf } from "../lib/workspace/exports/pdf";
import { defaultTemplateUi } from "../lib/workspace/template-ui-settings";
import { previewCompany } from "../data/preview-company";
import type { DocumentRecord } from "../lib/workspace/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const artifact =
  process.argv[2] != null ? resolve(process.argv[2]) : join(root, "artifacts", "pdf_zatca_parity_batch");

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

function assertPdfMagic(bytes: Uint8Array, path: string): void {
  const head = String.fromCharCode(...bytes.slice(0, 5));
  if (!head.startsWith("%PDF-")) {
    throw new Error(`Not a PDF (missing %PDF-): ${path}`);
  }
}

async function maybeScreenshotPdf(pdfPath: string, pngPath: string): Promise<boolean> {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
    const url = "file:///" + pdfPath.replace(/\\/g, "/");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: pngPath, fullPage: true });
    await browser.close();
    return existsSync(pngPath);
  } catch {
    return false;
  }
}

async function main() {
  mkdirSync(artifact, { recursive: true });
  const summary: string[] = [];
  summary.push(`artifact: ${artifact}`);
  summary.push(`time: ${new Date().toISOString()}`);

  for (const slug of REQUIRED) {
    const schema: DocumentTemplateSchema = DOCUMENT_TEMPLATE_SCHEMAS[slug];
    if (!schema) {
      summary.push(`MISSING_SCHEMA ${slug}`);
      continue;
    }
    const doc = pickDocForSchema(slug);
    for (const language of LANGS) {
      const name = `recovery-${slug}-${language}.pdf`;
      const outPath = join(artifact, name);
      const r = await buildInvoicePdf({
        doc,
        schema,
        language,
        seller: seller(),
        customer: customerFor(doc),
        ui: defaultTemplateUi(),
      });
      writeFileSync(outPath, r.bytes);
      assertPdfMagic(r.bytes, outPath);
      summary.push(`OK ${name} bytes=${r.bytes.length} warnings=${JSON.stringify(r.warnings)}`);

      const png = join(artifact, `recovery-${slug}-${language}.png`);
      const shot = await maybeScreenshotPdf(outPath, png);
      summary.push(`  screenshot: ${shot ? png : "FAILED (Playwright/file PDF viewer)"}`);
    }
  }

  writeFileSync(join(artifact, "batch-run-log.txt"), summary.join("\n"), "utf8");
  console.log(summary.join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
