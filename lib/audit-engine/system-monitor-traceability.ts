import { MONITOR_GROUP_DEFS } from "@/lib/audit-engine/monitor-groups";
import type { SystemMonitorControlPoint, SystemMonitorStatus } from "@/lib/audit-engine/monitor-types";
import type { MasterDesignModuleId } from "@/types/master-design";

const STATUSES: SystemMonitorStatus[] = ["pass", "fail", "partial", "blocked"];

/** All project module ids that participate in the three main monitor groups. */
/** String set: control-point `linked_project_modules` entries are plain strings at compile time. */
export const MONITOR_PROJECT_MODULE_IDS = new Set<string>(
  MONITOR_GROUP_DEFS.flatMap((d) => [...d.modules]) as string[],
);

/** When no `linked_project_modules` entry intersects the monitor set, map control `module_code` → a canonical monitor module. */
const FALLBACK_PRIMARY_MODULE_BY_CODE: Record<string, string> = {
  TAX: "tax-vat-engine",
  ACC: "accounting-engine",
  INV: "inventory-engine",
  IVC: "document-engine",
  DOC: "document-engine",
  TMP: "template-engine",
  COM: "communication-engine",
  UX: "ui-ux-shell",
  USR: "identity-workspace",
  ADM: "identity-workspace",
  AST: "identity-workspace",
  ACP: "identity-workspace",
  AUD: "compliance-layer",
  DCI: "identity-workspace",
  VAL: "ui-ux-shell",
  FRM: "workflow-intelligence",
  BRD: "end-to-end-workflow-proof",
  CPE: "compliance-layer",
  SEC: "proof-layer",
  XMD: "end-to-end-workflow-proof",
};

export function buildMonitorModuleToGroup(): Map<string, { groupId: string; groupName: string }> {
  const m = new Map<string, { groupId: string; groupName: string }>();
  for (const def of MONITOR_GROUP_DEFS) {
    for (const mod of def.modules) {
      m.set(mod, { groupId: def.id, groupName: def.name });
    }
  }
  return m;
}

export function fallbackMonitorProjectModuleForCode(moduleCode: string): string {
  return FALLBACK_PRIMARY_MODULE_BY_CODE[moduleCode] ?? "compliance-layer";
}

/**
 * Deterministic primary owner: prefer linked monitor modules, lexicographically smallest id;
 * otherwise fallback from module_code (still a monitor module id).
 */
export function pickPrimaryMonitorProjectModuleId(
  linkedProjectModules: readonly string[],
  moduleCode: string,
): MasterDesignModuleId {
  const inMonitor = linkedProjectModules.filter((id) => MONITOR_PROJECT_MODULE_IDS.has(id));
  if (inMonitor.length === 0) {
    return fallbackMonitorProjectModuleForCode(moduleCode) as MasterDesignModuleId;
  }
  return [...inMonitor].sort()[0] as MasterDesignModuleId;
}

export type CpIdsByStatus = Record<SystemMonitorStatus, string[]>;

export type TraceableCountBlock = {
  total: number;
  pass: number;
  fail: number;
  partial: number;
  blocked: number;
  cpIdsByStatus: CpIdsByStatus;
};

export type TraceableModuleRollup = TraceableCountBlock & {
  id: string;
  name: string;
};

export type TraceableGroupRollup = TraceableCountBlock & {
  id: string;
  name: string;
  modules: TraceableModuleRollup[];
};

export type SystemMonitorTraceabilityPayload = {
  summary: TraceableCountBlock;
  groups: TraceableGroupRollup[];
};

function emptyCpIdsByStatus(): CpIdsByStatus {
  return { pass: [], fail: [], partial: [], blocked: [] };
}

function addToBuckets(b: CpIdsByStatus, cp: SystemMonitorControlPoint): void {
  const st = cp.status;
  if (STATUSES.includes(st)) {
    b[st].push(cp.id);
  }
}

function countFromBuckets(byStatus: CpIdsByStatus): Omit<TraceableCountBlock, "cpIdsByStatus"> {
  const pass = byStatus.pass.length;
  const fail = byStatus.fail.length;
  const partial = byStatus.partial.length;
  const blocked = byStatus.blocked.length;
  return { pass, fail, partial, blocked, total: pass + fail + partial + blocked };
}

