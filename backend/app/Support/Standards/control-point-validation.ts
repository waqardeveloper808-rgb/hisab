import { controlModuleRegistryMap, type ControlModuleCode } from "@/backend/app/Support/Standards/v2/control-module-registry";
import type { StandardsControlPoint } from "@/backend/app/Support/Standards/control-points";

export type ControlPointRegistryValidation = {
  totalControlPoints: number;
  duplicateIds: string[];
  modulesCovered: ControlModuleCode[];
  missingRequiredFields: string[];
  invalidModuleIds: string[];
  invalidApplicabilityIds: string[];
  invalidScoringIds: string[];
  invalidEvidenceIds: string[];
  auditEngineReady: boolean;
};

export function validateControlPointStructure(controlPoint: StandardsControlPoint) {
  const requiredStrings = [
    controlPoint.id,
    controlPoint.module_code,
    controlPoint.module_name,
    controlPoint.title,
    controlPoint.source_standard_document,
    controlPoint.description,
    controlPoint.control_rule,
    controlPoint.evaluation_method,
    controlPoint.scoring_logic,
    controlPoint.nonconformity,
    controlPoint.control_owner,
  ];

  return requiredStrings.every((value) => value.trim().length > 0)
    && controlPoint.conditions.length > 0
    && controlPoint.linked_project_modules.length > 0
    && controlPoint.evidence_requirement.length > 0
    && controlPoint.applicability.length > 0;
}

function isControlModuleCode(value: string): value is ControlModuleCode {
  return controlModuleRegistryMap.has(value as ControlModuleCode);
}

export function validateControlPointRegistry(controlPoints: readonly StandardsControlPoint[]) {
  const idCounts = new Map<string, number>();
  for (const controlPoint of controlPoints) {
    idCounts.set(controlPoint.id, (idCounts.get(controlPoint.id) ?? 0) + 1);
  }

  const duplicateIds = Array.from(idCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id);

  const modulesCovered = Array.from(new Set(controlPoints.map((controlPoint) => controlPoint.module_code))).filter(isControlModuleCode);

  const missingRequiredFields = controlPoints
    .filter((controlPoint) => !validateControlPointStructure(controlPoint))
    .map((controlPoint) => controlPoint.id);

  const invalidModuleIds = controlPoints
    .filter((controlPoint) => !controlPoint.id.startsWith(`CP-${controlPoint.module_code}-`) || !isControlModuleCode(controlPoint.module_code))
    .map((controlPoint) => controlPoint.id);

  const invalidApplicabilityIds = controlPoints
    .filter((controlPoint) => controlPoint.applicability.length === 0)
    .map((controlPoint) => controlPoint.id);

  const invalidScoringIds = controlPoints
    .filter((controlPoint) => controlPoint.control_weight <= 0 || controlPoint.scoring_logic.trim().length === 0)
    .map((controlPoint) => controlPoint.id);

  const invalidEvidenceIds = controlPoints
    .filter((controlPoint) => controlPoint.evidence_requirement.some((entry) => entry.trim().length === 0))
    .map((controlPoint) => controlPoint.id);

  return {
    totalControlPoints: controlPoints.length,
    duplicateIds,
    modulesCovered,
    missingRequiredFields,
    invalidModuleIds,
    invalidApplicabilityIds,
    invalidScoringIds,
    invalidEvidenceIds,
    auditEngineReady:
      duplicateIds.length === 0
      && missingRequiredFields.length === 0
      && invalidModuleIds.length === 0
      && invalidApplicabilityIds.length === 0
      && invalidScoringIds.length === 0
      && invalidEvidenceIds.length === 0,
  } satisfies ControlPointRegistryValidation;
}