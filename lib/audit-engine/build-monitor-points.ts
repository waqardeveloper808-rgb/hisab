import { evaluateControlPointExecution } from "@/backend/app/Support/Standards/control-point-execution";
import { engineRegisteredControlPoints } from "@/backend/app/Support/Standards/control-point-engine-runtime";
import {
  collectControlPointEvidence,
  getExecutionCategory,
  getExecutionEvaluatorKey,
  getExactRootCauseDetails,
} from "@/backend/app/Support/Standards/evidence-engine";
import type { StandardsControlPoint } from "@/data/standards/control-points";
import runtimeAuditData from "@/data/audit-runtime/control-point-runtime-results.json";
import { collectTraceabilitySnapshot } from "@/lib/audit-engine/evidence-entities";
import type { SystemMonitorControlPoint, SystemMonitorSeverity, SystemMonitorStatus } from "@/lib/audit-engine/monitor-types";
import {
  buildAccountingTrace,
  buildInventoryTrace,
  buildVatTrace,
  domainLinkMissing,
  linkedEntitiesForDomain,
} from "@/lib/audit-engine/traceability";

type RuntimePayload = { results?: Record<string, { last_checked_at?: string }> };

const runtimeResults = (runtimeAuditData as RuntimePayload).results ?? {};

function toStatus(s: string): SystemMonitorStatus {
  return s.toLowerCase() as SystemMonitorStatus;
}

function resolveModuleDomain(modules: readonly string[], moduleCode: string): string {
  if (modules.includes("tax-vat-engine") || moduleCode === "TAX") return "vat";
  if (modules.includes("accounting-engine") || moduleCode === "ACC") return "accounting";
  if (modules.includes("inventory-engine") || moduleCode === "INV") return "inventory";
  if (modules.includes("document-engine") || moduleCode === "IVC" || moduleCode === "DOC" || moduleCode === "TMP") {
    return "document";
  }
  if (modules.includes("compliance-layer")) return "compliance";
  if (moduleCode === "SEC") return "security";
  if (moduleCode === "CPE") return "governance";
  if (["UX", "FRM", "VAL", "BRD"].includes(moduleCode)) return "ux_validation";
  if (["USR", "ADM", "AST", "ACP", "COM", "AUD", "DCI"].includes(moduleCode)) return "workspace";
  return "platform";
}

function resolveSubModule(moduleCode: string, category: string) {
  const c = moduleCode;
  if (c === "ACC") return "journal";
  if (c === "IVC") return "invoice";
  if (c === "TAX") return "vat";
  if (c === "INV") return "stock";
  if (c === "FRM" || c === "VAL") return "validation";
  if (c === "UX") return "shell";
  if (c === "CPE") return "registry";
  return category.split("/")[0]?.toLowerCase().replace(/\s+/g, "_") ?? "control";
}

type TraceDomain = "accounting" | "vat" | "inventory" | "other";

function toTraceDomain(m: string): TraceDomain {
  if (m === "accounting") return "accounting";
  if (m === "vat") return "vat";
  if (m === "inventory") return "inventory";
  return "other";
}

function isLinkageControlPoint(cp: StandardsControlPoint, evaluator: string) {
  if (["accounting-integrity", "vat-compliance", "cross-module-trace", "document-contract"].includes(evaluator)) {
    return true;
  }
  if (["ACC", "TAX", "IVC", "INV"].includes(cp.module_code)) return true;
  if (cp.linked_project_modules.some((m) => ["accounting-engine", "tax-vat-engine", "inventory-engine", "document-engine"].includes(m))) {
    return true;
  }
  return false;
}

function buildTrace(m: string, snap: ReturnType<typeof collectTraceabilitySnapshot>) {
  const d = toTraceDomain(m);
  if (d === "accounting") return buildAccountingTrace(snap);
  if (d === "vat") return buildVatTrace(snap);
  if (d === "inventory") return buildInventoryTrace(snap);
  return [`Domain=${m} (no end-to-end trace template in monitor for this group).`];
}

function applySeverity(
  base: SystemMonitorSeverity,
  linkMissing: boolean,
  module: string,
): SystemMonitorSeverity {
  if (linkMissing && (module === "accounting" || module === "vat" || module === "inventory")) {
    return "critical";
  }
  return base;
}

export function buildSystemMonitorControlPoints(isoTime = new Date().toISOString()): SystemMonitorControlPoint[] {
  const snap = collectTraceabilitySnapshot();
  return engineRegisteredControlPoints.map((cp) => {
    const result = evaluateControlPointExecution(cp);
    const bundle = collectControlPointEvidence(cp);
    const category = getExecutionCategory(cp);
    const evaluator = getExecutionEvaluatorKey(cp);
    const modules = cp.linked_project_modules;
    const module = resolveModuleDomain(modules, cp.module_code);
    const sub = resolveSubModule(cp.module_code, category);
    const d = toTraceDomain(module);
    const linkage = isLinkageControlPoint(cp, evaluator);
    const linkMissing = linkage && d !== "other" && domainLinkMissing(d, snap);
    const baseSeverity = result.risk_level as SystemMonitorSeverity;
    const severity = applySeverity(baseSeverity, linkMissing, module);
    const trace = buildTrace(module, snap);
    const linked = d === "other" || !linkage ? {} : linkedEntitiesForDomain(d, snap);
    const rt = runtimeResults[cp.id];
    const timestamp = rt?.last_checked_at ?? isoTime;
    const rootHints = getExactRootCauseDetails(cp);
    const evidenceJson: unknown[] = [
      ...bundle.evidence.map((item) => ({
        type: item.type,
        label: item.label,
        available: item.available,
        details: item.details,
        reference: item.reference,
      })),
      ...result.checked_items.slice(0, 4).map((line, i) => ({ kind: "check", i, line })),
    ];
    if (linkMissing) {
      trace.unshift("CRITICAL: required traceability link missing in engine evidence (preview / metrics chain).");
    }
    const evidenceRefs = bundle.evidence.map((item) => item.reference);
    return {
      id: cp.id,
      module,
      sub_module: sub,
      status: toStatus(result.status),
      severity,
      title: cp.title,
      description: cp.description,
      expected_behavior: cp.control_rule,
      actual_behavior: result.audit_reason,
      evidence: evidenceJson,
      linked_entities: linked,
      linked_project_modules: [...modules],
      timestamp,
      module_code: cp.module_code,
      traceability: trace,
      link_missing: linkMissing,
      root_cause_hint: rootHints[0] ?? result.failures[0] ?? null,
      evaluation_method: cp.evaluation_method,
      evidence_references: evidenceRefs,
      source_standard_document: cp.source_standard_document,
      recommended_next_action: cp.nonconformity,
    } satisfies SystemMonitorControlPoint;
  });
}
