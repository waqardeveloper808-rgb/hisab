/**
 * V2 document inner markup: same React tree as live preview (WorkspaceDocumentRenderer + wsv2-*).
 * This module does NOT import react-dom/server — that stays in guest-v2-pdf-rds.ts
 * and is wired via workspace-v2-guest-pdf-orchestrate.ts (dynamic import only).
 */
import React from "react";
import {
  WorkspaceDocumentRenderer,
  makeRendererCustomer,
  makeRendererSeller,
} from "@/components/workspace/WorkspaceDocumentRenderer";
import { getSchemaForKind, type TemplateStyle } from "@/lib/workspace/document-template-schemas";
import { defaultTemplateUi } from "@/lib/workspace/template-ui-settings";
import type { Customer, DocumentKind, DocumentLine, DocumentRecord, DocumentStatus } from "@/lib/workspace/types";
import { buildPhase1Qr } from "@/lib/workspace/exports/qr";
import { previewCompany } from "@/data/preview-company";
import type { GuestPreviewContact, GuestPreviewDocument, GuestPreviewLine, GuestPreviewTemplate } from "@/lib/document-engine/workspace-v2-guest-pdf-types";

function previewTypeToDocumentKind(docType: string): DocumentKind {
  if (
    docType === "tax_invoice" ||
    docType === "simplified_tax_invoice" ||
    docType === "cash_invoice" ||
    docType === "api_invoice" ||
    docType === "recurring_invoice"
  ) {
    return "invoice";
  }
  if (docType === "quotation") return "quotation";
  if (docType === "proforma_invoice") return "proforma";
  if (docType === "credit_note") return "credit_note";
  if (docType === "debit_note") return "debit_note";
  return "invoice";
}

function previewTemplateToStyle(template: GuestPreviewTemplate | undefined): TemplateStyle {
  const layout = String(template?.settings?.layout ?? "");
  if (layout === "modern_carded") return "modern";
  if (layout === "industrial_supply") return "compact";
  return "standard";
}

function previewTemplateToWorkspaceTemplateId(template: GuestPreviewTemplate | undefined): string {
  if (!template) return "tmpl-standard";
  if (template.id === 802) return "tmpl-modern";
  if (template.id === 803) return "tmpl-compact";
  return "tmpl-standard";
}

function mapPreviewToDocumentStatus(document: GuestPreviewDocument): DocumentStatus {
  const todayIso = new Date().toISOString().slice(0, 10);
  if (document.balance_due <= 0 && document.grand_total > 0) return "paid";
  if (document.paid_total > 0 && document.balance_due > 0) return "partially_paid";
  if (document.balance_due > 0 && document.due_date && document.due_date < todayIso) return "overdue";
  if (document.status === "draft") return "draft";
  if (document.status === "sent") return "sent";
  return "sent";
}

function previewContactToCustomer(contact: GuestPreviewContact | null, document: GuestPreviewDocument): Customer {
  const cf = document.custom_fields ?? {};
  const legalName = String(cf.buyer_name_en ?? contact?.display_name ?? "—");
  const legalNameAr =
    (cf.buyer_name_ar != null && String(cf.buyer_name_ar).trim() !== "" ? String(cf.buyer_name_ar) : null) ??
    contact?.display_name_ar ??
    undefined;
  return {
    id: contact ? `preview-contact-${contact.id}` : "preview-contact-0",
    legalName,
    legalNameAr,
    email: contact?.email ?? undefined,
    phone: (cf.buyer_phone != null ? String(cf.buyer_phone) : null) ?? contact?.phone ?? undefined,
    city: contact?.billing_address?.city ?? undefined,
    vatNumber: (cf.buyer_vat_number != null ? String(cf.buyer_vat_number) : null) ?? contact?.vat_number ?? undefined,
    addressEn: (cf.buyer_address_en != null ? String(cf.buyer_address_en) : null) ?? contact?.billing_address?.line_1 ?? undefined,
    addressAr: (cf.buyer_address_ar != null ? String(cf.buyer_address_ar) : null) ?? contact?.billing_address?.line_1_ar ?? undefined,
    outstandingBalance: document.balance_due,
  };
}

function previewLineToDocumentLine(line: GuestPreviewLine, index: number): DocumentLine {
  const rawVat = line.metadata?.custom_fields?.vat_rate;
  const vatNum = rawVat != null ? Number(rawVat) : 0.15;
  const vatRate = vatNum > 1 ? vatNum / 100 : vatNum;
  return {
    id: `ln-${line.id}-${index}`,
    description: line.description,
    quantity: line.quantity,
    unitPrice: line.unit_price,
    vatRate,
  };
}

function previewDocumentToRecord(document: GuestPreviewDocument, template: GuestPreviewTemplate | undefined): DocumentRecord {
  const kind = previewTypeToDocumentKind(document.type);
  const lines = (document.lines?.length ? document.lines : []).map(previewLineToDocumentLine);
  return {
    id: `preview-doc-${document.id}`,
    number: document.document_number,
    kind,
    customerId: `preview-contact-${document.contact_id}`,
    issueDate: document.issue_date,
    dueDate: document.due_date,
    status: mapPreviewToDocumentStatus(document),
    currency: "SAR",
    subtotal: document.taxable_total,
    vat: document.tax_total,
    total: document.grand_total,
    balance: document.balance_due,
    lines: lines.length > 0
      ? lines
      : [
          {
            id: "ln-fallback-1",
            description: document.title || "—",
            quantity: 1,
            unitPrice: document.taxable_total,
            vatRate: 0.15,
          },
        ],
    notes: document.notes ?? undefined,
    templateId: previewTemplateToWorkspaceTemplateId(template),
  };
}

export type GuestV2ElementParams = {
  document: GuestPreviewDocument;
  template?: GuestPreviewTemplate;
  contact?: GuestPreviewContact | null;
};

/**
 * Returns the same React element tree the live V2 preview uses (before static HTML serialization).
 */
export async function buildGuestV2RendererElement(params: GuestV2ElementParams): Promise<React.ReactElement> {
  const { document, template } = params;
  const contact = params.contact ?? null;
  const record = previewDocumentToRecord(document, template);
  const customer = previewContactToCustomer(contact, document);
  const schema = getSchemaForKind(record.kind);
  const style = previewTemplateToStyle(template);
  let qrDataUrl: string | null = null;
  if (schema.qr.applicable) {
    try {
      const qr = await buildPhase1Qr({
        sellerName: previewCompany.sellerName,
        vatNumber: previewCompany.vatNumber,
        invoiceTotal: record.total,
        vatAmount: record.vat,
        timestamp: new Date(record.issueDate).toISOString(),
      });
      qrDataUrl = qr.imageDataUrl;
    } catch {
      qrDataUrl = null;
    }
  }
  return React.createElement(WorkspaceDocumentRenderer, {
    schema,
    doc: record,
    seller: makeRendererSeller(),
    customer: makeRendererCustomer(customer),
    language: "bilingual",
    style,
    qrImageDataUrl: qrDataUrl,
    ui: defaultTemplateUi(),
    templateId: record.templateId,
  });
}
