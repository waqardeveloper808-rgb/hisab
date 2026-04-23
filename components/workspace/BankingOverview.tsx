"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import {
  getOpenDocumentsForPayments,
  getRegistersSnapshot,
  recordDocumentPayment,
  type WorkspaceDocumentRecord,
  type WorkspacePaymentRecord,
} from "@/lib/workspace-api";
import { currency } from "@/components/workflow/utils";

type Direction = "incoming" | "outgoing";

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div>
      <label htmlFor={id} className="mb-2.5 block text-sm font-semibold text-ink">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
      >
        {children}
      </select>
    </div>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function BankingOverview() {
  const [direction, setDirection] = useState<Direction>("incoming");
  const [incomingDocuments, setIncomingDocuments] = useState<WorkspaceDocumentRecord[]>([]);
  const [outgoingDocuments, setOutgoingDocuments] = useState<WorkspaceDocumentRecord[]>([]);
  const [payments, setPayments] = useState<WorkspacePaymentRecord[]>([]);
  const [documentId, setDocumentId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today());
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendReady, setBackendReady] = useState(false);

  const openDocuments = direction === "incoming" ? incomingDocuments : outgoingDocuments;

  async function loadData() {
    const [openDocumentsSnapshot, registerSnapshot] = await Promise.all([
      getOpenDocumentsForPayments(),
      getRegistersSnapshot(),
    ]);

    setIncomingDocuments(openDocumentsSnapshot.incoming);
    setOutgoingDocuments(openDocumentsSnapshot.outgoing);
    setPayments(registerSnapshot.paymentsRegister);
    setBackendReady(openDocumentsSnapshot.backendReady || registerSnapshot.backendReady);
  }

  useEffect(() => {
    loadData().catch((err: unknown) => {
      console.error('[BankingOverview] loadData failed:', err);
      setBackendReady(false);
    });
  }, []);

  useEffect(() => {
    const nextDocument = openDocuments[0];
    setDocumentId(nextDocument ? String(nextDocument.id) : "");
    setAmount(nextDocument ? String(nextDocument.balanceDue) : "");
  }, [direction, openDocuments]);

  async function handleSubmit() {
    if (! documentId) {
      setError(direction === "incoming" ? "Choose an invoice to receive against." : "Choose a vendor bill or purchase invoice to pay against.");
      return;
    }

    const numericAmount = Number(amount);

    if (! Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const payment = await recordDocumentPayment({
        direction,
        documentId: Number(documentId),
        amount: numericAmount,
        paymentDate,
        method,
        reference,
      });

      setFeedback(`${payment.number} was recorded successfully.`);
      setReference("");
      await loadData();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Payment could not be recorded.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-white/70 bg-white/95 p-6 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Banking</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Record money movement without leaving the invoicing workspace.</h1>
        <p className="mt-4 text-base leading-7 text-muted">Choose the open invoice or vendor bill, record the movement, and keep balances, books, and registers in step.</p>
        <div className="mt-5 inline-flex rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-muted">
          {backendReady ? "Money movement posts into the company books" : "Money movement becomes available here when open documents exist"}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <WorkspaceDataTable
          title="Recent payment activity"
          caption="Latest incoming and outgoing movement."
          rows={payments}
          emptyMessage="Recorded payments will appear here."
          columns={[
            { header: "Payment", render: (row) => row.number },
            { header: "Direction", render: (row) => row.direction === "incoming" ? "Incoming money" : "Outgoing payment" },
            { header: "Date", render: (row) => row.paymentDate || "-" },
            { header: "Reference", render: (row) => row.reference || "-" },
            { header: "Amount", align: "right", render: (row) => `${currency(row.amount)} SAR` },
          ]}
        />

        <Card className="rounded-xl bg-white/95 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Record payment</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">Apply money to one open document.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Choose whether the money is coming in from a customer or going out to a supplier.</p>

          <div className="mt-5 space-y-4">
            <SelectField label="Money direction" value={direction} onChange={(value) => setDirection(value as Direction)}>
              <option value="incoming">Incoming money</option>
              <option value="outgoing">Outgoing payment</option>
            </SelectField>

            <SelectField label={direction === "incoming" ? "Invoice" : "Vendor bill / purchase invoice"} value={documentId} onChange={setDocumentId}>
              {openDocuments.length ? openDocuments.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.number} - {currency(row.balanceDue)} SAR open
                </option>
              )) : <option value="">No open documents</option>}
            </SelectField>

            <Input label="Amount" type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
            <Input label="Payment date" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />

            <SelectField label="Method" value={method} onChange={setMethod}>
              <option value="bank_transfer">Bank transfer</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="cheque">Cheque</option>
            </SelectField>

            <Input label="Reference" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Optional payment reference" />

            {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}

            <Button onClick={handleSubmit} disabled={saving || ! openDocuments.length} fullWidth>
              {saving ? "Recording payment" : direction === "incoming" ? "Record incoming money" : "Record outgoing payment"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}