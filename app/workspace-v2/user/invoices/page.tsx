import { WorkspaceV2Register } from "@/components/workspace-v2/WorkspaceV2Register";
import { invoices } from "@/data/workspace-v2/invoices";

export const metadata = {
  title: "Workspace V2 — Invoices",
};

export default function WorkspaceV2InvoicesPage() {
  return (
    <WorkspaceV2Register
      config={{
        title: "Tax invoices",
        subtitle: "ZATCA-ready invoices issued from this workspace.",
        documents: invoices,
        createLabel: "New invoice",
        suggestionId: "register-invoices",
        suggestionTitle: "Single source of truth for billing",
        suggestionDescription:
          "Click any row to open the document preview, record a payment, or issue a credit note.",
        emptyTitle: "No invoices match the current filters",
        emptyDescription: "Adjust the search term or clear the active status filter.",
      }}
    />
  );
}
