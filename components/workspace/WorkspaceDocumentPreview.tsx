"use client";

// Schema-driven document preview body. Used inside the preview drawer.
// Layout is delegated entirely to <WorkspaceDocumentRenderer>.

import { useEffect, useState } from "react";
import type { DocumentRecord } from "@/lib/workspace/types";
import { findCustomer } from "@/data/workspace/customers";
import { getSchemaForKind, type LangMode } from "@/lib/workspace/document-template-schemas";
import { previewCompany } from "@/data/preview-company";
import { buildPhase1Qr } from "@/lib/workspace/exports/qr";
import {
  defaultTemplateUi,
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
};

export function WorkspaceDocumentPreview({ document, language = "bilingual" }: Props) {
  const customer = findCustomer(document.customerId);
  const schema = getSchemaForKind(document.kind);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [studioUi, setStudioUi] = useState(() => readTemplateUiFromStorage() ?? defaultTemplateUi());
  const [studioAssets, setStudioAssets] = useState(() => readTemplateAssetsFromStorage());
  useEffect(() => {
    setStudioUi(readTemplateUiFromStorage() ?? defaultTemplateUi());
    setStudioAssets(readTemplateAssetsFromStorage());
  }, [document.id]);

  useEffect(() => {
    if (!schema.qr.applicable) {
      setQrDataUrl(null);
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
        setQrDataUrl(qr.imageDataUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [document.total, document.vat, document.issueDate, schema.qr.applicable]);

  return (
    <div className="wsv2-doc-paper" data-lang={language}>
      <WorkspaceDocumentRenderer
        schema={schema}
        doc={document}
        seller={makeRendererSeller()}
        customer={makeRendererCustomer(customer)}
        language={language}
        style="standard"
        qrImageDataUrl={qrDataUrl}
        ui={studioUi}
        templateAssets={studioAssets}
      />
    </div>
  );
}
