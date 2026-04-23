import { BooksOverview } from "@/components/workspace/BooksOverview";

export default function UserLedgerPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="ledger" data-inspector-real-register="ledger">
      <BooksOverview />
    </div>
  );
}