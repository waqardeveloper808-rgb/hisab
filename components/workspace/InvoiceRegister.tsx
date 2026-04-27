"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { currency } from "@/components/workflow/utils";
import { AuditTrailPanel } from "@/components/workspace/AuditTrailPanel";
import { DocumentLinkPreviewModal } from "@/components/workspace/DocumentLinkPreviewModal";
import { DocumentLinkTrigger } from "@/components/workspace/DocumentLinkTrigger";
import { ImportExportControls } from "@/components/workspace/ImportExportControls";
import { InvoiceDetailWorkspace } from "@/components/workspace/InvoiceDetailWorkspace";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import type { ContactRecord, ItemRecord, TransactionLine } from "@/components/workflow/types";
import {
  createContactInBackend,
  createItemInBackend,
  duplicateDocument,
  finalizeTransactionDraft,
  getDocument,
  getDocumentPdfUrl,
  getWorkspaceDirectory,
  listDocuments,
  recordDocumentPayment,
  saveTransactionDraft,
  sendDocument,
  type DocumentCenterRecord,
} from "@/lib/workspace-api";
import type { SpreadsheetRow } from "@/lib/spreadsheet";
import { mapWorkspaceHref } from "@/lib/workspace-path";

type InvoiceLifecycle = "draft" | "issued" | "reported" | "paid" | "overdue";

type RegisterNotice = {
  tone: "success" | "error";
  text: string;
};

type InvoiceSortField = "issue_date" | "grand_total";
type InvoiceSortOption = "latest" | "oldest" | "amount-high" | "amount-low";
type InvoiceColumnKey = "invoice" | "customer" | "date" | "status" | "total" | "balance";

type DocumentLinkSummary = {
  documentId?: number | null;
  documentNumber: string;
  documentType: string;
  status?: string | null;
};

