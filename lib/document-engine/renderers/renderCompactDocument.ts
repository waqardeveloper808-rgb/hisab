import { CompactDocumentTemplate } from "@/lib/document-engine/templates/CompactDocumentTemplate";
import type { DocumentRenderModel } from "@/lib/document-engine/types";

export function renderCompactDocument(model: DocumentRenderModel): string {
  return CompactDocumentTemplate({ model });
}
