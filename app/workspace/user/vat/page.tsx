import { VatOverview } from "@/components/workspace/VatOverview";

export default function UserVatPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="vat" data-inspector-real-register="vat">
      <VatOverview />
    </div>
  );
}