import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  standardsControlPointValidation,
  standardsControlPoints,
  standardsControlPointsByCategory,
} from "@/data/standards/control-points";

function formatTimestamp(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

async function main() {
  const root = process.cwd();
  const timestamp = formatTimestamp(new Date());
  const artifactDir = path.join(root, "artifacts", `control_points_build_${timestamp}`);
  const logsDir = path.join(artifactDir, "logs");
  const sourceFile = path.join(root, "data", "standards", "control-points.ts");
  const copiedSourceFile = path.join(artifactDir, "control-points.ts");
  const mappingFile = path.join(artifactDir, "mapping.json");
  const summaryFile = path.join(artifactDir, "summary.md");
  const executionLogFile = path.join(logsDir, "execution-log.md");

  await mkdir(logsDir, { recursive: true });
  await cp(sourceFile, copiedSourceFile);

  const categorySummary = Object.entries(standardsControlPointsByCategory).map(([category, controlPoints]) => ({
    category,
    count: controlPoints.length,
    ids: controlPoints.map((controlPoint) => controlPoint.id),
    masterDesignNodeIds: controlPoints.map((controlPoint) => controlPoint.master_design_reference.nodeId),
  }));

  const mappingPayload = {
    generatedAt: new Date().toISOString(),
    totalControlPoints: standardsControlPoints.length,
    categoriesCovered: standardsControlPointValidation.categoriesCovered,
    validation: standardsControlPointValidation,
    categorySummary,
    controlPoints: standardsControlPoints.map((controlPoint) => ({
      id: controlPoint.id,
      name: controlPoint.name,
      category: controlPoint.category,
      requestedCategory: controlPoint.category_mapping.requestedCategory,
      masterDesignCategory: controlPoint.category_mapping.masterDesignCategory,
      masterDesignNodeId: controlPoint.master_design_reference.nodeId,
      masterDesignPath: controlPoint.master_design_reference.path,
      auditMethod: controlPoint.audit_method,
      severity: controlPoint.severity,
      measurableFields: controlPoint.measurable_fields,
      evidenceRequired: controlPoint.evidence_required,
    })),
  };

  const summary = [
    "# Control Points Build",
    "",
    `- Generated at: ${new Date().toISOString()}`,
    `- Total control points: ${standardsControlPointValidation.totalControlPoints}`,
    `- Expected total control points: ${standardsControlPointValidation.expectedTotalControlPoints}`,
    `- Categories covered: ${standardsControlPointValidation.categoriesCovered.join(", ")}`,
    `- Missing categories: ${standardsControlPointValidation.missingCategories.length === 0 ? "none" : standardsControlPointValidation.missingCategories.join(", ")}`,
    `- Duplicate IDs: ${standardsControlPointValidation.duplicateIds.length === 0 ? "none" : standardsControlPointValidation.duplicateIds.join(", ")}`,
    `- Missing required fields: ${standardsControlPointValidation.missingRequiredFields.length === 0 ? "none" : standardsControlPointValidation.missingRequiredFields.join(", ")}`,
    `- Invalid category IDs: ${standardsControlPointValidation.invalidCategoryIds.length === 0 ? "none" : standardsControlPointValidation.invalidCategoryIds.join(", ")}`,
    `- Unstructured items: ${standardsControlPointValidation.unstructuredIds.length === 0 ? "none" : standardsControlPointValidation.unstructuredIds.join(", ")}`,
    `- Audit engine ready: ${standardsControlPointValidation.auditEngineReady ? "yes" : "no"}`,
    "",
    "## Category Counts",
    "",
    ...categorySummary.map((entry) => `- ${entry.category}: ${entry.count}`),
  ].join("\n");

  const executionLog = [
    `Generated artifact directory: ${artifactDir}`,
    `Copied source file: ${copiedSourceFile}`,
    `Wrote mapping file: ${mappingFile}`,
    `Wrote summary file: ${summaryFile}`,
    `Validation audit-engine-ready: ${standardsControlPointValidation.auditEngineReady ? "yes" : "no"}`,
  ].join("\n");

  await writeFile(mappingFile, `${JSON.stringify(mappingPayload, null, 2)}\n`, "utf8");
  await writeFile(summaryFile, `${summary}\n`, "utf8");
  await writeFile(executionLogFile, `${executionLog}\n`, "utf8");

  process.stdout.write(`${artifactDir}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});