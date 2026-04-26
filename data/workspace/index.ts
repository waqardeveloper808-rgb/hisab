export { customers, findCustomer } from "./customers";
export { invoices } from "./invoices";
export { quotations } from "./quotations";
export { proformaInvoices } from "./proforma-invoices";
export { creditNotes } from "./credit-notes";
export { debitNotes } from "./debit-notes";
export { payments } from "./payments";
export { stockItems } from "./stock";
export { products } from "./products";
export { vendors, findVendor } from "./vendors";
export { supplierPayments } from "./supplier-payments";
export { templates } from "./templates";
export { recentActivity } from "./recent-activity";

import { creditNotes } from "./credit-notes";
import { customers } from "./customers";
import { debitNotes } from "./debit-notes";
import { invoices } from "./invoices";
import { payments } from "./payments";
import { proformaInvoices } from "./proforma-invoices";
import { quotations } from "./quotations";
import { stockItems } from "./stock";

export const dashboardSummary = {
  salesThisMonth: invoices.reduce((acc, inv) => acc + inv.total, 0),
  outstandingBalance: customers.reduce((acc, c) => acc + c.outstandingBalance, 0),
  vatPayable: invoices.reduce((acc, inv) => acc + inv.vat, 0)
    - creditNotes.reduce((acc, cn) => acc + cn.vat, 0)
    + debitNotes.reduce((acc, dn) => acc + dn.vat, 0),
  expensesThisMonth: 18420,
  pendingDocuments:
    invoices.filter((inv) => inv.status === "draft" || inv.status === "issued" || inv.status === "sent").length
    + quotations.filter((q) => q.status === "sent").length
    + proformaInvoices.filter((p) => p.status === "sent").length,
  paymentsCleared: payments.filter((p) => p.status === "cleared").reduce((acc, p) => acc + p.amount, 0),
  stockAlerts: stockItems.filter((s) => s.status !== "in_stock").length,
};
