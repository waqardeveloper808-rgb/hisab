import { DocumentTemplatesRegister } from "@/components/workspace/DocumentTemplatesRegister";

export default function QuotationTemplatesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="quotation-templates" data-inspector-real-register="quotation-templates">
      <DocumentTemplatesRegister initialDocumentType="quotation" eyebrowOverride="Templates" titleOverride="Quotation Templates" />
    </div>
  );
}