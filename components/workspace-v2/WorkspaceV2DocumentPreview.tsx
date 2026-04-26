"use client";

// Schema-driven document preview body. Used inside the preview drawer.
// Layout is delegated entirely to <WorkspaceV2DocumentRenderer>.

import { useEffect, useState } from "react";
import type { DocumentRecord } from "@/lib/workspace-v2/types";
import { findCustomer } from "@/data/workspace-v2/customers";
import { getSchemaForKind, type LangMode } from "@/lib/workspace-v2/document-template-schemas";
import { previewCompany } from "@/data/preview-company";
import { buildPhase1Qr } from "@/lib/workspace-v2/exports/qr";
import {
  defaultTemplateUi,
  readTemplateUiFromStorage,
  readTemplateAssetsFromStorage,
} from "@/lib/workspace-v2/template-ui-settings";
import {
  WorkspaceV2DocumentRenderer,
  makeRendererCustomer,
  makeRendererSeller,
} from "./WorkspaceV2DocumentRenderer";

type Props = {
  document: DocumentRecord;
  language?: LangMode;
};

export function WorkspaceV2DocumentPreview({ document, language = "bilingual" }: Props) {
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
      <WorkspaceV2DocumentRenderer
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
