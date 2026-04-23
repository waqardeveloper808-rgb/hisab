import { DocumentCenterOverview } from "@/components/workspace/DocumentCenterOverview";

export default function UserDebitNotesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="debit-notes" data-inspector-real-register="debit-notes">
      <DocumentCenterOverview
        group="sales"
        initialType="debit_note"
        createHrefOverride="/workspace/invoices/new?documentType=debit_note"
        eyebrowOverride="Debit notes"
        titleOverride="Debit note register"
        createLabelOverride="Create Debit Note"
        emptyMessageOverride="Debit notes will appear here after the first adjustment is saved."
      />
    </div>
  );
}