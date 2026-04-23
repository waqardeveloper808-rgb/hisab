import type { AuditControlStatus, AuditResultStatus, EvidenceArtifact, EvidenceValidationResult, RegistryControlPoint } from "./types";

function matchesRequirement(requirement: string, artifact: EvidenceArtifact) {
  return artifact.kind === requirement || artifact.label === requirement || artifact.fields[requirement] !== undefined || artifact.traceableTo?.includes(requirement) || artifact.source.includes(requirement);
}

export function validateEvidence(control: RegistryControlPoint, evidence: EvidenceArtifact[]): EvidenceValidationResult {
  const found = new Set<string>();
  const missing: string[] = [];
  let traceable = true;

  for (const requirement of control.evidence_requirements) {
    const match = evidence.find((artifact) => matchesRequirement(requirement, artifact));
    if (match) {
      found.add(requirement);
      traceable = traceable && Boolean(match.traceableTo?.length) && match.traceableTo.includes(control.source_clause_id);
    } else {
      missing.push(requirement);
    }
  }

  let quality_status: EvidenceValidationResult["evidence_quality_status"] = "sufficient";
  let rejection_reason: string | null = null;

  if (missing.length > 0 && found.size === 0) {
    quality_status = "insufficient";
    rejection_reason = `Missing all required evidence: ${missing.join(", ")}`;
  } else if (missing.length > 0) {
    quality_status = "partial";
    rejection_reason = `Missing required evidence: ${missing.join(", ")}`;
  } else if (!traceable) {
    quality_status = "rejected";
    rejection_reason = "Evidence is present but not traceable to the source clause.";
  }

  return {
    evidence_items_found: [...found],
    evidence_items_missing: missing,
    evidence_traceable: traceable,
    evidence_quality_status: quality_status,
    evidence_rejection_reason: rejection_reason,
  };
}

export function evidenceStatusToResultStatus(result: EvidenceValidationResult): AuditResultStatus | null {
  if (result.evidence_quality_status === "sufficient") return null;
  if (result.evidence_quality_status === "partial") return "blocked";
  if (result.evidence_quality_status === "insufficient") return "not_executable_due_to_missing_evidence";
  return "fail";
}
