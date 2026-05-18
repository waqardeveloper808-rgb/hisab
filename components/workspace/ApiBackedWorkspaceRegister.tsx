"use client";

import { useEffect, useState } from "react";
import type { DocumentKind } from "@/lib/workspace/types";
import type { WorkspaceDocumentRecord } from "@/lib/workspace-api";
import {
  fetchPurchaseDocumentsRegister,
  fetchSalesDocumentsRegister,
} from "@/lib/workspace-api";
import { workspaceDocumentToSalesRegisterRecord } from "@/lib/workspace/register-mappers";
import { WorkspaceRegister, type RegisterConfig } from "@/components/workspace/WorkspaceRegister";

export type ApiBackedRegisterConfigBase = Omit<RegisterConfig, "documents"> & {
  source: "sales" | "purchase";
  backendDocumentType: string;
  registerKind: DocumentKind;
};

function mapRows(rows: WorkspaceDocumentRecord[], registerKind: DocumentKind) {
  return rows.map((row) => workspaceDocumentToSalesRegisterRecord(row, registerKind));
}

export function ApiBackedWorkspaceRegister(props: ApiBackedRegisterConfigBase) {
  const { source, backendDocumentType, registerKind, ...configBase } = props;
  const [documents, setDocuments] = useState(() => mapRows([], registerKind));

  useEffect(() => {
    let active = true;
    const loader = source === "sales" ? fetchSalesDocumentsRegister : fetchPurchaseDocumentsRegister;
    loader({ type: backendDocumentType })
      .then((rows) => {
        if (active) {
          setDocuments(mapRows(rows, registerKind));
        }
      })
      .catch((err: unknown) => {
        console.error("[ApiBackedWorkspaceRegister] load failed", err);
        if (active) {
          setDocuments(mapRows([], registerKind));
        }
      });

    return () => {
      active = false;
    };
  }, [source, backendDocumentType, registerKind]);

  const config: RegisterConfig = { ...configBase, documents };

  return <WorkspaceRegister config={config} />;
}
