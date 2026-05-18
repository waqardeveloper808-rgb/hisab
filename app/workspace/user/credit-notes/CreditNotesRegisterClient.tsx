"use client";

import { ApiBackedWorkspaceRegister } from "@/components/workspace/ApiBackedWorkspaceRegister";

export function CreditNotesRegisterClient() {
  return (
    <ApiBackedWorkspaceRegister
      source="sales"
      backendDocumentType="credit_note"
      registerKind="credit_note"
      title="Credit notes"
      subtitle="Credits linked to finalized tax invoices via the ledger."
      createLabel="New credit note"
      createDocumentHref="/workspace/user/invoices"
      suggestionId="register-credit-notes"
      suggestionTitle="Always reference the source invoice"
      suggestionDescription="Issue credit notes from the source invoice composer so postings stay tied to originals."
      emptyTitle="No credit notes recorded"
      emptyDescription="Issue a credit note from the invoicing workflow linked to its source invoice."
    />
  );
}
