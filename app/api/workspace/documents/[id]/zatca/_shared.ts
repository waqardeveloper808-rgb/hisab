import { previewCompany } from "@/data/preview-company";
import { getCompanySettings, getDocument } from "@/lib/workspace-api";
import { getPreviewDocumentDetail, getPreviewDocumentPreview } from "@/lib/workspace-preview";
import type { CompanySettingsSnapshot } from "@/lib/workspace-api";
import type { ZatcaDocumentInput, ZatcaDocumentKind, ZatcaEnvironment, ZatcaParty } from "@/lib/zatca";
import { getCurrentZatcaSequenceState } from "@/lib/zatca";

export type ZatcaRuntimeMode = "preview" | "backend";

function text(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function detectEnvironment(value: string | null | undefined): ZatcaEnvironment {
  const normalized = text(value, "simulation").toLowerCase();
  if (normalized === "sandbox" || normalized === "production" || normalized === "simulation") {
    return normalized;
  }
  return "simulation";
}

function normalizeAddress(input: {
  street?: string | null;
  city?: string | null;
  postalCode?: string | null;
  additionalNumber?: string | null;
  countryCode?: string | null;
}): ZatcaParty["address"] {
  return {
    street: input.street ?? null,
    city: input.city ?? null,
    postalCode: input.postalCode ?? null,
    additionalNumber: input.additionalNumber ?? null,
    countryCode: input.countryCode ?? "SA",
  };
}

function previewSeller() {
  return {
    name: previewCompany.sellerName,
    vatNumber: previewCompany.vatNumber,
    registrationNumber: previewCompany.registrationNumber,
    email: previewCompany.sellerEmail,
    phone: previewCompany.sellerPhone,
    address: normalizeAddress({
      street: previewCompany.sellerAddressEn,
      countryCode: "SA",
    }),
  } satisfies ZatcaParty;
}

function backendSeller(settings: CompanySettingsSnapshot) {
  return {
    name: settings.company.legalName || settings.company.tradeName || settings.company.englishName || "",
    vatNumber: settings.company.taxNumber,
    registrationNumber: settings.company.registrationNumber,
    email: settings.company.email,
    phone: settings.company.phone,
    address: normalizeAddress({
      street: settings.company.addressStreet || settings.company.shortAddress || "",
      city: settings.company.addressCity || null,
      postalCode: settings.company.addressPostalCode || null,
      additionalNumber: settings.company.addressAdditionalNumber || null,
      countryCode: settings.company.addressCountry || "SA",
    }),
  } satisfies ZatcaParty;
}

function buyerFromDocument(document: {
  contact?: {
    display_name?: string | null;
    display_name_ar?: string | null;
    vat_number?: string | null;
    tax_number?: string | null;
    phone?: string | null;
    billing_address?: {
      line_1?: string | null;
      line_1_ar?: string | null;
      city?: string | null;
    } | null;
  } | null;
  custom_fields?: Record<string, string | number | boolean | null> | null;
}) {
  const cf = document.custom_fields ?? {};
  const contact = document.contact ?? null;
  return {
    name: text(cf.buyer_name_en ?? contact?.display_name, "Customer"),
    vatNumber: text(cf.buyer_vat_number ?? contact?.vat_number ?? contact?.tax_number, ""),
    registrationNumber: null,
    email: null,
    phone: text(cf.buyer_phone ?? contact?.phone, ""),
    address: normalizeAddress({
      street: text(cf.buyer_address_en ?? contact?.billing_address?.line_1, ""),
      city: text(contact?.billing_address?.city, ""),
      countryCode: text(cf.buyer_country, "SA") || "SA",
    }),
  } satisfies ZatcaParty;
}

function lineVatRateFromCustomFields(customFields: Record<string, string | number | boolean | null> | null | undefined) {
  const raw = customFields?.vat_rate ?? customFields?.vatRate;
  const numeric = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (Number.isFinite(numeric)) {
    return numeric > 1 ? numeric / 100 : numeric;
  }
  return 0.15;
}

function lineVatRateFromDocumentLine(line: { metadata?: { custom_fields?: Record<string, string | number | boolean | null> | null } | null }) {
  return lineVatRateFromCustomFields(line.metadata?.custom_fields);
}

function mapLines(document: {
  lines?: Array<{
    id: number | string;
    description: string;
    quantity: number;
    unit_price: number;
    gross_amount: number;
    metadata?: { custom_fields?: Record<string, string | number | boolean | null> | null } | null;
  }> | null;
  taxable_total: number;
  tax_total: number;
  grand_total: number;
}) {
  const lines = document.lines ?? [];
  return lines.map((line, index) => ({
    id: line.id,
    description: line.description,
    quantity: Number(line.quantity ?? 0),
    unitPrice: Number(line.unit_price ?? 0),
    taxableAmount: Number(line.gross_amount ?? 0),
    vatRate: lineVatRateFromDocumentLine(line),
    vatAmount: Number(((Number(line.gross_amount ?? 0) / Math.max(1, document.taxable_total)) * document.tax_total).toFixed(2)),
    total: Number((Number(line.gross_amount ?? 0) + ((Number(line.gross_amount ?? 0) / Math.max(1, document.taxable_total)) * document.tax_total)).toFixed(2)),
    note: index === 0 ? null : null,
  }));
}

function mapBackendLines(document: {
  lines?: Array<{
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    grossAmount: number;
    customFields: Record<string, string | number | boolean | null>;
  }> | null;
  taxableTotal: number;
  taxTotal: number;
  grandTotal: number;
}) {
  const lines = document.lines ?? [];
  return lines.map((line, index) => {
    const taxable = Number(line.grossAmount ?? 0);
    const vat = Number(((taxable / Math.max(1, document.taxableTotal)) * document.taxTotal).toFixed(2));
    return {
      id: line.id,
      description: line.description,
      quantity: Number(line.quantity ?? 0),
      unitPrice: Number(line.unitPrice ?? 0),
      taxableAmount: taxable,
      vatRate: lineVatRateFromCustomFields(line.customFields),
      vatAmount: vat,
      total: Number((taxable + vat).toFixed(2)),
      note: index === 0 ? null : null,
    };
  });
}

function detectDocumentKind(documentType: string): ZatcaDocumentKind {
  if (documentType === "credit_note") return "credit_note";
  if (documentType === "debit_note") return "debit_note";
  if (documentType === "simplified_tax_invoice") return "simplified_tax_invoice";
  return "tax_invoice";
}

function detectScenario(documentType: string, customFields: Record<string, string | number | boolean | null> | null | undefined): ZatcaDocumentInput["scenario"] {
  if (documentType === "credit_note") return "credit_note";
  if (documentType === "debit_note") return "debit_note";
  const category = text(customFields?.zatca_invoice_category ?? customFields?.invoice_category, "").toLowerCase();
  const qrRequired = Boolean(customFields?.zatca_qr_required);
  if (documentType === "simplified_tax_invoice" || category.includes("simplified") || category === "b2c" || qrRequired) {
    return "simplified";
  }
  return "standard";
}

function resolveBillingReference(customFields: Record<string, string | number | boolean | null> | null | undefined) {
  return text(customFields?.source_invoice_number ?? customFields?.linked_invoice_number ?? customFields?.reference, "") || null;
}

function resolvePreviousInvoiceHash(customFields: Record<string, string | number | boolean | null> | null | undefined) {
  return text(customFields?.zatca_previous_invoice_hash ?? customFields?.previous_invoice_hash, "") || null;
}

function resolveInvoiceUuid(document: { id: number; custom_fields?: Record<string, string | number | boolean | null> | null }) {
  return text(document.custom_fields?.zatca_uuid ?? document.custom_fields?.uuid, "") || `INV-${document.id}`;
}

export async function resolveZatcaRuntimeDocument(input: {
  mode: ZatcaRuntimeMode;
  documentId: number;
}) {
  if (input.mode === "preview") {
    const document = await getPreviewDocumentDetail(input.documentId);
    if (!document) {
      return null;
    }

    const preview = await getPreviewDocumentPreview(input.documentId, document.template?.id ?? null);
    const sequence = await getCurrentZatcaSequenceState();
    const customFields = document.custom_fields ?? {};
    const seller = previewSeller();
    const buyer = buyerFromDocument(document);
    const kind = detectDocumentKind(document.type);

    return {
      mode: input.mode,
      document,
      previewHtml: preview?.html ?? "",
      zatcaDocument: {
        documentId: document.id,
        documentNumber: document.document_number,
        documentKind: kind,
        issueDate: document.issue_date,
        issueTime: "12:00:00",
        currency: text(customFields.currency, "SAR"),
        seller,
        buyer,
        lines: mapLines(document),
        subtotal: Number(document.taxable_total ?? 0),
        vatTotal: Number(document.tax_total ?? 0),
        grandTotal: Number(document.grand_total ?? 0),
        previousInvoiceHash: resolvePreviousInvoiceHash(customFields),
        invoiceUuid: resolveInvoiceUuid(document),
        invoiceCounterValue: sequence.icv || null,
        billingReferenceNumber: resolveBillingReference(customFields),
        billingReferenceUuid: null,
        notes: text(customFields.footer_note_en ?? document.notes ?? "", ""),
        environment: detectEnvironment(process.env.ZATCA_ENV),
        scenario: detectScenario(document.type, customFields),
      } satisfies ZatcaDocumentInput,
    };
  }

  const document = await getDocument(input.documentId);
  const companySettings = await getCompanySettings();
  if (!document || !companySettings) {
    return null;
  }

  const sequence = await getCurrentZatcaSequenceState();
  const customFields = document.customFields ?? {};
  const kind = detectDocumentKind(document.type);
  const seller = backendSeller(companySettings);
  const buyer = {
    name: text(customFields.buyer_name_en ?? customFields.customer_name ?? document.contactName, "Customer"),
    vatNumber: text(customFields.buyer_vat_number ?? customFields.vat_number ?? "", "") || null,
    registrationNumber: text(customFields.buyer_cr_number ?? customFields.registration_number ?? "", "") || null,
    email: text(customFields.buyer_email ?? "", "") || null,
    phone: text(customFields.buyer_phone ?? "", "") || null,
    address: normalizeAddress({
      street: text(customFields.buyer_address_en ?? customFields.address ?? "", "") || null,
      city: text(customFields.buyer_city ?? "", "") || null,
      countryCode: text(customFields.buyer_country ?? "SA", "SA") || "SA",
    }),
  } satisfies ZatcaParty;

  return {
    mode: input.mode,
    document,
    previewHtml: "",
    zatcaDocument: {
      documentId: document.id,
      documentNumber: document.number,
      documentKind: kind,
      issueDate: document.issueDate,
      issueTime: "12:00:00",
      currency: text(customFields.currency, companySettings.company.baseCurrency || "SAR"),
      seller,
      buyer,
      lines: mapBackendLines({
        lines: document.lines,
        taxableTotal: Number(document.taxableTotal ?? 0),
        taxTotal: Number(document.taxTotal ?? 0),
        grandTotal: Number(document.grandTotal ?? 0),
      }),
      subtotal: Number(document.taxableTotal ?? 0),
      vatTotal: Number(document.taxTotal ?? 0),
      grandTotal: Number(document.grandTotal ?? 0),
      previousInvoiceHash: resolvePreviousInvoiceHash(customFields),
      invoiceUuid: resolveInvoiceUuid({ id: document.id, custom_fields: customFields }),
      invoiceCounterValue: sequence.icv || null,
      billingReferenceNumber: resolveBillingReference(customFields),
      billingReferenceUuid: null,
      notes: text(document.notes, ""),
      environment: detectEnvironment(companySettings.settings.zatcaEnvironment),
      scenario: detectScenario(document.type, customFields),
    } satisfies ZatcaDocumentInput,
  };
}
