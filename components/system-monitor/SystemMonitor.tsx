"use client";

import { useCallback, useMemo, useState } from "react";
import { MasterDesignTree, type MasterDesignTreeNode, type MonitorMetricKind } from "@/components/system/MasterDesignTree";
import { FaultInspectorDialog } from "@/components/system-monitor/FaultInspectorDialog";
import type { SystemMonitorState } from "@/components/system/MasterDesignDashboard";
import type { SystemMonitorControlPoint, SystemMonitorStatus } from "@/lib/audit-engine/monitor-types";
import {
  computeGlobalSummary,
  computeGroupSummary,
  computeSubCategorySummary,
  expandVisibleMainGroupsGroupRowResults,
  filterControlPointsForMonitorList,
  formatSummaryGroupRowsForCopy,
  sumVisibleModuleMapSummaryFromDisplayedGroupRows,
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
    if (filter.status === "fail") return "Summary — Failed Control Points";
    if (filter.status === "pass") return "Summary — Passed Control Points";
    if (filter.status === "partial") return "Summary — Partial Control Points";
    if (filter.status === "blocked") return "Summary — Blocked Control Points";
    return "Summary — All Control Points";
  }
  const modLabel = filter.moduleId ? (moduleHealth.find((m) => m.id === filter.moduleId)?.name ?? filter.moduleId) : null;
  const grpLabel = filter.groupId ? (MONITOR_GROUP_DEFS.find((g) => g.id === filter.groupId)?.name ?? filter.groupId) : null;
  if (filter.healthNonPass) {
    if (grpLabel) return `${grpLabel} — health (non-pass control points)`;
    if (modLabel) return `${modLabel} — health (non-pass control points)`;
    return "Global unique — health (non-pass control points)";
  }
  if (grpLabel && filter.status) {
    return `${grpLabel} — ${statusWord(filter.status)} control points`;
  }
  if (grpLabel) {
    return `${grpLabel} — all linked control points`;
  }
  if (modLabel && filter.status) {
    return `${modLabel} — ${statusWord(filter.status)} control points`;
  }
  if (modLabel) {
    return `${modLabel} — all linked control points`;
  }
  if (filter.status) {
    return `Global unique — ${statusWord(filter.status)} control points`;
  }
  return "All control points (global unique)";
}

