/* ─── Gulf Hisab AI Review Assistant — Audit Runner (Orchestration Engine) ─── */

import type { AuditFinding, AuditModule, AuditRun } from "./audit-types";
import {
  readAuditStore,
  addFinding,
  startAuditRun,
  completeAuditRun,
  computeOverviewKpis,
} from "./audit-store";
import {
  KNOWN_ROUTES,
  buildRouteHealthFromRegistry,
  buildModuleHealthFromRoutes,
} from "./audit-collector";
import { runAllAuditRules } from "./audit-rules";
import { setRouteHealth, setModuleHealth } from "./audit-store";

// ─── Deduplication ───
function isDuplicate(existing: AuditFinding[], candidate: { title: string; route: string }): boolean {
  return existing.some(
    (f) => f.title === candidate.title && f.route === candidate.route && f.status !== "resolved"
  );
}

// ─── Run Full Audit ───
export function runFullAudit(): {
  run: AuditRun;
  newFindings: AuditFinding[];
  totalFindings: number;
  kpis: ReturnType<typeof computeOverviewKpis>;
} {
  const run = startAuditRun("full");
  const store = readAuditStore();
  const existingFindings = store.findings;

  // Run all heuristic rules
  const ruleResults = runAllAuditRules();
  const newFindings: AuditFinding[] = [];

  for (const result of ruleResults) {
    if (isDuplicate(existingFindings, result)) continue;

    const finding = addFinding({
      title: result.title,
      module: result.module,
      route: result.route,
      category: result.category,
      severity: result.severity,
      status: result.status,
      description: result.description,
      rootCause: result.rootCause,
      evidence: result.evidence,
      suggestedFixes: result.suggestedFixes,
      generatedPrompt: result.generatedPrompt,
      auditRunId: run.id,
    });
    newFindings.push(finding);
  }

  // Build route health
  const openByRoute = new Map<string, number>();
  const allFindings = readAuditStore().findings;
  for (const f of allFindings) {
    if (f.status !== "resolved" && f.status !== "ignored") {
      openByRoute.set(f.route, (openByRoute.get(f.route) ?? 0) + 1);
    }
  }
  const routeHealth = buildRouteHealthFromRegistry(openByRoute);
  setRouteHealth(routeHealth);

  // Build module health
  const moduleHealth = buildModuleHealthFromRoutes(
    routeHealth,
    allFindings.filter((f) => f.status !== "resolved" && f.status !== "ignored"),
  );
  setModuleHealth(moduleHealth);

  // Complete run
  completeAuditRun(run.id, {
    findingsCreated: newFindings.length,
    routesAudited: KNOWN_ROUTES.length,
    regressions: 0,
  });

  return {
    run: { ...run, status: "completed", completedAt: new Date().toISOString() },
    newFindings,
    totalFindings: readAuditStore().findings.length,
    kpis: computeOverviewKpis(),
  };
}

// ─── Run Module Audit ───
export function runModuleAudit(module: AuditModule): {
  run: AuditRun;
  newFindings: AuditFinding[];
} {
  const run = startAuditRun("module", module);
  const store = readAuditStore();
  const existingFindings = store.findings;

  const ruleResults = runAllAuditRules().filter((r) => r.module === module);
  const newFindings: AuditFinding[] = [];

  for (const result of ruleResults) {
    if (isDuplicate(existingFindings, result)) continue;
    const finding = addFinding({
      ...result,
      auditRunId: run.id,
    });
    newFindings.push(finding);
  }

  completeAuditRun(run.id, {
    findingsCreated: newFindings.length,
    routesAudited: KNOWN_ROUTES.filter((r) => r.module === module).length,
  });

  return { run: { ...run, status: "completed" }, newFindings };
}

// ─── Regression Check ───
export function checkRegressions(previousFindings: AuditFinding[]): AuditFinding[] {
  const resolved = previousFindings.filter((f) => f.status === "resolved");
  const current = runAllAuditRules();
  const regressions: AuditFinding[] = [];

  for (const res of resolved) {
    const reappeared = current.find((c) => c.title === res.title && c.route === res.route);
    if (reappeared) {
      const finding = addFinding({
        ...reappeared,
        status: "regression",
      });
      regressions.push(finding);
    }
  }

  return regressions;
}

// ─── Export Audit Report Data ───
export function exportAuditData(): string {
  const store = readAuditStore();
  return JSON.stringify(store, null, 2);
}
