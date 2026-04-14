import { DocumentCenterOverview } from "@/components/workspace/DocumentCenterOverview";

export default function UserPurchaseOrdersPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="purchase-orders" data-inspector-real-register="purchase-orders">
      <DocumentCenterOverview
        group="purchase"
        initialType="purchase_order"
        eyebrowOverride="Purchase orders"
        titleOverride="Purchase orders stay visible before they turn into bills and payments."
        descriptionOverride="Track ordered vendor commitments, inspect rendered documents, and keep the payable chain visible before posting the final bill."
        createLabelOverride="Create Purchase Order"
        emptyMessageOverride="Purchase orders will appear here once supplier commitments are captured before billing."
      />
    </div>
  );
}