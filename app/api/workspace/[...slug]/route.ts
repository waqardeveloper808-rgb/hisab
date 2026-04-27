import { NextRequest, NextResponse } from "next/server";
import { authSessionCookieName, readAuthSessionOutcome } from "@/lib/auth-session";
import { defaultChartOfAccounts, searchAccounts as searchLocalAccounts, type Attachment, type AttachmentDocumentTag } from "@/lib/accounting-engine";
import {
  resolveWorkspaceBackendContext,
  resolveWorkspaceBackendPath,
} from "@/lib/workspace-session";
import {
  renderDocumentPdf,
} from "@/lib/document-engine/index";
import type { CompanyProfileSnapshot, CompanyAssetLike } from "@/lib/document-engine/types";
import { renderWorkspaceDocumentHtml } from "@/lib/workspace-preview";

type BackendCompanySettingsEnvelope = {
  company: {
    legal_name?: string | null;
    trade_name?: string | null;
    tax_number?: string | null;
    registration_number?: string | null;
    base_currency?: string | null;
    locale?: string | null;
    timezone?: string | null;
  };
  settings: {
    numbering_rules?: Record<string, string> | null;
  };
};

type BackendCompanyAsset = {
  id: number;
  usage?: string | null;
  public_url: string;
  is_active: boolean;
};

type BackendDocumentTemplate = {
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

type BackendDocumentLine = {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  gross_amount: number;
  metadata?: {
    custom_fields?: Record<string, string | number | boolean | null> | null;
  } | null;
};

type BackendDocumentDetail = {
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

type InvoiceImpactFilter = {
  invoiceId: number | null;
  invoiceNumber: string;
};

export const dynamic = "force-dynamic";

const allowedRoots = new Set([
  "agents",
  "access-profile",
  "intelligence",
  "invoices",
  "contacts",
  "customers",
  "products",
  "items",
  "services",
  "documents",
  "communications",
  "templates",
  "assets",
  "cost-centers",
  "custom-fields",
  "payments",
  "supplier-payments",
  "settings",
  "users",
  "sales-documents",
  "purchase-documents",
  "reports",
  "accounts",
  "journals",
  "reconciliation",
  "inventory",
]);

function isExplicitPreviewRequest(request: NextRequest) {
  return request.nextUrl.searchParams.get("mode")?.toLowerCase() === "preview"
    || request.headers.get("X-Workspace-Mode")?.toLowerCase() === "preview";
}

function enforceWorkspaceMode(response: NextResponse, mode: "backend" | "preview") {
  response.headers.set("X-Workspace-Mode", mode);
  return response;
}

function normalizePreviewAttachments(value: unknown): Attachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry, index) => {
    const record = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};

    return {
      id: typeof record.id === "number" ? record.id : index + 1,
      fileName: typeof record.fileName === "string" ? record.fileName : `attachment-${index + 1}`,
      fileSize: typeof record.fileSize === "number" ? record.fileSize : 0,
      mimeType: typeof record.mimeType === "string" ? record.mimeType : "application/octet-stream",
      documentTag: typeof record.documentTag === "string" ? (record.documentTag as AttachmentDocumentTag) : "other",
      uploadedBy: typeof record.uploadedBy === "string" ? record.uploadedBy : "Workspace User",
      uploadedAt: typeof record.uploadedAt === "string" ? record.uploadedAt : new Date().toISOString(),
      url: typeof record.url === "string" ? record.url : "#",
      description: typeof record.description === "string" ? record.description : null,
    };
  });
}

function readSettingsMetadata(rules: Record<string, string> | null | undefined, key: string) {
  return rules?.[key] ?? "";
}

function normalizeBackendAssetUrl(baseUrl: string, assetUrl: string | null | undefined) {
  const value = (assetUrl ?? "").trim();
  if (!value) {
    return "";
  }

  try {
    const backendOrigin = new URL(baseUrl).origin;
    const parsed = new URL(value, backendOrigin);

    if (parsed.pathname.startsWith("/storage/") && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")) {
      return `${backendOrigin}${parsed.pathname}${parsed.search}`;
    }

    return parsed.toString();
  } catch {
    return value;
  }
}

function mapBackendCompany(settings: BackendCompanySettingsEnvelope, assets: CompanyAssetLike[]): CompanyProfileSnapshot {
  const rules = settings.settings.numbering_rules ?? {};
  const companyLogo = assets.find((asset) => asset.isActive && (asset.usage ?? "").toLowerCase() === "logo")?.publicUrl ?? null;

  return {
    legalName: settings.company.legal_name ?? "",
    tradeName: settings.company.trade_name ?? "",
    englishName: readSettingsMetadata(rules, "company_english_name"),
    arabicName: readSettingsMetadata(rules, "company_arabic_name"),
    taxNumber: settings.company.tax_number ?? "",
    registrationNumber: settings.company.registration_number ?? "",
    email: readSettingsMetadata(rules, "company_email"),
    phone: readSettingsMetadata(rules, "company_phone"),
    shortAddress: readSettingsMetadata(rules, "company_short_address"),
    addressStreet: readSettingsMetadata(rules, "company_address_street"),
    addressArea: readSettingsMetadata(rules, "company_address_area"),
    addressCity: readSettingsMetadata(rules, "company_address_city"),
    addressPostalCode: readSettingsMetadata(rules, "company_address_postal_code"),
    addressAdditionalNumber: readSettingsMetadata(rules, "company_address_additional_number"),
    addressCountry: readSettingsMetadata(rules, "company_address_country") || "Saudi Arabia",
    baseCurrency: settings.company.base_currency ?? "SAR",
    logoUrl: companyLogo,
  };
}

