import type { V2ControlPoint } from "@/backend/app/Support/Standards/v2/control-point-schema";

export const requiredV2ControlPointFields: Array<keyof V2ControlPoint> = [
  "id",
  "version",
  "module_code",
  "module_name",
  "chapter_number",
  "title",
  "source_standard_clause",
  "source_standard_document",
  "description",
  "control_rule",
  "applicability",
  "conditions",
  "evaluation_method",
  "scoring_logic",
  "evidence_requirement",
  "nonconformity",
  "control_weight",
  "risk_priority",
  "evaluation_frequency",
  "control_owner",
  "evaluator",
  "reviewer",
  "linked_project_modules",
  "linked_files",
  "migration_action",
  "implementation_status",
  "status",
];

export function validateV2ControlPoint(controlPoint: V2ControlPoint) {
  return requiredV2ControlPointFields.every((field) => {
    const value = controlPoint[field];
    if (value == null) {
      return true;
    }
    if (Array.isArray(value)) {
      return value.length > 0 && value.every((entry) => String(entry).trim().length > 0);
    }
    if (typeof value === "number") {
      return Number.isFinite(value);
    }
    return String(value).trim().length > 0;
  });
}

export function validateV2ControlPointSet(controlPoints: readonly V2ControlPoint[]) {
  const duplicates = controlPoints.filter((controlPoint, index) => controlPoints.findIndex((candidate) => candidate.id === controlPoint.id) !== index).map((controlPoint) => controlPoint.id);
  const missingRequiredFields = controlPoints.filter((controlPoint) => !validateV2ControlPoint(controlPoint)).map((controlPoint) => controlPoint.id);
  return {
    duplicateIds: [...new Set(duplicates)],
    missingRequiredFields,
    valid: duplicates.length === 0 && missingRequiredFields.length === 0,
  };
}
