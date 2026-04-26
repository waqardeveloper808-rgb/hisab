"use client";

import { useCallback, useMemo, useState } from "react";
import { MasterDesignTree, type MasterDesignTreeNode, type MonitorMetricKind } from "@/components/system/MasterDesignTree";
import { FaultInspectorDialog } from "@/components/system-monitor/FaultInspectorDialog";
import type { SystemMonitorState } from "@/components/system/MasterDesignDashboard";
import type { SystemMonitorControlPoint, SystemMonitorStatus } from "@/lib/audit-engine/monitor-types";
import {
  expandVisibleMainGroupsGroupRowResults,
  filterControlPointsForMonitorList,
  formatSummaryGroupRowsForCopy,
  type MonitorListFilter,
} from "@/lib/audit-engine/control-point-summary-engine";
import { MONITOR_GROUP_DEFS, monitorGroupModuleIds } from "@/lib/audit-engine/monitor-groups";
import { generateAuditReport, healthPercentFromSummary, type AuditReportContext } from "@/lib/audit-engine/summary";

export type SelectedFilter = MonitorListFilter;

const EMPTY_FILTER: SelectedFilter = {
  status: null,
  moduleId: null,
  groupId: null,
  healthNonPass: false,
  listAggregation: null,
};

function statusWord(s: SystemMonitorStatus): string {
  if (s === "pass") return "Passed";
  if (s === "fail") return "Failed";
  if (s === "partial") return "Partial";
  return "Blocked";
}

function formatMonitorPanelTitle(filter: SelectedFilter, moduleHealth: SystemMonitorState["moduleHealth"]): string {
  if (filter.listAggregation === "visible-module-map-group-results") {
    const diag = "Group-scoped appearances — not unique system failures · ";
    if (filter.status === "fail") return `${diag}Failed appearance rows`;
    if (filter.status === "pass") return `${diag}Passed appearance rows`;
    if (filter.status === "partial") return `${diag}Partial appearance rows`;
    if (filter.status === "blocked") return `${diag}Blocked appearance rows`;
    return `${diag}All appearance rows`;
  }
  const modLabel = filter.moduleId ? (moduleHealth.find((m) => m.id === filter.moduleId)?.name ?? filter.moduleId) : null;
  const grpLabel = filter.groupId ? (MONITOR_GROUP_DEFS.find((g) => g.id === filter.groupId)?.name ?? filter.groupId) : null;
  if (filter.healthNonPass) {
    if (grpLabel) return `${grpLabel} — health (non-pass control points)`;
    if (modLabel) return `${modLabel} — health (non-pass control points)`;
    return "Primary ownership — health (non-pass control points)";
  }
  if (grpLabel && filter.status) {
    return `${grpLabel} — ${statusWord(filter.status)} control points`;
  }
  if (grpLabel) {
    return `${grpLabel} — all primary-owned control points`;
  }
  if (modLabel && filter.status) {
    return `${modLabel} — ${statusWord(filter.status)} control points (primary ownership)`;
  }
  if (modLabel) {
    return `${modLabel} — all primary-owned control points`;
  }
  if (filter.status) {
    return `${statusWord(filter.status)} control points (primary ownership)`;
  }
  return "All control points (primary ownership)";
}

