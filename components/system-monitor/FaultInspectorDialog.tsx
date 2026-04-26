"use client";

import type { SystemMonitorControlPoint } from "@/lib/audit-engine/monitor-types";
import { copyFaultText } from "@/lib/audit-engine/summary";

function na(v: string | null | undefined) {
  if (v == null || String(v).trim() === "") return "Not available";
  return v;
}

export function FaultInspectorDialog({
  point,
  open,
  onClose,
  onCopied,
}: {
  point: SystemMonitorControlPoint | null;
  open: boolean;
  onClose: () => void;
  onCopied: (label: string) => void;
}) {
  if (!open || !point) return null;

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onCopied(label);
    } catch {
      onCopied("Copy failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-line bg-white p-5 shadow-lg sm:rounded-2xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Control point</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">{point.title}</h2>
            <p className="mt-1 text-xs text-muted">ID: {point.id}</p>
          </div>
          <button type="button" className="rounded-lg border border-line px-2 py-1 text-sm font-semibold text-ink" onClick={onClose}>
            Close
          </button>
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          {[
            ["Status", point.status],
            ["Severity", point.severity],
            ["Module (domain)", point.module],
            ["Sub-module", point.sub_module],
            ["Module code", point.module_code],
            ["Expected result", point.expected_behavior],
            ["Actual result", point.actual_behavior],
            ["Root cause", na(point.root_cause_hint)],
            ["Evidence method", point.evaluation_method],
            ["Evidence source (refs)", point.evidence_references.length ? point.evidence_references.join("\n") : "Not available"],
            ["Evidence timestamp", point.timestamp],
            ["Related route / file (refs)", point.evidence_references.slice(0, 6).join("; ") || "Not available"],
            ["Linked entity / source document", point.source_standard_document || "Not available"],
            ["Recommended next action / fix scope (nonconformity)", point.recommended_next_action || "Not available"],
            ["Link integrity", point.link_missing ? "link_missing" : "ok"],
          ].map(([k, v]) => (
            <div key={k} className="grid gap-1 sm:grid-cols-[140px_1fr]">
              <dt className="text-xs font-semibold text-muted">{k}</dt>
              <dd className="whitespace-pre-wrap text-ink">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Evidence (JSON)</p>
          <pre className="max-h-48 overflow-auto rounded-lg border border-line bg-surface-soft p-2 text-[11px]">
            {JSON.stringify(point.evidence, null, 2)}
          </pre>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-line bg-surface-soft px-3 py-1.5 text-xs font-semibold"
            onClick={() => void copy("Fault", copyFaultText(point))}
          >
            Copy this fault
          </button>
          <button
            type="button"
            className="rounded-lg border border-line bg-surface-soft px-3 py-1.5 text-xs font-semibold"
            onClick={() => void copy("Evidence", JSON.stringify(point.evidence, null, 2))}
          >
            Copy evidence
          </button>
          <button
            type="button"
            className="rounded-lg border border-line bg-surface-soft px-3 py-1.5 text-xs font-semibold"
            onClick={() => void copy("Recommended", point.recommended_next_action || "Not available")}
          >
            Copy recommended fix
          </button>
        </div>
      </div>
    </div>
  );
}
