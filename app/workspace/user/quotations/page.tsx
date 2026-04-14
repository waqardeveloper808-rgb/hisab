import { DocumentCenterOverview } from "@/components/workspace/DocumentCenterOverview";

export default function UserQuotationsPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="quotations" data-inspector-real-register="quotations">
      <DocumentCenterOverview
        group="sales"
        initialType="quotation"
        createHrefOverride="/workspace/invoices/new?documentType=quotation"
        eyebrowOverride="Quotations"
        titleOverride="Quotation register"
        createLabelOverride="Create Quotation"
        emptyMessageOverride="Quotations will appear here after the first quotation is saved."
      />
    </div>
  );
}