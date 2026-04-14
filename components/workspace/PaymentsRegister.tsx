"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";
import { currency } from "@/components/workflow/utils";
import { getOpenDocumentsForPayments, getRegistersSnapshot, recordDocumentPayment, type WorkspaceDocumentRecord, type WorkspacePaymentRecord } from "@/lib/workspace-api";

type Direction = "incoming" | "outgoing";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentsRegister() {
  const [payments, setPayments] = useState<WorkspacePaymentRecord[]>([]);
  const [incoming, setIncoming] = useState<WorkspaceDocumentRecord[]>([]);
  const [outgoing, setOutgoing] = useState<WorkspaceDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [direction, setDirection] = useState<Direction>("incoming");
  const [documentId, setDocumentId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today());
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDocuments = direction === "incoming" ? incoming : outgoing;

  useEffect(() => {
    Promise.all([getRegistersSnapshot(), getOpenDocumentsForPayments()])
      .then(([registers, openDocumentsSnapshot]) => {
        setPayments(registers.paymentsRegister);
        setIncoming(openDocumentsSnapshot.incoming);
        setOutgoing(openDocumentsSnapshot.outgoing);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const firstDocument = openDocuments[0];
    setDocumentId(firstDocument ? String(firstDocument.id) : "");
    setAmount(firstDocument ? String(firstDocument.balanceDue) : "");
  }, [openDocuments]);

  const visiblePayments = useMemo(
    () => payments.filter((payment) => payment.direction === direction),
    [direction, payments],
  );

  async function handleCreate() {
    const numericAmount = Number(amount);

    if (!documentId) {
      setError("Choose an open document before recording a payment.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a payment amount greater than zero.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const created = await recordDocumentPayment({
        direction,
        documentId: Number(documentId),
        amount: numericAmount,
        paymentDate,
        method,
        reference,
      });

      setPayments((current) => [created, ...current]);
      setReference("");
      setShowCreate(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Payment could not be recorded.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4" data-inspector-real-register="payments">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Payments</h1>
          <p className="text-sm text-muted">Cash movement register with direct payment capture against open customer and supplier documents.</p>
        </div>
        <Button onClick={() => setShowCreate((current) => !current)}>{showCreate ? "Close" : "Record Payment"}</Button>
      </div>

      <WorkspaceModeNotice
        title="Preview payment register"
        detail="Guest mode posts payments into the controlled preview ledger so balances, payment rows, and accounting stay aligned during inspection."
      />

      {showCreate ? (
        <Card className="rounded-[1.25rem] bg-white/95 p-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label htmlFor="payment-direction" className="mb-2 block text-sm font-semibold text-ink">Direction</label>
              <select id="payment-direction" value={direction} onChange={(event) => setDirection(event.target.value as Direction)} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                <option value="incoming">Incoming</option>
                <option value="outgoing">Outgoing</option>
              </select>
            </div>
            <div>
              <label htmlFor="payment-document" className="mb-2 block text-sm font-semibold text-ink">Open document</label>
              <select id="payment-document" value={documentId} onChange={(event) => setDocumentId(event.target.value)} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                {openDocuments.length ? openDocuments.map((document) => (
                  <option key={document.id} value={document.id}>{document.number} · {currency(document.balanceDue)} SAR open</option>
                )) : <option value="">No open documents</option>}
              </select>
            </div>
            <Input label="Amount" type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
            <Input label="Payment date" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
            <Input label="Reference" value={reference} onChange={(event) => setReference(event.target.value)} />
          </div>
          <div className="mt-4 max-w-xs">
            <label htmlFor="payment-method" className="mb-2 block text-sm font-semibold text-ink">Method</label>
            <select id="payment-method" value={method} onChange={(event) => setMethod(event.target.value)} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
              <option value="bank_transfer">Bank transfer</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          <div className="mt-4 flex gap-3">
            <Button onClick={() => void handleCreate()} disabled={saving}>{saving ? "Recording" : "Create Payment"}</Button>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </Card>
      ) : null}

      <Card className="rounded-[1.25rem] bg-white/95 p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => setDirection("incoming")} className={["rounded-full px-3 py-2 text-sm font-semibold", direction === "incoming" ? "bg-primary text-white" : "bg-surface-soft text-ink"].join(" ")}>Incoming</button>
            <button type="button" onClick={() => setDirection("outgoing")} className={["rounded-full px-3 py-2 text-sm font-semibold", direction === "outgoing" ? "bg-primary text-white" : "bg-surface-soft text-ink"].join(" ")}>Outgoing</button>
          </div>
          <p className="text-sm text-muted">{visiblePayments.length} visible rows</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line bg-surface-soft/70">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted">Payment</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Method</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Reference</th>
                <th className="px-4 py-3 text-right font-semibold text-muted">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-muted" colSpan={5}>Loading payments...</td>
                </tr>
              ) : visiblePayments.length ? visiblePayments.map((payment) => (
                <tr key={payment.id} className="border-t border-line/70">
                  <td className="px-4 py-3 font-semibold text-ink">{payment.number}</td>
                  <td className="px-4 py-3 text-muted">{payment.paymentDate || "-"}</td>
                  <td className="px-4 py-3 text-muted">{payment.method || "-"}</td>
                  <td className="px-4 py-3 text-muted">{payment.reference || "-"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{currency(payment.amount)} SAR</td>
                </tr>
              )) : (
                <tr>
                  <td className="px-4 py-6" colSpan={5}>
                    <div className="rounded-[1.2rem] border border-dashed border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                      <p className="font-semibold text-ink">No payments have been posted for this direction.</p>
                      <p className="mt-1">Choose an open invoice or bill, record the settlement, and the register will update cash movement and document balance together.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}