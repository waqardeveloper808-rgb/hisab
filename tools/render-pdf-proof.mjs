import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [, , pdfPath, pngPath] = process.argv;

if (!pdfPath || !pngPath) {
  console.error("Usage: node tools/render-pdf-proof.mjs <pdfPath> <pngPath>");
  process.exit(1);
}

if (!existsSync(pdfPath)) {
  console.error(`PDF not found: ${pdfPath}`);
  process.exit(1);
}

const pythonCandidates = [
  process.env.HISAB_PDF_PYTHON,
  "python",
  "python.exe",
  "C:\\Users\\HP\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe",
].filter(Boolean);

const pythonScript = String.raw`from pathlib import Path
import pypdfium2 as pdfium
import sys

pdf_path = Path(sys.argv[1])
png_path = Path(sys.argv[2])
document = pdfium.PdfDocument(str(pdf_path))
page = document[0]
bitmap = page.render(scale=2)
bitmap.to_pil().save(png_path)
`;

for (const python of pythonCandidates) {
  const result = spawnSync(python, ["-c", pythonScript, pdfPath, pngPath], { encoding: "utf8" });
  if (result.status === 0) {
    console.log(`Rendered ${path.basename(pdfPath)} -> ${pngPath}`);
    process.exit(0);
  }
}

console.error("Failed to render PDF proof.");
process.exit(1);
