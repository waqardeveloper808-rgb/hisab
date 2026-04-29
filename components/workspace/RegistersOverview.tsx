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
  backendReady: false,
};

function formatDate(value: string) {
  return value || "-";
}

export function RegistersOverview() {
  const [snapshot, setSnapshot] = useState<RegistersSnapshot>(fallbackState);

  useEffect(() => {
    let active = true;

    getRegistersSnapshot().then((nextSnapshot) => {
      if (active) {
        setSnapshot(nextSnapshot);
      }
    }).catch((err: unknown) => { console.error('[RegistersOverview] getRegistersSnapshot failed:', err); });

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
        caption="Issued sales documents, balances, and due dates."
        rows={snapshot.invoiceRegister}
        emptyMessage="Post the first invoice to start the register."
        actions={<Link href="/workspace/user/invoices" className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-primary/30 hover:text-primary">Open register</Link>}
        columns={[
          { id: "invoice", header: "Invoice", defaultWidth: 140, render: (row) => <Link href={`/workspace/invoices/${row.id}`} className="font-semibold text-primary hover:underline">{row.number}</Link> },
          { id: "status", header: "Status", defaultWidth: 110, render: (row) => row.status.replaceAll("_", " ") },
          { id: "issue", header: "Issue date", defaultWidth: 110, render: (row) => formatDate(row.issueDate) },
          { id: "due", header: "Due date", defaultWidth: 110, render: (row) => formatDate(row.dueDate) },
          { id: "balance", header: "Balance", align: "right", defaultWidth: 110, render: (row) => `${currency(row.balanceDue)} SAR` },
        ]}
      />

      <WorkspaceDataTable
        registerTableId="overview-bills-register"
        title="Vendor bills register"
        caption="Vendor bills and purchase invoices waiting for settlement."
        rows={snapshot.billsRegister}
        emptyMessage="Post the first vendor bill to start the register."
        actions={<Link href="/workspace/user/bills" className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-primary/30 hover:text-primary">Open bills</Link>}
        columns={[
          { id: "bill", header: "Vendor bill", defaultWidth: 140, render: (row) => <Link href={`/workspace/bills/${row.id}`} className="font-semibold text-primary hover:underline">{row.number}</Link> },
          { id: "type", header: "Type", defaultWidth: 100, render: (row) => row.type.replaceAll("_", " ") },
          { id: "status", header: "Status", defaultWidth: 110, render: (row) => row.status.replaceAll("_", " ") },
          { id: "due", header: "Due date", defaultWidth: 110, render: (row) => formatDate(row.dueDate) },
          { id: "balance", header: "Balance", align: "right", defaultWidth: 110, render: (row) => `${currency(row.balanceDue)} SAR` },
        ]}
      />

      <WorkspaceDataTable
        registerTableId="overview-payments-register"
        title="Payments register"
        caption="Incoming and outgoing money, including what is still unallocated."
        rows={snapshot.paymentsRegister}
        emptyMessage="Recorded payments will appear here."
        actions={<Link href="/workspace/user/payments" className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-primary/30 hover:text-primary">Open payments</Link>}
        columns={[
          { id: "payment", header: "Payment", defaultWidth: 140, render: (row) => <Link href={`/workspace/user/payments?q=${encodeURIComponent(row.number)}`} className="font-semibold text-primary hover:underline">{row.number}</Link> },
          { id: "direction", header: "Direction", defaultWidth: 160, render: (row) => row.direction === "incoming" ? "Incoming money" : "Outgoing payment" },
          { id: "date", header: "Date", defaultWidth: 110, render: (row) => formatDate(row.paymentDate) },
          { id: "method", header: "Method", defaultWidth: 120, render: (row) => row.method || "-" },
          { id: "amount", header: "Amount", align: "right", defaultWidth: 110, render: (row) => `${currency(row.amount)} SAR` },
        ]}
      />
    </div>
  );
}