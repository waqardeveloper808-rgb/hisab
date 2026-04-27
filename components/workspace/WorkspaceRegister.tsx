"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Plus } from "lucide-react";
import type { DocumentRecord, DocumentStatus } from "@/lib/workspace/types";
import { findCustomer } from "@/data/workspace/customers";
import { formatCurrency, formatDate, statusLabel, statusTone } from "@/lib/workspace/format";
import { loadColumnVisibility, saveColumnVisibility } from "@/lib/workspace/register-column-storage";
import { WorkspaceRegisterToolbar, type StatusFilterOption } from "./WorkspaceRegisterToolbar";
import { WorkspacePreviewPanel } from "./WorkspacePreviewPanel";
import { WorkspaceEmptyState } from "./WorkspaceEmptyState";
import { WorkspaceSuggestion } from "./WorkspaceSuggestion";
import { WorkspaceMoreActions } from "./WorkspaceMoreActions";
import { WorkspaceColumnPicker, type ColumnDef } from "./WorkspaceColumnPicker";

type RegisterConfig = {
  title: string;
  subtitle: string;
  documents: DocumentRecord[];
  createLabel: string;
  suggestionId: string;
  suggestionTitle: string;
  suggestionDescription: string;
  emptyTitle: string;
  emptyDescription: string;
};

type Props = {
  config: RegisterConfig;
};

const REG_ID = "v2.register.documents";

const DOC_COLUMNS: ColumnDef[] = [
  { id: "number", label: "Document No.", required: true },
  { id: "customer", label: "Customer", required: true },
  { id: "issue", label: "Issue date" },
  { id: "due", label: "Due date" },
  { id: "status", label: "Status", required: true },
  { id: "vat", label: "VAT" },
  { id: "total", label: "Total", required: true },
  { id: "balance", label: "Balance" },
  { id: "actions", label: "Actions", required: true },
];

const DEFAULT_VISIBLE = DOC_COLUMNS.map((c) => c.id);

const DEFAULT_STATUS_OPTIONS: ("all" | DocumentStatus)[] = [
  "all",
  "draft",
  "issued",
  "sent",
  "partially_paid",
  "paid",
  "overdue",
];

function buildStatusOptions(documents: DocumentRecord[]): StatusFilterOption[] {
  const usedStatuses = new Set<DocumentStatus>();
  documents.forEach((doc) => usedStatuses.add(doc.status));
  const counts: Record<string, number> = {};
  documents.forEach((doc) => {
    counts[doc.status] = (counts[doc.status] ?? 0) + 1;
  });
  return DEFAULT_STATUS_OPTIONS.filter((option) =>
    option === "all" ? true : usedStatuses.has(option as DocumentStatus),
  ).map((option) => ({
    id: option,
    label: option === "all" ? "All" : statusLabel(option as DocumentStatus),
    count: option === "all" ? documents.length : counts[option as string] ?? 0,
  }));
}

function initVisible(): string[] {
  if (typeof window === "undefined") return DEFAULT_VISIBLE;
  return loadColumnVisibility(REG_ID, DEFAULT_VISIBLE);
}

