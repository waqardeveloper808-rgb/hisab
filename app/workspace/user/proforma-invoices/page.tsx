import { WorkspaceRegister } from "@/components/workspace/WorkspaceRegister";
import { proformaInvoices } from "@/data/workspace/proforma-invoices";

export const metadata = {
  title: "Workspace — Proforma invoices",
};

export default function WorkspaceProformaPage() {
  return (
    <WorkspaceRegister
      config={{
        title: "Proforma invoices",
        subtitle: "Pre-billing documents used to confirm scope and pricing.",
        documents: proformaInvoices,
        createDocumentHref: "/workspace/invoices/new?documentType=proforma_invoice",
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
