import { DocumentTemplatesRegister } from "@/components/workspace/DocumentTemplatesRegister";

export default function ProformaTemplatesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="proforma-templates" data-inspector-real-register="proforma-templates">
      <DocumentTemplatesRegister initialDocumentType="proforma_invoice" eyebrowOverride="Templates" titleOverride="Proforma Templates" />
    </div>
  );
}