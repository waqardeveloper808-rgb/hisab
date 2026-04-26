"use client";

import { useState } from "react";

export type MonitorMetricKind = "pass" | "fail" | "partial" | "blocked" | "all" | "health";

export type MasterDesignTreeNode = {
  id: string;
  /** When the row id is composite, metrics/filtering use this module id (e.g. dependency rows). */
  metricModuleId?: string;
  name: string;
  /** Engine health: pass / all linked CPs, 0–100; group uses unique-CP set. */
  healthPercent: number;
  passCount: number;
  failCount: number;
  partialCount: number;
  blockedCount: number;
  totalCp: number;
  children: MasterDesignTreeNode[];
  filterable?: boolean;
  isGroup?: boolean;
  scopeNote?: string;
};

export type TreeFilterHighlight = {
  module: string | null;
  groupId: string | null;
  status: MonitorMetricKind | "all" | "total" | null;
};

function TreeCard({
  node,
  expanded,
  onToggle,
  onSelectModule,
  onModuleMetric,
  selectedModuleId,
  filterHighlight,
}: {
  node: MasterDesignTreeNode;
  expanded: boolean;
  onToggle: () => void;
  onSelectModule?: (id: string) => void;
  onModuleMetric?: (id: string, kind: MonitorMetricKind) => void;
  selectedModuleId?: string | null;
  filterHighlight: TreeFilterHighlight;
}) {
  const metricTargetId = node.metricModuleId ?? node.id;
  const hasChildren = node.children.length > 0;
  const selectable = node.filterable === true && onSelectModule;
  const selected = selectedModuleId && metricTargetId === selectedModuleId;
  const metricEnabled = Boolean(onModuleMetric);
  const rowMatchesScope =
    (node.isGroup && filterHighlight.groupId === node.id) ||
    (!node.isGroup && filterHighlight.module === metricTargetId && filterHighlight.groupId == null);
  const h = (k: MonitorMetricKind | "all") =>
    rowMatchesScope && filterHighlight.status === k ? "ring-2 ring-primary ring-offset-1" : "";
  const hHealth = rowMatchesScope && filterHighlight.status === "health" ? "ring-2 ring-primary ring-offset-1" : "";

  return (
    <div
      className={`rounded-xl border bg-white p-3 shadow-xs ${selected ? "border-primary ring-2 ring-primary/30" : "border-line"}`}
      data-inspector-system-tree-card={node.id}
    >
      <div className="flex items-start gap-2">
        {hasChildren ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            data-inspector-system-tree-toggle={node.id}
            className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md border border-line bg-surface-soft text-[10px] font-semibold text-ink"
          >
            {expanded ? "-" : "+"}
          </button>
        ) : (
          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md border border-line bg-surface-soft text-[10px] font-semibold text-muted">•</span>
        )}
        <div className="min-w-0 flex-1">
          {selectable ? (
            <button
              type="button"
              onClick={() => onSelectModule?.(node.id)}
              className="w-full truncate text-left text-sm font-semibold text-ink hover:text-primary"
              data-inspector-system-tree-select-module={node.id}
            >
              {node.name}
            </button>
          ) : (
            <p className="truncate text-sm font-semibold text-ink">{node.name}</p>
          )}
          {node.isGroup && node.scopeNote ? <p className="mt-1 text-[10px] leading-snug text-muted">{node.scopeNote}</p> : null}
          <p className="mt-1 text-[10px] text-muted">Engine CP total (this row): {node.totalCp}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <button
              type="button"
              disabled={!metricEnabled}
              data-metric-kind="health"
              aria-label={`${node.name}: filter non-pass control points for this row`}
              onClick={(e) => {
                e.stopPropagation();
                onModuleMetric?.(metricTargetId, "health");
              }}
              title="Non-pass control points in this row (fail, partial, blocked)"
              className={`rounded-lg border border-line bg-surface-soft/70 px-2 py-1.5 text-left transition-colors hover:bg-surface-soft ${hHealth} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted">Health (non-pass)</p>
              <p className="mt-1 font-semibold text-ink">{node.healthPercent}%</p>
            </button>
            <button
              type="button"
              disabled={!metricEnabled}
              data-metric-kind="pass"
              aria-label={`${node.name}: filter passed control points`}
              onClick={(e) => {
                e.stopPropagation();
                onModuleMetric?.(metricTargetId, "pass");
              }}
              className={`rounded-lg border border-line bg-surface-soft/70 px-2 py-1.5 text-left transition-colors hover:bg-white ${h("pass")} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted">Pass</p>
              <p className="mt-1 font-semibold text-ink">{node.passCount}</p>
            </button>
            <button
              type="button"
              disabled={!metricEnabled}
              data-metric-kind="fail"
              aria-label={`${node.name}: filter failed control points`}
              onClick={(e) => {
                e.stopPropagation();
                onModuleMetric?.(metricTargetId, "fail");
              }}
              className={`rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-left transition-colors hover:bg-red-100/80 ${h("fail")} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <p className="text-[9px] uppercase tracking-[0.14em] text-red-700">Fail</p>
              <p className="mt-1 font-semibold text-red-800">{node.failCount}</p>
            </button>
            <button
              type="button"
              disabled={!metricEnabled}
              data-metric-kind="partial"
              aria-label={`${node.name}: filter partial control points`}
              onClick={(e) => {
                e.stopPropagation();
                onModuleMetric?.(metricTargetId, "partial");
              }}
              className={`rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-left transition-colors hover:bg-amber-100/80 ${h("partial")} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <p className="text-[9px] uppercase tracking-[0.14em] text-amber-700">Partial</p>
              <p className="mt-1 font-semibold text-amber-800">{node.partialCount}</p>
            </button>
            <button
              type="button"
              disabled={!metricEnabled}
              data-metric-kind="blocked"
              aria-label={`${node.name}: filter blocked control points`}
              onClick={(e) => {
                e.stopPropagation();
                onModuleMetric?.(metricTargetId, "blocked");
              }}
              className={`rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-left transition-colors hover:bg-slate-100/80 ${h("blocked")} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted">Blocked</p>
              <p className="mt-1 font-semibold text-ink">{node.blockedCount}</p>
            </button>
            <button
              type="button"
              disabled={!metricEnabled}
              data-metric-kind="all"
              aria-label={`${node.name}: show all control points for this row`}
              onClick={(e) => {
                e.stopPropagation();
                onModuleMetric?.(metricTargetId, "all");
              }}
              className={`rounded-lg border border-primary/30 bg-primary-soft/40 px-2 py-1.5 text-left transition-colors hover:bg-primary-soft/60 ${
                rowMatchesScope && filterHighlight.status === "all" ? "ring-2 ring-primary ring-offset-1" : ""
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <p className="text-[9px] uppercase tracking-[0.14em] text-primary">All CPs</p>
              <p className="mt-1 font-semibold text-ink">{node.totalCp}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TreeBranch({
  node,
  depth = 0,
  onSelectModule,
  onModuleMetric,
  selectedModuleId,
  filterHighlight,
}: {
  node: MasterDesignTreeNode;
  depth?: number;
  onSelectModule?: (id: string) => void;
  onModuleMetric?: (id: string, kind: MonitorMetricKind) => void;
  selectedModuleId?: string | null;
  filterHighlight: TreeFilterHighlight;
}) {
  const [expanded, setExpanded] = useState(depth === 0);

  return (
    <div className="space-y-2" data-inspector-system-tree-node={node.id}>
      <TreeCard
        node={node}
        expanded={expanded}
        onToggle={() => setExpanded((value) => !value)}
        onSelectModule={onSelectModule}
        onModuleMetric={onModuleMetric}
        selectedModuleId={selectedModuleId}
        filterHighlight={filterHighlight}
      />
      {expanded && node.children.length > 0 ? (
        <div className="ml-4 border-l border-line pl-3" data-inspector-system-tree-children={node.id}>
          <div className="space-y-2">
            {node.children.map((child) => (
              <TreeBranch
                key={child.id}
                node={child}
                depth={depth + 1}
                onSelectModule={onSelectModule}
                onModuleMetric={onModuleMetric}
                selectedModuleId={selectedModuleId}
                filterHighlight={filterHighlight}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MasterDesignTree({
  nodes,
  onSelectModule,
  selectedModuleId,
  onModuleMetric,
  filterHighlight,
}: {
  nodes: MasterDesignTreeNode[];
  onSelectModule?: (id: string) => void;
  selectedModuleId?: string | null;
  onModuleMetric?: (id: string, kind: MonitorMetricKind) => void;
  filterHighlight: TreeFilterHighlight;
}) {
  return (
    <div className="space-y-3" data-inspector-system-master-design="tree">
      {nodes.map((node) => (
        <TreeBranch
          key={node.id}
          node={node}
          onSelectModule={onSelectModule}
          onModuleMetric={onModuleMetric}
          selectedModuleId={selectedModuleId}
          filterHighlight={filterHighlight}
        />
      ))}
    </div>
  );
}
