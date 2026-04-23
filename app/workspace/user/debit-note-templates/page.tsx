import { DocumentTemplatesRegister } from "@/components/workspace/DocumentTemplatesRegister";

export default function DebitNoteTemplatesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="debit-note-templates" data-inspector-real-register="debit-note-templates">
      <DocumentTemplatesRegister initialDocumentType="debit_note" eyebrowOverride="Templates" titleOverride="Debit Note Templates" />
    </div>
  );
}