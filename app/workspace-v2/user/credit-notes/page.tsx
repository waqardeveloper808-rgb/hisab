import { WorkspaceV2Register } from "@/components/workspace-v2/WorkspaceV2Register";
import { creditNotes } from "@/data/workspace-v2/credit-notes";

export const metadata = {
  title: "Workspace V2 — Credit notes",
};

export default function WorkspaceV2CreditNotesPage() {
  return (
    <WorkspaceV2Register
      config={{
        title: "Credit notes",
        subtitle: "Issued credits applied against existing customer invoices.",
        documents: creditNotes,
        createLabel: "New credit note",
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
