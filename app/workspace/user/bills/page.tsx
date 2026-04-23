import { DocumentCenterOverview } from "@/components/workspace/DocumentCenterOverview";

export default function UserBillsPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="bills" data-inspector-real-register="bills">
      <DocumentCenterOverview
        group="purchase"
        initialType="vendor_bill"
        eyebrowOverride="Bills"
        titleOverride="Bills and payable follow-up stay in one purchase register."
        descriptionOverride="Review supplier bills, due balances, rendered output, and next payable actions from one dense working surface."
        createLabelOverride="Create Bill"
        emptyMessageOverride="Vendor bills appear here after supplier documents are captured from the purchase workflow."
      />
    </div>
  );
}