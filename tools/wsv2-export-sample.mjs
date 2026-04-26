// One-shot sample generator. Calls V2 export helpers from Node and writes
// sample-invoice.pdf, sample-invoice.xml, sample-qr-payload.txt and
// sample-qr.png into the artifacts/downloaded-samples folder.
//
// Run: node tools/wsv2-export-sample.mjs
//
// This script is V2-scoped; it does not import any production engine.

import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// tsx is loaded via the `--import tsx` flag on the node CLI.

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(
  repoRoot,
  "artifacts",
  "workspace_v2_ui_20260425_170535",
  "downloaded-samples",
);

const url = (rel) => pathToFileURL(join(repoRoot, rel)).href;

const { buildPhase1Qr } = await import(url("lib/workspace-v2/exports/qr.ts"));
const { buildInvoiceUbl } = await import(url("lib/workspace-v2/exports/xml.ts"));
const { buildInvoicePdf } = await import(url("lib/workspace-v2/exports/pdf.ts"));
const { invoices } = await import(url("data/workspace-v2/invoices.ts"));
const { findCustomer } = await import(url("data/workspace-v2/customers.ts"));
const { previewCompany } = await import(url("data/preview-company.ts"));

const doc = invoices[0];
const customer = findCustomer(doc.customerId);

await mkdir(outDir, { recursive: true });

const seller = {
  name: previewCompany.sellerName,
  nameAr: previewCompany.sellerNameAr,
  vatNumber: previewCompany.vatNumber,
  registrationNumber: previewCompany.registrationNumber,
  addressEn: previewCompany.sellerAddressEn,
  email: previewCompany.sellerEmail,
  phone: previewCompany.sellerPhone,
};
const cust = {
  name: customer?.legalName ?? "Customer",
  nameAr: customer?.legalNameAr,
  vatNumber: customer?.vatNumber,
  city: customer?.city,
  country: "SA",
  contact: customer?.email,
};

console.log("Building QR…");
const qr = await buildPhase1Qr({
  sellerName: seller.name,
  vatNumber: seller.vatNumber,
  invoiceTotal: doc.total,
  vatAmount: doc.vat,
  timestamp: new Date(doc.issueDate).toISOString(),
});
const qrPng = Buffer.from(qr.imageDataUrl.split(",")[1], "base64");
await writeFile(join(outDir, "sample-qr.png"), qrPng);
await writeFile(
  join(outDir, "sample-qr-payload.txt"),
  [
    "ZATCA Phase 1 QR foundation",
    "===========================",
    "",
    `Seller name : ${qr.fields.sellerName}`,
    `VAT number  : ${qr.fields.vatNumber}`,
    `Timestamp   : ${qr.fields.timestamp}`,
    `Total       : ${qr.fields.invoiceTotal}`,
    `VAT amount  : ${qr.fields.vatAmount}`,
    "",
    "TLV (hex):",
    qr.payloadHex,
    "",
    "Base64:",
    qr.base64,
    "",
    "Phase 2 fields NOT generated:",
    "  - XML hash",
    "  - digital signature",
    "  - public key",
    "  - cryptographic stamp",
    "  - signed properties",
  ].join("\n"),
);
console.log("  wrote sample-qr.png + sample-qr-payload.txt");

console.log("Building XML…");
const xml = buildInvoiceUbl(doc, seller, cust);
await writeFile(join(outDir, "sample-invoice.xml"), xml);
console.log("  wrote sample-invoice.xml");

console.log("Building PDF…");
const pdf = await buildInvoicePdf({
  doc,
  seller,
  customer: cust,
  qrPngDataUrl: qr.imageDataUrl,
  accentHex: "#3FAE2A",
});
await writeFile(join(outDir, "sample-invoice.pdf"), Buffer.from(pdf.bytes));
console.log("  wrote sample-invoice.pdf");

console.log("");
console.log("All samples in:", outDir);
