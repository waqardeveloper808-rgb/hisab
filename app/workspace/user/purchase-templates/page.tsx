import { DocumentTemplatesRegister } from "@/components/workspace/DocumentTemplatesRegister";

export default function PurchaseTemplatesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="purchase-templates" data-inspector-real-register="purchase-templates">
      <DocumentTemplatesRegister initialDocumentType="purchase_order" eyebrowOverride="Templates" titleOverride="Purchase and Expense Templates" />
    </div>
  );
}