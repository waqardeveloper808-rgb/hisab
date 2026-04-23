import type { ControlPointEngineRuntime, ControlPointEngineSummary } from "@/backend/app/Support/Standards/control-point-engine-types";

export function buildControlPointEngineSummary(runtime: ControlPointEngineRuntime): ControlPointEngineSummary {
  return {
    engine_version: runtime.engine_version,
    total_control_points: runtime.total_control_points,
    total_modules: runtime.total_modules,
    module_counts: runtime.module_counts,
    status_counts: runtime.status_counts,
    implementation_counts: runtime.implementation_counts,
    source_standard_counts: runtime.source_standard_counts,
    duplicate_id_issues: runtime.duplicate_id_issues,
    orphan_issues: runtime.orphan_issues,
    missing_module_issues: runtime.missing_module_issues,
    modules_with_zero_controls: runtime.modules_with_zero_controls,
    controls_without_traceability: runtime.controls_without_traceability,
    engine_last_built_at: runtime.engine_last_built_at,
    engine_last_validated_at: runtime.engine_last_validated_at,
  };
}

export function renderControlPointEngineSummary(summary: ControlPointEngineSummary) {
  return [
    "# Control Point Engine Summary",
    "",
    `- Engine version: ${summary.engine_version}`,
    `- Total control points: ${summary.total_control_points}`,
    `- Total modules: ${summary.total_modules}`,
    `- Built at: ${summary.engine_last_built_at}`,
    `- Validated at: ${summary.engine_last_validated_at}`,
    `- Duplicate ID issues: ${summary.duplicate_id_issues.length}`,
    `- Orphan issues: ${summary.orphan_issues.length}`,
    `- Missing module issues: ${summary.missing_module_issues.length}`,
    `- Modules with zero controls: ${summary.modules_with_zero_controls.length ? summary.modules_with_zero_controls.join(", ") : "None"}`,
    "",
    "## Module Counts",
    ...Object.entries(summary.module_counts).map(([moduleCode, count]) => `- ${moduleCode}: ${count}`),
    "",
    "## Status Counts",
    ...Object.entries(summary.status_counts).map(([status, count]) => `- ${status}: ${count}`),
    "",
    "## Implementation Counts",
    ...Object.entries(summary.implementation_counts).map(([status, count]) => `- ${status}: ${count}`),
    "",
    "## Source Standard Counts",
    ...Object.entries(summary.source_standard_counts).map(([source, count]) => `- ${source}: ${count}`),
  ].join("\n");
}