import type { V2ControlPoint } from "@/backend/app/Support/Standards/v2/control-point-schema";

const sourceDocument = "Control Point Engine Governance";
const linkedFiles = [
  "backend/app/Support/Standards/control-point-engine.ts",
  "backend/app/Support/Standards/control-point-engine-runtime.ts",
  "backend/app/Support/Standards/control-point-engine-validation.ts",
  "backend/app/Support/Standards/control-point-engine-summary.ts",
  "backend/app/Support/Standards/control-point-engine-registry.ts",
];

function buildEngineControlPoint(id: string, chapter: string, title: string, clause: string, description: string, rule: string, evidenceRequirement: string[], nonconformity: string, weight: number, riskPriority: V2ControlPoint["risk_priority"]): V2ControlPoint {
  return {
    id,
    version: "2.0.0",
    module_code: "CPE",
    module_name: "Control Point Engine",
    chapter_number: chapter,
    title,
    source_standard_clause: clause,
    source_standard_document: sourceDocument,
    description,
    control_rule: rule,
    applicability: ["KSA", "Gulf", "EU", "Global"],
    conditions: [
      `When the system executes the control engine clause '${clause}'.`,
    ],
    evaluation_method: `Evaluate runtime engine registration and validation evidence for '${title}'.`,
    scoring_logic: `Pass when the Control Point Engine proves '${rule}' and fail when registration, validation, or traceability is missing or inconsistent.`,
    evidence_requirement: evidenceRequirement,
    nonconformity,
    control_weight: weight,
    risk_priority: riskPriority,
    evaluation_frequency: "Per release and quarterly control governance review",
    control_owner: "Control Point Engine",
    evaluator: "Standards governance reviewer",
    reviewer: "Architecture governance reviewer",
    linked_project_modules: ["proof-layer", "workflow-intelligence", "ui-ux-shell"],
    linked_files: linkedFiles,
    migration_action: "replace",
    implementation_status: "implemented",
    status: "active",
  };
}

export const controlPointEngineControlPoints: readonly V2ControlPoint[] = [
  buildEngineControlPoint("CP-CPE-001", "20.1", "Engine Module Registration Integrity", "Control Point Engine.module_registration_integrity", "Ensure every active control module is registered in the permanent Control Point Engine.", "No active control module may exist without Control Point Engine registration.", ["engine runtime module inventory", "module registration report"], "Active control modules exist outside the engine registry.", 10, "critical"),
  buildEngineControlPoint("CP-CPE-002", "20.2", "Engine Control Point Registration Integrity", "Control Point Engine.control_point_registration_integrity", "Ensure every active control point is registered in the permanent Control Point Engine runtime.", "All active control points must be registered exactly once in the engine.", ["engine control inventory", "control registration report"], "The engine inventory is missing active control points or registers them more than once.", 10, "critical"),
  buildEngineControlPoint("CP-CPE-003", "20.3", "Engine Duplicate ID Prevention", "Control Point Engine.duplicate_id_prevention", "Ensure duplicate control point IDs are detected and blocked by engine validation.", "The engine must detect and reject duplicate control point IDs.", ["engine validation report", "duplicate issue report"], "Duplicate control point IDs are not prevented by the engine.", 9, "critical"),
  buildEngineControlPoint("CP-CPE-004", "20.4", "Engine Orphan Detection", "Control Point Engine.orphan_detection", "Ensure control points assigned to unknown modules are detected by the engine.", "The engine must detect orphan control points and unknown module assignments.", ["engine validation report", "orphan issue report"], "Orphan control points are not detected by the engine.", 9, "high"),
  buildEngineControlPoint("CP-CPE-005", "20.5", "Engine Total Count Accuracy", "Control Point Engine.total_count_accuracy", "Ensure engine totals match the active registered dataset at runtime.", "The engine total count must match the canonical active control dataset.", ["engine summary", "count validation evidence"], "Engine totals do not match the active control dataset.", 8, "high"),
  buildEngineControlPoint("CP-CPE-006", "20.6", "Engine Standards Traceability Integrity", "Control Point Engine.traceability_integrity", "Ensure every registered control point keeps standards traceability inside the engine.", "The engine must expose standards source clauses and detect missing traceability.", ["engine summary", "traceability counts"], "The engine cannot prove standards traceability for all control points.", 8, "high"),
  buildEngineControlPoint("CP-CPE-007", "20.7", "Engine Future Module Onboarding Governance", "Control Point Engine.future_module_onboarding_governance", "Ensure future modules cannot be activated without registration, traceability, and control generation governance.", "New modules and sub-modules must be registered, controlled, validated, and activated through the engine onboarding path.", ["engine onboarding rules", "validation mechanism evidence"], "Future modules can bypass control governance onboarding.", 9, "critical"),
  buildEngineControlPoint("CP-CPE-008", "20.8", "Engine Validation Execution Integrity", "Control Point Engine.validation_execution_integrity", "Ensure engine validation runs deterministically and exposes its results to runtime consumers.", "Engine validation must execute and publish deterministic results.", ["engine validation report", "runtime validation output"], "Engine validation does not execute reliably or publish usable results.", 8, "high"),
  buildEngineControlPoint("CP-CPE-009", "20.9", "Engine Summary Consistency", "Control Point Engine.summary_consistency", "Ensure engine summaries are generated from the canonical runtime inventory and remain internally consistent.", "Engine summary counts must be consistent with registered modules and control points.", ["engine summary output", "runtime summary evidence"], "Engine summary output is inconsistent with the canonical inventory.", 7, "medium"),
  buildEngineControlPoint("CP-CPE-010", "20.10", "Engine Runtime Availability", "Control Point Engine.runtime_availability", "Ensure the Control Point Engine runtime is importable and callable by validation, audit, summary, and admin surfaces.", "The Control Point Engine must remain runtime-available as a shared governance component.", ["runtime import evidence", "build validation evidence"], "The Control Point Engine is not runtime-available to active system consumers.", 10, "critical"),
] as const;