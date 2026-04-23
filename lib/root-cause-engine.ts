import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type RootCauseLayer = "ui" | "api" | "route" | "service" | "database";
export type RootCauseProbeType = "api_probe" | "db_probe" | "ui_probe" | "invariant_probe";
export type RootCauseFailureType =
  | "API_SCHEMA_INVALID"
  | "NULL_PAYLOAD"
  | "UI_ERROR_FALSE_POSITIVE"
  | "DB_MISMATCH"
  | "SERVICE_FAILURE"
  | "STALE_AUDIT_SOURCE"
  | "UNKNOWN";

export type RootCauseEvidence = {
  db_rows?: number;
  api_status?: number;
  route_ok?: boolean;
  workflow_test_ok?: boolean;
  auth_ok?: boolean;
  linked_records?: number;
  assertion_ok?: boolean;
  payload_present?: boolean;
  ui_false_positive?: boolean;
  stale_audit_source?: boolean;
  failing_target?: string;
  probable_fix_files?: string[];
  expected_schema?: string;
  expected_invariant?: string;
  evidence_collector?: string;
  layer?: RootCauseLayer;
  probe_type?: RootCauseProbeType;
};

export type RootCauseRecord = {
  control_point_id: string;
  layer: RootCauseLayer;
  probe_type: RootCauseProbeType;
  failure_type: RootCauseFailureType;
  failing_target: string;
  probable_root_cause: string;
  probable_fix_files: string[];
  evidence: RootCauseEvidence;
};

function normalizeLayer(evidence: RootCauseEvidence): RootCauseLayer {
  if (evidence.layer) {
    return evidence.layer;
  }
  if (evidence.ui_false_positive) {
    return "ui";
  }
  if (typeof evidence.db_rows === "number") {
    return "database";
  }
  if (evidence.route_ok === false) {
    return "route";
  }
  if (evidence.workflow_test_ok === false) {
    return "service";
  }
  return "api";
}

function normalizeProbeType(evidence: RootCauseEvidence, layer: RootCauseLayer): RootCauseProbeType {
  if (evidence.probe_type) {
    return evidence.probe_type;
  }
  if (layer === "database") {
    return "db_probe";
  }
  if (layer === "ui") {
    return "ui_probe";
  }
  if (evidence.payload_present === false || evidence.assertion_ok === false) {
    return "invariant_probe";
  }
  return "api_probe";
}

export function analyzeFailure(evidence: RootCauseEvidence): RootCauseFailureType {
  if (evidence.stale_audit_source) {
    return "STALE_AUDIT_SOURCE";
  }
  if (evidence.ui_false_positive) {
    return "UI_ERROR_FALSE_POSITIVE";
  }
  if (evidence.payload_present === false) {
    return "NULL_PAYLOAD";
  }
  if ((evidence.db_rows ?? 1) === 0) {
    return "DB_MISMATCH";
  }
  if (typeof evidence.api_status === "number" && evidence.api_status > 0 && evidence.api_status !== 200) {
    return "API_SCHEMA_INVALID";
  }
  if (evidence.workflow_test_ok === false || evidence.route_ok === false) {
    return "SERVICE_FAILURE";
  }
  return "UNKNOWN";
}

export function analyzePartialControlPoint(evidence: RootCauseEvidence) {
  return analyzeFailure(evidence);
}

function probableRootCause(failureType: RootCauseFailureType) {
  switch (failureType) {
    case "STALE_AUDIT_SOURCE":
      return "The audit result is based on stale or indirect evidence instead of a live probe.";
    case "UI_ERROR_FALSE_POSITIVE":
      return "The UI raised an error banner for a valid empty, preview, or zero-data state.";
    case "NULL_PAYLOAD":
      return "The route returned a null or missing payload instead of a structured success envelope.";
    case "DB_MISMATCH":
      return "The database does not contain the records or counts required by the control point.";
    case "API_SCHEMA_INVALID":
      return "The API status or payload schema did not match the expected contract.";
    case "SERVICE_FAILURE":
      return "A dependent route, service, or workflow test failed during execution.";
    default:
      return "The current evidence is insufficient to name a stronger root cause.";
  }
}

function buildRootCauseRecord(controlPointId: string, evidence: RootCauseEvidence): RootCauseRecord {
  const layer = normalizeLayer(evidence);
  const probeType = normalizeProbeType(evidence, layer);
  const failureType = analyzeFailure(evidence);
  return {
    control_point_id: controlPointId,
    layer,
    probe_type: probeType,
    failure_type: failureType,
    failing_target: evidence.failing_target ?? evidence.evidence_collector ?? "live-system-probe",
    probable_root_cause: probableRootCause(failureType),
    probable_fix_files: evidence.probable_fix_files ?? [],
    evidence,
  };
}

export async function writeRootCauseReport(records: Array<{ control_point_id: string; evidence: RootCauseEvidence }>, targetFilePath = path.join(process.cwd(), "artifacts", "root-cause-report.json")) {
  const payload = {
    generated_at: new Date().toISOString(),
    results: records.map((record) => buildRootCauseRecord(record.control_point_id, record.evidence)),
  };

  await mkdir(path.dirname(targetFilePath), { recursive: true });
  await writeFile(targetFilePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  return payload;
}

export async function writePartialRootCauseReport(records: Array<{ control_point_id: string; module: string; evidence: RootCauseEvidence }>, targetFilePath = path.join(process.cwd(), "artifacts", "partial-root-cause.json")) {
  const payload = {
    generated_at: new Date().toISOString(),
    results: records.map((record) => ({
      module: record.module,
      ...buildRootCauseRecord(record.control_point_id, record.evidence),
    })),
  };

  await mkdir(path.dirname(targetFilePath), { recursive: true });
  await writeFile(targetFilePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  return payload;
}