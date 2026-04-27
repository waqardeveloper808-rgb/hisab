import type {
  GuestPreviewContact,
  GuestPreviewDocument,
  GuestPreviewTemplate,
} from "@/lib/document-engine/workspace-v2-guest-pdf-types";

/**
 * Wires V2 element → react-dom static markup → print shell. No *static* import of
 * `react-dom/server` (Turbopack flags that in lib); only dynamic `import()`.
 * WorkspaceDocumentRenderer stays in a separate module from `react-dom/server`.
 */
export async function buildGuestPreviewV2PrintHtml(params: {
  document: GuestPreviewDocument;
  template?: GuestPreviewTemplate;
  contact?: GuestPreviewContact | null;
}): Promise<string> {
  const [{ renderToStaticMarkup }, { buildGuestV2RendererElement }, { buildGuestV2DocumentShell }] = await Promise.all([
    import("react-dom/server"),
    import("@/lib/document-engine/workspace-v2-guest-pdf-element"),
    import("@/lib/document-engine/workspace-v2-guest-pdf-shell"),
  ]);
  const element = await buildGuestV2RendererElement(params);
  const inner = renderToStaticMarkup(element);
  return buildGuestV2DocumentShell(inner, params.document);
}
