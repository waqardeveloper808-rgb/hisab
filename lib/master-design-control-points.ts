import { standardsControlPoints, type StandardsControlPoint } from "@/data/standards/control-points";

export type ControlPointImplementationStatus = "PASS" | "FAIL" | "PARTIAL" | "BLOCKED";
export type ControlPointSeverity = "low" | "medium" | "high" | "critical";

export type MasterDesignControlPointReference = {
  nodeId: string;
  nodeTitle: string;
  parentNodeId: string;
  parentNodeTitle: string;
  path: string[];
};

export type MasterDesignControlPointState = {
  status: ControlPointImplementationStatus;
  score: number;
  last_checked_at: string;
  audit_reason: string;
  checked_items: string[];
  evidence: string[];
  severity: ControlPointSeverity;
};

export type MasterDesignControlPointRecord = StandardsControlPoint & {
  severity: ControlPointSeverity;
  linked_modules: StandardsControlPoint["linked_project_modules"];
  purpose: StandardsControlPoint["description"];
  rule: StandardsControlPoint["control_rule"];
  condition: string;
  expected_behavior: StandardsControlPoint["description"];
  audit_method: StandardsControlPoint["evaluation_method"];
  pass_criteria: StandardsControlPoint["scoring_logic"];
  fail_criteria: StandardsControlPoint["nonconformity"];
  failure_conditions: string[];
  audit_steps: string[];
  linked_workflows: StandardsControlPoint["linked_project_modules"];
  evidence_required: StandardsControlPoint["evidence_requirement"];
  measurable_fields: string[];
  master_design_reference: MasterDesignControlPointReference;
  state: MasterDesignControlPointState;
};

type GeneratedStandardNode = {
  id: string;
  title: string;
  description: string;
  controlPointId: string | null;
  children: GeneratedStandardNode[];
};

const moduleParentMap: Record<string, { id: string; title: string; description: string }> = {
  ACC: { id: "accounting-standards", title: "Accounting Standards", description: "Accounting control points active in the V2 control matrix." },
  INV: { id: "inventory-standards", title: "Inventory Standards", description: "Inventory control points active in the V2 control matrix." },
  TAX: { id: "tax-standards", title: "Tax Standards", description: "Tax and compliance control points active in the V2 control matrix." },
  IVC: { id: "invoice-standards", title: "Invoice Standards", description: "Invoice and document control points active in the V2 control matrix." },
  VAL: { id: "form-standards", title: "Form Standards", description: "Validation and import control points active in the V2 control matrix." },
};

function getParentDefinition(moduleCode: string, moduleName: string) {
  return moduleParentMap[moduleCode] ?? {
    id: `${moduleCode.toLowerCase()}-standards`,
    title: `${moduleName}`,
    description: `${moduleName} control points active in the V2 control matrix.`,
  };
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getSeverity(controlPoint: StandardsControlPoint): ControlPointSeverity {
  return controlPoint.risk_priority;
}

function getReference(controlPoint: StandardsControlPoint): MasterDesignControlPointReference {
  const parent = getParentDefinition(controlPoint.module_code, controlPoint.module_name);
  return {
    nodeId: `${controlPoint.module_code.toLowerCase()}-${slugify(controlPoint.title)}`,
    nodeTitle: controlPoint.title,
    parentNodeId: parent.id,
    parentNodeTitle: parent.title,
    path: ["Whole System", "Standards", parent.title, controlPoint.title],
  };
}

function buildControlPointState(controlPoint: StandardsControlPoint): MasterDesignControlPointState {
  return {
    status: "BLOCKED",
    score: 0,
    last_checked_at: new Date().toISOString(),
    audit_reason: `Compatibility shell: the legacy master-design control-point view no longer evaluates audit state for ${controlPoint.id}.`,
    checked_items: ["Legacy audit state was retired in favor of the new registry-backed audit engine."],
    evidence: ["This record is now a compatibility shell only."],
    severity: getSeverity(controlPoint),
  };
}

const groupedStandardsParents = Array.from(new Map(standardsControlPoints.map((controlPoint) => {
  const parent = getParentDefinition(controlPoint.module_code, controlPoint.module_name);
  return [parent.id, parent] as const;
})).values());

export const masterDesignControlPoints: MasterDesignControlPointRecord[] = standardsControlPoints.map((controlPoint) => ({
  ...controlPoint,
  severity: getSeverity(controlPoint),
  linked_modules: controlPoint.linked_project_modules,
  purpose: controlPoint.description,
  rule: controlPoint.control_rule,
  condition: controlPoint.conditions.join(" "),
  expected_behavior: controlPoint.description,
  audit_method: controlPoint.evaluation_method,
  pass_criteria: controlPoint.scoring_logic,
  fail_criteria: controlPoint.nonconformity,
  failure_conditions: [controlPoint.nonconformity],
  audit_steps: [
    ...controlPoint.conditions,
    `Evaluate using ${controlPoint.evaluation_method}.`,
    `Score using ${controlPoint.scoring_logic}.`,
  ],
  linked_workflows: controlPoint.linked_project_modules,
  evidence_required: controlPoint.evidence_requirement,
  measurable_fields: [
    controlPoint.source_standard_clause,
    controlPoint.evaluation_frequency,
    controlPoint.control_owner,
  ],
  master_design_reference: getReference(controlPoint),
  state: buildControlPointState(controlPoint),
}));

export const masterDesignControlPointMap = new Map(masterDesignControlPoints.map((controlPoint) => [controlPoint.id, controlPoint]));

export const masterDesignControlPointNodeMap = new Map(masterDesignControlPoints.map((controlPoint) => [controlPoint.master_design_reference.nodeId, controlPoint]));

export function getControlPointByNodeId(nodeId: string) {
  return masterDesignControlPointNodeMap.get(nodeId) ?? null;
}

export function getControlPointsByParentNodeId(parentNodeId: string) {
  return masterDesignControlPoints.filter((controlPoint) => controlPoint.master_design_reference.parentNodeId === parentNodeId);
}

export function buildStandardsHierarchyNodes(): GeneratedStandardNode[] {
  const nodes: Array<GeneratedStandardNode | null> = groupedStandardsParents
    .map((parent): GeneratedStandardNode | null => {
      const children: GeneratedStandardNode[] = getControlPointsByParentNodeId(parent.id).map((controlPoint) => ({
        id: controlPoint.master_design_reference.nodeId,
        title: controlPoint.master_design_reference.nodeTitle,
        description: controlPoint.description,
        controlPointId: controlPoint.id,
        children: [],
      }));

      if (!children.length) {
        return null;
      }

      return {
        id: parent.id,
        title: parent.title,
        description: parent.description,
        controlPointId: null,
        children,
      } satisfies GeneratedStandardNode;
    })
    .filter((node): node is GeneratedStandardNode => Boolean(node));

  return nodes as GeneratedStandardNode[];
}
