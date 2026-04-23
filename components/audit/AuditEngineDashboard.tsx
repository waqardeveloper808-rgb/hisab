"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import type { AuditRequest, AuditSummary, ControlEvaluationResult, AuditScopeKind, AuditSeverity } from "@/lib/audit-engine";

type RunResponse = {
  audit_id: string;
  summary: AuditSummary;
  control_results: ControlEvaluationResult[];
};

function badgeClass(status: string) {
  if (status === "pass" || status === "passed") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "fail" || status === "failed") return "border-red-200 bg-red-50 text-red-800";
  if (status === "blocked") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "warning") return "border-yellow-200 bg-yellow-50 text-yellow-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function ScopeControl({ value, onChange }: { value: AuditScopeKind; onChange: (scope: AuditScopeKind) => void }) {
  const options: AuditScopeKind[] = ["full_system", "module", "route", "workflow", "selected_controls"];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${value === option ? "border-primary bg-primary text-white" : "border-line bg-white text-muted"}`}
        >
          {option.replaceAll("_", " ")}
        </button>
      ))}
    </div>
  );
}

export function AuditEngineDashboard() {
  const [scope, setScope] = useState<AuditScopeKind>("full_system");
  const [module, setModule] = useState("");
  const [routePattern, setRoutePattern] = useState("");
  const [workflowIdentifier, setWorkflowIdentifier] = useState("");
  const [controlIds, setControlIds] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [results, setResults] = useState<ControlEvaluationResult[]>([]);
  const [selected, setSelected] = useState<ControlEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadLatest() {
    const response = await fetch("/api/audit/summary", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json() as { summary?: AuditSummary | null };
    if (payload.summary) setSummary(payload.summary);
  }

  useEffect(() => {
    void loadLatest();
  }, []);

  const severityOptions: AuditSeverity[] = ["critical", "high", "medium", "low", "info"];

  const requestPayload = useMemo<AuditRequest>(() => ({
    scope,
    module: module.trim() || undefined,
    route_pattern: routePattern.trim() || undefined,
    workflow_identifier: workflowIdentifier.trim() || undefined,
    control_ids: controlIds.split(",").map((value) => value.trim()).filter(Boolean),
    severity_filter: severityFilter ? [severityFilter as AuditSeverity] : undefined,
  }), [scope, module, routePattern, workflowIdentifier, controlIds, severityFilter]);

  async function runAudit() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/audit/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: requestPayload }),
      });
      const payload = await response.json() as RunResponse | { error?: string };
      if (!response.ok || !("summary" in payload)) {
        throw new Error(("error" in payload && payload.error) || "Audit run failed.");
      }
      setSummary(payload.summary);
      setResults(payload.control_results);
      setSelected(payload.control_results[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit run failed.");
    } finally {
      setLoading(false);
    }
  }

  const summaryPills = [
    ["Evaluated", summary?.total_controls_evaluated ?? 0],
    ["Pass", summary?.pass_count ?? 0],
    ["Fail", summary?.fail_count ?? 0],
    ["Blocked", summary?.blocked_count ?? 0],
    ["Warning", summary?.warning_count ?? 0],
    ["Not executable", summary?.not_executable_count ?? 0],
    ["Evidence gaps", summary?.evidence_gap_count ?? 0],
    ["Anti-cheat fails", summary?.anti_cheat_failure_count ?? 0],
    ["Cross mismatches", summary?.cross_module_mismatch_count ?? 0],
  ] as const;

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border-white/70 bg-white/95 p-4 shadow-[0_20px_42px_-30px_rgba(18,28,20,0.25)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Audit Engine</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Deterministic Control Evaluation</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">This surface runs the hardened control-point registry, surfaces evidence gaps, rejects anti-cheat failures, and keeps blocked outcomes visible instead of converting them into false passes.</p>
      </Card>

      <Card className="rounded-xl bg-white/95 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <ScopeControl value={scope} onChange={setScope} />
          <select value={module} onChange={(event) => setModule(event.target.value)} className="h-9 rounded-lg border border-line bg-white px-3 text-sm text-ink">
            <option value="">All modules</option>
            {["governance", "workspace", "ux", "document_engine", "template_engine", "preview_engine", "compliance", "accounting", "vat", "reporting", "inventory", "reconciliation", "intelligence", "hr", "attendance", "payroll"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} className="h-9 rounded-lg border border-line bg-white px-3 text-sm text-ink">
            <option value="">All severities</option>
            {severityOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input value={routePattern} onChange={(event) => setRoutePattern(event.target.value)} placeholder="Route pattern" className="h-9 min-w-[12rem] rounded-lg border border-line px-3 text-sm text-ink" />
          <input value={workflowIdentifier} onChange={(event) => setWorkflowIdentifier(event.target.value)} placeholder="Workflow identifier" className="h-9 min-w-[12rem] rounded-lg border border-line px-3 text-sm text-ink" />
          <input value={controlIds} onChange={(event) => setControlIds(event.target.value)} placeholder="Control IDs, comma separated" className="h-9 min-w-[18rem] flex-1 rounded-lg border border-line px-3 text-sm text-ink" />
          <Button size="xs" variant="primary" onClick={() => void runAudit()} disabled={loading}>{loading ? "Running..." : "Run audit"}</Button>
        </div>
        {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
      </Card>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
        {summaryPills.map(([label, value]) => (
          <Card key={label} className="rounded-xl bg-white/95 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
          </Card>
        ))}
      </div>

      {summary ? (
        <Card className="rounded-xl bg-white/95 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">Session {summary.audit_id}</p>
              <p className="text-xs text-muted">Overall status: {summary.overall_status}</p>
            </div>
            <div className="flex gap-2 text-xs">
              {summary.module_breakdown.map((item) => (
                <span key={item.module} className={`rounded-full border px-3 py-1 font-semibold uppercase tracking-[0.12em] ${badgeClass(item.status)}`}>{item.module}: {item.status}</span>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-xl bg-white/95 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">Control Results</p>
              <p className="text-xs text-muted">{results.length} results returned by the new engine.</p>
            </div>
          </div>
          <div className="mt-3 max-h-[65vh] space-y-2 overflow-y-auto pr-1">
            {results.map((result) => (
              <button
                key={`${result.audit_id}-${result.control_id}`}
                type="button"
                onClick={() => setSelected(result)}
                className={`w-full rounded-xl border p-3 text-left transition ${selected?.control_id === result.control_id ? "border-primary bg-primary-soft/25" : "border-line bg-white hover:border-primary/30"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{result.control_id} {result.title}</p>
                    <p className="text-xs text-muted">{result.module} · {result.validation_method} · {result.corrective_action_type}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${badgeClass(result.result_status)}`}>{result.result_status}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{result.human_summary}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                  <span>Evidence {result.evidence_status.evidence_quality_status}</span>
                  <span>Anti-cheat {result.anti_cheat_result.status}</span>
                  <span>Cross-validation {result.cross_validation_result.status}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="rounded-xl bg-white/95 p-4">
          <p className="text-sm font-semibold text-ink">Control Detail</p>
          {selected ? (
            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-line bg-surface-soft/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Expected state</p>
                <p className="mt-1 text-xs leading-5 text-ink">{selected.expected_state_result.result ? "Satisfied" : "Not satisfied"}</p>
                <pre className="mt-2 overflow-auto text-[10px] text-muted">{JSON.stringify(selected.expected_state_result.trace, null, 2)}</pre>
              </div>
              <div className="rounded-xl border border-line bg-surface-soft/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Failure condition</p>
                <p className="mt-1 text-xs leading-5 text-ink">{selected.failure_condition_result.result ? "Triggered" : "Not triggered"}</p>
                <pre className="mt-2 overflow-auto text-[10px] text-muted">{JSON.stringify(selected.failure_condition_result.trace, null, 2)}</pre>
              </div>
              <div className="rounded-xl border border-line bg-surface-soft/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Evidence</p>
                <p className="mt-1 text-xs text-ink">Found: {selected.evidence_status.evidence_items_found.join(", ") || "none"}</p>
                <p className="mt-1 text-xs text-ink">Missing: {selected.evidence_status.evidence_items_missing.join(", ") || "none"}</p>
                <p className="mt-1 text-xs text-ink">Traceable: {selected.evidence_status.evidence_traceable ? "yes" : "no"}</p>
                <p className="mt-1 text-xs text-ink">Quality: {selected.evidence_status.evidence_quality_status}</p>
                {selected.evidence_status.evidence_rejection_reason ? <p className="mt-1 text-xs text-red-700">{selected.evidence_status.evidence_rejection_reason}</p> : null}
              </div>
              <div className="rounded-xl border border-line bg-surface-soft/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Anti-cheat</p>
                <p className="mt-1 text-xs text-ink">{selected.anti_cheat_result.status}</p>
                <ul className="mt-2 space-y-1 text-xs text-ink">
                  {selected.anti_cheat_result.flags.map((flag) => <li key={flag}>{flag}</li>)}
                </ul>
              </div>
              <div className="rounded-xl border border-line bg-surface-soft/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Cross-validation</p>
                <p className="mt-1 text-xs text-ink">{selected.cross_validation_result.status}</p>
                <p className="mt-1 text-xs text-muted">Required: {selected.cross_validation_result.required_sources.join(", ") || "none"}</p>
                <p className="mt-1 text-xs text-muted">Missing: {selected.cross_validation_result.inaccessible_sources.join(", ") || "none"}</p>
                <p className="mt-1 text-xs text-muted">Mismatch: {selected.cross_validation_result.mismatched_sources.join(", ") || "none"}</p>
              </div>
              <div className="rounded-xl border border-line bg-surface-soft/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Measurable fields</p>
                <pre className="mt-2 overflow-auto text-[10px] text-muted">{JSON.stringify(selected.measurable_field_values, null, 2)}</pre>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-xl border border-line bg-surface-soft/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Likely root cause</p>
                  <ul className="mt-2 space-y-1 text-xs text-ink">
                    {selected.likely_root_cause_zones.map((zone) => <li key={zone}>{zone}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border border-line bg-surface-soft/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Retest</p>
                  <p className="mt-2 text-xs text-ink">{selected.retest_requirement}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">Select a control result to inspect evidence, anti-cheat status, and correction hooks.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
