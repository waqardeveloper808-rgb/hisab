import { DocumentTemplatesRegister } from "@/components/workspace/DocumentTemplatesRegister";

export default function UserDocumentTemplatesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="document-templates" data-inspector-real-register="document-templates">
      <DocumentTemplatesRegister initialDocumentType="tax_invoice" eyebrowOverride="Templates" titleOverride="Document Templates" />
    </div>
  );
}
