"use client";

import { ApiBackedWorkspaceRegister } from "@/components/workspace/ApiBackedWorkspaceRegister";

export function ProformaInvoicesRegisterClient() {
  return (
    <ApiBackedWorkspaceRegister
      source="sales"
      backendDocumentType="proforma_invoice"
      registerKind="proforma"
      title="Proforma invoices"
      subtitle="Proforma documents loaded from Laravel sales-document index."
      createLabel="New proforma"
      createDocumentHref="/workspace/invoices/new?documentType=proforma_invoice"
      suggestionId="register-proforma"
      suggestionTitle="Convert proforma invoices into taxable invoices when ready"
      suggestionDescription="Keep proforma numbering separate until VAT recognition is intended."
      emptyTitle="No proforma invoices recorded"
      emptyDescription="Issue a proforma invoice from sales when you need a numbered commitment before VAT posting."
    />
  );
}
