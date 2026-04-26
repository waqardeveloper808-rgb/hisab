import { describe, expect, it } from "vitest";
import { buildSystemMonitorControlPoints } from "@/lib/audit-engine/build-monitor-points";
import {
  computeGlobalSummary,
  computeGroupSummary,
  computeSubCategorySummary,
  expandVisibleMainGroupsGroupRowResults,
  filterControlPointsForMonitorList,
  formatSummaryGroupRowsForCopy,
  sumVisibleModuleMapSummaryFromDisplayedGroupRows,
} from "@/lib/audit-engine/control-point-summary-engine";
import { MONITOR_GROUP_DEFS, monitorGroupModuleIds } from "@/lib/audit-engine/monitor-groups";
import type { SystemMonitorControlPoint } from "@/lib/audit-engine/monitor-types";

function sumStatuses(s: { pass: number; fail: number; partial: number; blocked: number }) {
  return s.pass + s.fail + s.partial + s.blocked;
}

describe("control-point-summary-engine", () => {
  const controlPoints: SystemMonitorControlPoint[] = buildSystemMonitorControlPoints("2026-01-01T00:00:00.000Z");

  it("global unique: pass+fail+partial+blocked equals total", () => {
    const g = computeGlobalSummary(controlPoints);
    expect(sumStatuses(g)).toBe(g.total);
  });

  it("each main group: pass+fail+partial+blocked equals group total (unique within group)", () => {
    for (const def of MONITOR_GROUP_DEFS) {
      const row = computeGroupSummary(controlPoints, { id: def.id, modules: [...def.modules] });
      expect(sumStatuses(row), def.id).toBe(row.total);
    }
  });

  it("Core System fail filter count matches group summary fail", () => {
    const def = MONITOR_GROUP_DEFS.find((g) => g.id === "core-system")!;
    const row = computeGroupSummary(controlPoints, { id: def.id, modules: [...def.modules] });
    const filtered = filterControlPointsForMonitorList(
      controlPoints,
      { status: "fail", moduleId: null, groupId: "core-system", healthNonPass: false, listAggregation: null },
      monitorGroupModuleIds,
    );
    expect(filtered.length).toBe(row.fail);
    expect(filtered.every((c) => c.status === "fail")).toBe(true);
    const modules = monitorGroupModuleIds("core-system")!;
    expect(filtered.every((c) => c.linked_project_modules.some((m) => modules.includes(m)))).toBe(true);
  });

  it("Finance Engines fail filter matches group fail and only fails", () => {
    const def = MONITOR_GROUP_DEFS.find((g) => g.id === "finance-engines")!;
    const row = computeGroupSummary(controlPoints, { id: def.id, modules: [...def.modules] });
    const filtered = filterControlPointsForMonitorList(
      controlPoints,
      { status: "fail", moduleId: null, groupId: "finance-engines", healthNonPass: false, listAggregation: null },
      monitorGroupModuleIds,
    );
    expect(filtered.length).toBe(row.fail);
    expect(filtered.every((c) => c.status === "fail")).toBe(true);
  });

  it("Platform Layers pass filter matches group pass", () => {
    const def = MONITOR_GROUP_DEFS.find((g) => g.id === "platform-layers")!;
    const row = computeGroupSummary(controlPoints, { id: def.id, modules: [...def.modules] });
    const filtered = filterControlPointsForMonitorList(
      controlPoints,
      { status: "pass", moduleId: null, groupId: "platform-layers", healthNonPass: false, listAggregation: null },
      monitorGroupModuleIds,
    );
    expect(filtered.length).toBe(row.pass);
    expect(filtered.every((c) => c.status === "pass")).toBe(true);
  });

  it("sub-category (module) summary matches filter by module id", () => {
    const moduleId = "accounting-engine";
    const row = computeSubCategorySummary(controlPoints, { moduleId });
    expect(sumStatuses(row)).toBe(row.total);
    const filtered = filterControlPointsForMonitorList(
      controlPoints,
      { status: "fail", moduleId, groupId: null, healthNonPass: false, listAggregation: null },
      monitorGroupModuleIds,
    );
    expect(filtered.length).toBe(row.fail);
  });

  it("visible module map summary equals sum of displayed main group row counts", () => {
    const rows = MONITOR_GROUP_DEFS.map((def) => {
      const row = computeGroupSummary(controlPoints, { id: def.id, modules: [...def.modules] });
      return {
        passCount: row.pass,
        failCount: row.fail,
        partialCount: row.partial,
        blockedCount: row.blocked,
        totalCp: row.total,
      };
    });
    const visible = sumVisibleModuleMapSummaryFromDisplayedGroupRows(rows);
    const expectedFail = rows.reduce((s, r) => s + r.failCount, 0);
    expect(visible.fail).toBe(expectedFail);
    expect(visible.pass + visible.fail + visible.partial + visible.blocked).toBe(visible.total);
  });

  it("Summary fail group-row expansion count equals sum of main group fail counts (allows duplicate CPs across groups)", () => {
    const displayRows = MONITOR_GROUP_DEFS.map((def) => {
      const row = computeGroupSummary(controlPoints, { id: def.id, modules: [...def.modules] });
      return {
        passCount: row.pass,
        failCount: row.fail,
        partialCount: row.partial,
        blockedCount: row.blocked,
        totalCp: row.total,
      };
    });
    const visibleSum = sumVisibleModuleMapSummaryFromDisplayedGroupRows(displayRows);
    const expanded = expandVisibleMainGroupsGroupRowResults(controlPoints, "fail", false);
    expect(expanded.length).toBe(visibleSum.fail);
    expect(expanded.every((r) => r.cp.status === "fail")).toBe(true);
    const uniqueIds = new Set(expanded.map((r) => r.cp.id)).size;
    const globalFail = computeGlobalSummary(controlPoints).fail;
    expect(uniqueIds).toBeLessThanOrEqual(globalFail);
    const copyText = formatSummaryGroupRowsForCopy(expanded);
    const dataLines = copyText.split("\n").filter((line) => line.includes(" | ") && !line.startsWith("CP-ID"));
    expect(dataLines.length).toBe(expanded.length);
  });
});
