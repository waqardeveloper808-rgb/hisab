"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useWorkspaceMode } from "@/components/workspace/WorkspaceAccessProvider";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { currency } from "@/components/workflow/utils";
import { mapWorkspaceHref } from "@/lib/workspace-path";
import { getCustomerStatement, getWorkspaceDirectory, type ContactRecord, type CustomerStatementRecord } from "@/lib/workspace-api";

function formatBusinessDate(value: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function CustomerStatementWorkspace() {
  const { basePath } = useWorkspacePath();
  const { isPreview } = useWorkspaceMode();
  const workspaceMode = isPreview ? "preview" : "backend";
  const [customers, setCustomers] = useState<ContactRecord[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [statement, setStatement] = useState<CustomerStatementRecord | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getWorkspaceDirectory()
      .then((directory) => {
        if (!active) {
          return;
        }

        const nextCustomers = directory?.customers ?? [];
        setCustomers(nextCustomers);
        const initial = nextCustomers.find((contact) => typeof contact.backendId === "number") ?? nextCustomers[0] ?? null;
        setSelectedContactId(initial?.backendId ?? null);
      })
      .catch((nextError: unknown) => {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Customer list could not be loaded.");
        }
      })
      .finally(() => {
        if (active) {
          setLoadingCustomers(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedContactId) {
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) {
        return;
      }
      setLoadingStatement(true);
      setError(null);
    }, 0);

    void getCustomerStatement(selectedContactId, { mode: workspaceMode })
      .then((result) => {
        if (active) {
          setStatement(result);
        }
      })
      .catch((nextError: unknown) => {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Customer statement could not be loaded.");
          setStatement(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingStatement(false);
        }
      });

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [selectedContactId, workspaceMode]);

  const selectedCustomer = useMemo(() => customers.find((customer) => customer.backendId === selectedContactId) ?? null, [customers, selectedContactId]);

  const openingBalance = selectedCustomer?.openingBalance ?? 0;
  const invoiceTotal = statement ? statement.documents.filter((document) => document.type === "tax_invoice").reduce((sum, document) => sum + document.balanceDue, 0) : 0;
  const debitNoteTotal = statement ? statement.documents.filter((document) => document.type === "debit_note").reduce((sum, document) => sum + document.balanceDue, 0) : 0;
  const creditNoteTotal = statement ? statement.documents.filter((document) => document.type === "credit_note").reduce((sum, document) => sum + document.balanceDue, 0) : 0;
  const paymentTotal = statement ? statement.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
  const closingBalance = openingBalance + invoiceTotal + debitNoteTotal - creditNoteTotal - paymentTotal;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Statements</p>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Customer statement</h1>
          <p className="text-xs text-muted">Chronological customer activity built from live workspace documents and payments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="xs" variant="secondary" href={mapWorkspaceHref("/workspace/user/reports/profit-loss", basePath)}>Reports</Button>
          <Button size="xs" variant="secondary" href={mapWorkspaceHref("/workspace/user/customers", basePath)}>Customers</Button>
        </div>
      </div>

      <Card className="rounded-xl bg-white/95 p-3">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink" htmlFor="customer-statement-contact">Customer</label>
            <select
              id="customer-statement-contact"
              value={selectedContactId ?? ""}
              onChange={(event) => {
                if (!event.target.value) {
                  setStatement(null);
                }
                setSelectedContactId(event.target.value ? Number(event.target.value) : null);
              }}
              className="block h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.backendId ?? customer.id} value={customer.backendId ?? ""}>
                  {customer.displayName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button size="sm" variant="secondary" onClick={() => void setSelectedContactId((current) => current)}>Refresh</Button>
          </div>
        </div>
      </Card>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-xl bg-white/95 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Opening balance</p>
          <p className="mt-1 text-2xl font-bold text-ink">{currency(openingBalance)} SAR</p>
        </Card>
        <Card className="rounded-xl bg-white/95 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Invoices + notes</p>
          <p className="mt-1 text-2xl font-bold text-ink">{currency(invoiceTotal + debitNoteTotal - creditNoteTotal)} SAR</p>
        </Card>
        <Card className="rounded-xl bg-white/95 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Payments</p>
          <p className="mt-1 text-2xl font-bold text-ink">{currency(paymentTotal)} SAR</p>
        </Card>
        <Card className="rounded-xl bg-white/95 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Closing balance</p>
          <p className="mt-1 text-2xl font-bold text-ink">{currency(closingBalance)} SAR</p>
        </Card>
      </div>

      <Card className="rounded-xl bg-white/95 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-ink">{selectedCustomer?.displayName || statement?.contact.displayName || "Customer statement"}</p>
            <p className="text-xs text-muted">
              {selectedCustomer?.city || statement?.contact.city || "—"}{selectedCustomer?.email ? ` · ${selectedCustomer.email}` : ""}
            </p>
          </div>
          <p className="text-xs text-muted">
            {loadingCustomers || loadingStatement ? "Loading…" : statement ? `${statement.documents.length} document${statement.documents.length === 1 ? "" : "s"} · ${statement.payments.length} payment${statement.payments.length === 1 ? "" : "s"}` : "Select a customer"}
          </p>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="border-b border-line bg-surface-soft px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">Documents</div>
            <div className="divide-y divide-line">
              {(statement?.documents ?? []).map((document) => {
                const impact = document.type === "credit_note" ? -document.balanceDue : document.balanceDue;
                return (
                  <div key={document.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{document.documentNumber}</p>
                      <p className="text-xs text-muted">{formatBusinessDate(document.issueDate)} · {document.type.replace(/_/g, " ")}</p>
                    </div>
                    <p className={impact >= 0 ? "font-semibold text-ink" : "font-semibold text-rose-700"}>{impact >= 0 ? "+" : "−"}{currency(Math.abs(impact))} SAR</p>
                  </div>
                );
              })}
              {(!loadingStatement && (statement?.documents ?? []).length === 0) ? <p className="px-3 py-4 text-sm text-muted">No invoice, note, or adjustment rows found for this customer.</p> : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-line">
            <div className="border-b border-line bg-surface-soft px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">Payments</div>
            <div className="divide-y divide-line">
              {(statement?.payments ?? []).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{payment.paymentNumber}</p>
                    <p className="text-xs text-muted">{formatBusinessDate(payment.paymentDate)}{payment.reference ? ` · ${payment.reference}` : ""}</p>
                  </div>
                  <p className="font-semibold text-ink">−{currency(payment.amount)} SAR</p>
                </div>
              ))}
              {(!loadingStatement && (statement?.payments ?? []).length === 0) ? <p className="px-3 py-4 text-sm text-muted">No matching customer payments were found.</p> : null}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
