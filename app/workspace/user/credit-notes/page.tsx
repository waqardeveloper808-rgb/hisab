import { DocumentCenterOverview } from "@/components/workspace/DocumentCenterOverview";

export default function UserCreditNotesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="credit-notes" data-inspector-real-register="credit-notes">
      <DocumentCenterOverview
        group="sales"
        initialType="credit_note"
        createHrefOverride="/workspace/invoices/new?documentType=credit_note"
        eyebrowOverride="Credit notes"
        titleOverride="Credit note register"
        createLabelOverride="Create Credit Note"
        emptyMessageOverride="Credit notes will appear here after the first adjustment is saved."
      />
    </div>
  );
}