import { randomUUID } from "node:crypto";
import type {
  AuditExecutionOptions,
  AuditRequest,
  AuditResultStatus,
  AuditSession,
  AuditSummary,
  ControlEvaluationResult,
  EvidenceArtifact,
  RegistryControlPoint,
  RetestCandidate,
  SourceSnapshot,
} from "./types";
import { loadControlPointRegistry, validateRegistryIntegrity } from "./registry";
import { evaluatePredicateGroup } from "./predicate-evaluator";
import { validateEvidence, evidenceStatusToResultStatus } from "./evidence-validator";
import { resolveCrossValidation } from "./cross-validation";
import { validateAntiCheat } from "./anti-cheat";

function now() {
  return new Date().toISOString();
}

function defaultAuditId() {
  return `AUD-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function inferModuleFromRoute(routePattern?: string) {
  const route = (routePattern ?? "").toLowerCase();
  if (route.includes("invoice") || route.includes("document") || route.includes("preview") || route.includes("pdf") || route.includes("template")) return "document_engine";
  if (route.includes("account") || route.includes("journal") || route.includes("ledger") || route.includes("posting")) return "accounting";
  if (route.includes("vat") || route.includes("tax")) return "vat";
  if (route.includes("stock") || route.includes("inventory") || route.includes("movement") || route.includes("cogs")) return "inventory";
  if (route.includes("report") || route.includes("summary") || route.includes("reconciliation")) return "reporting";
  if (route.includes("payroll") || route.includes("attendance") || route.includes("timesheet")) return "payroll";
  if (route.includes("workspace") || route.includes("route")) return "workspace";
  return undefined;
}

function selectControls(registryControls: RegistryControlPoint[], request: AuditRequest) {
  const active = registryControls.filter((control) => control.status !== "deprecated");
  if (request.scope === "selected_controls") {
    const selected = new Set(request.control_ids ?? []);
    return active.filter((control) => selected.has(control.id));
  }
  if (request.scope === "module" && request.module) {
    return active.filter((control) => control.module === request.module);
  }
  if (request.scope === "route") {
    const moduleHint = request.module ?? inferModuleFromRoute(request.route_pattern);
    return active.filter((control) => {
      if (moduleHint && control.module !== moduleHint) return false;
      if (request.route_pattern && (control.source_document.includes(request.route_pattern) || control.rule_definition.toLowerCase().includes(request.route_pattern.toLowerCase()))) {
        return true;
      }
      return Boolean(moduleHint);
    });
  }
  if (request.scope === "workflow") {
    const workflow = (request.workflow_identifier ?? "").toLowerCase();
    return active.filter((control) => control.domain.toLowerCase().includes(workflow) || control.tags.some((tag) => tag.toLowerCase().includes(workflow)) || control.rule_definition.toLowerCase().includes(workflow));
  }
  return active;
}

function collectObservedValues(control: RegistryControlPoint, contextObserved: Record<string, Record<string, unknown>>): Record<string, unknown> {
  const observed = contextObserved[control.id] ?? {};
  return {
    control_id: control.id,
    module: control.module,
    severity: control.severity,
    validation_type: control.validation_type,
    trigger_event: control.trigger_event,
    ...observed,
  };
}

function collectEvidence(control: RegistryControlPoint, evidenceByControlId: Record<string, EvidenceArtifact[]>): EvidenceArtifact[] {
  return evidenceByControlId[control.id] ?? [];
}

function collectSources(control: RegistryControlPoint, contextSources: Record<string, SourceSnapshot>): SourceSnapshot[] {
  return control.cross_validation_sources.map((sourceId) => contextSources[sourceId]).filter((source): source is SourceSnapshot => Boolean(source));
}

function summarizeResult(resultStatus: AuditResultStatus, validationType: RegistryControlPoint["validation_type"]): AuditResultStatus {
  if (validationType === "warning") return "warning";
  if (validationType === "soft_block") return resultStatus === "pass" ? "warning" : resultStatus;
  if (validationType === "advisory") return resultStatus;
  return resultStatus;
}

function buildMachineSummary(control: RegistryControlPoint, resultStatus: AuditResultStatus, evidenceStatus: ReturnType<typeof validateEvidence>, antiCheatStatus: ReturnType<typeof validateAntiCheat>, crossValidationStatus: ReturnType<typeof resolveCrossValidation>) {
  return {
    control_id: control.id,
    status: resultStatus,
    evidence_quality_status: evidenceStatus.evidence_quality_status,
    anti_cheat_status: antiCheatStatus.status,
    cross_validation_status: crossValidationStatus.status,
    validation_method: control.validation_method,
  };
}

function buildHumanSummary(control: RegistryControlPoint, resultStatus: AuditResultStatus, evidenceStatus: ReturnType<typeof validateEvidence>, antiCheatStatus: ReturnType<typeof validateAntiCheat>, crossValidationStatus: ReturnType<typeof resolveCrossValidation>) {
  const missing = evidenceStatus.evidence_items_missing.length ? `Missing evidence: ${evidenceStatus.evidence_items_missing.join(", ")}.` : "Evidence present.";
  const anti = antiCheatStatus.flags.length ? `Anti-cheat flags: ${antiCheatStatus.flags.join(", ")}.` : "Anti-cheat passed.";
  const cross = crossValidationStatus.details.join(" ");
  return `${control.title} => ${resultStatus.toUpperCase()}. ${missing} ${anti} ${cross}`.trim();
}

function computeResultStatus(
  control: RegistryControlPoint,
  expectedOk: boolean,
  failureTriggered: boolean,
  evidenceResult: ReturnType<typeof validateEvidence>,
  antiCheatResult: ReturnType<typeof validateAntiCheat>,
  crossValidationResult: ReturnType<typeof resolveCrossValidation>,
): AuditResultStatus {
  const evidenceStatus = evidenceStatusToResultStatus(evidenceResult);
  if (evidenceStatus) {
    return evidenceStatus;
  }
  if (antiCheatResult.status === "failed") return "fail";
  if (crossValidationResult.status === "failed") return "fail";
  if (crossValidationResult.status === "blocked") return "blocked";
  if (!expectedOk || failureTriggered) return "fail";
  if (control.validation_type === "warning") return "warning";
  if (control.validation_type === "soft_block") return "warning";
  if (control.validation_type === "advisory") return "pass";
  return "pass";
}

function selectSeverityFilter(controls: RegistryControlPoint[], severity_filter?: AuditRequest["severity_filter"]) {
  if (!severity_filter || severity_filter.length === 0) return controls;
  return controls.filter((control) => severity_filter.includes(control.severity));
}

export async function runAuditExecution(options: AuditExecutionOptions) {
  const registry = options.context?.registry ?? await loadControlPointRegistry();
  const integrity = validateRegistryIntegrity(registry);
  const request = options.request;
  const audit_id = options.audit_id ?? defaultAuditId();
  const selected = selectSeverityFilter(selectControls(registry.controls, request), request.severity_filter);
  const contextObserved = options.context?.observed_values_by_control_id ?? {};
  const evidenceByControlId = options.context?.evidence_by_control_id ?? {};
  const sourcesById = options.context?.source_snapshots_by_id ?? {};

  const control_results: ControlEvaluationResult[] = selected.map((control) => {
    const observed = collectObservedValues(control, contextObserved);
    const evidence = collectEvidence(control, evidenceByControlId);
    const sources = collectSources(control, sourcesById);
    const evidenceStatus = validateEvidence(control, evidence);
    const crossValidationStatus = resolveCrossValidation(control, sources);
    const antiCheatStatus = validateAntiCheat(control, evidence, sources, observed);
    const expectedState = evaluatePredicateGroup(control.expected_state, observed, evidence, sources);
    const failureCondition = evaluatePredicateGroup(control.failure_condition, observed, evidence, sources);
    const resultStatus = computeResultStatus(control, expectedState.result, failureCondition.result, evidenceStatus, antiCheatStatus, crossValidationStatus);
    const machineSummary = buildMachineSummary(control, resultStatus, evidenceStatus, antiCheatStatus, crossValidationStatus);
    const humanSummary = buildHumanSummary(control, resultStatus, evidenceStatus, antiCheatStatus, crossValidationStatus);

    return {
      audit_id,
      control_id: control.id,
      title: control.title,
      module: control.module,
      validation_method: control.validation_method,
      result_status: resultStatus,
      executed_at: now(),
      expected_state_result: expectedState,
      failure_condition_result: failureCondition,
      failed_predicates: [...expectedState.failed_predicates, ...failureCondition.passed_predicates],
      passed_predicates: [...expectedState.passed_predicates, ...failureCondition.failed_predicates],
      measurable_field_values: Object.fromEntries(control.measurable_fields.map((field) => [field, observed[field] ?? evidence.find((item) => item.fields[field] !== undefined)?.fields[field] ?? sources.find((source) => source.data[field] !== undefined)?.data[field] ?? null])),
      evidence_status: evidenceStatus,
      missing_evidence: evidenceStatus.evidence_items_missing,
      anti_cheat_result: antiCheatStatus,
      cross_validation_result: crossValidationStatus,
      likely_root_cause_zones: control.likely_root_cause_zones,
      corrective_action_type: control.corrective_action_type,
      retest_requirement: control.retest_requirement,
      human_summary: humanSummary,
      machine_summary: JSON.stringify(machineSummary),
      severity: control.severity,
      status: control.status,
      trigger_event: control.trigger_event,
    };
  });

  const summary = buildAuditSummary(audit_id, request.scope, control_results);
  const session: AuditSession = {
    audit_id,
    requested_scope: request.scope,
    selected_module: request.module,
    selected_control_ids: request.control_ids ?? [],
    route_pattern: request.route_pattern,
    workflow_identifier: request.workflow_identifier,
    started_at: now(),
    executed_at: now(),
    status: summary.overall_status === "failed" ? "failed" : summary.overall_status === "blocked" ? "blocked" : summary.overall_status === "warning" ? "warning" : "completed",
    control_results,
    control_ids_executed: control_results.map((item) => item.control_id),
    control_ids_skipped: registry.controls.filter((item) => !control_results.some((result) => result.control_id === item.id)).map((item) => item.id),
  };
  const retest_queue = buildRetestQueue(audit_id, control_results);

  return {
    integrity,
    registry,
    session,
    summary,
    retest_queue,
    control_results,
  };
}

export function buildAuditSummary(audit_id: string, scope: AuditRequest["scope"], control_results: ControlEvaluationResult[]): AuditSummary {
  const severity_breakdown: AuditSummary["severity_breakdown"] = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  const moduleMap = new Map<string, AuditSummary["module_breakdown"][number]>();

  let evidence_gap_count = 0;
  let anti_cheat_failure_count = 0;
  let cross_module_mismatch_count = 0;
  let pass_count = 0;
  let fail_count = 0;
  let blocked_count = 0;
  let warning_count = 0;
  let not_executable_count = 0;

  for (const result of control_results) {
    severity_breakdown[result.severity] += 1;
    if (result.evidence_status.evidence_quality_status !== "sufficient") evidence_gap_count += 1;
    if (result.anti_cheat_result.status === "failed") anti_cheat_failure_count += 1;
    if (result.cross_validation_result.status === "failed") cross_module_mismatch_count += 1;
    if (result.result_status === "pass") pass_count += 1;
    if (result.result_status === "fail") fail_count += 1;
    if (result.result_status === "blocked") blocked_count += 1;
    if (result.result_status === "warning") warning_count += 1;
    if (result.result_status === "not_executable_due_to_missing_evidence") not_executable_count += 1;

    const entry = moduleMap.get(result.module) ?? {
      module: result.module,
      total: 0,
      pass: 0,
      fail: 0,
      warning: 0,
      blocked: 0,
      not_executable: 0,
      status: "passed" as const,
    };
    entry.total += 1;
    if (result.result_status === "pass") entry.pass += 1;
    if (result.result_status === "fail") entry.fail += 1;
    if (result.result_status === "warning") entry.warning += 1;
    if (result.result_status === "blocked") entry.blocked += 1;
    if (result.result_status === "not_executable_due_to_missing_evidence") entry.not_executable += 1;
    moduleMap.set(result.module, entry);
  }

  for (const entry of moduleMap.values()) {
    if (entry.fail > 0) entry.status = "failed";
    else if (entry.blocked > 0 || entry.not_executable > 0) entry.status = "blocked";
    else if (entry.warning > 0) entry.status = "warning";
    else entry.status = "passed";
  }

  const overall_status = fail_count > 0
    ? "failed"
    : blocked_count > 0 || not_executable_count > 0
      ? "blocked"
      : warning_count > 0
        ? "warning"
        : "passed";

  return {
    audit_id,
    scope,
    total_controls_evaluated: control_results.length,
    pass_count,
    fail_count,
    warning_count,
    blocked_count,
    not_executable_count,
    module_breakdown: [...moduleMap.values()],
    severity_breakdown,
    evidence_gap_count,
    anti_cheat_failure_count,
    cross_module_mismatch_count,
    overall_status,
    generated_at: now(),
  };
}

export function buildRetestQueue(audit_id: string, control_results: ControlEvaluationResult[]): RetestCandidate[] {
  return control_results
    .filter((result) => result.result_status !== "pass")
    .map((result) => ({
      audit_id,
      control_id: result.control_id,
      module: result.module,
      corrective_action_type: result.corrective_action_type,
      retest_requirement: result.retest_requirement,
      root_cause_zones: result.likely_root_cause_zones,
      severity: result.severity,
    }));
}
