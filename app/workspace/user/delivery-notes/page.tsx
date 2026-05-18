import { DocumentCenterOverview } from "@/components/workspace/DocumentCenterOverview";

export default function DeliveryNotesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="delivery-notes" data-inspector-real-register="delivery-notes">
      <DocumentCenterOverview
        group="sales"
        initialType="delivery_note"
        eyebrowOverride="Documents"
        titleOverride="Delivery Notes"
        descriptionOverride="Delivery notes from live workspace data."
      />
    </div>
  );
}
