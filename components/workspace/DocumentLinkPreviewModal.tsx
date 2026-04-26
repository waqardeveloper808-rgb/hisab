"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, ExternalLink, Printer, Send, SquarePen, X } from "lucide-react";
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
    <div className="fixed inset-0 z-[60] bg-ink/45" role="dialog" aria-modal="true">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[min(100vw,72rem)] flex-col border-l border-line bg-white shadow-[0_30px_90px_-40px_rgba(17,32,24,0.55)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Linked document preview</p>
            <h2 className="text-xl font-semibold text-ink">{link.documentNumber}</h2>
            <p className="text-sm text-muted">{link.documentType.replace(/_/g, " ")} · {detail?.status ?? link.status ?? "linked"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={openHref} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-primary/40 hover:text-primary">
              <SquarePen className="h-4 w-4" />
              Edit
            </Link>
            {link.documentId ? (
              <a href={getDocumentPdfUrl(link.documentId)} download className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-primary/40 hover:text-primary">
                <Download className="h-4 w-4" />
                Download
              </a>
            ) : null}
            {link.documentId ? (
              <button
                type="button"
                onClick={() => {
                  const id = link.documentId;
                  if (id == null) return;
                  window.open(getDocumentPdfUrl(id), "_blank", "noopener,noreferrer");
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-primary/40 hover:text-primary"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            ) : null}
            {link.documentId ? <button type="button" onClick={() => {
              if (!link.documentId) {
                return;
              }
              setSending(true);
              setFeedback(null);
              void sendDocument(link.documentId).then((document) => setFeedback(`Sent ${document.number} successfully.`)).catch((error) => setFeedback(error instanceof Error ? error.message : "Send failed.")).finally(() => setSending(false));
            }} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-primary/40 hover:text-primary">
              <Send className="h-4 w-4" />
              {sending ? "Sending..." : "Send"}
            </button> : null}
            <Link href={paymentHref} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-primary/40 hover:text-primary">
              <ExternalLink className="h-4 w-4" />
              Payment
            </Link>
            <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-primary/40 hover:text-primary">
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>

        {feedback ? <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{feedback}</div> : null}

        {link.documentId && preview ? (
          <div className="flex-1 overflow-hidden p-4">
            <div className="h-full overflow-hidden rounded-xl border border-line">
              <iframe title={link.documentNumber} srcDoc={preview.html} className="h-full min-h-[60vh] w-full bg-white" />
            </div>
          </div>
        ) : (
          <div className="m-4 rounded-xl border border-dashed border-line bg-surface-soft/35 px-4 py-6 text-sm text-muted">
            {link.documentType === "delivery_note"
              ? "This delivery note reference is stored as metadata only. It is not a first-class live document record yet, so preview, print, download, and send remain unavailable."
              : "This reference is stored, but it is not linked to a live document record yet."}
          </div>
        )}
      </div>
    </div>
  );
}