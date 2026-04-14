import { JournalEntriesRegister } from "@/components/workspace/JournalEntriesRegister";

export default function UserJournalEntriesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="journal-entries" data-inspector-real-register="journal-entries">
      <JournalEntriesRegister />
    </div>
  );
}