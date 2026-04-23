import { DocumentTemplatesRegister } from "@/components/workspace/DocumentTemplatesRegister";

export default function InvoiceTemplatesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="invoice-templates" data-inspector-real-register="invoice-templates">
      <DocumentTemplatesRegister initialDocumentType="tax_invoice" eyebrowOverride="Templates" titleOverride="Invoice Templates" />
    </div>
  );
}