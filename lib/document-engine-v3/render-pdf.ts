import { generatePdfFromHtml } from "@/lib/pdf/simple-pdf";
import { renderDocumentPreviewV3 } from "./render-html";
import type { V3RenderInput } from "./types";

export async function renderDocumentPdfV3(input: V3RenderInput): Promise<{ html: string; pdfBytes: Uint8Array; qrRendered: boolean; totalsRendered: boolean }> {
  const rendered = renderDocumentPreviewV3(input);
  const pdfBytes = await generatePdfFromHtml(rendered.html);
  return { ...rendered, pdfBytes };
}
