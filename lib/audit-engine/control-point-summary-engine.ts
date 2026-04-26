import type { SystemMonitorControlPoint, SystemMonitorStatus } from "@/lib/audit-engine/monitor-types";
import { MONITOR_GROUP_DEFS } from "@/lib/audit-engine/monitor-groups";
import {
  computeSummary,
  controlPointsForGroupUnique,
  controlPointsForModuleId,
  filterByStatus,
  type SystemMonitorSummary,
} from "@/lib/audit-engine/summary";

export type GlobalControlPointSummary = SystemMonitorSummary & { total: number };

export type MonitorGroupDefinition = {
  id: string;
  name?: string;
  modules: readonly string[];
};

export type MonitorSubCategoryDefinition = {
  moduleId: string;
};

/** Global unique totals — one row per control point id in the full monitor list. */
export function computeGlobalSummary(controlPoints: readonly SystemMonitorControlPoint[]): GlobalControlPointSummary {
  const s = computeSummary(controlPoints);
  return { ...s, total: controlPoints.length };
}

/** Unique control points linked to any module in the group (at most once per group). */
export function computeGroupSummary(
  controlPoints: readonly SystemMonitorControlPoint[],
  groupDefinition: MonitorGroupDefinition,
): GlobalControlPointSummary {
  const unique = controlPointsForGroupUnique(controlPoints, groupDefinition.modules);
  const s = computeSummary(unique);
  return { ...s, total: unique.length };
}

/** All control points that list this module id (a CP may appear under several modules). */
export function computeSubCategorySummary(
  controlPoints: readonly SystemMonitorControlPoint[],
  subCategoryDefinition: MonitorSubCategoryDefinition,
): GlobalControlPointSummary {
  const scoped = controlPointsForModuleId(controlPoints, subCategoryDefinition.moduleId);
  const s = computeSummary(scoped);
  return { ...s, total: scoped.length };
}

/** Displayed main Module Map group row numbers (must match tree cards). */
export type DisplayedMainGroupRowCounts = {
  passCount: number;
  failCount: number;
  partialCount: number;
  blockedCount: number;
  totalCp: number;
};

export type VisibleModuleMapSummaryTotals = SystemMonitorSummary & { total: number };

/**
 * Sum of the visible top-level group row metrics exactly as shown in the Module Map (Core + Finance + Platform).
 * Intentionally double-counts control points that appear in multiple group rows.
 */
export function sumVisibleModuleMapSummaryFromDisplayedGroupRows(
  rows: readonly DisplayedMainGroupRowCounts[],
): VisibleModuleMapSummaryTotals {
  return rows.reduce(
    (acc, r) => ({
      pass: acc.pass + r.passCount,
      fail: acc.fail + r.failCount,
      partial: acc.partial + r.partialCount,
      blocked: acc.blocked + r.blockedCount,
      total: acc.total + r.totalCp,
    }),
    { pass: 0, fail: 0, partial: 0, blocked: 0, total: 0 },
  );
}

/** Unique control points that belong to at least one main Module Map group (deduplicated by id). */
export function controlPointsUnionVisibleMainGroups(controlPoints: readonly SystemMonitorControlPoint[]): SystemMonitorControlPoint[] {
  const byId = new Map<string, SystemMonitorControlPoint>();
  for (const def of MONITOR_GROUP_DEFS) {
    for (const cp of controlPointsForGroupUnique(controlPoints, [...def.modules])) {
      byId.set(cp.id, cp);
    }
  }
  return [...byId.values()];
}

export type GroupTaggedControlPoint = {
  groupId: string;
  groupName: string;
  cp: SystemMonitorControlPoint;
};

/**
 * One row per control point per main group it belongs to (unique within each group), in map order.
 * Duplicates the same CP when it is linked to modules in more than one main group — matches Summary card sums.
 */
export function expandVisibleMainGroupsGroupRowResults(
  controlPoints: readonly SystemMonitorControlPoint[],
  status: SystemMonitorStatus | null,
  healthNonPass: boolean,
): GroupTaggedControlPoint[] {
  const out: GroupTaggedControlPoint[] = [];
  for (const def of MONITOR_GROUP_DEFS) {
    let groupCps = controlPointsForGroupUnique(controlPoints, [...def.modules]);
    if (healthNonPass) {
      groupCps = groupCps.filter((c) => c.status !== "pass");
    } else if (status) {
      groupCps = filterByStatus(groupCps, status);
    }
    for (const cp of groupCps) {
      out.push({ groupId: def.id, groupName: def.name, cp });
    }
  }
  return out;
}

export function formatSummaryGroupRowsForCopy(rows: readonly GroupTaggedControlPoint[]): string {
  const lines: string[] = [];
  let lastGroup = "";
  for (const { groupName, cp } of rows) {
    if (groupName !== lastGroup) {
      if (lines.length > 0) {
        lines.push("");
      }
      lines.push(`GROUP: ${groupName}`);
      lines.push("CP-ID | Status | Risk | Module | Title | Timestamp");
      lastGroup = groupName;
    }
    lines.push(`${cp.id} | ${cp.status} | ${cp.severity} | ${cp.module} | ${cp.title} | ${cp.timestamp}`);
  }
  return lines.join("\n");
}

export type MonitorListFilter = {
  status: SystemMonitorStatus | null;
  moduleId: string | null;
  groupId: string | null;
  /** When true, scoped list is fail + partial + blocked for the active scope (global / group / module). */
  healthNonPass: boolean;
  /**
   * Summary strip: list/copy use per-group rows (same CP may appear under multiple groups).
   */
  listAggregation: null | "visible-module-map-group-results";
};

function scopeBaseList(
  controlPoints: readonly SystemMonitorControlPoint[],
  filter: Pick<MonitorListFilter, "moduleId" | "groupId">,
  groupModulesForId: (groupId: string) => readonly string[] | null,
): SystemMonitorControlPoint[] {
  if (filter.groupId) {
    const modules = groupModulesForId(filter.groupId);
    if (!modules?.length) {
      return [];
    }
    void modules;
    return controlPoints.filter((cp) => cp.primaryGroupId === filter.groupId);
  }
  if (filter.moduleId) {
    return controlPoints.filter((cp) => cp.primaryModuleId === filter.moduleId);
  }
  return [...controlPoints];
}

/**
 * Filter the visible monitor list: optional group or module scope, then status or health (non-pass).
 */
export function filterControlPointsForMonitorList(
  controlPoints: readonly SystemMonitorControlPoint[],
  filter: MonitorListFilter,
  groupModulesForId: (groupId: string) => readonly string[] | null,
): SystemMonitorControlPoint[] {
  const base = scopeBaseList(controlPoints, filter, groupModulesForId);
  if (filter.healthNonPass) {
    return base.filter((cp) => cp.status !== "pass");
  }
  if (filter.status) {
    return filterByStatus(base, filter.status);
  }
  return base;
}
