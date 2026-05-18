"use client";

// Schema-driven document preview body. Used inside the preview drawer.
// Layout is delegated entirely to <WorkspaceDocumentRenderer>.

import { useEffect, useMemo, useState } from "react";
import type { DocumentRecord } from "@/lib/workspace/types";
import { findCustomer } from "@/data/workspace/customers";
import { getSchemaForKind, type LangMode } from "@/lib/workspace/document-template-schemas";
import { previewCompany } from "@/data/preview-company";
import { templates } from "@/data/workspace/templates";
import { buildPhase1Qr } from "@/lib/workspace/exports/qr";
import {
  defaultTemplateUi,
  compactTemplatePresetUi,
  modernTemplatePresetUi,
  readTemplateUiFromStorage,
  readTemplateAssetsFromStorage,
} from "@/lib/workspace/template-ui-settings";
import {
  WorkspaceDocumentRenderer,
  makeRendererCustomer,
  makeRendererSeller,
} from "./WorkspaceDocumentRenderer";

type Props = {
  document: DocumentRecord;
  language?: LangMode;
  forcedStyle?: "standard" | "modern" | "compact";
};

function templateUiForPreview(templateId: string | undefined) {
  const stored = readTemplateUiFromStorage();
  if (stored) return stored;
  if (templateId === "tmpl-modern") return modernTemplatePresetUi();
  if (templateId === "tmpl-compact") return compactTemplatePresetUi();
  return defaultTemplateUi();
}

export function WorkspaceDocumentPreview({ document, language = "bilingual", forcedStyle }: Props) {
  const customer = findCustomer(document.customerId);
  const schema = getSchemaForKind(document.kind);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const studioUi = useMemo(() => templateUiForPreview(document.templateId), [document.id, document.templateId]);
  const studioAssets = useMemo(() => readTemplateAssetsFromStorage(), [document.id, document.templateId]);
  const templateStyle = forcedStyle ?? templates.find((t) => t.id === document.templateId)?.style ?? "standard";
  const qrDataUrl = schema.qr.applicable ? qrImage : null;

  useEffect(() => {
    if (!schema.qr.applicable) {
      return;
    }
    let cancelled = false;
    buildPhase1Qr({
      sellerName: previewCompany.sellerName,
      vatNumber: previewCompany.vatNumber,
      invoiceTotal: document.total,
      vatAmount: document.vat,
      timestamp: new Date(document.issueDate).toISOString(),
    })
      .then((qr) => {
        if (cancelled) return;
        setQrImage(qr.imageDataUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setQrImage(null);
      });
    return () => {
      cancelled = true;
    };
  }, [document.total, document.vat, document.issueDate, schema.qr.applicable]);

  return (
    <div className="wsv2-doc-paper" data-lang={language} data-hisabix-document-engine="v3" data-document-type={document.kind} data-template-style={templateStyle} data-template-id={`${document.kind}.${templateStyle}`}>
      <WorkspaceDocumentRenderer
        schema={schema}
        doc={document}
        seller={makeRendererSeller()}
        customer={makeRendererCustomer(customer)}
        language={language}
        style={templateStyle}
        qrImageDataUrl={qrDataUrl}
        ui={studioUi}
        templateAssets={studioAssets}
        templateId={document.templateId}
      />
    </div>
  );
}
