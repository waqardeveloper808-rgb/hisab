import type {
  GuestPreviewContact,
  GuestPreviewDocument,
  GuestPreviewTemplate,
} from "@/lib/document-engine/workspace-v2-guest-pdf-types";
import { buildGuestCompactPrintHtml } from "@/lib/document-engine/workspace-v2-guest-compact-html";

function previewTemplateToStyle(template: GuestPreviewTemplate | undefined): "standard" | "modern" | "compact" {
  const layout = String(template?.settings?.layout ?? "classic_corporate").trim().toLowerCase();

  if (layout === "modern_carded") {
    return "modern";
  }

  if (layout === "industrial_supply" || layout === "compact_carded" || layout === "compact_dense") {
    return "compact";
  }

  return "standard";
}

function injectStyleVariant(html: string, style: "standard" | "modern" | "compact") {
  if (style === "compact") {
    return html;
  }

  const injectedCss =
    style === "modern"
      ? `
      .cd-document-root {
        --cd-navy: #1e3a8a !important;
        --cd-navy-mid: #1d4ed8 !important;
        --cd-teal: #2563eb !important;
        --cd-teal-soft: #dbeafe !important;
        --cd-accent: #2563eb !important;
        --cd-accent-soft: rgba(37, 99, 235, 0.12) !important;
        background: #eff6ff !important;
      }
      .cd-document-page > .cd-document-root {
        box-shadow: 0 12px 36px rgba(30, 41, 59, 0.12) !important;
        border-radius: 18px !important;
      }
      .cd-header,
      .cd-title-section,
      .cd-doc-meta-panel,
      .cd-customer-card,
      .cd-items-table,
      .cd-totals-card {
        border-radius: 16px !important;
      }
      .cd-doc-meta-panel,
      .cd-customer-card {
        background: #f8fbff !important;
        border-color: rgba(37, 99, 235, 0.18) !important;
      }
      `
      : `
      .cd-document-root {
        --cd-navy: #0f2340 !important;
        --cd-navy-mid: #163a59 !important;
        --cd-teal: #1f7a53 !important;
        --cd-teal-soft: rgba(31, 122, 83, 0.12) !important;
        --cd-accent: #1f7a53 !important;
        --cd-accent-soft: rgba(31, 122, 83, 0.10) !important;
      }
      .cd-document-page > .cd-document-root {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08) !important;
        border-radius: 8px !important;
      }
      `;

  return html.replace("</style>", `${injectedCss}\n    </style>`);
}

/**
 * Printable HTML for guest/workspace PDF: unified Compact Document Template (A4, bilingual header,
 * optional ZATCA module for tax_invoice only). Replaces legacy React → static markup pipeline.
 */
export async function buildGuestPreviewV2PrintHtml(params: {
  document: GuestPreviewDocument;
  template?: GuestPreviewTemplate;
  contact?: GuestPreviewContact | null;
}): Promise<string> {
  const style = previewTemplateToStyle(params.template);
  const html = await buildGuestCompactPrintHtml(params);
  return injectStyleVariant(html, style);
}
