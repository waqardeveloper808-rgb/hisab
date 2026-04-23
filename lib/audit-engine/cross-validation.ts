import type { CrossValidationResult, RegistryControlPoint, SourceSnapshot } from "./types";

function deepSignature(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value !== "object") return JSON.stringify(value);
  try {
    return JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort());
  } catch {
    return String(value);
  }
}

export function resolveCrossValidation(control: RegistryControlPoint, sources: SourceSnapshot[]): CrossValidationResult {
  const required = control.cross_validation_sources;
  const attempted_sources = sources.map((source) => source.source_id);
  const inaccessible_sources = required.filter((sourceId) => !sources.some((source) => source.source_id === sourceId));
  const mismatched_sources: string[] = [];
  const comparable = sources.filter((source) => required.includes(source.source_id));

  if (required.length > 0 && comparable.length < required.length) {
    return {
      required_sources: required,
      attempted_sources,
      inaccessible_sources,
      mismatched_sources,
      status: "blocked",
      details: ["One or more required sources were not available for comparison."],
    };
  }

  if (comparable.length === 0) {
    return {
      required_sources: required,
      attempted_sources,
      inaccessible_sources,
      mismatched_sources,
      status: "blocked",
      details: ["No cross-validation sources were available."],
    };
  }

  const signature = deepSignature(comparable[0].data);
  for (const source of comparable.slice(1)) {
    if (deepSignature(source.data) !== signature) {
      mismatched_sources.push(source.source_id);
    }
  }

  if (mismatched_sources.length > 0) {
    return {
      required_sources: required,
      attempted_sources,
      inaccessible_sources,
      mismatched_sources,
      status: "failed",
      details: ["Cross-validation sources disagree."],
    };
  }

  return {
    required_sources: required,
    attempted_sources,
    inaccessible_sources,
    mismatched_sources,
    status: "passed",
    details: ["All available cross-validation sources agree."],
  };
}
