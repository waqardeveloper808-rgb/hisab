import { listDocumentTemplatesV3 } from "./template-registry";
import type { V3DocumentType, V3TemplateRecord, V3TemplateStyle } from "./types";

export function resolveDocumentTemplateV3(documentType: V3DocumentType, style: V3TemplateStyle): V3TemplateRecord {
  const exact = listDocumentTemplatesV3(documentType).find((template) => template.style === style);
  if (exact) return exact;
  return listDocumentTemplatesV3(documentType)[0];
}
