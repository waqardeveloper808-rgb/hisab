/* ─── Gulf Hisab AI Review Assistant — Prompt Generator ─── */

import type { AuditFinding, AuditModule, PromptMode, GeneratedPrompt } from "./audit-types";
import { MODULE_LABELS, CATEGORY_LABELS } from "./audit-types";
import { KNOWN_ROUTES } from "./audit-collector";

// ─── Prompt Templates ───

function copilotPrompt(finding: AuditFinding): string {
  const route = KNOWN_ROUTES.find((r) => r.route === finding.route);
  const owner = route?.owner ?? "unknown component";
  return `Fix: ${finding.title}

Module: ${MODULE_LABELS[finding.module]}
Route: ${finding.route}
Component: ${owner}
Category: ${CATEGORY_LABELS[finding.category]}
Severity: ${finding.severity}

Problem:
${finding.description}

Root Cause:
${finding.rootCause}

Required Fix:
${finding.suggestedFixes.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Acceptance Criteria:
- The route ${finding.route} must render a dedicated component, not the catch-all placeholder.
- The page must follow Gulf Hisab density rules: compact rows, hidden filters, register-only default.
- No wrong-action contamination from unrelated modules.
- Build must pass with zero errors.
- ESLint must pass on changed files.`;
}

function claudePrompt(finding: AuditFinding): string {
  return `# Code Review: ${finding.title}

## Context
- **Product**: Gulf Hisab (Next.js 16 + React 19 + Tailwind CSS 3)
- **Module**: ${MODULE_LABELS[finding.module]}
- **Route**: ${finding.route}
- **Category**: ${CATEGORY_LABELS[finding.category]}
- **Severity**: ${finding.severity.toUpperCase()}

## Current Problem
${finding.description}

## Root Cause Analysis
${finding.rootCause}

## Suggested Implementation
${finding.suggestedFixes.map((f, i) => `${i + 1}. ${f}`).join("\n")}

## Architecture Rules
- Register pages show register-only by default, split preview on selection
- Filters hidden by default
- Compact density: text-xs body, text-sm headers, py-1.5 row padding
- No giant cards or hero sections
- Action bars: compact, contextual, appear on selection
- Inventory items require mandatory unique codes
- All journals must have audit trail
- ZATCA QR inside document footer, not separate panel

## Validation Checklist
- [ ] Route renders dedicated component
- [ ] No catch-all placeholder fallback
- [ ] Density rules followed
- [ ] No wrong-action contamination
- [ ] Build passes (npx next build)
- [ ] ESLint clean (npx eslint <changed-files>)`;
}

function internalTaskPrompt(finding: AuditFinding): string {
  return `TASK: ${finding.title}
SEVERITY: ${finding.severity}
MODULE: ${MODULE_LABELS[finding.module]}
ROUTE: ${finding.route}
CATEGORY: ${CATEGORY_LABELS[finding.category]}

DESCRIPTION:
${finding.description}

ROOT CAUSE:
${finding.rootCause}

STEPS:
${finding.suggestedFixes.map((f, i) => `${i + 1}. ${f}`).join("\n")}

DONE WHEN:
- Fix implemented and tested
- Build passes
- No regressions in related routes`;
}

function regressionRetestPrompt(finding: AuditFinding): string {
  return `REGRESSION RETEST: ${finding.title}

This finding was previously resolved but may have regressed.

Route: ${finding.route}
Module: ${MODULE_LABELS[finding.module]}
Original Issue: ${finding.description}

RETEST STEPS:
1. Navigate to ${finding.route}
2. Verify the fix is still in place
3. Check for the original symptoms: ${finding.description.substring(0, 200)}
4. Verify no new issues introduced
5. Check related routes in the same module

PASS CRITERIA:
- Original issue is not present
- No new regressions
- Page follows current density and behavior rules`;
}

