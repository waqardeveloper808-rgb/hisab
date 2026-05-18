import {
  normalizeDocumentTypeV3,
  normalizeDocumentV3,
  normalizeStyleV3,
  renderDocumentPdfV3,
  renderDocumentPreviewV3,
} from "@/lib/document-engine-v3";
import type { CompanyProfileSnapshot, CompanyAssetLike } from "@/lib/document-engine/types";
import type { TemplateStyle } from "@/lib/workspace/document-template-schemas";

export type DocumentRenderMode = "backend" | "preview";

export type DocumentRenderSource =
  | "invoice_register"
  | "document_center"
  | "studio"
  | "pdf"
  | "api";

type BackendDocumentLine = {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  gross_amount?: number | null;
  metadata?: {
    custom_fields?: Record<string, string | number | boolean | null> | null;
  } | null;
};

type BackendDocumentLike = {
  id: number;
  type: string;
  document_number: string;
  issue_date: string;
  due_date: string;
  supply_date?: string | null;
  taxable_total: number;
  tax_total: number;
  grand_total: number;
  balance_due?: number | null;
  paid_total?: number | null;
  custom_fields?: Record<string, string | number | boolean | null> | null;
  lines?: BackendDocumentLine[];
  contact?: {
    display_name?: string | null;
    display_name_ar?: string | null;
    phone?: string | null;
    tax_number?: string | null;
    vat_number?: string | null;
    billing_address?: {
      line_1?: string | null;
      line_1_ar?: string | null;
      city?: string | null;
    } | null;
  } | null;
};

type BackendTemplateLike = {
  id: number;
  name: string;
  document_types?: string[] | null;
  locale_mode: string;
  accent_color: string;
  watermark_text?: string | null;
  header_html?: string | null;
  footer_html?: string | null;
  settings?: Record<string, string | number | boolean | null> | null;
  logo_asset_id?: number | null;
  logo_asset?: {
    id: number;
    public_url: string;
    original_name?: string;
  } | null;
  is_default: boolean;
  is_active: boolean;
};

export type DocumentRenderContext = {
  documentId: number;
  documentType: string;
  templateId?: number | null;
  style?: TemplateStyle | null;
  mode: DocumentRenderMode;
  source: DocumentRenderSource;
  document: BackendDocumentLike;
  company: CompanyProfileSnapshot;
  template?: BackendTemplateLike | null;
  contact?: unknown;
  availableAssets?: CompanyAssetLike[];
};

export type DocumentRenderResult = {
  html: string;
  pdfBytes?: Uint8Array;
  resolvedTemplateId: number | null;
  resolvedStyle: TemplateStyle;
  documentType: string;
  qrRequired: boolean;
  qrRendered: boolean;
  totalsRendered: boolean;
  rendererName: "canonical-v3-document-engine";
};

function inferStyle(template?: BackendTemplateLike | null, requested?: TemplateStyle | null): TemplateStyle {
  return requested ?? normalizeStyleV3(template?.settings?.layout, "standard");
}

function isQrRequired(documentType: string) {
  return ["tax_invoice", "credit_note", "debit_note"].includes(documentType);
}

export function resolveDocumentRenderContext(params: DocumentRenderContext) {
  const resolvedStyle = inferStyle(params.template ?? null, params.style ?? null);
  const resolvedTemplateId = params.template?.id ?? (typeof params.templateId === "number" && params.templateId > 0 ? params.templateId : null);
  const normalizedType = normalizeDocumentTypeV3(params.documentType);
  const qrRequired = isQrRequired(normalizedType);

  return {
    ...params,
    documentType: normalizedType,
    resolvedStyle,
    resolvedTemplateId,
    qrRequired,
  };
}

export async function renderDocumentTemplateHtml(params: DocumentRenderContext): Promise<DocumentRenderResult> {
  const context = resolveDocumentRenderContext(params);
  const document = normalizeDocumentV3({
    ...context.document,
    seller: {
      nameEn: context.company.englishName || context.company.tradeName || context.company.legalName,
      nameAr: context.company.arabicName || context.company.legalName,
      vatNumber: context.company.taxNumber,
      phone: context.company.phone,
      addressEn: context.company.shortAddress || context.company.addressStreet || "",
      addressAr: context.company.shortAddress || context.company.addressStreet || "",
    },
    currency: context.company.baseCurrency,
  });

  const rendered = renderDocumentPreviewV3({ document, style: context.resolvedStyle });

  return {
    html: rendered.html,
    resolvedTemplateId: context.resolvedTemplateId,
    resolvedStyle: context.resolvedStyle,
    documentType: context.documentType,
    qrRequired: context.qrRequired,
    qrRendered: rendered.qrRendered,
    totalsRendered: rendered.totalsRendered,
    rendererName: "canonical-v3-document-engine",
  };
}

export async function renderDocumentTemplatePdf(params: DocumentRenderContext): Promise<DocumentRenderResult> {
  const context = resolveDocumentRenderContext(params);
  const document = normalizeDocumentV3({
    ...context.document,
    seller: {
      nameEn: context.company.englishName || context.company.tradeName || context.company.legalName,
      nameAr: context.company.arabicName || context.company.legalName,
      vatNumber: context.company.taxNumber,
      phone: context.company.phone,
      addressEn: context.company.shortAddress || context.company.addressStreet || "",
      addressAr: context.company.shortAddress || context.company.addressStreet || "",
    },
    currency: context.company.baseCurrency,
  });

  const rendered = await renderDocumentPdfV3({ document, style: context.resolvedStyle });

  return {
    html: rendered.html,
    pdfBytes: rendered.pdfBytes,
    resolvedTemplateId: context.resolvedTemplateId,
    resolvedStyle: context.resolvedStyle,
    documentType: context.documentType,
    qrRequired: context.qrRequired,
    qrRendered: rendered.qrRendered,
    totalsRendered: rendered.totalsRendered,
    rendererName: "canonical-v3-document-engine",
  };
}
