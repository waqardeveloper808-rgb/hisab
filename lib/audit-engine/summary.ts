import type { SystemMonitorControlPoint, SystemMonitorStatus } from "@/lib/audit-engine/monitor-types";

export type SystemMonitorSummary = {
  pass: number;
  fail: number;
  partial: number;
  blocked: number;
};

const STATUSES: SystemMonitorStatus[] = ["pass", "fail", "partial", "blocked"];

export function computeSummary(controlPoints: readonly SystemMonitorControlPoint[]): SystemMonitorSummary {
  const counts: SystemMonitorSummary = { pass: 0, fail: 0, partial: 0, blocked: 0 };
  for (const cp of controlPoints) {
    if (STATUSES.includes(cp.status)) {
      counts[cp.status] += 1;
    }
  }
  return counts;
}

export function totalControlPointCount(controlPoints: readonly SystemMonitorControlPoint[]): number {
  return controlPoints.length;
}

/** Control points that list `moduleId` in `linked_project_modules` (one CP can appear in multiple modules). */
export function controlPointsForModuleId(
  controlPoints: readonly SystemMonitorControlPoint[],
  moduleId: string,
): SystemMonitorControlPoint[] {
  return controlPoints.filter((cp) => cp.linked_project_modules.includes(moduleId));
}

/**
 * Unique control points that touch at least one module in the group.
 * Prevents double-counting when summing per-module fail counts (global FAIL stays consistent as unique set).
 */
export function controlPointsForGroupUnique(
  controlPoints: readonly SystemMonitorControlPoint[],
  groupModuleIds: readonly string[],
): SystemMonitorControlPoint[] {
  const byId = new Map<string, SystemMonitorControlPoint>();
  for (const cp of controlPoints) {
    if (cp.linked_project_modules.some((m) => groupModuleIds.includes(m))) {
      byId.set(cp.id, cp);
    }
  }
  return [...byId.values()];
}

export function filterByStatus(
  controlPoints: readonly SystemMonitorControlPoint[],
  status: SystemMonitorStatus,
): SystemMonitorControlPoint[] {
  return controlPoints.filter((cp) => cp.status === status);
}

export function filterBySeverity(
  controlPoints: readonly SystemMonitorControlPoint[],
  severity: SystemMonitorControlPoint["severity"],
): SystemMonitorControlPoint[] {
  return controlPoints.filter((cp) => cp.severity === severity);
}

export function healthPercentFromSummary(
  summary: SystemMonitorSummary,
  total: number,
): number {
  if (total <= 0) {
    return 0;
  }
  return Math.round((summary.pass / total) * 100);
}

function formatModule(cp: SystemMonitorControlPoint) {
  return cp.module;
}

function severityOrder(s: string) {
  return s === "critical" ? 0 : s === "high" ? 1 : s === "medium" ? 2 : 3;
}

export type AuditReportContext = {
  generatedAt: string;
  lastRefreshedAt?: string;
  /** Summed Core + Finance + Platform main group row totals (same as System Monitor Summary cards). */
  visibleSummaryMainMap?: {
    pass: number;
    fail: number;
    partial: number;
    blocked: number;
    total: number;
  };
  moduleRows?: Array<{
    id: string;
    name: string;
    summary: SystemMonitorSummary;
    total: number;
    healthPercent: number;
  }>;
  groupRows?: Array<{
    id: string;
    name: string;
    summary: SystemMonitorSummary;
    total: number;
    scope: string;
  }>;
};