// ─── Generate Single Prompt ───
export function generatePromptForFinding(finding: AuditFinding, mode: PromptMode): Omit<GeneratedPrompt, "id" | "createdAt"> {
  let prompt: string;
  switch (mode) {
    case "copilot": prompt = copilotPrompt(finding); break;
    case "claude": prompt = claudePrompt(finding); break;
    case "internal_task": prompt = internalTaskPrompt(finding); break;
    case "regression_retest": prompt = regressionRetestPrompt(finding); break;
  }

  return {
    findingId: finding.id,
    module: finding.module,
    mode,
    title: `${mode}: ${finding.title}`,
    prompt,
    acceptanceCriteria: finding.suggestedFixes,
    validationChecklist: [
      "Build passes with zero errors",
      "ESLint clean on changed files",
      `Route ${finding.route} renders correctly`,
      "No wrong-action contamination",
      "Density rules followed",
    ],
  };
}

// ─── Generate Module Remediation Plan ───
export function generateModuleRemediationPlan(module: AuditModule, findings: AuditFinding[]): Omit<GeneratedPrompt, "id" | "createdAt"> {
  const moduleName = MODULE_LABELS[module];
  const moduleRoutes = KNOWN_ROUTES.filter((r) => r.module === module);
  const criticals = findings.filter((f) => f.severity === "critical");
  const majors = findings.filter((f) => f.severity === "major");

  const plan = `# ${moduleName} Module Remediation Plan

## Overview
- Total findings: ${findings.length}
- Critical: ${criticals.length}
- Major: ${majors.length}
- Routes in module: ${moduleRoutes.length}
- Placeholder routes: ${moduleRoutes.filter((r) => r.isPlaceholder).length}

## Critical Findings (Fix First)
${criticals.map((f, i) => `${i + 1}. [${f.severity.toUpperCase()}] ${f.title}\n   Route: ${f.route}\n   Fix: ${f.suggestedFixes[0] ?? "See finding details"}`).join("\n\n")}

## Major Findings
${majors.map((f, i) => `${i + 1}. [${f.severity.toUpperCase()}] ${f.title}\n   Route: ${f.route}\n   Fix: ${f.suggestedFixes[0] ?? "See finding details"}`).join("\n\n")}

## Route Status
${moduleRoutes.map((r) => `- ${r.route}: ${r.isPlaceholder ? "PLACEHOLDER" : "Real"} (${r.owner})`).join("\n")}

## Execution Order
1. Fix all critical findings first
2. Build dedicated components for placeholder routes
3. Apply density and behavior rules
4. Run validation (build + lint + route check)
5. Re-audit for regressions
`;

  return {
    module,
    mode: "copilot",
    title: `${moduleName} Module Remediation Plan`,
    prompt: plan,
    acceptanceCriteria: criticals.map((f) => f.suggestedFixes[0] ?? f.title),
    validationChecklist: [
      "All critical findings resolved",
      "Placeholder routes replaced with dedicated components",
      "Build passes with zero errors",
      "No wrong-action contamination in any route",
    ],
  };
}

// ─── Generate Full Project Audit Report ───
export function generateFullAuditReport(findings: AuditFinding[]): string {
  const byModule = new Map<AuditModule, AuditFinding[]>();
  for (const f of findings) {
    const existing = byModule.get(f.module) ?? [];
    existing.push(f);
    byModule.set(f.module, existing);
  }

  const bySeverity = {
    critical: findings.filter((f) => f.severity === "critical").length,
    major: findings.filter((f) => f.severity === "major").length,
    medium: findings.filter((f) => f.severity === "medium").length,
    minor: findings.filter((f) => f.severity === "minor").length,
  };

  let report = `# Gulf Hisab Full Project Audit Report
Generated: ${new Date().toISOString()}

## Summary
- Total findings: ${findings.length}
- Critical: ${bySeverity.critical}
- Major: ${bySeverity.major}
- Medium: ${bySeverity.medium}
- Minor: ${bySeverity.minor}

## Findings by Module\n`;

  for (const [mod, modFindings] of byModule) {
    report += `\n### ${MODULE_LABELS[mod]} (${modFindings.length} findings)\n`;
    for (const f of modFindings) {
      report += `- [${f.severity.toUpperCase()}] ${f.title} — ${f.route}\n`;
    }
  }

  report += `\n## Priority Fix Order\n`;
  const criticals = findings.filter((f) => f.severity === "critical");
  criticals.forEach((f, i) => {
    report += `${i + 1}. ${f.title} (${f.route})\n`;
  });

  return report;
}
