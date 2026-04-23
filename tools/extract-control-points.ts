import fs from "node:fs";
import path from "node:path";

import { standardsControlPoints as backendControlPoints } from "../backend/app/Support/Standards/control-points";
import { standardsControlPoints as registryControlPoints } from "../backend/app/Support/Standards/control-point-registry";
import { standardsControlPoints as dataControlPoints } from "../data/standards/control-points";
import { masterDesignControlPoints } from "../lib/master-design-control-points";

type ExtractedControlPoint = Record<string, unknown>;

const ROOT = process.cwd();
const STANDARDS_DIR = path.join(ROOT, "backend", "app", "Support", "Standards");
const ARTIFACTS_DIR = path.join(ROOT, "artifacts");

const SOURCE_SETS = [
  {
    source: "backend/app/Support/Standards/control-points.ts",
    controlPoints: backendControlPoints as readonly ExtractedControlPoint[],
  },
  {
    source: "backend/app/Support/Standards/control-point-registry.ts",
    controlPoints: registryControlPoints as readonly ExtractedControlPoint[],
  },
  {
    source: "data/standards/control-points.ts",
    controlPoints: dataControlPoints as readonly ExtractedControlPoint[],
  },
  {
    source: "lib/master-design-control-points.ts",
    controlPoints: masterDesignControlPoints as readonly ExtractedControlPoint[],
  },
] as const;

const CATEGORY_ORDER = ["ACC", "INV", "VAT", "DOC", "TMP", "UIX", "FRM", "VAL", "SEC", "BRD", "XMD"] as const;

function formatTimestamp(date: Date) {
  const parts = [
    date.getFullYear().toString().padStart(4, "0"),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
    date.getHours().toString().padStart(2, "0"),
    date.getMinutes().toString().padStart(2, "0"),
    date.getSeconds().toString().padStart(2, "0"),
  ];

  return `${parts[0]}${parts[1]}${parts[2]}_${parts[3]}${parts[4]}${parts[5]}`;
}

function ensureDirectory(directoryPath: string) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function toArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function toStringValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value == null) {
    return "";
  }

  return JSON.stringify(value, null, 2);
}

function toBulletList(value: unknown) {
  const items = toArray(value);
  if (!items.length) {
    return "-";
  }

  return items
    .map((item) => {
      if (typeof item === "string") {
        return `- ${item}`;
      }

      return `- ${JSON.stringify(item, null, 2)}`;
    })
    .join("\n");
}

function stringifyArrayExport(controlPoints: readonly ExtractedControlPoint[]) {
  return `export const CONTROL_POINTS_MASTER = ${JSON.stringify(controlPoints, null, 2)} as const;\n`;
}

