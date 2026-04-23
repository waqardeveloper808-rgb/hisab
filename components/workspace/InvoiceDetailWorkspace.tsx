"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { AuditTrailPanel } from "@/components/workspace/AuditTrailPanel";
import { CommunicationStatusBadge } from "@/components/workspace/CommunicationStatusBadge";
import { CommunicationTimelinePanel } from "@/components/workspace/CommunicationTimelinePanel";
import { SendCommunicationDialog } from "@/components/workspace/SendCommunicationDialog";
import { DocumentViewer } from "@/components/workspace/DocumentViewer";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { currency } from "@/components/workflow/utils";
import { getEditabilityVerdict, type ZatcaDocumentState } from "@/lib/zatca-engine";
import {
  duplicateDocument,
  finalizeTransactionDraft,
  getDocument,
  getDocumentPdfUrl,
  getDocumentPreview,
  listDocumentTemplates,
  recordDocumentPayment,
  sendDocument,
  type CommunicationRecord,
  type DocumentTemplateRecord,
  type DocumentDetailRecord,
} from "@/lib/workspace-api";
import { mapWorkspaceHref } from "@/lib/workspace-path";

const invoiceDetailCache = new Map<number, { document: DocumentDetailRecord; previewHtml: string }>();

type InvoiceLifecycle = "draft" | "issued" | "reported" | "paid" | "overdue";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatBusinessDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const normalized = value.includes("T") ? value : `${value}T00:00:00`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function normalizeInvoiceStatus(invoice: DocumentDetailRecord): InvoiceLifecycle {
  if (invoice.status === "draft") {
    return "draft";
  }

  if (invoice.status === "paid" || (invoice.grandTotal > 0 && invoice.balanceDue <= 0)) {
    return "paid";
  }

  const dueDate = invoice.dueDate ? invoice.dueDate.slice(0, 10) : "";

  if (dueDate && dueDate < today() && invoice.balanceDue > 0) {
    return "overdue";
  }

  if (invoice.sentAt || invoice.status === "sent") {
    return "reported";
  }

  return "issued";
}

function statusLabel(status: InvoiceLifecycle) {
  return {
    draft: "Draft",
    issued: "Issued",
    reported: "Reported",
    paid: "Paid",
    overdue: "Overdue",
  }[status];
}

function statusClasses(status: InvoiceLifecycle) {
  return {
    draft: "border-amber-200 bg-amber-50 text-amber-800",
    issued: "border-sky-200 bg-sky-50 text-sky-800",
    reported: "border-indigo-200 bg-indigo-50 text-indigo-800",
    paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
    overdue: "border-rose-200 bg-rose-50 text-rose-800",
  }[status];
}

type InvoiceDetailWorkspaceProps = {
  documentId: number | null;
  mode?: "panel" | "page";
  reloadKey?: number;
  onDocumentChanged?: (document: DocumentDetailRecord) => void;
  showHistoryPanel?: boolean;
  onToggleHistoryPanel?: () => void;
  onClosePreview?: () => void;
};