function duplicateDocumentNumberKeys(records: DocumentCenterRecord[]): string[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = `${record.type}:${record.number}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key);
}

function documentTrackingLinks(document: DocumentCenterRecord): DocumentLinkSummary[] {
  return [
    document.customFields.linked_proforma_number ? {
      documentId: Number(document.customFields.linked_proforma_id ?? 0) || null,
      documentNumber: String(document.customFields.linked_proforma_number),
      documentType: "proforma_invoice",
      status: String(document.customFields.linked_proforma_status ?? "linked"),
    } : null,
    (document.customFields.delivery_note_number || document.customFields.linked_delivery_note_number) ? {
      documentId: Number(document.customFields.linked_delivery_note_id ?? 0) || null,
      documentNumber: String(document.customFields.delivery_note_number ?? document.customFields.linked_delivery_note_number),
      documentType: "delivery_note",
      status: String(document.customFields.linked_delivery_note_status ?? "linked"),
    } : null,
    document.customFields.linked_tax_invoice_number ? {
      documentId: Number(document.customFields.linked_tax_invoice_id ?? 0) || null,
      documentNumber: String(document.customFields.linked_tax_invoice_number),
      documentType: "tax_invoice",
      status: String(document.customFields.linked_tax_invoice_status ?? "linked"),
    } : null,
    document.customFields.linked_payment_number ? {
      documentId: null,
      documentNumber: String(document.customFields.linked_payment_number),
      documentType: "payment",
      status: String(document.customFields.payment_tracking_status ?? "linked"),
    } : null,
  ].filter(Boolean) as DocumentLinkSummary[];
}

function documentTrackingSummary(document: DocumentCenterRecord) {
  const links = documentTrackingLinks(document).map((link) => link.documentNumber);
  const paymentStatus = String(document.customFields.payment_status ?? document.customFields.payment_tracking_status ?? "").trim();
  return [paymentStatus, ...links].filter(Boolean).join(" -> ");
}

function readRowValue(row: SpreadsheetRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  const normalized = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().replace(/[\s_\-./]+/g, "_").trim(), v])
  );

  for (const key of keys) {
    const value = normalized[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function normalizeToIsoDate(value: string): string {
  if (isIsoDate(value)) return value;
  const slashParts = value.split("/");
  if (slashParts.length === 3) {
    const [a, b, c] = slashParts;
    if (c.length === 4 && Number(a) <= 31 && Number(b) <= 12) return `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
    if (a.length === 4) return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`;
  }
  return value;
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
      <label htmlFor={id} className={["mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-ink", labelClassName].filter(Boolean).join(" ")}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={["block h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10", selectClassName].filter(Boolean).join(" ")}>
        {children}
      </select>
    </div>
  );
}

export function InvoiceRegister() {
  const { basePath } = useWorkspacePath();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<DocumentCenterRecord[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);
  const [linkPreview, setLinkPreview] = useState<DocumentLinkSummary | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authLimited, setAuthLimited] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [invoiceNumberQuery, setInvoiceNumberQuery] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [vatFilter, setVatFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [mobilePane, setMobilePane] = useState<"register" | "preview">("register");
  const [reloadKey, setReloadKey] = useState(0);
  const [detailReloadKey, setDetailReloadKey] = useState(0);
  const [registerNotice, setRegisterNotice] = useState<RegisterNotice | null>(null);
  const [sortOption, setSortOption] = useState<InvoiceSortOption>("latest");
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<InvoiceColumnKey, boolean>>({
    invoice: true,
    customer: true,
    date: true,
    status: true,
    total: true,
    balance: true,
  });
  const [columnWidths, setColumnWidths] = useState<Record<InvoiceColumnKey, number>>({
    invoice: 220,
    customer: 180,
    date: 110,
    status: 110,
    total: 110,
    balance: 110,
  });
  const deferredInvoiceNumberQuery = useDeferredValue(invoiceNumberQuery);

  useEffect(() => {
    setInvoiceNumberQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const sortConfig = useMemo<{ sort: InvoiceSortField; direction: "asc" | "desc" }>(() => {
    switch (sortOption) {
      case "oldest":
        return { sort: "issue_date", direction: "asc" as const };
      case "amount-high":
        return { sort: "grand_total", direction: "desc" as const };
      case "amount-low":
        return { sort: "grand_total", direction: "asc" as const };
      default:
        return { sort: "issue_date", direction: "desc" as const };
    }
  }, [sortOption]);

  const loadInvoices = useCallback(async () => {
    const nextInvoices = await listDocuments({
      group: "sales",
      type: "tax_invoice",
      search: deferredInvoiceNumberQuery.trim() || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      sort: sortConfig.sort,
      direction: sortConfig.direction,
    });

    setInvoices(nextInvoices);
    setSelectedInvoiceId((current) => current && nextInvoices.some((invoice) => invoice.id === current) ? current : null);
    setSelectedInvoiceIds((current) => current.filter((id) => nextInvoices.some((invoice) => invoice.id === id)));
  }, [deferredInvoiceNumberQuery, fromDate, sortConfig.direction, sortConfig.sort, toDate]);

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
          setError(message);
        }

        setInvoices([]);
        setSelectedInvoiceId(null);
        setSelectedInvoiceIds([]);
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
      const minimumAmount = minAmount ? Number(minAmount) : null;
      const maximumAmount = maxAmount ? Number(maxAmount) : null;
      const matchesStatus = statusFilter === "all" ? true : normalizedStatus === statusFilter;
      const matchesCustomer = customerFilter === "all" ? true : invoice.contactName === customerFilter;
      const matchesAmountMin = minimumAmount === null || Number.isNaN(minimumAmount) ? true : invoice.grandTotal >= minimumAmount;
      const matchesAmountMax = maximumAmount === null || Number.isNaN(maximumAmount) ? true : invoice.grandTotal <= maximumAmount;
      const matchesVat = vatFilter === "all"
        ? true
        : vatFilter === "zero"
          ? invoice.taxTotal <= 0
          : invoice.taxTotal > 0;
      const matchesFromDate = fromDate ? issueDate !== "-" && issueDate >= fromDate : true;
      const matchesToDate = toDate ? issueDate !== "-" && issueDate <= toDate : true;

      return matchesStatus && matchesCustomer && matchesAmountMin && matchesAmountMax && matchesVat && matchesFromDate && matchesToDate;
    });
  }, [customerFilter, fromDate, invoices, maxAmount, minAmount, statusFilter, toDate, vatFilter]);

  const duplicateNumberKeys = useMemo(() => duplicateDocumentNumberKeys(invoices), [invoices]);

  const selectedInvoice = filteredInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null;
  const selectedInvoices = invoices.filter((invoice) => selectedInvoiceIds.includes(invoice.id));
  const actionableInvoices = selectedInvoiceIds.length ? selectedInvoices : selectedInvoice ? [selectedInvoice] : [];
  const createInvoiceHref = mapWorkspaceHref("/workspace/invoices/new?documentType=tax_invoice", basePath);
  const overdueCount = filteredInvoices.filter((invoice) => normalizeInvoiceStatus(invoice) === "overdue").length;

  const activeFilterCount = [
    statusFilter !== "all",
    customerFilter !== "all",
    vatFilter !== "all",
    Boolean(fromDate),
    Boolean(toDate),
    Boolean(minAmount),
    Boolean(maxAmount),
  ].filter(Boolean).length;

  const handleDocumentChanged = useCallback((nextDocument: DocumentCenterRecord) => {
    setInvoices((current) => current.map((invoice) => invoice.id === nextDocument.id ? { ...invoice, ...nextDocument } : invoice));
    setDetailReloadKey((current) => current + 1);
  }, []);

  const handleInvoiceSelection = useCallback((invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setHistoryOpen(false);
    setMobilePane("preview");
  }, []);

  const openInvoiceWorkspace = useCallback((invoiceId: number, mode: "view" | "edit" = "view") => {
    router.push(mapWorkspaceHref(`/workspace/invoices/${invoiceId}${mode === "edit" ? "?mode=edit" : ""}`, basePath));
  }, [basePath, router]);

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
    setVatFilter("all");
    setMinAmount("");
    setMaxAmount("");
    setFromDate("");
    setToDate("");
  }

  function toggleInvoiceSelection(invoiceId: number, checked: boolean) {
    setSelectedInvoiceIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(invoiceId);
      } else {
        next.delete(invoiceId);
      }

      return Array.from(next);
    });
  }

  function toggleSelectAllVisible(checked: boolean) {
    setSelectedInvoiceIds((current) => {
      const next = new Set(current);

      if (checked) {
        filteredInvoices.forEach((invoice) => next.add(invoice.id));
      } else {
        filteredInvoices.forEach((invoice) => next.delete(invoice.id));
      }

      return Array.from(next);
    });
  }

  async function runRegisterAction(action: "send" | "duplicate" | "issue" | "download" | "print" | "mark-paid", targetInvoices = actionableInvoices) {
    if (!targetInvoices.length) {
      return;
    }

    setRegisterNotice(null);

    try {
      if (action === "send") {
        const updatedDocuments = await Promise.all(targetInvoices.map((invoice) => sendDocument(invoice.id)));
        setInvoices((current) => current.map((invoice) => updatedDocuments.find((updated) => updated.id === invoice.id) ?? invoice));
        setRegisterNotice({ tone: "success", text: `${updatedDocuments.length} invoice${updatedDocuments.length === 1 ? "" : "s"} sent successfully.` });
        setDetailReloadKey((current) => current + 1);
      }

      if (action === "duplicate") {
        const primaryInvoice = targetInvoices[0];

        if (!primaryInvoice) {
          return;
        }

        const duplicated = await duplicateDocument(primaryInvoice.id);
        const duplicatedDetail = await getDocument(duplicated.id);
        setInvoices((current) => [duplicatedDetail, ...current.filter((invoice) => invoice.id !== duplicatedDetail.id)]);
        setSelectedInvoiceId(duplicatedDetail.id);
        setMobilePane("preview");
        setRegisterNotice({ tone: "success", text: `${duplicatedDetail.number} duplicated as a new draft.` });
      }

      if (action === "issue") {
        const draftInvoices = targetInvoices.filter((invoice) => normalizeInvoiceStatus(invoice) === "draft");

        await Promise.all(draftInvoices.map((invoice) => finalizeTransactionDraft("invoice", invoice.id)));
        queueReload();
        setRegisterNotice({ tone: "success", text: `${draftInvoices.length} draft invoice${draftInvoices.length === 1 ? "" : "s"} issued successfully.` });
      }

      if (action === "download") {
        targetInvoices.forEach((invoice) => {
          const anchor = document.createElement("a");
          anchor.href = getDocumentPdfUrl(invoice.id);
          anchor.download = `${invoice.number}.pdf`;
          anchor.click();
        });
        setRegisterNotice({ tone: "success", text: `PDF download started for ${targetInvoices.length} invoice${targetInvoices.length === 1 ? "" : "s"}.` });
      }

      if (action === "print") {
        targetInvoices.forEach((invoice) => {
          window.open(getDocumentPdfUrl(invoice.id), "_blank", "noopener,noreferrer");
        });
        setRegisterNotice({ tone: "success", text: `Print preview opened for ${targetInvoices.length} invoice${targetInvoices.length === 1 ? "" : "s"}.` });
      }

      if (action === "mark-paid") {
        const payableInvoices = targetInvoices.filter((invoice) => invoice.balanceDue > 0 && normalizeInvoiceStatus(invoice) !== "draft");

        if (!payableInvoices.length) {
          setRegisterNotice({ tone: "success", text: "No selected invoices were eligible for payment posting." });
        } else {
          await Promise.all(payableInvoices.map((invoice) => recordDocumentPayment({
            direction: "incoming",
            documentId: invoice.id,
            amount: invoice.balanceDue,
            paymentDate: today(),
            method: "bank_transfer",
            reference: `register-${invoice.number}`,
          })));
          queueReload();
          setRegisterNotice({ tone: "success", text: `${payableInvoices.length} invoice${payableInvoices.length === 1 ? "" : "s"} marked paid.` });
        }
      }
    } catch (nextError) {
      setRegisterNotice({ tone: "error", text: nextError instanceof Error ? nextError.message : "Invoice action failed." });
    } finally {
      // Register actions resolve through notices and row/detail refresh.
    }
  }

  const handleImportInvoices = useCallback(async ({ mappedRows }: { rows: SpreadsheetRow[]; mappedRows: SpreadsheetRow[]; headers: string[]; fileName: string; file: File; mapping: Record<string, string> }) => {
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
        category: string;
      }>;
    }>();

    mappedRows.forEach((row, index) => {
      const rowNumber = index + 2;
      const invoiceNumber = readRowValue(row, ["invoice_number", "number", "reference", "inv_no", "invoice_no", "doc_number", "document_number"]);
      const customerName = readRowValue(row, ["customer_name", "buyer_name_en", "customer", "buyer", "company", "contact", "client", "client_name", "sold_to"]);
      const issueDate = normalizeToIsoDate(readRowValue(row, ["issue_date", "date", "invoice_date", "doc_date"]));
      const dueDate = normalizeToIsoDate(readRowValue(row, ["due_date", "payment_due", "due"]));
      const description = readRowValue(row, ["line_description", "description", "item_name", "product", "service", "item", "line_item"]);
      const quantityRaw = readRowValue(row, ["quantity", "qty", "units", "count"]);
      const unitPriceRaw = readRowValue(row, ["unit_price", "price", "rate", "unit_amount", "amount"]);
      const vatRateRaw = readRowValue(row, ["vat_rate", "vat_percent", "tax_rate", "tax", "vat"]);
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
        category: readRowValue(row, ["item_category", "category"]),
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
            category: line.category,
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
            item_code: line.sku || null,
            item_category: line.category || null,
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

  const viewMode: "register" | "split" = selectedInvoice ? "split" : "register";
  const activeColumns = (Object.entries(visibleColumns) as Array<[InvoiceColumnKey, boolean]>)
    .filter(([, visible]) => visible)
    .map(([key]) => key);

  function toggleColumn(key: InvoiceColumnKey) {
    setVisibleColumns((current) => {
      const nextVisible = !current[key];
      const visibleCount = Object.values(current).filter(Boolean).length;
      if (!nextVisible && visibleCount <= 2) {
        return current;
      }
      return { ...current, [key]: nextVisible };
    });
  }

  function startResize(key: InvoiceColumnKey, startX: number) {
    const initialWidth = columnWidths[key];
    const handleMove = (event: MouseEvent) => {
      const nextWidth = Math.max(84, initialWidth + event.clientX - startX);
      setColumnWidths((current) => ({ ...current, [key]: nextWidth }));
    };
    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }

  return (
    <div className="space-y-1" data-inspector-split-view="true">
      {/* Compact toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-semibold text-ink">Tax Invoices</h1>
          <span className="inline-flex h-5 items-center rounded bg-surface-soft px-1.5 text-[10px] font-semibold text-muted">{filteredInvoices.length}</span>
          {overdueCount > 0 ? <span className="inline-flex h-5 items-center rounded bg-rose-50 px-1.5 text-[10px] font-semibold text-rose-700">{overdueCount} overdue</span> : null}
          {selectedInvoiceIds.length > 0 ? <span className="inline-flex h-5 items-center rounded bg-primary-soft px-1.5 text-[10px] font-semibold text-primary">{selectedInvoiceIds.length} sel</span> : null}
          {loading ? <span className="text-[10px] text-primary">Refreshing…</span> : null}
        </div>
        <div className="flex items-center gap-1.5">
          <Input label="Search" value={invoiceNumberQuery} onChange={(event) => { startRemoteFilterUpdate(); setInvoiceNumberQuery(event.target.value); }} placeholder="Search…" className="hidden w-40 lg:block" labelClassName="sr-only mb-0" inputClassName="h-7 rounded-md text-xs px-2" />
          <SelectField label="Sort" value={sortOption} onChange={(value) => setSortOption(value as InvoiceSortOption)} labelClassName="sr-only mb-0" selectClassName="h-7 min-w-[7rem] rounded-md text-xs px-1.5">
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="amount-high">Amount ↑</option>
            <option value="amount-low">Amount ↓</option>
          </SelectField>
          <button type="button" onClick={() => setFiltersOpen((c) => !c)} className={["h-7 rounded-md border px-2 text-[11px] font-semibold", filtersOpen ? "border-primary bg-primary-soft text-primary" : "border-line bg-white text-muted hover:text-ink"].join(" ")}>
            {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : "Filter"}
          </button>
          <div className="relative">
            <button type="button" onClick={() => setColumnMenuOpen((current) => !current)} className={["h-7 rounded-md border px-2 text-[11px] font-semibold", columnMenuOpen ? "border-primary bg-primary-soft text-primary" : "border-line bg-white text-muted hover:text-ink"].join(" ")}>
              Columns
            </button>
            {columnMenuOpen ? (
              <div className="absolute right-0 top-8 z-20 min-w-[12rem] rounded-lg border border-line bg-white p-2 shadow-[0_20px_40px_-28px_rgba(17,32,24,0.22)]">
                {([
                  ["invoice", "Invoice"],
                  ["customer", "Customer"],
                  ["date", "Issue date"],
                  ["status", "Status"],
                  ["total", "Total"],
                  ["balance", "Balance"],
                ] as Array<[InvoiceColumnKey, string]>).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-[11px] text-ink hover:bg-surface-soft">
                    <span>{label}</span>
                    <input type="checkbox" checked={visibleColumns[key]} onChange={() => toggleColumn(key)} />
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          {viewMode === "split" ? (
            <button type="button" onClick={() => { setSelectedInvoiceId(null); setMobilePane("register"); }} className="h-7 rounded-md border border-line bg-white px-2 text-[11px] font-semibold text-muted hover:text-ink">Close preview</button>
          ) : null}
          <div className="flex rounded-md border border-line bg-white p-0.5 lg:hidden">
            <button type="button" onClick={() => setMobilePane("register")} className={["rounded px-2 py-0.5 text-[10px] font-semibold", mobilePane === "register" ? "bg-primary-soft text-primary" : "text-muted"].join(" ")}>List</button>
            <button type="button" onClick={() => setMobilePane("preview")} className={["rounded px-2 py-0.5 text-[10px] font-semibold", mobilePane === "preview" ? "bg-primary-soft text-primary" : "text-muted"].join(" ")} disabled={!selectedInvoice}>Preview</button>
          </div>
          <Button size="xs" href={createInvoiceHref}>+ Invoice</Button>
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
              { label: "VAT", value: (row) => row.taxTotal },
              { label: "Total", value: (row) => row.grandTotal },
              { label: "Balance", value: (row) => row.balanceDue },
            ]}
            onExportPdf={selectedInvoice ? () => void runRegisterAction("download", [selectedInvoice]) : undefined}
            pdfExportLabel="PDF"
            importMappingFields={[
              { key: "invoice_number", label: "Invoice number", required: true, aliases: ["number", "reference", "invoice no", "inv no", "inv number", "invoice_no", "doc number", "document number"] },
              { key: "customer_name", label: "Customer name", required: true, aliases: ["buyer_name_en", "customer", "contact", "contact name", "company", "client", "buyer"] },
              { key: "issue_date", label: "Issue date", required: true, aliases: ["date", "invoice date", "created", "invoice_date"] },
              { key: "due_date", label: "Due date", required: true, aliases: ["due", "payment due", "due_on", "payment_due"] },
              { key: "line_description", label: "Line description", required: true, aliases: ["description", "item_name", "item", "product", "service", "line item"] },
              { key: "quantity", label: "Quantity", required: true, aliases: ["qty", "units", "count"] },
              { key: "unit_price", label: "Unit price", required: true, aliases: ["price", "rate", "amount", "price per unit"] },
              { key: "vat_rate", label: "VAT rate", aliases: ["vat_percent", "tax rate", "vat", "tax", "vat %", "tax_rate"] },
              { key: "customer_email", label: "Customer email", aliases: ["buyer_email", "email", "contact_email"] },
              { key: "customer_phone", label: "Customer phone", aliases: ["buyer_phone", "phone", "contact_phone", "mobile"] },
              { key: "customer_city", label: "Customer city", aliases: ["buyer_city", "city"] },
              { key: "buyer_name_ar", label: "Customer name AR", aliases: ["customer_name_ar", "name_ar", "arabic name"] },
              { key: "item_code", label: "Item code", aliases: ["sku", "code", "product_code"] },
              { key: "item_category", label: "Item category", aliases: ["category", "type", "product_type"] },
            ]}
            importRules={[
              "Required columns: invoice_number, customer_name, issue_date, due_date, line_description, quantity, unit_price.",
              "Dates must use YYYY-MM-DD.",
              "Each row represents one line item; repeated invoice_number values are grouped into one draft invoice.",
              "Optional columns: line_description_ar, vat_rate, customer_email, customer_phone, customer_city, buyer_name_ar, customer_vat_number, customer_address_en, customer_address_ar, currency, supply_date, notes, sku, item_name, item_category.",
              "Imported invoices are created as drafts so they can be reviewed before issue or send.",
            ]}
            onImportFile={handleImportInvoices}
          />
        </div>
      </div>

      {registerNotice ? <div className={["rounded-md px-2.5 py-1.5 text-xs", registerNotice.tone === "success" ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "border border-red-200 bg-red-50 text-red-700"].join(" ")}>{registerNotice.text}</div> : null}

      {duplicateNumberKeys.length > 0 ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-950" role="alert">
          Data integrity: duplicate document numbers in this register ({duplicateNumberKeys.length} key{duplicateNumberKeys.length === 1 ? "" : "s"}).
          {" "}
          <span className="font-mono text-[11px]">{duplicateNumberKeys.slice(0, 8).join(", ")}{duplicateNumberKeys.length > 8 ? "…" : ""}</span>
          {" "}
          — all matching rows are shown; resolve duplicates in the backend or renumber documents.
        </div>
      ) : null}

      {authLimited ? (
        <div className="rounded-lg border border-line bg-white p-2.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">Preview mode limited. Sign in for invoice data.</p>
            <Button href="/login" variant="secondary" size="xs">Sign in</Button>
          </div>
        </div>
      ) : (
        <>
          {/* Collapsible filter panel — above register only */}
          {filtersOpen ? (
            <div className="rounded-lg border border-line bg-white p-2">
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-6">
                <Input label="Number" value={invoiceNumberQuery} onChange={(e) => { startRemoteFilterUpdate(); setInvoiceNumberQuery(e.target.value); }} placeholder="Invoice #" labelClassName="mb-0.5 text-[9px]" inputClassName="h-7 rounded-md px-2 text-xs" />
                <SelectField label="Customer" value={customerFilter} onChange={setCustomerFilter} labelClassName="mb-0.5 text-[9px]" selectClassName="h-7 rounded-md text-xs">
                  <option value="all">All customers</option>
                  {customerOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </SelectField>
                <SelectField label="Status" value={statusFilter} onChange={setStatusFilter} labelClassName="mb-0.5 text-[9px]" selectClassName="h-7 rounded-md text-xs">
                  <option value="all">All</option>
                  <option value="draft">Draft</option>
                  <option value="issued">Issued</option>
                  <option value="reported">Reported</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </SelectField>
                <SelectField label="VAT" value={vatFilter} onChange={setVatFilter} labelClassName="mb-0.5 text-[9px]" selectClassName="h-7 rounded-md text-xs">
                  <option value="all">All</option>
                  <option value="taxed">Taxed</option>
                  <option value="zero">Zero</option>
                </SelectField>
                <Input label="From" type="date" value={fromDate} onChange={(e) => { startRemoteFilterUpdate(); setFromDate(e.target.value); }} labelClassName="mb-0.5 text-[9px]" inputClassName="h-7 rounded-md px-2 text-xs" />
                <div className="flex items-end gap-1">
                  <Input label="To" type="date" value={toDate} onChange={(e) => { startRemoteFilterUpdate(); setToDate(e.target.value); }} labelClassName="mb-0.5 text-[9px]" inputClassName="h-7 rounded-md px-2 text-xs" className="flex-1" />
                  <button type="button" onClick={resetFilters} className="h-7 rounded-md border border-line bg-white px-2 text-[10px] font-semibold text-muted hover:text-ink">Reset</button>
                </div>
              </div>
              <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                <Input label="Min amount" type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} labelClassName="mb-0.5 text-[9px]" inputClassName="h-7 rounded-md px-2 text-xs" />
                <Input label="Max amount" type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} labelClassName="mb-0.5 text-[9px]" inputClassName="h-7 rounded-md px-2 text-xs" />
              </div>
            </div>
          ) : null}

          {error ? <div className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{error}</div> : null}

          {/* Compact action bar when a document is selected */}
          {selectedInvoice && viewMode === "split" ? (
            <div className="flex items-center gap-1.5 rounded-md border border-line bg-white px-2 py-1">
              <span className={["inline-flex h-5 items-center rounded border px-1.5 text-[9px] font-bold uppercase tracking-wider", statusClasses(normalizeInvoiceStatus(selectedInvoice))].join(" ")}>{statusLabel(normalizeInvoiceStatus(selectedInvoice))}</span>
              <span className="text-xs font-semibold text-ink">{selectedInvoice.number}</span>
              <span className="text-[11px] text-muted">{selectedInvoice.contactName}</span>
              <span className="text-xs font-bold text-ink ml-auto">{currency(selectedInvoice.grandTotal)} SAR</span>
              <span className="mx-1 h-4 w-px bg-line" />
              <button type="button" onClick={() => openInvoiceWorkspace(selectedInvoice.id, "edit")} className="h-6 rounded border border-line bg-white px-2 text-[10px] font-semibold text-ink hover:bg-surface-soft">Edit</button>
              <button type="button" onClick={() => void runRegisterAction("download", [selectedInvoice])} className="h-6 rounded border border-line bg-white px-2 text-[10px] font-semibold text-ink hover:bg-surface-soft">Download</button>
              <button type="button" onClick={() => void runRegisterAction("print", [selectedInvoice])} className="h-6 rounded border border-line bg-white px-2 text-[10px] font-semibold text-ink hover:bg-surface-soft">Print</button>
              <button type="button" onClick={() => void runRegisterAction("send", [selectedInvoice])} className="h-6 rounded border border-line bg-white px-2 text-[10px] font-semibold text-ink hover:bg-surface-soft">Send</button>
              <button type="button" onClick={() => void runRegisterAction("duplicate", [selectedInvoice])} className="h-6 rounded border border-line bg-white px-2 text-[10px] font-semibold text-ink hover:bg-surface-soft">Duplicate</button>
              {normalizeInvoiceStatus(selectedInvoice) !== "paid" && normalizeInvoiceStatus(selectedInvoice) !== "draft" ? (
                <button type="button" onClick={() => void runRegisterAction("mark-paid", [selectedInvoice])} className="h-6 rounded border border-primary/30 bg-primary-soft px-2 text-[10px] font-semibold text-primary hover:bg-primary/10">Record Payment</button>
              ) : null}
            </div>
          ) : null}

          {/* Bulk action bar for multi-select */}
          {selectedInvoiceIds.length > 1 ? (
            <div className="flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary-soft/30 px-2 py-1">
              <span className="text-[10px] font-semibold text-primary">{selectedInvoiceIds.length} selected</span>
              <span className="mx-1 h-4 w-px bg-primary/20" />
              <button type="button" onClick={() => void runRegisterAction("send")} className="h-6 rounded border border-primary/20 bg-white px-2 text-[10px] font-semibold text-ink hover:bg-primary-soft">Send All</button>
              <button type="button" onClick={() => void runRegisterAction("issue")} className="h-6 rounded border border-primary/20 bg-white px-2 text-[10px] font-semibold text-ink hover:bg-primary-soft">Issue Drafts</button>
              <button type="button" onClick={() => void runRegisterAction("download")} className="h-6 rounded border border-primary/20 bg-white px-2 text-[10px] font-semibold text-ink hover:bg-primary-soft">Download</button>
              <button type="button" onClick={() => void runRegisterAction("mark-paid")} className="h-6 rounded border border-primary/20 bg-white px-2 text-[10px] font-semibold text-ink hover:bg-primary-soft">Mark Paid</button>
            </div>
          ) : null}

          {/* Main content: register only or register+preview split */}
          <div className={[
            "overflow-hidden rounded-lg border border-line bg-white",
            viewMode === "split"
              ? historyOpen
                ? "grid lg:h-[calc(100vh-11rem)] lg:min-h-[28rem] lg:grid-cols-[minmax(22rem,35%)_minmax(0,40%)_minmax(18rem,25%)]"
                : "grid lg:h-[calc(100vh-11rem)] lg:min-h-[28rem] lg:grid-cols-[minmax(22rem,40%)_minmax(0,60%)] xl:grid-cols-[minmax(24rem,38%)_minmax(0,62%)]"
              : "lg:h-[calc(100vh-9rem)] lg:min-h-[28rem]",
          ].join(" ")} data-inspector-layout="invoice-workspace">
            {/* Register pane */}
            <div className={["overflow-hidden", viewMode === "split" ? "border-r border-line" : "", mobilePane === "preview" ? "hidden lg:block" : "block"].join(" ")}>
              <div className="h-full overflow-auto">
                <table className="min-w-full table-fixed border-separate border-spacing-0 text-xs">
                  <colgroup>
                    <col style={{ width: 40 }} />
                    {activeColumns.map((column) => <col key={column} style={{ width: columnWidths[column] }} />)}
                  </colgroup>
                  <thead className="sticky top-0 z-10 bg-surface-soft/95 backdrop-blur">
                    <tr className="border-b border-line">
                      <th className="border-b border-line px-2 py-2 text-left">
                        <input type="checkbox" checked={filteredInvoices.length > 0 && filteredInvoices.every((inv) => selectedInvoiceIds.includes(inv.id))} onChange={(e) => toggleSelectAllVisible(e.target.checked)} aria-label="Select all" className="mt-0.5" />
                      </th>
                      {activeColumns.map((column) => (
                        <th key={column} className="group relative border-b border-line px-2 py-2 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              className="truncate text-left"
                              onClick={() => {
                                if (column === "date") setSortOption((current) => current === "oldest" ? "latest" : "oldest");
                                if (column === "total") setSortOption((current) => current === "amount-low" ? "amount-high" : "amount-low");
                              }}
                            >
                              {{
                                invoice: "Invoice",
                                customer: "Customer",
                                date: "Issue date",
                                status: "Status",
                                total: "Total",
                                balance: "Balance",
                              }[column]}
                            </button>
                            <span
                              role="separator"
                              aria-orientation="vertical"
                              onMouseDown={(event) => startResize(column, event.clientX)}
                              className="absolute right-0 top-1/2 h-5 w-2 -translate-y-1/2 cursor-col-resize rounded bg-transparent transition group-hover:bg-primary/10"
                            />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={activeColumns.length + 1} className="px-3 py-3 text-xs text-muted">Loading…</td></tr>
                    ) : null}
                    {!loading && filteredInvoices.length > 0 ? filteredInvoices.map((invoice) => {
                      const normalizedStatus = normalizeInvoiceStatus(invoice);
                      const isSelected = invoice.id === selectedInvoiceId;
                      const isChecked = selectedInvoiceIds.includes(invoice.id);
                      return (
                        <tr key={invoice.id} data-inspector-register-row="true" className={[isSelected ? "bg-primary-soft/30" : "hover:bg-surface-soft/40", "cursor-pointer"].join(" ")}>
                          <td className="border-b border-line/60 px-2 py-2 align-top">
                            <input type="checkbox" checked={isChecked} onChange={(e) => toggleInvoiceSelection(invoice.id, e.target.checked)} aria-label={`Select ${invoice.number}`} />
                          </td>
                          {activeColumns.map((column) => (
                            <td
                              key={column}
                              className="border-b border-line/60 px-2 py-2 align-top"
                              onClick={() => handleInvoiceSelection(invoice.id)}
                              onDoubleClick={() => openInvoiceWorkspace(invoice.id)}
                            >
                              {column === "invoice" ? (
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate text-xs font-semibold text-ink">{invoice.number}</span>
                                  </div>
                                  {documentTrackingSummary(invoice) ? <div className="mt-0.5 truncate text-[10px] text-muted">{documentTrackingSummary(invoice)}</div> : null}
                                  {documentTrackingLinks(invoice).length ? (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {documentTrackingLinks(invoice).map((link) => (
                                        <DocumentLinkTrigger key={`${invoice.id}-${link.documentType}-${link.documentNumber}`} link={link} onPreview={setLinkPreview} className="text-[10px] text-primary underline-offset-2 hover:underline" />
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                              {column === "customer" ? <span className="block truncate text-[11px] text-muted">{invoice.contactName || "—"}</span> : null}
                              {column === "date" ? <span className="text-[11px] text-muted">{formatDate(invoice.issueDate)}</span> : null}
                              {column === "status" ? <span className={["inline-flex h-5 items-center rounded border px-1.5 text-[9px] font-bold uppercase tracking-wider", statusClasses(normalizedStatus)].join(" ")}>{statusLabel(normalizedStatus)}</span> : null}
                              {column === "total" ? <span className="block text-right text-xs font-semibold text-ink">{currency(invoice.grandTotal)}</span> : null}
                              {column === "balance" ? <span className={["block text-right text-xs font-semibold", invoice.balanceDue > 0 ? "text-amber-700" : "text-emerald-700"].join(" ")}>{currency(invoice.balanceDue)}</span> : null}
                            </td>
                          ))}
                        </tr>
                      );
                    }) : null}
                    {!loading && filteredInvoices.length === 0 ? (
                      <tr><td colSpan={activeColumns.length + 1} className="px-3 py-3 text-xs text-muted">{invoices.length === 0 ? "No invoices yet." : "No match."}</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Preview pane — only rendered when a document is selected */}
            {viewMode === "split" ? (
              <div className={["overflow-auto p-1.5 transition-all duration-300 ease-out lg:block lg:p-2", mobilePane === "register" ? "hidden" : "block"].join(" ")}>
                <InvoiceDetailWorkspace
                  documentId={selectedInvoice?.id ?? selectedInvoiceId}
                  mode="panel"
                  reloadKey={detailReloadKey}
                  onDocumentChanged={handleDocumentChanged}
                  showHistoryPanel={historyOpen}
                  onToggleHistoryPanel={() => setHistoryOpen((current) => !current)}
                  onClosePreview={() => { setSelectedInvoiceId(null); setMobilePane("register"); }}
                />
              </div>
            ) : null}
            {viewMode === "split" && historyOpen && selectedInvoice ? (
              <div className="hidden border-l border-line bg-surface-soft/35 p-2 lg:block">
                <div className="h-full overflow-auto rounded-xl border border-line bg-white p-3">
                  <div className="mb-3 flex items-center justify-between gap-2 border-b border-line pb-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">History</p>
                      <p className="text-sm font-semibold text-ink">{selectedInvoice.number}</p>
                    </div>
                    <button type="button" onClick={() => setHistoryOpen(false)} className="rounded-full border border-line px-2 py-1 text-[11px] font-semibold text-muted hover:text-ink">Close</button>
                  </div>
                  <AuditTrailPanel documentId={selectedInvoice.id} documentType={selectedInvoice.type} documentStatus={selectedInvoice.status} />
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}
      <DocumentLinkPreviewModal link={linkPreview} onClose={() => setLinkPreview(null)} />
    </div>
  );
}