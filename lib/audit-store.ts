/* ─── Gulf Hisab AI Review Assistant — Audit Store Service ─── */

import type {
  AuditStore,
  AuditFinding,
  EvidenceItem,
  RouteHealthEntry,
  ModuleHealthEntry,
  AuditRun,
  GeneratedPrompt,
  AuditOverviewKpis,
  FindingSeverity,
  FindingStatus,
  FindingCategory,
  AuditModule,
} from "./audit-types";
import { AUDIT_STORE_KEY, SEVERITY_WEIGHT } from "./audit-types";

// ─── ID Generator ───
let counter = 0;
export function generateId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

// ─── Store Read / Write ───
function emptyStore(): AuditStore {
  return {
    findings: [],
    evidence: [],
    routes: [],
    modules: [],
    runs: [],
    prompts: [],
    lastUpdated: new Date().toISOString(),
  };
}

export function readAuditStore(): AuditStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(AUDIT_STORE_KEY);
    if (!raw) return emptyStore();
    return JSON.parse(raw) as AuditStore;
  } catch {
    return emptyStore();
  }
}

export function writeAuditStore(store: AuditStore): void {
  if (typeof window === "undefined") return;
  store.lastUpdated = new Date().toISOString();
  localStorage.setItem(AUDIT_STORE_KEY, JSON.stringify(store));
}

// ─── Findings CRUD ───
export function addFinding(finding: Omit<AuditFinding, "id" | "createdAt" | "updatedAt">): AuditFinding {
  const store = readAuditStore();
  const now = new Date().toISOString();
  const entry: AuditFinding = {
    ...finding,
    id: generateId("FND"),
    createdAt: now,
    updatedAt: now,
  };
  store.findings.push(entry);
  writeAuditStore(store);
  return entry;
}

export function updateFindingStatus(id: string, status: FindingStatus): void {
  const store = readAuditStore();
  const finding = store.findings.find((f) => f.id === id);
  if (!finding) return;
  finding.status = status;
  finding.updatedAt = new Date().toISOString();
  if (status === "resolved") finding.resolvedAt = finding.updatedAt;
  writeAuditStore(store);
}

export function getFindings(filters?: {
  severity?: FindingSeverity;
  status?: FindingStatus;
  category?: FindingCategory;
  module?: AuditModule;
}): AuditFinding[] {
  const store = readAuditStore();
  let results = store.findings;
  if (filters?.severity) results = results.filter((f) => f.severity === filters.severity);
  if (filters?.status) results = results.filter((f) => f.status === filters.status);
  if (filters?.category) results = results.filter((f) => f.category === filters.category);
  if (filters?.module) results = results.filter((f) => f.module === filters.module);
  return results;
}

export function getFindingById(id: string): AuditFinding | undefined {
  return readAuditStore().findings.find((f) => f.id === id);
}

// ─── Evidence ───
export function addEvidence(evidence: Omit<EvidenceItem, "id" | "capturedAt">): EvidenceItem {
  const store = readAuditStore();
  const entry: EvidenceItem = {
    ...evidence,
    id: generateId("EVD"),
    capturedAt: new Date().toISOString(),
  };
  store.evidence.push(entry);
  writeAuditStore(store);
  return entry;
}

export function getEvidenceForFinding(findingId: string): EvidenceItem[] {
  const store = readAuditStore();
  const finding = store.findings.find((f) => f.id === findingId);
  if (!finding) return [];
  return store.evidence.filter((e) => finding.evidence.includes(e.id));
}

// ─── Route Health ───
export function setRouteHealth(entries: RouteHealthEntry[]): void {
  const store = readAuditStore();
  store.routes = entries;
  writeAuditStore(store);
}

export function getRouteHealth(): RouteHealthEntry[] {
  return readAuditStore().routes;
}

// ─── Module Health ───
export function setModuleHealth(entries: ModuleHealthEntry[]): void {
  const store = readAuditStore();
  store.modules = entries;
  writeAuditStore(store);
}

export function getModuleHealth(): ModuleHealthEntry[] {
  return readAuditStore().modules;
}

// ─── Audit Runs ───
export function startAuditRun(scope: AuditRun["scope"], target?: string): AuditRun {
  const store = readAuditStore();
  const run: AuditRun = {
    id: generateId("RUN"),
    startedAt: new Date().toISOString(),
    status: "running",
    scope,
    scopeTarget: target,
    findingsCreated: 0,
    findingsResolved: 0,
    regressions: 0,
    routesAudited: 0,
    screenshotsCaptured: 0,
  };
  store.runs.push(run);
  writeAuditStore(store);
  return run;
}

export function completeAuditRun(id: string, updates: Partial<AuditRun>): void {
  const store = readAuditStore();
  const run = store.runs.find((r) => r.id === id);
  if (!run) return;
  Object.assign(run, updates, { completedAt: new Date().toISOString(), status: "completed" });
  writeAuditStore(store);
}

export function getAuditRuns(): AuditRun[] {
  return readAuditStore().runs;
}

// ─── Prompts ───
export function addPrompt(prompt: Omit<GeneratedPrompt, "id" | "createdAt">): GeneratedPrompt {
  const store = readAuditStore();
  const entry: GeneratedPrompt = {
    ...prompt,
    id: generateId("PRM"),
    createdAt: new Date().toISOString(),
  };
  store.prompts.push(entry);
  writeAuditStore(store);
  return entry;
}

export function getPrompts(): GeneratedPrompt[] {
  return readAuditStore().prompts;
}

// ─── KPI Computation ───
export function computeOverviewKpis(): AuditOverviewKpis {
  const store = readAuditStore();
  const open = store.findings.filter((f) => !["resolved", "ignored"].includes(f.status));
  const lastRun = store.runs.length > 0 ? store.runs[store.runs.length - 1] : undefined;
  return {
    totalOpenFindings: open.length,
    criticalFindings: open.filter((f) => f.severity === "critical").length,
    majorFindings: open.filter((f) => f.severity === "major").length,
    regressions: open.filter((f) => f.status === "regression").length,
    placeholderPages: store.routes.filter((r) => r.isPlaceholder).length,
    brokenRoutes: store.routes.filter((r) => r.status === "broken").length,
    documentEngineIssues: open.filter((f) => f.category === "document_engine").length,
    accountingEngineIssues: open.filter((f) => f.category === "accounting_logic").length,
    inventoryIssues: open.filter((f) => f.category === "inventory_logic").length,
    lastFullAuditAt: store.runs.find((r) => r.scope === "full")?.completedAt,
    lastRuntimeAuditAt: lastRun?.completedAt,
  };
}

// ─── Weighted Score ───
export function computeFindingScore(findings: AuditFinding[]): number {
  const open = findings.filter((f) => !["resolved", "ignored"].includes(f.status));
  if (open.length === 0) return 100;
  const totalWeight = open.reduce((s, f) => s + SEVERITY_WEIGHT[f.severity], 0);
  return Math.max(0, Math.round(100 - totalWeight));
}

// ─── Bulk Operations ───
export function clearAllFindings(): void {
  const store = readAuditStore();
  store.findings = [];
  store.evidence = [];
  writeAuditStore(store);
}

export function importFindings(findings: AuditFinding[]): void {
  const store = readAuditStore();
  store.findings.push(...findings);
  writeAuditStore(store);
}
