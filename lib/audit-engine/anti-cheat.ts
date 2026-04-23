import type { AuditControlStatus, AntiCheatResult, EvidenceArtifact, RegistryControlPoint, SourceSnapshot } from "./types";

function hasFlag(evidence: EvidenceArtifact[], flag: string) {
  return evidence.some((artifact) => artifact.kind === flag || artifact.label.toLowerCase().includes(flag.replaceAll("_", " ")) || Boolean(artifact.fields[flag]));
}

function textIncludes(value: unknown, needles: string[]) {
  if (typeof value !== "string") return false;
  const lower = value.toLowerCase();
  return needles.some((needle) => lower.includes(needle));
}

export function validateAntiCheat(
  control: RegistryControlPoint,
  evidence: EvidenceArtifact[],
  sources: SourceSnapshot[],
  observed: Record<string, unknown>,
): AntiCheatResult {
  const flags: string[] = [];
  const details: string[] = [];

  if (hasFlag(evidence, "preview_only_output_detected") || textIncludes(observed.control_mode, ["preview-only"])) {
    flags.push("preview_only_output_detected");
    details.push("Preview-only output was supplied where live proof was required.");
  }
  if (hasFlag(evidence, "placeholder_page_detected") || textIncludes(observed.route_state, ["placeholder", "catch-all"])) {
    flags.push("placeholder_page_detected");
    details.push("Placeholder page evidence was detected.");
  }
  if (hasFlag(evidence, "generic_shell_masking_detected") || Boolean(observed.generic_shell_masking_detected)) {
    flags.push("generic_shell_masking_detected");
    details.push("Generic shell masking was used to present a fake route owner or workflow.");
  }
  if (hasFlag(evidence, "cached_or_stale_evidence_detected") || Boolean(observed.cached_or_stale_evidence_detected)) {
    flags.push("cached_or_stale_evidence_detected");
    details.push("Cached or stale evidence was used.");
  }
  if (hasFlag(evidence, "mocked_response_detected") || Boolean(observed.mocked_response_detected)) {
    flags.push("mocked_response_detected");
    details.push("A mocked response was detected.");
  }
  if (hasFlag(evidence, "missing_traceability_detected") || sources.some((source) => !source.traceable)) {
    flags.push("missing_traceability_detected");
    details.push("One or more evidence sources are missing traceability.");
  }
  if (hasFlag(evidence, "self_attestation_without_source_detected") || Boolean(observed.self_attestation_without_source_detected)) {
    flags.push("self_attestation_without_source_detected");
    details.push("Self-attestation without source proof was detected.");
  }
  if (Boolean(observed.ui_pass_but_backend_state_fail)) {
    flags.push("ui_pass_but_backend_state_fail");
    details.push("UI success conflicts with backend state.");
  }
  if (Boolean(observed.ui_pass_but_db_state_fail)) {
    flags.push("ui_pass_but_db_state_fail");
    details.push("UI success conflicts with database state.");
  }
  if (Boolean(observed.ui_pass_but_journal_fail)) {
    flags.push("ui_pass_but_journal_fail");
    details.push("UI success conflicts with journal state.");
  }
  if (Boolean(observed.ui_pass_but_report_fail)) {
    flags.push("ui_pass_but_report_fail");
    details.push("UI success conflicts with report state.");
  }
  if (Boolean(observed.ui_pass_but_stock_movement_fail)) {
    flags.push("ui_pass_but_stock_movement_fail");
    details.push("UI success conflicts with stock movement state.");
  }

  if (control.validation_type === "hard_block" && evidence.length === 0) {
    flags.push("missing_traceability_detected");
    details.push("Hard-block control was executed without evidence.");
  }

  return {
    status: flags.length > 0 ? "failed" : "passed",
    flags,
    details,
  };
}
