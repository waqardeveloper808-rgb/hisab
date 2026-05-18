"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { getRegistersSnapshot, type RegistersSnapshot } from "@/lib/workspace-api";
import { currency } from "@/components/workflow/utils";

const fallbackState: RegistersSnapshot = {
  invoiceRegister: [],
  billsRegister: [],
  paymentsRegister: [],
  quotationRegister: [],
  proformaInvoiceRegister: [],
  salesCreditNoteRegister: [],
  salesDebitNoteRegister: [],
  purchaseOrderRegister: [],
  purchaseCreditNoteRegister: [],
  journalRegister: [],
  inventoryRegister: [],
  backendReady: false,
};

function formatDate(value: string) {
  return value || "-";
}

export function RegistersOverview() {
  const [snapshot, setSnapshot] = useState<RegistersSnapshot>(fallbackState);

  useEffect(() => {
    let active = true;

    getRegistersSnapshot()
      .then((nextSnapshot) => {
        if (active) {
          setSnapshot(nextSnapshot);
        }
      })
      .catch((err: unknown) => {
        console.error("[RegistersOverview] getRegistersSnapshot failed:", err);
        if (active) {
          setSnapshot(fallbackState);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Registers</p>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Operational review from current registers</h1>
        </div>
        <span className="rounded-full bg-surface-soft px-2.5 py-0.5 text-[11px] font-semibold text-muted">
          {snapshot.backendReady ? "Connected" : "Awaiting activity"}
        </span>
      </div>

      <WorkspaceDataTable
        registerTableId="overview-invoice-register"
        title="Invoice register"
        caption="Posted tax invoices, cash invoices, and API invoices with balances due."
        rows={snapshot.invoiceRegister}
        emptyMessage="Post the first invoice to start the register."
        actions={<Link href="/workspace/user/invoices" className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-primary/30 hover:text-primary">Open register</Link>}
        columns={[
          {
            id: "invoice",
            header: "Invoice",
            defaultWidth: 140,
            render: (row) => <Link href={`/workspace/invoices/${row.id}`} className="font-semibold text-primary hover:underline">{row.number}</Link>,
          },
          { id: "status", header: "Status", defaultWidth: 110, render: (row) => row.status.replaceAll("_", " ") },
          { id: "issue", header: "Issue date", defaultWidth: 110, render: (row) => formatDate(row.issueDate) },
          { id: "due", header: "Due date", defaultWidth: 110, render: (row) => formatDate(row.dueDate) },
          {
            id: "balance",
            header: "Balance",
            align: "right",
            defaultWidth: 110,
            render: (row) => `${currency(row.balanceDue)} SAR`,
          },
        ]}
      />

      <WorkspaceDataTable
        registerTableId="overview-quotation-register"
        title="Quotations"
        caption="Outstanding sales quotations from the Laravel sales index."
        rows={snapshot.quotationRegister}
        emptyMessage="No quotations indexed for this company."
        actions={<Link href="/workspace/user/quotations" className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-primary/30 hover:text-primary">Open quotations</Link>}
        columns={[
          {
            id: "doc",
            header: "Quotation",
            defaultWidth: 140,
            render: (row) => <Link href={`/workspace/invoices/${row.id}`} className="font-semibold text-primary hover:underline">{row.number}</Link>,
          },
          { id: "party", header: "Customer", defaultWidth: 160, render: (row) => row.contactName || "—" },
          { id: "status", header: "Status", defaultWidth: 110, render: (row) => row.status.replaceAll("_", " ") },
          { id: "issue", header: "Issue date", defaultWidth: 110, render: (row) => formatDate(row.issueDate) },
          {
            id: "total",
            header: "Total",
            align: "right",
            defaultWidth: 110,
            render: (row) => `${currency(row.grandTotal)} SAR`,
          },
        ]}
      />

      <WorkspaceDataTable
        registerTableId="overview-proforma-register"
        title="Proforma invoices"
        caption="Proforma invoices before VAT recognition posts."
        rows={snapshot.proformaInvoiceRegister}
        emptyMessage="No proforma invoices for this workspace."
        actions={<Link href="/workspace/user/proforma-invoices" className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-primary/30 hover:text-primary">Open proforma register</Link>}
        columns={[
          {
            id: "doc",
            header: "Proforma",
            defaultWidth: 140,
            render: (row) => <Link href={`/workspace/invoices/${row.id}`} className="font-semibold text-primary hover:underline">{row.number}</Link>,
          },
          { id: "party", header: "Customer", defaultWidth: 160, render: (row) => row.contactName || "—" },
          { id: "status", header: "Status", defaultWidth: 110, render: (row) => row.status.replaceAll("_", " ") },
          {
            id: "total",
            header: "Total",
            align: "right",
            defaultWidth: 110,
            render: (row) => `${currency(row.grandTotal)} SAR`,
          },
        ]}
      />

      <WorkspaceDataTable
        registerTableId="overview-sales-credit-register"
        title="Sales credit notes"
        caption="Customer credits reversing portions of taxable supply."
        rows={snapshot.salesCreditNoteRegister}
        emptyMessage="No sales credit notes."
        actions={<Link href="/workspace/user/credit-notes" className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-primary/30 hover:text-primary">Open credit notes</Link>}
        columns={[
          {
            id: "doc",
            header: "Credit note",
            defaultWidth: 150,
            render: (row) => <Link href={`/workspace/invoices/${row.id}`} className="font-semibold text-primary hover:underline">{row.number}</Link>,
          },
          { id: "party", header: "Customer", defaultWidth: 160, render: (row) => row.contactName || "—" },
          { id: "status", header: "Status", defaultWidth: 110, render: (row) => row.status.replaceAll("_", " ") },
          {
            id: "grand",
            header: "Total",
            align: "right",
            defaultWidth: 110,
            render: (row) => `${currency(row.grandTotal)} SAR`,
          },
        ]}
      />

      <WorkspaceDataTable
        registerTableId="overview-sales-debit-register"
        title="Debit notes"
        caption="Debit adjustments referencing posted invoices."
        rows={snapshot.salesDebitNoteRegister}
        emptyMessage="No debit notes on file."
        actions={<Link href="/workspace/user/debit-notes" className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-primary/30 hover:text-primary">Open debit notes</Link>}
        columns={[
          {
            id: "doc",
            header: "Debit note",
            defaultWidth: 140,
            render: (row) => <Link href={`/workspace/invoices/${row.id}`} className="font-semibold text-primary hover:underline">{row.number}</Link>,
          },
          { id: "party", header: "Customer", defaultWidth: 160, render: (row) => row.contactName || "—" },
          { id: "status", header: "Status", defaultWidth: 110, render: (row) => row.status.replaceAll("_", " ") },
          {
            id: "grand",
            header: "Total",
            align: "right",
            defaultWidth: 110,
            render: (row) => `${currency(row.grandTotal)} SAR`,
          },
        ]}
      />

      <WorkspaceDataTable
        registerTableId="overview-bills-register"
        title="Vendor bills register"
        caption="Vendor bills and posted purchase invoices."
        rows={snapshot.billsRegister}
        emptyMessage="Post the first vendor bill to start the register."
        actions={<Link href="/workspace/user/bills" className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-primary/30 hover:text-primary">Open bills</Link>}
        columns={[
          {
            id: "bill",
            header: "Vendor bill",
            defaultWidth: 140,
            render: (row) => <Link href={`/workspace/bills/${row.id}`} className="font-semibold text-primary hover:underline">{row.number}</Link>,
          },
          { id: "type", header: "Type", defaultWidth: 100, render: (row) => row.type.replaceAll("_", " ") },
          { id: "status", header: "Status", defaultWidth: 110, render: (row) => row.status.replaceAll("_", " ") },
          { id: "due", header: "Due date", defaultWidth: 110, render: (row) => formatDate(row.dueDate) },
          {
            id: "balance",
            header: "Balance",
            align: "right",
            defaultWidth: 110,
            render: (row) => `${currency(row.balanceDue)} SAR`,
          },
        ]}
      />

      <WorkspaceDataTable
        registerTableId="overview-purchase-order-register"
        title="Purchase orders"
        caption="Outstanding or closed purchase-order documents."
        rows={snapshot.purchaseOrderRegister}
        emptyMessage="No purchase orders found."
        actions={<Link href="/workspace/user/purchase-orders" className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-primary/30 hover:text-primary">Open PO register</Link>}
        columns={[
          {
            id: "po",
            header: "PO",
            defaultWidth: 140,
            render: (row) => <Link href={`/workspace/bills/${row.id}`} className="font-semibold text-primary hover:underline">{row.number}</Link>,
          },
          { id: "vendor", header: "Vendor", defaultWidth: 180, render: (row) => row.contactName || "—" },
          { id: "status", header: "Status", defaultWidth: 110, render: (row) => row.status.replaceAll("_", " ") },
          {
            id: "total",
            header: "Total",
            align: "right",
            defaultWidth: 110,
            render: (row) => `${currency(row.grandTotal)} SAR`,
          },
        ]}
      />

      <WorkspaceDataTable
        registerTableId="overview-purchase-credit-register"
        title="Purchase credit notes"
        caption="Credits raised against finalized vendor invoices."
        rows={snapshot.purchaseCreditNoteRegister}
        emptyMessage="No purchase credits."
        actions={<Link href="/workspace/user/bills" className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-primary/30 hover:text-primary">Open bills workspace</Link>}
        columns={[
          {
            id: "cn",
            header: "Purchase credit",
            defaultWidth: 150,
            render: (row) => <Link href={`/workspace/bills/${row.id}`} className="font-semibold text-primary hover:underline">{row.number}</Link>,
          },
          { id: "vendor", header: "Vendor", defaultWidth: 180, render: (row) => row.contactName || "—" },
          { id: "status", header: "Status", defaultWidth: 110, render: (row) => row.status.replaceAll("_", " ") },
          {
            id: "total",
            header: "Total",
            align: "right",
            defaultWidth: 110,
            render: (row) => `${currency(row.grandTotal)} SAR`,
          },
        ]}
      />

      <WorkspaceDataTable
        registerTableId="overview-journal-register"
        title="Journal entries"
        caption="Manual and system postings (latest 120)."
        rows={snapshot.journalRegister}
        emptyMessage="No journal entries surfaced."
        actions={<Link href="/workspace/user/journal-entries" className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-primary/30 hover:text-primary">Journals workspace</Link>}
        columns={[
          { id: "entry", header: "Journal", defaultWidth: 130, render: (row) => row.entryNumber },
          { id: "date", header: "Date", defaultWidth: 110, render: (row) => formatDate(row.entryDate) },
          { id: "status", header: "Status", defaultWidth: 100, render: (row) => row.status.replaceAll("_", " ") },
          { id: "source", header: "Source", defaultWidth: 120, render: (row) => (row.sourceType ?? "").replaceAll("_", " ") || "—" },
          { id: "ref", header: "Reference", defaultWidth: 140, render: (row) => row.reference ?? "—" },
        ]}
      />

      <WorkspaceDataTable
        registerTableId="overview-inventory-register"
        title="Inventory levels"
        caption="Tracked stock buckets with valuations and linkage metadata."
        rows={snapshot.inventoryRegister}
        emptyMessage="No inventory rows captured."
        actions={<Link href="/workspace/user/stock-movements" className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-primary/30 hover:text-primary">Stock movements</Link>}
        columns={[
          { id: "sku", header: "Code", defaultWidth: 120, render: (row) => row.code },
          { id: "name", header: "Product / batch", defaultWidth: 220, render: (row) => row.productName },
          { id: "qty", header: "Qty", align: "right", defaultWidth: 80, render: (row) => String(row.onHand) },
          {
            id: "valuation",
            header: "Value",
            align: "right",
            defaultWidth: 110,
            render: (row) => `${currency(row.inventoryValue)} SAR`,
          },
          { id: "je", header: "Last JE", defaultWidth: 120, render: (row) => row.journalEntryNumber || "—" },
        ]}
      />

      <WorkspaceDataTable
        registerTableId="overview-payments-register"
        title="Payments register"
        caption="Incoming and outgoing money."
        rows={snapshot.paymentsRegister}
        emptyMessage="Recorded payments will appear here."
        actions={<Link href="/workspace/user/payments" className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-primary/30 hover:text-primary">Open payments</Link>}
        columns={[
          {
            id: "payment",
            header: "Payment",
            defaultWidth: 140,
            render: (row) => <Link href={`/workspace/user/payments?q=${encodeURIComponent(row.number)}`} className="font-semibold text-primary hover:underline">{row.number}</Link>,
          },
          {
            id: "direction",
            header: "Direction",
            defaultWidth: 160,
            render: (row) => (row.direction === "incoming" ? "Incoming money" : "Outgoing payment"),
          },
          { id: "date", header: "Date", defaultWidth: 110, render: (row) => formatDate(row.paymentDate) },
          { id: "method", header: "Method", defaultWidth: 120, render: (row) => row.method || "-" },
          {
            id: "amount",
            header: "Amount",
            align: "right",
            defaultWidth: 110,
            render: (row) => `${currency(row.amount)} SAR`,
          },
        ]}
      />
    </div>
  );
}
