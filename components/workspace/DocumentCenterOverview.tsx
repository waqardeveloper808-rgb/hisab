"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { currency } from "@/components/workflow/utils";
import { ImportExportControls } from "@/components/workspace/ImportExportControls";
import { DocumentLinkPreviewModal } from "@/components/workspace/DocumentLinkPreviewModal";
import { DocumentLinkTrigger } from "@/components/workspace/DocumentLinkTrigger";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import {
  createContactInBackend,
  createItemInBackend,
  duplicateDocument,
  finalizeTransactionDraft,
  getDocument,
  getDocumentPdfUrl,
  getDocumentPreview,
  getWorkspaceDirectory,
  listDocuments,
  recordDocumentPayment,
  saveTransactionDraft,
  type DocumentCenterRecord,
  type DocumentDetailRecord,
  type ContactRecord,
  type ItemRecord,
} from "@/lib/workspace-api";
import { mapWorkspaceHref } from "@/lib/workspace-path";
import type { SpreadsheetRow } from "@/lib/spreadsheet";

type DocumentCenterOverviewProps = {
  group: "sales" | "purchase";
  titleOverride?: string;
  eyebrowOverride?: string;
  descriptionOverride?: string;
  createLabelOverride?: string;
  emptyMessageOverride?: string;
  initialType?: string;
  createHrefOverride?: string;
};

const configByGroup = {
  sales: {
    eyebrow: "Sales",
    title: "Sales register",
    createLabel: "Create sales document",
    typeOptions: ["quotation", "proforma_invoice", "delivery_note", "tax_invoice", "cash_invoice", "recurring_invoice", "credit_note", "debit_note", "api_invoice"],
  },
  purchase: {
    eyebrow: "Purchases",
    title: "Purchase register",
    createLabel: "Create purchase document",
    typeOptions: ["vendor_bill", "purchase_invoice", "purchase_order"],
  },
} as const;

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

function formatBusinessDate(value: string | null | undefined) {
  if (!value) {
    return "No date";
  }

  const normalized = value.includes("T") ? value : `${value}T00:00:00`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatRecordedStamp(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 16).replace("T", " ");
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusesByType: Record<string, string[]> = {
  quotation: ["draft", "sent", "approved", "expired"],
  proforma_invoice: ["draft", "sent", "approved", "expired"],
  delivery_note: ["draft", "finalized", "delivered"],
  credit_note: ["draft", "finalized", "sent", "paid"],
  debit_note: ["draft", "finalized", "sent", "paid"],
  vendor_bill: ["draft", "approved", "paid", "partially_paid"],
  purchase_invoice: ["draft", "approved", "paid", "partially_paid"],
  purchase_order: ["draft", "sent", "approved"],
};

const defaultStatuses = ["draft", "finalized", "sent", "paid", "partially_paid", "posted", "approved"];

function statusesForType(type: string): string[] {
  return statusesByType[type] ?? defaultStatuses;
}

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    draft: "border-amber-200 bg-amber-50 text-amber-800",
    finalized: "border-sky-200 bg-sky-50 text-sky-800",
    sent: "border-indigo-200 bg-indigo-50 text-indigo-800",
    paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
    partially_paid: "border-teal-200 bg-teal-50 text-teal-800",
    posted: "border-violet-200 bg-violet-50 text-violet-800",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
    expired: "border-rose-200 bg-rose-50 text-rose-800",
  };
  return map[status] ?? "border-gray-200 bg-gray-50 text-gray-800";
}

function createHrefForType(group: "sales" | "purchase", type: string, basePath: string) {
  const root = group === "sales" ? "/workspace/invoices/new" : "/workspace/bills/new";
  return mapWorkspaceHref(`${root}?documentType=${type}`, basePath);
}

function descriptionForGroup(group: "sales" | "purchase") {
  return group === "sales"
    ? "Track proformas, delivery notes, invoices, balances, and linked references in one register."
    : "Review purchase documents, statuses, balances, and supporting references from one register.";
}

