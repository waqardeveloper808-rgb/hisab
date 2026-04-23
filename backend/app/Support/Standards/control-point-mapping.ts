import type { StandardsControlPoint } from "@/backend/app/Support/Standards/control-points";

export type ControlPointMappingRecord = {
  id: string;
  module_code: StandardsControlPoint["module_code"];
  linked_modules: StandardsControlPoint["linked_project_modules"];
  source_standard_clause: string;
  probable_enforcement_layer: string;
  probable_evidence_source: string[];
};

export function getProbableEnforcementLayer(controlPoint: StandardsControlPoint) {
  if (["ACC", "INV", "TAX", "XMD"].includes(controlPoint.module_code)) {
    return "domain-service-and-posting-validation";
  }

  if (["IVC", "DOC", "TMP", "BRD"].includes(controlPoint.module_code)) {
    return "rendering-and-document-generation";
  }

  if (["FRM", "VAL", "UX", "USR", "ADM", "AST", "ACP"].includes(controlPoint.module_code)) {
    return "ui-validation-and-workspace-flow";
  }

  return "security-and-governance-layer";
}

export function getControlPointMappings(controlPoints: readonly StandardsControlPoint[]): ControlPointMappingRecord[] {
  return controlPoints.map((controlPoint) => ({
    id: controlPoint.id,
    module_code: controlPoint.module_code,
    linked_modules: controlPoint.linked_project_modules,
    source_standard_clause: controlPoint.source_standard_clause,
    probable_enforcement_layer: getProbableEnforcementLayer(controlPoint),
    probable_evidence_source: controlPoint.evidence_requirement,
  }));
}