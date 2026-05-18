import { CustomerStatementWorkspace } from "@/components/workspace/CustomerStatementWorkspace";

export default function CustomerStatementPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="customer-statement" data-inspector-real-register="customer-statement">
      <CustomerStatementWorkspace />
    </div>
  );
}
