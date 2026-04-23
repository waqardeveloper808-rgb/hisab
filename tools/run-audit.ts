/* ─── CLI audit runner — executes runAllAuditRules and writes findings to JSON ─── */

import { runAllAuditRules, summarizeFindings } from "../lib/audit-rules";
import { KNOWN_ROUTES, buildRouteHealthFromRegistry, buildModuleHealthFromRoutes } from "../lib/audit-collector";
import * as fs from "node:fs";
import * as path from "node:path";

const findings = runAllAuditRules();
const summary = summarizeFindings(findings);
const totalPlaceholders = KNOWN_ROUTES.filter((r) => r.isPlaceholder).length;
const totalReal = KNOWN_ROUTES.filter((r) => !r.isPlaceholder).length;

const criticalCount = findings.filter((f) => f.severity === "critical").length;
const majorCount = findings.filter((f) => f.severity === "major").length;
const mediumCount = findings.filter((f) => f.severity === "medium").length;
const minorCount = findings.filter((f) => f.severity === "minor").length;

const report = {
  auditLoop: process.argv[2] === "--loop2" ? 2 : 1,
  timestamp: new Date().toISOString(),
  totalRoutes: KNOWN_ROUTES.length,
  realRoutes: totalReal,
  placeholderRoutes: totalPlaceholders,
  totalFindings: findings.length,
  bySeverity: { critical: criticalCount, major: majorCount, medium: mediumCount, minor: minorCount },
  byCategory: summary,
  findings: findings.map((f) => ({
    title: f.title,
    module: f.module,
    route: f.route,
    category: f.category,
    severity: f.severity,
    description: f.description,
    rootCause: f.rootCause,
    suggestedFixes: f.suggestedFixes,
  })),
};

console.log("=== Gulf Hisab AI Review — Audit Loop 1 ===");
console.log(`Routes: ${KNOWN_ROUTES.length} total, ${totalReal} real, ${totalPlaceholders} placeholder`);
console.log(`Findings: ${findings.length} total`);
console.log(`  Critical: ${criticalCount}`);
console.log(`  Major:    ${majorCount}`);
console.log(`  Medium:   ${mediumCount}`);
console.log(`  Minor:    ${minorCount}`);
console.log(`\nBy Category:`);
for (const [cat, count] of Object.entries(summary)) {
  console.log(`  ${cat}: ${count}`);
}
console.log("\n=== Critical Findings ===");
for (const f of findings.filter((f) => f.severity === "critical")) {
  console.log(`• [${f.module}] ${f.title}`);
  console.log(`  Route: ${f.route}`);
  console.log(`  ${f.description.slice(0, 120)}...`);
}
console.log("\n=== Major Findings ===");
for (const f of findings.filter((f) => f.severity === "major")) {
  console.log(`• [${f.module}] ${f.title}`);
  console.log(`  Route: ${f.route}`);
}

const outPath = path.join(process.cwd(), "qa_reports", `audit_loop_1_${Date.now()}.json`);
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`\nReport written to: ${outPath}`);
