"use client";

import { useEffect, useState } from "react";
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
        title="Invoice register"
        caption="Issued sales documents, balances, and due dates."
        rows={snapshot.invoiceRegister}
        emptyMessage="Post the first invoice to start the register."
        columns={[
          { header: "Invoice", render: (row) => row.number },
          { header: "Status", render: (row) => row.status.replaceAll("_", " ") },
          { header: "Issue date", render: (row) => formatDate(row.issueDate) },
          { header: "Due date", render: (row) => formatDate(row.dueDate) },
          { header: "Balance", align: "right", render: (row) => `${currency(row.balanceDue)} SAR` },
        ]}
      />

      <WorkspaceDataTable
        title="Vendor bills register"
        caption="Vendor bills and purchase invoices waiting for settlement."
        rows={snapshot.billsRegister}
        emptyMessage="Post the first vendor bill to start the register."
        columns={[
          { header: "Vendor bill", render: (row) => row.number },
          { header: "Type", render: (row) => row.type.replaceAll("_", " ") },
          { header: "Status", render: (row) => row.status.replaceAll("_", " ") },
          { header: "Due date", render: (row) => formatDate(row.dueDate) },
          { header: "Balance", align: "right", render: (row) => `${currency(row.balanceDue)} SAR` },
        ]}
      />

      <WorkspaceDataTable
        title="Payments register"
        caption="Incoming and outgoing money, including what is still unallocated."
        rows={snapshot.paymentsRegister}
        emptyMessage="Recorded payments will appear here."
        columns={[
          { header: "Payment", render: (row) => row.number },
          { header: "Direction", render: (row) => row.direction === "incoming" ? "Incoming money" : "Outgoing payment" },
          { header: "Date", render: (row) => formatDate(row.paymentDate) },
          { header: "Method", render: (row) => row.method || "-" },
          { header: "Amount", align: "right", render: (row) => `${currency(row.amount)} SAR` },
        ]}
      />
    </div>
  );
}