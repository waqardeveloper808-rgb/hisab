"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { currency } from "@/components/workflow/utils";
import { ImportExportControls } from "@/components/workspace/ImportExportControls";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import {
  duplicateDocument,
  finalizeTransactionDraft,
  getDocument,
  getDocumentPdfUrl,
  getDocumentPreview,
  listDocuments,
  recordDocumentPayment,
  type DocumentCenterRecord,
  type DocumentDetailRecord,
} from "@/lib/workspace-api";
import { mapWorkspaceHref } from "@/lib/workspace-path";

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
    typeOptions: ["quotation", "proforma_invoice", "tax_invoice", "cash_invoice", "recurring_invoice", "credit_note", "debit_note", "api_invoice"],
  },
  purchase: {
    eyebrow: "Purchases",
    title: "Purchase register",
    createLabel: "Create purchase document",
    typeOptions: ["vendor_bill", "purchase_invoice", "purchase_order", "debit_note"],
  },
} as const;

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

function createHrefForType(group: "sales" | "purchase", type: string, basePath: string) {
  const root = group === "sales" ? "/workspace/invoices/new" : "/workspace/bills/new";
  return mapWorkspaceHref(`${root}?documentType=${type}`, basePath);
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
  return document.status !== "draft" && document.status !== "paid" && document.balanceDue > 0;
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
        setSelectedDocumentId((current) => current && nextDocuments.some((document) => document.id === current) ? current : nextDocuments[0]?.id ?? null);
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

  const createHref = createHrefOverride
    ? mapWorkspaceHref(createHrefOverride, basePath)
    : createHrefForType(group, type === "all" ? config.typeOptions[0] : type, basePath);

  return (
    <div className="space-y-3" data-inspector-split-view="true">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">{eyebrowOverride ?? config.eyebrow}</p>
          <h1 className="text-lg font-semibold text-ink">{titleOverride ?? config.title}</h1>
          {descriptionOverride ? <p className="mt-1 text-xs text-muted">{descriptionOverride}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportExportControls
            label={group === "sales" ? "sales documents" : "purchase documents"}
            exportFileName={`${group}-documents.csv`}
            rows={documents}
            columns={[
              { label: "Number", value: (row) => row.number },
              { label: "Type", value: (row) => row.type },
              { label: "Contact", value: (row) => row.contactName },
              { label: "Status", value: (row) => row.status },
              { label: "Total", value: (row) => row.grandTotal },
              { label: "Balance", value: (row) => row.balanceDue },
            ]}
          />
          <Button href={createHref} data-inspector-create-href={createHref}>{createLabelOverride ?? config.createLabel}</Button>
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl bg-white/95 p-0">
        <div className="grid gap-2 border-b border-line px-3 py-3 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto]">
          <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search number, title, or contact" />
          <div>
            <label htmlFor={`${group}-type`} className="mb-2 block text-sm font-semibold text-ink">Type</label>
            <select id={`${group}-type`} value={type} onChange={(event) => setType(event.target.value)} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
              <option value="all">All types</option>
              {config.typeOptions.map((option) => (
                <option key={option} value={option}>{labelize(option)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${group}-status`} className="mb-2 block text-sm font-semibold text-ink">Status</label>
            <select id={`${group}-status`} value={status} onChange={(event) => setStatus(event.target.value)} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="finalized">Finalized</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially paid</option>
              <option value="posted">Posted</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          <Input label="From" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <div className="grid items-end lg:col-span-2 2xl:col-span-1">
            <Button variant="secondary" onClick={() => {
              setSearch("");
              setStatus("all");
              setType(initialType ?? "all");
              setFromDate("");
              setToDate("");
            }}>Reset</Button>
          </div>
          <Input label="To" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          <div className="lg:col-span-2 2xl:col-span-4 flex flex-wrap gap-1.5">
            {config.typeOptions.map((option) => (
              <button key={option} type="button" onClick={() => setType(option)} className={["rounded-full border px-3 py-1.5 text-xs font-semibold", type === option ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface-soft text-ink"].join(" ")}>
                {labelize(option)}
              </button>
            ))}
          </div>
        </div>

        {error ? <div className="mx-3 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

        <div className="grid gap-0 2xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.85fr)]">
          <div className="overflow-x-auto border-r border-line">
            <table className="min-w-full text-sm" data-inspector-row-clickable="true">
              <thead className="border-b border-line bg-surface-soft/70">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted">Document</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted">Contact</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted">Status</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-[0.08em] text-muted">Total</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-[0.08em] text-muted">Balance</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-4 text-sm text-muted" colSpan={6}>Loading documents…</td>
                  </tr>
                ) : documents.length ? documents.map((document) => {
                  const isSelected = document.id === selectedDocumentId;
                  const viewHref = viewHrefForDocument(group, document.id, basePath);
                  const editHref = editHrefForDocument(group, document.id, basePath);

                  return (
                    <tr key={document.id} className={["border-t border-line/70 align-top", isSelected ? "bg-primary-soft/20" : ""].join(" ")}>
                      <td className="px-3 py-2.5">
                        <button type="button" onClick={() => setSelectedDocumentId(document.id)} className="text-left" data-inspector-row-clickable="true">
                          <span className="block font-semibold text-ink hover:text-primary">{document.number}</span>
                          <span className="mt-0.5 block text-xs text-muted">{labelize(document.type)}</span>
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-muted">{document.contactName || "-"}</td>
                      <td className="px-3 py-2.5 text-sm text-muted">{labelize(document.status)}</td>
                      <td className="px-3 py-2.5 text-right text-sm font-semibold text-ink">{currency(document.grandTotal)}</td>
                      <td className="px-3 py-2.5 text-right text-sm font-semibold text-ink">{currency(document.balanceDue)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          <Button size="sm" variant="secondary" onClick={() => setSelectedDocumentId(document.id)}>Preview</Button>
                          <Button size="sm" variant="secondary" href={viewHref}>View</Button>
                          {document.status === "draft" ? <Button size="sm" variant="secondary" href={editHref}>Edit</Button> : null}
                          {canIssue(document) ? <Button size="sm" onClick={() => void handleIssue(document.id)} disabled={runningAction === `issue-${document.id}`}>{runningAction === `issue-${document.id}` ? "Issuing" : "Issue"}</Button> : null}
                          <Button size="sm" variant="secondary" href={getDocumentPdfUrl(document.id)}>Download</Button>
                          {canRecordPayment(document) ? <Button size="sm" variant="secondary" onClick={() => void handleQuickPayment(document.id, document.balanceDue)} disabled={runningAction === `payment-${document.id}`}>{runningAction === `payment-${document.id}` ? "Saving" : "Payment"}</Button> : null}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td className="px-3 py-4 text-sm text-muted" colSpan={6}>{emptyMessageOverride ?? "No documents match the current filter."}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-2.5 lg:p-3" data-inspector-preview-surface="true">
            {selectedDocument ? (
              <Card className="overflow-hidden rounded-2xl bg-white/95 p-0">
                <div className="border-b border-line px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-ink">{selectedDocument.number}</p>
                      <p className="mt-1 text-xs text-muted">{selectedDocument.contactName || "No contact"} · {labelize(selectedDocument.type)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => void handleDuplicate()} disabled={runningAction !== null}>{runningAction === "duplicate" ? "Duplicating" : "Duplicate"}</Button>
                      <Button size="sm" variant="secondary" href={getDocumentPdfUrl(selectedDocument.id)}>Download</Button>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 px-3 py-3 sm:px-4 md:grid-cols-2">
                  <div className="rounded-lg border border-line bg-surface-soft px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Status</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{labelize(selectedDocument.status)}</p>
                  </div>
                  <div className="rounded-lg border border-line bg-surface-soft px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Balance</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{currency(selectedDocument.balanceDue)} SAR</p>
                  </div>
                </div>
                {loadingPreview ? <div className="px-4 py-4 text-sm text-muted">Loading preview…</div> : (
                  <div className="bg-[#eef3ee] p-2.5 sm:p-3">
                    <div className="max-h-[26rem] overflow-auto rounded-lg border border-[#dfe6df] bg-white p-2.5 sm:p-3" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </div>
                )}
              </Card>
            ) : <Card className="rounded-2xl bg-white/95 p-4 text-sm text-muted">Select a row to preview the document while keeping the register visible.</Card>}
          </div>
        </div>
      </Card>
    </div>
  );
}