"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";
import { currency } from "@/components/workflow/utils";
import { getRegistersSnapshot, type RegistersSnapshot } from "@/lib/workspace-api";

const emptyRegisters: RegistersSnapshot = {
  invoiceRegister: [],
  billsRegister: [],
  paymentsRegister: [],
  backendReady: false,
};

export function ExpensesRegister() {
  const [snapshot, setSnapshot] = useState<RegistersSnapshot>(emptyRegisters);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRegistersSnapshot()
      .then(setSnapshot)
      .finally(() => setLoading(false));
  }, []);

  const outgoingPayments = useMemo(
    () => snapshot.paymentsRegister.filter((payment) => payment.direction === "outgoing"),
    [snapshot.paymentsRegister],
  );

  return (
    <div className="space-y-4" data-inspector-real-register="expenses">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Expenses</h1>
          <p className="text-sm text-muted">Outgoing cash movement and purchase-related settlement kept in one expense lane.</p>
        </div>
        <Button href="/workspace/bills/new">Capture Expense</Button>
      </div>

      <WorkspaceModeNotice
        title="Preview expense register"
        detail="Use this route for outgoing payments and purchase-linked expense movement until a dedicated cash-expense endpoint exists."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-[1.25rem] bg-white/95 p-0 overflow-hidden">
          <div className="border-b border-line px-4 py-4">
            <h2 className="text-base font-semibold text-ink">Open purchase documents</h2>
            <p className="text-sm text-muted">Bills still waiting to be settled.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-line bg-surface-soft/70">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Bill</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Vendor</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Balance</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td className="px-4 py-4 text-muted" colSpan={3}>Loading expenses...</td></tr> : snapshot.billsRegister.filter((bill) => bill.balanceDue > 0).map((bill) => (
                  <tr key={bill.id} className="border-t border-line/70">
                    <td className="px-4 py-3 font-semibold text-ink">{bill.number}</td>
                    <td className="px-4 py-3 text-muted">{bill.contactName}</td>
                    <td className="px-4 py-3 text-right text-muted">{currency(bill.balanceDue)} SAR</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="rounded-[1.25rem] bg-white/95 p-0 overflow-hidden">
          <div className="border-b border-line px-4 py-4">
            <h2 className="text-base font-semibold text-ink">Outgoing payments</h2>
            <p className="text-sm text-muted">Settlements already posted against purchase flow.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-line bg-surface-soft/70">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Payment</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Method</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td className="px-4 py-4 text-muted" colSpan={4}>Loading outgoing payments...</td></tr> : outgoingPayments.map((payment) => (
                  <tr key={payment.id} className="border-t border-line/70">
                    <td className="px-4 py-3 font-semibold text-ink">{payment.number}</td>
                    <td className="px-4 py-3 text-muted">{payment.paymentDate}</td>
                    <td className="px-4 py-3 text-muted">{payment.method}</td>
                    <td className="px-4 py-3 text-right text-muted">{currency(payment.amount)} SAR</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}