export function InvoiceDetailWorkspace({ documentId, mode = "panel", reloadKey = 0, onDocumentChanged, showHistoryPanel = mode === "page", onToggleHistoryPanel, onClosePreview }: InvoiceDetailWorkspaceProps) {
  const { basePath } = useWorkspacePath();
  const [document, setDocument] = useState<DocumentDetailRecord | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [templates, setTemplates] = useState<DocumentTemplateRecord[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(Boolean(documentId));
  const [error, setError] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [actionNotice, setActionNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [latestCommunication, setLatestCommunication] = useState<CommunicationRecord | null>(null);
  const [communicationReloadKey, setCommunicationReloadKey] = useState(0);
  const requestSequenceRef = useRef(0);

  const refreshDocument = useCallback(async (options?: {
    showLoading?: boolean;
    notifyParent?: boolean;
    resetPaymentDraft?: boolean;
  }) => {
    if (!documentId) {
      return null;
    }

    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;

    if (options?.showLoading) {
      setLoading(true);
      setError(null);
    }

    const cached = invoiceDetailCache.get(documentId);

    if (cached) {
      setDocument(cached.document);
      setPreviewHtml(cached.previewHtml);
    }

    try {
      const [nextDocument, preview] = await Promise.all([
        getDocument(documentId),
        getDocumentPreview(documentId, { templateId: typeof selectedTemplateId === "number" ? selectedTemplateId : undefined }),
      ]);

      if (requestSequenceRef.current !== requestId) {
        return null;
      }

      setDocument(nextDocument);
      setPreviewHtml(preview.html);
      invoiceDetailCache.set(documentId, { document: nextDocument, previewHtml: preview.html });

      if (options?.resetPaymentDraft) {
        setPaymentAmount(String(nextDocument.balanceDue || 0));
        setPaymentDate(today());
        setPaymentMethod("bank_transfer");
        setPaymentReference("");
      }

      if (options?.notifyParent) {
        onDocumentChanged?.(nextDocument);
      }

      return nextDocument;
    } catch (nextError) {
      if (requestSequenceRef.current === requestId) {
        setError(nextError instanceof Error ? nextError.message : "Invoice could not be loaded.");
      }

      return null;
    } finally {
      if (requestSequenceRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [documentId, onDocumentChanged, selectedTemplateId]);

  useEffect(() => {
    let active = true;

    listDocumentTemplates()
      .then((records) => {
        if (!active) {
          return;
        }

        setTemplates(records);
      })
      .catch((err: unknown) => {
        console.error('[InvoiceDetailWorkspace] listDocumentTemplates failed:', err);
        if (active) {
          setTemplates([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!documentId) {
      requestSequenceRef.current += 1;
      setDocument(null);
      setPreviewHtml("");
      setLoading(false);
      setError(null);
      return;
    }

    setActionNotice(null);

    void refreshDocument({ showLoading: true, notifyParent: false, resetPaymentDraft: true });
  }, [documentId, refreshDocument]);

  useEffect(() => {
    if (!document) {
      setSelectedTemplateId(null);
      return;
    }

    setSelectedTemplateId((current) => current ?? document.templateId ?? null);
  }, [document]);

  useEffect(() => {
    if (!documentId || reloadKey === 0) {
      return;
    }

    void refreshDocument({ showLoading: false, notifyParent: false, resetPaymentDraft: true });
  }, [documentId, refreshDocument, reloadKey]);

  async function handleIssue() {
    if (!documentId) {
      return;
    }

    setRunningAction("issue");
    setError(null);

    try {
      await finalizeTransactionDraft("invoice", documentId);
      await refreshDocument({ showLoading: false, notifyParent: true, resetPaymentDraft: true });
      setActionNotice({ tone: "success", text: "Invoice issued successfully." });
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Invoice could not be issued.";
      setError(message);
      setActionNotice({ tone: "error", text: message });
    } finally {
      setRunningAction(null);
    }
  }

  async function handleRecordPayment() {
    if (!documentId || !document) {
      return;
    }

    const numericAmount = Number(paymentAmount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a payment amount greater than zero.");
      return;
    }

    setRunningAction("payment");
    setError(null);

    try {
      await recordDocumentPayment({
        direction: "incoming",
        documentId,
        amount: numericAmount,
        paymentDate,
        method: paymentMethod,
        reference: paymentReference,
      });
      setShowPaymentForm(false);
      await refreshDocument({ showLoading: false, notifyParent: true, resetPaymentDraft: true });
      setActionNotice({ tone: "success", text: "Payment recorded successfully." });
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Payment could not be recorded.";
      setError(message);
      setActionNotice({ tone: "error", text: message });
    } finally {
      setRunningAction(null);
    }
  }

  async function handleSend() {
    if (!documentId) {
      return;
    }

    setShowSendDialog(true);
  }

  async function handleLegacyQuickSend() {
    if (!documentId) {
      return;
    }

    setRunningAction("send");
    setError(null);

    try {
      const nextDocument = await sendDocument(documentId, document?.sentToEmail ? { email: document.sentToEmail } : undefined);
      setDocument(nextDocument);
      invoiceDetailCache.set(documentId, { document: nextDocument, previewHtml });
      onDocumentChanged?.(nextDocument);
      setActionNotice({ tone: "success", text: "Invoice sent successfully." });
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Invoice could not be sent.";
      setError(message);
      setActionNotice({ tone: "error", text: message });
    } finally {
      setRunningAction(null);
    }
  }

  async function handleCommunicationSent(communication: CommunicationRecord) {
    setLatestCommunication(communication);
    setCommunicationReloadKey((current) => current + 1);
    await refreshDocument({ showLoading: false, notifyParent: true, resetPaymentDraft: false });
    setActionNotice({ tone: "success", text: "Invoice sent through the Communication module." });
  }

  function handleDownloadStart() {
    if (runningAction) {
      return;
    }

    setRunningAction("download");
    setActionNotice({ tone: "success", text: "PDF download started." });
    window.setTimeout(() => {
      setRunningAction((current) => current === "download" ? null : current);
    }, 500);
  }

  async function handleDuplicateIssuedDocument() {
    if (!documentId || !document) {
      return;
    }

    setRunningAction("duplicate");
    setError(null);

    try {
      const duplicate = await duplicateDocument(documentId);
      invoiceDetailCache.delete(documentId);
      setShowDuplicateModal(false);
      window.location.assign(mapWorkspaceHref(`/workspace/invoices/${duplicate.id}`, basePath));
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Compliant duplicate could not be created.";
      setError(message);
      setActionNotice({ tone: "error", text: message });
    } finally {
      setRunningAction(null);
    }
  }

  if (!documentId) {
    return (
      <Card className="rounded-xl bg-white/95 p-3" data-inspector-document-render-surface="true">
        <p className="text-sm text-muted">Select an invoice row to keep the register visible while reviewing its details.</p>
      </Card>
    );
  }

  if (loading && !document) {
    return <Card className="rounded-2xl bg-white/95 p-4 text-sm text-muted" data-inspector-document-render-surface="true">Loading invoice…</Card>;
  }

  if (!document) {
    return <Card className="rounded-2xl bg-white/95 p-4 text-sm text-red-700" data-inspector-document-render-surface="true">{error || "Invoice could not be loaded."}</Card>;
  }

  const lifecycle = normalizeInvoiceStatus(document);
  const canIssue = lifecycle === "draft";
  const canRecordPayment = lifecycle !== "draft" && lifecycle !== "paid" && document.balanceDue > 0;
  const canSend = lifecycle !== "draft";
  const canIssueAdjustments = document.type === "tax_invoice" && lifecycle !== "draft";

  const zatcaState = (document.status === "draft" ? "draft" : lifecycle === "paid" ? "paid" : "issued") as ZatcaDocumentState;
  const editabilityVerdict = getEditabilityVerdict({
    documentState: zatcaState,
    hasPayments: document.paidTotal > 0,
    isInLockedPeriod: false,
    isTaxReported: lifecycle === "reported",
  });
  const canEdit = editabilityVerdict.canEdit;
  const editHref = mapWorkspaceHref(`/workspace/invoices/${document.id}?mode=edit`, basePath);
  const openHref = mapWorkspaceHref(`/workspace/invoices/${document.id}`, basePath);
  const pdfHref = getDocumentPdfUrl(document.id, { templateId: selectedTemplateId });
  const registerHref = mapWorkspaceHref("/workspace/user/invoices", basePath);
  const impactQuery = `invoice_id=${document.id}&invoice_number=${encodeURIComponent(document.number)}`;
  const journalHref = mapWorkspaceHref(`/workspace/user/journal-entries?${impactQuery}`, basePath);
  const ledgerHref = mapWorkspaceHref(`/workspace/accounting/books?${impactQuery}`, basePath);
  const trialBalanceHref = mapWorkspaceHref(`/workspace/user/reports/trial-balance?${impactQuery}`, basePath);
  const reportsHref = mapWorkspaceHref(`/workspace/user/reports/receivables-aging?q=${encodeURIComponent(document.number)}`, basePath);
  const sourceInvoiceHref = document.sourceDocumentId ? mapWorkspaceHref(`/workspace/invoices/${document.sourceDocumentId}`, basePath) : null;
  const linkedPaymentNumber = String(document.customFields.linked_payment_number ?? "").trim();
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;
  const relevantTemplates = templates.filter((template) => template.documentTypes.includes(document.type));

  return (
    <div className="space-y-3" data-inspector-document-render-surface="true" data-inspector-document-view="invoice">
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      {actionNotice ? (
        <div className={["rounded-lg px-3 py-2 text-sm", actionNotice.tone === "success" ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "border border-red-200 bg-red-50 text-red-700"].join(" ")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{actionNotice.text}</span>
            {actionNotice.tone === "success" && actionNotice.text.toLowerCase().includes("payment") ? (
              <div className="flex flex-wrap gap-2">
                <Button size="xs" variant="secondary" href={journalHref}>View Journal</Button>
                <Button size="xs" variant="secondary" href={reportsHref}>View Reports</Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <Card className="overflow-hidden rounded-xl bg-white/95 p-0">
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-ink">{document.number}</p>
              <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]", statusClasses(lifecycle)].join(" ")}>{statusLabel(lifecycle)}</span>
              {latestCommunication ? <CommunicationStatusBadge communication={latestCommunication} /> : null}
              {loading ? <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Refreshing</span> : null}
            </div>
            <p className="text-[11px] text-muted">{document.contactName || "No customer"} · {formatBusinessDate(document.issueDate)} · Balance {currency(document.balanceDue)} SAR</p>
            {sourceInvoiceHref ? <p className="text-[11px] text-muted">Linked invoice <a href={sourceInvoiceHref} className="font-semibold text-primary underline-offset-2 hover:underline">{String(document.customFields.source_invoice_number ?? "Open source")}</a></p> : null}
          </div>
          <div className="flex flex-wrap gap-1.5" data-inspector-issued-actions="true">
            {canIssue ? <Button size="xs" onClick={handleIssue} disabled={runningAction !== null}>{runningAction === "issue" ? "Finalize" : "Finalize"}</Button> : null}
            {canSend ? <Button size="xs" variant="secondary" onClick={() => void handleSend()} disabled={runningAction !== null}>Send</Button> : null}
            {canSend ? <Button size="xs" variant="tertiary" onClick={() => void handleLegacyQuickSend()} disabled={runningAction !== null}>{runningAction === "send" ? "Sending" : "Quick send"}</Button> : null}
            <Button size="xs" variant="secondary" href={openHref}>Preview</Button>
            {canEdit ? <Button size="xs" variant="secondary" href={editHref}>Edit</Button> : null}
            {canIssueAdjustments ? <Button size="xs" variant="secondary" href={mapWorkspaceHref(`/workspace/invoices/new?documentType=credit_note&sourceDocumentId=${document.id}&linkedTax=${encodeURIComponent(document.number)}`, basePath)}>Credit Note</Button> : null}
            {canIssueAdjustments ? <Button size="xs" variant="secondary" href={mapWorkspaceHref(`/workspace/invoices/new?documentType=debit_note&sourceDocumentId=${document.id}&linkedTax=${encodeURIComponent(document.number)}`, basePath)}>Debit Note</Button> : null}
            <Button size="xs" variant="secondary" href={pdfHref} linkBehavior="anchor" onClick={handleDownloadStart} disabled={runningAction !== null}>{runningAction === "download" ? "Starting PDF" : "Download"}</Button>
            {mode === "panel" ? <Button size="xs" variant={showHistoryPanel ? "primary" : "secondary"} onClick={onToggleHistoryPanel}>{showHistoryPanel ? "Hide History" : "History"}</Button> : null}
            {canRecordPayment ? <Button size="xs" variant="secondary" onClick={() => setShowPaymentForm((current) => !current)} disabled={runningAction !== null}>{showPaymentForm ? "Close Payment" : "Record Payment"}</Button> : null}
            {!canEdit ? <Button size="xs" variant="secondary" onClick={() => setShowDuplicateModal(true)} disabled={runningAction !== null}>{runningAction === "duplicate" ? "Duplicating" : "Duplicate"}</Button> : null}
            {mode === "panel" && onClosePreview ? <Button size="xs" variant="secondary" onClick={onClosePreview}>Close preview</Button> : null}
            {mode === "page" ? <Button size="xs" variant="secondary" href={registerHref}>Back</Button> : null}
          </div>
        </div>

        {!canEdit && editabilityVerdict.reason ? <div className="border-b border-line bg-amber-50/70 px-3 py-2 text-xs font-medium text-amber-800">{editabilityVerdict.reason}. Use Duplicate to create the next editable invoice while preserving the original ZATCA trail.</div> : null}

        <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-1.5">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted">
            <span className="font-semibold text-ink">Template</span>
            <span>{selectedTemplate?.name || document.templateName || "Default template"}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[11rem]">
              <select value={selectedTemplateId ?? ""} onChange={(event) => setSelectedTemplateId(event.target.value ? Number(event.target.value) : null)} className="block h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                <option value="">Default template</option>
                {relevantTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>
            <Button size="xs" variant="secondary" href={mapWorkspaceHref("/workspace/settings/templates", basePath)}>Customize templates</Button>
          </div>
        </div>

        {showPaymentForm ? (
          <div className="grid gap-2 border-b border-line px-3 py-2 md:grid-cols-2 xl:grid-cols-4">
            <Input label="Amount" type="number" min="0" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} labelClassName="mb-1 text-[10px]" inputClassName="h-10 rounded-lg px-3 text-sm" />
            <Input label="Payment date" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} labelClassName="mb-1 text-[10px]" inputClassName="h-10 rounded-lg px-3 text-sm" />
            <div>
              <label htmlFor={`invoice-payment-method-${document.id}`} className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink">Method</label>
              <select id={`invoice-payment-method-${document.id}`} value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="block h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                <option value="bank_transfer">Bank transfer</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <Input label="Reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} labelClassName="mb-1 text-[10px]" inputClassName="h-10 rounded-lg px-3 text-sm" />
            <div className="md:col-span-4 flex justify-end gap-2">
              <Button size="xs" variant="secondary" onClick={() => setShowPaymentForm(false)}>Cancel</Button>
              <Button size="xs" onClick={handleRecordPayment} disabled={runningAction !== null}>{runningAction === "payment" ? "Saving" : "Save payment"}</Button>
            </div>
          </div>
        ) : null}

        <Card className="overflow-hidden rounded-xl bg-white p-0">
          <div className="border-b border-line px-3 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Document preview</p>
                <p className="text-[11px] text-muted">Rendered output for print, PDF, and customer-facing delivery.</p>
              </div>
              <div className="rounded-full border border-line bg-surface-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{selectedTemplate?.name || document.templateName || "Default template"}</div>
            </div>
          </div>
          {previewHtml ? (
            <div style={{ height: "calc(100vh - 520px)", minHeight: "500px" }}>
              <DocumentViewer htmlContent={previewHtml} fileName={document.number} pdfUrl={pdfHref} />
            </div>
          ) : (
            <div className="flex h-96 items-center justify-center text-sm text-muted">
              Preview loading…
            </div>
          )}
        </Card>

        <div className="border border-line bg-surface-soft/25 px-3 py-2" data-inspector-accounting-impact="invoice">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Accounting impact</p>
              <p className="mt-1 text-xs font-semibold text-ink" data-inspector-accounting-impact-title="invoice">Impact of Invoice {document.number}</p>
              <p className="mt-1 text-xs text-muted">Only invoice-linked journals, ledger movement, and trial-balance delta are shown.</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button size="xs" variant="secondary" href={journalHref}>View journal entries</Button>
              <Button size="xs" variant="secondary" href={ledgerHref}>View ledger impact</Button>
              <Button size="xs" variant="secondary" href={trialBalanceHref}>View trial balance</Button>
              {sourceInvoiceHref ? <Button size="xs" variant="secondary" href={sourceInvoiceHref}>Open source document</Button> : null}
              {linkedPaymentNumber ? <Button size="xs" variant="secondary" href={mapWorkspaceHref(`/workspace/user/payments?q=${encodeURIComponent(linkedPaymentNumber)}`, basePath)}>View payment</Button> : null}
            </div>
          </div>
        </div>

        {mode === "page" ? (
          <div className="space-y-2.5">
            <Card className="rounded-xl bg-white p-3">
              <AuditTrailPanel documentId={document.id} documentType={document.type} documentStatus={document.status} />
            </Card>
            <CommunicationTimelinePanel sourceType="document" sourceId={document.id} reloadKey={communicationReloadKey} />
          </div>
        ) : null}
      </Card>

      <SendCommunicationDialog
        open={showSendDialog}
        documentId={document.id}
        documentType={document.type}
        defaultEmail={document.sentToEmail || ""}
        onClose={() => setShowSendDialog(false)}
        onSent={(communication) => void handleCommunicationSent(communication)}
      />

      {showDuplicateModal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/45 px-4">
          <Card className="w-full max-w-lg rounded-2xl border-white/70 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">ZATCA duplicate</p>
                <h3 className="mt-2 text-xl font-semibold text-ink">Replace edits with a compliant duplicate</h3>
                <p className="mt-3 text-sm text-muted">{document.number} is already issued. Creating a duplicate opens the next editable invoice number and leaves the current record VOID for audit, register, and journal continuity.</p>
              </div>
              <button type="button" onClick={() => setShowDuplicateModal(false)} className="rounded-full border border-line px-3 py-1 text-sm font-semibold text-muted hover:border-primary hover:text-primary">Close</button>
            </div>
            <div className="mt-5 rounded-xl bg-surface-soft p-4 text-sm text-muted">
              <p><span className="font-semibold text-ink">Current:</span> {document.number}</p>
              <p className="mt-2"><span className="font-semibold text-ink">Result:</span> New invoice number, original marked VOID, linked history preserved.</p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button size="xs" variant="secondary" onClick={() => setShowDuplicateModal(false)} disabled={runningAction === "duplicate"}>Cancel</Button>
              <Button size="xs" onClick={() => void handleDuplicateIssuedDocument()} disabled={runningAction === "duplicate"}>{runningAction === "duplicate" ? "Creating duplicate" : "Create compliant duplicate"}</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}