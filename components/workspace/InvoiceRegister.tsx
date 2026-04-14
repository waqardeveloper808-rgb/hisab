"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { currency } from "@/components/workflow/utils";
import { ImportExportControls } from "@/components/workspace/ImportExportControls";
import { InvoiceDetailWorkspace } from "@/components/workspace/InvoiceDetailWorkspace";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import type { ContactRecord, ItemRecord, TransactionLine } from "@/components/workflow/types";
import { createContactInBackend, createItemInBackend, duplicateDocument, finalizeTransactionDraft, getDocumentPdfUrl, getWorkspaceDirectory, listDocuments, saveTransactionDraft, sendDocument, type DocumentCenterRecord } from "@/lib/workspace-api";
import type { SpreadsheetRow } from "@/lib/spreadsheet";
import { mapWorkspaceHref } from "@/lib/workspace-path";

type InvoiceLifecycle = "draft" | "issued" | "reported" | "paid" | "overdue";

type RegisterNotice = {
  tone: "success" | "error";
  text: string;
};

function readRowValue(row: SpreadsheetRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return value ? value.slice(0, 10) : "-";
}

function isAuthorizationError(message: string | undefined) {
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

function SelectField({
  label,
  value,
  onChange,
  children,
  labelClassName,
  selectClassName,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  labelClassName?: string;
  selectClassName?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div>
      <label htmlFor={id} className={["mb-2 block text-sm font-semibold text-ink", labelClassName].filter(Boolean).join(" ")}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={["block w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10", selectClassName].filter(Boolean).join(" ")}>
        {children}
      </select>
    </div>
  );
}

export function InvoiceRegister() {
  const { basePath } = useWorkspacePath();
  const [invoices, setInvoices] = useState<DocumentCenterRecord[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authLimited, setAuthLimited] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [invoiceNumberQuery, setInvoiceNumberQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [mobilePane, setMobilePane] = useState<"register" | "preview">("register");
  const [reloadKey, setReloadKey] = useState(0);
  const [detailReloadKey, setDetailReloadKey] = useState(0);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [registerNotice, setRegisterNotice] = useState<RegisterNotice | null>(null);
  const deferredInvoiceNumberQuery = useDeferredValue(invoiceNumberQuery);

  const loadInvoices = useCallback(async () => {
    const nextInvoices = await listDocuments({
      group: "sales",
      type: "tax_invoice",
      search: deferredInvoiceNumberQuery.trim() || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      sort: "issue_date",
      direction: "desc",
    });

    setInvoices(nextInvoices);
    setSelectedInvoiceId((current) => current && nextInvoices.some((invoice) => invoice.id === current) ? current : nextInvoices[0]?.id ?? null);
  }, [deferredInvoiceNumberQuery, fromDate, toDate]);

  useEffect(() => {
    let active = true;

    loadInvoices()
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
        setSelectedInvoiceId(null);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [loadInvoices, reloadKey]);

  const customerOptions = useMemo(() => {
    return [...new Set(invoices.map((invoice) => invoice.contactName).filter(Boolean))].sort((left, right) => left.localeCompare(right));
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const normalizedStatus = normalizeInvoiceStatus(invoice);
      const issueDate = formatDate(invoice.issueDate);
      const matchesStatus = statusFilter === "all" ? true : normalizedStatus === statusFilter;
      const matchesCustomer = customerFilter === "all" ? true : invoice.contactName === customerFilter;
      const matchesFromDate = fromDate ? issueDate !== "-" && issueDate >= fromDate : true;
      const matchesToDate = toDate ? issueDate !== "-" && issueDate <= toDate : true;

      return matchesStatus && matchesCustomer && matchesFromDate && matchesToDate;
    });
  }, [customerFilter, fromDate, invoices, statusFilter, toDate]);

  const selectedInvoice = filteredInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null;
  const createInvoiceHref = mapWorkspaceHref("/workspace/invoices/new?documentType=tax_invoice", basePath);
  const totalVisibleAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0);
  const totalOpenBalance = filteredInvoices.reduce((sum, invoice) => sum + invoice.balanceDue, 0);
  const overdueCount = filteredInvoices.filter((invoice) => normalizeInvoiceStatus(invoice) === "overdue").length;

  const handleDocumentChanged = useCallback((nextDocument: DocumentCenterRecord) => {
    setInvoices((current) => current.map((invoice) => invoice.id === nextDocument.id ? { ...invoice, ...nextDocument } : invoice));
    setDetailReloadKey((current) => current + 1);
  }, []);

  const handleInvoiceSelection = useCallback((invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setMobilePane("preview");
  }, []);

  function startRemoteFilterUpdate() {
    setLoading(true);
    setError(null);
    setAuthLimited(false);
    setRegisterNotice(null);
  }

  const queueReload = useCallback(() => {
    startRemoteFilterUpdate();
    setReloadKey((current) => current + 1);
  }, []);

  function resetFilters() {
    queueReload();
    setInvoiceNumberQuery("");
    setStatusFilter("all");
    setCustomerFilter("all");
    setFromDate("");
    setToDate("");
  }

  async function runRegisterAction(action: "send" | "duplicate" | "issue" | "download" | "print") {
    if (!selectedInvoice) {
      return;
    }

    setRunningAction(action);
    setRegisterNotice(null);

    try {
      if (action === "send") {
        const updated = await sendDocument(selectedInvoice.id);
        setInvoices((current) => current.map((invoice) => invoice.id === updated.id ? updated : invoice));
        setRegisterNotice({ tone: "success", text: `${updated.number} sent successfully.` });
        setDetailReloadKey((current) => current + 1);
      }

      if (action === "duplicate") {
        const duplicated = await duplicateDocument(selectedInvoice.id);
        setInvoices((current) => [duplicated, ...current.filter((invoice) => invoice.id !== duplicated.id)]);
        setSelectedInvoiceId(duplicated.id);
        setMobilePane("preview");
        setRegisterNotice({ tone: "success", text: `${duplicated.number} duplicated as a new draft.` });
      }

      if (action === "issue") {
        await finalizeTransactionDraft("invoice", selectedInvoice.id);
        queueReload();
        setRegisterNotice({ tone: "success", text: `${selectedInvoice.number} issued successfully.` });
      }

      if (action === "download") {
        const anchor = document.createElement("a");
        anchor.href = getDocumentPdfUrl(selectedInvoice.id);
        anchor.download = `${selectedInvoice.number}.pdf`;
        anchor.click();
        setRegisterNotice({ tone: "success", text: `PDF download started for ${selectedInvoice.number}.` });
      }

      if (action === "print") {
        window.open(getDocumentPdfUrl(selectedInvoice.id), "_blank", "noopener,noreferrer");
        setRegisterNotice({ tone: "success", text: `Print preview opened for ${selectedInvoice.number}.` });
      }
    } catch (nextError) {
      setRegisterNotice({ tone: "error", text: nextError instanceof Error ? nextError.message : "Invoice action failed." });
    } finally {
      setRunningAction(null);
    }
  }

  const handleImportInvoices = useCallback(async ({ rows }: { rows: SpreadsheetRow[]; headers: string[]; fileName: string; file: File }) => {
    const errors: Array<{ rowNumber: number; field?: string; message: string }> = [];
    const groupedInvoices = new Map<string, {
      invoiceNumber: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      customerCity: string;
      issueDate: string;
      dueDate: string;
      notes: string;
      reference: string;
      customFields: Record<string, string | number | boolean | null>;
      lines: Array<{
        rowNumber: number;
        description: string;
        descriptionAr: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        itemName: string;
        sku: string;
      }>;
    }>();

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const invoiceNumber = readRowValue(row, ["invoice_number", "number", "reference"]);
      const customerName = readRowValue(row, ["customer_name", "buyer_name_en", "customer"]);
      const issueDate = readRowValue(row, ["issue_date"]);
      const dueDate = readRowValue(row, ["due_date"]);
      const description = readRowValue(row, ["line_description", "description", "item_name"]);
      const quantityRaw = readRowValue(row, ["quantity", "qty"]);
      const unitPriceRaw = readRowValue(row, ["unit_price", "price"]);
      const vatRateRaw = readRowValue(row, ["vat_rate", "vat_percent"]);
      const quantity = parsePositiveNumber(quantityRaw || "1");
      const unitPrice = parsePositiveNumber(unitPriceRaw || "0");
      const vatRate = parsePositiveNumber(vatRateRaw || "15");

      if (!invoiceNumber) errors.push({ rowNumber, field: "invoice_number", message: "Invoice number is required." });
      if (!customerName) errors.push({ rowNumber, field: "customer_name", message: "Customer name is required." });
      if (!issueDate || !isIsoDate(issueDate)) errors.push({ rowNumber, field: "issue_date", message: "Use YYYY-MM-DD for issue date." });
      if (!dueDate || !isIsoDate(dueDate)) errors.push({ rowNumber, field: "due_date", message: "Use YYYY-MM-DD for due date." });
      if (!description) errors.push({ rowNumber, field: "line_description", message: "Line description is required." });
      if (!Number.isFinite(quantity) || quantity <= 0) errors.push({ rowNumber, field: "quantity", message: "Quantity must be greater than zero." });
      if (!Number.isFinite(unitPrice) || unitPrice < 0) errors.push({ rowNumber, field: "unit_price", message: "Unit price must be zero or greater." });
      if (!Number.isFinite(vatRate) || vatRate < 0) errors.push({ rowNumber, field: "vat_rate", message: "VAT rate must be zero or greater." });

      if (!invoiceNumber || !customerName || !issueDate || !dueDate || !description || errors.some((item) => item.rowNumber === rowNumber)) {
        return;
      }

      const existing = groupedInvoices.get(invoiceNumber) ?? {
        invoiceNumber,
        customerName,
        customerEmail: readRowValue(row, ["customer_email", "buyer_email"]),
        customerPhone: readRowValue(row, ["customer_phone", "buyer_phone"]),
        customerCity: readRowValue(row, ["customer_city", "buyer_city"]),
        issueDate,
        dueDate,
        notes: readRowValue(row, ["notes"]),
        reference: readRowValue(row, ["reference"]) || invoiceNumber,
        customFields: {
          buyer_name_en: customerName,
          buyer_name_ar: readRowValue(row, ["buyer_name_ar", "customer_name_ar"]),
          buyer_vat_number: readRowValue(row, ["buyer_vat_number", "customer_vat_number"]),
          buyer_address_en: readRowValue(row, ["buyer_address_en", "customer_address_en"]),
          buyer_address_ar: readRowValue(row, ["buyer_address_ar", "customer_address_ar"]),
          supply_date: readRowValue(row, ["supply_date"]) || issueDate,
          currency: readRowValue(row, ["currency"]) || "SAR",
        },
        lines: [],
      };

      if (existing.customerName !== customerName) {
        errors.push({ rowNumber, field: "customer_name", message: `Invoice ${invoiceNumber} uses multiple customer names.` });
        return;
      }

      existing.lines.push({
        rowNumber,
        description,
        descriptionAr: readRowValue(row, ["line_description_ar", "description_ar"]),
        quantity,
        unitPrice,
        vatRate: Number.isFinite(vatRate) ? vatRate : 15,
        itemName: readRowValue(row, ["item_name", "description"]) || description,
        sku: readRowValue(row, ["sku", "item_code"]),
      });
      groupedInvoices.set(invoiceNumber, existing);
    });

    if (errors.length) {
      return {
        createdCount: 0,
        message: `Validation failed across ${errors.length} fields. Fix the spreadsheet and import again.`,
        errors,
      };
    }

    const directory = await getWorkspaceDirectory();
    const customerCache = new Map<string, ContactRecord>((directory?.customers ?? []).map((customer) => [customer.displayName.toLowerCase(), customer]));
    const itemCache = new Map<string, ItemRecord>((directory?.items ?? []).map((item) => [`${item.sku.toLowerCase()}::${item.name.toLowerCase()}`, item]));
    let createdCount = 0;

    for (const draft of groupedInvoices.values()) {
      let customer = customerCache.get(draft.customerName.toLowerCase()) ?? null;

      if (!customer) {
        customer = await createContactInBackend({
          kind: "customer",
          displayName: draft.customerName,
          email: draft.customerEmail,
          phone: draft.customerPhone,
          city: draft.customerCity,
        });
      }

      if (!customer?.backendId) {
        errors.push({ rowNumber: draft.lines[0]?.rowNumber ?? 1, field: "customer_name", message: `Customer ${draft.customerName} could not be created.` });
        continue;
      }

      customerCache.set(draft.customerName.toLowerCase(), customer);

      const transactionItems: ItemRecord[] = [];
      const transactionLines: TransactionLine[] = [];

      for (const line of draft.lines) {
        const itemKey = `${line.sku.toLowerCase()}::${line.itemName.toLowerCase()}`;
        let item = itemCache.get(itemKey) ?? null;

        if (!item) {
          item = await createItemInBackend({
            kind: "service",
            name: line.itemName,
            sku: line.sku,
            salePrice: line.unitPrice,
            purchasePrice: 0,
            taxLabel: `VAT ${line.vatRate}%`,
          });
        }

        if (!item?.backendId) {
          errors.push({ rowNumber: line.rowNumber, field: "item_name", message: `Line item ${line.itemName} could not be created.` });
          continue;
        }

        itemCache.set(itemKey, item);
        transactionItems.push(item);
        transactionLines.push({
          id: `import-line-${draft.invoiceNumber}-${line.rowNumber}`,
          itemId: item.id,
          backendItemId: item.backendId,
          description: line.description,
          quantity: line.quantity,
          price: line.unitPrice,
          costCenterId: null,
          customFields: {
            description_ar: line.descriptionAr || null,
            vat_rate: line.vatRate,
          },
        });
      }

      if (transactionLines.length !== draft.lines.length) {
        continue;
      }

      await saveTransactionDraft({
        kind: "invoice",
        documentType: "tax_invoice",
        title: `${draft.customerName} import`,
        templateId: null,
        costCenterId: null,
        languageCode: draft.customFields.buyer_name_ar ? "ar" : "en",
        customFields: {
          ...draft.customFields,
        },
        purchaseContext: { type: "", purpose: "", category: "" },
        contact: customer,
        reference: draft.reference,
        issueDate: draft.issueDate,
        dueDate: draft.dueDate,
        notes: draft.notes,
        lines: transactionLines,
        items: transactionItems,
      });
      createdCount += 1;
    }

    if (createdCount > 0) {
      queueReload();
    }

    return {
      createdCount,
      skippedCount: groupedInvoices.size - createdCount,
      message: errors.length
        ? `Imported ${createdCount} invoice drafts. ${errors.length} rows still need attention.`
        : `Imported ${createdCount} invoice drafts successfully.`,
      errors,
    };
  }, [queueReload]);

  return (
    <div className="space-y-1.5" data-inspector-split-view="true">
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
          <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[11px] text-ink">{filteredInvoices.length} invoices</span>
          <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[11px] text-ink">{currency(totalOpenBalance)} SAR open</span>
          <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[11px] text-ink">{overdueCount} overdue</span>
          {loading ? <span className="text-[11px] uppercase tracking-[0.12em] text-primary">Refreshing</span> : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="xs" variant="secondary" onClick={() => setFiltersOpen((current) => !current)}>{filtersOpen ? "Hide Filters" : "Filter"}</Button>
          <div className="flex rounded-lg border border-line bg-white p-0.5 lg:hidden">
            <button type="button" onClick={() => setMobilePane("register")} className={["rounded-md px-2.5 py-1 text-xs font-semibold", mobilePane === "register" ? "bg-primary-soft text-primary" : "text-muted"].join(" ")}>Register</button>
            <button type="button" onClick={() => setMobilePane("preview")} className={["rounded-md px-2.5 py-1 text-xs font-semibold", mobilePane === "preview" ? "bg-primary-soft text-primary" : "text-muted"].join(" ")} disabled={!selectedInvoice}>Preview</button>
          </div>
          <ImportExportControls
            label="invoices"
            exportFileName="invoices.csv"
            xlsxExportFileName="invoices.xlsx"
            rows={filteredInvoices}
            columns={[
              { label: "Number", value: (row) => row.number },
              { label: "Customer", value: (row) => row.contactName },
              { label: "Issue date", value: (row) => row.issueDate },
              { label: "Due date", value: (row) => row.dueDate },
              { label: "Status", value: (row) => normalizeInvoiceStatus(row) },
              { label: "Total", value: (row) => row.grandTotal },
              { label: "Balance", value: (row) => row.balanceDue },
            ]}
            onExportPdf={selectedInvoice ? () => runRegisterAction("download") : undefined}
            pdfExportLabel="PDF"
            importRules={[
              "Required columns: invoice_number, customer_name, issue_date, due_date, line_description, quantity, unit_price.",
              "Dates must use YYYY-MM-DD.",
              "Each row represents one line item; repeated invoice_number values are grouped into one draft invoice.",
              "Optional columns: line_description_ar, vat_rate, customer_email, customer_phone, customer_city, buyer_name_ar, customer_vat_number, customer_address_en, customer_address_ar, currency, supply_date, notes, sku, item_name.",
              "Imported invoices are created as drafts so they can be reviewed before issue or send.",
            ]}
            onImportFile={handleImportInvoices}
          />
          <Button size="xs" href={createInvoiceHref}>Create Invoice</Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Card className="rounded-xl bg-white/95 px-3 py-2.5"><p className="text-[11px] uppercase tracking-[0.08em] text-muted">Visible total</p><p className="mt-1 text-lg font-semibold text-ink">{currency(totalVisibleAmount)} SAR</p></Card>
        <Card className="rounded-xl bg-white/95 px-3 py-2.5"><p className="text-[11px] uppercase tracking-[0.08em] text-muted">Open balance</p><p className="mt-1 text-lg font-semibold text-ink">{currency(totalOpenBalance)} SAR</p></Card>
        <Card className="rounded-xl bg-white/95 px-3 py-2.5"><p className="text-[11px] uppercase tracking-[0.08em] text-muted">Selected</p><p className="mt-1 text-lg font-semibold text-ink">{selectedInvoice?.number ?? "No invoice"}</p></Card>
      </div>

      {registerNotice ? <div className={["rounded-lg px-3 py-2 text-sm", registerNotice.tone === "success" ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "border border-red-200 bg-red-50 text-red-700"].join(" ")}>{registerNotice.text}</div> : null}

      {selectedInvoice ? (
        <Card className="rounded-2xl bg-white/95 px-3 py-2.5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Action bar</p>
              <p className="mt-1 text-sm text-muted">{selectedInvoice.number} · {selectedInvoice.contactName || "No customer"} · {currency(selectedInvoice.balanceDue)} SAR open</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button size="xs" variant="secondary" href={mapWorkspaceHref(`/workspace/invoices/${selectedInvoice.id}?mode=edit`, basePath)}>Edit</Button>
              <Button size="xs" variant="secondary" onClick={() => void runRegisterAction("download")} disabled={runningAction !== null}>Download</Button>
              <Button size="xs" variant="secondary" onClick={() => void runRegisterAction("print")} disabled={runningAction !== null}>Print</Button>
              <Button size="xs" variant="secondary" onClick={() => void runRegisterAction("send")} disabled={runningAction !== null}>{runningAction === "send" ? "Sending" : "Send"}</Button>
              <Button size="xs" variant="secondary" onClick={() => void runRegisterAction("duplicate")} disabled={runningAction !== null}>{runningAction === "duplicate" ? "Duplicating" : "Duplicate"}</Button>
              {normalizeInvoiceStatus(selectedInvoice) === "draft" ? <Button size="xs" onClick={() => void runRegisterAction("issue")} disabled={runningAction !== null}>{runningAction === "issue" ? "Issuing" : "Issue"}</Button> : null}
            </div>
          </div>
        </Card>
      ) : null}

      {authLimited ? (
        <Card className="rounded-2xl bg-white/95 p-3 sm:p-3.5">
          <div className="flex items-center justify-between gap-4 text-sm">
            <p className="text-muted">Preview mode is limited. Sign in with workspace access to view invoice data.</p>
            <Button href="/login" variant="secondary">Sign in</Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden rounded-2xl bg-white/95 p-0">
          {filtersOpen ? (
            <div className="grid gap-1.5 border-b border-line px-2.5 py-2 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_auto]">
              <Input label="Invoice number" value={invoiceNumberQuery} onChange={(event) => {
                startRemoteFilterUpdate();
                setInvoiceNumberQuery(event.target.value);
              }} placeholder="Search by invoice number" labelClassName="mb-1.5 text-xs" inputClassName="rounded-xl px-3 py-2.5 text-sm" />
              <SelectField label="Customer" value={customerFilter} onChange={setCustomerFilter} labelClassName="mb-1.5 text-xs" selectClassName="rounded-xl py-2.5">
                <option value="all">All customers</option>
                {customerOptions.map((customer) => (
                  <option key={customer} value={customer}>{customer}</option>
                ))}
              </SelectField>
              <SelectField label="Status" value={statusFilter} onChange={setStatusFilter} labelClassName="mb-1.5 text-xs" selectClassName="rounded-xl py-2.5">
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="reported">Reported</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </SelectField>
              <Input label="From date" type="date" value={fromDate} onChange={(event) => {
                startRemoteFilterUpdate();
                setFromDate(event.target.value);
              }} labelClassName="mb-1.5 text-xs" inputClassName="rounded-xl px-3 py-2.5 text-sm" />
              <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto]">
                <Input label="To date" type="date" value={toDate} onChange={(event) => {
                  startRemoteFilterUpdate();
                  setToDate(event.target.value);
                }} labelClassName="mb-1.5 text-xs" inputClassName="rounded-xl px-3 py-2.5 text-sm" />
                <Button size="xs" variant="secondary" onClick={resetFilters}>Reset</Button>
              </div>
            </div>
          ) : null}

          {error ? <div className="mx-2.5 mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          <div className="grid gap-0 overflow-hidden lg:h-[calc(100vh-11.4rem)] lg:min-h-[33rem] lg:grid-cols-[minmax(0,1.42fr)_minmax(19rem,0.92fr)] xl:h-[calc(100vh-10.75rem)]" data-inspector-layout="invoice-workspace">
            <div className={["overflow-hidden border-b border-line lg:border-b-0 lg:border-r", mobilePane === "preview" ? "hidden lg:block" : "block"].join(" ")}>
              <div className="h-full overflow-auto">
                <table className="min-w-full text-sm" data-inspector-row-clickable="true">
                  <thead className="sticky top-0 z-10 border-b border-line bg-surface-soft/95 backdrop-blur">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Invoice</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Schedule</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Total</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Balance</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Status</th>
                  </tr>
                  </thead>
                  <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-3 py-4 text-sm text-muted" colSpan={5}>Loading invoices…</td>
                    </tr>
                  ) : filteredInvoices.length ? filteredInvoices.map((invoice) => {
                    const normalizedStatus = normalizeInvoiceStatus(invoice);
                    const isSelected = invoice.id === selectedInvoiceId;

                    return (
                      <tr key={invoice.id} className={["border-t border-line/70 align-top", isSelected ? "bg-primary-soft/20" : "hover:bg-surface-soft/40"].join(" ")}>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => handleInvoiceSelection(invoice.id)} className="w-full text-left" data-inspector-row-clickable="true">
                            <span className="block font-semibold text-ink hover:text-primary">{invoice.number}</span>
                            <span className="mt-0.5 block text-xs text-muted">{invoice.contactName || "No customer"} · {typeof invoice.customFields.reference === "string" ? invoice.customFields.reference : "Tax invoice"}</span>
                          </button>
                        </td>
                        <td className="px-3 py-2 text-xs leading-5 text-muted">
                          <span className="block">Issue {formatDate(invoice.issueDate)}</span>
                          <span className="block">Due {formatDate(invoice.dueDate)}</span>
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-semibold text-ink">{currency(invoice.grandTotal)} SAR</td>
                        <td className="px-3 py-2 text-right text-sm font-semibold text-ink">{currency(invoice.balanceDue)} SAR</td>
                        <td className="px-3 py-2">
                          <span className={["inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold", statusClasses(normalizedStatus)].join(" ")}>{statusLabel(normalizedStatus)}</span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td className="px-3 py-4 text-sm text-muted" colSpan={5}>{invoices.length === 0 ? "No invoices yet." : "No invoices match the current filters."}</td>
                    </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={["overflow-auto p-2 lg:block lg:p-2.5", mobilePane === "register" ? "hidden" : "block"].join(" ")}>
              <InvoiceDetailWorkspace
                documentId={selectedInvoice?.id ?? selectedInvoiceId}
                mode="panel"
                reloadKey={detailReloadKey}
                onDocumentChanged={handleDocumentChanged}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}