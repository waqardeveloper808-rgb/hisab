import { existsSync } from "node:fs";

const [, , artifactRoot, baseUrl] = process.argv;

if (!artifactRoot || !baseUrl) {
  console.error("Usage: node tools/proof-pdf-pipeline.mjs <artifactRoot> <baseUrl>");
  process.exit(1);
}

const requiredFiles = [
  "pdf-proof/modern-template-click.pdf",
  "pdf-proof/compact-template-click.pdf",
  "pdf-proof/invoice-register-download.pdf",
  "pdf-rendered/modern-template-click-page-1.png",
  "pdf-rendered/compact-template-click-page-1.png",
  "pdf-rendered/invoice-register-download-page-1.png",
  "screenshots/before-template-preview-modern.png",
  "screenshots/before-template-preview-compact.png",
  "screenshots/compare-modern-preview-vs-pdf.png",
  "screenshots/compare-compact-preview-vs-pdf.png",
];

const missing = requiredFiles.filter((file) => !existsSync(`${artifactRoot}/${file}`));

if (missing.length) {
  console.error(`Missing proof files:\n${missing.map((file) => `- ${file}`).join("\n")}`);
  process.exit(1);
}

console.log(`Proof pipeline artifacts verified for ${baseUrl}`);