function viewHrefForDocument(group: "sales" | "purchase", documentId: number, basePath: string) {
  return group === "sales"
    ? mapWorkspaceHref(`/workspace/invoices/${documentId}`, basePath)
    : mapWorkspaceHref(`/workspace/bills/${documentId}`, basePath);
}

function editHrefForDocument(group: "sales" | "purchase", documentId: number, basePath: string) {
  return group === "sales"
    ? mapWorkspaceHref(`/workspace/invoices/${documentId}?mode=edit`, basePath)
    : mapWorkspaceHref(`/workspace/bills/${documentId}`, basePath);
}

function canIssue(document: DocumentCenterRecord) {
  return document.status === "draft";
}

function canRecordPayment(document: DocumentCenterRecord) {
  return document.type !== "proforma_invoice" && document.type !== "delivery_note" && document.status !== "draft" && document.status !== "paid" && document.balanceDue > 0;
}

function documentTrackingSummary(document: DocumentCenterRecord) {
  const paymentStatus = String(document.customFields.payment_status ?? "").trim();
  const deliveryStatus = String(document.customFields.delivery_status ?? "").trim();
  const linkedProforma = String(document.customFields.linked_proforma_number ?? "").trim();
  const linkedTaxInvoice = String(document.customFields.linked_tax_invoice_number ?? "").trim();
  const linkedDelivery = String(document.customFields.delivery_note_number ?? document.customFields.linked_delivery_note_number ?? "").trim();

  return [paymentStatus, deliveryStatus, linkedProforma, linkedDelivery, linkedTaxInvoice].filter(Boolean).join(" · ");
}

function documentTrackingLinks(document: DocumentCenterRecord) {
  const links = [
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
  ].filter(Boolean) as Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>;

  return links;
}

