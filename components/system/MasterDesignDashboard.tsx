"use client";

import { SystemMonitor } from "@/components/system-monitor/SystemMonitor";
import type { SystemMonitorControlPoint } from "@/lib/audit-engine/monitor-types";
import type { ActualModuleRecord, ModuleExecutionStatus, SystemBlocker } from "@/types/system-map";

export type SystemMonitorState = {
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
  controlPoints: SystemMonitorControlPoint[];
  groupScope: Array<{
    id: string;
    name: string;
    passCount: number;
    failCount: number;
    partialCount: number;
    blockedCount: number;
    totalControlPoints: number;
    healthPercent: number;
    scopeLabel: string;
  }>;
  moduleHealth: Array<{
    id: string;
    name: string;
    status: ModuleExecutionStatus;
    completionPercentage: number;
    dependencies: string[];
    blockerCount: number;
    passCount: number;
    failCount: number;
    partialCount: number;
    blockedCount: number;
    totalControlPoints: number;
    healthPercent: number;
    engineDisplayStatus: "PASS" | "FAIL" | "PARTIAL" | "BLOCKED";
  }>;
  failingAreas: Array<{
    controlPointId: string;
    title: string;
    status: string;
    exactCauses: string[];
    severity: string;
    module: string;
    timestamp: string;
  }>;
  priorityModules: Array<{
    id: string;
    name: string;
    reason: string;
  }>;
  moduleMap: ActualModuleRecord[];
  blockers: SystemBlocker[];
};

export function ArchitectDashboard({ initialState }: { initialState: SystemMonitorState }) {
  return <SystemMonitor initialState={initialState} />;
}

export { ArchitectDashboard as MasterDesignDashboard };
