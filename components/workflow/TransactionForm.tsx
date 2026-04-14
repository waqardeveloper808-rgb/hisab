"use client";

import { useEffect, useMemo, useState } from "react";
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
  finalizeTransactionDraft,
  getDocument,
  listCostCenters,
  listCustomFieldDefinitions,
  listDocumentTemplates,
  recordDocumentPayment,
  saveTransactionDraft,
  submitTransaction,
  updateTransactionDraft,
  type CostCenterRecord,
  type CustomFieldDefinitionRecord,
  type DocumentDetailRecord,
  type DocumentTemplateRecord,
  type TransactionSubmissionResult,
} from "@/lib/workspace-api";
import { mapWorkspaceHref } from "@/lib/workspace-path";

type TransactionFormProps = {
  kind: TransactionKind;
  documentId?: number;
  initialDocumentType?: string;
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
    typeOptions: ["quotation", "proforma_invoice", "tax_invoice", "recurring_invoice", "cash_invoice", "api_invoice"],
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
    typeOptions: ["vendor_bill", "purchase_invoice", "purchase_order", "debit_note"],
  },
};

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
    seller_name_en: "Gulf Hisab Trading Co.",
    seller_name_ar: "شركة غلف حساب التجارية",
    seller_vat_number: "300123456700003",
    seller_address_en: "King Fahd Road, Riyadh 12271, Saudi Arabia",
    seller_address_ar: "طريق الملك فهد، الرياض 12271، المملكة العربية السعودية",
    buyer_name_en: "",
    buyer_name_ar: "",
    buyer_vat_number: "",
    buyer_address_en: "",
    buyer_address_ar: "",
  };
}