function buildTreeNodes(moduleHealth: SystemMonitorState["moduleHealth"], groupScope: SystemMonitorState["groupScope"]): MasterDesignTreeNode[] {
  return MONITOR_GROUP_DEFS.map((def) => {
    const gRow = groupScope.find((g) => g.id === def.id);
    const passCount = gRow?.passCount ?? 0;
    const failCount = gRow?.failCount ?? 0;
    const partialCount = gRow?.partialCount ?? 0;
    const blockedCount = gRow?.blockedCount ?? 0;
    const totalCp = gRow?.totalControlPoints ?? 0;
    const summaryOnly = { pass: passCount, fail: failCount, partial: partialCount, blocked: blockedCount };
    return {
      id: def.id,
      name: def.name,
      isGroup: true,
      healthPercent: healthPercentFromSummary(summaryOnly, totalCp),
      passCount,
      failCount,
      partialCount,
      blockedCount,
      totalCp,
      scopeNote:
        "Ownership-based totals for this main group (sum of primary-owned module counts). System Monitor Summary = Core System + Finance Engines + Platform Layers.",
      filterable: false,
      children: def.modules
        .map((moduleId) => moduleHealth.find((m) => m.id === moduleId))
        .filter((m): m is SystemMonitorState["moduleHealth"][number] => Boolean(m))
        .map((mh) => {
          const subSum = { pass: mh.passCount, fail: mh.failCount, partial: mh.partialCount, blocked: mh.blockedCount };
          return {
            id: mh.id,
            name: mh.name,
            isGroup: false,
            healthPercent: healthPercentFromSummary(subSum, mh.totalControlPoints),
            passCount: mh.passCount,
            failCount: mh.failCount,
            partialCount: mh.partialCount,
            blockedCount: mh.blockedCount,
            totalCp: mh.totalControlPoints,
            filterable: true,
            children: mh.dependencies
              .map((depId) => moduleHealth.find((m) => m.id === depId))
              .filter((m): m is SystemMonitorState["moduleHealth"][number] => Boolean(m))
              .map((dep) => {
                const dSum = { pass: dep.passCount, fail: dep.failCount, partial: dep.partialCount, blocked: dep.blockedCount };
                return {
                  id: `${mh.id}:${dep.id}`,
                  metricModuleId: dep.id,
                  name: dep.name,
                  isGroup: false,
                  healthPercent: healthPercentFromSummary(dSum, dep.totalControlPoints),
                  passCount: dep.passCount,
                  failCount: dep.failCount,
                  partialCount: dep.partialCount,
                  blockedCount: dep.blockedCount,
                  totalCp: dep.totalControlPoints,
                  filterable: false,
                  children: [],
                };
              }),
          };
        }),
    };
  });
}

function formatVisibleList(cps: SystemMonitorControlPoint[]) {
  return cps
    .map(
      (c) =>
        `${c.id}\t${c.status}\t${c.severity}\t${c.primaryModuleName}\t${c.primaryGroupName}\t${c.module}\t${c.title}\t${c.lastCheckedAt}\t${c.evaluation_method}\t${c.auditResult.replace(/\s+/g, " ").slice(0, 120)}`,
    )
    .join("\n");
}

function reportContext(s: SystemMonitorState): AuditReportContext {
  const { moduleHealth, groupScope, traceability } = s;
  const vis = traceability.summary;
  return {
    generatedAt: s.generatedAt,
    lastRefreshedAt: s.generatedAt,
    visibleSummaryMainMap: {
      pass: vis.pass,
      fail: vis.fail,
      partial: vis.partial,
      blocked: vis.blocked,
      total: vis.total,
    },
    groupRows: traceability.groups.map((g) => {
      const gMeta = groupScope.find((x) => x.id === g.id);
      return {
        id: g.id,
        name: g.name,
        summary: { pass: g.pass, fail: g.fail, partial: g.partial, blocked: g.blocked },
        total: g.total,
        scope: gMeta?.scopeLabel ?? "Ownership-based group rollup.",
      };
    }),
    moduleRows: moduleHealth.map((m) => ({
      id: m.id,
      name: m.name,
      summary: { pass: m.passCount, fail: m.failCount, partial: m.partialCount, blocked: m.blockedCount },
      total: m.totalControlPoints,
      healthPercent: m.healthPercent,
    })),
  };
}