export function WorkspaceRegister({ config }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DocumentStatus>("all");
  const [overrideId, setOverrideId] = useState<{ value: string | null; key: string } | null>(null);
  const [visibleColIds, setVisibleColIds] = useState<string[]>(initVisible);

  const queryDocId = params?.get("doc") ?? null;
  const queryKey = params?.toString() ?? "";
  const activeId = overrideId && overrideId.key === queryKey ? overrideId.value : queryDocId;

  const statusOptions = useMemo(() => buildStatusOptions(config.documents), [config.documents]);

  const visibleDocuments = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return config.documents.filter((doc) => {
      const customer = findCustomer(doc.customerId);
      const matchesSearch =
        lower.length === 0 ||
        doc.number.toLowerCase().includes(lower) ||
        (customer?.legalName ?? "").toLowerCase().includes(lower) ||
        (customer?.legalNameAr ?? "").toLowerCase().includes(lower);
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [config.documents, search, statusFilter]);

  const activeDocument = activeId ? config.documents.find((doc) => doc.id === activeId) ?? null : null;

  const setCols = (next: string[]) => {
    setVisibleColIds(next);
    saveColumnVisibility(REG_ID, next);
  };

  const closePreview = () => {
    const next = new URLSearchParams(params?.toString() ?? "");
    next.delete("doc");
    setOverrideId({ value: null, key: next.toString() });
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const openPreview = (docId: string) => {
    const next = new URLSearchParams(params?.toString() ?? "");
    next.set("doc", docId);
    setOverrideId({ value: docId, key: next.toString() });
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const vset = new Set(visibleColIds);
  const show = (id: string) => vset.has(id);

  return (
    <div
      className="wsv2-register-with-preview"
      data-preview-open={activeDocument ? "true" : "false"}
    >
      <div className="wsv2-register-primary">
        <div className="wsv2-page-header">
          <div>
            <h1 className="wsv2-page-title">{config.title}</h1>
            <p className="wsv2-page-subtitle">{config.subtitle}</p>
          </div>
          <div className="wsv2-page-actions">
            <button
              type="button"
              className="wsv2-btn"
              disabled
              title="Preview mode only — new document creation is not connected in this V2 build."
            >
              <Plus size={13} />
              {config.createLabel}
            </button>
          </div>
        </div>

        <WorkspaceSuggestion
          id={config.suggestionId}
          tone="primary"
          title={config.suggestionTitle}
          description={config.suggestionDescription}
        />

        <div className="wsv2-card" style={{ marginTop: 14 }}>
          <WorkspaceRegisterToolbar
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={statusOptions}
            totalShown={visibleDocuments.length}
            totalAll={config.documents.length}
            columnPicker={
              <WorkspaceColumnPicker
                columns={DOC_COLUMNS}
                visibleIds={visibleColIds}
                onChange={setCols}
              />
            }
          />
          <div className="wsv2-table-scroll">
            {visibleDocuments.length === 0 ? (
              <WorkspaceEmptyState
                title={config.emptyTitle}
                description={config.emptyDescription}
              />
            ) : (
              <table className="wsv2-table">
                <thead>
                  <tr>
                    {show("number") ? <th>Document No.</th> : null}
                    {show("customer") ? <th className="wsv2-cell-desc">Customer</th> : null}
                    {show("issue") ? <th>Issue date</th> : null}
                    {show("due") ? <th>Due date</th> : null}
                    {show("status") ? <th>Status</th> : null}
                    {show("vat") ? <th className="num">VAT</th> : null}
                    {show("total") ? <th className="num">Total</th> : null}
                    {show("balance") ? <th className="num">Balance</th> : null}
                    {show("actions") ? <th style={{ textAlign: "right" }}>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {visibleDocuments.map((doc) => {
                    const customer = findCustomer(doc.customerId);
                    return (
                      <tr
                        key={doc.id}
                        data-selected={doc.id === activeId ? "true" : "false"}
                        onClick={() => openPreview(doc.id)}
                      >
                        {show("number") ? (
                          <td style={{ fontWeight: 600 }}>{doc.number}</td>
                        ) : null}
                        {show("customer") ? (
                          <td className="wsv2-cell-desc">
                            <div style={{ fontWeight: 500 }}>{customer?.legalName ?? "—"}</div>
                            <div style={{ fontSize: 11.5, color: "var(--wsv2-ink-subtle)" }}>
                              {customer?.city ?? ""}
                            </div>
                          </td>
                        ) : null}
                        {show("issue") ? <td>{formatDate(doc.issueDate)}</td> : null}
                        {show("due") ? <td>{formatDate(doc.dueDate)}</td> : null}
                        {show("status") ? (
                          <td>
                            <span className="wsv2-pill" data-tone={statusTone(doc.status)}>
                              <span className="wsv2-status-dot" /> {statusLabel(doc.status)}
                            </span>
                          </td>
                        ) : null}
                        {show("vat") ? <td className="num">{formatCurrency(doc.vat)}</td> : null}
                        {show("total") ? <td className="num">{formatCurrency(doc.total)}</td> : null}
                        {show("balance") ? <td className="num">{formatCurrency(doc.balance)}</td> : null}
                        {show("actions") ? (
                          <td>
                            <div className="actions" onClick={(event) => event.stopPropagation()}>
                              <button
                                type="button"
                                className="wsv2-icon-btn"
                                aria-label={`Preview ${doc.number}`}
                                onClick={() => openPreview(doc.id)}
                              >
                                <Eye size={13} />
                              </button>
                              <WorkspaceMoreActions
                                actions={[
                                  { id: "duplicate", label: "Duplicate document" },
                                  { id: "history", label: "View change history" },
                                  { id: "credit-note", label: "Create credit note" },
                                  { id: "open-full", label: "Open full preview" },
                                ]}
                              />
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {activeDocument ? (
        <div className="wsv2-preview-dock" aria-label="Document preview">
          <WorkspacePreviewPanel
            document={activeDocument}
            onClose={closePreview}
            layout="split"
          />
        </div>
      ) : null}
    </div>
  );
}
