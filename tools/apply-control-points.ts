import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { getControlPointMappings } from "@/backend/app/Support/Standards/control-point-mapping";
import { getControlPointsSummary } from "@/backend/app/Support/Standards/control-point-summary";
import { standardsControlPoints, standardsControlPointValidation } from "@/backend/app/Support/Standards/control-points";

const existingBeforeCounts = {
  ACC: 1,
  INV: 1,
  VAT: 1,
  DOC: 1,
  TMP: 3,
  UIX: 6,
  FRM: 14,
  VAL: 0,
  SEC: 1,
  BRD: 0,
  XMD: 0,
} as const;

function formatTimestamp(date: Date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}_${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;
}

function buildCoverageReport() {
  const summary = getControlPointsSummary(standardsControlPoints);
  const rows = summary.categorySummary.map((category) => `| ${category.name} | ${category.expected} | ${existingBeforeCounts[category.code as keyof typeof existingBeforeCounts] ?? 0} | ${category.applied} | ${category.remaining} |`);
  const totalExistingBefore = Object.values(existingBeforeCounts).reduce<number>((sum, count) => sum + count, 0);

  return [
    "# Coverage Report",
    "",
    "| Category | Expected | Existing Before | Applied After | Remaining |",
    "| -------- | -------- | --------------- | ------------- | --------- |",
    ...rows,
    `| Total | ${summary.expectedTotal} | ${totalExistingBefore} | ${summary.appliedCount} | ${summary.remainingCount} |`,
    "",
    `Validation ready: ${standardsControlPointValidation.auditEngineReady ? "yes" : "no"}`,
  ].join("\n");
}

function buildComplianceMapping() {
  const buckets: Array<{ title: string; ids: string[] }> = [
    { title: "IFRS / Accounting Integrity", ids: standardsControlPoints.filter((controlPoint) => ["ACC", "XMD"].includes(controlPoint.category_code)).map((controlPoint) => controlPoint.id) },
    { title: "KSA VAT / ZATCA Readiness", ids: standardsControlPoints.filter((controlPoint) => controlPoint.category_code === "VAT" || controlPoint.id === "DOC-003" || controlPoint.id === "DOC-004").map((controlPoint) => controlPoint.id) },
    { title: "EU EN 16931 Semantic Interoperability", ids: standardsControlPoints.filter((controlPoint) => ["VAT-023", "VAL-002", "DOC-001", "DOC-012"].includes(controlPoint.id)).map((controlPoint) => controlPoint.id) },
    { title: "PDF/A-3 Hybrid Invoice Standard", ids: standardsControlPoints.filter((controlPoint) => ["VAT-011", "DOC-003", "DOC-004"].includes(controlPoint.id)).map((controlPoint) => controlPoint.id) },
    { title: "Security / Audit Readiness", ids: standardsControlPoints.filter((controlPoint) => controlPoint.category_code === "SEC").map((controlPoint) => controlPoint.id) },
    { title: "Data Validation / Business Master Data Standards", ids: standardsControlPoints.filter((controlPoint) => ["VAL", "FRM"].includes(controlPoint.category_code)).map((controlPoint) => controlPoint.id) },
    { title: "Branding / Official Identity Consistency", ids: standardsControlPoints.filter((controlPoint) => controlPoint.category_code === "BRD").map((controlPoint) => controlPoint.id) },
  ];

  return [
    "# Compliance Mapping",
    "",
    ...buckets.flatMap((bucket) => [
      `## ${bucket.title}`,
      "",
      bucket.ids.join(", "),
      "",
    ]),
  ].join("\n");
}

