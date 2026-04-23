import fs from "node:fs";
import path from "node:path";
import { franceReadinessRequirements } from "@/data/master-design/france-readiness";
import { ksaPhase1Modules } from "@/data/master-design/ksa-phase1";
import { sharedPlatformRules } from "@/data/master-design/shared-platform";
import { compareTargetToActual } from "@/lib/comparison-engine";
import { getActualSystemMap } from "@/lib/mapping-engine";
import type { MasterDesignTargetMap } from "@/types/master-design";
import type { ComparisonTrackedTaskSpec, ControlSurfaceValidationState } from "@/types/system-map";

const ROOT = process.cwd();
const VALIDATION_STATE_PATH = path.join(ROOT, "logs", "master-design-control-surface-refinement.json");

const currentTrackedRunName = "Master Design System - Control Surface Refinement Run";

const currentTrackedTasks: ComparisonTrackedTaskSpec[] = [
  {
    id: "module-progress-table",
    title: "Add Module Progress Table at top",
    moduleIds: ["ui-ux-shell", "workflow-intelligence", "end-to-end-workflow-proof"],
  },
  {
    id: "smart-submodule-counting",
    title: "Compute honest submodule totals and completions",
    moduleIds: ksaPhase1Modules.map((module) => module.id),
  },
  {
    id: "execution-summary",
    title: "Add engine-backed execution summary",
    moduleIds: ["workflow-intelligence", "end-to-end-workflow-proof", "proof-layer"],
  },
  {
    id: "completion-feedback-loop",
    title: "Use comparison engine as feedback authority",
    moduleIds: ["ui-ux-shell", "workflow-intelligence", "end-to-end-workflow-proof"],
  },
  {
    id: "live-tracking-refresh",
    title: "Preserve live refresh tracking",
    moduleIds: ["identity-workspace", "ui-ux-shell"],
  },
  {
    id: "control-surface-validation",
    title: "Validate route, table, execution summary, refresh, and engine query",
    moduleIds: ["proof-layer", "end-to-end-workflow-proof", "ui-ux-shell"],
  },
];

function readValidationState(): ControlSurfaceValidationState | null {
  if (!fs.existsSync(VALIDATION_STATE_PATH)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(VALIDATION_STATE_PATH, "utf8")) as ControlSurfaceValidationState;
  } catch {
    return null;
  }
}

export type MasterDesignSnapshot = {
  target: MasterDesignTargetMap;
  actual: ReturnType<typeof getActualSystemMap>;
  comparison: ReturnType<typeof compareTargetToActual>;
  generatedAt: string;
};

export function getMasterDesignTargetMap(): MasterDesignTargetMap {
  return {
    productName: "Gulf Hisab",
    phase: "Phase 1",
    activeCountryProduct: "KSA",
    futureCountryProducts: ["France", "Future country slots"],
    modules: ksaPhase1Modules,
    sharedPlatformRules,
    franceReadinessRequirements,
    updatedAt: "2026-04-19T12:00:00.000Z",
  };
}

export function createMasterDesignSnapshot(): MasterDesignSnapshot {
  const target = getMasterDesignTargetMap();
  const actual = getActualSystemMap();
  const generatedAt = new Date().toISOString();
  const comparison = compareTargetToActual(target, actual, {
    trackedRunName: currentTrackedRunName,
    trackedTasks: currentTrackedTasks,
    validation: readValidationState(),
    generatedAt,
  });

  return {
    target,
    actual,
    comparison,
    generatedAt,
  };
}