import { controlModuleRegistry } from "@/backend/app/Support/Standards/v2/control-module-registry";
import { controlPointEngineSummary } from "@/backend/app/Support/Standards/control-point-engine";
import type { StandardsControlPoint } from "@/backend/app/Support/Standards/control-points";

export type ControlPointCategorySummaryRow = {
  code: string;
  name: string;
  total: number;
  averageWeight: number;
};

export function getControlPointsByCategory(category: StandardsControlPoint["module_code"], controlPoints: readonly StandardsControlPoint[]) {
  return controlPoints.filter((controlPoint) => controlPoint.module_code === category);
}

export function getControlPointsSummary(controlPoints: readonly StandardsControlPoint[]) {
  const categorySummary = controlModuleRegistry
    .filter((module) => controlPoints.some((controlPoint) => controlPoint.module_code === module.code))
    .map((module) => {
      const moduleControlPoints = controlPoints.filter((controlPoint) => controlPoint.module_code === module.code);
      const totalWeight = moduleControlPoints.reduce((sum, controlPoint) => sum + controlPoint.control_weight, 0);

      return {
        code: module.code,
        name: module.name,
        total: moduleControlPoints.length,
        averageWeight: moduleControlPoints.length ? Number((totalWeight / moduleControlPoints.length).toFixed(2)) : 0,
      } satisfies ControlPointCategorySummaryRow;
    });

  const totalCount = categorySummary.reduce((sum, category) => sum + category.total, 0);
  const averageWeight = totalCount
    ? Number((controlPoints.reduce((sum, controlPoint) => sum + controlPoint.control_weight, 0) / totalCount).toFixed(2))
    : 0;

  return {
    totalCount,
    modulesCount: categorySummary.length,
    averageWeight,
    categorySummary,
    engineSummary: controlPointEngineSummary,
  };
}