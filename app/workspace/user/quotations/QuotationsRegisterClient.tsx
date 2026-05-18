"use client";

import { ApiBackedWorkspaceRegister } from "@/components/workspace/ApiBackedWorkspaceRegister";

export function QuotationsRegisterClient() {
  return (
    <ApiBackedWorkspaceRegister
      source="sales"
      backendDocumentType="quotation"
      registerKind="quotation"
      title="Quotations"
      subtitle="Outgoing offers sourced from workspace sales documents (no static rows)."
      createLabel="New quotation"
      createDocumentHref="/workspace/invoices/new?documentType=quotation"
      suggestionId="register-quotations"
      suggestionTitle="Convert accepted quotations into invoices"
      suggestionDescription="Use the invoice composer to finalize a quotation into a posted tax invoice when the buyer accepts."
      emptyTitle="No quotations to display"
      emptyDescription="Create a quotation or adjust filters."
    />
  );
}
