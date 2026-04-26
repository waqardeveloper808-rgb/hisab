import { WorkspaceRegister } from "@/components/workspace/WorkspaceRegister";
import { debitNotes } from "@/data/workspace/debit-notes";

export const metadata = {
  title: "Workspace — Debit notes",
};

export default function WorkspaceDebitNotesPage() {
  return (
    <WorkspaceRegister
      config={{
        title: "Debit notes",
        subtitle: "Additional charges added to a previously issued invoice.",
        documents: debitNotes,
        createLabel: "New debit note",
        suggestionId: "register-debit-notes",
        suggestionTitle: "Use debit notes for adjustments, not for new sales",
        suggestionDescription:
          "For a brand-new sale, issue a tax invoice instead of a debit note.",
        emptyTitle: "No debit notes recorded",
        emptyDescription: "Issue a debit note from the source invoice's More menu.",
      }}
    />
  );
}
