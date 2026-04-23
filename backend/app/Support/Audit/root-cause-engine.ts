export type FailureType =
  | "API_SCHEMA_INVALID"
  | "NULL_PAYLOAD"
  | "UI_ERROR_FALSE_POSITIVE"
  | "DB_MISMATCH"
  | "SERVICE_FAILURE"
  | "STALE_AUDIT_SOURCE"
  | "DESIGN FAILURE"
  | "IMPLEMENTATION FAILURE"
  | "OPERATING FAILURE";

export type RootCauseLayer = "ui" | "api" | "route" | "service" | "database";

export type RootCauseProbeType = "api_probe" | "db_probe" | "ui_probe" | "invariant_probe";

export type RootCauseAnalysis = {
  control_point_id?: string;
  layer: RootCauseLayer;
  probe_type: RootCauseProbeType;
  failing_target: string;
  probable_root_cause: string;
  probable_fix_files: string[];
  symptom: string;
  immediate_cause: string;
  underlying_cause: string;
  broken_dependency: string;
  corrective_action: string;
  retest_method: string;
  failure_type: FailureType;
};

export type RootCauseContext = {
  controlPointId?: string;
  layer?: RootCauseLayer;
  probeType?: RootCauseProbeType;
  failingTarget?: string;
  probableFixFiles?: string[];
  apiStatus?: number;
  dbRows?: number;
  payloadPresent?: boolean;
  uiFalsePositive?: boolean;
  staleAuditSource?: boolean;
  hasDesignGap?: boolean;
  hasImplementationDefect?: boolean;
  hasRuntimeDependencyFailure?: boolean;
  symptom: string;
  dependency: string;
  fileHint: string;
  functionHint: string;
  businessImpact: string;
};

export function classifyFailureType(context: RootCauseContext): FailureType {
  if (context.staleAuditSource) {
    return "STALE_AUDIT_SOURCE";
  }

  if (context.uiFalsePositive) {
    return "UI_ERROR_FALSE_POSITIVE";
  }

  if (context.payloadPresent === false) {
    return "NULL_PAYLOAD";
  }

  if (typeof context.apiStatus === "number" && context.apiStatus > 0 && context.apiStatus !== 200) {
    return "API_SCHEMA_INVALID";
  }

  if (typeof context.dbRows === "number" && context.dbRows === 0) {
    return "DB_MISMATCH";
  }

  if (context.hasRuntimeDependencyFailure) {
    return "SERVICE_FAILURE";
  }

  if (context.hasDesignGap) {
    return "DESIGN FAILURE";
  }

  if (context.hasImplementationDefect) {
    return "IMPLEMENTATION FAILURE";
  }

  return "OPERATING FAILURE";
}

export function analyzeRootCause(context: RootCauseContext): RootCauseAnalysis {
  const failureType = classifyFailureType(context);
  const layer = context.layer ?? (context.uiFalsePositive ? "ui" : context.hasRuntimeDependencyFailure ? "service" : typeof context.dbRows === "number" ? "database" : "api");
  const probeType = context.probeType ?? (layer === "database" ? "db_probe" : layer === "ui" ? "ui_probe" : context.payloadPresent === false ? "invariant_probe" : "api_probe");
  const probableFixFiles = context.probableFixFiles ?? [context.fileHint];
  const probableRootCause =
    failureType === "STALE_AUDIT_SOURCE"
      ? "The audit relied on stale or indirect signals instead of a live route, API, DB, or UI probe."
      : failureType === "UI_ERROR_FALSE_POSITIVE"
        ? "The UI is treating a valid empty or preview state as a backend failure."
        : failureType === "NULL_PAYLOAD"
          ? "The route or service returned an empty payload where a structured success envelope was expected."
          : failureType === "API_SCHEMA_INVALID"
            ? "The API response or status does not match the schema expected by the control point."
            : failureType === "DB_MISMATCH"
              ? "The database state does not support the workflow or report expected by the control point."
              : failureType === "SERVICE_FAILURE"
                ? "A dependent service or workflow execution failed before the control point could complete."
                : context.businessImpact;

  return {
    control_point_id: context.controlPointId,
    layer,
    probe_type: probeType,
    failing_target: context.failingTarget ?? context.dependency,
    probable_root_cause: probableRootCause,
    probable_fix_files: probableFixFiles,
    symptom: context.symptom,
    immediate_cause: `${context.fileHint} :: ${context.functionHint}`,
    underlying_cause: context.businessImpact,
    broken_dependency: context.dependency,
    corrective_action: `Repair ${context.functionHint} in ${context.fileHint} and rerun the dependent DB, API, UI, and workflow proofs.`,
    retest_method: `Repeat the failing workflow and verify the same state through DB, API, UI, and control evidence for ${context.dependency}.`,
    failure_type: failureType,
  };
}
