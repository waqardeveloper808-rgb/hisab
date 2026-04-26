/**
 * Writes sample bilingual PDFs into artifacts/document_rtl_textsize_print_parity_fix.
 * Run: `npx tsx tools/_artifact_document_pdf_gen.ts`
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { invoices } from "../data/workspace/invoices";
import { creditNotes } from "../data/workspace/credit-notes";
import { quotations } from "../data/workspace/quotations";
import { customers } from "../data/workspace/customers";
import { getSchemaForKind } from "../lib/workspace/document-template-schemas";
import { buildInvoicePdf } from "../lib/workspace/exports/pdf";
import { defaultTemplateUi } from "../lib/workspace/template-ui-settings";
import { previewCompany } from "../data/preview-company";
import type { DocumentRecord } from "../lib/workspace/types";

const artifactDir = join(dirname(fileURLToPath(import.meta.url)), "..", "artifacts", "document_rtl_textsize_print_parity_fix");

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

async function writePdf(name: string, doc: DocumentRecord) {
  const schema = getSchemaForKind(doc.kind);
  const r = await buildInvoicePdf({
    doc,
    schema,
    language: "bilingual",
    seller: seller(),
    customer: customerFor(doc),
    ui: defaultTemplateUi(),
  });
  const p = join(artifactDir, name);
  writeFileSync(p, r.bytes);
  console.log("wrote", p, r.warnings.length ? r.warnings : "ok");
}

async function main() {
  mkdirSync(artifactDir, { recursive: true });
  await writePdf("after-print-ar-en.pdf", invoices[0]!);
  await writePdf("after-print-credit-note.pdf", creditNotes[0]!);
  await writePdf("after-print-quotation.pdf", quotations[0]!);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
