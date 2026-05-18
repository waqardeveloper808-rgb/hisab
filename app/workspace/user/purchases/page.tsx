import { PurchasesOverview } from "@/components/workspace/PurchasesOverview";

export default function PurchasesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="purchases" data-inspector-real-register="purchases">
      <PurchasesOverview />
    </div>
  );
}
