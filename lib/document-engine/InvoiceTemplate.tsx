import type { DocumentRenderModel } from "@/lib/document-engine/types";
import { CompactDocumentTemplate } from "@/lib/document-engine/templates/CompactDocumentTemplate";

/** @deprecated Prefer `CompactDocumentTemplate` / `renderCompactDocument` via `buildDocumentHtml`. */
export function InvoiceTemplate({ model }: { model: DocumentRenderModel }) {
  return CompactDocumentTemplate({ model });
}
