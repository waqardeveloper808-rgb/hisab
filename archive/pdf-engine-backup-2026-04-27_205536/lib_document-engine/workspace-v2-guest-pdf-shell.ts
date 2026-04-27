import { readFileSync } from "node:fs";
import path from "node:path";
import type { GuestPreviewDocument } from "@/lib/document-engine/workspace-v2-guest-pdf-types";

function escapeDocTitle(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

let cachedWorkspaceCss: string | null = null;
function getWorkspaceV2Stylesheet(): string {
  if (cachedWorkspaceCss != null) return cachedWorkspaceCss;
  const cssPath = path.join(process.cwd(), "app", "workspace", "workspace.css");
  try {
    cachedWorkspaceCss = readFileSync(cssPath, "utf8");
  } catch {
    cachedWorkspaceCss = "/* workspace.css not found */";
  }
  return cachedWorkspaceCss;
}

/**
 * Full printable HTML: inlined workspace.css + wsv2 shell wrapping renderer inner HTML.
 */
export function buildGuestV2DocumentShell(innerHtml: string, document: GuestPreviewDocument): string {
  const css = getWorkspaceV2Stylesheet();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeDocTitle(document.document_number || "Document")}</title>
  <style>
${css}
  </style>
</head>
<body style="margin:0;background:var(--wsv2-bg, #f6f7f5);">
  <div data-wsv2 data-wsv2-theme="light" style="min-height:0;background:var(--wsv2-bg, #f6f7f5);">
    <div class="wsv2-doc-paper" data-lang="bilingual">
      ${innerHtml}
    </div>
  </div>
</body>
</html>`;
}
