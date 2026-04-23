import type { RegisteredControlModuleEntry, RegisteredControlPointEntry, ControlPointEngineValidationResults } from "@/backend/app/Support/Standards/control-point-engine-types";

const validLifecycleValues = new Set(["draft", "active", "migrated", "archived", "retired"]);
const validAuditStatusValues = new Set(["PASS", "FAIL", "PARTIAL", "BLOCKED", "UNEVALUATED"]);

function findDuplicates(values: string[]) {
  return Array.from(values.reduce((counts, value) => counts.set(value, (counts.get(value) ?? 0) + 1), new Map<string, number>()).entries())
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
}

export function validateControlPointEngineRegistration(
  modules: readonly RegisteredControlModuleEntry[],
  controls: readonly RegisteredControlPointEntry[],
  expectedDatasetCount: number,
): ControlPointEngineValidationResults {
  const moduleCodes = modules.map((module) => module.module_code);
  const controlIds = controls.map((control) => control.id);
  const moduleCodeSet = new Set(moduleCodes);

  const duplicate_control_point_ids = findDuplicates(controlIds);
  const duplicate_module_codes = findDuplicates(moduleCodes);
  const orphan_control_points = controls.filter((control) => !moduleCodeSet.has(control.module_code)).map((control) => control.id);
  const missing_module_registration = Array.from(new Set(controls.map((control) => control.module_code))).filter((moduleCode) => !moduleCodeSet.has(moduleCode));
  const modules_with_zero_controls = modules.filter((module) => module.control_point_count === 0).map((module) => module.module_code);
  const controls_with_empty_mandatory_fields = controls.filter((control) => [
    control.id,
    control.module_code,
    control.title,
    control.description,
    control.control_rule,
    control.evaluation_method,
    control.scoring_logic,
    control.nonconformity,
  ].some((value) => value.trim().length === 0) || control.applicability.length === 0 || control.conditions.length === 0 || control.evidence_requirement.length === 0).map((control) => control.id);
  const controls_without_source_standard_clause = controls.filter((control) => control.source_standard_clause.trim().length === 0).map((control) => control.id);
  const invalid_lifecycle_values = controls.filter((control) => !validLifecycleValues.has(control.lifecycle_status)).map((control) => control.id);
  const invalid_audit_status_values = controls.filter((control) => !validAuditStatusValues.has(control.audit_status)).map((control) => control.id);
  const broken_registration_references = controls.filter((control) => control.linked_project_modules.length === 0 || control.source_standard_document.trim().length === 0).map((control) => control.id);
  const count_mismatches: string[] = [];

  if (controls.length !== expectedDatasetCount) {
    count_mismatches.push(`Registered control point count ${controls.length} does not match active dataset count ${expectedDatasetCount}.`);
  }

  return {
    duplicate_control_point_ids,
    duplicate_module_codes,
    orphan_control_points,
    missing_module_registration,
    modules_with_zero_controls,
    controls_with_empty_mandatory_fields,
    controls_without_source_standard_clause,
    invalid_lifecycle_values,
    invalid_audit_status_values,
    broken_registration_references,
    count_mismatches,
    valid: [
      duplicate_control_point_ids,
      duplicate_module_codes,
      orphan_control_points,
      missing_module_registration,
      modules_with_zero_controls,
      controls_with_empty_mandatory_fields,
      controls_without_source_standard_clause,
      invalid_lifecycle_values,
      invalid_audit_status_values,
      broken_registration_references,
      count_mismatches,
    ].every((issues) => issues.length === 0),
  };
}