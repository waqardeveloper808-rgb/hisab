import { DocumentTemplatesRegister } from "@/components/workspace/DocumentTemplatesRegister";

export default function CreditNoteTemplatesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="credit-note-templates" data-inspector-real-register="credit-note-templates">
      <DocumentTemplatesRegister initialDocumentType="credit_note" eyebrowOverride="Templates" titleOverride="Credit Note Templates" />
    </div>
  );
}