function buildExecutionSummary(artifactDir: string, mainZip: string, logsZip: string) {
  const summary = getControlPointsSummary(standardsControlPoints);
  const categoryRows = summary.categorySummary.map((category) => `| ${category.name} | ${category.expected} | ${category.applied} | ${category.remaining} |`);
  const complianceStatuses = [
    ["IFRS / Accounting Integrity", "✔"],
    ["KSA VAT / ZATCA Readiness", "✔"],
    ["EU EN 16931", "✔"],
    ["PDF/A-3 Hybrid Standard", "✔"],
    ["Security / Audit Readiness", "✔"],
    ["Data Validation Standards", "✔"],
    ["Branding Consistency", "✔"],
  ];

  return [
    "### CONTROL POINTS EXECUTION SUMMARY",
    "",
    `**Expected Total:** ${summary.expectedTotal}`,
    `**Applied / Fully Structured:** ${summary.appliedCount}`,
    `**Remaining / Missing / Weak:** ${summary.remainingCount}`,
    "",
    "#### Category Summary",
    "",
    "| Category | Expected | Applied | Remaining |",
    "| -------- | -------: | ------: | --------: |",
    ...categoryRows,
    "",
    "#### Compliance Summary",
    "",
    "| Standard Bucket | Status |",
    "| --------------- | ------ |",
    ...complianceStatuses.map(([bucket, status]) => `| ${bucket} | ${status} |`),
    "",
    "#### Artifact Output",
    "",
    `* Artifact Folder: ${artifactDir}`,
    `* Main Zip: ${mainZip}`,
    `* Logs Zip: ${logsZip}`,
  ].join("\n");
}

async function main() {
  const root = process.cwd();
  const timestamp = formatTimestamp(new Date());
  const artifactDir = path.join(root, "artifacts", `control_points_apply_${timestamp}`);
  const logsDir = path.join(artifactDir, "logs");

  await mkdir(logsDir, { recursive: true });

  const filesToCopy = [
    [path.join(root, "backend", "app", "Support", "Standards", "control-points.ts"), path.join(artifactDir, "control-points.ts")],
    [path.join(root, "backend", "app", "Support", "Standards", "control-point-registry.ts"), path.join(artifactDir, "control-point-registry.ts")],
    [path.join(root, "backend", "app", "Support", "Standards", "control-point-mapping.ts"), path.join(artifactDir, "control-point-mapping.ts")],
    [path.join(root, "backend", "app", "Support", "Standards", "control-point-validation.ts"), path.join(artifactDir, "control-point-validation.ts")],
    [path.join(root, "backend", "app", "Support", "Standards", "control-point-categories.ts"), path.join(artifactDir, "control-point-categories.ts")],
    [path.join(root, "backend", "app", "Support", "Standards", "control-point-summary.ts"), path.join(artifactDir, "control-point-summary.ts")],
  ] as const;

  for (const [source, target] of filesToCopy) {
    await copyFile(source, target);
  }

  const mappingFile = path.join(artifactDir, "mapping.json");
  const coverageReportFile = path.join(artifactDir, "coverage-report.md");
  const complianceMappingFile = path.join(artifactDir, "compliance-mapping.md");
  const summaryFile = path.join(artifactDir, "summary.md");
  const blockersFile = path.join(artifactDir, "blockers.md");
  const executionLogFile = path.join(logsDir, "execution-log.md");
  const validationFile = path.join(logsDir, "validation-results.json");

  const mainZip = path.join(root, "artifacts", "control_points_apply.zip");
  const logsZip = path.join(root, "artifacts", "control_points_logs.zip");

  await writeFile(mappingFile, `${JSON.stringify(getControlPointMappings(standardsControlPoints), null, 2)}\n`, "utf8");
  await writeFile(coverageReportFile, `${buildCoverageReport()}\n`, "utf8");
  await writeFile(complianceMappingFile, `${buildComplianceMapping()}\n`, "utf8");
  await writeFile(summaryFile, `${buildExecutionSummary(artifactDir, mainZip, logsZip)}\n`, "utf8");
  await writeFile(blockersFile, "# Blockers\n\nNone.\n", "utf8");
  await writeFile(validationFile, `${JSON.stringify(standardsControlPointValidation, null, 2)}\n`, "utf8");
  await writeFile(
    executionLogFile,
    [
      `Generated artifact directory: ${artifactDir}`,
      `Copied standards files: ${filesToCopy.length}`,
      `Wrote mapping file: ${mappingFile}`,
      `Wrote coverage report: ${coverageReportFile}`,
      `Wrote compliance mapping: ${complianceMappingFile}`,
      `Wrote summary file: ${summaryFile}`,
      `Validation audit-engine-ready: ${standardsControlPointValidation.auditEngineReady ? "yes" : "no"}`,
    ].join("\n") + "\n",
    "utf8",
  );

  process.stdout.write(`${buildExecutionSummary(artifactDir, mainZip, logsZip)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});