function buildTreeNodes(controlPoints: SystemMonitorControlPoint[], moduleHealth: SystemMonitorState["moduleHealth"]): MasterDesignTreeNode[] {
  return MONITOR_GROUP_DEFS.map((def) => {
    const gs = computeGroupSummary(controlPoints, { id: def.id, modules: [...def.modules] });
    const summaryOnly = { pass: gs.pass, fail: gs.fail, partial: gs.partial, blocked: gs.blocked };
    return {
      id: def.id,
      name: def.name,
      isGroup: true,
      healthPercent: healthPercentFromSummary(summaryOnly, gs.total),
      passCount: gs.pass,
      failCount: gs.fail,
      partialCount: gs.partial,
      blockedCount: gs.blocked,
      totalCp: gs.total,
      scopeNote:
        "Group row counts are unique inside this group. A control point linked to multiple groups can appear in more than one group row; group totals are not summed to the global total.",
      filterable: false,
      children: def.modules
        .map((moduleId) => moduleHealth.find((m) => m.id === moduleId))
        .filter((m): m is SystemMonitorState["moduleHealth"][number] => Boolean(m))
        .map((mh) => {
          const sub = computeSubCategorySummary(controlPoints, { moduleId: mh.id });
          const subSum = { pass: sub.pass, fail: sub.fail, partial: sub.partial, blocked: sub.blocked };
          return {
            id: mh.id,
            name: mh.name,
            isGroup: false,
            healthPercent: healthPercentFromSummary(subSum, sub.total),
            passCount: sub.pass,
            failCount: sub.fail,
            partialCount: sub.partial,
            blockedCount: sub.blocked,
            totalCp: sub.total,
            filterable: true,
            children: mh.dependencies
              .map((depId) => moduleHealth.find((m) => m.id === depId))
              .filter((m): m is SystemMonitorState["moduleHealth"][number] => Boolean(m))
              .map((dep) => {
                const depSub = computeSubCategorySummary(controlPoints, { moduleId: dep.id });
                const dSum = { pass: depSub.pass, fail: depSub.fail, partial: depSub.partial, blocked: depSub.blocked };
                return {
                  id: `${mh.id}:${dep.id}`,
                  metricModuleId: dep.id,
                  name: dep.name,
                  isGroup: false,
                  healthPercent: healthPercentFromSummary(dSum, depSub.total),
                  passCount: depSub.pass,
                  failCount: depSub.fail,
                  partialCount: depSub.partial,
                  blockedCount: depSub.blocked,
                  totalCp: depSub.total,
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
  return cps.map((c) => `${c.id}\t${c.status}\t${c.severity}\t${c.module}\t${c.title}\t${c.timestamp}`).join("\n");
}

function reportContext(s: SystemMonitorState): AuditReportContext {
  const { controlPoints, moduleHealth, groupScope } = s;
  const visibleTotals = sumVisibleModuleMapSummaryFromDisplayedGroupRows(
    MONITOR_GROUP_DEFS.map((def) => {
      const block = computeGroupSummary(controlPoints, { id: def.id, modules: [...def.modules] });
      return {
        passCount: block.pass,
        failCount: block.fail,
        partialCount: block.partial,
        blockedCount: block.blocked,
        totalCp: block.total,
      };
    }),
  );
  return {
    generatedAt: s.generatedAt,
    lastRefreshedAt: s.generatedAt,
    visibleSummaryMainMap: {
      pass: visibleTotals.pass,
      fail: visibleTotals.fail,
      partial: visibleTotals.partial,
      blocked: visibleTotals.blocked,
      total: visibleTotals.total,
    },
    groupRows: MONITOR_GROUP_DEFS.map((def) => {
      const g = groupScope.find((x) => x.id === def.id);
      const block = computeGroupSummary(controlPoints, { id: def.id, modules: [...def.modules] });
      return {
        id: def.id,
        name: def.name,
        summary: { pass: block.pass, fail: block.fail, partial: block.partial, blocked: block.blocked },
        total: block.total,
        scope: g?.scopeLabel ?? "Unique control points in group (each CP once).",
      };
    }),
    moduleRows: moduleHealth.map((m) => {
      const scoped = computeSubCategorySummary(controlPoints, { moduleId: m.id });
      return {
        id: m.id,
        name: m.name,
        summary: { pass: scoped.pass, fail: scoped.fail, partial: scoped.partial, blocked: scoped.blocked },
        total: scoped.total,
        healthPercent: m.healthPercent,
      };
    }),
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
  const globalSummary = useMemo(() => computeGlobalSummary(controlPoints), [controlPoints]);

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

  const globalTotal = globalSummary.total;
  const sumLine = globalSummary.pass + globalSummary.fail + globalSummary.partial + globalSummary.blocked;
  const consistent = sumLine === globalTotal;

  const treeNodes = useMemo(() => buildTreeNodes(controlPoints, data.moduleHealth), [controlPoints, data.moduleHealth]);

  const visibleModuleMapSummary = useMemo(
    () =>
      sumVisibleModuleMapSummaryFromDisplayedGroupRows(
        treeNodes.map((n) => ({
          passCount: n.passCount,
          failCount: n.failCount,
          partialCount: n.partialCount,
          blockedCount: n.blockedCount,
          totalCp: n.totalCp,
        })),
      ),
    [treeNodes],
  );

  const visibleSumLine =
    visibleModuleMapSummary.pass + visibleModuleMapSummary.fail + visibleModuleMapSummary.partial + visibleModuleMapSummary.blocked;
  const visibleTotalsConsistent = visibleSumLine === visibleModuleMapSummary.total;

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
      const res = await fetch("/api/system/monitor/refresh", { method: "POST", cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; data?: SystemMonitorState; error?: string };
      if (!json.ok || !json.data) {
        throw new Error(json.error || "Refresh failed");
      }
      setData(json.data);
      setCopyToast("Refreshed");
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

  const progress = globalTotal > 0 ? Math.round((globalSummary.pass / globalTotal) * 100) : 0;

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
                Last refreshed: {data.generatedAt} — <strong>Summary</strong> matches the sum of the three main Module Map group rows (Core System, Finance Engines, Platform Layers).
              </p>
              {refreshError ? <p className="mt-2 text-sm font-medium text-red-700">{refreshError}</p> : null}
              {refreshing ? <p className="mt-1 text-sm text-primary">Refreshing…</p> : null}
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold" data-inspector-system-monitor-header-metrics="true">
                <span className="rounded-full border border-line bg-surface-soft/70 px-2.5 py-1 text-ink">Pass rate {progress}% (global unique pass / global unique total)</span>
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
                {refreshing ? "Refreshing…" : "Refresh control points"}
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
                onClick={() => void copy("All fails", formatSummaryGroupRowsForCopy(allSummaryFailsForCopy))}
                className="rounded-lg border border-line px-3 py-2 text-xs font-semibold"
              >
                Copy all fails
              </button>
              <button
                type="button"
                onClick={() => void copy("All partials", formatSummaryGroupRowsForCopy(allSummaryPartialsForCopy))}
                className="rounded-lg border border-line px-3 py-2 text-xs font-semibold"
              >
                Copy all partials
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
              <div>
                <p className="text-xs font-semibold text-ink">Summary</p>
                <p className="mt-0.5 text-[10px] text-muted">Core System + Finance Engines + Platform Layers (same numbers as the main group cards).</p>
                <div className="mt-2 grid w-full gap-2 sm:grid-cols-6">
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
                      <p className="mt-1 text-base font-semibold text-ink">{visibleModuleMapSummary[card.key]}</p>
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
                      visibleTotalCardActive || !hasActiveFilter ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-[0.14em] text-indigo-900">Total</p>
                    <p className="mt-1 text-base font-semibold text-ink">{visibleModuleMapSummary.total}</p>
                    <p className="mt-0.5 text-[9px] text-muted">Σ group rows = {visibleSumLine}</p>
                    {!visibleTotalsConsistent ? (
                      <p className="mt-0.5 text-[9px] font-medium text-red-700">Row sum mismatch — inspect statuses</p>
                    ) : null}
                  </button>
                </div>
              </div>

              <p className="text-[11px] leading-snug text-muted">
                Summary counts add the displayed group rows. A control point linked to multiple groups may be counted more than once in this summary. When you use Summary filters or Copy all fails /
                partials, the list and export include group context and may list the same CP under each relevant group.
              </p>
            </div>
          </div>
          {hasActiveFilter && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted">Active filter:</span>
              {selectedFilter.healthNonPass ? <span className="rounded-md bg-surface-soft px-2 py-0.5 font-semibold">health=non-pass</span> : null}
              {selectedFilter.status ? <span className="rounded-md bg-surface-soft px-2 py-0.5 font-semibold">status={selectedFilter.status}</span> : null}
              {selectedFilter.listAggregation === "visible-module-map-group-results" ? (
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-950">summary (group rows)</span>
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
              <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
                <strong className="font-semibold">Group totals are unique inside each group.</strong> A control point linked to multiple groups may appear in more than one group, so group totals are
                not added together to equal the global total.
              </p>
              <p className="mt-2 text-xs text-muted">
                Module and dependency rows count every link to that module (a single control point can be linked to several modules, so module FAIL counts can exceed global unique FAIL).
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
            <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{panelTitle}</p>
            {summaryGroupRows ? (
              <p className="mt-1 shrink-0 text-xs text-muted">
                <strong>{summaryGroupRows.length}</strong> group-row results (matches Summary card total for this status). <strong>{summaryUniqueCount}</strong> unique control points.
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
                          Logical: {p.module} / {p.sub_module} · Risk {p.severity} · Status {p.status} · {p.timestamp}
                        </p>
                        <p className="text-[10px] text-muted">Linked modules: {p.linked_project_modules.length ? p.linked_project_modules.join(", ") : "—"}</p>
                        <p className="line-clamp-2 text-xs text-ink">{p.root_cause_hint || p.actual_behavior}</p>
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
                      Logical: {p.module} / {p.sub_module} · Risk {p.severity} · Status {p.status} · {p.timestamp}
                    </p>
                    <p className="text-[10px] text-muted">Linked modules: {p.linked_project_modules.length ? p.linked_project_modules.join(", ") : "—"}</p>
                    <p className="line-clamp-2 text-xs text-ink">{p.root_cause_hint || p.actual_behavior}</p>
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
