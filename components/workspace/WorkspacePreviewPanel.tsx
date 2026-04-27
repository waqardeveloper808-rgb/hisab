"use client";

import { useEffect, useState } from "react";
import {
  CopyPlus,
  CreditCard,
  Download,
  ExternalLink,
  FileCode,
  FileMinus,
  FilePlus,
  History,
  Pencil,
  Printer,
  Send,
  X,
} from "lucide-react";
import type { DocumentRecord } from "@/lib/workspace/types";
import { findCustomer } from "@/data/workspace/customers";
import { templates } from "@/data/workspace/templates";
import { previewCompany } from "@/data/preview-company";
import { formatCurrency, statusLabel, statusTone } from "@/lib/workspace/format";
import {
  getSchemaForKind,
  type LangMode,
} from "@/lib/workspace/document-template-schemas";
import { buildInvoiceUbl } from "@/lib/workspace/exports/xml";
import { downloadBytes, downloadXml } from "@/lib/workspace/exports/download";
import { WorkspaceDocumentPreview } from "./WorkspaceDocumentPreview";
import { WorkspaceMoreActions, type MoreAction } from "./WorkspaceMoreActions";
import { WorkspaceSuggestion } from "./WorkspaceSuggestion";

type Props = {
  document: DocumentRecord | null;
  onClose: () => void;
  /** Split = side-by-side with register; overlay = full-screen dim (default). */
  layout?: "overlay" | "split";
};

