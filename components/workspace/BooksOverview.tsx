"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { getBooksSnapshot, type BooksSnapshot } from "@/lib/workspace-api";
import { mapWorkspaceHref } from "@/lib/workspace-path";
import { currency } from "@/components/workflow/utils";

const emptyState: BooksSnapshot = {
  trialBalance: [],
  generalLedger: [],
  auditTrail: [],
  backendReady: false,
};

export function BooksOverview() {
  const { basePath } = useWorkspacePath();
  const searchParams = useSearchParams();
  const [snapshot, setSnapshot] = useState<BooksSnapshot>(emptyState);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [loading, setLoading] = useState(true);
  const entryFilter = searchParams.get("entry")?.toLowerCase() ?? "";
  const accountFilter = searchParams.get("account")?.toLowerCase() ?? "";
  const documentFilter = searchParams.get("document")?.toLowerCase() ?? "";
  const invoiceFilterRaw = searchParams.get("invoice_id")?.trim() ?? "";
  const invoiceFilterId = Number(invoiceFilterRaw);
  const hasInvoiceFilter = Number.isInteger(invoiceFilterId) && invoiceFilterId > 0;
  const invoiceFilterNumber = searchParams.get("invoice_number")?.trim() ?? "";

  useEffect(() => {
    let active = true;

    getBooksSnapshot({
      accountCode: accountFilter || undefined,
      documentNumber: documentFilter || undefined,
      invoiceId: hasInvoiceFilter ? invoiceFilterId : undefined,
      invoiceNumber: invoiceFilterNumber || undefined,
    })
      .then((nextSnapshot) => {
        if (active) {
          setSnapshot(nextSnapshot);
        }
      })
      .catch((err: unknown) => { console.error('[BooksOverview] getBooksSnapshot failed:', err); })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accountFilter, documentFilter, hasInvoiceFilter, invoiceFilterId, invoiceFilterNumber]);

  const filteredLedger = useMemo(
    () => snapshot.generalLedger.filter((row) => {
      const haystack = `${row.entryNumber} ${row.accountCode} ${row.accountName} ${row.description} ${row.documentNumber} ${row.costCenterCode} ${row.costCenterName}`.toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.toLowerCase());
      const matchesEntry = !entryFilter || row.entryNumber.toLowerCase() === entryFilter;
      const matchesAccount = !accountFilter || `${row.accountCode} ${row.accountName}`.toLowerCase().includes(accountFilter);
      const matchesDocument = !documentFilter || row.documentNumber.toLowerCase().includes(documentFilter);

      return matchesQuery && matchesEntry && matchesAccount && matchesDocument;
    }),
    [accountFilter, documentFilter, entryFilter, query, snapshot.generalLedger],
  );
  const debitTotal = snapshot.trialBalance.reduce((sum, row) => sum + row.debitTotal, 0);
  const creditTotal = snapshot.trialBalance.reduce((sum, row) => sum + row.creditTotal, 0);

  const filteredTrialBalance = useMemo(() => {
    return snapshot.trialBalance.filter((row) => {
      const haystack = `${row.code} ${row.name} ${row.type}`.toLowerCase();
      return !query.trim() || haystack.includes(query.toLowerCase()) || (!accountFilter ? false : haystack.includes(accountFilter));
    });
  }, [accountFilter, query, snapshot.trialBalance]);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Books</p>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Ledger lines, balances, and audit history</h1>
        {hasInvoiceFilter ? <p className="mt-0.5 text-xs font-semibold text-ink">Impact of Invoice {invoiceFilterNumber || `#${invoiceFilterId}`}</p> : null}
      </div>

      <div className="grid gap-2.5 md:grid-cols-3">
        {[
          ["Trial balance rows", String(snapshot.trialBalance.length), "Active account balances"],
          ["Total debits", `${currency(debitTotal)} SAR`, "Posted debit movement"],
          ["Total credits", `${currency(creditTotal)} SAR`, "Posted credit movement"],
        ].map(([title, value, caption]) => (
          <Card key={title} className="rounded-xl bg-white/95 p-3">
            <p className="text-xs font-semibold text-muted">{title}</p>
            <p className="mt-1 text-xl font-bold text-ink">{value}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted">{caption}</p>
          </Card>
        ))}
      </div>

      <Card className="rounded-xl bg-white/95 p-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-sm">
          <Input label="Search ledger" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by entry, account, document, or description" />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Button size="xs" variant="secondary" href={mapWorkspaceHref("/workspace/user/journal-entries", basePath)}>Open journals</Button>
          <Button size="xs" variant="secondary" href={mapWorkspaceHref("/workspace/user/reports/trial-balance", basePath)}>Open trial balance</Button>
        </div>
        </div>
      </Card>

      {entryFilter || accountFilter || documentFilter || hasInvoiceFilter ? (
        <Card className="rounded-xl border border-line bg-surface-soft/70 p-3">
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-ink">
            {entryFilter ? <span className="rounded-full border border-line bg-white px-2.5 py-1">Entry: {entryFilter.toUpperCase()}</span> : null}
            {accountFilter ? <span className="rounded-full border border-line bg-white px-2.5 py-1">Account: {accountFilter}</span> : null}
            {documentFilter ? <span className="rounded-full border border-line bg-white px-2.5 py-1">Document: {documentFilter.toUpperCase()}</span> : null}
            {hasInvoiceFilter ? <span className="rounded-full border border-line bg-white px-2.5 py-1">Impact: {invoiceFilterNumber || `#${invoiceFilterId}`}</span> : null}
          </div>
        </Card>
      ) : null}

      {!snapshot.backendReady && !loading && snapshot.generalLedger.length === 0 && snapshot.trialBalance.length === 0 && snapshot.auditTrail.length === 0 ? (
        <Card className="rounded-lg border border-line bg-surface-soft/60 p-3 text-sm text-muted">
          No posted accounting activity yet. This is a valid zero-state until journals, ledger lines, or trial balance rows are created.
        </Card>
      ) : null}

      <WorkspaceDataTable
        title="General ledger"
        caption="Posted journal lines in date order with running balance."
        rows={filteredLedger}
        emptyMessage="Posted journal lines will appear here as soon as invoices, vendor bills, or payments are finalized."
        columns={[
          { header: "Entry", render: (row) => row.entryNumber },
          { header: "Date", render: (row) => row.entryDate },
          { header: "Account", render: (row) => `${row.accountCode} ${row.accountName}` },
          { header: "Document", render: (row) => row.documentNumber || "-" },
          { header: "Cost center", render: (row) => row.costCenterCode ? `${row.costCenterCode} ${row.costCenterName}` : "-" },
          { header: "Description", render: (row) => row.description || row.documentNumber || "-" },
          { header: "Debit", align: "right", render: (row) => `${currency(row.debit)} SAR` },
          { header: "Credit", align: "right", render: (row) => `${currency(row.credit)} SAR` },
          { header: "Running", align: "right", render: (row) => `${currency(row.runningBalance)} SAR` },
        ]}
      />

      <div className="grid gap-2.5 xl:grid-cols-2">
        <WorkspaceDataTable
          title="Trial balance"
          caption="Account balances behind the current books."
          rows={filteredTrialBalance}
          emptyMessage="Trial balance rows will appear here after the first posted transaction."
          columns={[
            { header: "Code", render: (row) => row.code },
            { header: "Account", render: (row) => row.name },
            { header: "Type", render: (row) => row.type },
            { header: "Debit", align: "right", render: (row) => `${currency(row.debitTotal)} SAR` },
            { header: "Credit", align: "right", render: (row) => `${currency(row.creditTotal)} SAR` },
            { header: "Balance", align: "right", render: (row) => `${currency(row.balance)} SAR` },
          ]}
        />

        <WorkspaceDataTable
          title="Audit trail"
          caption="Recent finance events captured against company activity."
          rows={snapshot.auditTrail.slice(0, 20)}
          emptyMessage="Audit events will appear here once company activity is posted or changed."
          columns={[
            { header: "Event", render: (row) => row.event.replaceAll(".", " ") },
            { header: "Record", render: (row) => `${row.auditableType.split("\\").pop()} #${row.auditableId}` },
            { header: "When", render: (row) => row.createdAt },
          ]}
        />
      </div>
    </div>
  );
}