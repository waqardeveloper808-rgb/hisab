"use client";

import { useSearchParams } from "next/navigation";
import { TransactionForm } from "@/components/workflow/TransactionForm";
import { InvoiceDetailWorkspace } from "@/components/workspace/InvoiceDetailWorkspace";

type InvoiceDocumentPageProps = {
  documentId: number;
};

export function InvoiceDocumentPage({ documentId }: InvoiceDocumentPageProps) {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  if (mode === "edit") {
    return <TransactionForm kind="invoice" documentId={documentId} displayMode="overlay" />;
  }

  return <InvoiceDetailWorkspace documentId={documentId} mode="page" />;
}