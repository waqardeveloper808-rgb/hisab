"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { EntityPicker } from "@/components/workflow/EntityPicker";
import { LineItemsEditor } from "@/components/workflow/LineItemsEditor";
import { QuickCreateContactForm } from "@/components/workflow/QuickCreateContactForm";
import { QuickCreateDialog } from "@/components/workflow/QuickCreateDialog";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { contactToOption, useWorkspaceData } from "@/components/workflow/WorkspaceDataProvider";
import type { ContactKind, ContactRecord, PickerOption, TransactionKind, TransactionLine } from "@/components/workflow/types";
import { calculateLineSubtotal, calculateLineTotal, calculateLineVatAmount, createId, currency } from "@/components/workflow/utils";
import {
  duplicateDocument,
  finalizeTransactionDraft,
  getDocument,
  getCompanySettings,
  getTransactionIntelligence,
  getWorkspaceAccessProfile,
  issueSalesCreditNote,
  issueSalesDebitNote,
  listCostCenters,
  listCustomFieldDefinitions,
  listDocuments,
  listDocumentTemplates,
  listInventoryStock,
  recordDocumentPayment,
  saveTransactionDraft,
  submitTransaction,
  updateTransactionDraft,
  type CostCenterRecord,
  type CustomFieldDefinitionRecord,
  type DocumentDetailRecord,
  type DocumentTemplateRecord,
  type IntelligenceSnapshot,
  type TransactionSubmissionResult,
} from "@/lib/workspace-api";
import { assessMultiCountryReadiness } from "@/lib/country-foundation";
import { buildTransactionIntelligence as buildTransactionIntelligenceFallback } from "@/lib/intelligence-layer";
import { buildSubmissionReadyPayload, getVatDecisionSummary, type SigningConfiguration } from "@/lib/zatca-engine";
import { getAccountingAccessState, getInvoiceAccessState } from "@/lib/subscription-access";
import { mapWorkspaceHref } from "@/lib/workspace-path";

type TransactionFormProps = {
  kind: TransactionKind;
  documentId?: number;
  initialDocumentType?: string;
  displayMode?: "page" | "overlay";
};

const configByKind = {
  invoice: {
    title: "Create invoice",
    editTitle: "Edit sales draft",
    description: "Choose the customer, dates, and line items, then save or issue the invoice.",
    defaultDocumentType: "tax_invoice",
    contactLabel: "Customer",
    contactKind: "customer" as ContactKind,
    actionLabel: "Issue document",
    summaryLabel: "Document total",
    referenceLabel: "Invoice reference",
    typeOptions: ["quotation", "proforma_invoice", "delivery_note", "tax_invoice", "credit_note", "debit_note", "recurring_invoice", "cash_invoice", "api_invoice"],
  },
  bill: {
    title: "Create bill",
    editTitle: "Edit purchase draft",
    description: "Capture supplier documents with purchase context, cost centers, dynamic fields, and final posting from one route.",
    defaultDocumentType: "vendor_bill",
    contactLabel: "Supplier",
    contactKind: "supplier" as ContactKind,
    actionLabel: "Post document",
    summaryLabel: "Document total",
    referenceLabel: "Bill reference",
    typeOptions: ["vendor_bill", "purchase_invoice", "purchase_order"],
  },
};

function isSalesAdjustmentDocumentType(value: string) {
  return value === "credit_note" || value === "debit_note";
}

function mapSourceDocumentToLines(sourceDocument: DocumentDetailRecord): TransactionLine[] {
  return sourceDocument.lines.map((line) => ({
    id: createId("line"),
    itemId: null,
    backendItemId: line.itemBackendId,
    description: line.description,
    quantity: line.quantity,
    price: line.unitPrice,
    costCenterId: line.costCenterId,
    customFields: {
      ...line.customFields,
      source_line_id: line.id,
      vat_rate: line.customFields.vat_rate ?? 15,
    },
  }));
}

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

function normalizeFieldValue(value: string | number | boolean | null | undefined, fieldType: string): string {
  if (fieldType === "boolean") {
    return value ? "true" : "";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isSaudiCompany(country: string | undefined) {
  const value = (country ?? "").toLowerCase();
  return value.includes("saudi") || value.includes("ksa") || value.includes("المملكة");
}

function inferSilentVatRate(contact: ContactRecord | null) {
  if (!contact) {
    return 15;
  }

  if (contact.origin === "outside_ksa") {
    return 0;
  }

  if (contact.origin === "inside_ksa") {
    return 15;
  }

  return isSaudiCompany(contact.country || contact.city) ? 15 : 0;
}

function trackStatus(document: { status: string; paidTotal: number; balanceDue: number; dueDate: string }) {
  if (document.status === "paid") {
    return "Paid";
  }

  if (document.paidTotal > 0 && document.balanceDue > 0) {
    return "Partial";
  }

  if (document.balanceDue > 0 && document.dueDate && document.dueDate < today()) {
    return "Overdue";
  }

  return "Open";
}

function isAuthorizationError(message: string | undefined) {
  const value = message?.toLowerCase() ?? "";
  return value.includes("401") || value.includes("unauthorized") || value.includes("unauthenticated") || value.includes("access") || value.includes("login");
}

function normalizeDocumentWorkflowStatus(document: DocumentDetailRecord | null): "draft" | "issued" | "reported" | "paid" | "overdue" {
  if (!document || document.status === "draft") {
    return "draft";
  }

  if (document.status === "paid" || (document.grandTotal > 0 && document.balanceDue <= 0)) {
    return "paid";
  }

  const dueDate = document.dueDate ? document.dueDate.slice(0, 10) : "";

  if (dueDate && dueDate < today() && document.balanceDue > 0) {
    return "overdue";
  }

  if (document.sentAt) {
    return "reported";
  }

  return "issued";
}

function workflowStatusLabel(status: "draft" | "issued" | "reported" | "paid" | "overdue") {
  return {
    draft: "Draft",
    issued: "Issued",
    reported: "Reported",
    paid: "Paid",
    overdue: "Overdue",
  }[status];
}

function buildDefaultInvoiceCustomFields(kind: TransactionKind): Record<string, string | number | boolean | null> {
  if (kind !== "invoice") {
    return {};
  }

  return {
    supply_date: today(),
    currency: "SAR",
    seller_name_en: "",
    seller_name_ar: "",
    seller_vat_number: "",
    seller_address_en: "",
    seller_address_ar: "",
    buyer_name_en: "",
    buyer_name_ar: "",
    buyer_vat_number: "",
    buyer_address_en: "",
    buyer_address_ar: "",
  };
}

function buildInvoiceCustomFieldsFromSettings(snapshot: Awaited<ReturnType<typeof getCompanySettings>>) {
  if (!snapshot) {
    return null;
  }

  const addressEnglish = [snapshot.company.addressStreet, snapshot.company.addressArea, snapshot.company.addressCity, snapshot.company.addressPostalCode, snapshot.company.addressCountry]
    .filter(Boolean)
    .join(", ");

  return {
    supply_date: today(),
    currency: snapshot.company.baseCurrency || "SAR",
    seller_name_en: snapshot.company.englishName || snapshot.company.tradeName || snapshot.company.legalName,
    seller_name_ar: snapshot.company.arabicName || "",
    seller_vat_number: snapshot.company.taxNumber,
    seller_cr_number: snapshot.company.registrationNumber,
    seller_phone: snapshot.company.phone,
    seller_email: snapshot.company.email,
    seller_address_en: addressEnglish,
    seller_address_ar: snapshot.company.shortAddress || "",
  } satisfies Record<string, string | number | boolean | null>;
}

type SavedWorkflowDraft = {
  kind: TransactionKind;
  documentType: string;
  contactId: string | null;
  reference: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  languageCode: "en" | "ar";
  templateId: number | null;
  documentCostCenterId: number | null;
  documentCustomFields: Record<string, string | number | boolean | null>;
  purchaseContext: { type: string; purpose: string; category: string };
  sourceDocumentId: number | null;
  adjustmentReason: string;
  paymentAmount: string;
  paymentMethod: string;
  paymentReference: string;
  lines: TransactionLine[];
};

type InventoryShortage = {
  lineId: string;
  description: string;
  requested: number;
  available: number;
};

type RecommendedItem = {
  item: import("@/components/workflow/types").ItemRecord;
  lastDocumentNumber: string;
  timesUsed: number;
};

type WorkflowAction = {
  label: string;
  href: string;
};

const workflowDraftStorageKey = "gulf-hisab-workflow-return-draft";

function normalizeSmartText(value: string | number | boolean | null | undefined) {
  return String(value ?? "").trim();
}

function buildWorkflowChainFromDocument(document: { number: string; type: string; customFields: Record<string, unknown> }, fallbackCustomFields: Record<string, string | number | boolean | null>) {
  const customFields = (document.customFields ?? {}) as Record<string, string | number | boolean | null | undefined>;
  const explicitChain = normalizeSmartText(customFields.linked_chain);

  if (explicitChain) {
    return explicitChain;
  }

  const ordered = [
    normalizeSmartText(customFields.linked_proforma_number ?? fallbackCustomFields.linked_proforma_number),
    document.type === "delivery_note"
      ? document.number
      : normalizeSmartText(customFields.delivery_note_number ?? customFields.linked_delivery_note_number ?? fallbackCustomFields.linked_delivery_note_number),
    document.type === "tax_invoice"
      ? document.number
      : normalizeSmartText(customFields.linked_tax_invoice_number ?? fallbackCustomFields.linked_tax_invoice_number),
    normalizeSmartText(customFields.linked_payment_number),
  ].filter(Boolean);

  return ordered.join(" -> ");
}

function buildDraftSnapshot(payload: SavedWorkflowDraft) {
  return JSON.stringify(payload);
}

function parseDraftSnapshot(raw: string | null): SavedWorkflowDraft | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SavedWorkflowDraft;
  } catch {
    return null;
  }
}

