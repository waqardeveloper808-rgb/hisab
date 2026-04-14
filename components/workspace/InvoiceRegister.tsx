"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { currency } from "@/components/workflow/utils";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import {
  finalizeTransactionDraft,
  listDocuments,
  recordDocumentPayment,
  sendDocument,
  type DocumentCenterRecord,
} from "@/lib/workspace-api";
import { mapWorkspaceHref } from "@/lib/workspace-path";

type InvoiceLifecycle = "draft" | "issued" | "reported" | "paid" | "overdue";

const paymentMethods = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return value ? value.slice(0, 10) : "-";
}

function isAuthorizationError(message: string | null) {
  const value = message?.toLowerCase() ?? "";
  return value.includes("401") || value.includes("unauthorized") || value.includes("unauthenticated") || value.includes("access") || value.includes("login");
}

function normalizeInvoiceStatus(invoice: DocumentCenterRecord): InvoiceLifecycle {
  if (invoice.status === "draft") {
    return "draft";
  }

  if (invoice.status === "paid" || (invoice.grandTotal > 0 && invoice.balanceDue <= 0)) {
    return "paid";
  }

  const dueDate = formatDate(invoice.dueDate);

  if (dueDate !== "-" && dueDate < today() && invoice.balanceDue > 0) {
    return "overdue";
  }

  if (invoice.sentAt || invoice.status === "sent") {
    return "reported";
  }

  return "issued";
}

function statusLabel(status: InvoiceLifecycle) {
  return {
    draft: "Draft",
    issued: "Issued",
    reported: "Reported",
    paid: "Paid",
    overdue: "Overdue",
  }[status];
}

function statusClasses(status: InvoiceLifecycle) {
  return {
    draft: "border-amber-200 bg-amber-50 text-amber-800",
    issued: "border-sky-200 bg-sky-50 text-sky-800",
    reported: "border-indigo-200 bg-indigo-50 text-indigo-800",
    paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
    overdue: "border-rose-200 bg-rose-50 text-rose-800",
  }[status];
}

function canSendInvoice(invoice: DocumentCenterRecord) {
  if (invoice.sentAt || invoice.status === "paid" || invoice.balanceDue <= 0) {
    return false;
  }

  return invoice.status === "draft" || invoice.status === "finalized" || invoice.status === "partially_paid";
}

function canRecordPayment(invoice: DocumentCenterRecord) {
  return invoice.status !== "draft" && invoice.balanceDue > 0 && invoice.status !== "paid";
}

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