export function SystemMonitor({ initialState }: { initialState: SystemMonitorState }) {
  const [data, setData] = useState<SystemMonitorState>(initialState);
  const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>(EMPTY_FILTER);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [inspect, setInspect] = useState<SystemMonitorControlPoint | null>(null);

  const controlPoints = data.controlPoints;
  const primarySummary = useMemo(() => {
    const g = data.summary?.globalUnique;
    if (g) return g;
    return {
      total: data.audit.total,
      pass: data.audit.pass,
      fail: data.audit.fail,
      partial: data.audit.partial,
      blocked: data.audit.blocked,
    };
  }, [data.summary?.globalUnique, data.audit]);
  const groupScoped = data.summary?.groupScopedAppearances ?? {
    pass: 0,
    fail: 0,
    partial: 0,
    blocked: 0,
    summedControlPointSlots: 0,
  };
  const duplicateMeta = data.summary?.duplicateMeta ?? {
    uniqueGlobalFailCount: data.audit.fail,
    groupScopedFailAppearancesSum: 0,
    extraFailAppearancesFromMultiGroupMembership: 0,
    failingControlPointsSpanningMultipleMainGroups: 0,
  };

  const summaryGroupRows = useMemo(() => {
    if (selectedFilter.listAggregation !== "visible-module-map-group-results") {
      return null;
    }
    return expandVisibleMainGroupsGroupRowResults(controlPoints, selectedFilter.status, selectedFilter.healthNonPass);
  }, [controlPoints, selectedFilter.listAggregation, selectedFilter.status, selectedFilter.healthNonPass]);

  const treeScopedList = useMemo(() => {
    if (selectedFilter.listAggregation === "visible-module-map-group-results") {
      return null;
    }
    return filterControlPointsForMonitorList(controlPoints, selectedFilter, monitorGroupModuleIds);
  }, [controlPoints, selectedFilter]);

  const summaryUniqueCount = useMemo(() => {
    if (!summaryGroupRows) {
      return 0;
    }
    return new Set(summaryGroupRows.map((r) => r.cp.id)).size;
  }, [summaryGroupRows]);

  const allSummaryFailsForCopy = useMemo(() => expandVisibleMainGroupsGroupRowResults(controlPoints, "fail", false), [controlPoints]);

  const allSummaryPartialsForCopy = useMemo(() => expandVisibleMainGroupsGroupRowResults(controlPoints, "partial", false), [controlPoints]);

  const globalTotal = primarySummary.total;
  const sumLine = primarySummary.pass + primarySummary.fail + primarySummary.partial + primarySummary.blocked;
  const consistent = sumLine === globalTotal;

  const treeNodes = useMemo(() => buildTreeNodes(data.moduleHealth, data.groupScope), [data.moduleHealth, data.groupScope]);

  const visibleSumLine = groupScoped.pass + groupScoped.fail + groupScoped.partial + groupScoped.blocked;
  const visibleTotalsConsistent = visibleSumLine === groupScoped.summedControlPointSlots;

  const filterHighlight = useMemo(() => {
    let status: MonitorMetricKind | "all" | "total" | "health" | null = "total";
    if (selectedFilter.healthNonPass) {
      status = "health";
    } else if (selectedFilter.status) {
      status = selectedFilter.status;
    } else if (selectedFilter.moduleId || selectedFilter.groupId) {
      status = "all";
    } else {
      status = "total";
    }
    return {
      module: selectedFilter.moduleId,
      groupId: selectedFilter.groupId,
      status,
    };
  }, [selectedFilter]);

  const panelTitle = useMemo(() => formatMonitorPanelTitle(selectedFilter, data.moduleHealth), [selectedFilter, data.moduleHealth]);

  const onSelectModule = useCallback((moduleId: string) => {
    setSelectedFilter((f) => {
      if (f.moduleId === moduleId) {
        return { ...f, moduleId: null, groupId: null, healthNonPass: false, listAggregation: null };
      }
      return { status: f.status, moduleId, groupId: null, healthNonPass: false, listAggregation: null };
    });
  }, []);

  const onTreeMetric = useCallback((nodeId: string, kind: MonitorMetricKind) => {
    const isGroup = MONITOR_GROUP_DEFS.some((g) => g.id === nodeId);
    if (kind === "health") {
      setSelectedFilter({
        status: null,
        moduleId: isGroup ? null : nodeId,
        groupId: isGroup ? nodeId : null,
        healthNonPass: true,
        listAggregation: null,
      });
      return;
    }
    if (isGroup) {
      if (kind === "all") {
        setSelectedFilter({ status: null, moduleId: null, groupId: nodeId, healthNonPass: false, listAggregation: null });
      } else {
        setSelectedFilter({ status: kind, moduleId: null, groupId: nodeId, healthNonPass: false, listAggregation: null });
      }
      return;
    }
    if (kind === "all") {
      setSelectedFilter({ status: null, moduleId: nodeId, groupId: null, healthNonPass: false, listAggregation: null });
    } else {
      setSelectedFilter({ status: kind, moduleId: nodeId, groupId: null, healthNonPass: false, listAggregation: null });
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/master-design/status", { method: "GET", cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Refresh failed (HTTP ${res.status})`);
      }
      const json = (await res.json()) as { data?: SystemMonitorState };
      if (!json.data?.summary || !json.data.controlPoints || !json.data.traceability) {
        throw new Error("Invalid response from /api/master-design/status");
      }
      setData(json.data);
      setCopyToast("Audit data refreshed");
      setTimeout(() => setCopyToast(null), 2000);
    } catch (e) {
      setRefreshError(e instanceof Error ? e.message : "Refresh error");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const ctx = useMemo(() => reportContext(data), [data]);
  const fullReport = useMemo(
    () => generateAuditReport(controlPoints, { ...ctx, generatedAt: data.generatedAt, lastRefreshedAt: data.generatedAt }),
    [controlPoints, ctx, data.generatedAt],
  );

  const copy = useCallback(async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast(label);
      setTimeout(() => setCopyToast(null), 2500);
    } catch {
      setCopyToast("Copy failed");
    }
  }, []);

  const progress = globalTotal > 0 ? Math.round((primarySummary.pass / globalTotal) * 100) : 0;

  const globalUniqueTotalActive =
    selectedFilter.status == null &&
    selectedFilter.listAggregation !== "visible-module-map-group-results" &&
    !selectedFilter.moduleId &&
    !selectedFilter.groupId &&
    !selectedFilter.healthNonPass;

  function globalUniqueMetricActive(status: SystemMonitorStatus) {
    return (
      selectedFilter.status === status &&
      selectedFilter.listAggregation !== "visible-module-map-group-results" &&
      !selectedFilter.moduleId &&
      !selectedFilter.groupId &&
      !selectedFilter.healthNonPass
    );
  }

  const hasActiveFilter =
    selectedFilter.status != null ||
    selectedFilter.moduleId != null ||
    selectedFilter.groupId != null ||
    selectedFilter.healthNonPass ||
    selectedFilter.listAggregation != null;

  const isVisibleMapSummaryActive =
    selectedFilter.listAggregation === "visible-module-map-group-results" &&
    !selectedFilter.moduleId &&
    !selectedFilter.groupId &&
    !selectedFilter.healthNonPass;

  const visibleCardActive = (key: SystemMonitorStatus) => isVisibleMapSummaryActive && selectedFilter.status === key;

  const visibleTotalCardActive = isVisibleMapSummaryActive && selectedFilter.status == null;

  return (
    <main className="bg-canvas px-4 py-5 sm:px-6 lg:px-8" data-inspector-system-monitor="true">
      <FaultInspectorDialog
        point={inspect}
        open={inspect != null}
        onClose={() => setInspect(null)}
        onCopied={(l) => {
          setCopyToast(l);
          setTimeout(() => setCopyToast(null), 2000);
        }}
      />
      {copyToast ? (
        <div className="fixed bottom-4 right-4 z-[60] rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium shadow-md" data-inspector-toast>
          {copyToast}
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-2xl border border-line bg-white p-4 shadow-xs">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">System Monitor (control point engine)</p>
              <p className="mt-1 text-xs text-muted">
                Last refreshed: {data.generatedAt}. <strong>Primary counts are ownership-based.</strong> Each control point is counted once under its primary module and main group. The System Monitor
                Summary is the sum of Core System, Finance Engines, and Platform Layers (see API <code className="rounded bg-surface-soft px-1">traceability</code>). Optional link-appearance diagnostics
                are under <strong>Count reconciliation details</strong>.
              </p>
              {refreshError ? <p className="mt-2 text-sm font-medium text-red-700">{refreshError}</p> : null}
              {refreshing ? <p className="mt-1 text-sm text-primary">Refreshing…</p> : null}
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold" data-inspector-system-monitor-header-metrics="true">
                <span className="rounded-full border border-line bg-surface-soft/70 px-2.5 py-1 text-ink">Pass rate {progress}% (Pass / Total Control Points)</span>
                <span className="rounded-full border border-line bg-surface-soft/70 px-2.5 py-1 text-ink">Risk {data.risk.level} ({data.risk.score})</span>
                {!consistent ? (
                  <span className="rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-red-800">Inconsistent: status sum {sumLine} vs total {globalTotal}</span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                disabled={refreshing}
                onClick={() => void onRefresh()}
                className="rounded-lg border border-line bg-surface-soft px-3 py-2 text-xs font-semibold text-ink shadow-xs hover:bg-white disabled:opacity-60"
                data-inspector-system-monitor-refresh="true"
              >
                {refreshing ? "Refreshing…" : "Refresh Audit Data"}
              </button>
              <button
                type="button"
                onClick={() => void copy("Summary copied", fullReport)}
                className="rounded-lg border border-primary bg-primary px-3 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-95"
                data-inspector-system-monitor-copy="true"
              >
                Copy Full Audit Summary
              </button>
              <button
                type="button"
                onClick={() => {
                  if (summaryGroupRows?.length) {
                    void copy("Filtered list", formatSummaryGroupRowsForCopy(summaryGroupRows));
                  } else {
                    void copy("Filtered list", formatVisibleList(treeScopedList ?? []));
                  }
                }}
                className="rounded-lg border border-line px-3 py-2 text-xs font-semibold"
              >
                Copy visible filtered list
              </button>
              <button
                type="button"
                onClick={() => {
                  if (summaryGroupRows?.length) {
                    void copy("Copy All", formatSummaryGroupRowsForCopy(summaryGroupRows));
                  } else {
                    void copy("Copy All", formatVisibleList(treeScopedList ?? []));
                  }
                }}
                className="rounded-lg border border-line px-3 py-2 text-xs font-semibold"
                data-inspector-system-monitor-copy-all="true"
              >
                Copy All
              </button>
              {selectedFilter.moduleId || selectedFilter.groupId || selectedFilter.listAggregation === "visible-module-map-group-results" ? (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedFilter.listAggregation === "visible-module-map-group-results") {
                      const rows = expandVisibleMainGroupsGroupRowResults(controlPoints, null, false);
                      void copy("Current scope (all statuses)", formatSummaryGroupRowsForCopy(rows));
                    } else {
                      const rows = filterControlPointsForMonitorList(
                        controlPoints,
                        {
                          status: null,
                          moduleId: selectedFilter.moduleId,
                          groupId: selectedFilter.groupId,
                          healthNonPass: false,
                          listAggregation: null,
                        },
                        monitorGroupModuleIds,
                      );
                      void copy("Current scope (all statuses)", formatVisibleList(rows));
                    }
                  }}
                  className="rounded-lg border border-line px-3 py-2 text-xs font-semibold"
                >
                  Copy current scope (all statuses)
                </button>
              ) : null}
            </div>

            <div className="w-full space-y-4" data-inspector-system-monitor-summary="true">
              <div data-inspector-primary-summary="true">
                <h2 className="text-sm font-semibold text-ink">System Monitor Summary</h2>
                <div className="mt-2 grid w-full gap-2 sm:grid-cols-5">
                  <button
                    type="button"
                    data-inspector-system-monitor-summary-global="total"
                    onClick={() => setSelectedFilter(EMPTY_FILTER)}
                    className={`rounded-xl border border-line bg-emerald-50/80 px-3 py-2.5 text-left transition-colors hover:bg-emerald-50 ${
                      globalUniqueTotalActive ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-900">Total Control Points</p>
                    <p className="mt-1 text-base font-semibold text-ink">{primarySummary.total}</p>
                  </button>
                  {(
                    [
                      { key: "pass" as const, label: "Pass", tone: "border-line bg-surface-soft/70", inspector: "global-pass" },
                      { key: "fail" as const, label: "Fail", tone: "border-red-200 bg-red-50", inspector: "global-fail" },
                      { key: "partial" as const, label: "Partial", tone: "border-amber-200 bg-amber-50", inspector: "global-partial" },
                      { key: "blocked" as const, label: "Blocked", tone: "border-slate-200 bg-slate-50", inspector: "global-blocked" },
                    ] as const
                  ).map((card) => (
                    <button
                      key={`g-${card.key}`}
                      type="button"
                      data-inspector-system-monitor-summary-global={card.inspector}
                      onClick={() =>
                        setSelectedFilter((prev) => {
                          const same =
                            prev.status === card.key &&
                            prev.listAggregation !== "visible-module-map-group-results" &&
                            !prev.moduleId &&
                            !prev.groupId &&
                            !prev.healthNonPass;
                          return {
                            status: same ? null : card.key,
                            moduleId: null,
                            groupId: null,
                            healthNonPass: false,
                            listAggregation: null,
                          };
                        })
                      }
                      className={`rounded-xl border px-3 py-2.5 text-left transition-colors hover:brightness-[0.98] ${
                        globalUniqueMetricActive(card.key) ? "ring-2 ring-primary " + card.tone : card.tone
                      }`}
                    >
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{card.label}</p>
                      <p className="mt-1 text-base font-semibold text-ink">{primarySummary[card.key]}</p>
                    </button>
                  ))}
                </div>
              </div>

              <details className="rounded-xl border border-line bg-surface-soft/30" data-inspector-reconciliation-details="true">
                <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="underline decoration-dotted">Count reconciliation details</span>
                  <span className="ml-2 text-xs font-normal text-muted">(optional — group appearance math)</span>
                </summary>
                <div className="space-y-4 border-t border-line p-3 text-xs leading-relaxed">
                  {data.summary ? (
                    <>
                      <ul className="list-inside list-disc space-y-1 text-ink">
                        <li>
                          Unique failed control points: <strong>{duplicateMeta.uniqueGlobalFailCount}</strong>
                        </li>
                        <li>
                          Group-scoped failed appearances: <strong>{groupScoped.fail}</strong> (<code className="rounded bg-surface-soft px-1">summary.groupScopedAppearances.fail</code>)
                        </li>
                        <li>
                          Multi-group failing CPs: <strong>{duplicateMeta.failingControlPointsSpanningMultipleMainGroups}</strong>
                        </li>
                        <li>
                          Extra fail appearances: <strong>{duplicateMeta.extraFailAppearancesFromMultiGroupMembership}</strong>
                        </li>
                      </ul>
                      <p className="text-muted">
                        <strong>Primary dashboard:</strong> failures are counted once per CP under{" "}
                        <strong className="text-ink">{duplicateMeta.uniqueGlobalFailCount}</strong> (ownership). <strong>Optional diagnostic:</strong> if you treated &quot;any link to a group&quot; as a
                        separate appearance, summed fails can read <strong className="text-ink">{groupScoped.fail}</strong> — that is <strong>not</strong> the primary System Monitor failure total.
                      </p>
                      <p className="text-[10px] text-muted">
                        <code className="rounded bg-surface-soft px-1">audit</code>, <code className="rounded bg-surface-soft px-1">summary.globalUnique</code>, and{" "}
                        <code className="rounded bg-surface-soft px-1">traceability.summary</code> use the same ownership roll-up (Core + Finance + Platform).
                      </p>
                    </>
                  ) : (
                    <p className="text-muted">Extended summary fields unavailable; using audit-only fallback for the primary cards.</p>
                  )}

                  <div className="rounded-lg border border-indigo-200/80 bg-indigo-50/50 p-3" data-inspector-group-scoped-summary="true">
                    <p className="text-xs font-semibold text-indigo-950">Group-scoped appearances — not unique system failures</p>
                    <p className="mt-1 text-[11px] text-indigo-900/90">
                      Diagnostic filters below sum Core + Finance + Platform group rows. The same control point may appear in multiple groups; list length can exceed unique failure count.
                    </p>
                    <div className="mt-2 grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-6">
                      {(
                        [
                          { key: "pass", label: "Pass", tone: "border-line bg-surface-soft/70", inspector: "visible-pass" },
                          { key: "fail", label: "Fail", tone: "border-red-200 bg-red-50", inspector: "visible-fail" },
                          { key: "partial", label: "Partial", tone: "border-amber-200 bg-amber-50", inspector: "visible-partial" },
                          { key: "blocked", label: "Blocked", tone: "border-slate-200 bg-slate-50", inspector: "visible-blocked" },
                        ] as const
                      ).map((card) => (
                        <button
                          key={`v-${card.key}`}
                          type="button"
                          data-inspector-system-monitor-summary-visible={card.inspector}
                          onClick={() =>
                            setSelectedFilter((f) => {
                              const same =
                                f.listAggregation === "visible-module-map-group-results" &&
                                f.status === card.key &&
                                !f.moduleId &&
                                !f.groupId &&
                                !f.healthNonPass;
                              return {
                                status: same ? null : card.key,
                                moduleId: null,
                                groupId: null,
                                healthNonPass: false,
                                listAggregation: "visible-module-map-group-results",
                              };
                            })
                          }
                          className={`rounded-xl border px-3 py-2.5 text-left transition-colors hover:brightness-[0.98] ${
                            visibleCardActive(card.key) ? "ring-2 ring-primary " + card.tone : card.tone
                          }`}
                        >
                          <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{card.label}</p>
                          <p className="mt-1 text-base font-semibold text-ink">{groupScoped[card.key]}</p>
                        </button>
                      ))}
                      <button
                        type="button"
                        data-inspector-system-monitor-summary-visible="total"
                        onClick={() =>
                          setSelectedFilter((f) => {
                            if (f.listAggregation === "visible-module-map-group-results" && f.status == null && !f.healthNonPass && !f.moduleId && !f.groupId) {
                              return EMPTY_FILTER;
                            }
                            return {
                              status: null,
                              moduleId: null,
                              groupId: null,
                              healthNonPass: false,
                              listAggregation: "visible-module-map-group-results",
                            };
                          })
                        }
                        className={`rounded-xl border border-line bg-indigo-50/80 px-3 py-2.5 text-left transition-colors hover:bg-indigo-50 ${
                          visibleTotalCardActive ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <p className="text-[10px] uppercase tracking-[0.14em] text-indigo-900">Total (slots)</p>
                        <p className="mt-1 text-base font-semibold text-ink">{groupScoped.summedControlPointSlots}</p>
                        <p className="mt-0.5 text-[9px] text-muted">Σ group rows = {visibleSumLine}</p>
                        {!visibleTotalsConsistent ? (
                          <p className="mt-0.5 text-[9px] font-medium text-red-700">Row sum mismatch — inspect statuses</p>
                        ) : null}
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void copy("All fails (group-scoped appearances)", formatSummaryGroupRowsForCopy(allSummaryFailsForCopy))}
                        className="rounded-lg border border-line bg-white px-3 py-1.5 text-[11px] font-semibold"
                      >
                        Copy all fails (appearances)
                      </button>
                      <button
                        type="button"
                        onClick={() => void copy("All partials (group-scoped appearances)", formatSummaryGroupRowsForCopy(allSummaryPartialsForCopy))}
                        className="rounded-lg border border-line bg-white px-3 py-1.5 text-[11px] font-semibold"
                      >
                        Copy all partials (appearances)
                      </button>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>
          {hasActiveFilter && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted">Active filter:</span>
              {selectedFilter.healthNonPass ? <span className="rounded-md bg-surface-soft px-2 py-0.5 font-semibold">health=non-pass</span> : null}
              {selectedFilter.status ? <span className="rounded-md bg-surface-soft px-2 py-0.5 font-semibold">status={selectedFilter.status}</span> : null}
              {selectedFilter.listAggregation === "visible-module-map-group-results" ? (
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-950">Group-scoped appearances — not unique system failures</span>
              ) : null}
              {selectedFilter.status &&
              selectedFilter.listAggregation !== "visible-module-map-group-results" &&
              !selectedFilter.moduleId &&
              !selectedFilter.groupId &&
              !selectedFilter.healthNonPass ? (
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-950">Primary ownership (traceable)</span>
              ) : null}
              {selectedFilter.groupId ? <span className="rounded-md bg-surface-soft px-2 py-0.5 font-semibold">group={selectedFilter.groupId}</span> : null}
              {selectedFilter.moduleId ? <span className="rounded-md bg-surface-soft px-2 py-0.5 font-semibold">module={selectedFilter.moduleId}</span> : null}
              {summaryGroupRows ? (
                <>
                  <span className="text-muted">
                    Matching group-row results: <strong>{summaryGroupRows.length}</strong>
                  </span>
                  <span className="text-muted">
                    Unique control points: <strong>{summaryUniqueCount}</strong>
                  </span>
                </>
              ) : (
                <span className="text-muted">
                  Matching: <strong>{treeScopedList?.length ?? 0}</strong>
                </span>
              )}
              <button
                type="button"
                className="font-semibold text-primary underline"
                data-inspector-system-monitor-clear-filters="true"
                onClick={() => setSelectedFilter(EMPTY_FILTER)}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_minmax(280px,380px)]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Module map</p>
              <p className="mt-2 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-950">
                <strong className="font-semibold">Ownership-based module map.</strong> Each number is the count of control points whose <em>primary</em> module is that row. Core + Finance + Platform
                equals the System Monitor Summary. Every count is backed by explicit CP IDs in <code className="rounded bg-white/80 px-1">traceability</code> from the API.
              </p>
              <p className="mt-2 text-xs text-muted">
                Dependency rows use the same primary-ownership rule for the dependency module. Secondary linked modules are shown on each CP card but do not change primary totals.
              </p>
              <div className="mt-3">
                <MasterDesignTree
                  nodes={treeNodes}
                  onSelectModule={onSelectModule}
                  selectedModuleId={selectedFilter.moduleId}
                  onModuleMetric={onTreeMetric}
                  filterHighlight={filterHighlight}
                />
              </div>
            </div>
          </div>
          <div className="flex h-[min(80vh,900px)] flex-col rounded-2xl border border-line bg-white p-4 shadow-xs" data-inspector-system-monitor-fault-list="true">
            <div className="flex shrink-0 flex-wrap items-start justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{panelTitle}</p>
              <button
                type="button"
                className="rounded-md border border-line bg-surface-soft px-2 py-1 text-[10px] font-semibold text-ink hover:bg-white"
                data-inspector-system-monitor-detail-copy-all="true"
                onClick={() => {
                  if (summaryGroupRows?.length) {
                    void copy("Copy All (detail)", formatSummaryGroupRowsForCopy(summaryGroupRows));
                  } else {
                    void copy("Copy All (detail)", formatVisibleList(treeScopedList ?? []));
                  }
                }}
              >
                Copy All
              </button>
            </div>
            {summaryGroupRows ? (
              <p className="mt-1 shrink-0 text-xs text-muted">
                <strong className="text-ink">Group-scoped appearances — not unique system failures.</strong> <strong>{summaryGroupRows.length}</strong> appearance rows ·{" "}
                <strong>{summaryUniqueCount}</strong> unique control points in this list.
              </p>
            ) : (
              <p className="mt-0.5 shrink-0 text-xs text-muted">{treeScopedList?.length ?? 0} matching control points</p>
            )}
            <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {summaryGroupRows?.length ? (
                summaryGroupRows.map((row, idx) => {
                  const showGroup = idx === 0 || summaryGroupRows[idx - 1].groupId !== row.groupId;
                  const p = row.cp;
                  return (
                    <div key={`${row.groupId}-${p.id}-${idx}`}>
                      {showGroup ? (
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">GROUP: {row.groupName}</p>
                      ) : null}
                      <div className="rounded-xl border border-line bg-surface-soft/60 px-3 py-2">
                        <p className="text-[10px] font-mono text-muted">{p.id}</p>
                        <p className="text-sm font-semibold text-ink">{p.title}</p>
                        <p className="text-[11px] text-muted">
                          Primary: {p.primaryModuleName} · Group: {p.primaryGroupName} · Logical: {p.module} / {p.sub_module} · Risk {p.severity} · Status {p.status}
                        </p>
                        <p className="text-[10px] text-muted">
                          Last checked: {p.lastCheckedAt} · Evaluator: {p.evaluation_method}
                        </p>
                        <p className="text-[10px] text-muted">Linked modules: {p.linked_project_modules.length ? p.linked_project_modules.join(", ") : "—"}</p>
                        <p className="line-clamp-2 text-xs text-ink">{p.auditResult || p.root_cause_hint || p.actual_behavior}</p>
                        <button
                          type="button"
                          className="mt-1 text-xs font-semibold text-primary underline"
                          onClick={() => setInspect(p)}
                          data-inspector-open-fault={p.id}
                        >
                          Inspect
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : treeScopedList?.length ? (
                treeScopedList.map((p) => (
                  <div key={p.id} className="rounded-xl border border-line bg-surface-soft/60 px-3 py-2">
                    <p className="text-[10px] font-mono text-muted">{p.id}</p>
                    <p className="text-sm font-semibold text-ink">{p.title}</p>
                    <p className="text-[11px] text-muted">
                      Primary: {p.primaryModuleName} · Group: {p.primaryGroupName} · Logical: {p.module} / {p.sub_module} · Risk {p.severity} · Status {p.status}
                    </p>
                    <p className="text-[10px] text-muted">
                      Last checked: {p.lastCheckedAt} · Evaluator: {p.evaluation_method}
                    </p>
                    <p className="text-[10px] text-muted">Linked modules: {p.linked_project_modules.length ? p.linked_project_modules.join(", ") : "—"}</p>
                    <p className="line-clamp-2 text-xs text-ink">{p.auditResult || p.root_cause_hint || p.actual_behavior}</p>
                    <button
                      type="button"
                      className="mt-1 text-xs font-semibold text-primary underline"
                      onClick={() => setInspect(p)}
                      data-inspector-open-fault={p.id}
                    >
                      Inspect
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-line px-3 py-3 text-sm text-muted">No items for this filter.</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
