import { controlPointEngineControlPoints } from "@/backend/app/Support/Standards/control-point-engine-control-points";
import { phase5DocumentEngineV2ControlPoints } from "@/backend/app/Support/Standards/document-engine-phase5-control-points";
import { controlPointEngineModuleRegistry, controlPointEngineRequiredModuleCodeSet } from "@/backend/app/Support/Standards/control-point-engine-registry";
import type { ControlPointEnginePrecheck, ControlPointEngineRuntime, RegisteredControlModuleEntry, RegisteredControlPointEntry } from "@/backend/app/Support/Standards/control-point-engine-types";
import { validateControlPointEngineRegistration } from "@/backend/app/Support/Standards/control-point-engine-validation";
import { v2ControlPoints } from "@/backend/app/Support/Standards/v2/control-points.v2";

const engineBuiltAt = new Date().toISOString();

export const engineRegisteredControlPoints = [...v2ControlPoints, ...phase5DocumentEngineV2ControlPoints, ...controlPointEngineControlPoints] as const;

function buildStatusCounts(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function buildRegisteredControlPoints(): RegisteredControlPointEntry[] {
  return engineRegisteredControlPoints.map((controlPoint) => ({
    id: controlPoint.id,
    module_code: controlPoint.module_code,
    title: controlPoint.title,
    source_standard_clause: controlPoint.source_standard_clause,
    description: controlPoint.description,
    control_rule: controlPoint.control_rule,
    applicability: controlPoint.applicability,
    conditions: controlPoint.conditions,
    evaluation_method: controlPoint.evaluation_method,
    scoring_logic: controlPoint.scoring_logic,
    evidence_requirement: controlPoint.evidence_requirement,
    nonconformity: controlPoint.nonconformity,
    control_weight: controlPoint.control_weight,
    risk_priority: controlPoint.risk_priority,
    evaluation_frequency: controlPoint.evaluation_frequency,
    implementation_status: controlPoint.implementation_status,
    audit_status: "UNEVALUATED",
    lifecycle_status: controlPoint.status,
    source_standard_document: controlPoint.source_standard_document,
    linked_project_modules: controlPoint.linked_project_modules,
    registered_at: engineBuiltAt,
    last_updated_at: engineBuiltAt,
  }));
}

function buildRegisteredModules(controls: readonly RegisteredControlPointEntry[]): RegisteredControlModuleEntry[] {
  return controlPointEngineModuleRegistry.map((module) => {
    const moduleControls = controls.filter((control) => control.module_code === module.module_code);
    const statusCounts = buildStatusCounts(moduleControls.map((control) => control.audit_status));
    const implementationCounts = buildStatusCounts(moduleControls.map((control) => control.implementation_status));
    return {
      module_code: module.module_code,
      module_name: module.module_name,
      module_description: module.module_description,
      parent_module: module.parent_module,
      standards_source: module.standards_source,
      sub_module_count: 0,
      control_point_count: moduleControls.length,
      implementation_status: Object.entries(implementationCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "unimplemented",
      audit_status: Object.entries(statusCounts).sort((left, right) => right[1] - left[1])[0]?.[0] as RegisteredControlModuleEntry["audit_status"] ?? "UNEVALUATED",
      last_updated_at: engineBuiltAt,
      status_counts: statusCounts,
      implementation_counts: implementationCounts,
    };
  });
}

function buildSourceStandardCounts(controls: readonly RegisteredControlPointEntry[]) {
  return buildStatusCounts(controls.map((control) => control.source_standard_clause.split(".")[0] ?? control.source_standard_clause));
}

export function buildControlPointEnginePrecheck(): ControlPointEnginePrecheck {
  return {
    inspected_files: [
      "backend/app/Support/Standards/control-points.ts",
      "backend/app/Support/Standards/document-engine-phase5-control-points.ts",
      "backend/app/Support/Standards/control-point-validation.ts",
      "backend/app/Support/Standards/v2/control-module-registry.ts",
      "backend/app/Support/Standards/v2/control-point-schema.ts",
      "backend/app/Support/Standards/v2/control-point-governance.ts",
      "backend/app/Support/Standards/evidence-engine.ts",
      "backend/app/Support/Standards/risk-engine.ts",
      "lib/control-point-audit-engine.ts",
      "data/system-map/actual-map.ts",
      "data/workspace.ts",
      "data/role-workspace.ts",
      "master_design/master_design_vNext.json",
    ],
    current_runtime_entry: "backend/app/Support/Standards/control-points.ts",
    current_runtime_dataset: "engineRegisteredControlPoints",
    active_module_codes: Array.from(new Set(engineRegisteredControlPoints.map((controlPoint) => controlPoint.module_code))).sort(),
    active_control_point_count: engineRegisteredControlPoints.length,
    runtime_engine_present: true,
    gaps_detected: controlPointEngineRequiredModuleCodeSet.has("CPE") ? [] : ["CPE module is missing from the control module registry."],
    generated_at: engineBuiltAt,
  };
}

export function buildControlPointEngineRuntime(): ControlPointEngineRuntime {
  const registered_control_points = buildRegisteredControlPoints();
  const registered_modules = buildRegisteredModules(registered_control_points);
  const validation = validateControlPointEngineRegistration(registered_modules, registered_control_points, engineRegisteredControlPoints.length);
  const status_counts = buildStatusCounts(registered_control_points.map((control) => control.lifecycle_status));
  const implementation_counts = buildStatusCounts(registered_control_points.map((control) => control.implementation_status));
  const module_counts = Object.fromEntries(registered_modules.map((module) => [module.module_code, module.control_point_count]));
  const controls_without_traceability = registered_control_points.filter((control) => control.source_standard_clause.trim().length === 0).map((control) => control.id);

  return {
    engine_version: "1.0.0",
    registered_modules,
    registered_control_points,
    total_control_points: registered_control_points.length,
    total_modules: registered_modules.length,
    module_counts,
    status_counts,
    implementation_counts,
    source_standard_counts: buildSourceStandardCounts(registered_control_points),
    duplicate_id_issues: validation.duplicate_control_point_ids,
    orphan_issues: validation.orphan_control_points,
    missing_module_issues: validation.missing_module_registration,
    modules_with_zero_controls: validation.modules_with_zero_controls,
    controls_without_traceability,
    engine_last_built_at: engineBuiltAt,
    engine_last_validated_at: engineBuiltAt,
    validation,
  };
}

export const controlPointEngineRuntime = buildControlPointEngineRuntime();