/** Build ownership rollups: each CP counted once under its primary module → primary group; global = Core + Finance + Platform. */
export function buildSystemMonitorTraceability(
  controlPoints: readonly SystemMonitorControlPoint[],
): {
  payload: SystemMonitorTraceabilityPayload;
  duplicateIdInInventory: string[];
  assignedCpCount: number;
  globalTotalMatchesInventory: boolean;
  statusSumMatchesTotal: boolean;
  eachGroupMatchesModules: boolean;
} {
  const duplicateIdInInventory: string[] = [];
  const seen = new Set<string>();
  for (const cp of controlPoints) {
    if (seen.has(cp.id)) {
      duplicateIdInInventory.push(cp.id);
    }
    seen.add(cp.id);
  }

  const groups: TraceableGroupRollup[] = [];

  for (const def of MONITOR_GROUP_DEFS) {
    const modules: TraceableModuleRollup[] = [];
    const groupBuckets = emptyCpIdsByStatus();
    let gPass = 0;
    let gFail = 0;
    let gPartial = 0;
    let gBlocked = 0;
    let gTotal = 0;

    for (const modId of def.modules) {
      const owned = controlPoints.filter((cp) => cp.primaryModuleId === modId);
      const mb = emptyCpIdsByStatus();
      for (const cp of owned) {
        addToBuckets(mb, cp);
      }
      const counts = countFromBuckets(mb);
      gPass += counts.pass;
      gFail += counts.fail;
      gPartial += counts.partial;
      gBlocked += counts.blocked;
      gTotal += counts.total;
      for (const st of STATUSES) {
        groupBuckets[st].push(...mb[st]);
      }
      modules.push({
        id: modId,
        name: modId,
        ...counts,
        cpIdsByStatus: mb,
      });
    }

    groups.push({
      id: def.id,
      name: def.name,
      total: gTotal,
      pass: gPass,
      fail: gFail,
      partial: gPartial,
      blocked: gBlocked,
      cpIdsByStatus: groupBuckets,
      modules,
    });
  }

  const summaryBuckets = emptyCpIdsByStatus();
  let sPass = 0;
  let sFail = 0;
  let sPartial = 0;
  let sBlocked = 0;
  let sTotal = 0;
  let eachGroupMatchesModules = true;

  for (const g of groups) {
    const modTotals = g.modules.reduce(
      (acc, m) => ({
        pass: acc.pass + m.pass,
        fail: acc.fail + m.fail,
        partial: acc.partial + m.partial,
        blocked: acc.blocked + m.blocked,
        total: acc.total + m.total,
      }),
      { pass: 0, fail: 0, partial: 0, blocked: 0, total: 0 },
    );
    if (modTotals.pass !== g.pass || modTotals.fail !== g.fail || modTotals.partial !== g.partial || modTotals.blocked !== g.blocked || modTotals.total !== g.total) {
      eachGroupMatchesModules = false;
    }
    sPass += g.pass;
    sFail += g.fail;
    sPartial += g.partial;
    sBlocked += g.blocked;
    sTotal += g.total;
    summaryBuckets.pass.push(...g.cpIdsByStatus.pass);
    summaryBuckets.fail.push(...g.cpIdsByStatus.fail);
    summaryBuckets.partial.push(...g.cpIdsByStatus.partial);
    summaryBuckets.blocked.push(...g.cpIdsByStatus.blocked);
  }

  const payload: SystemMonitorTraceabilityPayload = {
    summary: {
      ...countFromBuckets(summaryBuckets),
      cpIdsByStatus: summaryBuckets,
    },
    groups,
  };

  const assignedCpCount = sTotal;
  const globalTotalMatchesInventory = assignedCpCount === controlPoints.length;
  const statusSumMatchesTotal = sPass + sFail + sPartial + sBlocked === sTotal;

  return {
    payload,
    duplicateIdInInventory,
    assignedCpCount,
    globalTotalMatchesInventory,
    statusSumMatchesTotal,
    eachGroupMatchesModules,
  };
}

/** Attach human-readable module names onto traceability payload (in-place on module rollups). */
export function applyTraceabilityModuleNames(
  payload: SystemMonitorTraceabilityPayload,
  moduleNameById: ReadonlyMap<string, string>,
): void {
  for (const g of payload.groups) {
    for (const m of g.modules) {
      m.name = moduleNameById.get(m.id) ?? m.id;
    }
  }
}
