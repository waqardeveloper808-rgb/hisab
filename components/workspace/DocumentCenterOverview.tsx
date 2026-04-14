"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import {
  duplicateDocument,
  getDocument,
  getDocumentPdfUrl,
  getDocumentPreview,
  listDocumentTemplates,
  listDocuments,
  sendDocument,
  type DocumentCenterRecord,
  type DocumentDetailRecord,
  type DocumentTemplateRecord,
} from "@/lib/workspace-api";
import { mapWorkspaceHref } from "@/lib/workspace-path";
import { currency } from "@/components/workflow/utils";

type DocumentCenterOverviewProps = {
  group: "sales" | "purchase";
};

const configByGroup = {
  sales: {
    eyebrow: "Sales documents",
    title: "Invoices, quotations, cash invoices, and collections stay in one document register.",
    description: "Review sales output on the left, keep the rendered document on the right, and run the real actions from the same screen.",
    createLabel: "Create sales document",
    createHref: "/workspace/invoices/new",
    emptyMessage: "Sales documents will appear here after the first quotation, invoice, or customer payment flow.",
    typeOptions: ["quotation", "proforma_invoice", "tax_invoice", "recurring_invoice", "cash_invoice", "api_invoice"],
  },
  purchase: {
    eyebrow: "Purchase documents",
    title: "Vendor bills, purchase orders, debit notes, and supplier paperwork stay under one purchase center.",
    description: "Use one register for the full purchase document chain, then inspect the rendered output without leaving the page.",
    createLabel: "Create vendor bill or purchase document",
    createHref: "/workspace/bills/new",
    emptyMessage: "Purchase documents will appear here after the first vendor bill, purchase invoice, order, or debit note.",
    typeOptions: ["vendor_bill", "purchase_invoice", "purchase_order", "debit_note"],
  },
};

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

function editHrefForDocument(group: "sales" | "purchase", documentId: number, basePath: string) {
  return group === "sales"
    ? mapWorkspaceHref(`/workspace/invoices/${documentId}`, basePath)
    : mapWorkspaceHref(`/workspace/bills/${documentId}`, basePath);
}

