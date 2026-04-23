export type AuditScopeKind = "full_system" | "module" | "route" | "workflow" | "selected_controls";

export type AuditValidationMethod = "deterministic" | "structural" | "cross_module" | "reconciliation" | "render_compare";

export type AuditSeverity = "critical" | "high" | "medium" | "low" | "info";

export type AuditControlStatus = "active" | "draft" | "deprecated";

export type AuditResultStatus = "pass" | "fail" | "blocked" | "warning" | "not_executable_due_to_missing_evidence";

export type PredicateOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "in" | "not_in" | "exists" | "not_exists";

export type PredicateLeaf = {
  lhs: string;
  operator: PredicateOperator;
  rhs?: unknown;
  rhs_type?: string;
};

export type PredicateGroup = {
  logic: "AND" | "OR";
  summary: string;
  predicates: Array<PredicateLeaf | PredicateGroup>;
};

export type RegistryControlPoint = {
  id: string;
  title: string;
  module: string;
  domain: string;
  source_clause_id: string;
  source_document: string;
  trigger_event: string;
  validation_type: "hard_block" | "soft_block" | "warning" | "advisory";
  severity: AuditSeverity;
  priority: number;
  rule_definition: string;
  likely_root_cause_zones: string[];
  corrective_action_type: string;
  retest_requirement: string;
  status: AuditControlStatus;
  tags: string[];
  validation_method: AuditValidationMethod;
  expected_state: PredicateGroup;
  failure_condition: PredicateGroup;
  evidence_requirements: string[];
  cross_validation_sources: string[];
  measurable_fields: string[];
  anti_cheat_rules: string[];
};

export type ControlPointRegistry = {
  schema: string;
  controls: RegistryControlPoint[];
};

export type EvidenceArtifact = {
  id: string;
  kind: string;
  label: string;
  source: string;
  traceableTo?: string[];
  capturedAt: string;
  fields: Record<string, unknown>;
};

export type SourceSnapshot = {
  source_id: string;
  source_type: string;
  traceable: boolean;
  captured_at: string;
  data: Record<string, unknown>;
};

export type EvidenceValidationResult = {
  evidence_items_found: string[];
  evidence_items_missing: string[];
  evidence_traceable: boolean;
  evidence_quality_status: "sufficient" | "partial" | "insufficient" | "rejected";
  evidence_rejection_reason: string | null;
};

export type CrossValidationResult = {
  required_sources: string[];
  attempted_sources: string[];
  inaccessible_sources: string[];
  mismatched_sources: string[];
  status: "passed" | "blocked" | "failed";
  details: string[];
};

export type AntiCheatResult = {
  status: "passed" | "failed";
  flags: string[];
  details: string[];
};

export type PredicateEvaluation = {
  result: boolean;
  failed_predicates: PredicateLeaf[];
  passed_predicates: PredicateLeaf[];
  trace: string[];
};

export type ControlEvaluationResult = {
  audit_id: string;
  control_id: string;
  title: string;
  module: string;
  validation_method: AuditValidationMethod;
  result_status: AuditResultStatus;
  executed_at: string;
  expected_state_result: PredicateEvaluation;
  failure_condition_result: PredicateEvaluation;
  failed_predicates: PredicateLeaf[];
  passed_predicates: PredicateLeaf[];
  predicate_trace: string[];
  measurable_field_values: Record<string, unknown>;
  evidence_status: EvidenceValidationResult;
  missing_evidence: string[];
  evidence_summary: string;
  anti_cheat_result: AntiCheatResult;
  cross_validation_result: CrossValidationResult;
  likely_root_cause_zones: string[];
  corrective_action_type: string;
  retest_requirement: string;
  source_references: string[];
  failure_reason: string | null;
  retry_eligible: boolean;
  human_summary: string;
  machine_summary: string;
  severity: AuditSeverity;
  status: AuditControlStatus;
  trigger_event: string;
};

export type AuditRequest = {
  scope: AuditScopeKind;
  module?: string;
  control_ids?: string[];
  route_pattern?: string;
  workflow_identifier?: string;
  severity_filter?: AuditSeverity[];
};

export type AuditSession = {
  audit_id: string;
  requested_scope: AuditScopeKind;
  selected_module?: string;
  selected_control_ids: string[];
  route_pattern?: string;
  workflow_identifier?: string;
  started_at: string;
  executed_at: string;
  status: "running" | "completed" | "failed" | "blocked" | "warning";
  control_results: ControlEvaluationResult[];
  control_ids_executed: string[];
  control_ids_skipped: string[];
};

export type AuditSummary = {
  audit_id: string;
  scope: AuditScopeKind;
  total_controls_evaluated: number;
  pass_count: number;
  fail_count: number;
  warning_count: number;
  blocked_count: number;
  not_executable_count: number;
  module_breakdown: Array<{
    module: string;
    total: number;
    pass: number;
    fail: number;
    warning: number;
    blocked: number;
    not_executable: number;
    status: "passed" | "failed" | "blocked" | "warning";
  }>;
  severity_breakdown: Record<AuditSeverity, number>;
  evidence_gap_count: number;
  anti_cheat_failure_count: number;
  cross_module_mismatch_count: number;
  overall_status: "passed" | "failed" | "blocked" | "warning";
  generated_at: string;
};

export type RetestCandidate = {
  audit_id: string;
  control_id: string;
  module: string;
  corrective_action_type: string;
  retest_requirement: string;
  root_cause_zones: string[];
  severity: AuditSeverity;
};

export type AuditStorePayload = {
  sessions: AuditSession[];
  summaries: AuditSummary[];
  control_results: ControlEvaluationResult[];
  retest_queue: RetestCandidate[];
  last_updated: string;
};

export type AuditRuntimeContext = {
  registry: ControlPointRegistry;
  evidence_by_control_id: Record<string, EvidenceArtifact[]>;
  source_snapshots_by_id: Record<string, SourceSnapshot>;
  observed_values_by_control_id: Record<string, Record<string, unknown>>;
  route_html_by_path: Record<string, string>;
  route_status_by_path: Record<string, number>;
};

export type AuditExecutionOptions = {
  request: AuditRequest;
  context?: Partial<AuditRuntimeContext>;
  audit_id?: string;
};
