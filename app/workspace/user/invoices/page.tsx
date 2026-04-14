import { InvoiceRegister } from "@/components/workspace/InvoiceRegister";

export default function UserInvoicesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="invoices" data-inspector-real-register="invoices">
      <InvoiceRegister />
    </div>
  );
}