function buildMarkdown(controlPoints: readonly ExtractedControlPoint[]) {
  return controlPoints
    .map((controlPoint) => {
      const extraKeys = Object.keys(controlPoint).filter(
        (key) =>
          ![
            "id",
            "category",
            "domain",
            "title",
            "purpose",
            "rule",
            "condition",
            "expected_behavior",
            "failure_conditions",
            "audit_steps",
            "pass_criteria",
            "fail_criteria",
            "severity",
            "priority",
            "applicability",
            "implementation_status",
            "linked_modules",
            "linked_processes",
            "evidence_required",
            "owner",
            "notes",
          ].includes(key),
      );

      const extraFields = extraKeys.length
        ? `\nAdditional Fields:\n${extraKeys
            .map((key) => `${key}:\n${typeof controlPoint[key] === "object" ? JSON.stringify(controlPoint[key], null, 2) : toStringValue(controlPoint[key])}`)
            .join("\n\n")}`
        : "";

      return [
        `### CONTROL POINT: ${toStringValue(controlPoint.id)}`,
        "",
        `Category: ${toStringValue(controlPoint.category)}`,
        `Domain: ${toStringValue(controlPoint.domain)}`,
        `Title: ${toStringValue(controlPoint.title)}`,
        "",
        `Purpose: ${toStringValue(controlPoint.purpose)}`,
        `Rule: ${toStringValue(controlPoint.rule)}`,
        `Condition: ${toStringValue(controlPoint.condition)}`,
        `Expected Behavior: ${toStringValue(controlPoint.expected_behavior)}`,
        "",
        "Failure Conditions:",
        toBulletList(controlPoint.failure_conditions),
        "",
        "Audit Steps:",
        toBulletList(controlPoint.audit_steps),
        "",
        `Pass Criteria: ${toStringValue(controlPoint.pass_criteria)}`,
        `Fail Criteria: ${toStringValue(controlPoint.fail_criteria)}`,
        "",
        `Severity: ${toStringValue(controlPoint.severity)}`,
        `Priority: ${toStringValue(controlPoint.priority)}`,
        `Applicability: ${toArray(controlPoint.applicability).join(", ")}`,
        "",
        `Implementation Status: ${toStringValue(controlPoint.implementation_status)}`,
        "",
        "Linked Modules:",
        toBulletList(controlPoint.linked_modules),
        "",
        "Linked Processes:",
        toBulletList(controlPoint.linked_processes),
        "",
        "Evidence Required:",
        toBulletList(controlPoint.evidence_required),
        "",
        `Owner: ${toStringValue(controlPoint.owner)}`,
        `Notes: ${toStringValue(controlPoint.notes)}`,
        extraFields,
        "",
        "--------------------------------------------------",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function buildSummary(controlPoints: readonly ExtractedControlPoint[]) {
  const counts = Object.fromEntries(CATEGORY_ORDER.map((category) => [category, 0])) as Record<(typeof CATEGORY_ORDER)[number], number>;

  for (const controlPoint of controlPoints) {
    const categoryCode = typeof controlPoint.category_code === "string" ? controlPoint.category_code : "";
    if (categoryCode in counts) {
      counts[categoryCode as keyof typeof counts] += 1;
    }
  }

  return [
    `TOTAL CONTROL POINTS: ${controlPoints.length}`,
    "",
    "Category Breakdown:",
    "",
    "| Category | Count |",
    "|----------|------:|",
    ...CATEGORY_ORDER.map((category) => `| ${category} | ${counts[category]} |`),
    "",
  ].join("\n");
}

function buildExecutionLog(controlPoints: readonly ExtractedControlPoint[], artifactPath: string, generatedFiles: string[]) {
  return [
    "# Control Points Extraction Log",
    "",
    `Generated At: ${new Date().toISOString()}`,
    `Total Extracted Control Points: ${controlPoints.length}`,
    "",
    "## Source Counts",
    ...SOURCE_SETS.map((sourceSet) => `- ${sourceSet.source}: ${sourceSet.controlPoints.length}`),
    "",
    "## Generated Files",
    ...generatedFiles.map((filePath) => `- ${filePath}`),
    "",
    `Artifact Path: ${artifactPath}`,
    "",
  ].join("\n");
}

function writeFile(filePath: string, content: string) {
  fs.writeFileSync(filePath, content, "utf8");
}

function main() {
  ensureDirectory(STANDARDS_DIR);
  ensureDirectory(ARTIFACTS_DIR);

  const allControlPoints = SOURCE_SETS.flatMap((sourceSet) => [...sourceSet.controlPoints]);
  const timestamp = formatTimestamp(new Date());
  const artifactPath = path.join(ARTIFACTS_DIR, `control_points_extraction_${timestamp}`);
  ensureDirectory(artifactPath);

  const masterTsPath = path.join(STANDARDS_DIR, "control-points-master.ts");
  const masterMdPath = path.join(STANDARDS_DIR, "control-points-master.md");
  const summaryPath = path.join(STANDARDS_DIR, "control-points-summary.md");
  const executionLogPath = path.join(artifactPath, "execution-log.md");

  const masterTs = stringifyArrayExport(allControlPoints);
  const masterMd = buildMarkdown(allControlPoints);
  const summary = buildSummary(allControlPoints);

  writeFile(masterTsPath, masterTs);
  writeFile(masterMdPath, masterMd);
  writeFile(summaryPath, summary);

  const generatedFiles = [masterTsPath, masterMdPath, summaryPath];
  writeFile(executionLogPath, buildExecutionLog(allControlPoints, artifactPath, generatedFiles));

  for (const filePath of generatedFiles) {
    fs.copyFileSync(filePath, path.join(artifactPath, path.basename(filePath)));
  }

  console.log(`TOTAL CONTROL POINTS EXTRACTED: ${allControlPoints.length}`);
  console.log(`ARTIFACT PATH: ${artifactPath}`);
  for (const filePath of generatedFiles) {
    console.log(`FILE CREATED: ${filePath}`);
  }
}

main();