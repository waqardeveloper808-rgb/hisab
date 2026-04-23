/* ─── Gulf Hisab AI Review Assistant — Model Adapter ─── */
/* Abstract provider layer for LLM integration */

import type { ModelProvider, ModelRequest, ModelResponse, AuditFinding, AuditModule } from "./audit-types";
import { MODULE_LABELS, CATEGORY_LABELS } from "./audit-types";

// ─── Provider Configuration ───
export type ModelProviderConfig = {
  provider: ModelProvider;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  enabled: boolean;
};

const MODEL_CONFIG_KEY = "gulf-hisab-model-config";

export function getModelConfig(): ModelProviderConfig {
  if (typeof window === "undefined") {
    return { provider: "claude", enabled: false };
  }
  try {
    const raw = localStorage.getItem(MODEL_CONFIG_KEY);
    if (!raw) return { provider: "claude", enabled: false };
    return JSON.parse(raw) as ModelProviderConfig;
  } catch {
    return { provider: "claude", enabled: false };
  }
}

export function setModelConfig(config: ModelProviderConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MODEL_CONFIG_KEY, JSON.stringify(config));
}

// ─── LLM Operations (structured context builders) ───

export function buildAuditContext(findings: AuditFinding[], module?: AuditModule): Record<string, unknown> {
  const filtered = module ? findings.filter((f) => f.module === module) : findings;
  return {
    projectName: "Gulf Hisab",
    stack: "Next.js 16, React 19, Tailwind CSS 3, Laravel API",
    auditTimestamp: new Date().toISOString(),
    totalFindings: filtered.length,
    bySeverity: {
      critical: filtered.filter((f) => f.severity === "critical").length,
      major: filtered.filter((f) => f.severity === "major").length,
      medium: filtered.filter((f) => f.severity === "medium").length,
      minor: filtered.filter((f) => f.severity === "minor").length,
    },
    findings: filtered.map((f) => ({
      title: f.title,
      module: MODULE_LABELS[f.module],
      route: f.route,
      category: CATEGORY_LABELS[f.category],
      severity: f.severity,
      status: f.status,
      description: f.description,
      rootCause: f.rootCause,
      suggestedFixes: f.suggestedFixes,
    })),
    moduleContext: module ? MODULE_LABELS[module] : "All Modules",
  };
}

// ─── Generate Audit Summary (local, no API call) ───
export function generateLocalAuditSummary(findings: AuditFinding[]): string {
  const criticals = findings.filter((f) => f.severity === "critical");
  const majors = findings.filter((f) => f.severity === "major");
  const open = findings.filter((f) => !["resolved", "ignored"].includes(f.status));

  let summary = `## Gulf Hisab Audit Summary\n`;
  summary += `Generated: ${new Date().toLocaleString()}\n\n`;
  summary += `**Open findings**: ${open.length} | **Critical**: ${criticals.length} | **Major**: ${majors.length}\n\n`;

  if (criticals.length > 0) {
    summary += `### Critical Issues (fix immediately)\n`;
    for (const f of criticals) {
      summary += `- **${f.title}** — ${f.route} — ${f.description.substring(0, 100)}...\n`;
    }
    summary += "\n";
  }

  if (majors.length > 0) {
    summary += `### Major Issues\n`;
    for (const f of majors) {
      summary += `- **${f.title}** — ${f.route}\n`;
    }
    summary += "\n";
  }

  summary += `### What should be fixed next\n`;
  const prioritized = [...criticals, ...majors].slice(0, 5);
  prioritized.forEach((f, i) => {
    summary += `${i + 1}. ${f.title} (${f.route})\n`;
  });

  return summary;
}

// ─── Model Request Builder (for external API integration) ───
export function buildModelRequest(
  operation: ModelRequest["operation"],
  context: Record<string, unknown>,
): ModelRequest {
  const config = getModelConfig();
  return {
    provider: config.provider,
    operation,
    context,
  };
}

// ─── Simulated Model Response (for offline/local mode) ───
export function simulateModelResponse(request: ModelRequest): ModelResponse {
  // In the absence of an actual API connection, generate structured analysis locally
  const findings = (request.context.findings ?? []) as Array<{ title: string; severity: string; module: string }>;

  let result: string;
  switch (request.operation) {
    case "generateAudit":
      result = `Local audit analysis: ${findings.length} findings detected across ${new Set(findings.map((f) => f.module)).size} modules. Priority: fix ${findings.filter((f) => f.severity === "critical").length} critical issues first.`;
      break;
    case "summarizeFindings":
      result = `Summary: ${findings.length} findings. Most affected modules: ${[...new Set(findings.map((f) => f.module))].slice(0, 3).join(", ")}.`;
      break;
    case "generatePrompt":
      result = `Generated ${findings.length} fix prompts. See prompt generator for details.`;
      break;
    case "compareScreens":
      result = "Screenshot comparison requires browser automation. Use the inspector tool for live comparison.";
      break;
    case "analyzeModule":
      result = `Module analysis complete. ${findings.length} findings in scope.`;
      break;
    default:
      result = "Unknown operation.";
  }

  return {
    provider: request.provider,
    operation: request.operation,
    result,
    tokensUsed: 0,
    timestamp: new Date().toISOString(),
  };
}
