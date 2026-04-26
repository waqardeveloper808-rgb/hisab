import { WorkspaceV2Register } from "@/components/workspace-v2/WorkspaceV2Register";
import { debitNotes } from "@/data/workspace-v2/debit-notes";

export const metadata = {
  title: "Workspace V2 — Debit notes",
};

export default function WorkspaceV2DebitNotesPage() {
  return (
    <WorkspaceV2Register
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
