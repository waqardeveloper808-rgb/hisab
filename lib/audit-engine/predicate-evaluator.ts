import type { PredicateGroup, PredicateLeaf, PredicateEvaluation, SourceSnapshot, EvidenceArtifact } from "./types";

function readPath(target: unknown, path: string): unknown {
  if (!path) return undefined;
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, target);
}

function toComparable(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (trimmed !== "" && !Number.isNaN(Number(trimmed))) return Number(trimmed);
    const parsedDate = Date.parse(trimmed);
    if (!Number.isNaN(parsedDate) && /[-/:T]/.test(trimmed)) return parsedDate;
  }
  return value;
}

function compareValues(left: unknown, operator: string, right: unknown): boolean {
  const normalizedLeft = toComparable(left);
  const normalizedRight = toComparable(right);

  switch (operator) {
    case "=":
      return normalizedLeft === normalizedRight;
    case "!=":
      return normalizedLeft !== normalizedRight;
    case ">":
      return Number(normalizedLeft) > Number(normalizedRight);
    case ">=":
      return Number(normalizedLeft) >= Number(normalizedRight);
    case "<":
      return Number(normalizedLeft) < Number(normalizedRight);
    case "<=":
      return Number(normalizedLeft) <= Number(normalizedRight);
    case "in":
      return Array.isArray(normalizedRight) ? normalizedRight.some((item) => item === normalizedLeft) : false;
    case "not_in":
      return Array.isArray(normalizedRight) ? !normalizedRight.some((item) => item === normalizedLeft) : true;
    case "exists":
      return normalizedLeft !== undefined && normalizedLeft !== null;
    case "not_exists":
      return normalizedLeft === undefined || normalizedLeft === null;
    default:
      return false;
  }
}

function evaluateLeaf(leaf: PredicateLeaf, observed: Record<string, unknown>, evidence: EvidenceArtifact[], sources: SourceSnapshot[]) {
  const fromObserved = readPath(observed, leaf.lhs);
  const fromEvidence = evidence.find((item) => item.fields[leaf.lhs] !== undefined)?.fields[leaf.lhs];
  const fromSource = sources.find((item) => item.data[leaf.lhs] !== undefined)?.data[leaf.lhs];
  const candidate = fromObserved ?? fromEvidence ?? fromSource;
  const right = Array.isArray(leaf.rhs) ? leaf.rhs : leaf.rhs;
  return {
    leaf,
    result: compareValues(candidate, leaf.operator, right),
    observed: candidate,
  };
}

function walkGroup(group: PredicateGroup, observed: Record<string, unknown>, evidence: EvidenceArtifact[], sources: SourceSnapshot[]) {
  const traces: string[] = [];
  const passed: PredicateLeaf[] = [];
  const failed: PredicateLeaf[] = [];
  const results: boolean[] = [];

  for (const predicate of group.predicates) {
    if ("logic" in predicate) {
      const nested = walkGroup(predicate, observed, evidence, sources);
      traces.push(...nested.trace);
      passed.push(...nested.passed_predicates);
      failed.push(...nested.failed_predicates);
      results.push(nested.result);
      continue;
    }

    const evaluated = evaluateLeaf(predicate, observed, evidence, sources);
    results.push(evaluated.result);
    traces.push(`${evaluated.leaf.lhs} ${evaluated.leaf.operator} ${JSON.stringify(evaluated.leaf.rhs)} => ${evaluated.result}`);
    if (evaluated.result) passed.push(predicate);
    else failed.push(predicate);
  }

  const result = group.logic === "OR" ? results.some(Boolean) : results.every(Boolean);

  return {
    result,
    passed_predicates: passed,
    failed_predicates: failed,
    trace: traces,
  };
}

export function evaluatePredicateGroup(group: PredicateGroup, observed: Record<string, unknown>, evidence: EvidenceArtifact[], sources: SourceSnapshot[]): PredicateEvaluation {
  const walked = walkGroup(group, observed, evidence, sources);
  return walked;
}
