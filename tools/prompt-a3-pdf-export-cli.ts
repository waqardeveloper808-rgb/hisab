/**
 * Prompt A3 — POST /api/workspace/template-studio/pdf → artifact PDF file.
 *
 * Usage:
 *   npx tsx tools/prompt-a3-pdf-export-cli.ts [baseUrl] [outputPath]
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { previewCompany } from "@/data/preview-company";
import { invoices } from "@/data/workspace/invoices";
import { findCustomer } from "@/data/workspace/customers";
import { DOCUMENT_TEMPLATE_SCHEMAS } from "@/lib/workspace/document-template-schemas";
import type { LangMode } from "@/lib/workspace/document-template-schemas";
import type { TemplateStyle } from "@/lib/workspace/document-template-schemas";
import { defaultTemplateUi } from "@/lib/workspace/template-ui-settings";

const ARTIFACT_FALLBACK = path.join(
  process.cwd(),
  "artifact",
  "prompt-a3-template-studio-rebuild-20260501-041001",
  "pdf-proof",
  "template-studio-proof-20260501.pdf",
);

async function main(): Promise<void> {
  const base = process.argv[2] ?? "http://127.0.0.1:3000";
  const out = process.argv[3] ?? process.env.PDF_OUT ?? ARTIFACT_FALLBACK;

  const schema = DOCUMENT_TEMPLATE_SCHEMAS.tax_invoice;
  const LONG =
    "\u0633\u0644\u0639-\u0635\u0646\u0627\u0639\u064a " +
    "INDUSTRIAL-SUPPLY-LINE-ITEM-DESCRIPTION-STRESS ".repeat(8);
  const src = invoices[0];
  const doc = {
    ...src,
    lines: src.lines.map((ln, idx) =>
      idx === 0 ? { ...ln, description: LONG } : ln,
    ),
  };

  const customer = findCustomer(doc.customerId ?? "");
  const language: LangMode = "bilingual";
  const ui = defaultTemplateUi();
  const hiddenSections: Partial<Record<string, boolean>> = {};
  const hiddenFields: Partial<Record<string, boolean>> = {};
  const hiddenColumns: Partial<Record<string, boolean>> = {};
  const templateStyle: TemplateStyle = "standard";

  const body = {
    doc,
    schema,
    language,
    seller: {
      name: previewCompany.sellerName,
      nameAr: previewCompany.sellerNameAr,
      vatNumber: previewCompany.vatNumber + "-" + "1".repeat(16),
      registrationNumber: previewCompany.registrationNumber,
      addressEn: previewCompany.sellerAddressEn,
      addressAr: previewCompany.sellerAddressAr,
      email: previewCompany.sellerEmail,
      phone: previewCompany.sellerPhone,
    },
    customer: {
      name: customer?.legalName ?? "Customer",
      nameAr: customer?.legalNameAr,
      vatNumber: customer?.vatNumber,
      city: customer?.city,
      country: "SA" as const,
      email: customer?.email,
      phone: customer?.phone,
    },
    ui,
    hiddenSections,
    hiddenFields,
    hiddenColumns,
    templateId: "tmpl-standard",
    templateAssets: {
      logoDataUrl: null as string | null,
      stampDataUrl: null as string | null,
      signatureDataUrl: null as string | null,
      signatoryName: "",
      signatoryDesignation: "",
    },
    templateStyle,
  };

  const url = new URL("/api/workspace/template-studio/pdf", base).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/pdf",
    },
    body: JSON.stringify(body),
  });

  fs.mkdirSync(path.dirname(out), { recursive: true });

  const buf = Buffer.from(await res.arrayBuffer());
  if (!res.ok) {
    fs.writeFileSync(out.replace(/\.pdf$/i, "") + `-error-${res.status}.txt`, buf.toString("utf8"));
    console.error(JSON.stringify({ ok: false, status: res.status, bytes: buf.length, url }));
    process.exit(2);
    return;
  }

  fs.writeFileSync(out, buf);
  console.log(JSON.stringify({ ok: true, status: res.status, bytes: buf.length, path: path.resolve(out), url }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
