import { controlPointEngineRuntime, engineRegisteredControlPoints } from "@/backend/app/Support/Standards/control-point-engine-runtime";
import { controlModuleRegistryMap, type ControlModuleCode } from "@/backend/app/Support/Standards/v2/control-module-registry";
import { validateV2ControlPointSet } from "@/backend/app/Support/Standards/v2/control-point-governance";
import type { V2ControlPoint } from "@/backend/app/Support/Standards/v2/control-point-schema";

export type StandardsControlPoint = V2ControlPoint;

export type ControlPointValidationSummary = ReturnType<typeof validateStandardsControlPoints>;

export const standardsControlPoints: readonly StandardsControlPoint[] = engineRegisteredControlPoints;

export const standardsControlPointIds = standardsControlPoints.map((controlPoint) => controlPoint.id);

export const standardsControlPointsByCategory = Object.freeze(
  Object.fromEntries(
    Array.from(new Set(standardsControlPoints.map((controlPoint) => controlPoint.module_code))).map((moduleCode) => [
      moduleCode,
      standardsControlPoints.filter((controlPoint) => controlPoint.module_code === moduleCode),
    ]),
  ) as Record<ControlModuleCode, StandardsControlPoint[]>,
);

export const runtimeControlPointSource = Object.freeze({
  runtime_entry_point: "backend/app/Support/Standards/control-points.ts",
  active_runtime_dataset: "control-point-engine",
  total_control_points: standardsControlPoints.length,
  active_modules: Array.from(new Set(standardsControlPoints.map((controlPoint) => controlPoint.module_code))),
  inactive_modules: [],
  engine_version: controlPointEngineRuntime.engine_version,
});

export function validateStandardsControlPoints(controlPoints: readonly StandardsControlPoint[] = standardsControlPoints) {
  const governance = validateV2ControlPointSet(controlPoints);
  const duplicateIds = Array.from(new Set([...governance.duplicateIds, ...controlPointEngineRuntime.validation.duplicate_control_point_ids]));
  const missingRequiredFields = governance.missingRequiredFields;
  const modules = controlPointEngineRuntime.registered_modules.map((module) => module.module_code as ControlModuleCode);
  const emptyModules: ControlModuleCode[] = controlPointEngineRuntime.modules_with_zero_controls as ControlModuleCode[];

  return {
    totalControlPoints: controlPoints.length,
    modules,
    modulesCount: modules.length,
    duplicateIds,
    missingRequiredFields,
    emptyModules,
    valid: governance.valid,
  };
}

export const standardsControlPointValidation = validateStandardsControlPoints();
