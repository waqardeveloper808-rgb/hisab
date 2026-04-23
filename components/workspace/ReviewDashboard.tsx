"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import type {
  AuditFinding,
  AuditOverviewKpis,
  AuditRun,
  ModuleHealthEntry,
  RouteHealthEntry,
  FindingSeverity,
  FindingStatus,
  FindingCategory,
  AuditModule,
  PromptMode,
} from "@/lib/audit-types";
import { CATEGORY_LABELS, MODULE_LABELS, SEVERITY_WEIGHT } from "@/lib/audit-types";
import {
  readAuditStore,
  computeOverviewKpis,
  getFindings,
  updateFindingStatus,
  getAuditRuns,
  getRouteHealth,
  getModuleHealth,
  addPrompt,
} from "@/lib/audit-store";
import { runFullAudit, exportAuditData } from "@/lib/audit-runner";
import { generatePromptForFinding, generateModuleRemediationPlan, generateFullAuditReport } from "@/lib/audit-prompt-generator";
import { generateLocalAuditSummary } from "@/lib/audit-model-adapter";

type Tab =
  | "overview"
  | "findings"
  | "modules"
  | "routes"
  | "density"
  | "documents"
  | "accounting"
  | "inventory"
  | "prompts"
  | "history"
  | "evidence";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "findings", label: "Findings" },
  { key: "modules", label: "Module Health" },
  { key: "routes", label: "Route Health" },
  { key: "density", label: "UI Density" },
  { key: "documents", label: "Document Engine" },
  { key: "accounting", label: "Accounting" },
  { key: "inventory", label: "Inventory / Purchase" },
  { key: "prompts", label: "Prompt Generator" },
  { key: "history", label: "Audit History" },
  { key: "evidence", label: "Evidence" },
];

