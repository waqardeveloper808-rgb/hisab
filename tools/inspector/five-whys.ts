import type { ConfidenceLevel, WhyAnalysis } from "./route-catalog";

export type FailureCandidateType = "placeholder" | "auth-limited" | "duplicate-headers" | "missing-register" | "network-failure";

export type FailureCandidate = {
  type: FailureCandidateType;
  symptom: string;
  evidence: string[];
  confidence: ConfidenceLevel;
  recommendedFix: string;
};

export function runFiveWhys(candidate: FailureCandidate): WhyAnalysis {
  switch (candidate.type) {
    case "placeholder":
      return {
        symptom: candidate.symptom,
        evidence: candidate.evidence,
        why1: "Because the route renders a generic module page instead of a module-specific register.",
        why2: "Because no dedicated page file exists for the route under app/workspace/user.",
        why3: "Because the user navigation advertises the module before the module implementation exists.",
        why4: "Because the workspace architecture falls back to a shared catch-all route for incomplete modules.",
        why5: "Because there is no automated route-quality gate preventing sidebar links from shipping with placeholder content.",
        root_cause: "Module navigation is ahead of module implementation, and the catch-all fallback masks missing route ownership.",
        confidence_level: candidate.confidence,
        confirmed: [
          "Dedicated page file is missing for the route.",
          "The rendered DOM includes placeholder module markers.",
        ],
        likely: ["The role workspace system is using the catch-all route as a shipping fallback."],
        possible: ["Route ownership is not tracked in release validation."],
        recommended_fix: candidate.recommendedFix,
      };
    case "auth-limited":
      return {
        symptom: candidate.symptom,
        evidence: candidate.evidence,
        why1: "Because the route requests protected workspace APIs while the session is in guest preview mode.",
        why2: "Because the current local server is serving preview-mode shell access without authenticated workspace credentials.",
        why3: "Because the route depends on live backend data and does not have a read-only preview data source.",
        why4: "Because preview rendering is coupled to authenticated APIs rather than a controlled inspection dataset.",
        why5: "Because route validation is being run outside a seeded authenticated company session.",
        root_cause: "Inspection is executing against guest preview instead of a seeded authenticated workspace, so protected module APIs fail before data can render.",
        confidence_level: candidate.confidence,
        confirmed: [
          "Protected API responses returned 401/unauthorized.",
          "The page rendered preview-mode indicators during inspection.",
        ],
        likely: ["These routes need authenticated company context to expose real records."],
        possible: ["A read-only sandbox dataset could remove this limitation for inspection."],
        recommended_fix: candidate.recommendedFix,
      };
    case "duplicate-headers":
      return {
        symptom: candidate.symptom,
        evidence: candidate.evidence,
        why1: "Because both the workspace shell and the module page render the same top-level page title.",
        why2: "Because compact operational pages still expose a local page H1 inside the content area.",
        why3: "Because ownership of the primary heading is split between the shell and the route component.",
        root_cause: "Heading responsibility is duplicated between the shell and the page body on operational routes.",
        confidence_level: candidate.confidence,
        confirmed: ["The DOM contains multiple H1 elements for the same route."],
        likely: ["The shell and page were designed independently."],
        possible: ["The duplication may also affect accessibility landmarks and screen-reader flow."],
        recommended_fix: candidate.recommendedFix,
      };
    case "missing-register":
      return {
        symptom: candidate.symptom,
        evidence: candidate.evidence,
        why1: "Because the route does not render a table or register surface.",
        why2: "Because the page is not wired to fetch and present module records.",
        why3: "Because the module still relies on generic workspace scaffolding rather than a task-specific implementation.",
        root_cause: "The module lacks dedicated register wiring, so the user lands on a shell or placeholder instead of an operational screen.",
        confidence_level: candidate.confidence,
        confirmed: candidate.evidence,
        likely: [],
        possible: [],
        recommended_fix: candidate.recommendedFix,
      };
    case "network-failure":
    default:
      return {
        symptom: candidate.symptom,
        evidence: candidate.evidence,
        why1: "Because the page triggered network requests that failed during inspection.",
        why2: "Because the route depends on backend state that was unavailable or rejected.",
        root_cause: "Route behavior is coupled to a failing network dependency and needs either resilient handling or a valid backend session.",
        confidence_level: candidate.confidence,
        confirmed: candidate.evidence,
        likely: [],
        possible: [],
        recommended_fix: candidate.recommendedFix,
      };
  }
}