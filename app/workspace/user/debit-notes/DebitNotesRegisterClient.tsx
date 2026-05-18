"use client";

import { ApiBackedWorkspaceRegister } from "@/components/workspace/ApiBackedWorkspaceRegister";

export function DebitNotesRegisterClient() {
  return (
    <ApiBackedWorkspaceRegister
      source="sales"
      backendDocumentType="debit_note"
      registerKind="debit_note"
      title="Debit notes"
      subtitle="Debit adjustments referencing posted sales invoices."
      createLabel="New debit note"
      createDocumentHref="/workspace/user/invoices"
      suggestionId="register-debit-notes"
      suggestionTitle="Use debit notes for adjustments tied to originals"
      suggestionDescription="For brand-new taxable supply, finalize a tax invoice instead of issuing a disconnected debit note."
      emptyTitle="No debit notes recorded"
      emptyDescription="Create debit notes through the invoicing workflow so inventory and VAT stay consistent."
    />
  );
}