export function generateAuditReport(
  controlPoints: readonly SystemMonitorControlPoint[],
  ctx?: AuditReportContext,
) {
  const summary = computeSummary(controlPoints);
  const lines: string[] = [];
  const ts = ctx?.lastRefreshedAt ?? ctx?.generatedAt;
  if (ts) {
    lines.push(`Generated: ${ctx?.generatedAt ?? ""}`.trim());
    lines.push(`Last refreshed: ${ctx?.lastRefreshedAt ?? ctx?.generatedAt ?? "Not available"}`);
    lines.push("");
  }
  if (ctx?.visibleSummaryMainMap) {
    lines.push("SUMMARY (main module map — summed group rows: Core System + Finance Engines + Platform Layers)");
    lines.push(`PASS (sum): ${ctx.visibleSummaryMainMap.pass}`);
    lines.push(`FAIL (sum): ${ctx.visibleSummaryMainMap.fail}`);
    lines.push(`PARTIAL (sum): ${ctx.visibleSummaryMainMap.partial}`);
    lines.push(`BLOCKED (sum): ${ctx.visibleSummaryMainMap.blocked}`);
    lines.push(`TOTAL (sum): ${ctx.visibleSummaryMainMap.total}`);
    lines.push("");
  }

  lines.push("GLOBAL (unique control points)");
  lines.push(`PASS: ${summary.pass}`);
  lines.push(`FAIL: ${summary.fail}`);
  lines.push(`PARTIAL: ${summary.partial}`);
  lines.push(`BLOCKED: ${summary.blocked}`);
  lines.push(`TOTAL: ${controlPoints.length}`);
  const sum = summary.pass + summary.fail + summary.partial + summary.blocked;
  if (sum !== controlPoints.length) {
    lines.push(`NOTE: status sum ${sum} vs length ${controlPoints.length} (investigate if non-canonical status present).`);
  }
  lines.push("");

  if (ctx?.groupRows?.length) {
    lines.push("GROUP SCOPES (unique CPs; each control point counted at most once per group)");
    for (const g of ctx.groupRows) {
      lines.push(
        `[${g.name}] PASS=${g.summary.pass} FAIL=${g.summary.fail} PARTIAL=${g.summary.partial} BLOCKED=${g.summary.blocked} TOTAL=${g.total} — ${g.scope}`,
      );
    }
    lines.push("");
  }

  if (ctx?.moduleRows?.length) {
    lines.push("PER-MODULE (CP may appear in several modules; sums can exceed global FAIL)");
    for (const m of ctx.moduleRows) {
      lines.push(
        `[${m.name}] id=${m.id} PASS=${m.summary.pass} FAIL=${m.summary.fail} PARTIAL=${m.summary.partial} BLOCKED=${m.summary.blocked} TOTAL=${m.total} HEALTH=${m.healthPercent}%`,
      );
    }
    lines.push("");
  }

  const criticalFails = controlPoints
    .filter((cp) => cp.status !== "pass" && cp.severity === "critical")
    .sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity) || b.timestamp.localeCompare(a.timestamp));
  const seenCritical = new Set<string>();
  lines.push("CRITICAL FAILS (severity=critical, non-pass):");
  if (criticalFails.length === 0) {
    lines.push("(none)");
  } else {
    let n = 0;
    for (const cp of criticalFails) {
      if (seenCritical.has(cp.id)) continue;
      seenCritical.add(cp.id);
      n += 1;
      lines.push(`${n}. [${cp.id}] ${cp.title}`);
    }
  }
  lines.push("");

  const highFails = topCriticalFails(controlPoints, 50).filter((c) => c.severity === "high");
  lines.push("TOP HIGH (non-pass, truncated):");
  for (const cp of highFails.slice(0, 15)) {
    lines.push(`- [${cp.id}] ${cp.title}`);
  }
  lines.push("");

  lines.push("FAIL LIST:");
  for (const cp of filterByStatus(controlPoints, "fail")) {
    const mod = formatModule(cp);
    lines.push(`- [${mod}] [${cp.id}] ${cp.title}`);
  }
  lines.push("");

  lines.push("PARTIAL LIST:");
  for (const cp of filterByStatus(controlPoints, "partial")) {
    const mod = formatModule(cp);
    lines.push(`- [${mod}] [${cp.id}] ${cp.title}`);
  }
  lines.push("");

  lines.push("BLOCKED LIST:");
  for (const cp of filterByStatus(controlPoints, "blocked")) {
    const mod = formatModule(cp);
    lines.push(`- [${mod}] [${cp.id}] ${cp.title}`);
  }
  lines.push("");

  lines.push("EVIDENCE / WARNINGS:");
  for (const cp of controlPoints.filter((c) => c.link_missing)) {
    lines.push(`- [${cp.id}] link_missing (traceability gap)`);
  }
  if (!controlPoints.some((c) => c.link_missing)) {
    lines.push("(no link_missing flags)");
  }
  lines.push("");

  lines.push("RECOMMENDED SCOPE (from control nonconformity text, first 10 non-pass):");
  for (const cp of controlPoints.filter((c) => c.status !== "pass").slice(0, 10)) {
    lines.push(`- [${cp.id}] ${cp.recommended_next_action}`);
  }
  lines.push("");

  return lines.join("\n");
}

export function filterControlPoints(
  controlPoints: readonly SystemMonitorControlPoint[],
  selectedFilter: { status: SystemMonitorStatus | null; module: string | null },
) {
  return controlPoints.filter((cp) => {
    return (
      (!selectedFilter.status || cp.status === selectedFilter.status) &&
      (!selectedFilter.module || cp.module === selectedFilter.module)
    );
  });
}

/** Same as filterControlPoints, but also matches when `module` is a `linked_project_modules` id (e.g. accounting-engine). */
export function filterControlPointsByModuleOrProject(
  controlPoints: readonly SystemMonitorControlPoint[],
  selectedFilter: { status: SystemMonitorStatus | null; module: string | null },
) {
  return controlPoints.filter((cp) => {
    if (selectedFilter.status && cp.status !== selectedFilter.status) {
      return false;
    }
    if (!selectedFilter.module) {
      return true;
    }
    if (cp.module === selectedFilter.module) {
      return true;
    }
    if (cp.linked_project_modules.includes(selectedFilter.module)) {
      return true;
    }
    return false;
  });
}

export function topCriticalFails(
  controlPoints: readonly SystemMonitorControlPoint[],
  limit = 8,
) {
  return controlPoints
    .filter((cp) => (cp.severity === "critical" || cp.severity === "high") && cp.status !== "pass")
    .sort(
      (a, b) =>
        severityOrder(a.severity) - severityOrder(b.severity) || b.timestamp.localeCompare(a.timestamp),
    )
    .slice(0, limit);
}

export function copyFaultText(point: SystemMonitorControlPoint): string {
  return [
    `ID: ${point.id}`,
    `Status: ${point.status}`,
    `Severity: ${point.severity}`,
    `Module: ${point.module}`,
    `Title: ${point.title}`,
    `Expected: ${point.expected_behavior}`,
    `Actual: ${point.actual_behavior}`,
    `Root cause: ${point.root_cause_hint ?? "Not available"}`,
    `Evaluation: ${point.evaluation_method}`,
    `Evidence refs: ${point.evidence_references.join("; ") || "Not available"}`,
    `Source doc: ${point.source_standard_document || "Not available"}`,
    `Timestamp: ${point.timestamp}`,
    `Recommended: ${point.recommended_next_action || "Not available"}`,
  ].join("\n");
}
