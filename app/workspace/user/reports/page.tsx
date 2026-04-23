import { ReportsOverview } from "@/components/workspace/ReportsOverview";

export default function UserReportsPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="reports" data-inspector-real-register="reports">
      <ReportsOverview />
    </div>
  );
}