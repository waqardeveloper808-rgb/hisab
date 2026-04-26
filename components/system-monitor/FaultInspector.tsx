"use client";

import { useState } from "react";
import type { SystemMonitorControlPoint } from "@/lib/audit-engine/monitor-types";

function badgeClass(sev: string) {
  if (sev === "critical") return "bg-red-600 text-white";
  if (sev === "high") return "bg-orange-500 text-white";
  if (sev === "medium") return "bg-amber-400 text-ink";
  return "bg-slate-200 text-ink";
}

function LinkedLine({ k, v }: { k: string; v: string }) {
  return (
    <p className="text-xs text-ink">
      <span className="font-semibold text-muted">{k}:</span> {v}
    </p>
  );
}

export function FaultInspector({ point }: { point: SystemMonitorControlPoint }) {
  const [open, setOpen] = useState(false);
  const root =
    point.root_cause_hint ||
    (point.status !== "pass" ? "Review engine expected vs actual behavior below." : "No open fault.");

  return (
    <div
      className="rounded-xl border border-line bg-surface-soft/50"
      data-inspector-fault={point.id}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
        data-inspector-fault-toggle={point.id}
      >
        <span className="mt-0.5 text-muted" aria-hidden>
          {open ? "▼" : "▶"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{point.title}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            {point.module} / {point.sub_module} — {point.status}
          </p>
        </div>
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${badgeClass(point.severity)}`}>
          {point.severity}
        </span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-line px-3 py-3" data-inspector-fault-body={point.id}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Root cause (derived)</p>
            <p className="mt-1 text-sm text-ink">{root}</p>
            {point.link_missing ? (
              <p className="mt-2 text-xs font-semibold text-red-700">CRITICAL: required accounting / VAT / inventory linkage missing in engine evidence.</p>
            ) : null}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Expected behavior</p>
            <p className="mt-1 text-sm text-ink">{point.expected_behavior}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Actual behavior (engine)</p>
            <p className="mt-1 text-sm text-ink">{point.actual_behavior}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Traceability</p>
            <ul className="mt-1 list-inside list-disc text-sm text-ink">
              {point.traceability.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Linked records</p>
            <div className="mt-1 space-y-0.5">
              {point.linked_entities.invoice_id ? (
                <LinkedLine k="Invoice" v={`#${point.linked_entities.invoice_id}`} />
              ) : (
                <p className="text-xs text-muted">Invoice — not linked in snapshot</p>
              )}
              {point.linked_entities.journal_id ? <LinkedLine k="Journal" v={`#${point.linked_entities.journal_id}`} /> : null}
              {point.linked_entities.vat_entry_id ? <LinkedLine k="VAT entry" v={`#${point.linked_entities.vat_entry_id}`} /> : null}
              {point.linked_entities.product_id ? <LinkedLine k="Product" v={`#${point.linked_entities.product_id}`} /> : null}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Evidence (JSON preview)</p>
            <pre className="mt-1 max-h-40 overflow-auto rounded-lg border border-line bg-white p-2 text-[11px] leading-relaxed text-ink">
              {JSON.stringify({ evidence: point.evidence, module_code: point.module_code, id: point.id, timestamp: point.timestamp }, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