export function TransactionForm({ kind, documentId, initialDocumentType, displayMode = "page" }: TransactionFormProps) {
  const config = configByKind[kind];
  const router = useRouter();
  const searchParams = useSearchParams();
  const { basePath } = useWorkspacePath();
  const { createContact, customers, suppliers, searchContacts, items } = useWorkspaceData();
  const [selectedContact, setSelectedContact] = useState<PickerOption | null>(null);
  const [selectedContactRecord, setSelectedContactRecord] = useState<ContactRecord | null>(null);
  const [contactValidation, setContactValidation] = useState<string | undefined>();
  const [lineValidation, setLineValidation] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [complianceDetailsOpen, setComplianceDetailsOpen] = useState(false);
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);
  const [submitResult, setSubmitResult] = useState<TransactionSubmissionResult | null>(null);
  const [companySettings, setCompanySettings] = useState<Awaited<ReturnType<typeof getCompanySettings>> | null>(null);
  const [workspaceAccessProfile, setWorkspaceAccessProfile] = useState<Awaited<ReturnType<typeof getWorkspaceAccessProfile>> | null>(null);
  const [autofillSuggestions, setAutofillSuggestions] = useState<Record<string, string>>({});
  const [confirmedAutofillFields, setConfirmedAutofillFields] = useState<Record<string, boolean>>({});
  const [recommendedItems, setRecommendedItems] = useState<RecommendedItem[]>([]);
  const [inventoryWarnings, setInventoryWarnings] = useState<Record<string, { available: number; requested: number; productName: string }>>({});
  const [zatcaDuplicateOpen, setZatcaDuplicateOpen] = useState(false);
  const [duplicatingIssuedDocument, setDuplicatingIssuedDocument] = useState(false);
  const [shortages, setShortages] = useState<InventoryShortage[]>([]);
  const [shortageDialogOpen, setShortageDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingEditor, setLoadingEditor] = useState(Boolean(documentId));
  const [loadedDocument, setLoadedDocument] = useState<DocumentDetailRecord | null>(null);
  const [hydratedDocumentId, setHydratedDocumentId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<DocumentTemplateRecord[]>([]);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinitionRecord[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenterRecord[]>([]);
  const [backendTransactionIntelligence, setBackendTransactionIntelligence] = useState<IntelligenceSnapshot | null>(null);
  const [reference, setReference] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentType, setDocumentType] = useState(
    initialDocumentType && config.typeOptions.includes(initialDocumentType)
      ? initialDocumentType
      : config.defaultDocumentType,
  );
  const [issueDate, setIssueDate] = useState("2026-04-13");
  const [dueDate, setDueDate] = useState("2026-04-20");
  const [notes, setNotes] = useState("");
  const [languageCode, setLanguageCode] = useState<"en" | "ar">("en");
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [documentCostCenterId, setDocumentCostCenterId] = useState<number | null>(null);
  const [documentCustomFields, setDocumentCustomFields] = useState<Record<string, string | number | boolean | null>>(buildDefaultInvoiceCustomFields(kind));
  const [purchaseContext, setPurchaseContext] = useState({ type: "", purpose: "", category: "" });
  const [availableSourceDocuments, setAvailableSourceDocuments] = useState<DocumentDetailRecord[]>([]);
  const [sourceDocumentId, setSourceDocumentId] = useState<number | null>(null);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [lines, setLines] = useState<TransactionLine[]>([
    {
      id: createId("line"),
      itemId: null,
      backendItemId: null,
      description: "",
      quantity: 1,
      price: 0,
      costCenterId: null,
      customFields: {},
    },
  ]);
  const sourceDocumentQuery = searchParams.get("sourceDocumentId");
  const linkedProformaQuery = searchParams.get("linkedProforma");
  const linkedDeliveryQuery = searchParams.get("linkedDelivery");
  const linkedTaxQuery = searchParams.get("linkedTax");
  const resumeDraftQuery = searchParams.get("resumeDraft");
  const [draftContactName, setDraftContactName] = useState("");
  const [createContactOpen, setCreateContactOpen] = useState(false);
  const notesId = `${kind}-notes`;
  const activeDocumentId = documentId ?? loadedDocument?.id ?? null;
  const workflowStatus = normalizeDocumentWorkflowStatus(loadedDocument);
  const readOnlyDocument = Boolean(loadedDocument && workflowStatus !== "draft");
  const readOnlyLabel = workflowStatusLabel(workflowStatus);
  const isSalesAdjustment = kind === "invoice" && isSalesAdjustmentDocumentType(documentType);
  const isProforma = kind === "invoice" && documentType === "proforma_invoice";
  const isDeliveryNote = kind === "invoice" && documentType === "delivery_note";
  const isTaxInvoice = kind === "invoice" && ["tax_invoice", "cash_invoice", "api_invoice"].includes(documentType);
  const isCreditNote = kind === "invoice" && documentType === "credit_note";
  const canSaveDraft = !isCreditNote;
  const activeCurrency = String(documentCustomFields.currency ?? "SAR");
  const workflowChain = submitResult
    ? buildWorkflowChainFromDocument(submitResult.document, documentCustomFields)
    : "";
  const vatDecision = useMemo(() => getVatDecisionSummary({
    documentType,
    sellerCountry: String(companySettings?.company.addressCountry || "Saudi Arabia"),
    buyerCountry: String(documentCustomFields.buyer_address_en || "Saudi Arabia"),
    currency: activeCurrency,
    buyerVatNumber: normalizeSmartText(documentCustomFields.buyer_vat_number),
    lineCount: lines.length,
    hasGoods: lines.some((line) => Boolean(line.itemId || line.backendItemId)),
  }), [activeCurrency, companySettings?.company.addressCountry, documentCustomFields.buyer_address_en, documentCustomFields.buyer_vat_number, documentType, lines]);
  const fallbackTransactionIntelligence = useMemo(() => buildTransactionIntelligenceFallback({
    lines,
    selectedContact: selectedContactRecord,
    contacts: [...customers, ...suppliers],
    items,
    issueDate,
    dueDate,
    paymentAmount: Number(paymentAmount || 0),
  }), [customers, dueDate, issueDate, items, lines, paymentAmount, selectedContactRecord, suppliers]);
  const transactionIntelligence = backendTransactionIntelligence ?? fallbackTransactionIntelligence;
  const workflowGuidance = useMemo(() => {
    const actions: Array<{ title: string; detail: string; tone: "primary" | "warning" | "neutral" }> = [];

    if (!selectedContactRecord) {
      actions.push({ title: "Select the counterparty first", detail: kind === "invoice" ? "Customer identity unlocks item suggestions, VAT defaults, and workflow recommendations." : "Supplier identity unlocks purchasing defaults and posting context.", tone: "warning" });
    }

    if (kind === "invoice" && selectedContactRecord && recommendedItems.length) {
      actions.push({ title: "Suggested items are ready", detail: `Use ${recommendedItems[0]?.item.name ?? "frequent items"} to accelerate repeat sales for this customer.`, tone: "primary" });
    }

    if (kind === "invoice" && isDeliveryNote) {
      actions.push({ title: "Next step after delivery", detail: "Finalize stock release, then generate a tax invoice from the same document chain.", tone: "primary" });
    }

    if (kind === "invoice" && isTaxInvoice) {
      actions.push({ title: "Accounting posting path", detail: "Finalization posts revenue and VAT. Record payment next to complete receivable settlement.", tone: "primary" });
    }

    if (isSalesAdjustment) {
      actions.push({ title: "Adjustment control", detail: "Keep the original invoice linked so journal reversals and audit trace remain complete.", tone: "neutral" });
    }

    for (const reminder of transactionIntelligence.reminders.slice(0, 2)) {
      actions.push({ title: reminder.label, detail: reminder.reason, tone: reminder.priority === "high" ? "warning" : "neutral" });
    }

    return actions.slice(0, 4);
  }, [isDeliveryNote, isSalesAdjustment, isTaxInvoice, kind, recommendedItems, selectedContactRecord, transactionIntelligence.reminders]);
  const countryReadiness = useMemo(() => assessMultiCountryReadiness({
    sellerCountryCode: companySettings?.company.addressCountry || "",
    buyerCountryCode: selectedContactRecord?.country || String(documentCustomFields.buyer_address_en || ""),
    currency: activeCurrency,
  }), [activeCurrency, companySettings?.company.addressCountry, documentCustomFields.buyer_address_en, selectedContactRecord?.country]);
  const signingConfiguration = useMemo<SigningConfiguration>(() => ({
    certificatePem: "PHASE2_PENDING_CERTIFICATE",
    privateKeyPem: "PHASE2_PENDING_PRIVATE_KEY",
    certificateSerialNumber: "PHASE2-STUB-CERT",
    issuerName: "Hisabix Phase 2",
  }), []);
  const zatcaSubmissionPreview = useMemo(() => {
    if (kind !== "invoice" || !selectedContactRecord || !lines.length || !companySettings?.company.legalName || !companySettings.company.taxNumber) {
      return null;
    }

    const issueTime = "12:00:00";
    const taxableTotal = lines.reduce((sum, line) => sum + (line.quantity * line.price), 0);
    const taxTotal = lines.reduce((sum, line) => sum + ((Number(line.customFields.vat_rate ?? inferSilentVatRate(selectedContactRecord)) / 100) * line.quantity * line.price), 0);
    const grandTotal = taxableTotal + taxTotal;
    const sellerName = String(documentCustomFields.seller_name_en || companySettings.company.tradeName || companySettings.company.legalName || "");
    const sellerVatNumber = String(documentCustomFields.seller_vat_number || companySettings.company.taxNumber || "");

    return buildSubmissionReadyPayload({
      xmlInput: {
        uuid: `phase2-${activeDocumentId ?? "draft"}-${issueDate}`,
        invoiceNumber: reference || `DRAFT-${issueDate}`,
        issueDate,
        issueTime,
        invoiceTypeCode: documentType === "credit_note" ? "381" : documentType === "debit_note" ? "383" : "388",
        currencyCode: activeCurrency,
        seller: {
          name: sellerName,
          vatNumber: sellerVatNumber,
          crNumber: String(companySettings?.company.registrationNumber || ""),
          address: {
            street: String(companySettings?.company.addressStreet || ""),
            city: String(companySettings?.company.addressCity || ""),
            postalCode: String(companySettings?.company.addressPostalCode || ""),
            countryCode: countryReadiness.sellerCountry.code,
          },
        },
        buyer: {
          name: selectedContactRecord.displayName,
          vatNumber: selectedContactRecord.vatNumber,
          address: {
            street: selectedContactRecord.street,
            city: selectedContactRecord.city,
            postalCode: selectedContactRecord.postalCode,
            countryCode: countryReadiness.buyerCountry.code,
          },
        },
        lines: lines.map((line, index) => ({
          id: line.id || String(index + 1),
          description: line.description || `Line ${index + 1}`,
          quantity: line.quantity,
          unitPrice: line.price,
          taxableAmount: line.quantity * line.price,
          taxAmount: (Number(line.customFields.vat_rate ?? inferSilentVatRate(selectedContactRecord)) / 100) * line.quantity * line.price,
          taxRate: Number(line.customFields.vat_rate ?? inferSilentVatRate(selectedContactRecord)),
        })),
        taxableTotal,
        taxTotal,
        grandTotal,
      },
      hashInput: {
        uuid: `phase2-${activeDocumentId ?? "draft"}-${issueDate}`,
        issueDate,
        issueTime,
        invoiceTotal: grandTotal.toFixed(2),
        vatTotal: taxTotal.toFixed(2),
        sellerVatNumber,
      },
      signingConfig: signingConfiguration,
      qrPayloadInput: {
        sellerName,
        vatNumber: sellerVatNumber,
        timestamp: `${issueDate}T${issueTime}`,
        invoiceTotal: grandTotal.toFixed(2),
        vatTotal: taxTotal.toFixed(2),
      },
      mode: "reporting",
    });
  }, [activeCurrency, activeDocumentId, companySettings, countryReadiness.buyerCountry.code, countryReadiness.sellerCountry.code, documentCustomFields, documentType, issueDate, kind, lines, reference, selectedContactRecord, signingConfiguration]);
  const workflowActions = useMemo(() => {
    if (!submitResult) {
      return [] as WorkflowAction[];
    }

    const nextActions: WorkflowAction[] = [];
    const documentNumber = submitResult.document.number;
    const sourceId = submitResult.document.id;

    if (submitResult.document.type === "delivery_note") {
      nextActions.push({
        label: "Create Proforma Invoice",
        href: mapWorkspaceHref(`/workspace/invoices/new?documentType=proforma_invoice&sourceDocumentId=${sourceId}&linkedDelivery=${encodeURIComponent(documentNumber)}`, basePath),
      });
      nextActions.push({
        label: "Create Tax Invoice",
        href: mapWorkspaceHref(`/workspace/invoices/new?documentType=tax_invoice&sourceDocumentId=${sourceId}&linkedDelivery=${encodeURIComponent(documentNumber)}`, basePath),
      });
    }

    if (submitResult.document.type === "proforma_invoice") {
      nextActions.push({
        label: "Create Delivery Note",
        href: mapWorkspaceHref(`/workspace/invoices/new?documentType=delivery_note&sourceDocumentId=${sourceId}&linkedProforma=${encodeURIComponent(documentNumber)}`, basePath),
      });
      nextActions.push({
        label: "Create Tax Invoice",
        href: mapWorkspaceHref(`/workspace/invoices/new?documentType=tax_invoice&sourceDocumentId=${sourceId}&linkedProforma=${encodeURIComponent(documentNumber)}`, basePath),
      });
    }

    if (submitResult.document.type === "tax_invoice") {
      nextActions.push({
        label: "Create Delivery Note",
        href: mapWorkspaceHref(`/workspace/invoices/new?documentType=delivery_note&sourceDocumentId=${sourceId}&linkedTax=${encodeURIComponent(documentNumber)}`, basePath),
      });
      nextActions.push({
        label: "Issue Credit Note",
        href: mapWorkspaceHref(`/workspace/invoices/new?documentType=credit_note&sourceDocumentId=${sourceId}&linkedTax=${encodeURIComponent(documentNumber)}`, basePath),
      });
      nextActions.push({
        label: "Issue Debit Note",
        href: mapWorkspaceHref(`/workspace/invoices/new?documentType=debit_note&sourceDocumentId=${sourceId}&linkedTax=${encodeURIComponent(documentNumber)}`, basePath),
      });
      nextActions.push({
        label: "Record Payment",
        href: mapWorkspaceHref("/workspace/user/payments", basePath),
      });
      nextActions.push({
        label: "Open Invoice Register",
        href: mapWorkspaceHref("/workspace/user/invoices", basePath),
      });
    }

    return nextActions;
  }, [basePath, submitResult]);
  useEffect(() => {
    let active = true;
    const populatedLines = lines.filter((line) => line.description.trim() || line.itemId || line.backendItemId);

    if (populatedLines.length === 0) {
      setBackendTransactionIntelligence(null);
      return () => {
        active = false;
      };
    }

    getTransactionIntelligence({
      contactId: selectedContactRecord?.backendId ?? null,
      documentType,
      issueDate,
      dueDate,
      paymentAmount: Number(paymentAmount || 0),
      lines: populatedLines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.price,
      })),
    }).then((result) => {
      if (active) {
        setBackendTransactionIntelligence(result);
      }
    });

    return () => {
      active = false;
    };
  }, [documentType, dueDate, issueDate, lines, paymentAmount, selectedContactRecord?.backendId]);
  const invoiceAccessState = useMemo(() => getInvoiceAccessState(workspaceAccessProfile), [workspaceAccessProfile]);
  const accountingAccessState = useMemo(() => getAccountingAccessState(workspaceAccessProfile), [workspaceAccessProfile]);

  useEffect(() => {
    let active = true;

    Promise.all([listDocumentTemplates(), listCustomFieldDefinitions(), listCostCenters(true), getCompanySettings(), getWorkspaceAccessProfile()])
      .then(([nextTemplates, nextFields, nextCostCenters, companySettings, nextAccessProfile]) => {
        if (!active) {
          return;
        }

        setCompanySettings(companySettings);
        setWorkspaceAccessProfile(nextAccessProfile);
        setTemplates(nextTemplates);
        setCustomFieldDefinitions(nextFields);
        setCostCenters(nextCostCenters);

        if (!documentId && nextTemplates.length > 0) {
          const preferredTemplate = nextTemplates.find((template) => template.isDefault && template.isActive && (template.documentTypes.length === 0 || template.documentTypes.includes(documentType)))
            ?? nextTemplates.find((template) => template.isActive && (template.documentTypes.length === 0 || template.documentTypes.includes(documentType)))
            ?? null;

          if (preferredTemplate) {
            setTemplateId((current) => current ?? preferredTemplate.id);
          }
        }

        if (kind === "invoice" && !documentId) {
          const settingsFields = buildInvoiceCustomFieldsFromSettings(companySettings);

          if (settingsFields) {
            setDocumentCustomFields((current) => ({
              ...settingsFields,
              ...current,
            }));
          }
        }
      })
      .catch((err: unknown) => {
        console.error('[TransactionForm] settings/templates fetch failed:', err);
        if (active) {
          setTemplates([]);
          setCustomFieldDefinitions([]);
          setCostCenters([]);
        }
      });

    return () => {
      active = false;
    };
  }, [documentId, kind]);

  useEffect(() => {
    if (kind !== "invoice" || !companySettings) {
      return;
    }

    const saudiDefaults = isSaudiCompany(companySettings.company.addressCountry)
      ? {
          currency: documentCustomFields.currency || companySettings.company.baseCurrency || "SAR",
          vat_country: "KSA",
        }
      : null;

    if (!saudiDefaults) {
      return;
    }

    setDocumentCustomFields((current) => ({
      ...saudiDefaults,
      ...current,
    }));
  }, [companySettings, documentCustomFields.currency, kind]);

  useEffect(() => {
    if (documentId) {
      return;
    }

    if (initialDocumentType && config.typeOptions.includes(initialDocumentType)) {
      setDocumentType(initialDocumentType);
      return;
    }

    setDocumentType(config.defaultDocumentType);
  }, [config.defaultDocumentType, config.typeOptions, documentId, initialDocumentType]);

  useEffect(() => {
    if (documentId || !resumeDraftQuery || typeof window === "undefined") {
      return;
    }

    const snapshot = parseDraftSnapshot(window.sessionStorage.getItem(workflowDraftStorageKey));

    if (!snapshot || snapshot.kind !== kind) {
      return;
    }

    setDocumentType(snapshot.documentType);
    setReference(snapshot.reference);
    setIssueDate(snapshot.issueDate);
    setDueDate(snapshot.dueDate);
    setNotes(snapshot.notes);
    setLanguageCode(snapshot.languageCode);
    setTemplateId(snapshot.templateId);
    setDocumentCostCenterId(snapshot.documentCostCenterId);
    setDocumentCustomFields(snapshot.documentCustomFields);
    setPurchaseContext(snapshot.purchaseContext);
    setSourceDocumentId(snapshot.sourceDocumentId);
    setAdjustmentReason(snapshot.adjustmentReason);
    setPaymentAmount(snapshot.paymentAmount);
    setPaymentMethod(snapshot.paymentMethod);
    setPaymentReference(snapshot.paymentReference);
    setLines(snapshot.lines.length ? snapshot.lines : lines);

    const restoredContact = [...customers, ...suppliers].find((contact) => contact.id === snapshot.contactId) ?? null;
    if (restoredContact) {
      setSelectedContact(contactToOption(restoredContact));
      setSelectedContactRecord(restoredContact);
    }

    window.sessionStorage.removeItem(workflowDraftStorageKey);
  }, [customers, documentId, kind, lines, resumeDraftQuery, suppliers]);

  useEffect(() => {
    if (documentId) {
      return;
    }

    if (linkedProformaQuery) {
      setDocumentCustomFields((current) => ({ ...current, linked_proforma_number: current.linked_proforma_number || linkedProformaQuery }));
    }

    if (linkedDeliveryQuery) {
      setDocumentCustomFields((current) => ({ ...current, linked_delivery_note_number: current.linked_delivery_note_number || linkedDeliveryQuery }));
    }

    if (linkedTaxQuery) {
      setDocumentCustomFields((current) => ({ ...current, linked_tax_invoice_number: current.linked_tax_invoice_number || linkedTaxQuery }));
    }
  }, [documentId, linkedDeliveryQuery, linkedProformaQuery, linkedTaxQuery]);

  useEffect(() => {
    if (!sourceDocumentQuery || documentId || sourceDocumentId) {
      return;
    }

    const nextSourceDocumentId = Number(sourceDocumentQuery);
    if (!Number.isFinite(nextSourceDocumentId) || nextSourceDocumentId <= 0) {
      return;
    }

    setSourceDocumentId(nextSourceDocumentId);
    void (async () => {
      const sourceDocument = availableSourceDocuments.find((document) => document.id === nextSourceDocumentId)
        ?? await getDocument(nextSourceDocumentId);
      const availableContacts = [...customers, ...suppliers];
      const matchedContact = availableContacts.find((contact) => contact.backendId === sourceDocument.contactBackendId) ?? null;

      if (matchedContact) {
        setSelectedContact(contactToOption(matchedContact));
        setSelectedContactRecord(matchedContact);
      }

      setReference(sourceDocument.number);
      setLines(mapSourceDocumentToLines(sourceDocument));
      setTemplateId(sourceDocument.templateId ?? null);
      setDocumentCostCenterId(sourceDocument.costCenterId ?? null);
      setDocumentCustomFields((current) => ({
        ...current,
        ...sourceDocument.customFields,
        source_invoice_number: sourceDocument.number,
      }));
    })();
  }, [availableSourceDocuments, customers, documentId, sourceDocumentId, sourceDocumentQuery, suppliers]);

  useEffect(() => {
    if (!documentId) {
      return;
    }

    let active = true;
    setLoadingEditor(true);
    setSubmitError(undefined);

    getDocument(documentId)
      .then((document) => {
        if (active) {
          setLoadedDocument(document);
        }
      })
      .catch((error) => {
        if (active) {
          const message = error instanceof Error ? error.message : "This document could not be loaded.";
          setSubmitError(isAuthorizationError(message)
            ? "Sign in with workspace access to open this invoice."
            : "This document could not be loaded.");
        }
      })
      .finally(() => {
        if (active) {
          setLoadingEditor(false);
        }
      });

    return () => {
      active = false;
    };
  }, [documentId]);

  useEffect(() => {
    if (kind !== "invoice" || !isSalesAdjustmentDocumentType(documentType)) {
      setAvailableSourceDocuments([]);

      if (!loadedDocument) {
        setSourceDocumentId(null);
        setAdjustmentReason("");
      }

      return;
    }

    let active = true;

    listDocuments({ group: "sales", type: "tax_invoice", sort: "issue_date", direction: "desc" })
      .then((documents) => Promise.all(documents.slice(0, 40).map((document) => getDocument(document.id))))
      .then((documents) => {
        if (active) {
          setAvailableSourceDocuments(documents);
        }
      })
      .catch((err: unknown) => {
        console.error('[TransactionForm] source documents fetch failed:', err);
        if (active) {
          setAvailableSourceDocuments([]);
        }
      });

    return () => {
      active = false;
    };
  }, [documentType, kind, loadedDocument]);

  useEffect(() => {
    if (!loadedDocument || hydratedDocumentId === loadedDocument.id) {
      return;
    }

    const availableContacts = [...customers, ...suppliers];
    const matchedContact = availableContacts.find((contact) => contact.backendId === loadedDocument.contactBackendId) ?? {
      id: `contact-${loadedDocument.contactBackendId ?? loadedDocument.id}`,
      backendId: loadedDocument.contactBackendId ?? undefined,
      kind: config.contactKind,
      displayName: loadedDocument.contactName || config.contactLabel,
      email: "",
      phone: "",
      city: "",
    };

    const nextReference = typeof loadedDocument.customFields.reference === "string"
      ? loadedDocument.customFields.reference
      : loadedDocument.number;

    setSelectedContact(contactToOption(matchedContact));
    setSelectedContactRecord(matchedContact);
    setReference(nextReference || "");
    setDocumentTitle(loadedDocument.title || "");
    setDocumentType(loadedDocument.type);
    setIssueDate(loadedDocument.issueDate || "");
    setDueDate(loadedDocument.dueDate || "");
    setNotes(loadedDocument.notes || "");
    setSourceDocumentId(loadedDocument.sourceDocumentId);
    setAdjustmentReason(loadedDocument.statusReason || String(loadedDocument.customFields.adjustment_reason ?? ""));
    setLanguageCode(loadedDocument.languageCode === "ar" ? "ar" : "en");
    setTemplateId(loadedDocument.templateId);
    setDocumentCostCenterId(loadedDocument.costCenterId);
    setDocumentCustomFields(Object.fromEntries(Object.entries(loadedDocument.customFields).filter(([key]) => key !== "reference")));
    setPurchaseContext(loadedDocument.purchaseContext);
    setLines(loadedDocument.lines.map((line) => {
      const matchedItem = items.find((item) => item.backendId === line.itemBackendId);

      return {
        id: createId("line"),
        itemId: matchedItem?.id ?? null,
        backendItemId: line.itemBackendId,
        description: line.description,
        quantity: line.quantity,
        price: line.unitPrice,
        costCenterId: line.costCenterId,
        customFields: line.customFields,
      };
    }));
    setHydratedDocumentId(loadedDocument.id);
  }, [config.contactKind, config.contactLabel, customers, hydratedDocumentId, items, loadedDocument, suppliers]);

  const subtotal = lines.reduce((sum, line) => sum + calculateLineSubtotal(line), 0);
  const vatTotal = lines.reduce((sum, line) => sum + calculateLineVatAmount(line), 0);
  const total = lines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  const count = kind === "invoice" ? customers.length : suppliers.length;
  const availableTemplates = useMemo(() => templates.filter((template) => {
    if (!template.documentTypes.length) {
      return true;
    }

    return template.documentTypes.includes(documentType);
  }), [documentType, templates]);
  const documentFieldDefinitions = useMemo(() => customFieldDefinitions.filter((field) => {
    const placement = field.placement.toLowerCase();

    if (placement.includes("line")) {
      return false;
    }

    return field.appliesTo.length === 0 || field.appliesTo.includes(documentType);
  }), [customFieldDefinitions, documentType]);
  const lineFieldDefinitions = useMemo(() => customFieldDefinitions.filter((field) => {
    const placement = field.placement.toLowerCase();

    if (!placement.includes("line")) {
      return false;
    }

    if (/service\s*period/i.test(field.name) || /service[_\s]*period/i.test(field.slug)) {
      return false;
    }

    return field.appliesTo.length === 0 || field.appliesTo.includes(documentType);
  }), [customFieldDefinitions, documentType]);
  const visibleDocumentFieldDefinitions = useMemo(() => documentFieldDefinitions.filter((field) => !/service\s*period/i.test(field.name) && !/service[_\s]*period/i.test(field.slug)), [documentFieldDefinitions]);
  const selectedTemplate = availableTemplates.find((template) => template.id === templateId) ?? null;
  const selectedSourceDocument = availableSourceDocuments.find((document) => document.id === sourceDocumentId) ?? null;

  useEffect(() => {
    if (documentId || templateId || availableTemplates.length === 0) {
      return;
    }

    const preferredTemplate = availableTemplates.find((template) => template.isDefault && template.isActive)
      ?? availableTemplates.find((template) => template.isActive)
      ?? null;

    if (preferredTemplate) {
      setTemplateId(preferredTemplate.id);
    }
  }, [availableTemplates, documentId, templateId]);

  const hydrateFromSourceDocument = useCallback(async (nextSourceDocumentId: number) => {
    const sourceDocument = availableSourceDocuments.find((document) => document.id === nextSourceDocumentId)
      ?? await getDocument(nextSourceDocumentId);
    const availableContacts = [...customers, ...suppliers];
    const matchedContact = availableContacts.find((contact) => contact.backendId === sourceDocument.contactBackendId) ?? null;

    if (matchedContact) {
      setSelectedContact(contactToOption(matchedContact));
      setSelectedContactRecord(matchedContact);
    }

    setReference(sourceDocument.number);
    setLines(mapSourceDocumentToLines(sourceDocument));
    setTemplateId(sourceDocument.templateId ?? null);
    setDocumentCostCenterId(sourceDocument.costCenterId ?? null);
    setDocumentCustomFields((current) => ({
      ...current,
      ...sourceDocument.customFields,
      source_invoice_number: sourceDocument.number,
    }));
  }, [availableSourceDocuments, customers, suppliers]);

  function buildSubmissionCustomFields() {
    const paymentRecommendation = buildPaymentRecommendation(total);

    return {
      ...documentCustomFields,
      adjustment_reason: adjustmentReason || null,
      source_invoice_number: selectedSourceDocument?.number ?? documentCustomFields.source_invoice_number ?? null,
      payment_status: documentCustomFields.payment_status ?? paymentRecommendation.paymentStatus,
      temporary_accounting_reference: (documentCustomFields.temporary_accounting_reference ?? paymentRecommendation.tempAccountingRef) || null,
      vat_decision_summary: vatDecision.summary,
      vat_decision_reason: vatDecision.reason,
      zatca_qr_required: vatDecision.requiresQr,
    };
  }

  function handleContactSelect(option: PickerOption | null) {
    setSelectedContact(option);
    setContactValidation(undefined);

    if (!option) {
      setSelectedContactRecord(null);
      return;
    }

    const match = [...customers, ...suppliers].find((contact) => contact.id === option.id) ?? null;

    if (match) {
      setSelectedContactRecord(match);

      if (kind === "invoice") {
        setDocumentCustomFields((current) => ({
          ...current,
          buyer_name_en: current.buyer_name_en || match.displayName,
          buyer_address_en: current.buyer_address_en || match.city,
          buyer_vat_number: current.buyer_vat_number || match.vatNumber || null,
        }));
      }

      return;
    }

    setSelectedContactRecord({
      id: option.id,
      kind: config.contactKind,
      displayName: option.label,
      email: "",
      phone: "",
      city: "",
    });
  }

  useEffect(() => {
    if (kind !== "invoice" || !selectedContactRecord) {
      setAutofillSuggestions({});
      setRecommendedItems(items.slice(0, 4).map((item) => ({ item, lastDocumentNumber: "Catalog", timesUsed: 0 })));
      return;
    }

    let active = true;

    void listDocuments({ group: "sales", sort: "issue_date", direction: "desc" })
      .then(async (documents) => {
        if (!active) {
          return;
        }

        const contactDocs = documents.filter((document) => document.contactName === selectedContactRecord.displayName);
        const deliveryNote = contactDocs.find((document) => document.type === "delivery_note");
        const proforma = contactDocs.find((document) => document.type === "proforma_invoice");
        const taxInvoice = contactDocs.find((document) => document.type === "tax_invoice");
        const lastPaidInvoice = contactDocs.find((document) => document.type === "tax_invoice" && document.status === "paid");

        const nextSuggestions = {
          linked_delivery_note_number: deliveryNote?.number ?? "",
          linked_proforma_number: proforma?.number ?? "",
          linked_tax_invoice_number: taxInvoice?.number ?? "",
          buyer_vat_number: selectedContactRecord.vatNumber || String(documentCustomFields.buyer_vat_number || ""),
          buyer_address_en: selectedContactRecord.city,
          currency: String(companySettings?.company.baseCurrency || documentCustomFields.currency || "SAR"),
          payment_reference_note: lastPaidInvoice?.number ? `Follow ${lastPaidInvoice.number}` : "",
        };

        const detailCandidates = contactDocs
          .filter((document) => ["tax_invoice", "proforma_invoice", "delivery_note"].includes(document.type))
          .slice(0, 4);
        const details = await Promise.all(detailCandidates.map(async (document) => {
          try {
            return await getDocument(document.id);
          } catch {
            return null;
          }
        }));

        const usage = new Map<number, { lastDocumentNumber: string; timesUsed: number }>();
        details.forEach((document) => {
          if (!document) {
            return;
          }

          document.lines.forEach((line) => {
            if (!line.itemBackendId) {
              return;
            }

            const current = usage.get(line.itemBackendId) ?? { lastDocumentNumber: document.number, timesUsed: 0 };
            usage.set(line.itemBackendId, {
              lastDocumentNumber: current.lastDocumentNumber || document.number,
              timesUsed: current.timesUsed + 1,
            });
          });
        });

        const nextRecommendedItems = [...usage.entries()]
          .map(([backendId, meta]) => {
            const match = items.find((item) => item.backendId === backendId);
            return match ? { item: match, lastDocumentNumber: meta.lastDocumentNumber, timesUsed: meta.timesUsed } : null;
          })
          .filter((entry): entry is RecommendedItem => Boolean(entry))
          .sort((left, right) => right.timesUsed - left.timesUsed)
          .slice(0, 4);

        const fallbackItems = items
          .filter((item) => !nextRecommendedItems.some((entry) => entry.item.id === item.id))
          .slice(0, Math.max(0, 4 - nextRecommendedItems.length))
          .map((item) => ({ item, lastDocumentNumber: "Catalog", timesUsed: 0 }));

        setAutofillSuggestions(nextSuggestions);
        setRecommendedItems(nextRecommendedItems.length ? nextRecommendedItems : fallbackItems);
        setDocumentCustomFields((current) => ({
          ...current,
          linked_delivery_note_number: String(current.linked_delivery_note_number || "") || nextSuggestions.linked_delivery_note_number || null,
          linked_proforma_number: String(current.linked_proforma_number || "") || nextSuggestions.linked_proforma_number || null,
          linked_tax_invoice_number: String(current.linked_tax_invoice_number || "") || nextSuggestions.linked_tax_invoice_number || null,
          buyer_vat_number: String(current.buyer_vat_number || "") || nextSuggestions.buyer_vat_number || null,
          buyer_address_en: String(current.buyer_address_en || "") || nextSuggestions.buyer_address_en || null,
          buyer_name_en: String(current.buyer_name_en || "") || selectedContactRecord.displayName || null,
          receiver_name: String(current.receiver_name || "") || selectedContactRecord.displayName || null,
          payment_reference_note: String(current.payment_reference_note || "") || nextSuggestions.payment_reference_note || null,
          currency: String(current.currency || "") || nextSuggestions.currency || "SAR",
        }));
      })
      .catch((err: unknown) => {
        console.error('[TransactionForm] contact autofill fetch failed:', err);
        if (active) {
          setAutofillSuggestions({
            buyer_address_en: selectedContactRecord.city,
            currency: String(companySettings?.company.baseCurrency || documentCustomFields.currency || "SAR"),
          });
          setRecommendedItems(items.slice(0, 4).map((item) => ({ item, lastDocumentNumber: "Catalog", timesUsed: 0 })));
        }
      });

    return () => {
      active = false;
    };
  }, [companySettings?.company.baseCurrency, documentCustomFields.buyer_vat_number, documentCustomFields.currency, items, kind, selectedContactRecord]);

  useEffect(() => {
    if (kind !== "invoice") {
      setInventoryWarnings({});
      return;
    }

    let active = true;

    void listInventoryStock()
      .then((inventory) => {
        if (!active) {
          return;
        }

        const nextWarnings = lines.reduce<Record<string, { available: number; requested: number; productName: string }>>((result, line) => {
          if (!line.backendItemId) {
            return result;
          }

          const matchingRecords = inventory.filter((record) => record.itemId === line.backendItemId);
          const available = matchingRecords.reduce((sum, record) => sum + Math.max(record.available, 0), 0);
          if (available < line.quantity) {
            result[line.id] = {
              available,
              requested: line.quantity,
              productName: line.description || matchingRecords[0]?.productName || "Item",
            };
          }

          return result;
        }, {});

        setInventoryWarnings(nextWarnings);
      })
      .catch((err: unknown) => {
        console.error('[TransactionForm] inventory stock fetch failed:', err);
        if (active) {
          setInventoryWarnings({});
        }
      });

    return () => {
      active = false;
    };
  }, [kind, lines]);

  function applyRecommendedItem(itemId: string) {
    const match = recommendedItems.find((entry) => entry.item.id === itemId)?.item;

    if (!match) {
      return;
    }

    setLines((current) => {
      const firstEmptyLine = current.find((line) => !line.itemId && !line.backendItemId && !line.description.trim());
      if (firstEmptyLine) {
        return current.map((line) => line.id === firstEmptyLine.id ? {
          ...line,
          itemId: match.id,
          backendItemId: match.backendId ?? null,
          description: match.name,
          price: kind === "invoice" ? match.salePrice : match.purchasePrice,
          customFields: {
            ...line.customFields,
            item_code: match.sku || null,
            item_category: match.category || null,
            vat_rate: inferSilentVatRate(selectedContactRecord),
          },
        } : line);
      }

      return [
        ...current,
        {
          id: createId("line"),
          itemId: match.id,
          backendItemId: match.backendId ?? null,
          description: match.name,
          quantity: 1,
          price: kind === "invoice" ? match.salePrice : match.purchasePrice,
          costCenterId: null,
          customFields: {
            item_code: match.sku || null,
            item_category: match.category || null,
            vat_rate: inferSilentVatRate(selectedContactRecord),
          },
        },
      ];
    });
  }

  useEffect(() => {
    if (kind !== "invoice") {
      return;
    }

    const nextVatRate = inferSilentVatRate(selectedContactRecord);
    setLines((current) => current.map((line) => ({
      ...line,
      customFields: {
        ...line.customFields,
        vat_rate: nextVatRate,
      },
    })));
  }, [kind, selectedContactRecord]);

  function confirmAutofillField(field: string) {
    const value = autofillSuggestions[field];
    if (!value) {
      return;
    }

    updateDocumentCustomField(field, value);
    setConfirmedAutofillFields((current) => ({ ...current, [field]: true }));
  }

  function updateDocumentCustomField(slug: string, value: string | number | boolean | null) {
    setDocumentCustomFields((current) => ({
      ...current,
      [slug]: value,
    }));
  }

  function saveDraftForInventoryReturn() {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(workflowDraftStorageKey, buildDraftSnapshot({
      kind,
      documentType,
      contactId: selectedContactRecord?.id ?? null,
      reference,
      issueDate,
      dueDate,
      notes,
      languageCode,
      templateId,
      documentCostCenterId,
      documentCustomFields,
      purchaseContext,
      sourceDocumentId,
      adjustmentReason,
      paymentAmount,
      paymentMethod,
      paymentReference,
      lines,
    }));
  }

  function openInventoryWithDraftReturn() {
    saveDraftForInventoryReturn();
    router.push(mapWorkspaceHref(`/workspace/user/stock?returnTo=${encodeURIComponent("/workspace/invoices/new?resumeDraft=1")}`, basePath));
  }

  async function detectInventoryShortages() {
    const inventory = await listInventoryStock();

    return lines.reduce<InventoryShortage[]>((results, line) => {
      const itemId = line.backendItemId;
      if (!itemId) {
        return results;
      }

      const matchingRecords = inventory.filter((record) => record.itemId === itemId);
      if (!matchingRecords.length) {
        results.push({
          lineId: line.id,
          description: line.description || "Line item",
          requested: line.quantity,
          available: 0,
        });
        return results;
      }

      const available = matchingRecords.reduce((sum, record) => sum + Math.max(record.available, 0), 0);
      if (available < line.quantity) {
        results.push({
          lineId: line.id,
          description: line.description || matchingRecords[0].productName,
          requested: line.quantity,
          available,
        });
      }

      return results;
    }, []);
  }

  function buildPaymentRecommendation(totalAmount: number) {
    const paymentStatus = normalizeSmartText(documentCustomFields.payment_status) || (Number(paymentAmount) > 0 ? "Fully Received" : isProforma ? "Not Received" : "Unpaid");
    const tempAccountingRef = normalizeSmartText(documentCustomFields.temporary_accounting_reference)
      || (paymentStatus !== "Not Received" && paymentStatus !== "Unpaid"
        ? `TMP-PAY-${issueDate.replaceAll("-", "")}-${Math.round(totalAmount)}`
        : "");

    return { paymentStatus, tempAccountingRef };
  }

  function validateSelection() {
    setContactValidation(undefined);
    setLineValidation(undefined);
    setSubmitError(undefined);
    setFieldErrors({});

    if (!selectedContactRecord) {
      setContactValidation(`Choose a ${config.contactLabel.toLowerCase()} before moving on.`);
      return false;
    }

    if (!selectedContactRecord.backendId) {
      setContactValidation(`Use a saved ${config.contactLabel.toLowerCase()} before saving this document.`);
      return false;
    }

    if (lines.some((line) => !line.itemId && !line.backendItemId)) {
      setLineValidation("Choose a saved product or service on every line before saving or posting.");
      return false;
    }

    if (isSalesAdjustment && !sourceDocumentId) {
      setSubmitError("Select the original invoice before issuing this sales adjustment.");
      return false;
    }

    if (isSalesAdjustment && !adjustmentReason.trim()) {
      setSubmitError("Enter the adjustment reason before saving or issuing this sales adjustment.");
      return false;
    }

    if (isCreditNote && lines.some((line) => !line.customFields?.source_line_id)) {
      setLineValidation("Each credit note line must remain linked to a source invoice line.");
      return false;
    }

    if (selectedContactRecord?.vatNumber && !normalizeSmartText(documentCustomFields.buyer_vat_number)) {
      setDocumentCustomFields((current) => ({
        ...current,
        buyer_vat_number: current.buyer_vat_number || selectedContactRecord.vatNumber || null,
      }));
    }

    if (selectedContactRecord?.city && !normalizeSmartText(documentCustomFields.buyer_address_en)) {
      setDocumentCustomFields((current) => ({
        ...current,
        buyer_address_en: current.buyer_address_en || selectedContactRecord.city || null,
      }));
    }

    const effectiveBuyerVatNumber = normalizeSmartText(documentCustomFields.buyer_vat_number) || normalizeSmartText(selectedContactRecord?.vatNumber);
    const effectiveBuyerAddress = normalizeSmartText(documentCustomFields.buyer_address_en) || normalizeSmartText(selectedContactRecord?.city);

    if (isTaxInvoice && vatDecision.requiresBuyerVatNumber && !effectiveBuyerVatNumber) {
      setComplianceDetailsOpen(true);
      setFieldErrors({ buyer_vat_number: "Customer VAT is required before issuing this invoice." });
      setSubmitError("Buyer VAT number is required for this VAT/ZATCA decision path.");
      return false;
    }

    if (isTaxInvoice && vatDecision.requiresBuyerAddress && !effectiveBuyerAddress) {
      setComplianceDetailsOpen(true);
      setFieldErrors({ buyer_address_en: "Buyer address is required before issuing this invoice." });
      setSubmitError("Buyer address is required before issuing this tax invoice.");
      return false;
    }

    return true;
  }

  async function handleSubmit() {
    if (readOnlyDocument) {
      setZatcaDuplicateOpen(true);
      return;
    }

    if (kind === "invoice" && isTaxInvoice && invoiceAccessState?.blocked) {
      setSubmitError(invoiceAccessState.detail);
      return;
    }

    if (!validateSelection() || !selectedContactRecord) {
      return;
    }

    if (isDeliveryNote) {
      try {
        const nextShortages = await detectInventoryShortages();

        if (nextShortages.length) {
          setShortages(nextShortages);
          setShortageDialogOpen(true);
          setSubmitError("Stock is short for one or more delivery-note lines.");
          return;
        }
      } catch {
        setSubmitError("Stock validation could not be completed. Review inventory before posting this delivery note.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (activeDocumentId) {
        await updateTransactionDraft({
          documentId: activeDocumentId,
          kind,
          documentType,
          title: documentTitle,
          templateId,
          costCenterId: documentCostCenterId,
          languageCode,
          customFields: buildSubmissionCustomFields(),
          purchaseContext,
          contact: selectedContactRecord,
          sourceDocumentId,
          reference,
          issueDate,
          supplyDate: String(documentCustomFields.supply_date ?? issueDate),
          dueDate,
          statusReason: adjustmentReason,
          notes,
          lines,
          items,
        });

        const finalizedDocument = await finalizeTransactionDraft(kind, activeDocumentId);
        const payment = Number(paymentAmount) > 0 && !isProforma && !isDeliveryNote
          ? await recordDocumentPayment({
              direction: kind === "invoice" ? "incoming" : "outgoing",
              documentId: activeDocumentId,
              amount: Number(paymentAmount),
              paymentDate: issueDate,
              method: paymentMethod,
              reference: paymentReference,
            })
          : null;

        setSubmitResult({ document: finalizedDocument, payment });
      } else {
        const result = isSalesAdjustment && sourceDocumentId
          ? {
              document: documentType === "credit_note"
                ? await issueSalesCreditNote({
                    sourceDocumentId,
                    issueDate,
                    supplyDate: String(documentCustomFields.supply_date ?? issueDate),
                    notes: [reference, adjustmentReason, notes].filter(Boolean).join("\n"),
                    lines,
                  })
                : await issueSalesDebitNote({
                    sourceDocumentId,
                    issueDate,
                    supplyDate: String(documentCustomFields.supply_date ?? issueDate),
                    statusReason: adjustmentReason,
                    notes: [reference, adjustmentReason, notes].filter(Boolean).join("\n"),
                    lines,
                  }),
              payment: null,
            }
          : await submitTransaction({
              kind,
              documentType,
              title: documentTitle,
              templateId,
              costCenterId: documentCostCenterId,
              languageCode,
              customFields: buildSubmissionCustomFields(),
              purchaseContext,
              contact: selectedContactRecord,
              sourceDocumentId,
              reference,
              issueDate,
              supplyDate: String(documentCustomFields.supply_date ?? issueDate),
              dueDate,
              statusReason: adjustmentReason,
              notes,
              lines,
              items,
              paymentAmount: Number(paymentAmount) || 0,
              paymentMethod,
              paymentReference,
            });

        setSubmitResult(result);
      }
      setSubmitError(undefined);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "This transaction could not be posted.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    if (readOnlyDocument) {
      setZatcaDuplicateOpen(true);
      return;
    }

    if (!validateSelection() || !selectedContactRecord) {
      return;
    }

    setSavingDraft(true);

    try {
      const document = activeDocumentId
        ? await updateTransactionDraft({
            documentId: activeDocumentId,
            kind,
            documentType,
            title: documentTitle,
            templateId,
            costCenterId: documentCostCenterId,
            languageCode,
            customFields: buildSubmissionCustomFields(),
            purchaseContext,
            contact: selectedContactRecord,
            sourceDocumentId,
            reference,
            issueDate,
            supplyDate: String(documentCustomFields.supply_date ?? issueDate),
            dueDate,
            statusReason: adjustmentReason,
            notes,
            lines,
            items,
          })
        : await saveTransactionDraft({
            kind,
            documentType,
            title: documentTitle,
            templateId,
            costCenterId: documentCostCenterId,
            languageCode,
            customFields: buildSubmissionCustomFields(),
            purchaseContext,
            contact: selectedContactRecord,
            sourceDocumentId,
            reference,
            issueDate,
            supplyDate: String(documentCustomFields.supply_date ?? issueDate),
            dueDate,
            statusReason: adjustmentReason,
            notes,
            lines,
            items,
          });

      setSubmitResult({ document, payment: null });
      setSubmitError(undefined);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "This draft could not be saved.");
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleDuplicateIssuedDocument() {
    if (!loadedDocument) {
      return;
    }

    setDuplicatingIssuedDocument(true);
    setSubmitError(undefined);

    try {
      const duplicate = await duplicateDocument(loadedDocument.id);
      setSubmitResult({ document: duplicate, payment: null });
      setLoadedDocument(null);
      setHydratedDocumentId(null);
      setZatcaDuplicateOpen(false);
      setReference(duplicate.number);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Issued invoice duplication failed.");
    } finally {
      setDuplicatingIssuedDocument(false);
    }
  }

  if (loadingEditor) {
    return (
      <Card className="rounded-xl border-white/70 bg-white/95 p-6 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Invoice</p>
        <h2 className="mt-3 text-3xl font-semibold text-ink">Loading invoice</h2>
        <p className="mt-3 text-sm leading-7 text-muted">Loading saved invoice data.</p>
      </Card>
    );
  }

  return (
    <div className={[
      displayMode === "overlay" ? "fixed inset-x-0 bottom-0 top-[4.5rem] z-40 overflow-auto bg-[#f4f7f4] px-4 py-4 md:px-6" : "",
      "grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]",
    ].join(" ")} data-inspector-workflow-form={kind} data-inspector-inline-create-contact="true" data-inspector-inline-create-item="true">
      {displayMode === "overlay" ? (
        <div className="xl:col-span-2 sticky top-0 z-30 -mx-4 -mt-4 border-b border-line bg-white/95 px-4 py-3 shadow-[0_12px_30px_-24px_rgba(17,32,24,0.25)] backdrop-blur md:-mx-6 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Full Screen Editor</p>
              <h1 className="mt-1 text-xl font-semibold text-ink">{documentId ? config.editTitle : config.title}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" href={mapWorkspaceHref(documentId ? `/workspace/invoices/${documentId}` : "/workspace/user/invoices", basePath)}>Exit</Button>
              <Button variant="secondary" href={mapWorkspaceHref(documentId ? `/workspace/invoices/${documentId}` : "/workspace/user/invoices", basePath)}>Cancel</Button>
              <Button variant="secondary" href={documentId ? mapWorkspaceHref(`/workspace/invoices/${documentId}`, basePath) : undefined} disabled={!documentId}>Preview</Button>
              <Button variant="secondary" onClick={handleSaveDraft} disabled={savingDraft || submitting || readOnlyDocument}>{savingDraft ? "Saving" : "Save"}</Button>
              <Button data-inspector-workflow-submit="true" onClick={handleSubmit} disabled={submitting || readOnlyDocument}>{documentId ? "Save & Send" : "Issue / Send"}</Button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{kind === "invoice" ? "Invoice" : "Document"}</p>
              <h2 className="mt-1 text-[1.65rem] font-semibold tracking-tight text-ink">
                {readOnlyDocument
                  ? loadedDocument?.number || "Invoice details"
                  : documentId
                    ? config.editTitle
                    : config.title}
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
                {readOnlyDocument
                  ? `${readOnlyLabel} invoices duplicate under ZATCA rules instead of editing in place.`
                  : config.description}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-surface-soft px-3 py-2 text-xs text-muted">
              <p className="font-semibold text-ink">{readOnlyDocument ? "Invoice status" : "Ready"}</p>
              <p className="mt-0.5">
                {readOnlyDocument
                  ? `${readOnlyLabel} · ${currency(loadedDocument?.balanceDue ?? 0)} SAR open balance`
                  : `${count} saved ${kind === "invoice" ? "customers" : "suppliers"} · ${availableTemplates.length} templates`}
              </p>
            </div>
        </div>

        <Card className="rounded-xl border-white/70 bg-white/95 p-3 shadow-[0_18px_36px_-28px_rgba(17,32,24,0.16)] backdrop-blur-xl">
          {kind === "invoice" && invoiceAccessState ? (
            <div className={[
              "mb-3 rounded-lg border px-3 py-2 text-sm",
              invoiceAccessState.tone === "critical"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-amber-200 bg-amber-50 text-amber-800",
            ].join(" ")}>
              <span className="font-semibold">{invoiceAccessState.title}:</span> {invoiceAccessState.detail}
            </div>
          ) : null}
          {accountingAccessState ? (
            <div className={[
              "mb-3 rounded-lg border px-3 py-2 text-sm",
              accountingAccessState.tone === "info"
                ? "border-sky-200 bg-sky-50 text-sky-800"
                : "border-amber-200 bg-amber-50 text-amber-800",
            ].join(" ")}>
              <span className="font-semibold">{accountingAccessState.title}:</span> {accountingAccessState.detail}
            </div>
          ) : null}
          {readOnlyDocument ? <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">According to ZATCA regulations, issued invoices cannot be modified directly. Proceeding creates a duplicate and marks the original as VOID.</div> : null}
          <div className="grid gap-2.5 lg:grid-cols-2">
            <EntityPicker
              label={config.contactLabel}
              placeholder={kind === "invoice" ? "Search customer name, city, phone, or email" : "Search supplier name, city, phone, or email"}
              selectedOption={selectedContact}
              onSearch={async (query) => {
                const contacts = await searchContacts(config.contactKind, query || " ");
                return contacts.map(contactToOption);
              }}
              onSelect={handleContactSelect}
              browseLabel={kind === "invoice" ? "Show all customers" : "Show all suppliers"}
              createLabel={kind === "invoice" ? "Add a new customer" : "Add a new supplier"}
              onCreateNew={(query) => {
                setDraftContactName(query);
                setCreateContactOpen(true);
              }}
              validationMessage={contactValidation}
              disabled={readOnlyDocument}
            />
            <Input label={config.referenceLabel} value={reference} onChange={(event) => setReference(event.target.value)} disabled={readOnlyDocument} />
            <Input label="Internal title" value={documentTitle} onChange={(event) => setDocumentTitle(event.target.value)} placeholder="Internal title" disabled={readOnlyDocument} />
            <div>
              <label htmlFor={`${kind}-language`} className="mb-1 block text-[11px] font-semibold text-ink">Language</label>
              <select id={`${kind}-language`} value={languageCode} disabled={readOnlyDocument} onChange={(event) => setLanguageCode(event.target.value === "ar" ? "ar" : "en")} className="block h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-soft">
                <option value="en">English</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
            <Input label="Issue date" type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} disabled={readOnlyDocument} />
            <Input label="Due date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={readOnlyDocument} />
            {isSalesAdjustment ? (
              <>
                <div>
                  <label htmlFor={`${kind}-source-invoice`} className="mb-1 block text-[11px] font-semibold text-ink">Reference invoice</label>
                  <select
                    id={`${kind}-source-invoice`}
                    value={sourceDocumentId ?? ""}
                    disabled={readOnlyDocument}
                    onChange={(event) => {
                      const nextSourceDocumentId = event.target.value ? Number(event.target.value) : null;
                      setSourceDocumentId(nextSourceDocumentId);

                      if (nextSourceDocumentId) {
                        void hydrateFromSourceDocument(nextSourceDocumentId);
                      }
                    }}
                    className="block h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-soft"
                  >
                    <option value="">Select original invoice</option>
                    {availableSourceDocuments.map((document) => (
                      <option key={document.id} value={document.id}>{document.number} · {document.contactName || "Customer"}</option>
                    ))}
                  </select>
                </div>
                <Input label="Adjustment reason" value={adjustmentReason} onChange={(event) => setAdjustmentReason(event.target.value)} placeholder={isCreditNote ? "Refund, return, or discount reason" : "Correction or additional charge reason"} disabled={readOnlyDocument} />
              </>
            ) : null}
            <div>
              <label htmlFor={`${kind}-template`} className="mb-1 block text-[11px] font-semibold text-ink">Template</label>
              <select id={`${kind}-template`} value={templateId ?? ""} disabled={readOnlyDocument} onChange={(event) => setTemplateId(event.target.value ? Number(event.target.value) : null)} className="block h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-soft">
                <option value="">Default template</option>
                {availableTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2 rounded-lg border border-line bg-surface-soft/45 p-2.5">
              <p className="mb-1 text-[11px] font-semibold text-ink">Document type</p>
              <div className="flex flex-wrap gap-1.5">
                {config.typeOptions.map((option) => {
                  const active = documentType === option;

                  return (
                    <button key={option} type="button" disabled={readOnlyDocument} onClick={() => setDocumentType(option)} className={["rounded-full border px-2.5 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60", active ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface-soft text-ink"].join(" ")}>
                      {labelize(option)}
                    </button>
                  );
                })}
              </div>
            </div>
            {kind === "invoice" ? (
              <div className="lg:col-span-2 rounded-lg border border-line bg-surface-soft p-2.5" data-inspector-sale-intelligence="true">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ink">Document path</p>
                  <Button size="xs" variant={isProforma ? "primary" : "secondary"} onClick={() => setDocumentType("proforma_invoice")}>Create Proforma Invoice</Button>
                  <Button size="xs" variant={isTaxInvoice ? "primary" : "secondary"} onClick={() => setDocumentType("tax_invoice")}>Create Tax Invoice</Button>
                  <Button size="xs" variant={isDeliveryNote ? "primary" : "secondary"} onClick={() => setDocumentType("delivery_note")}>Create Delivery Note</Button>
                  <Button size="xs" variant={documentType === "credit_note" ? "primary" : "secondary"} onClick={() => setDocumentType("credit_note")}>Issue Credit Note</Button>
                  <Button size="xs" variant={documentType === "debit_note" ? "primary" : "secondary"} onClick={() => setDocumentType("debit_note")}>Issue Debit Note</Button>
                </div>
              </div>
            ) : null}
            {kind === "invoice" ? (
              <div className="lg:col-span-2 rounded-lg border border-line bg-surface-soft p-2.5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">ZATCA invoice identity</p>
                  </div>
                  <div className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Template {selectedTemplate?.name ?? "Default"}</div>
                </div>
                {isSalesAdjustment ? (
                  <div className="mt-2 rounded-lg border border-line bg-white px-3 py-2 text-sm text-muted">
                    {isCreditNote
                      ? "Credit notes reduce customer liability, reverse revenue and VAT, and stay linked to the original invoice."
                      : "Debit notes increase customer liability, add revenue and VAT, and stay linked to the original invoice."}
                  </div>
                ) : null}
                {isSalesAdjustment && selectedSourceDocument ? (
                  <div className="mt-2 grid gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs text-muted md:grid-cols-3">
                    <div><span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">Source invoice</span><span className="mt-1 block font-semibold text-ink">{selectedSourceDocument.number}</span></div>
                    <div><span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">Source total</span><span className="mt-1 block font-semibold text-ink">{currency(selectedSourceDocument.grandTotal)} SAR</span></div>
                    <div><span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">Source balance</span><span className="mt-1 block font-semibold text-ink">{currency(selectedSourceDocument.balanceDue)} SAR</span></div>
                  </div>
                ) : null}
                <div className="mt-2.5 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  <Input label="Linked Proforma" value={String(documentCustomFields.linked_proforma_number ?? "")} onChange={(event) => updateDocumentCustomField("linked_proforma_number", event.target.value || null)} disabled={readOnlyDocument} />
                  <Input label="Linked Delivery Note" value={String(documentCustomFields.linked_delivery_note_number ?? "")} onChange={(event) => updateDocumentCustomField("linked_delivery_note_number", event.target.value || null)} disabled={readOnlyDocument} />
                  <Input label="Supply date" type="date" value={String(documentCustomFields.supply_date ?? "")} onChange={(event) => updateDocumentCustomField("supply_date", event.target.value || null)} disabled={readOnlyDocument} />
                  <Input label="Currency" value={activeCurrency} onChange={(event) => updateDocumentCustomField("currency", event.target.value.toUpperCase() || "SAR")} disabled={readOnlyDocument} />
                </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4" data-inspector-transaction-smart-strip="true">
                    {workflowGuidance.slice(0, 4).map((entry) => (
                      <div key={entry.title} className={["rounded-lg border px-3 py-2 text-xs", entry.tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : entry.tone === "primary" ? "border-primary/20 bg-primary-soft/50 text-ink" : "border-line bg-white text-muted"].join(" ")}>
                        <p className="font-semibold text-ink">{entry.title}</p>
                        <p className="mt-1 line-clamp-2">{entry.detail}</p>
                      </div>
                    ))}
                  </div>
                <details className="mt-2 rounded-lg border border-line bg-white p-2.5" open={complianceDetailsOpen} onToggle={(event) => setComplianceDetailsOpen(event.currentTarget.open)}>
                  <summary className="cursor-pointer list-none text-sm font-semibold text-ink">Advanced compliance and autofill</summary>
                  <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                    <Input label="Linked Tax Invoice" value={String(documentCustomFields.linked_tax_invoice_number ?? "")} onChange={(event) => updateDocumentCustomField("linked_tax_invoice_number", event.target.value || null)} disabled={readOnlyDocument} />
                    <Input label="Receiver / Customer" value={String(documentCustomFields.receiver_name ?? documentCustomFields.buyer_name_en ?? "")} onChange={(event) => updateDocumentCustomField("receiver_name", event.target.value || null)} disabled={readOnlyDocument} />
                    <Input label="Seller VAT number" value={String(documentCustomFields.seller_vat_number ?? "")} onChange={(event) => updateDocumentCustomField("seller_vat_number", event.target.value || null)} disabled={readOnlyDocument} />
                    <Input label="Buyer VAT number" value={String(documentCustomFields.buyer_vat_number ?? "")} onChange={(event) => updateDocumentCustomField("buyer_vat_number", event.target.value || null)} disabled={readOnlyDocument} error={fieldErrors.buyer_vat_number} />
                    <Input label="Seller name (EN)" value={String(documentCustomFields.seller_name_en ?? "")} onChange={(event) => updateDocumentCustomField("seller_name_en", event.target.value || null)} disabled={readOnlyDocument} />
                    <Input label="Seller name (AR)" value={String(documentCustomFields.seller_name_ar ?? "")} onChange={(event) => updateDocumentCustomField("seller_name_ar", event.target.value || null)} disabled={readOnlyDocument} />
                    <Input label="Buyer name (EN)" value={String(documentCustomFields.buyer_name_en ?? "")} onChange={(event) => updateDocumentCustomField("buyer_name_en", event.target.value || null)} disabled={readOnlyDocument} />
                    <Input label="Buyer name (AR)" value={String(documentCustomFields.buyer_name_ar ?? "")} onChange={(event) => updateDocumentCustomField("buyer_name_ar", event.target.value || null)} disabled={readOnlyDocument} />
                    <Input label="Seller address (EN)" value={String(documentCustomFields.seller_address_en ?? "")} onChange={(event) => updateDocumentCustomField("seller_address_en", event.target.value || null)} disabled={readOnlyDocument} />
                    <Input label="Seller address (AR)" value={String(documentCustomFields.seller_address_ar ?? "")} onChange={(event) => updateDocumentCustomField("seller_address_ar", event.target.value || null)} disabled={readOnlyDocument} />
                    <Input label="Buyer address (EN)" value={String(documentCustomFields.buyer_address_en ?? "")} onChange={(event) => updateDocumentCustomField("buyer_address_en", event.target.value || null)} disabled={readOnlyDocument} error={fieldErrors.buyer_address_en} />
                    <Input label="Buyer address (AR)" value={String(documentCustomFields.buyer_address_ar ?? "")} onChange={(event) => updateDocumentCustomField("buyer_address_ar", event.target.value || null)} disabled={readOnlyDocument} />
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-6">
                    {[
                      ["linked_proforma_number", "Proforma"],
                      ["linked_delivery_note_number", "Delivery note"],
                      ["linked_tax_invoice_number", "Tax invoice"],
                      ["buyer_vat_number", "VAT number"],
                      ["buyer_address_en", "Address"],
                      ["payment_reference_note", "Reference note"],
                    ].map(([field, label]) => (
                      <div key={field} className="rounded-lg border border-line bg-surface-soft px-3 py-2 text-xs text-muted">
                        <p className="font-semibold text-ink">{label}</p>
                        <p className="mt-1 truncate">{autofillSuggestions[field] || String(documentCustomFields[field] ?? "-")}</p>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <button type="button" onClick={() => confirmAutofillField(field)} disabled={readOnlyDocument || !autofillSuggestions[field]} className="text-primary underline-offset-2 hover:underline disabled:text-muted">
                            Confirm
                          </button>
                          {confirmedAutofillFields[field] ? <span className="font-semibold text-emerald-700">✓</span> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
                {isProforma || isTaxInvoice ? (
                  <details className="mt-2 rounded-lg border border-line bg-white p-2.5" data-inspector-proforma-payment-status="true" open={paymentDetailsOpen} onToggle={(event) => setPaymentDetailsOpen(event.currentTarget.open)}>
                    <summary className="cursor-pointer list-none text-sm font-semibold text-ink">{isProforma ? "Proforma payment tracking" : "Invoice payment planning"}</summary>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <div>
                        <label htmlFor="proforma-payment-status" className="mb-1 block text-[11px] font-semibold text-ink">Payment status</label>
                        <select id="proforma-payment-status" value={String(documentCustomFields.payment_status ?? "Not Received")} onChange={(event) => updateDocumentCustomField("payment_status", event.target.value)} className="block h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10">
                          <option value="Not Received">Not Received</option>
                          <option value="Partial">Partial</option>
                          <option value="Fully Received">Fully Received</option>
                        </select>
                      </div>
                      <Input label="Payment method" value={String(documentCustomFields.payment_method ?? "")} onChange={(event) => updateDocumentCustomField("payment_method", event.target.value || null)} disabled={readOnlyDocument} />
                      {String(documentCustomFields.payment_status ?? "Not Received") === "Partial" ? <Input label="Amount received" type="number" value={String(documentCustomFields.amount_received ?? "")} onChange={(event) => updateDocumentCustomField("amount_received", event.target.value || null)} disabled={readOnlyDocument} /> : null}
                      {String(documentCustomFields.payment_status ?? "Not Received") !== "Not Received" ? <Input label="Receipt date" type="date" value={String(documentCustomFields.receipt_date ?? "")} onChange={(event) => updateDocumentCustomField("receipt_date", event.target.value || null)} disabled={readOnlyDocument} /> : null}
                      {String(documentCustomFields.payment_status ?? "Not Received") !== "Not Received" ? <Input label="Reference No. / Note" value={String(documentCustomFields.payment_reference_note ?? "")} onChange={(event) => updateDocumentCustomField("payment_reference_note", event.target.value || null)} disabled={readOnlyDocument} /> : null}
                      <Input label="Temporary accounting ref" value={String(documentCustomFields.temporary_accounting_reference ?? "")} onChange={(event) => updateDocumentCustomField("temporary_accounting_reference", event.target.value || null)} disabled={readOnlyDocument} />
                    </div>
                  </details>
                ) : null}
                {isDeliveryNote ? <div className="mt-2 rounded-lg border border-line bg-white p-2.5 text-sm text-muted">Delivery note finalization releases stock only.</div> : null}
                {isTaxInvoice ? <div className="mt-2 rounded-lg border border-line bg-white p-2.5 text-sm text-muted">Tax invoice finalization posts revenue and VAT.</div> : null}
              </div>
            ) : null}
            {kind === "bill" ? (
              <>
                <div>
                  <label htmlFor="purchase-type" className="mb-2.5 block text-sm font-semibold text-ink">Purchase type</label>
                  <select id="purchase-type" value={purchaseContext.type} disabled={readOnlyDocument} onChange={(event) => setPurchaseContext((current) => ({ ...current, type: event.target.value }))} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-soft">
                    <option value="">Select purchase type</option>
                    <option value="inventory">Inventory</option>
                    <option value="services">Services</option>
                    <option value="asset">Asset</option>
                    <option value="overhead">Overhead</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="purchase-purpose" className="mb-2.5 block text-sm font-semibold text-ink">Purpose</label>
                  <select id="purchase-purpose" value={purchaseContext.purpose} disabled={readOnlyDocument} onChange={(event) => setPurchaseContext((current) => ({ ...current, purpose: event.target.value }))} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-soft">
                    <option value="">Select purpose</option>
                    <option value="resale">Resale</option>
                    <option value="operations">Operations</option>
                    <option value="project">Project delivery</option>
                    <option value="admin">Administration</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="purchase-category" className="mb-2.5 block text-sm font-semibold text-ink">Category</label>
                  <select id="purchase-category" value={purchaseContext.category} disabled={readOnlyDocument} onChange={(event) => setPurchaseContext((current) => ({ ...current, category: event.target.value }))} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-soft">
                    <option value="">Select category</option>
                    <option value="office">Office</option>
                    <option value="equipment">Equipment</option>
                    <option value="software">Software</option>
                    <option value="logistics">Logistics</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="document-cost-center" className="mb-2.5 block text-sm font-semibold text-ink">Document cost center</label>
                  <select id="document-cost-center" value={documentCostCenterId ?? ""} disabled={readOnlyDocument} onChange={(event) => setDocumentCostCenterId(event.target.value ? Number(event.target.value) : null)} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-soft">
                    <option value="">No cost center</option>
                    {costCenters.map((costCenter) => (
                      <option key={costCenter.id} value={costCenter.id}>{costCenter.code} · {costCenter.name}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}
            <div className="lg:col-span-2">
              <label htmlFor={notesId} className="mb-1 block text-[11px] font-semibold text-ink">Notes</label>
              <textarea id={notesId} value={notes} disabled={readOnlyDocument} onChange={(event) => setNotes(event.target.value)} rows={3} className="block w-full rounded-lg border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-soft" placeholder={kind === "invoice" ? "Optional message" : "Optional notes"} />
            </div>
            {visibleDocumentFieldDefinitions.length ? (
              <div className="lg:col-span-2 grid gap-2 md:grid-cols-2">
                {visibleDocumentFieldDefinitions.map((field) => {
                  const value = documentCustomFields[field.slug];

                  if (field.fieldType === "boolean") {
                    return (
                      <label key={field.id} className="flex items-center gap-2 rounded-lg border border-line bg-surface-soft px-3 py-2 text-sm font-semibold text-ink">
                        <input type="checkbox" checked={Boolean(value)} disabled={readOnlyDocument} onChange={(event) => updateDocumentCustomField(field.slug, event.target.checked)} />
                        {field.name}
                      </label>
                    );
                  }

                  if (field.fieldType === "select") {
                    return (
                      <div key={field.id}>
                        <label htmlFor={`${kind}-${field.slug}`} className="mb-1 block text-[11px] font-semibold text-ink">{field.name}</label>
                        <select id={`${kind}-${field.slug}`} value={normalizeFieldValue(value, field.fieldType)} disabled={readOnlyDocument} onChange={(event) => updateDocumentCustomField(field.slug, event.target.value || null)} className="block h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-soft">
                          <option value="">Select {field.name.toLowerCase()}</option>
                          {field.options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  return <Input key={field.id} label={field.name} value={normalizeFieldValue(value, field.fieldType)} onChange={(event) => updateDocumentCustomField(field.slug, event.target.value || null)} disabled={readOnlyDocument} />;
                })}
              </div>
            ) : null}
          </div>
        </Card>

        {kind === "invoice" && recommendedItems.length ? (
          <Card className="rounded-xl border-white/70 bg-white/95 p-2.5 shadow-[0_18px_36px_-28px_rgba(17,32,24,0.16)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">Frequent items</p>
                <p className="text-[11px] text-muted">Suggested from this customer&apos;s recent sales history.</p>
              </div>
              <Button size="xs" variant="secondary" href={mapWorkspaceHref("/workspace/user/stock", basePath)}>Open stock</Button>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {recommendedItems.map((entry) => (
                <button key={entry.item.id} type="button" onClick={() => applyRecommendedItem(entry.item.id)} className="rounded-lg border border-line bg-surface-soft px-3 py-2 text-left text-sm transition hover:border-primary hover:bg-primary-soft/10">
                  <span className="block font-semibold text-ink">{entry.item.name}</span>
                  <span className="block text-[11px] text-muted">{entry.timesUsed}x · last on {entry.lastDocumentNumber}</span>
                </button>
              ))}
            </div>
          </Card>
        ) : null}

        <div data-inspector-workflow-step="line-editor">
          <LineItemsEditor kind={kind} lines={lines} onChange={setLines} costCenters={costCenters} lineFieldDefinitions={lineFieldDefinitions} readOnly={readOnlyDocument} inventoryWarnings={inventoryWarnings} onOpenInventory={openInventoryWithDraftReturn} />
        </div>

        {lineValidation ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{lineValidation}</div> : null}
        {submitError ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</div> : null}

        {submitResult ? (
          <Card data-inspector-workflow-success="true" className="rounded-lg border-emerald-200 bg-emerald-50/80 p-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">{submitResult.document.status === "draft" ? "Draft saved" : "Invoice updated"}</p>
            <h3 data-inspector-workflow-success-heading="true" className="mt-3 text-2xl font-semibold text-ink">{submitResult.document.status === "draft" ? "Draft saved." : `${submitResult.document.number} is ready.`}</h3>
            <div className="mt-2 text-sm text-emerald-900/80">{labelize(submitResult.document.type)} · {submitResult.document.issueDate || issueDate} · {labelize(submitResult.document.status)}</div>
            <div className="mt-3 grid gap-2 md:grid-cols-4">
              <div className="rounded-lg bg-white px-3 py-2 text-sm text-muted"><p className="font-semibold text-ink">Document number</p><p data-inspector-workflow-document-number="true" className="mt-1">{submitResult.document.number}</p></div>
              <div className="rounded-lg bg-white px-3 py-2 text-sm text-muted"><p className="font-semibold text-ink">Issue date</p><p className="mt-1">{submitResult.document.issueDate || issueDate}</p></div>
              <div className="rounded-lg bg-white px-3 py-2 text-sm text-muted"><p className="font-semibold text-ink">Status</p><p className="mt-1">{submitResult.document.status.replaceAll("_", " ")}</p></div>
              <div className="rounded-lg bg-white px-3 py-2 text-sm text-muted"><p className="font-semibold text-ink">Total</p><p className="mt-1">{currency(submitResult.document.grandTotal)} {activeCurrency}</p></div>
              <div className="rounded-lg bg-white px-3 py-2 text-sm text-muted"><p className="font-semibold text-ink">Payment</p><p className="mt-1">{submitResult.payment ? `${currency(submitResult.payment.amount)} ${activeCurrency} recorded` : String(documentCustomFields.payment_status ?? "No payment recorded yet")}</p></div>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <div className="rounded-lg bg-white px-3 py-2 text-sm text-muted"><p className="font-semibold text-ink">Tracking</p><p className="mt-1">{trackStatus(submitResult.document)}</p></div>
              <div className="rounded-lg bg-white px-3 py-2 text-sm text-muted"><p className="font-semibold text-ink">Workflow chain</p><p className="mt-1">{workflowChain || `${labelize(submitResult.document.type)} ${submitResult.document.number}`}</p></div>
              <div className="rounded-lg bg-white px-3 py-2 text-sm text-muted"><p className="font-semibold text-ink">Next action</p><p data-inspector-workflow-next-action="true" className="mt-1">{submitResult.document.type === "tax_invoice" ? "Record payment or open register" : submitResult.document.type === "delivery_note" ? "Create tax invoice" : "Create delivery note or tax invoice"}</p></div>
            </div>
            {workflowActions.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {workflowActions.map((action) => (
                  <Button key={action.href} size="xs" variant="secondary" href={action.href}>{action.label}</Button>
                ))}
              </div>
            ) : null}
            {submitResult.document.type === "delivery_note" ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-900">
                Stock release is complete. Continue with Proforma or Tax Invoice to complete commercial and accounting flow.
              </div>
            ) : null}
            {submitResult.document.type === "tax_invoice" ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-900">
                Revenue and VAT are now posted with document chain visibility carried into audit, register, and payment surfaces.
              </div>
            ) : null}
          </Card>
        ) : null}

        {readOnlyDocument ? (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button href={mapWorkspaceHref("/workspace/user/invoices", basePath)} variant="secondary">Back to invoices</Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line/80 pt-2">
            {canSaveDraft ? <Button variant="secondary" onClick={handleSaveDraft} disabled={savingDraft || submitting}>{savingDraft ? "Saving draft" : activeDocumentId ? "Update draft" : "Save draft"}</Button> : null}
            <Button data-inspector-workflow-submit="true" onClick={handleSubmit} disabled={submitting || savingDraft}>{activeDocumentId ? "Finalize draft" : config.actionLabel}</Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Card className="rounded-xl border-white/70 bg-white/95 p-3 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl xl:sticky xl:top-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{kind === "invoice" ? "Invoice summary" : "Summary"}</p>
          <h3 className="mt-1 text-xl font-semibold text-ink">{kind === "invoice" ? (loadedDocument?.number || config.summaryLabel) : config.summaryLabel}</h3>
          <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-lg border border-line bg-surface-soft p-2.5">
              <div className="grid gap-1.5 text-xs text-muted">
                <div className="flex items-center justify-between gap-3"><span>{kind === "invoice" ? "Customer" : "Supplier"}</span><span className="text-right font-semibold text-ink">{selectedContact?.label ?? "Not chosen yet"}</span></div>
                <div className="flex items-center justify-between gap-3"><span>Type</span><span className="text-right font-semibold text-ink">{labelize(documentType)}</span></div>
                {isSalesAdjustment ? <div className="flex items-center justify-between gap-3"><span>Reference invoice</span><span className="text-right font-semibold text-ink">{selectedSourceDocument?.number ?? "Not linked yet"}</span></div> : null}
                <div className="flex items-center justify-between gap-3"><span>Lines</span><span className="font-semibold text-ink">{lines.length}</span></div>
                {kind === "invoice" ? <div className="flex items-center justify-between gap-3"><span>Supply date</span><span className="font-semibold text-ink">{String(documentCustomFields.supply_date ?? issueDate)}</span></div> : null}
                {loadedDocument ? <div className="flex items-center justify-between gap-3"><span>Status</span><span className="font-semibold text-ink">{readOnlyLabel}</span></div> : null}
                {loadedDocument ? <div className="flex items-center justify-between gap-3"><span>Balance</span><span className="font-semibold text-ink">{currency(loadedDocument.balanceDue)} SAR</span></div> : null}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-line bg-white px-3 py-2">
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Subtotal</div>
                <div className="mt-1 text-sm font-semibold text-ink">{currency(subtotal)} {activeCurrency}</div>
              </div>
              <div className="rounded-lg border border-line bg-white px-3 py-2">
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted">VAT</div>
                <div className="mt-1 text-sm font-semibold text-ink">{currency(vatTotal)} {activeCurrency}</div>
              </div>
              <div className="rounded-lg border border-line bg-white px-3 py-2">
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Total</div>
                <div className="mt-1 text-base font-semibold text-ink">{currency(total)} {activeCurrency}</div>
              </div>
            </div>
          </div>
          <div className="mt-2 rounded-lg border border-line bg-white p-2.5 text-sm text-muted">
            <p className="font-semibold text-ink">{readOnlyDocument ? "Document state" : "Record payment now"}</p>
            <div className="mt-2.5 space-y-2.5">
              <Input label={kind === "invoice" ? "Money received now" : "Money paid now"} type="number" min="0" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} disabled={readOnlyDocument || isProforma || isDeliveryNote} hint={isProforma ? "Use the proforma payment-status tracker above. No accounting payment is posted here." : isDeliveryNote ? "Delivery notes do not post payment entries." : kind === "invoice" ? "Leave blank to keep the invoice unpaid." : "Leave blank if this document stays open for later settlement."} />
              <div>
                <label htmlFor={`${kind}-payment-method`} className="mb-1 block text-[11px] font-semibold text-ink">Method</label>
                <select id={`${kind}-payment-method`} value={paymentMethod} disabled={readOnlyDocument || isProforma || isDeliveryNote} onChange={(event) => setPaymentMethod(event.target.value)} className="block h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-soft">
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <Input label="Payment reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Optional payment reference" disabled={readOnlyDocument || isProforma || isDeliveryNote} />
              {readOnlyDocument ? <p className="text-sm text-muted">Settlement remains available from the invoice register when this invoice still has an open balance.</p> : isProforma || isDeliveryNote ? <p className="text-sm text-muted">This document type does not create accounting settlement entries from this panel.</p> : <p className="text-sm text-muted">Saving a payment here updates the open balance immediately.</p>}
            </div>
          </div>
        </Card>
      </div>

      {shortageDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4">
          <Card className="w-full max-w-2xl rounded-2xl border-white/70 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Inventory validation</p>
                <h3 className="mt-2 text-2xl font-semibold text-ink">Stock shortage detected</h3>
                <p className="mt-3 text-sm text-muted">This delivery note cannot be finalized until inventory is replenished. The current draft can be preserved and reopened automatically after stock intake.</p>
              </div>
              <button type="button" onClick={() => setShortageDialogOpen(false)} className="rounded-full border border-line px-3 py-1 text-sm font-semibold text-muted transition hover:border-primary hover:text-primary">
                Close
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              {shortages.map((shortage) => (
                <div key={shortage.lineId} className="rounded-xl border border-line bg-surface-soft px-4 py-3 text-sm text-muted">
                  <p className="font-semibold text-ink">{shortage.description}</p>
                  <p className="mt-1">Requested {shortage.requested} · Available {shortage.available}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => setShortageDialogOpen(false)}>Review draft</Button>
              <Button onClick={() => {
                saveDraftForInventoryReturn();
                setShortageDialogOpen(false);
                router.push(mapWorkspaceHref(`/workspace/user/stock?returnTo=${encodeURIComponent("/workspace/invoices/new?resumeDraft=1")}`, basePath));
              }}>Add Inventory Now</Button>
            </div>
          </Card>
        </div>
      ) : null}

      <QuickCreateDialog open={createContactOpen && !readOnlyDocument} title={kind === "invoice" ? "Create customer" : "Create supplier"} description={kind === "invoice" ? "Save the customer with VAT, address, defaults, beneficiary details, and continue the invoice immediately." : "Save the supplier with purchasing defaults and beneficiary details without leaving the document draft."} onClose={() => setCreateContactOpen(false)}>
        <QuickCreateContactForm kind={config.contactKind} initialName={draftContactName} onSubmit={createContact} onComplete={(contact) => {
          setSelectedContact(contactToOption(contact));
          setSelectedContactRecord(contact);
          setContactValidation(undefined);
          setCreateContactOpen(false);
        }} />
      </QuickCreateDialog>

      {zatcaDuplicateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4">
          <Card className="w-full max-w-xl rounded-2xl border-white/70 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">ZATCA compliance</p>
                <h3 className="mt-2 text-2xl font-semibold text-ink">Issued invoices move through duplicate flow</h3>
                <p className="mt-3 text-sm text-muted">This invoice is already issued. To keep the audit chain valid, the current version is marked VOID and a new numbered duplicate is opened for edits.</p>
              </div>
              <button type="button" onClick={() => setZatcaDuplicateOpen(false)} className="rounded-full border border-line px-3 py-1 text-sm font-semibold text-muted transition hover:border-primary hover:text-primary">
                Close
              </button>
            </div>
            <div className="mt-5 grid gap-3 rounded-xl bg-surface-soft p-4 text-sm text-muted md:grid-cols-2">
              <div>
                <p className="font-semibold text-ink">Current document</p>
                <p className="mt-1">{loadedDocument?.number ?? (reference || "Issued invoice")}</p>
              </div>
              <div>
                <p className="font-semibold text-ink">Outcome</p>
                <p className="mt-1">New invoice number, original stays VOID, links and journals remain traceable.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => setZatcaDuplicateOpen(false)} disabled={duplicatingIssuedDocument}>Cancel</Button>
              <Button onClick={handleDuplicateIssuedDocument} disabled={duplicatingIssuedDocument}>{duplicatingIssuedDocument ? "Creating duplicate" : "Create compliant duplicate"}</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}