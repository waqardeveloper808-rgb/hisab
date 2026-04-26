import { WorkspaceRegister } from "@/components/workspace/WorkspaceRegister";
import { invoices } from "@/data/workspace/invoices";

export const metadata = {
  title: "Workspace — Invoices",
};

export default function WorkspaceInvoicesPage() {
  return (
    <WorkspaceRegister
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
