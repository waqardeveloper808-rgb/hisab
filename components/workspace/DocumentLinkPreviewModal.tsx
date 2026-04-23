"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDocument, getDocumentPdfUrl, getDocumentPreview, sendDocument, type DocumentDetailRecord, type DocumentPreviewRecord } from "@/lib/workspace-api";

type DocumentLinkPreview = {
  documentId?: number | null;
  documentNumber: string;
  documentType: string;
  status?: string | null;
};

type DocumentLinkPreviewModalProps = {
  link: DocumentLinkPreview | null;
  onClose: () => void;
};

export function getDocumentEditHref(documentId: number, documentType: string) {
  const purchaseTypes = new Set(["vendor_bill", "purchase_invoice", "purchase_order", "purchase_credit_note"]);
  if (purchaseTypes.has(documentType)) {
    return `/workspace/bills/${documentId}`;
  }

  return `/workspace/invoices/${documentId}`;
}

export function getDocumentCreateHref(documentType: string) {
  const purchaseTypes = new Set(["vendor_bill", "purchase_invoice", "purchase_order", "purchase_credit_note"]);
  const basePath = purchaseTypes.has(documentType) ? "/workspace/bills/new" : "/workspace/invoices/new";
  return `${basePath}?documentType=${encodeURIComponent(documentType)}`;
}

export function DocumentLinkPreviewModal({ link, onClose }: DocumentLinkPreviewModalProps) {
  const [detail, setDetail] = useState<DocumentDetailRecord | null>(null);
  const [preview, setPreview] = useState<DocumentPreviewRecord | null>(null);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!link?.documentId) {
      return;
    }

    Promise.all([getDocument(link.documentId), getDocumentPreview(link.documentId)])
      .then(([documentDetail, documentPreview]) => {
        setDetail(documentDetail);
        setPreview(documentPreview);
      })
      .catch((err: unknown) => {
        console.error('[DocumentLinkPreviewModal] failed to load document:', err);
        setDetail(null);
        setPreview(null);
      });
  }, [link]);

  if (!link) {
    return null;
  }

  const openHref = link.documentId ? getDocumentEditHref(link.documentId, link.documentType) : getDocumentCreateHref(link.documentType);
  const paymentHref = link.documentId ? `${getDocumentEditHref(link.documentId, link.documentType)}?payment=1` : getDocumentCreateHref(link.documentType);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/45 px-4 py-6" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-2xl bg-white p-5 shadow-[0_30px_90px_-40px_rgba(17,32,24,0.55)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Document Preview</p>
            <h2 className="text-lg font-semibold text-ink">{link.documentNumber}</h2>
            <p className="text-sm text-muted">{link.documentType.replace(/_/g, " ")} · {detail?.status ?? link.status ?? "linked"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {link.documentId ? <button type="button" onClick={() => {
            if (!link.documentId) {
              return;
            }
            setSending(true);
            setFeedback(null);
            void sendDocument(link.documentId).then((document) => setFeedback(`Sent ${document.number} successfully.`)).catch((error) => setFeedback(error instanceof Error ? error.message : "Send failed.")).finally(() => setSending(false));
            }} className="inline-flex rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink hover:border-primary/40 hover:text-primary">{sending ? "Sending..." : "Send"}</button> : null}
            <Link href={openHref} className="inline-flex rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink hover:border-primary/40 hover:text-primary">Open</Link>
            {link.documentId ? <a href={getDocumentPdfUrl(link.documentId)} download className="inline-flex rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink hover:border-primary/40 hover:text-primary">Download</a> : null}
            <Link href={paymentHref} className="inline-flex rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink hover:border-primary/40 hover:text-primary">Record Payment</Link>
            <button type="button" onClick={onClose} className="inline-flex rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink hover:border-primary/40 hover:text-primary">X</button>
          </div>
        </div>

        {feedback ? <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{feedback}</div> : null}

        {link.documentId && preview ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-line">
            <iframe title={link.documentNumber} srcDoc={preview.html} className="min-h-[60vh] w-full bg-white" />
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-surface-soft/35 px-4 py-6 text-sm text-muted">
            {link.documentType === "delivery_note"
              ? "This delivery note reference is stored as metadata only. It is not a first-class live document record yet, so preview, print, download, and send remain unavailable."
              : "This reference is stored, but it is not linked to a live document record yet."}
          </div>
        )}
      </div>
    </div>
  );
}