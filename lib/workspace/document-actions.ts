import type { TemplateStyle } from "@/lib/workspace/document-template-schemas";

export type WorkspaceDocumentActionMode = "backend" | "preview";

export type DocumentTemplateChoice = {
  key: "standard" | "modern" | "compact";
  label: "Standard" | "Modern" | "Compact";
  documentType: string;
  mode: WorkspaceDocumentActionMode;
};

function buildDocumentActionQuery(templateId?: number | null, mode?: WorkspaceDocumentActionMode, style?: TemplateStyle) {
  const searchParams = new URLSearchParams();

  if (typeof templateId === "number" && Number.isFinite(templateId)) {
    searchParams.set("template_id", String(templateId));
  }

  if (mode === "preview") {
    searchParams.set("mode", "preview");
  }

  if (style) {
    searchParams.set("style", style);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function resolveDocumentTemplateId(
  _documentType: string,
  requestedTemplateId?: number | null,
  _mode: WorkspaceDocumentActionMode = "backend",
) {
  if (typeof requestedTemplateId !== "number" || !Number.isFinite(requestedTemplateId) || requestedTemplateId <= 0) {
    return null;
  }

  return requestedTemplateId;
}

export function buildDocumentPreviewUrl(
  documentType: string,
  documentId: number,
  templateId?: number | null,
  mode: WorkspaceDocumentActionMode = "backend",
  style?: TemplateStyle,
) {
  void documentType;
  return `/api/workspace/documents/${documentId}/preview${buildDocumentActionQuery(templateId, mode, style)}`;
}

export function buildDocumentPdfUrl(
  documentType: string,
  documentId: number,
  templateId?: number | null,
  mode: WorkspaceDocumentActionMode = "backend",
  style?: TemplateStyle,
) {
  void documentType;
  return `/api/workspace/documents/${documentId}/pdf${buildDocumentActionQuery(templateId, mode, style)}`;
}

export function buildDocumentFullPreviewUrl(
  documentType: string,
  documentId: number,
  templateId?: number | null,
  mode: WorkspaceDocumentActionMode = "backend",
  style?: TemplateStyle,
) {
  return buildDocumentPreviewUrl(documentType, documentId, templateId, mode, style);
}

export function getDocumentTemplateOptions(documentType: string, mode: WorkspaceDocumentActionMode = "backend"): DocumentTemplateChoice[] {
  return [
    { key: "standard", label: "Standard", documentType, mode },
    { key: "modern", label: "Modern", documentType, mode },
    { key: "compact", label: "Compact", documentType, mode },
  ];
}