export function TransactionForm({ kind, documentId, initialDocumentType }: TransactionFormProps) {
  const config = configByKind[kind];
  const { basePath } = useWorkspacePath();
  const { createContact, customers, suppliers, searchContacts, items } = useWorkspaceData();
  const [selectedContact, setSelectedContact] = useState<PickerOption | null>(null);
  const [selectedContactRecord, setSelectedContactRecord] = useState<ContactRecord | null>(null);
  const [contactValidation, setContactValidation] = useState<string | undefined>();
  const [lineValidation, setLineValidation] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [submitResult, setSubmitResult] = useState<TransactionSubmissionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingEditor, setLoadingEditor] = useState(Boolean(documentId));
  const [loadedDocument, setLoadedDocument] = useState<DocumentDetailRecord | null>(null);
  const [hydratedDocumentId, setHydratedDocumentId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<DocumentTemplateRecord[]>([]);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinitionRecord[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenterRecord[]>([]);
  const [reference, setReference] = useState(kind === "invoice" ? "INV-DRAFT-1001" : "BILL-DRAFT-1001");
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
  const [draftContactName, setDraftContactName] = useState("");
  const [createContactOpen, setCreateContactOpen] = useState(false);
  const notesId = `${kind}-notes`;
  const activeDocumentId = documentId ?? loadedDocument?.id ?? null;
  const workflowStatus = normalizeDocumentWorkflowStatus(loadedDocument);
  const readOnlyDocument = Boolean(loadedDocument && workflowStatus !== "draft");
  const readOnlyLabel = workflowStatusLabel(workflowStatus);

  useEffect(() => {
    let active = true;

    Promise.all([listDocumentTemplates(), listCustomFieldDefinitions(), listCostCenters(true)])
      .then(([nextTemplates, nextFields, nextCostCenters]) => {
        if (!active) {
          return;
        }

        setTemplates(nextTemplates);
        setCustomFieldDefinitions(nextFields);
        setCostCenters(nextCostCenters);
      })
      .catch(() => {
        if (active) {
          setTemplates([]);
          setCustomFieldDefinitions([]);
          setCostCenters([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

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

    return field.appliesTo.length === 0 || field.appliesTo.includes(documentType);
  }), [customFieldDefinitions, documentType]);
  const selectedTemplate = availableTemplates.find((template) => template.id === templateId) ?? null;
  const activeCurrency = String(documentCustomFields.currency ?? "SAR");

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

  function updateDocumentCustomField(slug: string, value: string | number | boolean | null) {
    setDocumentCustomFields((current) => ({
      ...current,
      [slug]: value,
    }));
  }

  function validateSelection() {
    setContactValidation(undefined);
    setLineValidation(undefined);
    setSubmitError(undefined);

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

    return true;
  }

  async function handleSubmit() {
    if (readOnlyDocument) {
      setSubmitError("This invoice is read-only from this screen.");
      return;
    }

    if (!validateSelection() || !selectedContactRecord) {
      return;
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
          customFields: documentCustomFields,
          purchaseContext,
          contact: selectedContactRecord,
          reference,
          issueDate,
          dueDate,
          notes,
          lines,
          items,
        });

        const finalizedDocument = await finalizeTransactionDraft(kind, activeDocumentId);
        const payment = Number(paymentAmount) > 0
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
        const result = await submitTransaction({
          kind,
          documentType,
          title: documentTitle,
          templateId,
          costCenterId: documentCostCenterId,
          languageCode,
          customFields: documentCustomFields,
          purchaseContext,
          contact: selectedContactRecord,
          reference,
          issueDate,
          dueDate,
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
      setSubmitError("This invoice is read-only from this screen.");
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
            customFields: documentCustomFields,
            purchaseContext,
            contact: selectedContactRecord,
            reference,
            issueDate,
            dueDate,
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
            customFields: documentCustomFields,
            purchaseContext,
            contact: selectedContactRecord,
            reference,
            issueDate,
            dueDate,
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

  if (loadingEditor) {
    return (
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-8 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Invoice</p>
        <h2 className="mt-3 text-3xl font-semibold text-ink">Loading invoice</h2>
        <p className="mt-3 text-sm leading-7 text-muted">Loading saved invoice data.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]" data-inspector-workflow-form={kind} data-inspector-inline-create-contact="true" data-inspector-inline-create-item="true">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{kind === "invoice" ? "Invoice" : "Document"}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                {readOnlyDocument
                  ? loadedDocument?.number || "Invoice details"
                  : documentId
                    ? config.editTitle
                    : config.title}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {readOnlyDocument
                  ? `${readOnlyLabel} invoices are read-only from this screen.`
                  : config.description}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface-soft px-3 py-2 text-sm text-muted">
              <p className="font-semibold text-ink">{readOnlyDocument ? "Invoice status" : "Document setup"}</p>
              <p className="mt-2">
                {readOnlyDocument
                  ? `${readOnlyLabel} · ${currency(loadedDocument?.balanceDue ?? 0)} SAR open balance`
                  : `${count} saved ${kind === "invoice" ? "customers" : "suppliers"} and ${availableTemplates.length} matching templates ready.`}
              </p>
            </div>
        </div>

        {!readOnlyDocument ? (
          <Card className="rounded-[1.2rem] border-white/70 bg-white/92 p-4 shadow-[0_18px_36px_-28px_rgba(17,32,24,0.16)] backdrop-blur-xl">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-[1.2rem] border border-line bg-surface-soft px-4 py-3" data-inspector-workflow-step="contact">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Step 1</p>
                <p className="mt-1 font-semibold text-ink">Save {kind === "invoice" ? "customer" : "supplier"}</p>
                <p className="mt-1 text-sm text-muted">Pick an existing contact or create one inline without leaving the draft.</p>
              </div>
              <div className="rounded-[1.2rem] border border-line bg-surface-soft px-4 py-3" data-inspector-workflow-step="items">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Step 2</p>
                <p className="mt-1 font-semibold text-ink">Add saved line items</p>
                <p className="mt-1 text-sm text-muted">Each line must point to a saved product or service before the document can be finalized.</p>
              </div>
              <div className="rounded-[1.2rem] border border-line bg-surface-soft px-4 py-3" data-inspector-workflow-step="document">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Step 3</p>
                <p className="mt-1 font-semibold text-ink">Save or issue document</p>
                <p className="mt-1 text-sm text-muted">Draft first if needed, then finalize once dates, totals, and template are correct.</p>
              </div>
              <div className="rounded-[1.2rem] border border-line bg-surface-soft px-4 py-3" data-inspector-workflow-step="payment">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Step 4</p>
                <p className="mt-1 font-semibold text-ink">Record settlement</p>
                <p className="mt-1 text-sm text-muted">Optional payment updates the payment register and open balance in the same flow.</p>
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="rounded-[1.2rem] border-white/70 bg-white/92 p-4 shadow-[0_18px_36px_-28px_rgba(17,32,24,0.16)] backdrop-blur-xl">
          {readOnlyDocument ? <div className="mb-5 rounded-[1.4rem] border border-line bg-surface-soft px-4 py-3 text-sm text-muted">This invoice is available for viewing only. Use the invoice register for allowed follow-up actions.</div> : null}
          <div className="grid gap-3 lg:grid-cols-2">
            <EntityPicker
              label={config.contactLabel}
              placeholder={kind === "invoice" ? "Search customer name, city, phone, or email" : "Search supplier name, city, phone, or email"}
              selectedOption={selectedContact}
              onSearch={async (query) => {
                const contacts = await searchContacts(config.contactKind, query || " ");
                return contacts.map(contactToOption);
              }}
              onSelect={handleContactSelect}
              createLabel={kind === "invoice" ? "Add a new customer" : "Add a new supplier"}
              onCreateNew={(query) => {
                setDraftContactName(query);
                setCreateContactOpen(true);
              }}
              validationMessage={contactValidation}
              disabled={readOnlyDocument}
            />
            <Input label={config.referenceLabel} value={reference} onChange={(event) => setReference(event.target.value)} disabled={readOnlyDocument} />
            <Input label="Internal title" value={documentTitle} onChange={(event) => setDocumentTitle(event.target.value)} placeholder="Optional internal title for the register" disabled={readOnlyDocument} />
            <div>
              <label htmlFor={`${kind}-language`} className="mb-2.5 block text-sm font-semibold text-ink">Language</label>
              <select id={`${kind}-language`} value={languageCode} disabled={readOnlyDocument} onChange={(event) => setLanguageCode(event.target.value === "ar" ? "ar" : "en")} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-soft">
                <option value="en">English</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
            <Input label="Issue date" type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} disabled={readOnlyDocument} />
            <Input label="Due date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={readOnlyDocument} />
            <div>
              <label htmlFor={`${kind}-template`} className="mb-2.5 block text-sm font-semibold text-ink">Template</label>
              <select id={`${kind}-template`} value={templateId ?? ""} disabled={readOnlyDocument} onChange={(event) => setTemplateId(event.target.value ? Number(event.target.value) : null)} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-soft">
                <option value="">Default template</option>
                {availableTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <p className="mb-2.5 text-sm font-semibold text-ink">Document type</p>
              <div className="flex flex-wrap gap-2">
                {config.typeOptions.map((option) => {
                  const active = documentType === option;

                  return (
                    <button key={option} type="button" disabled={readOnlyDocument} onClick={() => setDocumentType(option)} className={["rounded-full border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60", active ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface-soft text-ink"].join(" ")}>
                      {labelize(option)}
                    </button>
                  );
                })}
              </div>
            </div>
            {kind === "invoice" ? (
              <div className="lg:col-span-2 rounded-[1.4rem] border border-line bg-surface-soft p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">ZATCA invoice identity</p>
                    <p className="mt-1 text-sm text-muted">Seller, buyer, supply date, and invoice currency flow into preview, PDF, QR, and totals.</p>
                  </div>
                  <div className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Template {selectedTemplate?.name ?? "Default"}</div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Input label="Supply date" type="date" value={String(documentCustomFields.supply_date ?? "")} onChange={(event) => updateDocumentCustomField("supply_date", event.target.value || null)} disabled={readOnlyDocument} />
                  <Input label="Currency" value={activeCurrency} onChange={(event) => updateDocumentCustomField("currency", event.target.value.toUpperCase() || "SAR")} disabled={readOnlyDocument} />
                  <Input label="Seller name (EN)" value={String(documentCustomFields.seller_name_en ?? "")} onChange={(event) => updateDocumentCustomField("seller_name_en", event.target.value || null)} disabled={readOnlyDocument} />
                  <Input label="Seller name (AR)" value={String(documentCustomFields.seller_name_ar ?? "")} onChange={(event) => updateDocumentCustomField("seller_name_ar", event.target.value || null)} disabled={readOnlyDocument} />
                  <Input label="Seller VAT number" value={String(documentCustomFields.seller_vat_number ?? "")} onChange={(event) => updateDocumentCustomField("seller_vat_number", event.target.value || null)} disabled={readOnlyDocument} />
                  <Input label="Buyer VAT number" value={String(documentCustomFields.buyer_vat_number ?? "")} onChange={(event) => updateDocumentCustomField("buyer_vat_number", event.target.value || null)} disabled={readOnlyDocument} />
                  <Input label="Buyer name (EN)" value={String(documentCustomFields.buyer_name_en ?? "")} onChange={(event) => updateDocumentCustomField("buyer_name_en", event.target.value || null)} disabled={readOnlyDocument} />
                  <Input label="Buyer name (AR)" value={String(documentCustomFields.buyer_name_ar ?? "")} onChange={(event) => updateDocumentCustomField("buyer_name_ar", event.target.value || null)} disabled={readOnlyDocument} />
                  <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
                    <Input label="Seller address (EN)" value={String(documentCustomFields.seller_address_en ?? "")} onChange={(event) => updateDocumentCustomField("seller_address_en", event.target.value || null)} disabled={readOnlyDocument} />
                    <Input label="Seller address (AR)" value={String(documentCustomFields.seller_address_ar ?? "")} onChange={(event) => updateDocumentCustomField("seller_address_ar", event.target.value || null)} disabled={readOnlyDocument} />
                    <Input label="Buyer address (EN)" value={String(documentCustomFields.buyer_address_en ?? "")} onChange={(event) => updateDocumentCustomField("buyer_address_en", event.target.value || null)} disabled={readOnlyDocument} />
                    <Input label="Buyer address (AR)" value={String(documentCustomFields.buyer_address_ar ?? "")} onChange={(event) => updateDocumentCustomField("buyer_address_ar", event.target.value || null)} disabled={readOnlyDocument} />
                  </div>
                </div>
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
              <label htmlFor={notesId} className="mb-2.5 block text-sm font-semibold text-ink">Notes</label>
              <textarea id={notesId} value={notes} disabled={readOnlyDocument} onChange={(event) => setNotes(event.target.value)} rows={4} className="block w-full rounded-[1.4rem] border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-soft" placeholder={kind === "invoice" ? "Optional message for this invoice" : "Optional notes for this bill"} />
            </div>
            {documentFieldDefinitions.length ? (
              <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
                {documentFieldDefinitions.map((field) => {
                  const value = documentCustomFields[field.slug];

                  if (field.fieldType === "boolean") {
                    return (
                      <label key={field.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink">
                        <input type="checkbox" checked={Boolean(value)} disabled={readOnlyDocument} onChange={(event) => updateDocumentCustomField(field.slug, event.target.checked)} />
                        {field.name}
                      </label>
                    );
                  }

                  if (field.fieldType === "select") {
                    return (
                      <div key={field.id}>
                        <label htmlFor={`${kind}-${field.slug}`} className="mb-2.5 block text-sm font-semibold text-ink">{field.name}</label>
                        <select id={`${kind}-${field.slug}`} value={normalizeFieldValue(value, field.fieldType)} disabled={readOnlyDocument} onChange={(event) => updateDocumentCustomField(field.slug, event.target.value || null)} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-soft">
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

        <div data-inspector-workflow-step="line-editor">
          <LineItemsEditor kind={kind} lines={lines} onChange={setLines} costCenters={costCenters} lineFieldDefinitions={lineFieldDefinitions} readOnly={readOnlyDocument} />
        </div>

        {lineValidation ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{lineValidation}</div> : null}
        {submitError ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</div> : null}

        {submitResult ? (
          <Card className="rounded-[1.8rem] border-emerald-200 bg-emerald-50/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">{submitResult.document.status === "draft" ? "Draft saved" : "Invoice updated"}</p>
            <h3 className="mt-3 text-2xl font-semibold text-ink">{submitResult.document.status === "draft" ? "Draft saved." : `${submitResult.document.number} is ready.`}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.3rem] bg-white px-4 py-3 text-sm text-muted"><p className="font-semibold text-ink">Status</p><p className="mt-1">{submitResult.document.status.replaceAll("_", " ")}</p></div>
              <div className="rounded-[1.3rem] bg-white px-4 py-3 text-sm text-muted"><p className="font-semibold text-ink">Total</p><p className="mt-1">{currency(submitResult.document.grandTotal)} SAR</p></div>
              <div className="rounded-[1.3rem] bg-white px-4 py-3 text-sm text-muted"><p className="font-semibold text-ink">Payment</p><p className="mt-1">{submitResult.payment ? `${currency(submitResult.payment.amount)} SAR recorded` : "No payment recorded yet"}</p></div>
            </div>
          </Card>
        ) : null}

        {readOnlyDocument ? (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button href={mapWorkspaceHref("/workspace/user/invoices", basePath)} variant="secondary">Back to invoices</Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="secondary" onClick={handleSaveDraft} disabled={savingDraft || submitting}>{savingDraft ? "Saving draft" : activeDocumentId ? "Update draft" : "Save draft"}</Button>
            <Button onClick={handleSubmit} disabled={submitting || savingDraft}>{activeDocumentId ? "Finalize draft" : config.actionLabel}</Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <Card className="rounded-[2rem] border-white/70 bg-white/92 p-6 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl xl:sticky xl:top-28">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{kind === "invoice" ? "Invoice summary" : "Summary"}</p>
          <h3 className="mt-3 text-2xl font-semibold text-ink">{kind === "invoice" ? (loadedDocument?.number || config.summaryLabel) : config.summaryLabel}</h3>
          <div className="mt-5 rounded-[1.6rem] bg-surface-soft p-4">
            <div className="flex items-center justify-between text-sm text-muted"><span>{kind === "invoice" ? "Customer" : "Supplier"}</span><span className="font-semibold text-ink">{selectedContact?.label ?? "Not chosen yet"}</span></div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted"><span>Type</span><span className="font-semibold text-ink">{labelize(documentType)}</span></div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted"><span>Template</span><span className="font-semibold text-ink">{selectedTemplate?.name ?? "Default"}</span></div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted"><span>Lines</span><span className="font-semibold text-ink">{lines.length}</span></div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted"><span>Subtotal</span><span className="font-semibold text-ink">{currency(subtotal)} {activeCurrency}</span></div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted"><span>VAT</span><span className="font-semibold text-ink">{currency(vatTotal)} {activeCurrency}</span></div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted"><span>Total</span><span className="text-lg font-semibold text-ink">{currency(total)} {activeCurrency}</span></div>
            {kind === "invoice" ? <div className="mt-3 flex items-center justify-between text-sm text-muted"><span>Supply date</span><span className="font-semibold text-ink">{String(documentCustomFields.supply_date ?? issueDate)}</span></div> : null}
            {loadedDocument ? <div className="mt-3 flex items-center justify-between text-sm text-muted"><span>Status</span><span className="font-semibold text-ink">{readOnlyLabel}</span></div> : null}
            {loadedDocument ? <div className="mt-3 flex items-center justify-between text-sm text-muted"><span>Balance</span><span className="font-semibold text-ink">{currency(loadedDocument.balanceDue)} SAR</span></div> : null}
          </div>
          <div className="mt-5 rounded-[1.6rem] border border-line bg-white p-4 text-sm text-muted">
            <p className="font-semibold text-ink">{readOnlyDocument ? "Document state" : "Record payment now"}</p>
            <div className="mt-4 space-y-4">
              <Input label={kind === "invoice" ? "Money received now" : "Money paid now"} type="number" min="0" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} disabled={readOnlyDocument} hint={kind === "invoice" ? "Leave blank to keep the invoice unpaid." : "Leave blank if this document stays open for later settlement."} />
              <div>
                <label htmlFor={`${kind}-payment-method`} className="mb-2.5 block text-sm font-semibold text-ink">Method</label>
                <select id={`${kind}-payment-method`} value={paymentMethod} disabled={readOnlyDocument} onChange={(event) => setPaymentMethod(event.target.value)} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-soft">
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <Input label="Payment reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Optional payment reference" disabled={readOnlyDocument} />
              {readOnlyDocument ? <p className="text-sm text-muted">Settlement remains available from the invoice register when this invoice still has an open balance.</p> : <p className="text-sm text-muted">Saving a payment here updates the payment register and reduces the open balance immediately.</p>}
            </div>
          </div>
        </Card>
      </div>

      <QuickCreateDialog open={createContactOpen && !readOnlyDocument} title={kind === "invoice" ? "Add a customer" : "Add a supplier"} description={kind === "invoice" ? "Save the customer and continue the invoice." : "Save the supplier here and continue the bill without losing any draft details."} onClose={() => setCreateContactOpen(false)}>
        <QuickCreateContactForm kind={config.contactKind} initialName={draftContactName} onSubmit={createContact} onComplete={(contact) => {
          setSelectedContact(contactToOption(contact));
          setSelectedContactRecord(contact);
          setContactValidation(undefined);
          setCreateContactOpen(false);
        }} />
      </QuickCreateDialog>
    </div>
  );
}