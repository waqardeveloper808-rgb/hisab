import type { ControlLifecycleStatus } from "@/backend/app/Support/Standards/v2/control-point-schema";
import type { ControlPointAuditStatus } from "@/lib/control-point-audit-engine";

export type ControlPointEngineStatusCounts = Record<string, number>;

export type RegisteredControlModuleEntry = {
  module_code: string;
  module_name: string;
  module_description: string;
  parent_module: string | null;
  standards_source: string[];
  sub_module_count: number;
  control_point_count: number;
  implementation_status: string;
  audit_status: ControlPointAuditStatus | "UNEVALUATED";
  last_updated_at: string;
  status_counts: ControlPointEngineStatusCounts;
  implementation_counts: ControlPointEngineStatusCounts;
};

export type RegisteredControlPointEntry = {
  id: string;
  module_code: string;
  title: string;
  source_standard_clause: string;
  description: string;
  control_rule: string;
  applicability: string[];
  conditions: string[];
  evaluation_method: string;
  scoring_logic: string;
  evidence_requirement: string[];
  nonconformity: string;
  control_weight: number;
  risk_priority: "low" | "medium" | "high" | "critical";
  evaluation_frequency: string;
  implementation_status: string;
  audit_status: ControlPointAuditStatus | "UNEVALUATED";
  lifecycle_status: ControlLifecycleStatus;
  source_standard_document: string;
  linked_project_modules: string[];
  registered_at: string;
  last_updated_at: string;
};

export type ControlPointEngineValidationResults = {
  duplicate_control_point_ids: string[];
  duplicate_module_codes: string[];
  orphan_control_points: string[];
  missing_module_registration: string[];
  modules_with_zero_controls: string[];
  controls_with_empty_mandatory_fields: string[];
  controls_without_source_standard_clause: string[];
  invalid_lifecycle_values: string[];
  invalid_audit_status_values: string[];
  broken_registration_references: string[];
  count_mismatches: string[];
  valid: boolean;
};

export type ControlPointEngineSummary = {
  engine_version: string;
  total_control_points: number;
  total_modules: number;
  module_counts: Record<string, number>;
  status_counts: Record<string, number>;
  implementation_counts: Record<string, number>;
  source_standard_counts: Record<string, number>;
  duplicate_id_issues: string[];
  orphan_issues: string[];
  missing_module_issues: string[];
  modules_with_zero_controls: string[];
  controls_without_traceability: string[];
  engine_last_built_at: string;
  engine_last_validated_at: string;
};

export type ControlPointEngineRuntime = {
  engine_version: string;
  registered_modules: RegisteredControlModuleEntry[];
  registered_control_points: RegisteredControlPointEntry[];
  total_control_points: number;
  total_modules: number;
  module_counts: Record<string, number>;
  status_counts: Record<string, number>;
  implementation_counts: Record<string, number>;
  source_standard_counts: Record<string, number>;
  duplicate_id_issues: string[];
  orphan_issues: string[];
  missing_module_issues: string[];
  modules_with_zero_controls: string[];
  controls_without_traceability: string[];
  engine_last_built_at: string;
  engine_last_validated_at: string;
  validation: ControlPointEngineValidationResults;
};

export type ControlPointEnginePrecheck = {
  inspected_files: string[];
  current_runtime_entry: string;
  current_runtime_dataset: string;
  active_module_codes: string[];
  active_control_point_count: number;
  runtime_engine_present: boolean;
  gaps_detected: string[];
  generated_at: string;
};

export type RecoveryControlTriggerEvent =
  | "ON_PAGE_LOAD"
  | "ON_ROUTE_RESOLVE"
  | "ON_API_FETCH"
  | "ON_CREATE"
  | "ON_UPDATE"
  | "ON_DELETE"
  | "ON_SAVE"
  | "ON_SUBMIT"
  | "ON_WORKFLOW_COMPLETE"
  | "ON_PDF_PREVIEW"
  | "ON_PDF_GENERATION";

export type RecoveryControlFailureType = "DESIGN FAILURE" | "IMPLEMENTATION FAILURE" | "OPERATING FAILURE";

export type RecoveryControlPointSchema = {
  id: string;
  module_code: string;
  standard_reference: string;
  business_risk: string;
  control_objective: string;
  trigger_events: RecoveryControlTriggerEvent[];
  dependencies: string[];
  validation_logic: string;
  expected_result: string;
  failure_conditions: string[];
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  blocking_behavior: "block-page" | "block-action" | "warn" | "log-only";
  evidence_requirements: string[];
  design_validation: string;
  implementation_validation: string;
  operating_validation: string;
  execution_result?: "PASS" | "FAIL" | "PARTIAL" | "BLOCKED";
  failure_type?: RecoveryControlFailureType;
  root_cause?: string;
};