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
import { buildSystemMonitorTraceability } from "@/lib/audit-engine/system-monitor-traceability";

function sumStatuses(s: { pass: number; fail: number; partial: number; blocked: number }) {
  return s.pass + s.fail + s.partial + s.blocked;
}

describe("control-point-summary-engine", () => {
  const controlPoints: SystemMonitorControlPoint[] = buildSystemMonitorControlPoints("2026-01-01T00:00:00.000Z");
  const trace = buildSystemMonitorTraceability(controlPoints).payload;

  it("global unique: pass+fail+partial+blocked equals total", () => {
    const g = computeGlobalSummary(controlPoints);
    expect(sumStatuses(g)).toBe(g.total);
  });

  it("traceability: global equals sum of three main groups", () => {
    const sumT = trace.groups.reduce((a, g) => a + g.total, 0);
    expect(sumT).toBe(trace.summary.total);
    expect(trace.groups.reduce((a, g) => a + g.fail, 0)).toBe(trace.summary.fail);
  });

  it("each traceability group: module rollups sum to group totals", () => {
    for (const g of trace.groups) {
      const m = g.modules.reduce(
        (acc, row) => ({
          pass: acc.pass + row.pass,
          fail: acc.fail + row.fail,
          partial: acc.partial + row.partial,
          blocked: acc.blocked + row.blocked,
          total: acc.total + row.total,
        }),
        { pass: 0, fail: 0, partial: 0, blocked: 0, total: 0 },
      );
      expect(m.pass, g.id).toBe(g.pass);
      expect(m.fail, g.id).toBe(g.fail);
      expect(m.total, g.id).toBe(g.total);
    }
  });

  it("each main group (link-unique rollup): pass+fail+partial+blocked equals group total", () => {
    for (const def of MONITOR_GROUP_DEFS) {
      const row = computeGroupSummary(controlPoints, { id: def.id, modules: [...def.modules] });
      expect(sumStatuses(row), def.id).toBe(row.total);
    }
  });

  it("Core System fail filter count matches traceability ownership fail", () => {
    const core = trace.groups.find((g) => g.id === "core-system")!;
    const filtered = filterControlPointsForMonitorList(
      controlPoints,
      { status: "fail", moduleId: null, groupId: "core-system", healthNonPass: false, listAggregation: null },
      monitorGroupModuleIds,
    );
    expect(filtered.length).toBe(core.fail);
    expect(filtered.every((c) => c.status === "fail")).toBe(true);
    expect(filtered.every((c) => c.primaryGroupId === "core-system")).toBe(true);
  });

  it("Finance Engines fail filter matches traceability group fail", () => {
    const fin = trace.groups.find((g) => g.id === "finance-engines")!;
    const filtered = filterControlPointsForMonitorList(
      controlPoints,
      { status: "fail", moduleId: null, groupId: "finance-engines", healthNonPass: false, listAggregation: null },
      monitorGroupModuleIds,
    );
    expect(filtered.length).toBe(fin.fail);
    expect(filtered.every((c) => c.status === "fail")).toBe(true);
  });

  it("Platform Layers pass filter matches traceability group pass", () => {
    const plat = trace.groups.find((g) => g.id === "platform-layers")!;
    const filtered = filterControlPointsForMonitorList(
      controlPoints,
      { status: "pass", moduleId: null, groupId: "platform-layers", healthNonPass: false, listAggregation: null },
      monitorGroupModuleIds,
    );
    expect(filtered.length).toBe(plat.pass);
    expect(filtered.every((c) => c.status === "pass")).toBe(true);
  });

  it("primary-module fail filter matches traceability module rollup (not link-expanded totals)", () => {
    const moduleId = "accounting-engine";
    const modRollup = trace.groups.flatMap((g) => g.modules).find((m) => m.id === moduleId)!;
    const row = computeSubCategorySummary(controlPoints, { moduleId });
    expect(sumStatuses(row)).toBe(row.total);
    const filtered = filterControlPointsForMonitorList(
      controlPoints,
      { status: "fail", moduleId, groupId: null, healthNonPass: false, listAggregation: null },
      monitorGroupModuleIds,
    );
    expect(filtered.length).toBe(modRollup.fail);
    expect(filtered.every((c) => c.primaryModuleId === moduleId)).toBe(true);
  });

  it("visible module map summary equals sum of displayed main group row counts (link-based diagnostic)", () => {
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
    const globalFail = trace.summary.fail;
    expect(uniqueIds).toBeLessThanOrEqual(globalFail);
    const copyText = formatSummaryGroupRowsForCopy(expanded);
    const dataLines = copyText.split("\n").filter((line) => line.includes(" | ") && !line.startsWith("CP-ID"));
    expect(dataLines.length).toBe(expanded.length);
  });
});