export function WorkspacePreviewPanel({ document, onClose, layout = "overlay" }: Props) {
  const [language, setLanguage] = useState<LangMode>("bilingual");

  useEffect(() => {
    if (!document) return;
    const lockBody = layout === "overlay";
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    const previousOverflow = window.document.body.style.overflow;
    if (lockBody) {
      window.document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (lockBody) {
        window.document.body.style.overflow = previousOverflow;
      }
    };
  }, [document, onClose, layout]);

  const [busy, setBusy] = useState<"pdf" | "xml" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!document) return null;

  const customer = findCustomer(document.customerId);
  const template = templates.find((tmpl) => tmpl.id === document.templateId);
  const schema = getSchemaForKind(document.kind);

  const handleDownloadPdf = async () => {
    if (busy) return;
    setBusy("pdf");
    setError(null);
    try {
      const templateParam = template?.id != null ? `&template_id=${template.id}` : "";
      const url = `/api/workspace/documents/${encodeURIComponent(document.id)}/export-pdf?mode=preview${templateParam}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "X-Workspace-Mode": "preview" },
      });
      if (!response.ok) {
        throw new Error(`PDF download failed (${response.status})`);
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      downloadBytes(bytes, `${document.number}.pdf`, "application/pdf");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate PDF");
    } finally {
      setBusy(null);
    }
  };

  const handleDownloadXml = () => {
    if (busy) return;
    setBusy("xml");
    setError(null);
    try {
      const xml = buildInvoiceUbl(
        document,
        {
          name: previewCompany.sellerName,
          nameAr: previewCompany.sellerNameAr,
          vatNumber: previewCompany.vatNumber,
          registrationNumber: previewCompany.registrationNumber,
          addressEn: previewCompany.sellerAddressEn,
        },
        {
          name: customer?.legalName ?? "Customer",
          nameAr: customer?.legalNameAr,
          vatNumber: customer?.vatNumber,
          city: customer?.city,
          country: "SA",
        },
        schema,
      );
      downloadXml(xml, `${document.number}.xml`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate XML");
    } finally {
      setBusy(null);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const moreActions: MoreAction[] = [
    { id: "duplicate", label: "Duplicate document", icon: <CopyPlus size={13} /> },
    { id: "history", label: "View change history", icon: <History size={13} /> },
    { id: "credit-note", label: "Create credit note", icon: <FileMinus size={13} /> },
    { id: "debit-note", label: "Create debit note", icon: <FilePlus size={13} /> },
    { id: "open-full", label: "Open full preview", icon: <ExternalLink size={13} /> },
  ];

  // XML is meaningful only for tax/credit/debit; hide otherwise.
  const xmlAvailable = schema.zatcaClassification === "foundation_only";

  const isSplit = layout === "split";
  const shell = (
    <aside
      className={isSplit ? "wsv2-preview-panel wsv2-preview-panel--split" : "wsv2-preview-panel"}
      role="document"
      aria-label={`Preview of ${document.number}`}
      onClick={isSplit ? undefined : (event) => event.stopPropagation()}
    >
        <div className="wsv2-preview-header">
          <div className="col" style={{ flex: 1 }}>
            <span className="num">{document.number}</span>
            <span className="meta">
              <span className="wsv2-pill" data-tone={statusTone(document.status)}>
                <span className="wsv2-status-dot" /> {statusLabel(document.status)}
              </span>
              <span>{customer?.legalName ?? "—"}</span>
            </span>
          </div>
          <div className="col" style={{ alignItems: "flex-end" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(document.total)}</span>
            <span style={{ fontSize: 11.5, color: "var(--wsv2-ink-subtle)" }}>
              Balance {formatCurrency(document.balance)}
            </span>
          </div>
          <button
            type="button"
            className="wsv2-icon-btn"
            aria-label="Close preview"
            onClick={onClose}
            style={{ height: 30, minWidth: 30, padding: 4 }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="wsv2-preview-actions">
          <div className="wsv2-lang-tabs" role="tablist" aria-label="Language">
            {(["english", "arabic", "bilingual"] as LangMode[]).map((lang) => (
              <button
                key={lang}
                type="button"
                role="tab"
                aria-selected={language === lang}
                data-active={language === lang ? "true" : "false"}
                onClick={() => setLanguage(lang)}
              >
                {lang === "english" ? "EN" : lang === "arabic" ? "AR" : "EN + AR"}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="wsv2-btn-secondary wsv2-icon-btn"
            disabled
            title="Preview only — not connected to edit workflow"
          >
            <Pencil size={13} /> Edit
          </button>
          <button
            type="button"
            className="wsv2-btn-secondary wsv2-icon-btn"
            onClick={handleDownloadPdf}
            disabled={busy === "pdf"}
            aria-label="Download PDF"
            title="Download PDF (real, generated client-side via pdf-lib)"
          >
            <Download size={13} /> {busy === "pdf" ? "Building…" : "PDF"}
          </button>
          {xmlAvailable ? (
            <button
              type="button"
              className="wsv2-btn-secondary wsv2-icon-btn"
              onClick={handleDownloadXml}
              disabled={busy === "xml"}
              aria-label="Download XML"
              title="Download UBL 2.1 XML (foundation, not ZATCA-validated)"
            >
              <FileCode size={13} /> {busy === "xml" ? "Building…" : "XML"}
            </button>
          ) : null}
          <button
            type="button"
            className="wsv2-btn-secondary wsv2-icon-btn"
            onClick={handlePrint}
            aria-label="Print"
          >
            <Printer size={13} /> Print
          </button>
          <button
            type="button"
            className="wsv2-btn-secondary wsv2-icon-btn"
            disabled
            title="Preview only — not connected to send"
          >
            <Send size={13} /> Send
          </button>
          <button
            type="button"
            className="wsv2-btn"
            disabled
            title="Preview only — use Customer payments register to record a receipt"
          >
            <CreditCard size={13} /> Record payment
          </button>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span className="wsv2-pill" data-tone="neutral" title="Active template">
              {template?.name ?? "Default template"}
            </span>
            <WorkspaceMoreActions actions={moreActions} />
          </span>
        </div>
        {error ? (
          <div
            role="alert"
            style={{
              margin: "0 14px 8px",
              padding: "8px 10px",
              borderRadius: 8,
              background: "rgba(180, 30, 30, 0.08)",
              border: "1px solid rgba(180, 30, 30, 0.25)",
              color: "#7a1f1f",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        ) : null}

        <div className="wsv2-preview-body">
          <WorkspaceSuggestion
            id="preview-tip-actions"
            tone="info"
            title="Switch language to get a matching PDF"
            description="The Browser preview, PDF export, and XML export all read the same schema. Toggle EN / AR / EN+AR to change all three at once."
          />
          <div style={{ height: 12 }} />
          <WorkspaceDocumentPreview document={document} language={language} />
        </div>
    </aside>
  );

  if (isSplit) {
    return shell;
  }

  return (
    <div className="wsv2-preview-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      {shell}
    </div>
  );
}
