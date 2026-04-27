/**
 * @deprecated Import path kept for `workspace-preview` dynamic import; implementation is split
 * (see workspace-v2-guest-pdf-orchestrate.ts) to satisfy Next/Turbopack: no react-dom/server
 * in the same static graph as `WorkspaceDocumentRenderer`.
 */
export { buildGuestPreviewV2PrintHtml } from "@/lib/document-engine/workspace-v2-guest-pdf-orchestrate";
export type {
  GuestPreviewContact,
  GuestPreviewDocument,
  GuestPreviewLine,
  GuestPreviewTemplate,
} from "@/lib/document-engine/workspace-v2-guest-pdf-types";
