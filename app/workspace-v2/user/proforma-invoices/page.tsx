import { WorkspaceV2Register } from "@/components/workspace-v2/WorkspaceV2Register";
import { proformaInvoices } from "@/data/workspace-v2/proforma-invoices";

export const metadata = {
  title: "Workspace V2 — Proforma invoices",
};

export default function WorkspaceV2ProformaPage() {
  return (
    <WorkspaceV2Register
      config={{
        title: "Proforma invoices",
        subtitle: "Pre-billing documents used to confirm scope and pricing.",
        documents: proformaInvoices,
        createLabel: "New proforma",
        suggestionId: "register-proforma",
        suggestionTitle: "Proforma invoices are not VAT documents",
        suggestionDescription:
          "Issue a tax invoice once the buyer confirms — the proforma carries the same lines and totals.",
        emptyTitle: "No proforma documents found",
        emptyDescription: "Adjust filters or create a new proforma.",
      }}
    />
  );
}
