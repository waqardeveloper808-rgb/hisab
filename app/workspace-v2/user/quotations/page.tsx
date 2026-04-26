import { WorkspaceV2Register } from "@/components/workspace-v2/WorkspaceV2Register";
import { quotations } from "@/data/workspace-v2/quotations";

export const metadata = {
  title: "Workspace V2 — Quotations",
};

export default function WorkspaceV2QuotationsPage() {
  return (
    <WorkspaceV2Register
      config={{
        title: "Quotations",
        subtitle: "Outgoing offers, pricing scenarios, and validity tracking.",
        documents: quotations,
        createLabel: "New quotation",
        suggestionId: "register-quotations",
        suggestionTitle: "Convert accepted quotations into invoices",
        suggestionDescription:
          "Use the More menu on an accepted quotation to convert it directly into a tax invoice.",
        emptyTitle: "No quotations to display",
        emptyDescription: "Try changing the status filter or clearing the search.",
      }}
    />
  );
}
