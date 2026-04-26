"use client";

import { useEffect, useMemo, useState } from "react";
import { listAuditTrail, type AuditTrailEventRecord } from "@/lib/workspace-api";

type AuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  action: AuditAction;
  detail: string;
  metadata?: Record<string, string | number | boolean | null>;
};

type AuditAction =
  | "created"
  | "edited"
  | "status_changed"
  | "sent"
  | "payment_applied"
  | "payment_removed"
  | "locked"
  | "cancelled"
  | "zatca_reported"
  | "zatca_cleared"
  | "pdf_generated"
  | "template_changed"
  | "note_added"
  | "line_added"
  | "line_removed"
  | "line_edited"
  | "contact_changed"
  | "restored";

const actionConfig: Record<AuditAction, { label: string; icon: string; color: string }> = {
  created: { label: "Created", icon: "✦", color: "#3FAE2A" },
  edited: { label: "Edited", icon: "✎", color: "#5c6f66" },
  status_changed: { label: "Status changed", icon: "⟳", color: "#2563eb" },
  sent: { label: "Sent", icon: "↗", color: "#3FAE2A" },
  payment_applied: { label: "Payment applied", icon: "₪", color: "#15803d" },
  payment_removed: { label: "Payment removed", icon: "⊘", color: "#dc2626" },
  locked: { label: "Locked", icon: "🔒", color: "#92400e" },
  cancelled: { label: "Cancelled", icon: "×", color: "#dc2626" },
  zatca_reported: { label: "ZATCA reported", icon: "☑", color: "#3FAE2A" },
  zatca_cleared: { label: "ZATCA cleared", icon: "☑", color: "#15803d" },
  pdf_generated: { label: "PDF generated", icon: "⎙", color: "#5c6f66" },
  template_changed: { label: "Template changed", icon: "⊞", color: "#7c3aed" },
  note_added: { label: "Note added", icon: "✐", color: "#5c6f66" },
  line_added: { label: "Line added", icon: "+", color: "#3FAE2A" },
  line_removed: { label: "Line removed", icon: "−", color: "#dc2626" },
  line_edited: { label: "Line edited", icon: "✎", color: "#5c6f66" },
  contact_changed: { label: "Contact changed", icon: "⇄", color: "#2563eb" },
  restored: { label: "Restored", icon: "↺", color: "#7c3aed" },
};

function mapAuditEvent(record: AuditTrailEventRecord, documentType: string, status: string): AuditEvent {
  const event = record.event.toLowerCase();
  let action: AuditAction = "edited";

  if (event.includes("created")) action = "created";
  else if (event.includes("finalized") || event.includes("status")) action = "status_changed";
  else if (event.includes("payment")) action = "payment_applied";
  else if (event.includes("send")) action = "sent";
  else if (event.includes("zatca") || (documentType === "tax_invoice" && status !== "draft")) action = "zatca_reported";

  return {
    id: String(record.id),
    timestamp: record.createdAt,
    actor: String(record.metadata?.recorded_by ?? record.metadata?.created_by_name ?? (record.auditableType.includes("Payment") ? "Finance" : "Workspace User")),
    action,
    detail: record.detail,
    metadata: (record.metadata as Record<string, string | number | boolean | null> | null) ?? undefined,
  };
}

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  const day = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return { day, time };
}

function formatMetadata(metadata: Record<string, string | number | boolean | null> | undefined) {
  if (!metadata) {
    return [] as string[];
  }

  return [
    metadata.linked_chain ? `Chain: ${metadata.linked_chain}` : null,
    metadata.journal_entry_reference ? `Journal: ${metadata.journal_entry_reference}` : null,
    metadata.payment_status ? `Payment: ${metadata.payment_status}` : null,
    metadata.temporary_accounting_reference ? `Temp ref: ${metadata.temporary_accounting_reference}` : null,
    metadata.vat_decision_summary ? `VAT: ${metadata.vat_decision_summary}` : null,
  ].filter(Boolean) as string[];
}

type AuditTrailPanelProps = {
  documentId: number;
  documentType: string;
  documentStatus: string;
};

export function AuditTrailPanel({ documentId, documentType, documentStatus }: AuditTrailPanelProps) {
  const [filterAction, setFilterAction] = useState<string>("all");
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAuditTrail() {
      setLoading(true);

      await listAuditTrail()
      .then((rows) => {
        if (!active) {
          return;
        }

        const filteredRows = rows
          .filter((row) => row.auditableId === documentId || String(row.detail).includes(String(documentId)))
          .map((row) => mapAuditEvent(row, documentType, documentStatus))
          .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());

        setEvents(filteredRows);
      })
      .catch((err: unknown) => {
        console.error('[AuditTrailPanel] failed to load audit trail:', err);
        if (active) {
          setEvents([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    }

    void loadAuditTrail();

    return () => {
      active = false;
    };
  }, [documentId, documentStatus, documentType]);

  const filtered = useMemo(
    () => (filterAction === "all" ? events : events.filter((e) => e.action === filterAction)),
    [events, filterAction],
  );

  const uniqueActions = useMemo(() => [...new Set(events.map((e) => e.action))], [events]);

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">Audit Trail</h3>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="h-7 rounded-[var(--radius-sm)] border border-line bg-white px-2 text-xs text-ink-secondary"
        >
          <option value="all">All events</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>
              {actionConfig[action]?.label ?? action}
            </option>
          ))}
        </select>
      </div>

      {loading ? <p className="text-xs text-ink-secondary">Loading audit trail…</p> : null}

      <div className="overflow-hidden rounded-lg border border-line">
        <div className="grid grid-cols-[minmax(0,9rem)_minmax(0,8rem)_minmax(0,1fr)_minmax(0,9rem)] gap-2 border-b border-line bg-surface-soft/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
          <span>When</span>
          <span>Event</span>
          <span>Record</span>
          <span className="text-right">Actor</span>
        </div>
        {filtered.map((event, index) => {
          const config = actionConfig[event.action] ?? { label: event.action, icon: "•", color: "#5c6f66" };
          const { day, time } = formatTimestamp(event.timestamp);
          const metadataLines = formatMetadata(event.metadata);

          return (
            <div key={event.id} className={[
              "grid grid-cols-[minmax(0,9rem)_minmax(0,8rem)_minmax(0,1fr)_minmax(0,9rem)] gap-2 border-t border-line/60 px-2 py-1.5 text-xs",
              index % 2 === 0 ? "bg-white" : "bg-surface-soft/25",
            ].join(" ")}>
              <div className="text-[11px] leading-5 text-muted">{day}<br />{time}</div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: config.color }}>
                <span>{config.icon}</span>
                <span>{config.label}</span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] leading-5 text-ink-secondary">{event.detail}</p>
                {metadataLines.length ? <p className="truncate text-[10px] text-subtle">{metadataLines.join(" · ")}</p> : null}
              </div>
              <div className="truncate text-right text-[11px] text-subtle">{event.actor}</div>
            </div>
          );
        })}
        {filtered.length === 0 ? <p className="px-2 py-3 text-center text-xs text-ink-secondary">No events match the selected filter.</p> : null}
      </div>
    </div>
  );
}
