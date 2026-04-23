import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ControlPointRegistry, RegistryControlPoint, PredicateGroup } from "./types";

const REGISTRY_PATH = path.join(process.cwd(), "docs", "governance", "control-point-registry.json");

function isPredicateLeaf(value: unknown): value is { lhs: string; operator: string; rhs?: unknown; rhs_type?: string } {
  return Boolean(value) && typeof value === "object" && "lhs" in value && "operator" in value;
}

function isPredicateGroup(value: unknown): value is PredicateGroup {
  return Boolean(value) && typeof value === "object" && "logic" in value && "predicates" in value;
}

function normalizeGroup(value: unknown, fallbackSummary: string): PredicateGroup {
  if (!isPredicateGroup(value)) {
    return { logic: "AND", summary: fallbackSummary, predicates: [] };
  }

  const predicates = Array.isArray(value.predicates) ? value.predicates.filter((item) => isPredicateLeaf(item) || isPredicateGroup(item)) : [];
  return {
    logic: value.logic === "OR" ? "OR" : "AND",
    summary: typeof value.summary === "string" && value.summary.trim() ? value.summary : fallbackSummary,
    predicates,
  };
}

function normalizeControlPoint(control: Record<string, unknown>): RegistryControlPoint {
  const status = control.status === "draft" || control.status === "deprecated" ? control.status : "active";
  const validationType = control.validation_type === "soft_block" || control.validation_type === "warning" || control.validation_type === "advisory"
    ? control.validation_type
    : "hard_block";
  const severity = ["critical", "high", "medium", "low", "info"].includes(String(control.severity)) ? String(control.severity) as RegistryControlPoint["severity"] : "medium";

  return {
    id: String(control.id ?? ""),
    title: String(control.title ?? ""),
    module: String(control.module ?? ""),
    domain: String(control.domain ?? ""),
    source_clause_id: String(control.source_clause_id ?? ""),
    source_document: String(control.source_document ?? ""),
    trigger_event: String(control.trigger_event ?? ""),
    validation_type: validationType,
    severity,
    priority: Number(control.priority ?? 0),
    rule_definition: String(control.rule_definition ?? ""),
    likely_root_cause_zones: Array.isArray(control.likely_root_cause_zones) ? control.likely_root_cause_zones.map(String) : [],
    corrective_action_type: String(control.corrective_action_type ?? ""),
    retest_requirement: String(control.retest_requirement ?? ""),
    status,
    tags: Array.isArray(control.tags) ? control.tags.map(String) : [],
    validation_method: ["deterministic", "structural", "cross_module", "reconciliation", "render_compare"].includes(String(control.validation_method))
      ? String(control.validation_method) as RegistryControlPoint["validation_method"]
      : "deterministic",
    expected_state: normalizeGroup(control.expected_state, `${control.id ?? "control"} expected state`),
    failure_condition: normalizeGroup(control.failure_condition, `${control.id ?? "control"} failure condition`),
    evidence_requirements: Array.isArray(control.evidence_requirements) ? control.evidence_requirements.map(String) : [],
    cross_validation_sources: Array.isArray(control.cross_validation_sources) ? control.cross_validation_sources.map(String) : [],
    measurable_fields: Array.isArray(control.measurable_fields) ? control.measurable_fields.map(String) : [],
    anti_cheat_rules: Array.isArray(control.anti_cheat_rules) ? control.anti_cheat_rules.map(String) : [],
  };
}

export async function loadControlPointRegistry(): Promise<ControlPointRegistry> {
  const raw = await readFile(REGISTRY_PATH, "utf8");
  const parsed = JSON.parse(raw) as { schema?: unknown; controls?: unknown };
  const controls = Array.isArray(parsed.controls)
    ? parsed.controls.filter((control): control is Record<string, unknown> => Boolean(control) && typeof control === "object").map(normalizeControlPoint)
    : [];

  return {
    schema: typeof parsed.schema === "string" ? parsed.schema : "gulf-hisab.control-point-registry.v2",
    controls,
  };
}

export function normalizeRegistrySnapshot(snapshot: ControlPointRegistry): ControlPointRegistry {
  return {
    schema: snapshot.schema,
    controls: snapshot.controls.map((control) => normalizeControlPoint(control as unknown as Record<string, unknown>)),
  };
}

export function validateRegistryIntegrity(registry: ControlPointRegistry) {
  const errors: string[] = [];
  if (!registry.schema) errors.push("Registry schema is missing.");
  if (!registry.controls.length) errors.push("Registry controls are missing.");
  const ids = new Set<string>();
  for (const control of registry.controls) {
    if (!control.id) errors.push("A control is missing an id.");
    if (ids.has(control.id)) errors.push(`Duplicate control id detected: ${control.id}`);
    ids.add(control.id);
    if (!control.expected_state.predicates.length) errors.push(`${control.id} is missing expected_state predicates.`);
    if (!control.failure_condition.predicates.length) errors.push(`${control.id} is missing failure_condition predicates.`);
    if (!control.evidence_requirements.length) errors.push(`${control.id} is missing evidence requirements.`);
    if (!control.cross_validation_sources.length) errors.push(`${control.id} is missing cross-validation sources.`);
    if (!control.measurable_fields.length) errors.push(`${control.id} is missing measurable fields.`);
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