function readRowValue(row: SpreadsheetRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value === undefined || value === null) {
      continue;
    }

    const normalized = String(value).trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function parsePositiveNumber(value: string, fallback = 0) {
  const numeric = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(numeric) ? numeric : fallback;
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function DocumentCenterOverview({
  group,
  titleOverride,
  eyebrowOverride,
  descriptionOverride,
  createLabelOverride,
  emptyMessageOverride,
  initialType,
  createHrefOverride,
}: DocumentCenterOverviewProps) {
  const { basePath } = useWorkspacePath();
  const config = configByGroup[group];
  const [documents, setDocuments] = useState<DocumentCenterRecord[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentDetailRecord | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState(initialType ?? "all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [linkPreview, setLinkPreview] = useState<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null } | null>(null);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    listDocuments({
      group,
      status: status === "all" ? undefined : status,
      type: type === "all" ? undefined : type,
      search: deferredSearch.trim() || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      sort: "issue_date",
      direction: "desc",
    })
      .then((nextDocuments) => {
        if (!active) {
          return;
        }

        setDocuments(nextDocuments);
        setSelectedDocumentId((current) => current && nextDocuments.some((document) => document.id === current) ? current : null);
      })
      .catch((nextError) => {
        if (active) {
          setDocuments([]);
          setSelectedDocumentId(null);
          setError(nextError instanceof Error ? nextError.message : "Documents could not be loaded.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [deferredSearch, fromDate, group, refreshKey, status, toDate, type]);

  useEffect(() => {
    let active = true;

    if (!selectedDocumentId) {
      setSelectedDocument(null);
      setPreviewHtml("");
      return () => {
        active = false;
      };
    }

    setLoadingPreview(true);

    Promise.all([getDocument(selectedDocumentId), getDocumentPreview(selectedDocumentId)])
      .then(([detail, preview]) => {
        if (active) {
          setSelectedDocument(detail);
          setPreviewHtml(preview.html);
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Document preview could not be loaded.");
          setSelectedDocument(null);
          setPreviewHtml("");
        }
      })
      .finally(() => {
        if (active) {
          setLoadingPreview(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedDocumentId]);

  async function handleDuplicate() {
    if (!selectedDocumentId) {
      return;
    }

    setRunningAction("duplicate");
    setError(null);

    try {
      const duplicate = await duplicateDocument(selectedDocumentId);
      setSelectedDocumentId(duplicate.id);
      setRefreshKey((current) => current + 1);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Document could not be duplicated.");
    } finally {
      setRunningAction(null);
    }
  }

  async function handleIssue(documentId: number) {
    setRunningAction(`issue-${documentId}`);
    setError(null);

    try {
      await finalizeTransactionDraft(group === "sales" ? "invoice" : "bill", documentId);
      setRefreshKey((current) => current + 1);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Document could not be issued.");
    } finally {
      setRunningAction(null);
    }
  }

  async function handleQuickPayment(documentId: number, balanceDue: number) {
    setRunningAction(`payment-${documentId}`);
    setError(null);

    try {
      await recordDocumentPayment({
        direction: group === "sales" ? "incoming" : "outgoing",
        documentId,
        amount: balanceDue,
        paymentDate: new Date().toISOString().slice(0, 10),
        method: "bank_transfer",
        reference: `${group === "sales" ? "RCPT" : "PMT"}-${documentId}`,
      });
      setRefreshKey((current) => current + 1);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Payment could not be recorded.");
    } finally {
      setRunningAction(null);
    }
  }

  async function handleImportPurchaseDocuments({ mappedRows }: {
    file: File;
    rows: SpreadsheetRow[];
    mappedRows: SpreadsheetRow[];
    headers: string[];
    fileName: string;
    mapping: Record<string, string>;
  }) {
    const errors: Array<{ rowNumber: number; field?: string; message: string }> = [];
    const groupedBills = new Map<string, {
      billNumber: string;
      supplierName: string;
      supplierEmail: string;
      supplierPhone: string;
      supplierCity: string;
      issueDate: string;
      dueDate: string;
      notes: string;
      reference: string;
      lines: Array<{
        rowNumber: number;
        description: string;
        quantity: number;
        unitPrice: number;
        itemName: string;
        sku: string;
        category: string;
      }>;
    }>();

    mappedRows.forEach((row, index) => {
      const rowNumber = index + 2;
      const billNumber = readRowValue(row, ["document_number", "bill_number", "number", "reference", "bill_no"]);
      const supplierName = readRowValue(row, ["supplier_name", "vendor_name", "supplier", "vendor", "contact_name"]);
      const issueDate = readRowValue(row, ["issue_date", "date", "bill_date"]);
      const dueDate = readRowValue(row, ["due_date", "payment_due", "due"]);
      const description = readRowValue(row, ["line_description", "description", "item_name", "service", "product"]);
      const quantity = parsePositiveNumber(readRowValue(row, ["quantity", "qty", "units", "count"]), 1);
      const unitPrice = parsePositiveNumber(readRowValue(row, ["unit_price", "price", "rate", "amount"]), 0);

      if (!billNumber) errors.push({ rowNumber, field: "document_number", message: "Document number is required." });
      if (!supplierName) errors.push({ rowNumber, field: "supplier_name", message: "Supplier name is required." });
      if (!issueDate || !isIsoDate(issueDate)) errors.push({ rowNumber, field: "issue_date", message: "Use YYYY-MM-DD for issue date." });
      if (!dueDate || !isIsoDate(dueDate)) errors.push({ rowNumber, field: "due_date", message: "Use YYYY-MM-DD for due date." });
      if (!description) errors.push({ rowNumber, field: "line_description", message: "Line description is required." });
      if (!Number.isFinite(quantity) || quantity <= 0) errors.push({ rowNumber, field: "quantity", message: "Quantity must be greater than zero." });
      if (!Number.isFinite(unitPrice) || unitPrice < 0) errors.push({ rowNumber, field: "unit_price", message: "Unit price must be zero or greater." });

      if (!billNumber || !supplierName || !issueDate || !dueDate || !description || errors.some((item) => item.rowNumber === rowNumber)) {
        return;
      }

      const existing = groupedBills.get(billNumber) ?? {
        billNumber,
        supplierName,
        supplierEmail: readRowValue(row, ["supplier_email", "vendor_email", "email"]),
        supplierPhone: readRowValue(row, ["supplier_phone", "vendor_phone", "phone"]),
        supplierCity: readRowValue(row, ["supplier_city", "vendor_city", "city"]),
        issueDate,
        dueDate,
        notes: readRowValue(row, ["notes"]),
        reference: readRowValue(row, ["reference"]) || billNumber,
        lines: [],
      };

      if (existing.supplierName !== supplierName) {
        errors.push({ rowNumber, field: "supplier_name", message: `Document ${billNumber} uses multiple supplier names.` });
        return;
      }

      existing.lines.push({
        rowNumber,
        description,
        quantity,
        unitPrice,
        itemName: readRowValue(row, ["item_name", "description"]) || description,
        sku: readRowValue(row, ["item_code", "sku", "code"]),
        category: readRowValue(row, ["item_category", "category", "type"]),
      });
      groupedBills.set(billNumber, existing);
    });

    if (errors.length) {
      return {
        createdCount: 0,
        message: `Validation failed across ${errors.length} fields. Fix the spreadsheet and import again.`,
        errors,
      };
    }

    const directory = await getWorkspaceDirectory();
    const supplierCache = new Map<string, ContactRecord>((directory?.suppliers ?? []).map((supplier) => [supplier.displayName.toLowerCase(), supplier]));
    const itemCache = new Map<string, ItemRecord>((directory?.items ?? []).map((item) => [`${item.sku.toLowerCase()}::${item.name.toLowerCase()}`, item]));
    let createdCount = 0;

    for (const draft of groupedBills.values()) {
      let supplier = supplierCache.get(draft.supplierName.toLowerCase()) ?? null;

      if (!supplier) {
        supplier = await createContactInBackend({
          kind: "supplier",
          displayName: draft.supplierName,
          email: draft.supplierEmail,
          phone: draft.supplierPhone,
          city: draft.supplierCity,
        });
      }

      if (!supplier?.backendId) {
        errors.push({ rowNumber: draft.lines[0]?.rowNumber ?? 1, field: "supplier_name", message: `Supplier ${draft.supplierName} could not be created.` });
        continue;
      }

      supplierCache.set(draft.supplierName.toLowerCase(), supplier);

      const transactionItems: ItemRecord[] = [];
      const transactionLines = [];

      for (const line of draft.lines) {
        const itemKey = `${line.sku.toLowerCase()}::${line.itemName.toLowerCase()}`;
        let item = itemCache.get(itemKey) ?? null;

        if (!item) {
          item = await createItemInBackend({
            kind: "service",
            name: line.itemName,
            sku: line.sku,
            category: line.category,
            salePrice: 0,
            purchasePrice: line.unitPrice,
            taxLabel: "VAT 15%",
          });
        }

        if (!item?.backendId) {
          errors.push({ rowNumber: line.rowNumber, field: "item_name", message: `Line item ${line.itemName} could not be created.` });
          continue;
        }

        itemCache.set(itemKey, item);
        transactionItems.push(item);
        transactionLines.push({
          id: `import-line-${draft.billNumber}-${line.rowNumber}`,
          itemId: item.id,
          backendItemId: item.backendId,
          description: line.description,
          quantity: line.quantity,
          price: line.unitPrice,
          costCenterId: null,
          customFields: {
            item_code: line.sku || null,
            item_category: line.category || null,
          },
        });
      }

      if (transactionLines.length !== draft.lines.length) {
        continue;
      }

      await saveTransactionDraft({
        kind: "bill",
        documentType: "vendor_bill",
        title: `${draft.supplierName} import`,
        templateId: null,
        costCenterId: null,
        languageCode: "en",
        customFields: {
          currency: "SAR",
        },
        purchaseContext: { type: "services", purpose: "operations", category: "imported" },
        contact: supplier,
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
      setRefreshKey((current) => current + 1);
    }

    return {
      createdCount,
      skippedCount: groupedBills.size - createdCount,
      message: errors.length
        ? `Imported ${createdCount} purchase drafts. ${errors.length} rows still need attention.`
        : `Imported ${createdCount} purchase drafts successfully.`,
      errors,
    };
  }

  const createHref = createHrefOverride
    ? mapWorkspaceHref(createHrefOverride, basePath)
    : createHrefForType(group, type === "all" ? config.typeOptions[0] : type, basePath);

  const viewMode: "register" | "split" = selectedDocumentId ? "split" : "register";
  const activeFilterCount = [status !== "all", type !== (initialType ?? "all"), Boolean(fromDate), Boolean(toDate)].filter(Boolean).length;

  return (
    <div className="space-y-1" data-inspector-split-view="true">
      {/* Compact toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-semibold text-ink">{titleOverride ?? config.title}</h1>
          <span className="inline-flex h-5 items-center rounded bg-surface-soft px-1.5 text-[10px] font-semibold text-muted">{documents.length}</span>
          {loading ? <span className="text-[10px] text-primary">Loading…</span> : null}
        </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted">{eyebrowOverride ?? config.eyebrow}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] text-muted">{descriptionOverride ?? descriptionForGroup(group)}</p>
          <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="hidden w-40 lg:block" labelClassName="sr-only mb-0" inputClassName="h-7 rounded-md text-xs px-2" />
          <button type="button" onClick={() => setFiltersOpen((c) => !c)} className={["h-7 rounded-md border px-2 text-[11px] font-semibold", filtersOpen ? "border-primary bg-primary-soft text-primary" : "border-line bg-white text-muted hover:text-ink"].join(" ")}>
            {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : "Filter"}
          </button>
          {viewMode === "split" ? (
            <button type="button" onClick={() => setSelectedDocumentId(null)} className="h-7 rounded-md border border-line bg-white px-2 text-[11px] font-semibold text-muted hover:text-ink">Close preview</button>
          ) : null}
          <ImportExportControls label={group === "sales" ? "sales documents" : "purchase documents"} exportFileName={`${group}-documents.csv`} rows={documents} columns={[
            { label: "Number", value: (r) => r.number },
            { label: "Type", value: (r) => r.type },
            { label: "Contact", value: (r) => r.contactName },
            { label: "Status", value: (r) => r.status },
            { label: "Total", value: (r) => r.grandTotal },
            { label: "Balance", value: (r) => r.balanceDue },
          ]}
          importMappingFields={group === "purchase" ? [
            { key: "document_number", label: "Document number", required: true, aliases: ["bill_number", "number", "reference", "bill no"] },
            { key: "supplier_name", label: "Supplier name", required: true, aliases: ["vendor_name", "supplier", "vendor", "contact_name"] },
            { key: "issue_date", label: "Issue date", required: true, aliases: ["date", "bill_date"] },
            { key: "due_date", label: "Due date", required: true, aliases: ["payment_due", "due"] },
            { key: "line_description", label: "Line description", required: true, aliases: ["description", "item_name", "service", "product"] },
            { key: "quantity", label: "Quantity", required: true, aliases: ["qty", "units", "count"] },
            { key: "unit_price", label: "Unit price", required: true, aliases: ["price", "rate", "amount"] },
            { key: "supplier_email", label: "Supplier email", aliases: ["vendor_email", "email"] },
            { key: "supplier_phone", label: "Supplier phone", aliases: ["vendor_phone", "phone"] },
            { key: "supplier_city", label: "Supplier city", aliases: ["vendor_city", "city"] },
            { key: "item_code", label: "Item code", aliases: ["sku", "code"] },
            { key: "item_category", label: "Item category", aliases: ["category", "type"] },
          ] : undefined}
          importRules={group === "purchase" ? [
            "Required columns: document_number, supplier_name, issue_date, due_date, line_description, quantity, unit_price.",
            "Dates must use YYYY-MM-DD.",
            "Each row represents one line item; repeated document_number values are grouped into one vendor bill draft.",
            "Imported purchase documents are created as drafts so they can be reviewed before final posting.",
          ] : undefined}
          onImportFile={group === "purchase" ? handleImportPurchaseDocuments : undefined} />
          <Button size="xs" href={createHref}>{createLabelOverride ?? "+ Document"}</Button>
        </div>
      </div>

      {/* Collapsible filter panel */}
      {filtersOpen ? (
        <div className="rounded-md border border-line bg-white p-2">
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-0.5 block text-[9px] font-bold uppercase text-muted">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="h-7 w-full rounded-md border border-line bg-white px-1.5 text-xs outline-none focus:border-primary/60">{<option value="all">All types</option>}{config.typeOptions.map((o) => <option key={o} value={o}>{labelize(o)}</option>)}</select>
            </div>
            <div>
              <label className="mb-0.5 block text-[9px] font-bold uppercase text-muted">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-7 w-full rounded-md border border-line bg-white px-1.5 text-xs outline-none focus:border-primary/60">{<option value="all">All</option>}{statusesForType(type === "all" ? "" : type).map((o) => <option key={o} value={o}>{labelize(o)}</option>)}</select>
            </div>
            <Input label="From" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} labelClassName="mb-0.5 text-[9px]" inputClassName="h-7 rounded-md px-2 text-xs" />
            <Input label="To" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} labelClassName="mb-0.5 text-[9px]" inputClassName="h-7 rounded-md px-2 text-xs" />
            <div className="flex items-end">
              <button type="button" onClick={() => { setSearch(""); setStatus("all"); setType(initialType ?? "all"); setFromDate(""); setToDate(""); }} className="h-7 rounded-md border border-line bg-white px-2 text-[10px] font-semibold text-muted hover:text-ink">Reset</button>
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {config.typeOptions.map((o) => (
              <button key={o} type="button" onClick={() => setType(o)} className={["h-5 rounded border px-1.5 text-[9px] font-semibold", type === o ? "border-primary bg-primary-soft text-primary" : "border-line text-muted"].join(" ")}>{labelize(o)}</button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{error}</div> : null}

      {/* Compact action bar for selected document */}
      {selectedDocument && viewMode === "split" ? (
        <div className="flex items-center gap-1.5 rounded-md border border-line bg-white px-2 py-1">
          <span className={["inline-flex h-5 items-center rounded border px-1.5 text-[9px] font-bold uppercase tracking-wider", statusBadgeClass(selectedDocument.status)].join(" ")}>{labelize(selectedDocument.status)}</span>
          <span className="text-xs font-semibold text-ink">{selectedDocument.number}</span>
          <span className="text-[11px] text-muted">{selectedDocument.contactName}</span>
          <span className="text-xs font-bold text-ink ml-auto">{currency(selectedDocument.grandTotal)}</span>
          <span className="mx-1 h-4 w-px bg-line" />
          {selectedDocument.status === "draft" ? <Button size="xs" variant="secondary" href={editHrefForDocument(group, selectedDocument.id, basePath)}>Edit</Button> : null}
          <Button size="xs" variant="secondary" href={getDocumentPdfUrl(selectedDocument.id)}>Download</Button>
          <Button size="xs" variant="secondary" onClick={handleDuplicate} disabled={runningAction === "duplicate"}>Duplicate</Button>
          {canIssue(selectedDocument as unknown as DocumentCenterRecord) ? <Button size="xs" onClick={() => void handleIssue(selectedDocument.id)} disabled={!!runningAction}>Issue</Button> : null}
          {canRecordPayment(selectedDocument as unknown as DocumentCenterRecord) ? <Button size="xs" variant="secondary" onClick={() => void handleQuickPayment(selectedDocument.id, selectedDocument.balanceDue)} disabled={!!runningAction}>Payment</Button> : null}
        </div>
      ) : null}

      {/* Main content */}
      <div className={[
        "overflow-hidden rounded-lg border border-line bg-white",
        viewMode === "split"
          ? "grid lg:h-[calc(100vh-10.5rem)] lg:min-h-[28rem] lg:grid-cols-[minmax(24rem,39%)_minmax(0,61%)]"
          : "lg:h-[calc(100vh-9rem)] lg:min-h-[28rem]",
      ].join(" ")}>
        {/* Register pane */}
        <div className={["overflow-auto", viewMode === "split" ? "border-r border-line" : ""].join(" ")}>
          <table className="min-w-full text-xs">
            <thead className="sticky top-0 z-10 border-b border-line bg-surface-soft/95 backdrop-blur">
              <tr>
                <th className="px-2 py-1 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-muted">Document</th>
                <th className="px-2 py-1 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-muted">Contact</th>
                <th className="px-2 py-1 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-muted">Tracking</th>
                <th className="px-2 py-1 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-muted">Status</th>
                <th className="px-2 py-1 text-right text-[9px] font-bold uppercase tracking-[0.1em] text-muted">Total</th>
                <th className="px-2 py-1 text-right text-[9px] font-bold uppercase tracking-[0.1em] text-muted">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {loading ? <tr><td className="px-2 py-2 text-muted" colSpan={6}>Loading…</td></tr> : null}
              {!loading && documents.length > 0 ? documents.map((doc) => {
                const isSelected = doc.id === selectedDocumentId;
                return (
                  <tr key={doc.id} data-inspector-register-row="true" className={["cursor-pointer", isSelected ? "bg-primary-soft/30" : "hover:bg-surface-soft/40"].join(" ")} onClick={() => setSelectedDocumentId(doc.id)} onDoubleClick={() => { window.location.href = viewHrefForDocument(group, doc.id, basePath); }}>
                    <td className="px-2 py-1.5">
                      <span className="block text-xs font-semibold text-ink">{doc.number}</span>
                      <span className="text-[10px] text-muted">{labelize(doc.type)} · {formatBusinessDate(doc.issueDate)}</span>
                      {formatRecordedStamp(String(doc.customFields.recorded_at ?? "")) ? <span className="block text-[10px] text-muted">{String(doc.customFields.recorded_by ?? "Workspace User")} · {formatRecordedStamp(String(doc.customFields.recorded_at ?? ""))}</span> : null}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-muted truncate max-w-[10rem]">{doc.contactName || "—"}</td>
                    <td className="px-2 py-1.5 text-[10px] text-muted max-w-[15rem]">
                      <div className="flex flex-wrap gap-1">
                        {documentTrackingLinks(doc).length ? documentTrackingLinks(doc).map((link) => (
                          <DocumentLinkTrigger key={`${doc.id}-${link.documentType}-${link.documentNumber}`} link={link} onPreview={setLinkPreview} className="rounded border border-line bg-white px-1 py-0.5 text-[9px] text-primary underline-offset-2 hover:underline" />
                        )) : <span>{documentTrackingSummary(doc) || "—"}</span>}
                      </div>
                    </td>
                    <td className="px-2 py-1.5"><span className={["inline-flex h-4 items-center rounded border px-1 text-[8px] font-bold uppercase tracking-wider", statusBadgeClass(doc.status)].join(" ")}>{labelize(doc.status)}</span></td>
                    <td className="px-2 py-1.5 text-right text-xs font-semibold text-ink">{currency(doc.grandTotal)}</td>
                    <td className={["px-2 py-1.5 text-right text-xs font-semibold", doc.balanceDue > 0 ? "text-amber-700" : "text-emerald-700"].join(" ")}>{currency(doc.balanceDue)}</td>
                  </tr>
                );
              }) : null}
              {!loading && documents.length === 0 ? <tr><td className="px-2 py-3 text-xs text-muted" colSpan={6}>{emptyMessageOverride ?? "No documents match."}</td></tr> : null}
            </tbody>
          </table>
        </div>

        {/* Document render pane */}
        {viewMode === "split" ? (
          <div className="overflow-auto bg-[#eef3ee] p-2" data-inspector-document-render-surface="true">
            {loadingPreview ? <div className="py-4 text-center text-xs text-muted">Loading document…</div> : null}
            {!loadingPreview && previewHtml ? (
              <div className="mx-auto max-w-[980px] rounded-lg border border-[#dfe6df] bg-white p-2 shadow-[0_24px_54px_-44px_rgba(17,32,24,0.28)]">
                <div className="max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            ) : null}
            {!loadingPreview && !previewHtml && selectedDocument ? (
              <div className="rounded border border-line bg-white p-3 text-xs text-muted">Rendered document output is not available for this record.</div>
            ) : null}
          </div>
        ) : null}
      </div>
      <DocumentLinkPreviewModal link={linkPreview} onClose={() => setLinkPreview(null)} />
    </div>
  );
}