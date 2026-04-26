"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { masterDesignHierarchy } from "@/data/master-design/hierarchy";
import {
  getControlPointByNodeId,
  type ControlPointImplementationStatus,
  type MasterDesignControlPointRecord,
} from "@/lib/master-design-control-points";
import type { MasterDesignHierarchyNodeSpec } from "@/types/master-design";
import type { MasterDesignSnapshot } from "@/lib/master-design-engine";
import type { ComparisonModuleResult, ModuleExecutionStatus, ModuleProgressGroup, SystemBlocker } from "@/types/system-map";
import { masterDesignControlPoints } from "@/lib/master-design-control-points";

const refreshIntervalMs = 30000;
const groupOrder: ModuleProgressGroup[] = ["Core platform", "Commercial flows", "Accounting / inventory / VAT", "Reports / import / proof", "Country readiness"];
const nodeStatusOrder: ModuleExecutionStatus[] = ["BLOCKED", "FAKE-COMPLETE", "MISSING", "PARTIAL", "COMPLETE"];

const controlPointAuditSummary = {
  totalCount: masterDesignControlPoints.length,
  evaluatedCount: 0,
  passCount: 0,
  failCount: 0,
  partialCount: 0,
  blockedCount: masterDesignControlPoints.length,
  systemRiskLevel: "critical" as const,
  systemRiskScore: 100,
  criticalFailureCount: masterDesignControlPoints.filter((controlPoint) => controlPoint.severity === "critical").length,
  weakModuleCount: new Set(masterDesignControlPoints.map((controlPoint) => controlPoint.module_code)).size,
};

const controlPointRiskSummary = {
  modules: masterDesignControlPoints.map((controlPoint) => ({
    module_code: controlPoint.module_code,
    module_name: controlPoint.module_name,
    risk_level: controlPoint.severity,
  })),
};

type SortKey = "group" | "module" | "submodulesTotal" | "submodulesComplete" | "status" | "completion" | "structural" | "runtime" | "proof" | "confidence" | "assigned" | "completed" | "failed";

type DisplayStatus = ModuleExecutionStatus | ControlPointImplementationStatus;

type ResolvedHierarchyNode = {
  id: string;
  parentId: string | null;
  title: string;
  type: MasterDesignHierarchyNodeSpec["type"];
  description: string;
  standards: string[];
  audits: string[];
  workflows: string[];
  linkedModuleIds: ComparisonModuleResult["moduleId"][];
  linkedModules: ComparisonModuleResult[];
  progressPercentage: number;
  status: ModuleExecutionStatus;
  childCount: number;
  descendantCount: number;
  completedChildren: number;
  partialChildren: number;
  blockedChildren: number;
  blockerCount: number;
  fakeCompleteFlag: boolean;
  topBlocker: string | null;
  blockers: string[];
  fakeCompleteRisk: string | null;
  controlPoint: MasterDesignControlPointRecord | null;
  auditSummary: {
    total: number;
    evaluated: number;
    pass: number;
    fail: number;
    partial: number;
    blocked: number;
  };
  pathIds: string[];
  pathTitles: string[];
  children: ResolvedHierarchyNode[];
};

function statusTone(status: ModuleExecutionStatus) {
  switch (status) {
    case "COMPLETE":
      return "border-emerald-200 bg-emerald-50/80 text-emerald-800";
    case "PARTIAL":
      return "border-amber-200 bg-amber-50/80 text-amber-800";
    case "FAKE-COMPLETE":
      return "border-fuchsia-200 bg-fuchsia-50/80 text-fuchsia-800";
    case "BLOCKED":
      return "border-red-200 bg-red-50/80 text-red-800";
    default:
      return "border-slate-200 bg-slate-50/80 text-slate-700";
  }
}

function contaminationTone(severity: "none" | "informational" | "warning" | "blocking") {
  switch (severity) {
    case "blocking":
      return "border-red-200 bg-red-50/70 text-red-800";
    case "warning":
      return "border-amber-200 bg-amber-50/70 text-amber-800";
    case "informational":
      return "border-sky-200 bg-sky-50/70 text-sky-800";
    default:
      return "border-slate-200 bg-slate-50/70 text-slate-700";
  }
}

function controlPointStatusTone(status: ControlPointImplementationStatus) {
  switch (status) {
    case "PASS":
      return "border-emerald-200 bg-emerald-50/80 text-emerald-800";
    case "PARTIAL":
      return "border-amber-200 bg-amber-50/80 text-amber-800";
    case "FAIL":
      return "border-red-200 bg-red-50/80 text-red-800";
    case "BLOCKED":
      return "border-slate-300 bg-slate-100/90 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50/80 text-slate-700";
  }
}

function renderEvidenceItem(item: string) {
  const match = item.match(/\((app\/[^)]+|components\/[^)]+|data\/[^)]+|lib\/[^)]+|backend\/[^)]+|tools\/[^)]+)\)$/);
  if (match) {
    const reference = match[1];
    const label = item.slice(0, Math.max(0, item.lastIndexOf(`(${reference})`))).trim();
    return (
      <>
        <span>{label} </span>
        <a className="text-sky-700 underline underline-offset-2" href={`/${reference}`}>
          {reference}
        </a>
      </>
    );
  }

  const routeMatch = item.match(/(\/workspace\/[a-z0-9\-\/]+)/i);
  if (routeMatch) {
    return (
      <a className="text-sky-700 underline underline-offset-2" href={routeMatch[1]}>
        {item}
      </a>
    );
  }

  return item;
}

function displayStatusTone(status: DisplayStatus) {
  if (status === "PASS" || status === "PARTIAL" || status === "FAIL" || status === "BLOCKED") {
    return controlPointStatusTone(status);
  }

  return statusTone(status);
}

function severityTone(severity: MasterDesignControlPointRecord["severity"]) {
  switch (severity) {
    case "critical":
      return "border-red-200 bg-red-50/70 text-red-800";
    case "high":
      return "border-orange-200 bg-orange-50/70 text-orange-800";
    case "medium":
      return "border-amber-200 bg-amber-50/70 text-amber-800";
    default:
      return "border-slate-200 bg-slate-50/70 text-slate-700";
  }
}

function compareStatus(left: ModuleExecutionStatus, right: ModuleExecutionStatus) {
  const order: ModuleExecutionStatus[] = ["BLOCKED", "FAKE-COMPLETE", "PARTIAL", "COMPLETE", "MISSING"];
  return order.indexOf(left) - order.indexOf(right);
}

function compareGroup(left: ModuleProgressGroup, right: ModuleProgressGroup) {
  return groupOrder.indexOf(left) - groupOrder.indexOf(right);
}

