import { WorkspaceRegister } from "@/components/workspace/WorkspaceRegister";
import { quotations } from "@/data/workspace/quotations";

export const metadata = {
  title: "Workspace — Quotations",
};

export default function WorkspaceQuotationsPage() {
  return (
    <WorkspaceRegister
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
