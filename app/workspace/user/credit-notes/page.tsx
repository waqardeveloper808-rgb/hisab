import { WorkspaceRegister } from "@/components/workspace/WorkspaceRegister";
import { creditNotes } from "@/data/workspace/credit-notes";

export const metadata = {
  title: "Workspace — Credit notes",
};

export default function WorkspaceCreditNotesPage() {
  return (
    <WorkspaceRegister
      config={{
        title: "Credit notes",
        subtitle: "Issued credits applied against existing customer invoices.",
        documents: creditNotes,
        createLabel: "New credit note",
        createDocumentHref: "/workspace/invoices/new?documentType=credit_note",
        suggestionId: "register-credit-notes",
        suggestionTitle: "Always reference the source invoice",
        suggestionDescription:
          "Linking the source invoice keeps the audit trail and VAT reporting clean.",
        emptyTitle: "No credit notes recorded",
        emptyDescription: "Issue a credit note from the source invoice's More menu.",
      }}
    />
  );
}