function formatStamp(value: string) {
  return new Date(value).toLocaleString("en-SA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function dedupeStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function pickWorstStatus(statuses: ModuleExecutionStatus[]) {
  if (!statuses.length) {
    return "MISSING" as const;
  }

  return [...statuses].sort((left, right) => nodeStatusOrder.indexOf(left) - nodeStatusOrder.indexOf(right))[0];
}

function pickTopBlocker(blockers: SystemBlocker[]) {
  const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
  return [...blockers].sort((left, right) => severityRank[right.severity] - severityRank[left.severity])[0] ?? null;
}

function getDisplayStatus(node: ResolvedHierarchyNode): DisplayStatus {
  return node.controlPoint?.state.status ?? node.status;
}

function getDisplayProgress(node: ResolvedHierarchyNode) {
  return node.controlPoint?.state.score ?? node.progressPercentage;
}

function countDescendants(node: ResolvedHierarchyNode): number {
  return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
}

function buildEmptyAuditSummary() {
  return {
    total: 0,
    evaluated: 0,
    pass: 0,
    fail: 0,
    partial: 0,
    blocked: 0,
  };
}

function mergeAuditSummary(
  current: ReturnType<typeof buildEmptyAuditSummary>,
  next: ReturnType<typeof buildEmptyAuditSummary>,
) {
  return {
    total: current.total + next.total,
    evaluated: current.evaluated + next.evaluated,
    pass: current.pass + next.pass,
    fail: current.fail + next.fail,
    partial: current.partial + next.partial,
    blocked: current.blocked + next.blocked,
  };
}

function resolveHierarchyNode(
  spec: MasterDesignHierarchyNodeSpec,
  moduleMap: Map<ComparisonModuleResult["moduleId"], ComparisonModuleResult>,
  blockerMap: Map<ComparisonModuleResult["moduleId"], SystemBlocker[]>,
  pathIds: string[] = [],
  pathTitles: string[] = [],
): ResolvedHierarchyNode {
  const controlPoint = getControlPointByNodeId(spec.id);
  const linkedModules = spec.linkedModuleIds
    .map((moduleId) => moduleMap.get(moduleId))
    .filter((module): module is ComparisonModuleResult => Boolean(module));
  const children = spec.children.map((child) => resolveHierarchyNode(child, moduleMap, blockerMap, [...pathIds, spec.id], [...pathTitles, spec.title]));
  const linkedBlockers = linkedModules.flatMap((module) => blockerMap.get(module.moduleId) ?? []);
  const childBlockers = children.flatMap((child) => child.blockers);
  const blockerLabels = dedupeStrings([spec.topBlockerHint, ...linkedBlockers.map((blocker) => blocker.title), ...childBlockers]);
  const progressSources = [
    ...(controlPoint ? [controlPoint.state.score] : [spec.completionPercentage, ...linkedModules.map((module) => module.completionPercentage), ...children.map((child) => getDisplayProgress(child))]),
  ];
  const statusSources = [
    spec.status,
    ...linkedModules.map((module) => module.status),
    ...children.map((child) => child.status),
  ];
  const descendantCount = children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
  const derivedBlockerCount = Math.max(spec.blockerCount, blockerLabels.length, children.reduce((sum, child) => sum + child.blockerCount, 0));
  const directAuditSummary = controlPoint ? {
    total: 1,
    evaluated: 1,
    pass: controlPoint.state.status === "PASS" ? 1 : 0,
    fail: controlPoint.state.status === "FAIL" ? 1 : 0,
    partial: controlPoint.state.status === "PARTIAL" ? 1 : 0,
    blocked: controlPoint.state.status === "BLOCKED" ? 1 : 0,
  } : buildEmptyAuditSummary();
  const childAuditSummary = children.reduce((summary, child) => mergeAuditSummary(summary, child.auditSummary), buildEmptyAuditSummary());
  const auditSummary = mergeAuditSummary(directAuditSummary, childAuditSummary);

  return {
    id: spec.id,
    parentId: spec.parentId,
    title: spec.title,
    type: spec.type,
    description: spec.description,
    standards: spec.linkedStandards,
    audits: spec.linkedAudits,
    workflows: spec.linkedWorkflows,
    linkedModuleIds: spec.linkedModuleIds,
    linkedModules,
    progressPercentage: Math.round(progressSources.reduce((sum, value) => sum + value, 0) / progressSources.length),
    status: pickWorstStatus(statusSources),
    childCount: children.length,
    descendantCount,
    completedChildren: Math.max(spec.completedChildren, children.filter((child) => child.status === "COMPLETE").length),
    partialChildren: Math.max(spec.partialChildren, children.filter((child) => child.status === "PARTIAL" || child.status === "MISSING" || child.status === "FAKE-COMPLETE").length),
    blockedChildren: Math.max(spec.blockedChildren, children.filter((child) => child.status === "BLOCKED").length),
    blockerCount: derivedBlockerCount,
    fakeCompleteFlag: Boolean(spec.fakeCompleteRisk || spec.status === "FAKE-COMPLETE" || linkedModules.some((module) => module.status === "FAKE-COMPLETE") || children.some((child) => child.fakeCompleteFlag)),
    topBlocker: blockerLabels[0] ?? pickTopBlocker(linkedBlockers)?.title ?? null,
    blockers: blockerLabels,
    fakeCompleteRisk: spec.fakeCompleteRisk,
    controlPoint,
    auditSummary,
    pathIds: [...pathIds, spec.id],
    pathTitles: [...pathTitles, spec.title],
    children,
  };
}

function flattenHierarchy(node: ResolvedHierarchyNode): ResolvedHierarchyNode[] {
  return [node, ...node.children.flatMap(flattenHierarchy)];
}

function KpiCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <Card className="flex h-full min-h-[116px] flex-col justify-between rounded-lg bg-white/95 p-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] leading-4 text-muted">{label}</p>
      <p className="mt-2 text-xl font-bold leading-7 text-ink">{value}</p>
      <p className="mt-2 text-[11px] leading-5 text-muted">{subtext}</p>
    </Card>
  );
}

function SummaryPill({ label, value, tone = "border-line bg-white text-ink" }: { label: string; value: string; tone?: string }) {
  return (
    <div className={["flex min-h-[84px] flex-col justify-between rounded-xl border px-3 py-3 text-left", tone].join(" ")}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] leading-4">{label}</p>
      <p className="mt-2 text-sm font-bold leading-5 sm:text-base">{value}</p>
    </div>
  );
}

function DetailSection({
  title,
  tone = "border-line bg-white",
  children,
}: {
  title: string;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={["rounded-xl border p-3", tone].join(" ")}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{title}</p>
      <div className="mt-2 text-xs text-ink">{children}</div>
    </section>
  );
}

function StatusBadge({ status }: { status: ModuleExecutionStatus }) {
  return <span className={["rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]", statusTone(status)].join(" ")}>{status}</span>;
}

function DisplayStatusBadge({ status }: { status: DisplayStatus }) {
  return <span className={["rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]", displayStatusTone(status)].join(" ")}>{status}</span>;
}