function SeverityBadge({ severity }: { severity: FindingSeverity }) {
  const colors: Record<FindingSeverity, string> = {
    critical: "bg-red-100 text-red-800 border-red-200",
    major: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    minor: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${colors[severity]}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: FindingStatus }) {
  const colors: Record<FindingStatus, string> = {
    new: "bg-blue-100 text-blue-800",
    confirmed: "bg-purple-100 text-purple-800",
    in_progress: "bg-indigo-100 text-indigo-800",
    resolved: "bg-green-100 text-green-800",
    regression: "bg-red-100 text-red-800",
    ignored: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${colors[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function KpiChip({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 ${accent ? "border-red-200 bg-red-50" : "border-line bg-white"}`}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className={`text-lg font-bold ${accent ? "text-red-700" : "text-ink"}`}>{value}</p>
    </div>
  );
}

// ─── Overview Tab ───
function OverviewTab({ kpis, onRunAudit }: { kpis: AuditOverviewKpis; onRunAudit: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Audit Overview</h2>
        <Button size="xs" variant="primary" onClick={onRunAudit}>Run Full Audit</Button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiChip label="Open Findings" value={kpis.totalOpenFindings} accent={kpis.totalOpenFindings > 10} />
        <KpiChip label="Critical" value={kpis.criticalFindings} accent={kpis.criticalFindings > 0} />
        <KpiChip label="Major" value={kpis.majorFindings} accent={kpis.majorFindings > 5} />
        <KpiChip label="Regressions" value={kpis.regressions} accent={kpis.regressions > 0} />
        <KpiChip label="Placeholder Pages" value={kpis.placeholderPages} accent={kpis.placeholderPages > 5} />
        <KpiChip label="Broken Routes" value={kpis.brokenRoutes} />
        <KpiChip label="Doc Engine Issues" value={kpis.documentEngineIssues} />
        <KpiChip label="Accounting Issues" value={kpis.accountingEngineIssues} />
        <KpiChip label="Inventory Issues" value={kpis.inventoryIssues} />
        <KpiChip label="Last Audit" value={kpis.lastFullAuditAt ? new Date(kpis.lastFullAuditAt).toLocaleDateString() : "Never"} />
      </div>
    </div>
  );
}

// ─── Findings Tab ───
function FindingsTab({ findings, onStatusChange, onGeneratePrompt }: {
  findings: AuditFinding[];
  onStatusChange: (id: string, status: FindingStatus) => void;
  onGeneratePrompt: (finding: AuditFinding) => void;
}) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<FindingSeverity | "">("");
  const [categoryFilter, setCategoryFilter] = useState<FindingCategory | "">("");
  const [statusFilter, setStatusFilter] = useState<FindingStatus | "">("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = findings;
    if (search) result = result.filter((f) => f.title.toLowerCase().includes(search.toLowerCase()) || f.route.toLowerCase().includes(search.toLowerCase()));
    if (severityFilter) result = result.filter((f) => f.severity === severityFilter);
    if (categoryFilter) result = result.filter((f) => f.category === categoryFilter);
    if (statusFilter) result = result.filter((f) => f.status === statusFilter);
    return result.sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]);
  }, [findings, search, severityFilter, categoryFilter, statusFilter]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Findings Registry ({findings.length})</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search findings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-line px-2 py-1 text-xs"
        />
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as FindingSeverity | "")} className="rounded border border-line px-2 py-1 text-xs">
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="major">Major</option>
          <option value="medium">Medium</option>
          <option value="minor">Minor</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as FindingCategory | "")} className="rounded border border-line px-2 py-1 text-xs">
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as FindingStatus | "")} className="rounded border border-line px-2 py-1 text-xs">
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="regression">Regression</option>
          <option value="ignored">Ignored</option>
        </select>
      </div>
      <div className="space-y-1">
        {filtered.map((f) => (
          <div key={f.id} className="rounded-md border border-line bg-white">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-surface-soft/30"
              onClick={() => setExpanded(expanded === f.id ? null : f.id)}
            >
              <SeverityBadge severity={f.severity} />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">{f.title}</span>
              <span className="shrink-0 text-[10px] text-muted">{MODULE_LABELS[f.module]}</span>
              <span className="shrink-0 text-[10px] text-muted">{f.route}</span>
              <StatusBadge status={f.status} />
            </button>
            {expanded === f.id && (
              <div className="border-t border-line px-2.5 py-2 space-y-1.5">
                <p className="text-xs text-ink">{f.description}</p>
                <p className="text-[10px] text-muted"><strong>Root Cause:</strong> {f.rootCause}</p>
                <div>
                  <p className="text-[10px] font-semibold text-muted mb-0.5">Suggested Fixes:</p>
                  <ul className="list-disc list-inside text-[10px] text-ink space-y-0.5">
                    {f.suggestedFixes.map((fix, i) => <li key={i}>{fix}</li>)}
                  </ul>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {f.status !== "resolved" && (
                    <Button size="xs" variant="secondary" onClick={() => onStatusChange(f.id, "resolved")}>Mark Resolved</Button>
                  )}
                  {f.status === "resolved" && (
                    <Button size="xs" variant="secondary" onClick={() => onStatusChange(f.id, "regression")}>Reopen</Button>
                  )}
                  {f.status !== "ignored" && (
                    <Button size="xs" variant="muted" onClick={() => onStatusChange(f.id, "ignored")}>Ignore</Button>
                  )}
                  <Button size="xs" variant="primary" onClick={() => onGeneratePrompt(f)}>Generate Prompt</Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="py-4 text-center text-xs text-muted">No findings match the current filters.</p>}
      </div>
    </div>
  );
}

// ─── Module Health Tab ───
function ModuleHealthTab({ modules }: { modules: ModuleHealthEntry[] }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-ink">Module Health</h2>
      <div className="space-y-1">
        {modules.map((m) => (
          <div key={m.module} className="flex items-center gap-2 rounded-md border border-line bg-white px-2.5 py-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink">{m.label}</p>
              <div className="flex gap-3 text-[10px] text-muted">
                <span>Status: <strong className={m.implementationStatus === "real" ? "text-green-700" : m.implementationStatus === "partial" ? "text-yellow-700" : "text-red-700"}>{m.implementationStatus}</strong></span>
                <span>Findings: {m.openFindings}</span>
                <span>Placeholders: {m.placeholderCount}</span>
                <span>Broken: {m.brokenRouteCount}</span>
                <span>Layout: {m.weakLayoutCount}</span>
                <span>Logic: {m.logicFlawCount}</span>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${m.score >= 80 ? "text-green-700" : m.score >= 50 ? "text-yellow-700" : "text-red-700"}`}>
                {m.score}
              </p>
              <p className="text-[9px] text-muted">score</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Route Health Tab ───
function RouteHealthTab({ routes }: { routes: RouteHealthEntry[] }) {
  const [filter, setFilter] = useState<"all" | "placeholder" | "broken" | "healthy">("all");
  const filtered = useMemo(() => {
    if (filter === "all") return routes;
    return routes.filter((r) => r.status === filter);
  }, [routes, filter]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Route Health ({routes.length} routes)</h2>
        <div className="flex gap-1">
          {(["all", "placeholder", "broken", "healthy"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded px-2 py-0.5 text-[10px] font-semibold ${filter === f ? "bg-primary text-white" : "bg-surface-soft text-muted hover:bg-surface-soft/80"}`}>
              {f === "all" ? `All (${routes.length})` : `${f} (${routes.filter((r) => r.status === f).length})`}
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-[60vh] overflow-y-auto space-y-0.5">
        {filtered.map((r) => (
          <div key={r.route} className="flex items-center gap-2 rounded border border-line bg-white px-2 py-1">
            <span className={`inline-block h-2 w-2 rounded-full ${r.status === "healthy" ? "bg-green-500" : r.status === "placeholder" ? "bg-yellow-500" : r.status === "broken" ? "bg-red-500" : "bg-gray-400"}`} />
            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-ink">{r.route}</span>
            <span className="text-[10px] text-muted">{MODULE_LABELS[r.module]}</span>
            <span className="text-[10px] text-muted">{r.owner}</span>
            {r.isPlaceholder && <span className="rounded bg-yellow-100 px-1 py-0.5 text-[9px] font-semibold text-yellow-800">placeholder</span>}
            {r.openFindings > 0 && <span className="rounded bg-red-100 px-1 py-0.5 text-[9px] font-semibold text-red-800">{r.openFindings} findings</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Density / Document / Accounting / Inventory Audit Tabs ───
function CategoryAuditTab({ title, category, findings }: { title: string; category: FindingCategory | FindingCategory[]; findings: AuditFinding[] }) {
  const cats = Array.isArray(category) ? category : [category];
  const filtered = findings.filter((f) => cats.includes(f.category));
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-ink">{title} ({filtered.length} findings)</h2>
      {filtered.length === 0 && <p className="text-xs text-muted">No findings in this category.</p>}
      <div className="space-y-1">
        {filtered.map((f) => (
          <div key={f.id} className="rounded-md border border-line bg-white px-2.5 py-1.5 space-y-0.5">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={f.severity} />
              <span className="text-xs font-medium text-ink">{f.title}</span>
            </div>
            <p className="text-[10px] text-muted">{f.route} — {f.description.substring(0, 150)}{f.description.length > 150 ? "..." : ""}</p>
            <div className="text-[10px] text-muted">
              <strong>Fix:</strong> {f.suggestedFixes[0]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Prompt Generator Tab ───
function PromptGeneratorTab({ findings, onPromptGenerated }: { findings: AuditFinding[]; onPromptGenerated: (prompt: string) => void }) {
  const [selectedFinding, setSelectedFinding] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<AuditModule | "">("");
  const [mode, setMode] = useState<PromptMode>("copilot");
  const [generated, setGenerated] = useState("");

  const handleGenerate = useCallback(() => {
    if (selectedFinding) {
      const finding = findings.find((f) => f.id === selectedFinding);
      if (finding) {
        const p = generatePromptForFinding(finding, mode);
        setGenerated(p.prompt);
        addPrompt(p);
        onPromptGenerated(p.prompt);
      }
    } else if (selectedModule) {
      const mod = selectedModule as AuditModule;
      const modFindings = findings.filter((f) => f.module === mod);
      const p = generateModuleRemediationPlan(mod, modFindings);
      setGenerated(p.prompt);
      addPrompt(p);
      onPromptGenerated(p.prompt);
    } else {
      const report = generateFullAuditReport(findings);
      setGenerated(report);
      onPromptGenerated(report);
    }
  }, [selectedFinding, selectedModule, mode, findings, onPromptGenerated]);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-ink">Prompt Generator</h2>
      <div className="flex flex-wrap gap-2">
        <select value={selectedFinding} onChange={(e) => { setSelectedFinding(e.target.value); setSelectedModule(""); }} className="rounded border border-line px-2 py-1 text-xs">
          <option value="">Select finding (or leave empty for module/full)</option>
          {findings.filter((f) => f.status !== "resolved").map((f) => <option key={f.id} value={f.id}>[{f.severity}] {f.title}</option>)}
        </select>
        {!selectedFinding && (
          <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value as AuditModule | "")} className="rounded border border-line px-2 py-1 text-xs">
            <option value="">Full project report</option>
            {Object.entries(MODULE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        )}
        <select value={mode} onChange={(e) => setMode(e.target.value as PromptMode)} className="rounded border border-line px-2 py-1 text-xs">
          <option value="copilot">Copilot Prompt</option>
          <option value="claude">Claude/GPT Review</option>
          <option value="internal_task">Internal Task</option>
          <option value="regression_retest">Regression Retest</option>
        </select>
        <Button size="xs" variant="primary" onClick={handleGenerate}>Generate</Button>
      </div>
      {generated && (
        <div className="rounded-md border border-line bg-surface-soft/30 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold uppercase text-muted">Generated Prompt</p>
            <button type="button" onClick={() => navigator.clipboard.writeText(generated)} className="text-[10px] font-semibold text-primary hover:underline">Copy</button>
          </div>
          <pre className="max-h-[40vh] overflow-auto whitespace-pre-wrap text-[11px] text-ink">{generated}</pre>
        </div>
      )}
    </div>
  );
}

// ─── History Tab ───
function HistoryTab({ runs }: { runs: AuditRun[] }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-ink">Audit History ({runs.length} runs)</h2>
      {runs.length === 0 && <p className="text-xs text-muted">No audit runs yet. Click &quot;Run Full Audit&quot; to start.</p>}
      <div className="space-y-1">
        {[...runs].reverse().map((r) => (
          <div key={r.id} className="flex items-center gap-2 rounded-md border border-line bg-white px-2.5 py-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${r.status === "completed" ? "bg-green-500" : r.status === "running" ? "bg-blue-500" : "bg-red-500"}`} />
            <span className="text-xs font-medium text-ink">{r.id}</span>
            <span className="text-[10px] text-muted">{r.scope}{r.scopeTarget ? `: ${r.scopeTarget}` : ""}</span>
            <span className="text-[10px] text-muted">{r.startedAt ? new Date(r.startedAt).toLocaleString() : ""}</span>
            <span className="text-[10px] text-muted">+{r.findingsCreated} findings</span>
            <span className="text-[10px] text-muted">{r.routesAudited} routes</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Evidence Tab ───
function EvidenceTab() {
  const store = readAuditStore();
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-ink">Evidence Viewer ({store.evidence.length} items)</h2>
      {store.evidence.length === 0 && <p className="text-xs text-muted">No evidence captured yet. Evidence is attached during audit runs and manual captures.</p>}
      <div className="space-y-1">
        {store.evidence.map((e) => (
          <div key={e.id} className="rounded-md border border-line bg-white px-2.5 py-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded bg-gray-100 px-1 py-0.5 text-[9px] font-semibold text-gray-600">{e.type}</span>
              <span className="text-xs font-medium text-ink">{e.label}</span>
              <span className="text-[10px] text-muted">{new Date(e.capturedAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Review Dashboard ───
export function ReviewDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [kpis, setKpis] = useState<AuditOverviewKpis>(() => computeOverviewKpis());
  const [findings, setFindings] = useState<AuditFinding[]>(() => getFindings());
  const [modules, setModules] = useState<ModuleHealthEntry[]>(() => getModuleHealth());
  const [routes, setRoutes] = useState<RouteHealthEntry[]>(() => getRouteHealth());
  const [runs, setRuns] = useState<AuditRun[]>(() => getAuditRuns());
  const [auditSummary, setAuditSummary] = useState("");

  const refresh = useCallback(() => {
    setKpis(computeOverviewKpis());
    setFindings(getFindings());
    setModules(getModuleHealth());
    setRoutes(getRouteHealth());
    setRuns(getAuditRuns());
  }, []);

  const handleRunAudit = useCallback(() => {
    runFullAudit();
    setAuditSummary(generateLocalAuditSummary(getFindings()));
    refresh();
  }, [refresh]);

  const handleStatusChange = useCallback((id: string, status: FindingStatus) => {
    updateFindingStatus(id, status);
    refresh();
  }, [refresh]);

  const handleGeneratePrompt = useCallback(() => {
    // Prompt is generated inline in the prompt tab
    setTab("prompts");
  }, []);

  const handleExport = useCallback(() => {
    const data = exportAuditData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gulf-hisab-audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-ink">AI Review Assistant</h1>
          <p className="text-[10px] text-muted">Internal audit layer — inspect, find flaws, generate corrections</p>
        </div>
        <div className="flex gap-1.5">
          <Button size="xs" variant="primary" onClick={handleRunAudit}>Run Full Audit</Button>
          <Button size="xs" variant="secondary" onClick={handleExport}>Export</Button>
          <Button size="xs" variant="muted" onClick={refresh}>Refresh</Button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-0.5 border-b border-line pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-t px-2.5 py-1 text-[10px] font-semibold transition ${
              tab === t.key ? "bg-white border border-b-0 border-line text-primary" : "text-muted hover:text-ink hover:bg-surface-soft/30"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary Banner */}
      {auditSummary && tab === "overview" && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
          <pre className="whitespace-pre-wrap text-[11px] text-blue-900">{auditSummary}</pre>
        </div>
      )}

      {/* Tab Content */}
      {tab === "overview" && <OverviewTab kpis={kpis} onRunAudit={handleRunAudit} />}
      {tab === "findings" && <FindingsTab findings={findings} onStatusChange={handleStatusChange} onGeneratePrompt={handleGeneratePrompt} />}
      {tab === "modules" && <ModuleHealthTab modules={modules} />}
      {tab === "routes" && <RouteHealthTab routes={routes} />}
      {tab === "density" && <CategoryAuditTab title="UI Density Audit" category="layout_density" findings={findings} />}
      {tab === "documents" && <CategoryAuditTab title="Document Engine Audit" category="document_engine" findings={findings} />}
      {tab === "accounting" && <CategoryAuditTab title="Accounting Engine Audit" category={["accounting_logic", "form_quality"]} findings={findings} />}
      {tab === "inventory" && <CategoryAuditTab title="Inventory / Purchase Audit" category={["inventory_logic", "wrong_action_contamination"]} findings={findings} />}
      {tab === "prompts" && <PromptGeneratorTab findings={findings} onPromptGenerated={() => {}} />}
      {tab === "history" && <HistoryTab runs={runs} />}
      {tab === "evidence" && <EvidenceTab />}
    </div>
  );
}
