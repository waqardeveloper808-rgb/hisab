import { DocumentCenterOverview } from "@/components/workspace/DocumentCenterOverview";

export default function UserProformaInvoicesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="proforma-invoices" data-inspector-real-register="proforma-invoices">
      <DocumentCenterOverview
        group="sales"
        initialType="proforma_invoice"
        createHrefOverride="/workspace/invoices/new?documentType=proforma_invoice"
        eyebrowOverride="Proforma invoices"
        titleOverride="Proforma register"
        createLabelOverride="Create Proforma"
        emptyMessageOverride="Proforma invoices will appear here after the first pre-billing document is saved."
      />
    </div>
  );
}