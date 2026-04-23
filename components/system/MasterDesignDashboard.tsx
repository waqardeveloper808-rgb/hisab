"use client";

import { useMemo } from "react";
import { MasterDesignTree, type MasterDesignTreeNode } from "@/components/system/MasterDesignTree";
import type { ActualModuleRecord, ModuleExecutionStatus, SystemBlocker } from "@/types/system-map";

type SystemState = {
  generatedAt: string;
  risk: {
    level: "low" | "medium" | "high" | "critical";
    score: number;
  };
  audit: {
    total: number;
    pass: number;
    fail: number;
    partial: number;
    blocked: number;
  };
  moduleHealth: Array<{
    id: string;
    name: string;
    status: ModuleExecutionStatus;
    completionPercentage: number;
    dependencies: string[];
    blockerCount: number;
    failCount: number;
    partialCount: number;
  }>;
  failingAreas: Array<{
    controlPointId: string;
    title: string;
    status: string;
    exactCauses: string[];
  }>;
  priorityModules: Array<{
    id: string;
    name: string;
    reason: string;
  }>;
  moduleMap: ActualModuleRecord[];
  blockers: SystemBlocker[];
};

function buildTreeNodes(systemState: SystemState): MasterDesignTreeNode[] {
  const modules = systemState.moduleHealth;
  const groups = [
    {
      id: "core-system",
      name: "Core System",
      modules: ["identity-workspace", "company-profile", "contacts-counterparties", "product-item-service", "document-engine"],
    },
    {
      id: "finance-engines",
      name: "Finance Engines",
      modules: ["accounting-engine", "inventory-engine", "tax-vat-engine", "reports-engine", "import-engine"],
    },
    {
      id: "platform-layers",
      name: "Platform Layers",
      modules: ["communication-engine", "template-engine", "workflow-intelligence", "compliance-layer", "proof-layer", "ui-ux-shell", "country-service-architecture", "end-to-end-workflow-proof"],
    },
  ];

  return groups.map((group) => {
    const items = group.modules
      .map((moduleId) => modules.find((module) => module.id === moduleId))
      .filter((module): module is SystemState["moduleHealth"][number] => Boolean(module));

    return {
      id: group.id,
      name: group.name,
      progress: items.length ? Math.round(items.reduce((sum, item) => sum + item.completionPercentage, 0) / items.length) : 0,
      failCount: items.reduce((sum, item) => sum + item.failCount, 0),
      partialCount: items.reduce((sum, item) => sum + item.partialCount, 0),
      children: items.map((item) => ({
        id: item.id,
        name: item.name,
        progress: item.completionPercentage,
        failCount: item.failCount,
        partialCount: item.partialCount,
        children: item.dependencies
          .map((dependencyId) => modules.find((module) => module.id === dependencyId))
          .filter((dependency): dependency is SystemState["moduleHealth"][number] => Boolean(dependency))
          .map((dependency) => ({
            id: `${item.id}:${dependency.id}`,
            name: dependency.name,
            progress: dependency.completionPercentage,
            failCount: dependency.failCount,
            partialCount: dependency.partialCount,
            children: [],
          })),
      })),
    };
  });
}

export function MasterDesignDashboard({ initialState }: { initialState: SystemState }) {
  const treeNodes = useMemo(() => buildTreeNodes(initialState), [initialState]);
  const progress = initialState.audit.total > 0
    ? Math.round((initialState.audit.pass / initialState.audit.total) * 100)
    : 0;

  return (
    <main className="bg-canvas px-4 py-5 sm:px-6 lg:px-8" data-inspector-system-master-design-page="true">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-2xl border border-line bg-white p-4 shadow-xs">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">System Master Design</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold" data-inspector-system-master-design-header-metrics="true">
                <span className="rounded-full border border-line bg-surface-soft/70 px-2.5 py-1 text-ink">Progress {progress}%</span>
                <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-red-800">Fail {initialState.audit.fail}</span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800">Partial {initialState.audit.partial}</span>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-5" data-inspector-system-master-design-summary="true">
              <div className="rounded-xl border border-line bg-surface-soft/70 px-3 py-2.5"><p className="text-[10px] uppercase tracking-[0.14em] text-muted">Pass</p><p className="mt-1 text-base font-semibold text-ink">{initialState.audit.pass}</p></div>
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5"><p className="text-[10px] uppercase tracking-[0.14em] text-red-700">Fail</p><p className="mt-1 text-base font-semibold text-red-800">{initialState.audit.fail}</p></div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"><p className="text-[10px] uppercase tracking-[0.14em] text-amber-700">Partial</p><p className="mt-1 text-base font-semibold text-amber-800">{initialState.audit.partial}</p></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"><p className="text-[10px] uppercase tracking-[0.14em] text-muted">Blocked</p><p className="mt-1 text-base font-semibold text-ink">{initialState.audit.blocked}</p></div>
              <div className="rounded-xl border border-line bg-surface-soft/70 px-3 py-2.5"><p className="text-[10px] uppercase tracking-[0.14em] text-muted">Risk</p><p className="mt-1 text-base font-semibold capitalize text-ink">{initialState.risk.level}</p></div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <MasterDesignTree nodes={treeNodes} />
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-4 shadow-xs" data-inspector-system-master-design-failures="true">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Failing Areas</p>
              <div className="mt-3 space-y-2">
                {initialState.failingAreas.length ? initialState.failingAreas.slice(0, 8).map((failure) => (
                  <div key={failure.controlPointId} className="rounded-xl border border-line bg-surface-soft/70 px-3 py-2.5" data-inspector-system-master-design-failure={failure.controlPointId}>
                    <p className="text-sm font-semibold text-ink">{failure.title}</p>
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{failure.status}</p>
                    <p className="mt-1 text-xs text-muted">{failure.exactCauses[0] ?? "No exact root cause available."}</p>
                  </div>
                )) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800">No active fail or partial control points.</div>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-white p-4 shadow-xs" data-inspector-system-master-design-priority="true">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Priority Modules</p>
              <div className="mt-3 space-y-2">
                {initialState.priorityModules.slice(0, 4).map((module) => (
                  <div key={module.id} className="rounded-xl border border-line bg-surface-soft/70 px-3 py-2.5">
                    <p className="text-sm font-semibold text-ink">{module.name}</p>
                    <p className="mt-1 text-xs text-muted">{module.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}