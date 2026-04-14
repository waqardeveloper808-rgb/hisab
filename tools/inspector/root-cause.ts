import { runFiveWhys, type FailureCandidate } from "./five-whys";
import type { FiveWhysReport, RouteReport } from "./route-catalog";

export function buildRootCauseAnalysis(report: RouteReport): {
  fiveWhys: FiveWhysReport;
  summary: string;
  recommendedFixes: string[];
} {
  const candidates: FailureCandidate[] = [];

  if (report.architecture_findings.some((finding) => /catch-all|placeholder/i.test(finding)) || report.filler_text_found) {
    candidates.push({
      type: "placeholder",
      symptom: `${report.route} renders placeholder workspace content instead of a module-specific workflow.`,
      evidence: [...report.architecture_findings, ...report.ui_findings].slice(0, 4),
      confidence: "high",
      recommendedFix: "Replace the catch-all route for this module with a dedicated user page wired to real register data and module-specific actions.",
    });
  }

  if (report.network_failures.some((failure) => failure.status === 401)) {
    candidates.push({
      type: "auth-limited",
      symptom: `${report.route} cannot load protected data in the current session.`,
      evidence: report.network_failures.filter((failure) => failure.status === 401).map((failure) => `${failure.method} ${failure.url} returned ${failure.status}.`),
      confidence: "high",
      recommendedFix: "Run the inspector against an authenticated sandbox company session or add an explicit read-only preview data path for this module.",
    });
  }

  if (report.visual_findings.some((finding) => /H1|heading/i.test(finding))) {
    candidates.push({
      type: "duplicate-headers",
      symptom: `${report.route} renders duplicate top-level headings.`,
      evidence: report.visual_findings.filter((finding) => /H1|heading/i.test(finding)).slice(0, 3),
      confidence: "high",
      recommendedFix: "Let the workspace shell own the primary H1 on compact operational routes and downgrade the in-page title to a section heading.",
    });
  }

  if (!report.table_found && report.verdict !== "AUTH_LIMITED" && report.verdict !== "PLACEHOLDER") {
    candidates.push({
      type: "missing-register",
      symptom: `${report.route} does not expose a register surface.`,
      evidence: [...report.ui_findings, ...report.logic_findings].slice(0, 3),
      confidence: "medium",
      recommendedFix: "Add a real register table with row actions and module data wiring for this route.",
    });
  }

  if (candidates.length === 0 && report.network_failures.length > 0) {
    candidates.push({
      type: "network-failure",
      symptom: `${report.route} encountered failing API traffic during inspection.`,
      evidence: report.network_failures.map((failure) => `${failure.method} ${failure.url} returned ${failure.status}.`).slice(0, 4),
      confidence: "medium",
      recommendedFix: "Stabilize the failing API path or make the route resilient when the backend is unavailable.",
    });
  }

  const analyses = candidates.map(runFiveWhys);
  const recommendedFixes = [...new Set(analyses.map((analysis) => analysis.recommended_fix))];
  const summary = analyses.length > 0
    ? analyses.map((analysis) => analysis.root_cause).join(" ")
    : "No route-level failure required a root-cause escalation.";

  return {
    fiveWhys: { analyses },
    summary,
    recommendedFixes,
  };
}