function DrilldownCard({
  node,
  isActive,
  onClick,
}: {
  node: ResolvedHierarchyNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-inspector-master-design-card={node.id}
      className={[
        "h-full rounded-xl border p-3 text-left transition",
        isActive
          ? "border-primary bg-[linear-gradient(180deg,rgba(91,198,63,0.12),rgba(255,255,255,0.98))] shadow-[0_18px_28px_-24px_rgba(63,174,42,0.32)]"
          : "border-line bg-white hover:border-primary/30 hover:bg-primary-soft/18",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{node.type.replaceAll("-", " ")}</p>
          <h3 className="mt-1 text-sm font-semibold text-ink">{node.title}</h3>
        </div>
        <DisplayStatusBadge status={getDisplayStatus(node)} />
      </div>
      <p className="mt-2 line-clamp-3 min-h-[3.6rem] text-xs leading-5 text-muted">{node.description}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-ink xl:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface-soft/70 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Progress</p>
          <p className="mt-1 font-semibold">{getDisplayProgress(node)}%</p>
        </div>
        <div className="rounded-lg border border-line bg-surface-soft/70 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Status</p>
          <p className="mt-1 font-semibold">{getDisplayStatus(node)}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface-soft/70 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted">{node.controlPoint ? "Severity" : "Children"}</p>
          <p className="mt-1 font-semibold">{node.controlPoint ? node.controlPoint.severity : node.childCount}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface-soft/70 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Blockers</p>
          <p className="mt-1 font-semibold">{node.blockerCount}</p>
        </div>
      </div>
      {node.auditSummary.total ? (
        <div className="mt-3 rounded-lg border border-line bg-white px-2 py-2 text-[10px] text-muted" data-inspector-master-design-audit-card-summary={node.id}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">Audit coverage {node.auditSummary.evaluated}/{node.auditSummary.total}</span>
            <span>PASS {node.auditSummary.pass}</span>
            <span>FAIL {node.auditSummary.fail}</span>
            <span>PARTIAL {node.auditSummary.partial}</span>
            <span>BLOCKED {node.auditSummary.blocked}</span>
          </div>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]">
        {node.fakeCompleteFlag ? <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2 py-0.5 text-fuchsia-800">Fake-complete risk</span> : null}
        {node.childCount ? <span className="rounded-full border border-line bg-white px-2 py-0.5 text-muted">{node.childCount} direct children</span> : <span className="rounded-full border border-line bg-white px-2 py-0.5 text-muted">Terminal detail</span>}
      </div>
      {node.topBlocker ? <p className="mt-2 text-xs text-red-700">Top blocker: {node.topBlocker}</p> : null}
    </button>
  );
}

async function fetchSnapshot(signal?: AbortSignal) {
  const response = await fetch(`/api/master-design/status?ts=${Date.now()}`, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("Unable to load Master Design status.");
  }

  const payload = await response.json() as { data: MasterDesignSnapshot };
  return payload.data;
}

export function MasterDesignDashboard({ initialSnapshot }: { initialSnapshot: MasterDesignSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedModuleId, setSelectedModuleId] = useState<ComparisonModuleResult["moduleId"]>(initialSnapshot.comparison.modules[0]?.moduleId ?? "identity-workspace");
  const [currentNodeId, setCurrentNodeId] = useState(masterDesignHierarchy.id);
  const [selectedDetailId, setSelectedDetailId] = useState(masterDesignHierarchy.id);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("group");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  async function refresh() {
    const controller = new AbortController();
    try {
      setIsRefreshing(true);
      setRefreshError(null);
      const nextSnapshot = await fetchSnapshot(controller.signal);
      setSnapshot(nextSnapshot);
      setSelectedModuleId((current) => current || nextSnapshot.comparison.modules[0]?.moduleId || "identity-workspace");
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Unable to refresh Master Design status.");
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, refreshIntervalMs);

    return () => window.clearInterval(interval);
  }, []);

  const selectedComparison = snapshot.comparison.modules.find((module) => module.moduleId === selectedModuleId) ?? snapshot.comparison.modules[0];
  const selectedTarget = snapshot.target.modules.find((module) => module.id === selectedComparison?.moduleId) ?? snapshot.target.modules[0];
  const selectedActual = snapshot.actual.modules.find((module) => module.id === selectedComparison?.moduleId) ?? snapshot.actual.modules[0];
  const blockerModules = useMemo(() => snapshot.comparison.blockedModules.map((module) => module.moduleName), [snapshot.comparison.blockedModules]);

  const progressRows = useMemo(() => {
    const rows = [...snapshot.comparison.modules];
    rows.sort((left, right) => {
      let result = 0;
      switch (sortKey) {
        case "group":
          result = compareGroup(left.group, right.group) || left.moduleName.localeCompare(right.moduleName);
          break;
        case "module":
          result = left.moduleName.localeCompare(right.moduleName);
          break;
        case "submodulesTotal":
          result = left.submodules.total - right.submodules.total;
          break;
        case "submodulesComplete":
          result = left.submodules.complete - right.submodules.complete;
          break;
        case "status":
          result = compareStatus(left.status, right.status);
          break;
        case "completion":
          result = left.completionPercentage - right.completionPercentage;
          break;
        case "structural":
          result = compareStatus(left.structuralStatus, right.structuralStatus);
          break;
        case "runtime":
          result = compareStatus(left.runtimeStatus, right.runtimeStatus);
          break;
        case "proof":
          result = left.proofStatus.localeCompare(right.proofStatus);
          break;
        case "confidence":
          result = left.confidence.score - right.confidence.score;
          break;
        case "assigned":
          result = left.assignedTasks - right.assignedTasks;
          break;
        case "completed":
          result = left.completedTasks - right.completedTasks;
          break;
        case "failed":
          result = left.failedTasks - right.failedTasks;
          break;
      }
      return sortDirection === "asc" ? result : result * -1;
    });
    return rows;
  }, [snapshot.comparison.modules, sortDirection, sortKey]);

  function updateSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => current === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "completion" || nextKey === "confidence" || nextKey === "completed" ? "desc" : "asc");
  }

  const hierarchy = useMemo(() => {
    const moduleMap = new Map(snapshot.comparison.modules.map((module) => [module.moduleId, module]));
    const blockerMap = new Map(snapshot.actual.modules.map((module) => [module.id, module.blockers]));
    return resolveHierarchyNode(masterDesignHierarchy, moduleMap, blockerMap);
  }, [snapshot.actual.modules, snapshot.comparison.modules]);

  const hierarchyNodes = useMemo(() => flattenHierarchy(hierarchy), [hierarchy]);
  const hierarchyExport = useMemo(() => JSON.stringify(hierarchy, null, 2), [hierarchy]);
  const hierarchyNodeMap = useMemo(() => new Map(hierarchyNodes.map((node) => [node.id, node])), [hierarchyNodes]);
  const currentNode = hierarchyNodeMap.get(currentNodeId) ?? hierarchy;
  const selectedDetail = hierarchyNodeMap.get(selectedDetailId) ?? currentNode;
  const currentChildren = currentNode.children;
  const breadcrumbNodes = currentNode.pathIds.map((id) => hierarchyNodeMap.get(id)).filter((node): node is ResolvedHierarchyNode => Boolean(node));
  const rootCategories = hierarchy.children.filter((node) => node.id !== "remaining-work-risks");
  const visibleNodes = currentNode.id === hierarchy.id ? rootCategories : currentChildren;
  const viewLabel = currentNode.id === hierarchy.id ? "LEVEL 1 — MAIN CARDS" : currentNode.children.length ? "Drill-down" : "Terminal detail";
  const summaryBlocker = snapshot.comparison.topBlockers[0]?.title ?? hierarchy.topBlocker ?? "No blocker recorded";
  const selectedDirectChildSummary = selectedDetail.childCount
    ? `${selectedDetail.childCount} direct child cards, ${selectedDetail.descendantCount} deeper nodes`
    : "Terminal node with no further drill-down";

  function handleOpenNode(nodeId: string) {
    const node = hierarchyNodeMap.get(nodeId);
    if (!node) {
      return;
    }

    setSelectedDetailId(node.id);
    if (node.children.length) {
      setCurrentNodeId(node.id);
    }
  }

  function handleBack() {
    const parentId = currentNode.parentId;
    if (!parentId) {
      return;
    }

    setCurrentNodeId(parentId);
    setSelectedDetailId(parentId);
  }

  function handleGoToCrumb(nodeId: string) {
    setCurrentNodeId(nodeId);
    setSelectedDetailId(nodeId);
  }

  return (
    <div className="space-y-3" data-inspector-master-design="dashboard">
      <script id="master-design-hierarchy-export" type="application/json" dangerouslySetInnerHTML={{ __html: hierarchyExport }} />
      <section className="space-y-2" data-inspector-master-design-hierarchy="true">
        <Card className="rounded-xl bg-[linear-gradient(135deg,rgba(18,74,50,0.08),rgba(255,255,255,0.98))] p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Master Design</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Visual drill-down control surface</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">Use the category cards to move through the system, keep context with breadcrumbs, and inspect the selected node in the detail panel without losing the lower execution surfaces.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
              <span>{isRefreshing ? "Refreshing now" : `Updated ${formatStamp(snapshot.generatedAt)}`}</span>
              <Button size="sm" variant="secondary" onClick={() => void refresh()} disabled={isRefreshing}>Refresh</Button>
            </div>
          </div>
          <div className="mt-3 grid gap-2 xl:grid-cols-[1.45fr_1fr]" data-inspector-master-design-summary-strip="true">
            <div className="rounded-2xl border border-primary-border bg-[linear-gradient(135deg,rgba(231,246,237,0.96),rgba(255,255,255,0.98))] p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Whole-system summary</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">{hierarchy.progressPercentage}% overall completion</h2>
                  <p className="mt-1 text-xs leading-5 text-muted">Executive summary for the active Master Design surface, tied to live comparison counts and current blocker pressure.</p>
                </div>
                <StatusBadge status={hierarchy.status} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryPill label="Complete" value={String(snapshot.comparison.counts.COMPLETE)} tone="border-emerald-200 bg-emerald-50 text-emerald-800" />
                <SummaryPill label="Partial" value={String(snapshot.comparison.counts.PARTIAL)} tone="border-amber-200 bg-amber-50 text-amber-800" />
                <SummaryPill label="Blocked" value={String(snapshot.comparison.counts.BLOCKED)} tone="border-red-200 bg-red-50 text-red-800" />
                <SummaryPill label="Fake-complete" value={String(snapshot.comparison.counts["FAKE-COMPLETE"])} tone="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800" />
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-white p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Top blocker summary</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink">{summaryBlocker}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <SummaryPill label="Hierarchy nodes" value={String(hierarchyNodes.length - 1)} tone="border-line bg-surface-soft/55 text-ink" />
                <SummaryPill label="Visible now" value={`${visibleNodes.length} cards`} tone="border-line bg-surface-soft/55 text-ink" />
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-6" data-inspector-master-design-audit-summary="true">
                <SummaryPill label="Total Control Points" value={String(controlPointAuditSummary.totalCount)} tone="border-line bg-surface-soft/55 text-ink" />
                <SummaryPill label="Evaluated" value={String(controlPointAuditSummary.evaluatedCount)} tone="border-sky-200 bg-sky-50 text-sky-800" />
                <SummaryPill label="Audit Pass" value={String(controlPointAuditSummary.passCount)} tone="border-emerald-200 bg-emerald-50 text-emerald-800" />
                <SummaryPill label="Audit Fail" value={String(controlPointAuditSummary.failCount)} tone="border-red-200 bg-red-50 text-red-800" />
                <SummaryPill label="Audit Partial" value={String(controlPointAuditSummary.partialCount)} tone="border-amber-200 bg-amber-50 text-amber-800" />
                <SummaryPill label="Audit Blocked" value={String(controlPointAuditSummary.blockedCount)} tone="border-slate-300 bg-slate-100 text-slate-700" />
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryPill label="System Risk" value={`${controlPointAuditSummary.systemRiskLevel.toUpperCase()} (${controlPointAuditSummary.systemRiskScore})`} tone="border-rose-200 bg-rose-50 text-rose-800" />
                <SummaryPill label="Critical Failures" value={String(controlPointAuditSummary.criticalFailureCount)} tone="border-red-200 bg-red-50 text-red-800" />
                <SummaryPill label="Weak Modules" value={String(controlPointAuditSummary.weakModuleCount)} tone="border-amber-200 bg-amber-50 text-amber-800" />
                <SummaryPill label="Top Risk Module" value={controlPointRiskSummary.modules[0] ? `${controlPointRiskSummary.modules[0].module_code} ${controlPointRiskSummary.modules[0].risk_level}` : "None"} tone="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800" />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-2 xl:grid-cols-[1.16fr_0.84fr]">
          <div className="space-y-2">
            <Card className="rounded-xl p-3.5" data-inspector-master-design-breadcrumbs="true">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                  <Button size="sm" variant="secondary" onClick={handleBack} disabled={!currentNode.parentId}>Back</Button>
                  {breadcrumbNodes.map((node, index) => (
                    <span key={node.id} className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleGoToCrumb(node.id)}
                        className={[
                          "rounded-full border px-2.5 py-1 font-semibold transition",
                          node.id === currentNode.id ? "border-primary bg-primary-soft text-primary" : "border-line bg-white text-ink hover:border-primary/30 hover:text-primary",
                        ].join(" ")}
                      >
                        {node.title}
                      </button>
                      {index < breadcrumbNodes.length - 1 ? <span className="text-slate-400">/</span> : null}
                    </span>
                  ))}
                </div>
                <span className="rounded-full border border-line bg-surface-soft px-2.5 py-1 text-[11px] font-semibold text-ink">{currentNode.type.replaceAll("-", " ")}</span>
              </div>
              <div className="mt-3 rounded-2xl border border-line bg-[linear-gradient(180deg,rgba(246,248,250,0.9),rgba(255,255,255,0.98))] p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{viewLabel}</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink" data-inspector-master-design-current-title="true">{currentNode.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted">{currentNode.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DisplayStatusBadge status={getDisplayStatus(currentNode)} />
                    <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-ink">{getDisplayProgress(currentNode)}%</span>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  <KpiCard label="Direct Children" value={String(currentNode.childCount)} subtext="Cards visible at this level" />
                  <KpiCard label="Descendants" value={String(currentNode.descendantCount)} subtext="Deeper drill-down items" />
                  <KpiCard label="Audit Coverage" value={`${currentNode.auditSummary.evaluated}/${currentNode.auditSummary.total || 0}`} subtext="Evaluated control points" />
                  <KpiCard label="Fake-complete" value={currentNode.fakeCompleteFlag ? "Yes" : "No"} subtext="Derived from node risk and linked modules" />
                </div>
              </div>
            </Card>

            <Card className="rounded-xl p-3.5" data-inspector-master-design-card-grid="true" data-inspector-master-design-current-region="children-grid">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{currentNode.id === hierarchy.id ? "Main Category Cards" : currentNode.children.length ? "Category View" : "Detail Exit Point"}</p>
                  <p className="text-xs text-muted">{currentNode.id === hierarchy.id ? "Pick a major category to open its drill-down view." : currentNode.children.length ? "Pick a sub-category to continue the drill-down or inspect it in the detail panel." : "This branch is complete at this depth. Inspect the detail panel or use breadcrumb and back to move elsewhere."}</p>
                </div>
                <span className="rounded-full border border-line bg-white px-2.5 py-0.5 text-[11px] font-semibold text-ink">{visibleNodes.length} visible</span>
              </div>
              <div className="mt-3 rounded-2xl border border-line bg-surface-soft/40 p-2.5">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {visibleNodes.map((node) => (
                  <DrilldownCard key={node.id} node={node} isActive={selectedDetail.id === node.id || currentNode.id === node.id} onClick={() => handleOpenNode(node.id)} />
                ))}
                </div>
              </div>
              {!currentChildren.length && currentNode.id !== hierarchy.id ? (
                <div className="mt-3 rounded-xl border border-dashed border-line bg-surface-soft/55 px-3 py-4 text-sm text-muted">
                  This is a terminal node. Use the detail panel to review linked modules, blockers, audits, workflows, and future evidence placeholders.
                </div>
              ) : null}
            </Card>
          </div>

          <Card className="rounded-xl p-3.5" data-inspector-master-design-detail-panel="true">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Detail Panel</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
              {selectedDetail.pathTitles.map((segment, index) => (
                <span key={`${segment}-${index}`} className="inline-flex items-center gap-2">
                  <span className="rounded-full border border-line bg-white px-2 py-0.5">{segment}</span>
                  {index < selectedDetail.pathTitles.length - 1 ? <span>/</span> : null}
                </span>
              ))}
            </div>
            <div className="mt-3 rounded-2xl border border-line bg-[linear-gradient(180deg,rgba(246,248,250,0.9),rgba(255,255,255,0.98))] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-ink" data-inspector-master-design-detail-title="true">{selectedDetail.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted">{selectedDetail.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <DisplayStatusBadge status={getDisplayStatus(selectedDetail)} />
                  <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-ink">{getDisplayProgress(selectedDetail)}%</span>
                  {selectedDetail.controlPoint ? <span className={["rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase", severityTone(selectedDetail.controlPoint.severity)].join(" ")}>{selectedDetail.controlPoint.severity}</span> : null}
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <DetailSection title="Node Summary">
                  <p>Direct children: {selectedDetail.childCount}</p>
                  <p className="mt-1">Completed children: {selectedDetail.completedChildren}</p>
                  <p className="mt-1">Partial children: {selectedDetail.partialChildren}</p>
                  <p className="mt-1">Blocked children: {selectedDetail.blockedChildren}</p>
                  <p className="mt-1">Child summary: {selectedDirectChildSummary}</p>
                </DetailSection>
                <DetailSection title="Right Panel Requirements" tone={selectedDetail.blockerCount ? "border-red-200 bg-red-50/45" : "border-line bg-white"}>
                  <p>Status: {getDisplayStatus(selectedDetail)}</p>
                  <p className="mt-1">Score: {getDisplayProgress(selectedDetail)}%</p>
                  {selectedDetail.controlPoint ? <p className="mt-1">Severity: {selectedDetail.controlPoint.severity}</p> : null}
                  {selectedDetail.controlPoint ? <p className="mt-1">Last checked: {formatStamp(selectedDetail.controlPoint.state.last_checked_at)}</p> : null}
                  <p className="mt-1">Fake-complete flag: {selectedDetail.fakeCompleteFlag ? "Yes" : "No"}</p>
                  <p className="mt-1">Top blocker: {selectedDetail.topBlocker ?? "None"}</p>
                </DetailSection>
                <DetailSection title="Audit Coverage">
                  <p>Total control points: {selectedDetail.auditSummary.total}</p>
                  <p className="mt-1">Evaluated: {selectedDetail.auditSummary.evaluated}</p>
                  <p className="mt-1">PASS: {selectedDetail.auditSummary.pass}</p>
                  <p className="mt-1">FAIL: {selectedDetail.auditSummary.fail}</p>
                  <p className="mt-1">PARTIAL: {selectedDetail.auditSummary.partial}</p>
                  <p className="mt-1">BLOCKED: {selectedDetail.auditSummary.blocked}</p>
                </DetailSection>
                <DetailSection title="Risk Summary" tone="border-rose-200 bg-rose-50/35">
                  <p>System risk: {controlPointAuditSummary.systemRiskLevel} ({controlPointAuditSummary.systemRiskScore})</p>
                  <p className="mt-1">Critical failures: {controlPointAuditSummary.criticalFailureCount}</p>
                  <p className="mt-1">Weak modules: {controlPointAuditSummary.weakModuleCount}</p>
                  <p className="mt-1">Highest-risk module: {controlPointRiskSummary.modules[0] ? `${controlPointRiskSummary.modules[0].module_name} (${controlPointRiskSummary.modules[0].risk_level})` : "None"}</p>
                </DetailSection>
              </div>
            </div>
            {selectedDetail.controlPoint ? (
              <div className="mt-3 grid gap-3 xl:grid-cols-2" data-inspector-master-design-control-point-detail="true">
                <DetailSection title="Rule and Condition" tone="border-sky-200 bg-sky-50/35">
                  <p><span className="font-semibold">Rule:</span> {selectedDetail.controlPoint.rule}</p>
                  <p className="mt-2"><span className="font-semibold">Condition:</span> {selectedDetail.controlPoint.condition}</p>
                  <p className="mt-2"><span className="font-semibold">Expected behavior:</span> {selectedDetail.controlPoint.expected_behavior}</p>
                </DetailSection>
                <DetailSection title="Audit Logic" tone="border-amber-200 bg-amber-50/35">
                  <p><span className="font-semibold">Audit method:</span> {selectedDetail.controlPoint.audit_method}</p>
                  <p className="mt-2"><span className="font-semibold">Pass criteria:</span> {selectedDetail.controlPoint.pass_criteria}</p>
                  <p className="mt-2"><span className="font-semibold">Fail criteria:</span> {selectedDetail.controlPoint.fail_criteria}</p>
                </DetailSection>
                <DetailSection title="Audit Result" tone={displayStatusTone(selectedDetail.controlPoint.state.status)}>
                  <p><span className="font-semibold">Result:</span> {selectedDetail.controlPoint.state.status}</p>
                  <p className="mt-2"><span className="font-semibold">Score:</span> {selectedDetail.controlPoint.state.score}%</p>
                  <p className="mt-2"><span className="font-semibold">Last checked:</span> {formatStamp(selectedDetail.controlPoint.state.last_checked_at)}</p>
                </DetailSection>
                <DetailSection title="Audit Reason" tone="border-sky-200 bg-sky-50/35">
                  <p>{selectedDetail.controlPoint.state.audit_reason}</p>
                </DetailSection>
                <DetailSection title="What Was Checked" tone="border-line bg-white">
                  <ul className="space-y-1" data-inspector-master-design-audit-checks="true">
                    {selectedDetail.controlPoint.state.checked_items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </DetailSection>
                <DetailSection title="Audit Evidence" tone="border-emerald-200 bg-emerald-50/35">
                  <ul className="space-y-1" data-inspector-master-design-audit-evidence="true">
                    {selectedDetail.controlPoint.state.evidence.map((item) => <li key={item}>{renderEvidenceItem(item)}</li>)}
                  </ul>
                </DetailSection>
                <DetailSection title="Failure Conditions">
                  <ul className="space-y-1">
                    {selectedDetail.controlPoint.failure_conditions.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </DetailSection>
                <DetailSection title="Audit Steps">
                  <ol className="space-y-1 list-decimal pl-4">
                    {selectedDetail.controlPoint.audit_steps.map((item) => <li key={item}>{item}</li>)}
                  </ol>
                </DetailSection>
                <DetailSection title="Linked Workflows">
                  <ul className="space-y-1">
                    {selectedDetail.controlPoint.linked_workflows.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </DetailSection>
                <DetailSection title="Evidence Required">
                  <ul className="space-y-1">
                    {selectedDetail.controlPoint.evidence_required.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </DetailSection>
              </div>
            ) : null}
            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              <DetailSection title="Linked Modules">
                <div className="flex flex-wrap gap-2">
                  {(selectedDetail.controlPoint?.linked_modules.length ? selectedDetail.controlPoint.linked_modules.map((moduleId) => selectedDetail.linkedModules.find((module) => module.moduleId === moduleId) ?? { moduleId, moduleName: moduleId } as ComparisonModuleResult) : selectedDetail.linkedModules).length ? (selectedDetail.controlPoint?.linked_modules.length ? selectedDetail.controlPoint.linked_modules.map((moduleId) => selectedDetail.linkedModules.find((module) => module.moduleId === moduleId) ?? { moduleId, moduleName: moduleId } as ComparisonModuleResult) : selectedDetail.linkedModules).map((module) => (
                    <span key={module.moduleId} className="rounded-full border border-line bg-white px-2 py-0.5 text-[11px] font-semibold text-ink">{module.moduleName}</span>
                  )) : <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[11px] text-muted">No linked modules</span>}
                </div>
              </DetailSection>
              <DetailSection title="Fake-complete Risk" tone={selectedDetail.fakeCompleteFlag ? "border-fuchsia-200 bg-fuchsia-50/45" : "border-line bg-white"}>
                <p>{selectedDetail.fakeCompleteRisk ?? (selectedDetail.fakeCompleteFlag ? "Derived fake-complete risk exists because linked modules or child nodes still overstate completion." : "No fake-complete risk recorded for this node.")}</p>
              </DetailSection>
            </div>
            <div className="mt-3 grid gap-3 xl:grid-cols-3">
              <DetailSection title={selectedDetail.controlPoint ? "Measured Fields" : "Linked Standards"}>
                <ul className="space-y-1">
                  {selectedDetail.controlPoint ? selectedDetail.controlPoint.measurable_fields.map((item) => <li key={item}>{item}</li>) : selectedDetail.standards.length ? selectedDetail.standards.map((item) => <li key={item}>{item}</li>) : <li className="text-muted">No linked standards recorded.</li>}
                </ul>
              </DetailSection>
              <DetailSection title="Linked Audits">
                <ul className="space-y-1">
                  {selectedDetail.audits.length ? selectedDetail.audits.map((item) => <li key={item}>{item}</li>) : <li className="text-muted">No linked audits recorded.</li>}
                </ul>
              </DetailSection>
              <DetailSection title="Linked Workflows">
                <ul className="space-y-1">
                  {selectedDetail.workflows.length ? selectedDetail.workflows.map((item) => <li key={item}>{item}</li>) : <li className="text-muted">No linked workflows recorded.</li>}
                </ul>
              </DetailSection>
            </div>
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Blockers</p>
              <div className="mt-2 space-y-2">
                {selectedDetail.blockers.length ? selectedDetail.blockers.map((blocker) => (
                  <div key={blocker} className="rounded-xl border border-red-200 bg-red-50/45 px-3 py-2 text-xs text-ink">{blocker}</div>
                )) : <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs text-muted">No blockers recorded for this node.</div>}
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section id="module-progress-table" className="space-y-2" data-inspector-master-design-progress-table="true">
        <Card className="rounded-xl bg-white/95 p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Module Progress Table</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">Live command view of module depth, proof, blockers, and run ownership</h2>
              <p className="mt-1 text-xs text-muted">Engine-driven table using target-map expectations, live module state, and current tracked-run task accounting.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
              <span>Sorted by {sortKey}</span>
              <span>{isRefreshing ? "Refreshing now" : `Updated ${formatStamp(snapshot.generatedAt)}`}</span>
              <Button size="sm" variant="secondary" onClick={() => void refresh()} disabled={isRefreshing}>Refresh</Button>
            </div>
          </div>
          <div className="mt-3 overflow-x-auto rounded-lg border border-line">
            <table className="min-w-[1440px] w-full border-collapse text-left text-[11px] text-ink">
              <thead className="bg-surface-soft/70 text-[10px] uppercase tracking-[0.1em] text-muted">
                <tr>
                  <th className="border-b border-line px-2 py-2 font-semibold"><button type="button" onClick={() => updateSort("group")} className="inline-flex items-center gap-1 hover:text-ink">Group {sortKey === "group" ? (sortDirection === "asc" ? "↑" : "↓") : null}</button></th>
                  <th className="border-b border-line px-2 py-2 font-semibold"><button type="button" onClick={() => updateSort("module")} className="inline-flex items-center gap-1 hover:text-ink">Module {sortKey === "module" ? (sortDirection === "asc" ? "↑" : "↓") : null}</button></th>
                  <th className="border-b border-line px-2 py-2 font-semibold"><button type="button" onClick={() => updateSort("submodulesTotal")} className="inline-flex items-center gap-1 hover:text-ink">Submodules Total {sortKey === "submodulesTotal" ? (sortDirection === "asc" ? "↑" : "↓") : null}</button></th>
                  <th className="border-b border-line px-2 py-2 font-semibold"><button type="button" onClick={() => updateSort("submodulesComplete")} className="inline-flex items-center gap-1 hover:text-ink">Submodules Complete {sortKey === "submodulesComplete" ? (sortDirection === "asc" ? "↑" : "↓") : null}</button></th>
                  <th className="border-b border-line px-2 py-2 font-semibold"><button type="button" onClick={() => updateSort("status")} className="inline-flex items-center gap-1 hover:text-ink">Status {sortKey === "status" ? (sortDirection === "asc" ? "↑" : "↓") : null}</button></th>
                  <th className="border-b border-line px-2 py-2 font-semibold"><button type="button" onClick={() => updateSort("completion")} className="inline-flex items-center gap-1 hover:text-ink">Completion % {sortKey === "completion" ? (sortDirection === "asc" ? "↑" : "↓") : null}</button></th>
                  <th className="border-b border-line px-2 py-2 font-semibold"><button type="button" onClick={() => updateSort("structural")} className="inline-flex items-center gap-1 hover:text-ink">Structural Status {sortKey === "structural" ? (sortDirection === "asc" ? "↑" : "↓") : null}</button></th>
                  <th className="border-b border-line px-2 py-2 font-semibold"><button type="button" onClick={() => updateSort("runtime")} className="inline-flex items-center gap-1 hover:text-ink">Runtime Status {sortKey === "runtime" ? (sortDirection === "asc" ? "↑" : "↓") : null}</button></th>
                  <th className="border-b border-line px-2 py-2 font-semibold"><button type="button" onClick={() => updateSort("proof")} className="inline-flex items-center gap-1 hover:text-ink">Proof Status {sortKey === "proof" ? (sortDirection === "asc" ? "↑" : "↓") : null}</button></th>
                  <th className="border-b border-line px-2 py-2 font-semibold">Top Blocker</th>
                  <th className="border-b border-line px-2 py-2 font-semibold"><button type="button" onClick={() => updateSort("confidence")} className="inline-flex items-center gap-1 hover:text-ink">Confidence {sortKey === "confidence" ? (sortDirection === "asc" ? "↑" : "↓") : null}</button></th>
                  <th className="border-b border-line px-2 py-2 font-semibold"><button type="button" onClick={() => updateSort("assigned")} className="inline-flex items-center gap-1 hover:text-ink">Assigned Tasks {sortKey === "assigned" ? (sortDirection === "asc" ? "↑" : "↓") : null}</button></th>
                  <th className="border-b border-line px-2 py-2 font-semibold"><button type="button" onClick={() => updateSort("completed")} className="inline-flex items-center gap-1 hover:text-ink">Completed Tasks {sortKey === "completed" ? (sortDirection === "asc" ? "↑" : "↓") : null}</button></th>
                  <th className="border-b border-line px-2 py-2 font-semibold"><button type="button" onClick={() => updateSort("failed")} className="inline-flex items-center gap-1 hover:text-ink">Failed Tasks {sortKey === "failed" ? (sortDirection === "asc" ? "↑" : "↓") : null}</button></th>
                </tr>
              </thead>
              <tbody>
                {progressRows.map((module) => (
                  <tr key={module.moduleId} className="border-b border-line bg-white align-top last:border-b-0">
                    <td className="px-2 py-2 text-muted">{module.group}</td>
                    <td className="px-2 py-2"><button type="button" onClick={() => setSelectedModuleId(module.moduleId)} className="font-semibold text-ink hover:text-primary">{module.moduleName}</button></td>
                    <td className="px-2 py-2">{module.submodules.total}</td>
                    <td className="px-2 py-2">{module.submodules.complete}</td>
                    <td className="px-2 py-2"><StatusBadge status={module.status} /></td>
                    <td className="px-2 py-2 font-semibold">{module.completionPercentage}%</td>
                    <td className="px-2 py-2">{module.structuralStatus}</td>
                    <td className="px-2 py-2">{module.runtimeStatus}</td>
                    <td className="px-2 py-2">{module.proofStatus}</td>
                    <td className="px-2 py-2 text-muted">{module.topBlocker ?? "None"}</td>
                    <td className="px-2 py-2">{module.confidence.level} ({module.confidence.score}%)</td>
                    <td className="px-2 py-2">{module.assignedTasks}</td>
                    <td className="px-2 py-2">{module.completedTasks}</td>
                    <td className="px-2 py-2">{module.failedTasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section id="execution-summary" className="grid gap-2 xl:grid-cols-[0.95fr_1.05fr]" data-inspector-master-design-execution-summary="true">
        <Card className="rounded-xl p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Execution Summary</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">{snapshot.comparison.executionSummary.trackedRunName}</h2>
              <p className="mt-1 text-xs text-muted">Assigned, completed, failed, blocker, and next-action view computed from the comparison engine.</p>
            </div>
            <span className="rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold text-ink">Updated {formatStamp(snapshot.comparison.executionSummary.lastUpdated)}</span>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3 xl:grid-cols-5">
            <KpiCard label="Assigned" value={String(snapshot.comparison.executionSummary.assignedTasksCount)} subtext="Tracked tasks in current run" />
            <KpiCard label="Completed" value={String(snapshot.comparison.executionSummary.completedTasksCount)} subtext="Engine-marked done" />
            <KpiCard label="Failed" value={String(snapshot.comparison.executionSummary.failedTasksCount)} subtext="Explicit failures only" />
            <KpiCard label="Top Blockers" value={String(snapshot.comparison.executionSummary.currentTopBlockers.length)} subtext="Current blocker titles surfaced" />
            <KpiCard label="Remaining" value={String(snapshot.comparison.executionSummary.remainingTasks.length)} subtext="Tasks not yet complete" />
          </div>
          <div className="mt-3 space-y-2">
            {snapshot.comparison.executionSummary.tasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-line bg-white px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{task.title}</p>
                  <span className={["rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]", task.status === "completed" ? statusTone("COMPLETE") : task.status === "failed" ? statusTone("BLOCKED") : statusTone("PARTIAL")].join(" ")}>{task.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted">Modules: {task.moduleIds.join(", ")}</p>
                {task.reason ? <p className="mt-1 text-xs text-red-700">Reason: {task.reason}</p> : null}
                {task.validationSignals.length > 1 ? <p className="mt-1 text-xs text-muted">Signals: {task.validationSignals.join(", ")}</p> : null}
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-xl p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Failure Reasons And Next Actions</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Failure reasons</p>
              <ul className="mt-2 space-y-1 text-xs text-ink">
                {snapshot.comparison.executionSummary.failureReasons.length ? snapshot.comparison.executionSummary.failureReasons.map((reason) => <li key={reason}>{reason}</li>) : <li>No failed tasks recorded in the current tracked run.</li>}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Next recommended actions</p>
              <ul className="mt-2 space-y-1 text-xs text-ink">
                {snapshot.comparison.executionSummary.nextRecommendedActions.map((action) => <li key={action}>{action}</li>)}
              </ul>
            </div>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="rounded-lg border border-line bg-white p-3">
              <p className="text-sm font-semibold text-ink">Current top blockers</p>
              <p className="mt-1 text-xs text-muted">{snapshot.comparison.executionSummary.currentTopBlockers.join(", ") || "None"}</p>
            </div>
            <div className="rounded-lg border border-line bg-white p-3">
              <p className="text-sm font-semibold text-ink">Remaining tracked tasks</p>
              <p className="mt-1 text-xs text-muted">{snapshot.comparison.executionSummary.remainingTasks.join(", ") || "None"}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-2 xl:grid-cols-[1.35fr_1fr]">
        <Card className="rounded-xl bg-[linear-gradient(135deg,rgba(18,74,50,0.08),rgba(255,255,255,0.96))] p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Master Design Control Center</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Hisabix KSA Phase 1</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">Live internal control view for target state, actual state, module drift, blocker chains, and country-product separation.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold text-ink">Current product: Hisabix KSA</span>
              <span className="rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold text-ink">Current phase: Phase 1</span>
              <Button size="sm" variant="secondary" onClick={() => void refresh()} disabled={isRefreshing}>Refresh</Button>
            </div>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Overall Completion" value={`${snapshot.comparison.overallCompletionPercentage}%`} subtext="Computed from comparison engine" />
            <KpiCard label="Complete" value={String(snapshot.comparison.counts.COMPLETE)} subtext="Target-aligned modules" />
            <KpiCard label="Partial" value={String(snapshot.comparison.counts.PARTIAL)} subtext="Implemented but incomplete" />
            <KpiCard label="Blocked" value={String(snapshot.comparison.counts.BLOCKED)} subtext="Hard blockers active" />
            <KpiCard label="Fake-Complete" value={String(snapshot.comparison.counts["FAKE-COMPLETE"])} subtext="Present but misleading" />
            <KpiCard label="Engine Confidence" value={snapshot.comparison.engineConfidence.level} subtext={`${snapshot.comparison.engineConfidence.score}% confidence`} />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
            <span>{snapshot.comparison.controlAuthority.summary}</span>
            <span>{isRefreshing ? "Refreshing now" : `Updated ${formatStamp(snapshot.generatedAt)}`}</span>
          </div>
          {refreshError ? <p className="mt-2 text-xs font-medium text-red-700">{refreshError}</p> : null}
        </Card>

        <Card className="rounded-xl p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Country Readiness</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <div className="rounded-lg border border-line bg-white p-3">
              <p className="text-sm font-semibold text-ink">KSA Active State</p>
              <p className="mt-1 text-xl font-bold text-ink">{snapshot.actual.countryReadiness.ksa.completionPercentage}%</p>
              <p className="mt-1 text-xs text-muted">{snapshot.actual.countryReadiness.ksa.status}</p>
            </div>
            <div className="rounded-lg border border-line bg-white p-3">
              <p className="text-sm font-semibold text-ink">France Readiness</p>
              <p className="mt-1 text-xl font-bold text-ink">{snapshot.actual.countryReadiness.france.completionPercentage}%</p>
              <p className="mt-1 text-xs text-muted">{snapshot.actual.countryReadiness.france.status}</p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Truly KSA-specific</p>
              <ul className="mt-1 space-y-1 text-xs text-ink">
                {snapshot.actual.countryReadiness.trulyKsaSpecific.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Wrongly shared today</p>
              <ul className="mt-1 space-y-1 text-xs text-ink">
                {snapshot.actual.countryReadiness.wronglySharedToday.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">France separation needs</p>
              <ul className="mt-1 space-y-1 text-xs text-ink">
                {snapshot.actual.countryReadiness.franceSeparationNeeds.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Module Status Grid</p>
            <p className="text-xs text-muted">Click a module to inspect target definition, actual state, blockers, proof, files, and routes.</p>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {snapshot.comparison.modules.map((module) => {
            const actual = snapshot.actual.modules.find((entry) => entry.id === module.moduleId);
            const active = selectedModuleId === module.moduleId;
            return (
              <button
                key={module.moduleId}
                type="button"
                onClick={() => setSelectedModuleId(module.moduleId)}
                className={[
                  "rounded-xl border p-3 text-left transition",
                  active ? "border-primary bg-primary-soft/40 shadow-[0_16px_26px_-24px_rgba(63,174,42,0.32)]" : "border-line bg-white hover:border-primary/30 hover:bg-primary-soft/20",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{module.moduleName}</p>
                  <StatusBadge status={module.status} />
                </div>
                <p className="mt-2 text-2xl font-bold text-ink">{module.completionPercentage}%</p>
                <p className="mt-1 text-xs text-muted">{actual?.summary ?? "No actual module map recorded."}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                  <span>{actual?.blockers.length ?? 0} blockers</span>
                  <span>{actual?.proof.status ?? "MISSING"} proof</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-2 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-xl p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Active Blockers</p>
              <p className="text-xs text-muted">Current blockers ranked by severity and dependency impact.</p>
            </div>
            <span className="rounded-full border border-line bg-white px-2.5 py-0.5 text-[11px] font-semibold text-ink">{snapshot.comparison.topBlockers.length} shown</span>
          </div>
          <div className="mt-3 space-y-2">
            {snapshot.comparison.topBlockers.map((blocker) => (
              <div key={blocker.id} className="rounded-lg border border-line bg-white p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{blocker.title}</p>
                  <span className={["rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]", statusTone(blocker.severity === "critical" ? "BLOCKED" : blocker.severity === "high" ? "FAKE-COMPLETE" : "PARTIAL")].join(" ")}>{blocker.severity}</span>
                </div>
                <p className="mt-1 text-xs text-muted">Module: {snapshot.actual.modules.find((module) => module.id === blocker.moduleId)?.name ?? blocker.moduleId}</p>
                <p className="mt-2 text-sm text-ink">{blocker.rootCause}</p>
                <p className="mt-1 text-xs text-muted">Dependency impact: {blocker.dependencyImpact}</p>
                {blocker.routePaths?.length ? <p className="mt-1 text-xs text-muted">Routes: {blocker.routePaths.join(", ")}</p> : null}
                {blocker.controllerPaths?.length ? <p className="mt-1 text-xs text-muted">Controllers: {blocker.controllerPaths.join(", ")}</p> : null}
                {blocker.servicePaths?.length ? <p className="mt-1 text-xs text-muted">Services: {blocker.servicePaths.join(", ")}</p> : null}
                {blocker.nextStepRecommendation ? <p className="mt-1 text-xs text-muted">Next step: {blocker.nextStepRecommendation}</p> : null}
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-xl p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Fake-Complete Panel</p>
          <p className="text-xs text-muted">Modules that look present from the UI or architecture surface but still overstate real completion.</p>
          <div className="mt-3 space-y-2">
            {snapshot.comparison.fakeCompleteModules.length ? snapshot.comparison.fakeCompleteModules.map((module) => {
              const actual = snapshot.actual.modules.find((entry) => entry.id === module.moduleId);
              return (
                <div key={module.moduleId} className="rounded-lg border border-line bg-white p-3">
                  <p className="text-sm font-semibold text-ink">{module.moduleName}</p>
                  <p className="mt-1 text-xs text-muted">{actual?.summary}</p>
                  <ul className="mt-2 space-y-1 text-xs text-ink">
                    {(actual?.fakeCompleteFlags ?? []).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              );
            }) : <p className="rounded-lg border border-line bg-white p-3 text-xs text-muted">No fake-complete modules are currently recorded.</p>}
          </div>
        </Card>
      </section>

      <section className="grid gap-2 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-xl p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Dependency Panel</p>
          <p className="text-xs text-muted">Module relationships and slippage propagation computed from the comparison engine.</p>
          <div className="mt-3 space-y-2">
            {snapshot.comparison.dependencyRisks.map((risk) => (
              <div key={risk.moduleId} className="rounded-lg border border-line bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{risk.moduleName}</p>
                  <span className="text-[11px] text-muted">{risk.dependsOn.length} at-risk deps</span>
                </div>
                <p className="mt-1 text-xs text-muted">Depends on: {risk.dependsOn.length ? risk.dependsOn.join(", ") : "No active slippage"}</p>
                <p className="mt-2 text-xs text-ink">{risk.riskSummary}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-xl p-3.5" data-inspector-master-design="drilldown">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Module Drill-Down</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">{selectedComparison?.moduleName}</h2>
              <p className="text-xs text-muted">{selectedActual?.summary}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={selectedComparison?.status ?? "PARTIAL"} />
              <span className="rounded-full border border-line bg-white px-2.5 py-0.5 text-[11px] font-semibold text-ink">{selectedComparison?.completionPercentage}%</span>
            </div>
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Target definition</p>
                <p className="mt-1 text-sm text-ink">{selectedTarget?.description}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Required features</p>
                <ul className="mt-1 space-y-1 text-xs text-ink">
                  {(selectedTarget?.requiredFeatures ?? []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Definition of done</p>
                <ul className="mt-1 space-y-1 text-xs text-ink">
                  {(selectedTarget?.definitionOfDone ?? []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Actual state</p>
                <p className="mt-1 text-sm text-ink">{selectedActual?.description}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.12em]">
                  <span className={["rounded-full border px-2 py-0.5", statusTone(selectedActual?.structuralStatus ?? "PARTIAL")].join(" ")}>structural {selectedActual?.structuralStatus ?? "PARTIAL"}</span>
                  <span className={["rounded-full border px-2 py-0.5", statusTone(selectedActual?.runtimeStatus ?? "PARTIAL")].join(" ")}>runtime {selectedActual?.runtimeStatus ?? "PARTIAL"}</span>
                  <span className={["rounded-full border px-2 py-0.5", contaminationTone(selectedActual?.contamination.severity ?? "none")].join(" ")}>contamination {selectedActual?.contamination.severity ?? "none"}</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Backend linkage</p>
                <p className="mt-1 text-xs text-ink">{selectedActual?.backendLinkage.summary}</p>
                <p className="mt-1 text-xs text-muted">Strength: {selectedActual?.backendLinkage.strength}</p>
                <p className="mt-1 text-xs text-muted">Confidence: {selectedActual?.confidence.level} ({selectedActual?.confidence.score}%)</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">What works</p>
                <ul className="mt-1 space-y-1 text-xs text-ink">
                  {(selectedActual?.whatWorks ?? []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">What is broken</p>
                <ul className="mt-1 space-y-1 text-xs text-ink">
                  {(selectedActual?.whatIsBroken ?? []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">What is missing</p>
                <ul className="mt-1 space-y-1 text-xs text-ink">
                  {(selectedActual?.whatIsMissing ?? []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1fr_0.9fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Blockers</p>
              <div className="mt-1 space-y-2 text-xs text-ink">
                {(selectedActual?.blockers ?? []).map((item) => (
                  <div key={item.id} className="rounded-lg border border-line bg-white px-2 py-2">
                    <p className="font-semibold">{item.title}</p>
                    {item.filePaths?.length ? <p className="mt-1 text-muted">Files: {item.filePaths.join(", ")}</p> : null}
                    {item.routePaths?.length ? <p className="mt-1 text-muted">Routes: {item.routePaths.join(", ")}</p> : null}
                    {item.controllerPaths?.length ? <p className="mt-1 text-muted">Controllers: {item.controllerPaths.join(", ")}</p> : null}
                    {item.servicePaths?.length ? <p className="mt-1 text-muted">Services: {item.servicePaths.join(", ")}</p> : null}
                    {item.nextStepRecommendation ? <p className="mt-1 text-muted">Next: {item.nextStepRecommendation}</p> : null}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Critical files</p>
              <ul className="mt-1 space-y-1 text-xs text-ink break-all">
                {(selectedActual?.fileDetails ?? []).map((item) => (
                  <li key={item.path}>
                    <span className="font-semibold">{item.path}</span>
                    <span className="ml-1 text-muted">[{item.role}]</span>
                    {item.causesBlockage ? <span className="ml-1 text-red-700">blocking</span> : null}
                    {item.notes.length ? <span className="ml-1 text-muted">{item.notes.join(", ")}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Critical routes and proof</p>
              <ul className="mt-1 space-y-1 text-xs text-ink break-all">
                {(selectedActual?.criticalRoutes ?? []).map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p className="mt-2 text-xs font-semibold text-ink">Controllers</p>
              <ul className="mt-1 space-y-1 text-xs text-ink break-all">
                {(selectedActual?.criticalControllers ?? []).map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p className="mt-2 text-xs font-semibold text-ink">Services</p>
              <ul className="mt-1 space-y-1 text-xs text-ink break-all">
                {(selectedActual?.criticalServices ?? []).map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p className="mt-2 text-xs font-semibold text-ink">Proof: {selectedActual?.proof.status}</p>
              <p className="mt-1 text-xs text-muted">{selectedActual?.proof.summary}</p>
              <p className="mt-2 text-xs font-semibold text-ink">Runtime verification</p>
              <p className="mt-1 text-xs text-muted">{selectedActual?.runtimeVerification.summary}</p>
              <ul className="mt-1 space-y-1 text-xs text-ink break-all">
                {(selectedActual?.runtimeVerification.signals ?? []).map((item) => <li key={item.id}>{item.label}: {item.status}</li>)}
              </ul>
              <p className="mt-2 text-xs font-semibold text-ink">Contamination summary</p>
              <p className="mt-1 text-xs text-muted">{selectedActual?.contamination.summary}</p>
              <p className="mt-2 text-xs font-semibold text-ink">Next action</p>
              <p className="mt-1 text-xs text-muted">{selectedActual?.nextStepRecommendation ?? selectedComparison?.recommendedNextAction}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-2 xl:grid-cols-[1fr_1fr]">
        <Card className="rounded-xl p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Remaining Phase 1 Work</p>
          <div className="mt-3 space-y-2">
            {snapshot.comparison.remainingTasks.map((task) => (
              <div key={task} className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink">{task}</div>
            ))}
          </div>
        </Card>

        <Card className="rounded-xl p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Current Engine Output</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="rounded-lg border border-line bg-white p-3">
              <p className="text-sm font-semibold text-ink">Blocked modules</p>
              <p className="mt-1 text-xs text-muted">{blockerModules.length ? blockerModules.join(", ") : "None"}</p>
            </div>
            <div className="rounded-lg border border-line bg-white p-3">
              <p className="text-sm font-semibold text-ink">Partial modules</p>
              <p className="mt-1 text-xs text-muted">{snapshot.comparison.partialModules.map((module) => module.moduleName).join(", ")}</p>
            </div>
            <div className="rounded-lg border border-line bg-white p-3">
              <p className="text-sm font-semibold text-ink">Fake-complete modules</p>
              <p className="mt-1 text-xs text-muted">{snapshot.comparison.fakeCompleteModules.map((module) => module.moduleName).join(", ") || "None"}</p>
            </div>
            <div className="rounded-lg border border-line bg-white p-3">
              <p className="text-sm font-semibold text-ink">Complete modules</p>
              <p className="mt-1 text-xs text-muted">{snapshot.comparison.completeModules.map((module) => module.moduleName).join(", ") || "None yet"}</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
