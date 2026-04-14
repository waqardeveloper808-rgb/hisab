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
      recommendedFix: "Let the page body own the single H1 for the module route and keep the workspace shell title as non-heading chrome.",
    });
  }

  if (!report.table_found && report.verdict !== "AUTH_LIMITED" && report.verdict !== "PLACEHOLDER" && report.actions_found.some((action) => /save draft|issue document|post document/i.test(action)) === false) {
    candidates.push({
      type: "missing-register",
      symptom: `${report.route} does not expose a register surface.`,
      evidence: [...report.ui_findings, ...report.logic_findings].slice(0, 3),
      confidence: "medium",
      recommendedFix: "Add a real register table with row actions and module data wiring for this route.",
    });
  }

  if (report.logic_findings.some((finding) => /Workflow break|Dead-end form/i.test(finding))) {
    candidates.push({
      type: "workflow-break",
      symptom: `${report.route} breaks the intended business workflow.` ,
      evidence: report.logic_findings.filter((finding) => /Workflow break|Dead-end form/i.test(finding)).slice(0, 4),
      confidence: "high",
      recommendedFix: "Wire the missing workflow states into the route and ensure inline create plus downstream write effects are available from the same screen.",
    });
  }

  if (report.logic_findings.some((finding) => /Business rule failure/i.test(finding))) {
    candidates.push({
      type: "business-logic",
      symptom: `${report.route} exposed inconsistent business totals or statuses.`,
      evidence: report.logic_findings.filter((finding) => /Business rule failure/i.test(finding)).slice(0, 4),
      confidence: "high",
      recommendedFix: "Fix the transaction write path so document totals, payment balances, and downstream books update together after each business action.",
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