export function InvoiceRegister() {
  const { basePath } = useWorkspacePath();
  const [invoices, setInvoices] = useState<DocumentCenterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [authLimited, setAuthLimited] = useState(false);
  const [runningAction, setRunningAction] = useState<number | null>(null);
  const [invoiceNumberQuery, setInvoiceNumberQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [paymentTarget, setPaymentTarget] = useState<DocumentCenterRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const deferredInvoiceNumberQuery = useDeferredValue(invoiceNumberQuery);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    setAuthLimited(false);

    listDocuments({
      group: "sales",
      type: "tax_invoice",
      search: deferredInvoiceNumberQuery.trim() || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      sort: "issue_date",
      direction: "desc",
    })
      .then((nextInvoices) => {
        if (!active) {
          return;
        }

        setInvoices(nextInvoices);
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }

        const message = nextError instanceof Error ? nextError.message : "Invoices could not be loaded.";

        if (isAuthorizationError(message)) {
          setAuthLimited(true);
          setError(null);
        } else {
          setError("Invoice data is not available right now.");
        }

        setInvoices([]);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [deferredInvoiceNumberQuery, fromDate, refreshKey, toDate]);

  const customerOptions = useMemo(() => {
    return [...new Set(invoices.map((invoice) => invoice.contactName).filter(Boolean))].sort((left, right) => left.localeCompare(right));
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const normalizedStatus = normalizeInvoiceStatus(invoice);
      const issueDate = formatDate(invoice.issueDate);
      const matchesInvoiceNumber = true;
      const matchesStatus = statusFilter === "all" ? true : normalizedStatus === statusFilter;
      const matchesCustomer = customerFilter === "all" ? true : invoice.contactName === customerFilter;
      const matchesFromDate = fromDate ? (issueDate !== "-" && issueDate >= fromDate) : true;
      const matchesToDate = toDate ? (issueDate !== "-" && issueDate <= toDate) : true;

      return matchesInvoiceNumber && matchesStatus && matchesCustomer && matchesFromDate && matchesToDate;
    });
  }, [customerFilter, deferredInvoiceNumberQuery, fromDate, invoices, statusFilter, toDate]);

  const openCreateHref = mapWorkspaceHref("/workspace/invoices/new", basePath);

  const tableHead = (
    <thead className="border-b border-line bg-surface-soft/70">
      <tr>
        <th className="px-3 py-2 text-left font-semibold text-muted">Invoice Number</th>
        <th className="px-3 py-2 text-left font-semibold text-muted">Customer</th>
        <th className="px-3 py-2 text-left font-semibold text-muted">Issue Date</th>
        <th className="px-3 py-2 text-left font-semibold text-muted">Due Date</th>
        <th className="px-3 py-2 text-right font-semibold text-muted">Total Amount</th>
        <th className="px-3 py-2 text-right font-semibold text-muted">Paid Amount</th>
        <th className="px-3 py-2 text-right font-semibold text-muted">Balance</th>
        <th className="px-3 py-2 text-left font-semibold text-muted">Status</th>
        <th className="px-3 py-2 text-left font-semibold text-muted">Actions</th>
      </tr>
    </thead>
  );

  function resetFilters() {
    setInvoiceNumberQuery("");
    setStatusFilter("all");
    setCustomerFilter("all");
    setFromDate("");
    setToDate("");
  }

  function openPaymentForm(invoice: DocumentCenterRecord) {
    setFeedback(null);
    setError(null);
    setPaymentTarget(invoice);
    setPaymentAmount(String(invoice.balanceDue));
    setPaymentDate(today());
    setPaymentMethod("bank_transfer");
    setPaymentReference("");
  }

  async function handleSend(invoice: DocumentCenterRecord) {
    if (!canSendInvoice(invoice)) {
      setError("This invoice cannot be sent from its current state.");
      return;
    }

    const email = window.prompt("Send this invoice to which email address?", invoice.sentToEmail || "");

    if (email === null) {
      return;
    }

    setRunningAction(invoice.id);
    setFeedback(null);
    setError(null);

    try {
      if (normalizeInvoiceStatus(invoice) === "draft") {
        await finalizeTransactionDraft("invoice", invoice.id);
      }

      await sendDocument(invoice.id, { email });
      setFeedback(`Invoice ${invoice.number} was sent.`);
      setRefreshKey((current) => current + 1);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Invoice could not be sent.");
    } finally {
      setRunningAction(null);
    }
  }

  async function handleRecordPayment() {
    if (!paymentTarget) {
      return;
    }

    const numericAmount = Number(paymentAmount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a payment amount greater than zero.");
      return;
    }

    setSavingPayment(true);
    setFeedback(null);
    setError(null);

    try {
      await recordDocumentPayment({
        direction: "incoming",
        documentId: paymentTarget.id,
        amount: numericAmount,
        paymentDate,
        method: paymentMethod,
        reference: paymentReference,
      });
      setFeedback(`Payment recorded against ${paymentTarget.number}.`);
      setPaymentTarget(null);
      setRefreshKey((current) => current + 1);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Payment could not be recorded.");
    } finally {
      setSavingPayment(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-ink">Invoices</h1>
        <Button href={openCreateHref}>Create Invoice</Button>
      </div>

      {authLimited ? (
        <Card className="rounded-[1.1rem] bg-white/95 p-3">
          <div className="flex items-center justify-between gap-4 text-sm">
            <p className="text-muted">Preview mode is limited. Sign in with workspace access to view invoice data.</p>
            <div className="shrink-0">
              <Button href="/login" variant="secondary">Sign in</Button>
            </div>
          </div>
        </Card>
      ) : loading ? (
        <Card className="rounded-[1.1rem] overflow-hidden bg-white/95 p-0">
          <div className="grid gap-3 border-b border-line px-3 py-3 md:grid-cols-2 xl:grid-cols-[1.1fr_0.9fr_0.8fr_0.8fr_0.8fr_auto]">
            <div className="h-[5.5rem] rounded-xl border border-dashed border-line bg-surface-soft/60" />
            <div className="h-[5.5rem] rounded-xl border border-dashed border-line bg-surface-soft/60" />
            <div className="h-[5.5rem] rounded-xl border border-dashed border-line bg-surface-soft/60" />
            <div className="h-[5.5rem] rounded-xl border border-dashed border-line bg-surface-soft/60" />
            <div className="h-[5.5rem] rounded-xl border border-dashed border-line bg-surface-soft/60" />
            <div className="flex items-end">
              <div className="h-11 w-full rounded-xl border border-dashed border-line bg-surface-soft/60" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              {tableHead}
              <tbody>
                <tr>
                  <td className="px-3 py-4 text-sm text-muted" colSpan={9}>Loading invoices...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
      <Card className="rounded-[1.1rem] bg-white/95 p-0 overflow-hidden">
        <div className="grid gap-3 border-b border-line px-3 py-3 md:grid-cols-2 xl:grid-cols-[1.1fr_0.9fr_0.8fr_0.8fr_0.8fr_auto]">
          <Input
            label="Invoice number"
            value={invoiceNumberQuery}
            onChange={(event) => setInvoiceNumberQuery(event.target.value)}
            placeholder="Search by invoice number"
          />
          <SelectField label="Customer" value={customerFilter} onChange={setCustomerFilter}>
            <option value="all">All customers</option>
            {customerOptions.map((customer) => (
              <option key={customer} value={customer}>{customer}</option>
            ))}
          </SelectField>
          <SelectField label="Status" value={statusFilter} onChange={setStatusFilter}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="reported">Reported</option>
            <option value="paid">Paid</option>
          </SelectField>
          <Input label="From date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <Input label="To date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          <div className="flex items-end">
            <Button variant="secondary" onClick={resetFilters} fullWidth>Reset</Button>
          </div>
        </div>

        {error ? <div className="mx-3 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
        {feedback ? <div className="mx-3 mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{feedback}</div> : null}

        {filteredInvoices.length === 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              {tableHead}
              <tbody>
                <tr>
                  <td className="px-3 py-4 text-sm text-muted" colSpan={9}>{invoices.length === 0 ? "No invoices yet" : "No invoices match the current filters."}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              {tableHead}
              <tbody>
                {filteredInvoices.map((invoice) => {
                  const normalizedStatus = normalizeInvoiceStatus(invoice);
                  const invoiceHref = mapWorkspaceHref(`/workspace/invoices/${invoice.id}`, basePath);
                  const canEdit = normalizedStatus === "draft";
                  const showSend = canSendInvoice(invoice);
                  const showRecordPayment = canRecordPayment(invoice);

                  return (
                    <tr key={invoice.id} className="border-t border-line/70 text-ink">
                      <td className="px-3 py-3 align-top font-semibold text-ink">{invoice.number}</td>
                      <td className="px-3 py-3 align-top text-muted">{invoice.contactName || "-"}</td>
                      <td className="px-3 py-3 align-top text-muted">{formatDate(invoice.issueDate)}</td>
                      <td className="px-3 py-3 align-top text-muted">{formatDate(invoice.dueDate)}</td>
                      <td className="px-3 py-3 text-right align-top font-semibold text-ink">{currency(invoice.grandTotal)} SAR</td>
                      <td className="px-3 py-3 text-right align-top font-semibold text-ink">{currency(invoice.paidTotal)} SAR</td>
                      <td className="px-3 py-3 text-right align-top font-semibold text-ink">{currency(invoice.balanceDue)} SAR</td>
                      <td className="px-3 py-3 align-top">
                        <span className={["inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]", statusClasses(normalizedStatus)].join(" ")}>
                          {statusLabel(normalizedStatus)}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-wrap gap-2">
                          <Button href={invoiceHref} variant="tertiary">View</Button>
                          {canEdit ? <Button href={invoiceHref} variant="secondary">Edit</Button> : null}
                          {showSend ? (
                            <Button variant="secondary" onClick={() => handleSend(invoice)} disabled={runningAction === invoice.id}>
                              {runningAction === invoice.id ? "Sending" : normalizedStatus === "draft" ? "Issue & Send" : "Send"}
                            </Button>
                          ) : null}
                          {showRecordPayment ? <Button variant="secondary" onClick={() => openPaymentForm(invoice)}>Record Payment</Button> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      )}

      {paymentTarget ? (
        <Card className="rounded-[1.9rem] bg-white/92 p-6">
          <div className="flex flex-col gap-2 border-b border-line pb-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Record Payment</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">{paymentTarget.number}</h2>
              <p className="mt-1 text-sm text-muted">{paymentTarget.contactName || "No customer linked"} · Open balance {currency(paymentTarget.balanceDue)} SAR</p>
            </div>
            <Button variant="tertiary" onClick={() => setPaymentTarget(null)}>Cancel</Button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input label="Amount" type="number" min="0" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
            <Input label="Payment date" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
            <SelectField label="Method" value={paymentMethod} onChange={setPaymentMethod}>
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>{method.label}</option>
              ))}
            </SelectField>
            <Input label="Reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Optional reference" />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={handleRecordPayment} disabled={savingPayment}>{savingPayment ? "Recording Payment" : "Record Payment"}</Button>
            <Button variant="secondary" onClick={() => setPaymentTarget(null)}>Close</Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}