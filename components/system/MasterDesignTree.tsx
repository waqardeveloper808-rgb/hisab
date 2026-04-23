"use client";

import { useState } from "react";

export type MasterDesignTreeNode = {
  id: string;
  name: string;
  progress: number;
  failCount: number;
  partialCount: number;
  children: MasterDesignTreeNode[];
};

function TreeCard({ node, expanded, onToggle }: { node: MasterDesignTreeNode; expanded: boolean; onToggle: () => void }) {
  const hasChildren = node.children.length > 0;

  return (
    <div className="rounded-xl border border-line bg-white p-3 shadow-xs" data-inspector-system-tree-card={node.id}>
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
          <p className="truncate text-sm font-semibold text-ink">{node.name}</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
            <div className="rounded-lg border border-line bg-surface-soft/70 px-2 py-1.5">
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted">Progress</p>
              <p className="mt-1 font-semibold text-ink">{node.progress}%</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5">
              <p className="text-[9px] uppercase tracking-[0.14em] text-red-700">Fail</p>
              <p className="mt-1 font-semibold text-red-800">{node.failCount}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5">
              <p className="text-[9px] uppercase tracking-[0.14em] text-amber-700">Partial</p>
              <p className="mt-1 font-semibold text-amber-800">{node.partialCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TreeBranch({ node, depth = 0 }: { node: MasterDesignTreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth === 0);

  return (
    <div className="space-y-2" data-inspector-system-tree-node={node.id}>
      <TreeCard node={node} expanded={expanded} onToggle={() => setExpanded((value) => !value)} />
      {expanded && node.children.length > 0 ? (
        <div className="ml-4 border-l border-line pl-3" data-inspector-system-tree-children={node.id}>
          <div className="space-y-2">
            {node.children.map((child) => (
              <TreeBranch key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MasterDesignTree({ nodes }: { nodes: MasterDesignTreeNode[] }) {
  return (
    <div className="space-y-3" data-inspector-system-master-design="tree">
      {nodes.map((node) => (
        <TreeBranch key={node.id} node={node} />
      ))}
    </div>
  );
}