export function DocumentCenterOverview({ group }: DocumentCenterOverviewProps) {
  const { basePath } = useWorkspacePath();
  const config = configByGroup[group];
  const [documents, setDocuments] = useState<DocumentCenterRecord[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentDetailRecord | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [templates, setTemplates] = useState<DocumentTemplateRecord[]>([]);
  const [previewTemplateId, setPreviewTemplateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let active = true;

    listDocumentTemplates()
      .then((nextTemplates) => {
        if (active) {
          setTemplates(nextTemplates);
        }
      })
      .catch(() => {
        if (active) {
          setTemplates([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

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
      minTotal: minTotal ? Number(minTotal) : undefined,
      maxTotal: maxTotal ? Number(maxTotal) : undefined,
      sort: "issue_date",
      direction: "desc",
    })
      .then((nextDocuments) => {
        if (!active) {
          return;
        }

        setDocuments(nextDocuments);
        setSelectedDocumentId((current) => {
          if (current && nextDocuments.some((document) => document.id === current)) {
            return current;
          }

          return nextDocuments[0]?.id ?? null;
        });
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Documents could not be loaded.");
        setDocuments([]);
        setSelectedDocumentId(null);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [deferredSearch, fromDate, group, maxTotal, minTotal, refreshKey, status, toDate, type]);

  useEffect(() => {
    let active = true;

    if (!selectedDocumentId) {
      setSelectedDocument(null);
      setPreviewHtml("");
      setPreviewTemplateId(null);
      return;
    }

    setLoadingPreview(true);
    setError(null);

    Promise.all([getDocument(selectedDocumentId), getDocumentPreview(selectedDocumentId)])
      .then(([detail, preview]) => {
        if (!active) {
          return;
        }

        setSelectedDocument(detail);
        setPreviewTemplateId(detail.templateId ?? null);
        setPreviewHtml(preview.html);
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Document preview could not be loaded.");
        setSelectedDocument(null);
        setPreviewHtml("");
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

  useEffect(() => {
    let active = true;

    if (!selectedDocumentId) {
      return () => {
        active = false;
      };
    }

    setLoadingPreview(true);

    getDocumentPreview(selectedDocumentId, { templateId: previewTemplateId })
      .then((preview) => {
        if (active) {
          setPreviewHtml(preview.html);
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Document preview could not be loaded.");
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
  }, [previewTemplateId, selectedDocumentId]);

  const summary = useMemo(() => {
    return documents.reduce(
      (accumulator, document) => {
        accumulator.total += document.grandTotal;
        accumulator.balance += document.balanceDue;

        if (document.status === "draft") {
          accumulator.drafts += 1;
        }

        if (document.sentAt) {
          accumulator.sent += 1;
        }

        return accumulator;
      },
      { total: 0, balance: 0, drafts: 0, sent: 0 },
    );
  }, [documents]);

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

  async function handleSend() {
    if (!selectedDocumentId) {
      return;
    }

    const email = window.prompt("Send this document to which email address?", selectedDocument?.sentToEmail || "");

    if (email === null) {
      return;
    }

    setRunningAction("send");
    setError(null);

    try {
      const sentDocument = await sendDocument(selectedDocumentId, { email });
      setSelectedDocument(sentDocument);
      setRefreshKey((current) => current + 1);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Document could not be sent.");
    } finally {
      setRunningAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{config.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">{config.title}</h1>
            <p className="mt-4 text-base leading-7 text-muted">{config.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={mapWorkspaceHref(config.createHref, basePath)}>{config.createLabel}</Button>
            {group === "purchase" ? <Button href={mapWorkspaceHref("/workspace/purchases/cost-centers", basePath)} variant="secondary">Manage cost centers</Button> : null}
            {selectedDocumentId ? <Button href={getDocumentPdfUrl(selectedDocumentId)} variant="secondary">Download PDF</Button> : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Documents", String(documents.length), "Everything matching the active filter set."],
          ["Drafts", String(summary.drafts), "Documents still waiting for final review or sending."],
          ["Open balance", `${currency(summary.balance)} SAR`, "Outstanding amount still unpaid across the register."],
          ["Sent", String(summary.sent), "Documents already sent through the connected workflow."],
        ].map(([title, value, caption]) => (
          <Card key={title} className="rounded-[1.8rem] bg-white/92 p-5">
            <p className="text-sm font-semibold text-muted">{title}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{caption}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <Card className="rounded-[1.9rem] bg-white/92 p-6 xl:sticky xl:top-28 xl:max-h-[calc(100vh-8rem)] xl:overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-line pb-4">
            <div>
              <h2 className="text-2xl font-semibold text-ink">Register</h2>
              <p className="mt-1 text-sm text-muted">Filter the live document list, then open any record to inspect the rendered output.</p>
            </div>
            <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by number, title, or contact" />
            <div>
              <p className="mb-2.5 text-sm font-semibold text-ink">Document tabs</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setType("all")} className={["rounded-full border px-3 py-2 text-sm font-semibold", type === "all" ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface-soft text-ink"].join(" ")}>All</button>
                {config.typeOptions.map((option) => (
                  <button key={option} type="button" onClick={() => setType(option)} className={["rounded-full border px-3 py-2 text-sm font-semibold", type === option ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface-soft text-ink"].join(" ")}>
                    {labelize(option)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor={`${group}-status`} className="mb-2.5 block text-sm font-semibold text-ink">Status</label>
                <select
                  id={`${group}-status`}
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                >
                  <option value="all">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="finalized">Finalized</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partially paid</option>
                  <option value="void">Void</option>
                </select>
              </div>
              <div>
                <label htmlFor={`${group}-type`} className="mb-2.5 block text-sm font-semibold text-ink">Type</label>
                <select
                  id={`${group}-type`}
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                >
                  <option value="all">All types</option>
                  {config.typeOptions.map((option) => (
                    <option key={option} value={option}>{labelize(option)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="From date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
              <Input label="To date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
              <Input label="Min total" type="number" value={minTotal} onChange={(event) => setMinTotal(event.target.value)} placeholder="0" />
              <Input label="Max total" type="number" value={maxTotal} onChange={(event) => setMaxTotal(event.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="mt-5 space-y-3 xl:max-h-[calc(100vh-22rem)] xl:overflow-y-auto xl:pr-1">
            {loading ? (
              <div className="rounded-[1.4rem] border border-dashed border-line bg-surface-soft px-4 py-6 text-sm text-muted">Loading documents…</div>
            ) : documents.length ? (
              documents.map((document) => {
                const active = document.id === selectedDocumentId;

                return (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => setSelectedDocumentId(document.id)}
                    className={[
                      "block w-full rounded-[1.5rem] border px-4 py-4 text-left transition",
                      active
                        ? "border-primary bg-primary-soft shadow-[0_20px_40px_-30px_rgba(31,122,83,0.35)]"
                        : "border-line bg-surface-soft hover:border-primary/25 hover:bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{labelize(document.type)}</p>
                        <h3 className="mt-2 text-base font-semibold text-ink">{document.title || document.number}</h3>
                        <p className="mt-1 text-sm text-muted">{document.contactName || "No contact linked"}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{labelize(document.status)}</span>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
                      <p>Number: <span className="font-semibold text-ink">{document.number}</span></p>
                      <p>Issue: <span className="font-semibold text-ink">{document.issueDate || "-"}</span></p>
                      <p>Total: <span className="font-semibold text-ink">{currency(document.grandTotal)} SAR</span></p>
                      <p>Balance: <span className="font-semibold text-ink">{currency(document.balanceDue)} SAR</span></p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-line bg-surface-soft px-4 py-6 text-sm leading-6 text-muted">{config.emptyMessage}</div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          {error ? <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <Card className="rounded-[1.9rem] bg-white/92 p-6">
            <div className="flex flex-col gap-5 border-b border-line pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Preview</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">{selectedDocument?.title || selectedDocument?.number || "Choose a document"}</h2>
                <p className="mt-2 text-sm text-muted">
                  {selectedDocument
                    ? `${labelize(selectedDocument.type)} for ${selectedDocument.contactName || "an unassigned contact"}`
                    : "Select a document from the register to load the rendered template and line detail."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {selectedDocument?.status === "draft" ? <Button href={editHrefForDocument(group, selectedDocument.id, basePath)} variant="secondary">Edit draft</Button> : null}
                <Button variant="secondary" onClick={handleDuplicate} disabled={!selectedDocumentId || runningAction !== null}>
                  {runningAction === "duplicate" ? "Duplicating" : "Duplicate as draft"}
                </Button>
                <Button onClick={handleSend} disabled={!selectedDocumentId || runningAction !== null}>
                  {runningAction === "send" ? "Sending" : "Send document"}
                </Button>
              </div>
            </div>

            {selectedDocument ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.4rem] bg-surface-soft px-4 py-4 text-sm text-muted">
                  <p className="font-semibold text-ink">Template</p>
                  <p className="mt-1">{selectedDocument.templateName || "Default template"}</p>
                </div>
                <div className="rounded-[1.4rem] bg-surface-soft px-4 py-4 text-sm text-muted">
                  <p className="font-semibold text-ink">Language</p>
                  <p className="mt-1">{selectedDocument.languageCode.toUpperCase()}</p>
                </div>
                <div className="rounded-[1.4rem] bg-surface-soft px-4 py-4 text-sm text-muted">
                  <p className="font-semibold text-ink">Grand total</p>
                  <p className="mt-1">{currency(selectedDocument.grandTotal)} SAR</p>
                </div>
                <div className="rounded-[1.4rem] bg-surface-soft px-4 py-4 text-sm text-muted">
                  <p className="font-semibold text-ink">Sent to</p>
                  <p className="mt-1">{selectedDocument.sentToEmail || "Not sent yet"}</p>
                </div>
              </div>
            ) : null}

            {selectedDocument ? (
              <div className="mt-4 max-w-sm">
                <label htmlFor={`${group}-preview-template`} className="mb-2.5 block text-sm font-semibold text-ink">Live preview template</label>
                <select
                  id={`${group}-preview-template`}
                  value={previewTemplateId ?? ""}
                  onChange={(event) => setPreviewTemplateId(event.target.value ? Number(event.target.value) : null)}
                  className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                >
                  <option value="">Default or assigned template</option>
                  {templates
                    .filter((template) => !template.documentTypes.length || template.documentTypes.includes(selectedDocument.type))
                    .map((template) => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                </select>
              </div>
            ) : null}
          </Card>

          <Card className="rounded-[1.9rem] bg-white/92 p-0 overflow-hidden">
            <div className="border-b border-line px-6 py-4">
              <h3 className="text-xl font-semibold text-ink">Rendered output</h3>
              <p className="mt-1 text-sm text-muted">This preview comes from the backend template renderer, supports live template switching, and matches the exported PDF payload.</p>
            </div>
            {loadingPreview ? (
              <div className="px-6 py-10 text-sm text-muted">Loading preview…</div>
            ) : previewHtml ? (
              <div className="bg-[#eef3ee] p-4 sm:p-6">
                <div className="mx-auto max-w-[920px] overflow-hidden rounded-[1.5rem] border border-[#dfe6df] bg-white shadow-[0_28px_60px_-42px_rgba(17,32,24,0.22)]">
                  <div className="max-h-[70vh] overflow-auto p-4 sm:p-6" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
              </div>
            ) : (
              <div className="px-6 py-10 text-sm text-muted">Choose a document to inspect its rendered output.</div>
            )}
          </Card>

          {selectedDocument ? (
            <Card className="rounded-[1.9rem] bg-white/92 p-6">
              <h3 className="text-xl font-semibold text-ink">Line detail</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr>
                      <th className="px-3 pb-1 text-left font-semibold text-muted">Description</th>
                      <th className="px-3 pb-1 text-right font-semibold text-muted">Qty</th>
                      <th className="px-3 pb-1 text-right font-semibold text-muted">Unit price</th>
                      <th className="px-3 pb-1 text-right font-semibold text-muted">Gross</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDocument.lines.map((line) => (
                      <tr key={line.id} className="rounded-2xl bg-surface-soft text-ink">
                        <td className="px-3 py-3">{line.description}</td>
                        <td className="px-3 py-3 text-right">{line.quantity}</td>
                        <td className="px-3 py-3 text-right">{currency(line.unitPrice)} SAR</td>
                        <td className="px-3 py-3 text-right">{currency(line.grossAmount)} SAR</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}