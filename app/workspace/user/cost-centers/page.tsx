import { CostCentersOverview } from "@/components/workspace/CostCentersOverview";

export default function UserCostCentersPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="cost-centers" data-inspector-real-register="cost-centers">
      <CostCentersOverview />
    </div>
  );
}