async function fetchBackendJson<T>(targetUrl: string, actorId: number, apiToken: string, activeCompanyId?: number | null) {
  const response = await fetch(targetUrl, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Gulf-Hisab-Actor-Id": String(actorId),
      "X-Gulf-Hisab-Workspace-Token": apiToken,
      ...(typeof activeCompanyId === "number" && activeCompanyId > 0 ? { "X-Gulf-Hisab-Active-Company-Id": String(activeCompanyId) } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Workspace engine dependency failed: ${targetUrl} returned ${response.status}.`);
  }

  return await response.json() as { data: T };
}

async function fetchBackendTemplateById(params: {
  baseUrl: string;
  companyId: string;
  actorId: number;
  apiToken: string;
  activeCompanyId: number | null;
  templateId?: number | null;
}) {
  if (typeof params.templateId !== "number" || params.templateId <= 0) {
    return null;
  }

  const response = await fetchBackendJson<BackendDocumentTemplate[]>(
    `${params.baseUrl}/api/companies/${params.companyId}/templates`,
    params.actorId,
    params.apiToken,
    params.activeCompanyId,
  );

  return response.data.find((template) => template.id === params.templateId) ?? null;
}

function sanitizeWorkspacePdfFileName(value: string) {
  const base = value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
}

async function renderAuthenticatedDocumentEngine(params: {
  baseUrl: string;
  companyId: string;
  actorId: number;
  apiToken: string;
  activeCompanyId: number | null;
  documentId: number;
  templateId?: number | null;
}): Promise<{ html: string; pdfFileName: string }> {
  const [settingsResponse, assetsResponse] = await Promise.all([
    fetchBackendJson<BackendCompanySettingsEnvelope>(`${params.baseUrl}/api/companies/${params.companyId}/settings`, params.actorId, params.apiToken, params.activeCompanyId),
    fetchBackendJson<BackendCompanyAsset[]>(`${params.baseUrl}/api/companies/${params.companyId}/assets`, params.actorId, params.apiToken, params.activeCompanyId),
  ]);

  const documentResponse = await fetchBackendJson<BackendDocumentDetail>(`${params.baseUrl}/api/companies/${params.companyId}/documents/${params.documentId}`, params.actorId, params.apiToken, params.activeCompanyId);
  const template = await fetchBackendTemplateById(params);

  const assets: CompanyAssetLike[] = assetsResponse.data.map((asset) => ({
    id: asset.id,
    usage: asset.usage,
    publicUrl: normalizeBackendAssetUrl(params.baseUrl, asset.public_url),
    isActive: asset.is_active,
  }));
  const company = mapBackendCompany(settingsResponse.data, assets);
  const document = documentResponse.data;
  const grand = Number(document.grand_total ?? 0);
  const balanceDue = document.balance_due != null && document.balance_due !== undefined ? Number(document.balance_due) : grand;
  const paidTotal =
    document.paid_total != null && document.paid_total !== undefined ? Number(document.paid_total) : Math.max(0, grand - balanceDue);

  const html = await renderWorkspaceDocumentHtml({
    availableAssets: assets,
    template: template
      ? {
          ...template,
          logo_asset: template.logo_asset?.public_url
            ? {
                id: template.logo_asset.id,
                public_url: normalizeBackendAssetUrl(params.baseUrl, template.logo_asset.public_url),
                original_name: template.logo_asset.original_name ?? template.name,
              }
            : null,
        }
      : undefined,
    document: {
      id: document.id,
      type: document.type,
      status: "finalized",
      contact_id: 0,
      document_number: document.document_number,
      issue_date: document.issue_date,
      due_date: document.due_date,
      supply_date: document.supply_date,
      grand_total: Number(document.grand_total ?? 0),
      balance_due: balanceDue,
      paid_total: paidTotal,
      tax_total: Number(document.tax_total ?? 0),
      taxable_total: Number(document.taxable_total ?? 0),
      contact: {
        display_name: document.contact?.display_name ?? "",
      },
      title: document.document_number,
      language_code: "bilingual",
      custom_fields: {
        currency: company.baseCurrency,
        seller_name_en: company.englishName || company.tradeName || company.legalName,
        seller_name_ar: company.arabicName || company.legalName,
        seller_vat_number: company.taxNumber,
        seller_cr_number: company.registrationNumber,
        seller_email: company.email,
        seller_phone: company.phone,
        seller_address_en: company.shortAddress || company.addressStreet,
        seller_address_ar: company.shortAddress || company.addressStreet,
        ...(document.custom_fields ?? {}),
      },
      lines: (document.lines ?? []).map((line) => ({
        id: line.id,
        description: line.description,
        quantity: Number(line.quantity ?? 0),
        unit_price: Number(line.unit_price ?? 0),
        gross_amount: Number(line.gross_amount ?? 0),
        metadata: line.metadata,
      })),
      compliance_metadata: {
        zatca_ready: true,
        xml_ready: true,
        document_mode: document.type,
      },
    },
    contact: document.contact ? {
      id: 0,
      type: "customer",
      display_name: document.contact.display_name ?? "",
      display_name_ar: document.contact.display_name_ar,
      phone: document.contact.phone ?? null,
      vat_number: document.contact.tax_number ?? document.contact.vat_number ?? null,
      billing_address: {
        line_1: document.contact.billing_address?.line_1 ?? null,
        line_1_ar: document.contact.billing_address?.line_1_ar ?? null,
        city: document.contact.billing_address?.city ?? null,
      },
    } : null,
  });

  const pdfFileName = sanitizeWorkspacePdfFileName(document.document_number || `document-${document.id}`);

  return { html, pdfFileName };
}

async function renderAuthenticatedTemplatePreview(params: {
  baseUrl: string;
  companyId: string;
  actorId: number;
  apiToken: string;
  activeCompanyId: number | null;
  payload: Record<string, unknown>;
}) {
  const [settingsResponse, assetsResponse] = await Promise.all([
    fetchBackendJson<BackendCompanySettingsEnvelope>(`${params.baseUrl}/api/companies/${params.companyId}/settings`, params.actorId, params.apiToken, params.activeCompanyId),
    fetchBackendJson<BackendCompanyAsset[]>(`${params.baseUrl}/api/companies/${params.companyId}/assets`, params.actorId, params.apiToken, params.activeCompanyId),
  ]);
  const assets: CompanyAssetLike[] = assetsResponse.data.map((asset) => ({
    id: asset.id,
    usage: asset.usage,
    publicUrl: normalizeBackendAssetUrl(params.baseUrl, asset.public_url),
    isActive: asset.is_active,
  }));
  const company = mapBackendCompany(settingsResponse.data, assets);

  return await renderWorkspaceDocumentHtml({
    availableAssets: assets,
    template: {
      id: 0,
      name: String(params.payload.name ?? "Template Preview"),
      document_types: Array.isArray(params.payload.document_types) ? params.payload.document_types as string[] : [String(params.payload.document_type ?? "tax_invoice")],
      locale_mode: String(params.payload.locale_mode ?? "bilingual"),
      accent_color: String(params.payload.accent_color ?? "#1f7a53"),
      watermark_text: typeof params.payload.watermark_text === "string" ? params.payload.watermark_text : null,
      header_html: typeof params.payload.header_html === "string" ? params.payload.header_html : null,
      footer_html: typeof params.payload.footer_html === "string" ? params.payload.footer_html : null,
      settings: (params.payload.settings as Record<string, string | number | boolean | null> | undefined) ?? {},
      logo_asset_id: typeof params.payload.logo_asset_id === "number" ? params.payload.logo_asset_id : null,
      is_default: Boolean(params.payload.is_default),
      is_active: params.payload.is_active !== false,
    },
    document: {
      id: 0,
      type: String(params.payload.document_type ?? "tax_invoice"),
      status: "draft",
      contact_id: 0,
      document_number: "INV-2026-1101",
      issue_date: "2026-04-22",
      due_date: "2026-04-29",
      supply_date: "2026-04-22",
      grand_total: 4600,
      balance_due: 4600,
      paid_total: 0,
      tax_total: 600,
      taxable_total: 4000,
      contact: { display_name: "Desert Retail Co." },
      title: "Template Preview",
      language_code: "bilingual",
      custom_fields: {
        currency: company.baseCurrency,
        seller_name_en: company.englishName || company.tradeName || company.legalName,
        seller_name_ar: company.arabicName || company.legalName,
        seller_vat_number: company.taxNumber,
        seller_cr_number: company.registrationNumber,
        seller_email: company.email,
        seller_phone: company.phone,
        seller_address_en: company.shortAddress || company.addressStreet,
        seller_address_ar: company.shortAddress || company.addressStreet,
        buyer_name_en: "Desert Retail Co.",
        buyer_name_ar: "شركة صحراء للتجزئة",
        buyer_vat_number: "301112223330003",
        buyer_phone: "+966500000102",
        buyer_address_en: "Prince Sultan Street, Al Zahra, Jeddah 23425, Saudi Arabia",
        buyer_address_ar: "شارع الأمير سلطان، حي الزهراء، جدة 23425، المملكة العربية السعودية",
      },
      lines: [
        {
          id: 1,
          description: "Monthly bookkeeping",
          quantity: 1,
          unit_price: 4000,
          gross_amount: 4000,
          metadata: { custom_fields: { description_ar: "خدمات مسك الدفاتر الشهرية", vat_rate: 15 } },
        },
      ],
      compliance_metadata: {
        zatca_ready: true,
        xml_ready: true,
        document_mode: String(params.payload.document_type ?? "tax_invoice"),
      },
    },
    contact: {
      id: 0,
      type: "customer",
      display_name: "Desert Retail Co.",
      display_name_ar: "شركة صحراء للتجزئة",
      vat_number: "301112223330003",
      phone: "+966500000102",
      billing_address: {
        line_1: "Prince Sultan Street, Al Zahra, Jeddah 23425, Saudi Arabia",
        line_1_ar: "شارع الأمير سلطان، حي الزهراء، جدة 23425، المملكة العربية السعودية",
        city: "Jeddah",
      },
    },
  });
}

function readFirstDocumentTypeFromPayload(payload: Record<string, unknown>): string | undefined {
  const raw = payload.document_types;
  if (!Array.isArray(raw) || raw.length === 0) {
    return undefined;
  }
  const first = raw[0];
  return typeof first === "string" ? first : undefined;
}

async function renderTemplatePdfFromPayload(payload: Record<string, unknown>) {
  const html = await renderPreviewTemplateHtmlPayload(payload);
  const bytes = await renderDocumentPdf(html);
  const documentType = String(payload.document_type ?? readFirstDocumentTypeFromPayload(payload) ?? "tax_invoice");
  const templateName = String(payload.name ?? `${documentType}-template`).trim() || `${documentType}-template`;
  const safeName = templateName.replace(/[^a-zA-Z0-9._-]+/g, "-");

  return {
    bytes,
    fileName: `${safeName}.pdf`,
  };
}

async function renderPreviewTemplateHtmlPayload(payload: Record<string, unknown>) {
  return await renderWorkspaceDocumentHtml({
    template: {
      id: 0,
      name: String(payload.name ?? "Template Preview"),
      document_types: Array.isArray(payload.document_types) ? payload.document_types as string[] : [String(payload.document_type ?? "tax_invoice")],
      locale_mode: String(payload.locale_mode ?? "bilingual"),
      accent_color: String(payload.accent_color ?? "#1f7a53"),
      watermark_text: typeof payload.watermark_text === "string" ? payload.watermark_text : null,
      header_html: typeof payload.header_html === "string" ? payload.header_html : null,
      footer_html: typeof payload.footer_html === "string" ? payload.footer_html : null,
      settings: (payload.settings as Record<string, string | number | boolean | null> | undefined) ?? {},
      logo_asset_id: typeof payload.logo_asset_id === "number" ? payload.logo_asset_id : null,
      is_default: Boolean(payload.is_default),
      is_active: payload.is_active !== false,
    },
    document: {
      id: 0,
      type: String(payload.document_type ?? "tax_invoice"),
      status: "draft",
      contact_id: 102,
      document_number: "INV-2026-1101",
      issue_date: "2026-04-13",
      due_date: "2026-04-20",
      supply_date: "2026-04-13",
      grand_total: 4600,
      balance_due: 4600,
      paid_total: 0,
      tax_total: String(payload.document_type ?? "tax_invoice") === "delivery_note" ? 0 : 600,
      taxable_total: 4000,
      contact: { display_name: "Desert Retail Co." },
      title: "Template Preview Document",
      language_code: "bilingual",
      custom_fields: {
        currency: "SAR",
        seller_name_en: "Hisabix Trading Co.",
        seller_name_ar: "شركة حسبكس التجارية",
        seller_vat_number: "310122393500003",
        seller_cr_number: "1010819065",
        seller_email: "finance@hisabix.local",
        seller_phone: "+966112345678",
        seller_address_en: "King Fahd Road, Riyadh 12214, Saudi Arabia",
        seller_address_ar: "طريق الملك فهد، الرياض 12214، المملكة العربية السعودية",
        buyer_name_en: "Desert Retail Co.",
        buyer_name_ar: "شركة صحراء للتجزئة",
        buyer_vat_number: "301112223330003",
        buyer_phone: "+966500000102",
        buyer_address_en: "Prince Sultan Street, Al Zahra, Jeddah 23425, Saudi Arabia",
        buyer_address_ar: "شارع الأمير سلطان، حي الزهراء، جدة 23425، المملكة العربية السعودية",
      },
      lines: [
        {
          id: 1,
          description: "Monthly bookkeeping",
          quantity: 1,
          unit_price: 4000,
          gross_amount: 4000,
          metadata: { custom_fields: { description_ar: "خدمات مسك الدفاتر الشهرية", vat_rate: 15 } },
        },
      ],
      compliance_metadata: {
        zatca_ready: true,
        xml_ready: true,
        document_mode: String(payload.document_type ?? "tax_invoice"),
      },
    },
    contact: {
      id: 102,
      type: "customer",
      display_name: "Desert Retail Co.",
      display_name_ar: "شركة صحراء للتجزئة",
      vat_number: "301112223330003",
      phone: "+966500000102",
      billing_address: {
        line_1: "Prince Sultan Street, Al Zahra, Jeddah 23425, Saudi Arabia",
        line_1_ar: "شارع الأمير سلطان، حي الزهراء، جدة 23425، المملكة العربية السعودية",
        city: "Jeddah",
      },
    },
  });
}

function readInvoiceImpactFilter(searchParams: URLSearchParams): InvoiceImpactFilter {
  const rawInvoiceId = searchParams.get("invoice_id")?.trim() ?? "";
  const invoiceId = Number(rawInvoiceId);

  return {
    invoiceId: Number.isInteger(invoiceId) && invoiceId > 0 ? invoiceId : null,
    invoiceNumber: (searchParams.get("invoice_number") ?? "").trim(),
  };
}

type ImpactJournalEntry = {
  id: number;
  entry_number: string;
  entry_date: string;
  lines?: Array<{
    account_code?: string | null;
    account_name?: string | null;
    document_id?: number | null;
    document_number?: string | null;
    debit: number | string;
    credit: number | string;
    description?: string | null;
  }>;
};

function toNumeric(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function filterJournalsForInvoice(entries: ImpactJournalEntry[], invoiceId: number) {
  return entries
    .map((entry) => ({
      ...entry,
      lines: (entry.lines ?? []).filter((line) => Number(line.document_id ?? 0) === invoiceId),
    }))
    .filter((entry) => (entry.lines?.length ?? 0) > 0);
}

function buildTrialBalanceDeltaFromJournals(entries: ImpactJournalEntry[]) {
  const accountMap = new Map<string, { code: string; name: string; type: string; debit_total: number; credit_total: number; balance: number }>();

  entries.forEach((entry) => {
    (entry.lines ?? []).forEach((line) => {
      const code = String(line.account_code ?? "").trim();

      if (!code) {
        return;
      }

      const debit = toNumeric(line.debit);
      const credit = toNumeric(line.credit);
      const current = accountMap.get(code) ?? {
        code,
        name: String(line.account_name ?? code),
        type: "impact",
        debit_total: 0,
        credit_total: 0,
        balance: 0,
      };

      current.debit_total += debit;
      current.credit_total += credit;
      current.balance = current.debit_total - current.credit_total;
      accountMap.set(code, current);
    });
  });

  return [...accountMap.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function buildLedgerImpactRowsFromJournals(entries: ImpactJournalEntry[], invoiceNumber: string) {
  let runningId = 900000;
  const rows: Array<{
    id: number;
    entry_number: string;
    entry_date: string;
    account_code: string;
    account_name: string;
    contact_name: string;
    document_number: string;
    cost_center_code: string;
    cost_center_name: string;
    description: string;
    debit: number;
    credit: number;
    running_balance: number;
    reference_document_id: number | null;
  }> = [];

  const runningByAccount = new Map<string, number>();

  entries.forEach((entry) => {
    (entry.lines ?? []).forEach((line) => {
      const accountCode = String(line.account_code ?? "").trim();
      if (!accountCode) {
        return;
      }

      const debit = toNumeric(line.debit);
      const credit = toNumeric(line.credit);
      const currentRunning = runningByAccount.get(accountCode) ?? 0;
      const nextRunning = currentRunning + debit - credit;
      runningByAccount.set(accountCode, nextRunning);

      rows.push({
        id: ++runningId,
        entry_number: entry.entry_number,
        entry_date: entry.entry_date,
        account_code: accountCode,
        account_name: String(line.account_name ?? accountCode),
        contact_name: "",
        document_number: String(line.document_number ?? invoiceNumber ?? entry.entry_number),
        cost_center_code: "IMPACT",
        cost_center_name: "Invoice Impact",
        description: String(line.description ?? "Invoice-linked journal impact"),
        debit,
        credit,
        running_balance: nextRunning,
        reference_document_id: Number(line.document_id ?? 0) || null,
      });
    });
  });

  return rows;
}

async function handle(request: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
  const response = await handleWorkspaceRequest(request, context);

  if (!response.headers.has("X-Workspace-Mode")) {
    response.headers.set("X-Workspace-Mode", "backend");
  }

  return response;
}

async function handleWorkspaceRequest(request: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
  const sessionOutcome = await readAuthSessionOutcome(request.cookies.get(authSessionCookieName)?.value);
  const backendContext = resolveWorkspaceBackendContext(sessionOutcome);
  const { slug } = await context.params;

  if (! slug.length || ! allowedRoots.has(slug[0])) {
    return NextResponse.json({ message: "Unsupported workspace path." }, { status: 404 });
  }

  if (sessionOutcome.status === "guest") {
    if (isExplicitPreviewRequest(request)) {
      return enforceWorkspaceMode(await handlePreviewRequest(request, slug), "preview");
    }

    return NextResponse.json(
      { message: "Workspace session is required. Please sign in to continue." },
      { status: 401 },
    );
  }

  if (sessionOutcome.status === "invalid_session") {
    return NextResponse.json(
      { message: "Invalid workspace session." },
      { status: 401 },
    );
  }

  if (! backendContext.backendConfigured || ! backendContext.backendBaseUrl || ! backendContext.companyId || ! backendContext.actorId || ! backendContext.workspaceToken) {
    return NextResponse.json(
      { message: "Workspace backend is not configured." },
      { status: 503 },
    );
  }

  const backendBaseUrl = backendContext.backendBaseUrl;
  const companyId = backendContext.companyId;
  const actorId = backendContext.actorId;
  const apiToken = backendContext.workspaceToken;
  const backendPath = resolveWorkspaceBackendPath(slug);

  if (request.method === "POST" && slug[0] === "templates" && slug[1] === "preview") {
    const payload = await request.json().catch(() => ({}));
    const html = await renderAuthenticatedTemplatePreview({
      baseUrl: backendBaseUrl,
      companyId,
      actorId,
      apiToken,
      activeCompanyId: backendContext.activeCompanyId,
      payload,
    });
    return NextResponse.json({ data: { html } }, { headers: { "X-Workspace-Mode": "backend" } });
  }

  if (request.method === "POST" && slug[0] === "templates" && slug[1] === "export-pdf") {
    const payload = await request.json().catch(() => ({}));
    const pdf = await renderTemplatePdfFromPayload(payload);
    return new NextResponse(Buffer.from(pdf.bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.fileName}"`,
        "Cache-Control": "no-store",
        "X-Workspace-Mode": "backend",
      },
    });
  }

  if (request.method === "GET" && slug[0] === "documents" && slug[2] === "preview") {
    const { html } = await renderAuthenticatedDocumentEngine({
      baseUrl: backendBaseUrl,
      companyId,
      actorId,
      apiToken,
      activeCompanyId: backendContext.activeCompanyId,
      documentId: Number(slug[1]),
      templateId: request.nextUrl.searchParams.get("template_id") ? Number(request.nextUrl.searchParams.get("template_id")) : null,
    });
    return NextResponse.json({ data: { html } }, { headers: { "X-Workspace-Mode": "backend" } });
  }

  if (request.method === "GET" && slug[0] === "documents" && (slug[2] === "pdf" || slug[2] === "export-pdf")) {
    const { html, pdfFileName } = await renderAuthenticatedDocumentEngine({
      baseUrl: backendBaseUrl,
      companyId,
      actorId,
      apiToken,
      activeCompanyId: backendContext.activeCompanyId,
      documentId: Number(slug[1]),
      templateId: request.nextUrl.searchParams.get("template_id") ? Number(request.nextUrl.searchParams.get("template_id")) : null,
    });
    const bytes = await renderDocumentPdf(html);
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFileName}"`,
        "Cache-Control": "no-store",
        "X-Workspace-Mode": "backend",
      },
    });
  }

  const search = request.nextUrl.search;
  const invoiceImpact = readInvoiceImpactFilter(request.nextUrl.searchParams);
  const targetUrl = `${backendBaseUrl}/api/companies/${companyId}/${backendPath.join("/")}${search}`;
  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : await request.arrayBuffer();

  let response: Response;

  try {
    response = await fetch(targetUrl, {
      method: request.method,
      body,
      cache: "no-store",
      headers: {
        "Accept": slug[slug.length - 1] === "export-pdf" || slug[slug.length - 1] === "pdf" ? "application/pdf,application/octet-stream;q=0.9,*/*;q=0.8" : "application/json",
        ...(request.headers.get("content-type") ? { "Content-Type": request.headers.get("content-type") as string } : {}),
        "X-Gulf-Hisab-Actor-Id": String(actorId),
        "X-Gulf-Hisab-Workspace-Token": apiToken,
        "X-Gulf-Hisab-Active-Company-Id": String(backendContext.activeCompanyId),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workspace proxy request failed.";

    return NextResponse.json(
      {
        message: "Workspace proxy request failed.",
        detail: message,
        target: targetUrl,
      },
      { status: 502 },
    );
  }

  const payload = request.method === "HEAD" || response.status === 204 || response.status === 304
    ? null
    : await response.arrayBuffer();

  const headers = new Headers();
  const contentType = response.headers.get("content-type");
  const contentDisposition = response.headers.get("content-disposition");
  const cacheControl = response.headers.get("cache-control");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (contentDisposition) {
    headers.set("Content-Disposition", contentDisposition);
  }

  if (cacheControl) {
    headers.set("Cache-Control", cacheControl);
  }

  if (
    request.method === "GET"
    && invoiceImpact.invoiceId
    && contentType?.includes("application/json")
    && payload
  ) {
    const parsed = JSON.parse(Buffer.from(payload).toString("utf8")) as { data?: unknown };

    if (slug[0] === "journals" && Array.isArray(parsed.data)) {
      const filteredEntries = filterJournalsForInvoice(parsed.data as ImpactJournalEntry[], invoiceImpact.invoiceId);
      headers.set("X-Workspace-Impact", `invoice:${invoiceImpact.invoiceId}`);
      return NextResponse.json({ data: filteredEntries }, { status: response.status, headers });
    }

    if (slug[0] === "reports" && slug[1] === "general-ledger") {
      const journalPayload = await fetchBackendJson<ImpactJournalEntry[]>(`${backendBaseUrl}/api/companies/${companyId}/journals`, actorId, apiToken, backendContext.activeCompanyId);
      const filteredEntries = filterJournalsForInvoice(journalPayload.data, invoiceImpact.invoiceId);
      const ledgerRows = buildLedgerImpactRowsFromJournals(filteredEntries, invoiceImpact.invoiceNumber);
      headers.set("X-Workspace-Impact", `invoice:${invoiceImpact.invoiceId}`);
      return NextResponse.json({ data: ledgerRows }, { status: response.status, headers });
    }

    if (slug[0] === "reports" && slug[1] === "trial-balance") {
      const journalPayload = await fetchBackendJson<ImpactJournalEntry[]>(`${backendBaseUrl}/api/companies/${companyId}/journals`, actorId, apiToken, backendContext.activeCompanyId);
      const filteredEntries = filterJournalsForInvoice(journalPayload.data, invoiceImpact.invoiceId);
      const trialDelta = buildTrialBalanceDeltaFromJournals(filteredEntries);
      headers.set("X-Workspace-Impact", `invoice:${invoiceImpact.invoiceId}`);
      return NextResponse.json({ data: trialDelta }, { status: response.status, headers });
    }
  }

  return new NextResponse(payload, {
    status: response.status,
    headers,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

async function handlePreviewRequest(request: NextRequest, slug: string[]) {
  const {
    assertExplicitWorkspacePreviewRequest,
    createPreviewAsset,
    createPreviewContact,
    createPreviewDocument,
    createPreviewInventoryAdjustment,
    createPreviewInventoryRecord,
    createPreviewInventorySale,
    createPreviewItem,
    createPreviewJournal,
    createPreviewPayment,
    createPreviewTemplate,
    duplicatePreviewDocument,
    finalizePreviewDocument,
    getPreviewBalanceSheet,
    getPreviewDocumentDetail,
    getPreviewDocumentPdf,
    getPreviewDocumentPreview,
    getPreviewProfitLoss,
    importPreviewStatementLines,
    listPreviewAssets,
    listPreviewAuditTrail,
    listPreviewBankAccounts,
    listPreviewBillsRegister,
    listPreviewContacts,
    listPreviewCostCenters,
    listPreviewCustomFieldDefinitions,
    listPreviewDocuments,
    listPreviewExpenseBreakdown,
    listPreviewGeneralLedger,
    listPreviewInventoryAdjustments,
    listPreviewInventoryStock,
    listPreviewInvoiceRegister,
    listPreviewItems,
    listPreviewJournals,
    listPreviewPayablesAging,
    listPreviewPayments,
    listPreviewProfitByCustomer,
    listPreviewProfitByProduct,
    listPreviewReceivablesAging,
    listPreviewStatementLineCandidates,
    listPreviewStatementLines,
    listPreviewTemplates,
    listPreviewTrialBalance,
    listPreviewVatDetail,
    listPreviewVatPaidDetails,
    listPreviewVatReceivedDetails,
    listPreviewVatSummary,
    matchPreviewStatementLine,
    reconcilePreviewStatementLines,
    renderPreviewTemplateHtml,
    sendPreviewDocument,
    updatePreviewDocument,
    updatePreviewTemplate,
  } = await import("@/lib/workspace-preview");

  assertExplicitWorkspacePreviewRequest(request.nextUrl.searchParams, request.headers.get("X-Workspace-Mode"));

  if (slug[0] === "contacts") {
    if (request.method === "GET") {
      const type = request.nextUrl.searchParams.get("type");
      const contacts = await listPreviewContacts(type === "customer" || type === "supplier" ? type : undefined);
      return NextResponse.json({ data: contacts }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST") {
      const payload = await request.json();
      const created = await createPreviewContact(payload as {
        type: "customer" | "supplier";
        display_name: string;
        email?: string | null;
        phone?: string | null;
        billing_address?: { city?: string | null } | null;
      });
      return NextResponse.json({ data: created }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }
  }

  if (slug[0] === "items") {
    if (request.method === "GET") {
      return NextResponse.json({ data: await listPreviewItems() }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST") {
      const payload = await request.json();
      const created = await createPreviewItem(payload as {
        type: "product" | "service";
        name: string;
        sku?: string | null;
        default_sale_price?: number | null;
        default_purchase_price?: number | null;
      });
      return NextResponse.json({ data: created }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }
  }

  if (slug[0] === "products" || slug[0] === "services") {
    const type = slug[0] === "products" ? "product" : "service";

    if (request.method === "GET" && slug.length === 1) {
      const items = await listPreviewItems();
      return NextResponse.json({ data: items.filter((item) => item.type === type) }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST" && slug.length === 1) {
      const payload = await request.json();
      const created = await createPreviewItem({
        ...(payload as Record<string, unknown>),
        type,
      } as {
        type: "product" | "service";
        name: string;
        sku?: string | null;
        default_sale_price?: number | null;
        default_purchase_price?: number | null;
      });
      return NextResponse.json({ data: created }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }
  }

  if (slug[0] === "assets") {
    if (request.method === "GET") {
      return NextResponse.json({ data: await listPreviewAssets() }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST") {
      const formData = await request.formData();
      const file = formData.get("file");
      const type = String(formData.get("type") ?? "logo").trim();
      const usage = String(formData.get("usage") ?? "logo").trim();

      if (!(file instanceof File)) {
        return NextResponse.json({ message: "Asset file is required." }, { status: 400, headers: { "X-Workspace-Mode": "preview" } });
      }

      const created = await createPreviewAsset({
        type,
        usage,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        bytes: new Uint8Array(await file.arrayBuffer()),
      });

      return NextResponse.json({ data: created }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }
  }

  if (slug[0] === "custom-fields" && request.method === "GET") {
    return NextResponse.json({ data: listPreviewCustomFieldDefinitions() }, { headers: { "X-Workspace-Mode": "preview" } });
  }

  if (slug[0] === "cost-centers" && request.method === "GET") {
    return NextResponse.json({ data: listPreviewCostCenters() }, { headers: { "X-Workspace-Mode": "preview" } });
  }

  if (slug[0] === "templates") {
    if (request.method === "GET" && slug.length === 1) {
      return NextResponse.json({ data: await listPreviewTemplates() }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST" && slug[1] === "preview") {
      const payload = await request.json();
      return NextResponse.json({ data: await renderPreviewTemplateHtml(payload, String(payload.document_type ?? payload.document_types?.[0] ?? "tax_invoice")) }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST" && slug[1] === "export-pdf") {
      const payload = await request.json();
      const pdf = await renderTemplatePdfFromPayload(payload);
      return new NextResponse(Buffer.from(pdf.bytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${pdf.fileName}"`,
          "Cache-Control": "no-store",
          "X-Workspace-Mode": "preview",
        },
      });
    }

    if (request.method === "POST" && slug.length === 1) {
      const payload = await request.json();
      const created = await createPreviewTemplate(payload);
      return NextResponse.json({ data: created }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }

    if ((request.method === "PUT" || request.method === "PATCH") && slug.length === 2) {
      const payload = await request.json();
      const updated = await updatePreviewTemplate(Number(slug[1]), payload);
      return NextResponse.json({ data: updated }, { headers: { "X-Workspace-Mode": "preview" } });
    }
  }

  if (slug[0] === "documents") {
    if (request.method === "GET" && slug.length === 1) {
      const searchParams = request.nextUrl.searchParams;
      const documents = await listPreviewDocuments({
        group: searchParams.get("group"),
        type: searchParams.get("type"),
        status: searchParams.get("status"),
        search: searchParams.get("search"),
        fromDate: searchParams.get("from_date"),
        toDate: searchParams.get("to_date"),
        minTotal: searchParams.get("min_total") ? Number(searchParams.get("min_total")) : null,
        maxTotal: searchParams.get("max_total") ? Number(searchParams.get("max_total")) : null,
      });
      return NextResponse.json({ data: documents }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "GET" && slug.length === 2) {
      const document = await getPreviewDocumentDetail(Number(slug[1]));

      if (!document) {
        return NextResponse.json({ message: "Preview document not found." }, { status: 404 });
      }

      return NextResponse.json({ data: document }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "GET" && slug[2] === "preview") {
      const preview = await getPreviewDocumentPreview(Number(slug[1]), request.nextUrl.searchParams.get("template_id") ? Number(request.nextUrl.searchParams.get("template_id")) : null);

      if (!preview) {
        return NextResponse.json({ message: "Preview document not found." }, { status: 404 });
      }

      return NextResponse.json({ data: preview }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "GET" && (slug[2] === "export-pdf" || slug[2] === "pdf")) {
      const pdf = await getPreviewDocumentPdf(
        Number(slug[1]),
        request.nextUrl.searchParams.get("template_id") ? Number(request.nextUrl.searchParams.get("template_id")) : null,
      );

      if (!pdf) {
        return NextResponse.json({ message: "Preview document not found." }, { status: 404 });
      }

      return new NextResponse(Buffer.from(pdf.bytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${pdf.fileName}"`,
          "Cache-Control": "no-store",
          "X-Workspace-Mode": "preview",
        },
      });
    }

    if (request.method === "POST" && slug[2] === "duplicate") {
      const duplicate = await duplicatePreviewDocument(Number(slug[1]));

      if (!duplicate) {
        return NextResponse.json({ message: "Preview document not found." }, { status: 404 });
      }

      return NextResponse.json({ data: duplicate }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST" && slug[2] === "send") {
      const payload = await request.json().catch(() => ({}));
      const sent = await sendPreviewDocument(Number(slug[1]), payload as { email?: string | null; subject?: string | null });

      if (!sent) {
        return NextResponse.json({ message: "Preview document not found." }, { status: 404 });
      }

      return NextResponse.json({ data: sent }, { headers: { "X-Workspace-Mode": "preview" } });
    }
  }

  if (slug[0] === "sales-documents" || slug[0] === "purchase-documents") {
    const kind = slug[0] === "sales-documents" ? "sales" : "purchase";

    if (request.method === "POST" && slug.length === 1) {
      const payload = await request.json();
      const created = await createPreviewDocument(kind, payload);
      return NextResponse.json({ data: created }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }

    if ((request.method === "PUT" || request.method === "PATCH") && slug.length === 2) {
      const payload = await request.json();
      const updated = await updatePreviewDocument(Number(slug[1]), kind, payload);

      if (!updated) {
        return NextResponse.json({ message: "Preview document not found." }, { status: 404 });
      }

      return NextResponse.json({ data: updated }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST" && slug[2] === "finalize") {
      const finalized = await finalizePreviewDocument(Number(slug[1]));

      if (!finalized) {
        return NextResponse.json({ message: "Preview document not found." }, { status: 404 });
      }

      return NextResponse.json({ data: finalized }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST" && slug[2] === "payments") {
      const payload = await request.json();
      const created = await createPreviewPayment(Number(slug[1]), kind === "sales" ? "incoming" : "outgoing", payload);

      if (!created) {
        return NextResponse.json({ message: "Preview document not found." }, { status: 404 });
      }

      return NextResponse.json({ data: created }, { headers: { "X-Workspace-Mode": "preview" } });
    }
  }

  if (slug[0] === "reports" && request.method === "GET") {
    const impact = readInvoiceImpactFilter(request.nextUrl.searchParams);

    switch (slug[1]) {
      case "invoice-register":
        return NextResponse.json({ data: await listPreviewInvoiceRegister() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "bills-register":
        return NextResponse.json({ data: await listPreviewBillsRegister() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "payments-register":
        return NextResponse.json({ data: await listPreviewPayments() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "trial-balance":
        if (impact.invoiceId) {
          const journals = await listPreviewJournals();
          const filteredEntries = filterJournalsForInvoice(journals as ImpactJournalEntry[], impact.invoiceId);
          return NextResponse.json({ data: buildTrialBalanceDeltaFromJournals(filteredEntries) }, { headers: { "X-Workspace-Mode": "preview", "X-Workspace-Impact": `invoice:${impact.invoiceId}` } });
        }
        return NextResponse.json({ data: await listPreviewTrialBalance() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "vat-summary":
        return NextResponse.json({ data: await listPreviewVatSummary() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "vat-detail":
        return NextResponse.json({ data: await listPreviewVatDetail() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "vat-received-details":
        return NextResponse.json({ data: await listPreviewVatReceivedDetails({ fromDate: request.nextUrl.searchParams.get("from_date"), toDate: request.nextUrl.searchParams.get("to_date") }) }, { headers: { "X-Workspace-Mode": "preview" } });
      case "vat-paid-details":
        return NextResponse.json({ data: await listPreviewVatPaidDetails({ fromDate: request.nextUrl.searchParams.get("from_date"), toDate: request.nextUrl.searchParams.get("to_date") }) }, { headers: { "X-Workspace-Mode": "preview" } });
      case "receivables-aging":
        return NextResponse.json({ data: await listPreviewReceivablesAging() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "payables-aging":
        return NextResponse.json({ data: await listPreviewPayablesAging() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "profit-loss":
        return NextResponse.json({ data: await getPreviewProfitLoss() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "balance-sheet":
        return NextResponse.json({ data: await getPreviewBalanceSheet() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "profit-by-customer":
        return NextResponse.json({ data: await listPreviewProfitByCustomer() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "profit-by-product":
        return NextResponse.json({ data: await listPreviewProfitByProduct() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "expense-breakdown":
        return NextResponse.json({ data: await listPreviewExpenseBreakdown() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "general-ledger":
        if (impact.invoiceId) {
          const journals = await listPreviewJournals();
          const filteredEntries = filterJournalsForInvoice(journals as ImpactJournalEntry[], impact.invoiceId);
          return NextResponse.json({ data: buildLedgerImpactRowsFromJournals(filteredEntries, impact.invoiceNumber) }, { headers: { "X-Workspace-Mode": "preview", "X-Workspace-Impact": `invoice:${impact.invoiceId}` } });
        }
        return NextResponse.json({ data: await listPreviewGeneralLedger() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "audit-trail":
        return NextResponse.json({ data: await listPreviewAuditTrail() }, { headers: { "X-Workspace-Mode": "preview" } });
      default:
        break;
    }
  }

  if (slug[0] === "inventory" && request.method === "GET") {
    if (slug[1] === "stock") {
      return NextResponse.json({ data: await listPreviewInventoryStock() }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (slug[1] === "adjustments") {
      return NextResponse.json({ data: await listPreviewInventoryAdjustments() }, { headers: { "X-Workspace-Mode": "preview" } });
    }
  }

  if (slug[0] === "inventory" && request.method === "POST") {
    const payload = await request.json();

    if (slug[1] === "stock") {
      const stockPayload = payload as {
        item_id?: number | null;
        product_name: string;
        material: string;
        inventory_type: string;
        size: string;
        source: "production" | "purchase";
        code: string;
        quantity_on_hand: number;
        committed_quantity?: number | null;
        reorder_level?: number | null;
        batch_number?: string | null;
        production_date?: string | null;
        recorded_by?: string | null;
        journal_entry_number?: string | null;
        inventory_account_code?: string | null;
        inventory_account_name?: string | null;
        attachments?: unknown;
        document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>;
      };
      const created = await createPreviewInventoryRecord({
        ...stockPayload,
        attachments: normalizePreviewAttachments(stockPayload.attachments),
      });
      return NextResponse.json({ data: created }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }

    if (slug[1] === "adjustments") {
      const adjustmentPayload = payload as {
        inventory_item_id: number;
        quantity_delta: number;
        unit_cost?: number | null;
        reason?: string | null;
        reference?: string | null;
        transaction_date?: string | null;
        attachments?: unknown;
        document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>;
      };
      const created = await createPreviewInventoryAdjustment({
        ...adjustmentPayload,
        attachments: normalizePreviewAttachments(adjustmentPayload.attachments),
      });
      return NextResponse.json({ data: created }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }

    if (slug[1] === "sales") {
      const salePayload = payload as {
        inventory_item_id: number;
        quantity: number;
        unit_price: number;
        unit_cost?: number | null;
        reference?: string | null;
        transaction_date?: string | null;
        proforma_invoice?: string | null;
        tax_invoice?: string | null;
        delivery_note?: string | null;
        attachments?: unknown;
        document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>;
      };
      const created = await createPreviewInventorySale({
        ...salePayload,
        attachments: normalizePreviewAttachments(salePayload.attachments),
      });
      return NextResponse.json({ data: created }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }
  }

  if (slug[0] === "accounts" && request.method === "GET") {
    const search = request.nextUrl.searchParams.get("search") ?? "";
    const classFilter = request.nextUrl.searchParams.get("class");
    let accounts = search ? searchLocalAccounts(search) : defaultChartOfAccounts.filter((a) => a.isActive);
    if (classFilter) accounts = accounts.filter((a) => a.accountClass === classFilter);
    return NextResponse.json({ data: accounts.map((a) => ({
      id: a.id, code: a.code, name: a.name, name_ar: a.nameAr,
      account_class: a.accountClass, group: a.group, subtype: a.subtype,
      normal_balance: a.normalBalance, parent_code: a.parentCode ?? null,
      is_active: a.isActive, allows_posting: a.isPostingAllowed, is_system: a.isSystem,
      balance: 0,
    })) }, { headers: { "X-Workspace-Mode": "preview" } });
  }

  if (slug[0] === "journals" && request.method === "GET") {
    const impact = readInvoiceImpactFilter(request.nextUrl.searchParams);
    if (impact.invoiceId) {
      const journals = await listPreviewJournals();
      const filteredEntries = filterJournalsForInvoice(journals as ImpactJournalEntry[], impact.invoiceId);
      return NextResponse.json({ data: filteredEntries }, { headers: { "X-Workspace-Mode": "preview", "X-Workspace-Impact": `invoice:${impact.invoiceId}` } });
    }
    return NextResponse.json({ data: await listPreviewJournals() }, { headers: { "X-Workspace-Mode": "preview" } });
  }

  if (slug[0] === "journals" && request.method === "POST") {
    const payload = await request.json();
    const created = await createPreviewJournal(payload as {
      entry_date: string;
      posting_date?: string | null;
      reference?: string | null;
      memo?: string | null;
      metadata?: Record<string, unknown> | null;
      lines: Array<{ account_id: number; debit: number; credit: number; description?: string | null; document_id?: number | null; inventory_item_id?: number | null }>;
    });
    return NextResponse.json({ data: created }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
  }

  if (slug[0] === "reconciliation") {
    if (request.method === "GET" && slug[1] === "bank-accounts") {
      return NextResponse.json({ data: await listPreviewBankAccounts() }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "GET" && slug.length === 3 && slug[2] === "statements") {
      return NextResponse.json({
        data: await listPreviewStatementLines(Number(slug[1]), {
          status: request.nextUrl.searchParams.get("status"),
          fromDate: request.nextUrl.searchParams.get("from_date"),
          toDate: request.nextUrl.searchParams.get("to_date"),
        }),
      }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST" && slug.length === 4 && slug[2] === "statements" && slug[3] === "import") {
      const payload = await request.json();
      const result = await importPreviewStatementLines(Number(slug[1]), Array.isArray(payload.lines) ? payload.lines : []);
      return NextResponse.json(result, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "GET" && slug.length === 5 && slug[2] === "statements" && slug[4] === "candidates") {
      return NextResponse.json({ data: await listPreviewStatementLineCandidates(Number(slug[1]), Number(slug[3])) }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST" && slug.length === 5 && slug[2] === "statements" && slug[4] === "match") {
      const payload = await request.json();
      const matched = await matchPreviewStatementLine(Number(slug[1]), Number(slug[3]), Number(payload.journal_line_id));
      return NextResponse.json({ data: matched }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST" && slug.length === 3 && slug[2] === "reconcile") {
      const payload = await request.json();
      const result = await reconcilePreviewStatementLines(Number(slug[1]), Array.isArray(payload.statement_line_ids) ? payload.statement_line_ids : []);
      return NextResponse.json(result, { headers: { "X-Workspace-Mode": "preview" } });
    }
  }

  return NextResponse.json(
    { message: "Preview mode is read-only for this endpoint." },
    { status: 403, headers: { "X-Workspace-Mode": "preview" } },
  );
}
