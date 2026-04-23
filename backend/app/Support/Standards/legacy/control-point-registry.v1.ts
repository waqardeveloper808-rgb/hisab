// Archived legacy v1 registry preserved for migration traceability.
export {
  standardsControlPoints,
  standardsControlPointIds,
  standardsControlPointsByCategory,
  standardsControlPointValidation,
} from "@/backend/app/Support/Standards/legacy/control-points.v1";

export {
  validateControlPointStructure,
  validateControlPointRegistry,
} from "@/backend/app/Support/Standards/control-point-validation";

export {
  getControlPointsByCategory,
  getControlPointsSummary,
} from "@/backend/app/Support/Standards/control-point-summary";