"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { ZatcaQrPanel } from "@/components/workspace/ZatcaQrPanel";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { currency } from "@/components/workflow/utils";
import {
  finalizeTransactionDraft,
  getDocument,
  getDocumentPreview,
  recordDocumentPayment,
  sendDocument,
  type DocumentDetailRecord,
} from "@/lib/workspace-api";
import { mapWorkspaceHref } from "@/lib/workspace-path";

const invoiceDetailCache = new Map<number, { document: DocumentDetailRecord; previewHtml: string }>();

type InvoiceLifecycle = "draft" | "issued" | "reported" | "paid" | "overdue";

function today() {
  return new Date().toISOString().slice(0, 10);
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
};

export function InvoiceDetailWorkspace({ documentId, mode = "panel", reloadKey = 0, onDocumentChanged }: InvoiceDetailWorkspaceProps) {
  const { basePath } = useWorkspacePath();
  const [document, setDocument] = useState<DocumentDetailRecord | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(Boolean(documentId));
  const [error, setError] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [actionNotice, setActionNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
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
      const [nextDocument, preview] = await Promise.all([getDocument(documentId), getDocumentPreview(documentId)]);

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
  }, [documentId, onDocumentChanged]);

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

  if (!documentId) {
    return (
      <Card className="rounded-2xl bg-white/95 p-4" data-inspector-preview-surface="true">
        <p className="text-sm text-muted">Select an invoice row to keep the register visible while reviewing its details.</p>
      </Card>
    );
  }

  if (loading && !document) {
    return <Card className="rounded-2xl bg-white/95 p-4 text-sm text-muted" data-inspector-preview-surface="true">Loading invoice…</Card>;
  }

  if (!document) {
    return <Card className="rounded-2xl bg-white/95 p-4 text-sm text-red-700" data-inspector-preview-surface="true">{error || "Invoice could not be loaded."}</Card>;
  }

  const lifecycle = normalizeInvoiceStatus(document);
  const canIssue = lifecycle === "draft";
  const canRecordPayment = lifecycle !== "draft" && lifecycle !== "paid" && document.balanceDue > 0;
  const canSend = lifecycle !== "draft";
  const isCompact = mode === "panel";
  const editHref = mapWorkspaceHref(`/workspace/invoices/${document.id}?mode=edit`, basePath);
  const pdfHref = mapWorkspaceHref(`/workspace/invoices/${document.id}/pdf`, basePath);
  const registerHref = mapWorkspaceHref("/workspace/user/invoices", basePath);

  return (
    <div className="space-y-2" data-inspector-preview-surface="true" data-inspector-document-view="invoice">
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      {actionNotice ? <div className={["rounded-lg px-3 py-2 text-sm", actionNotice.tone === "success" ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "border border-red-200 bg-red-50 text-red-700"].join(" ")}>{actionNotice.text}</div> : null}

      <Card className="rounded-2xl bg-white/95 p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-2.5 py-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-ink">{document.number}</p>
              <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]", statusClasses(lifecycle)].join(" ")}>{statusLabel(lifecycle)}</span>
              {loading ? <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Refreshing</span> : null}
            </div>
            <p className="text-[11px] text-muted">{document.contactName || "No customer"} · {document.issueDate || "-"} · Balance {currency(document.balanceDue)} SAR</p>
          </div>
          <div className="flex flex-wrap gap-1.5" data-inspector-issued-actions="true">
            {canIssue ? <Button size="xs" onClick={handleIssue} disabled={runningAction !== null}>{runningAction === "issue" ? "Issuing" : "Issue"}</Button> : null}
            {canSend ? <Button size="xs" variant="secondary" onClick={() => void handleSend()} disabled={runningAction !== null}>{runningAction === "send" ? "Sending" : "Send"}</Button> : null}
            <Button size="xs" variant="secondary" href={editHref}>Edit</Button>
            <Button size="xs" variant="secondary" href={pdfHref} linkBehavior="anchor" onClick={handleDownloadStart} disabled={runningAction !== null}>{runningAction === "download" ? "Starting PDF" : "Download PDF"}</Button>
            {canRecordPayment ? <Button size="xs" variant="secondary" onClick={() => setShowPaymentForm((current) => !current)} disabled={runningAction !== null}>{showPaymentForm ? "Close Payment" : "Record Payment"}</Button> : null}
            {mode === "page" ? <Button size="xs" variant="secondary" href={registerHref}>Back</Button> : null}
          </div>
        </div>

        {showPaymentForm ? (
          <div className="grid gap-2 border-b border-line px-2.5 py-2.5 sm:px-3 md:grid-cols-2 xl:grid-cols-4">
            <Input label="Amount" type="number" min="0" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} labelClassName="mb-1.5 text-xs" inputClassName="rounded-xl px-3 py-2.5 text-sm" />
            <Input label="Payment date" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} labelClassName="mb-1.5 text-xs" inputClassName="rounded-xl px-3 py-2.5 text-sm" />
            <div>
              <label htmlFor={`invoice-payment-method-${document.id}`} className="mb-1.5 block text-xs font-semibold text-ink">Method</label>
              <select id={`invoice-payment-method-${document.id}`} value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                <option value="bank_transfer">Bank transfer</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <Input label="Reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} labelClassName="mb-1.5 text-xs" inputClassName="rounded-xl px-3 py-2.5 text-sm" />
            <div className="md:col-span-4 flex justify-end gap-2">
              <Button size="xs" variant="secondary" onClick={() => setShowPaymentForm(false)}>Cancel</Button>
              <Button size="xs" onClick={handleRecordPayment} disabled={runningAction !== null}>{runningAction === "payment" ? "Saving" : "Save payment"}</Button>
            </div>
          </div>
        ) : null}

        <div className={["grid gap-2.5 px-2.5 py-2.5 sm:px-3", isCompact ? "" : "2xl:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)]"].join(" ")}>
          <div className="space-y-2">
            <div className={["grid gap-2", isCompact ? "sm:grid-cols-2" : "sm:grid-cols-2 2xl:grid-cols-4"].join(" ")}>
              {[
                ["Customer", document.contactName || "-"],
                ["Type", document.type.replaceAll("_", " ")],
                ["Total", `${currency(document.grandTotal)} SAR`],
                ["Paid", `${currency(document.paidTotal)} SAR`],
                ["Balance", `${currency(document.balanceDue)} SAR`],
                ["Due", document.dueDate || "-"],
                ["Template", document.templateName || "Default template"],
                ["Sent to", document.sentToEmail || "Not sent yet"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-line bg-surface-soft px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>

            {isCompact && lifecycle !== "draft" ? <ZatcaQrPanel invoice={document} compact /> : null}

            <Card className="rounded-2xl bg-[#eef3ee] p-2.5 sm:p-3">
              <div className="max-h-[22rem] overflow-auto rounded-lg border border-[#dfe6df] bg-white p-2.5 sm:p-3 2xl:max-h-[25rem]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </Card>

            <Card className="rounded-2xl bg-white p-0 overflow-hidden">
              <div className="border-b border-line px-4 py-2.5">
                <h3 className="text-sm font-semibold text-ink">Line items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-line bg-surface-soft/70">
                    <tr>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Description</th>
                      <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Qty</th>
                      <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Unit</th>
                      <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Gross</th>
                    </tr>
                  </thead>
                  <tbody>
                    {document.lines.map((line) => (
                      <tr key={line.id} className="border-t border-line/70">
                        <td className="px-4 py-2 text-sm text-ink">{line.description}</td>
                        <td className="px-4 py-2 text-right text-sm text-muted">{line.quantity}</td>
                        <td className="px-4 py-2 text-right text-sm text-muted">{currency(line.unitPrice)} SAR</td>
                        <td className="px-4 py-2 text-right text-sm font-semibold text-ink">{currency(line.grossAmount)} SAR</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {!isCompact && lifecycle !== "draft" ? <ZatcaQrPanel invoice={document} /> : null}
        </div>
      </Card>
    </div>
  );
}