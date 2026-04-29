"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Plus } from "lucide-react";
import type { DocumentRecord, DocumentStatus } from "@/lib/workspace/types";
import { findCustomer } from "@/data/workspace/customers";
import { formatCurrency, formatDate, statusLabel, statusTone } from "@/lib/workspace/format";
import { loadColumnVisibility, saveColumnVisibility } from "@/lib/workspace/register-column-storage";
import { useRegisterTableLayout, type RegisterColumnWidthDef } from "@/lib/workspace/register-table-layout";
import { RegisterTableHeaderCell } from "@/components/workspace/RegisterTableHeaderCell";
import { WorkspaceRegisterToolbar, type StatusFilterOption } from "./WorkspaceRegisterToolbar";
import { WorkspacePreviewPanel } from "./WorkspacePreviewPanel";
import { WorkspaceEmptyState } from "./WorkspaceEmptyState";
import { WorkspaceSuggestion } from "./WorkspaceSuggestion";
import { WorkspaceMoreActions } from "./WorkspaceMoreActions";
import { WorkspaceColumnPicker, type ColumnDef } from "./WorkspaceColumnPicker";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { mapWorkspaceHref } from "@/lib/workspace-path";

type RegisterConfig = {
  title: string;
  subtitle: string;
  documents: DocumentRecord[];
  createLabel: string;
  /** If set, header “create” navigates to the document composer (preview registers are read-only listings). */
  createDocumentHref?: string;
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

const DOC_WIDTH_DEFS: RegisterColumnWidthDef[] = [
  { id: "number", defaultWidth: 130 },
  { id: "customer", defaultWidth: 220 },
  { id: "issue", defaultWidth: 110 },
  { id: "due", defaultWidth: 110 },
  { id: "status", defaultWidth: 120 },
  { id: "vat", defaultWidth: 100 },
  { id: "total", defaultWidth: 110 },
  { id: "balance", defaultWidth: 110 },
  { id: "actions", defaultWidth: 100 },
];

const DOC_HEADER: Record<string, string> = {
  number: "Document No.",
  customer: "Customer",
  issue: "Issue date",
  due: "Due date",
  status: "Status",
  vat: "VAT",
  total: "Total",
  balance: "Balance",
  actions: "Actions",
};

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
  const { basePath } = useWorkspacePath();
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

  const visibleOrderedIds = useMemo(
    () => DOC_COLUMNS.map((c) => c.id).filter((id) => visibleColIds.includes(id)),
    [visibleColIds],
  );
  const { wrapRef, colPercents, beginResizePair } = useRegisterTableLayout("v2.register.documents", DOC_WIDTH_DEFS, visibleOrderedIds);
  const pctById = useMemo(() => Object.fromEntries(colPercents.map((c) => [c.id, c.percent])), [colPercents]);

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
            {config.createDocumentHref ? (
              <Link
                href={mapWorkspaceHref(config.createDocumentHref, basePath)}
                className="wsv2-btn inline-flex items-center gap-1.5"
                title={`Open ${config.createLabel.replace(/^New\s+/i, "").trim()} composer`}
              >
                <Plus size={13} aria-hidden />
                {config.createLabel}
              </Link>
            ) : (
              <button type="button" className="wsv2-btn" disabled title="Create URL not configured for this register.">
                <Plus size={13} />
                {config.createLabel}
              </button>
            )}
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
          <div ref={wrapRef} className="wsv2-table-scroll" data-register-table="true">
            {visibleDocuments.length === 0 ? (
              <WorkspaceEmptyState
                title={config.emptyTitle}
                description={config.emptyDescription}
              />
            ) : (
              <table className="wsv2-table">
                <colgroup>
                  {visibleOrderedIds.map((id) => (
                    <col key={id} style={{ width: `${pctById[id] ?? 100 / visibleOrderedIds.length}%` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    {visibleOrderedIds.map((colId, idx) => (
                      <RegisterTableHeaderCell
                        key={colId}
                        align={colId === "actions" || /total|balance|vat/i.test(colId) ? "right" : "left"}
                        className={["vat", "total", "balance"].includes(colId) ? "num" : colId === "customer" ? "wsv2-cell-desc" : ""}
                        onResizePointerDown={idx < visibleOrderedIds.length - 1 ? (x) => beginResizePair(idx, x) : undefined}
                      >
                        {DOC_HEADER[colId] ?? colId}
                      </RegisterTableHeaderCell>
                    ))}
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
                        {visibleOrderedIds.map((colId) => {
                          if (colId === "number") {
                            return (
                              <td key={colId} style={{ fontWeight: 600 }}>
                                {doc.number}
                              </td>
                            );
                          }
                          if (colId === "customer") {
                            return (
                              <td key={colId} className="wsv2-cell-desc">
                                <div style={{ fontWeight: 500 }}>{customer?.legalName ?? "—"}</div>
                                <div style={{ fontSize: 11.5, color: "var(--wsv2-ink-subtle)" }}>{customer?.city ?? ""}</div>
                              </td>
                            );
                          }
                          if (colId === "issue") return <td key={colId}>{formatDate(doc.issueDate)}</td>;
                          if (colId === "due") return <td key={colId}>{formatDate(doc.dueDate)}</td>;
                          if (colId === "status") {
                            return (
                              <td key={colId}>
                                <span className="wsv2-pill" data-tone={statusTone(doc.status)}>
                                  <span className="wsv2-status-dot" /> {statusLabel(doc.status)}
                                </span>
                              </td>
                            );
                          }
                          if (colId === "vat") return <td key={colId} className="num">{formatCurrency(doc.vat)}</td>;
                          if (colId === "total") return <td key={colId} className="num">{formatCurrency(doc.total)}</td>;
                          if (colId === "balance") return <td key={colId} className="num">{formatCurrency(doc.balance)}</td>;
                          if (colId === "actions") {
                            return (
                              <td key={colId}>
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
                            );
                          }
                          return <td key={colId}>—</td>;
                        })}
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
