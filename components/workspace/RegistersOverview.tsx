"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
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
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Registers</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Operational review stays clean when the registers stay current.</h1>
        <p className="mt-4 text-base leading-7 text-muted">Sales, purchases, and payment activity are grouped here so finance review stays separate from data entry.</p>
        <div className="mt-5 inline-flex rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-muted">
          {snapshot.backendReady ? "Company books connected" : "Registers will populate as soon as transactions are posted"}
        </div>
      </Card>

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