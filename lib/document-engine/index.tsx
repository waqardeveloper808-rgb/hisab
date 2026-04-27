export * from "./html-document";

import { generatePdfFromHtml } from "@/lib/pdf/simple-pdf";
import { buildPrintableDocumentShell, isFullHtmlDocument } from "./html-document";

export async function renderDocumentPdf(bodyHtml: string) {
  const printable = isFullHtmlDocument(bodyHtml) ? bodyHtml : buildPrintableDocumentShell(bodyHtml);
  return generatePdfFromHtml(printable);
}
