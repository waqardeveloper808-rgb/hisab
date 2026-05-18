/** PDF raster via Playwright (HTML print) — do not import from client components. Safe for API routes and Node tools. */

import { generatePdfFromHtml } from "@/lib/pdf/simple-pdf";
import { buildPrintableDocumentShell, isFullHtmlDocument } from "@/lib/document-engine/html-document";

/** Server-side PDF rasterization entry — must not ship to client bundles. */
export async function renderDocumentPdf(bodyHtml: string, options?: unknown) {
  const printable = isFullHtmlDocument(bodyHtml) ? bodyHtml : buildPrintableDocumentShell(bodyHtml);
  return generatePdfFromHtml(printable, options);
}
