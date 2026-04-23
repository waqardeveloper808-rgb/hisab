import fs from "node:fs";
import path from "node:path";

import { standardsControlPoints as backendControlPoints } from "../backend/app/Support/Standards/control-points";
import { CONTROL_POINTS_MASTER } from "../backend/app/Support/Standards/control-points-master";
import { standardsControlPoints as dataControlPoints } from "../data/standards/control-points";
import { masterDesignControlPoints } from "../lib/master-design-control-points";

type ControlPointLike = Record<string, unknown>;

type InventoryFileEntry = {
  relativePath: string;
  absolutePath: string;
  purpose: string;
};

type ControlPointInventoryEntry = {
  id: string;
  name: string;
  module: string;
  sourceFiles: Set<string>;
};

type StepRecord = {
  step: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  status: string;
};

const ROOT = process.cwd();
const ARTIFACTS_DIR = path.join(ROOT, "artifacts");
const SEARCH_TERMS = [
  "control point",
  "control-point",
  "control_points",
  "controlPoints",
  "standards",
  "audit",
  "master design",
  "registry",
  "PASS",
  "FAIL",
  "PARTIAL",
  "BLOCKED",
  "score",
  "evidence",
  "last_checked_at",
];

const PREFERRED_TARGETS = [
  "control-points.ts",
  "control-point-audit-engine.ts",
  "master-design-control-points.ts",
  "MasterDesignDashboard.tsx",
];

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".txt",
  ".yml",
  ".yaml",
  ".php",
  ".css",
]);

const SKIP_DIRECTORIES = new Set([
  ".git",
  ".next",
  "node_modules",
  "vendor",
  "storage",
  "coverage",
]);

function formatTimestamp(date: Date) {
  const parts = [
    date.getFullYear().toString().padStart(4, "0"),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
    date.getHours().toString().padStart(2, "0"),
    date.getMinutes().toString().padStart(2, "0"),
    date.getSeconds().toString().padStart(2, "0"),
  ];

  return `${parts[0]}-${parts[1]}-${parts[2]} ${parts[3]}:${parts[4]}:${parts[5]}`;
}

function formatFolderTimestamp(date: Date) {
  const parts = [
    date.getFullYear().toString().padStart(4, "0"),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
    date.getHours().toString().padStart(2, "0"),
    date.getMinutes().toString().padStart(2, "0"),
    date.getSeconds().toString().padStart(2, "0"),
  ];

  return `${parts[0]}${parts[1]}${parts[2]}-${parts[3]}${parts[4]}${parts[5]}`;
}

function ensureDirectory(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toStringValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function isTextFile(filePath: string) {
  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function walkDirectory(dirPath: string, output: string[]) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRECTORIES.has(entry.name)) {
        continue;
      }
      walkDirectory(path.join(dirPath, entry.name), output);
      continue;
    }

    const filePath = path.join(dirPath, entry.name);
    if (isTextFile(filePath)) {
      output.push(filePath);
    }
  }
}

function buildPurpose(relativePath: string, content: string) {
  const normalizedPath = relativePath.toLowerCase();
  if (normalizedPath.includes("control-points-master")) {
    return "Documents the consolidated control point inventory.";
  }
  if (normalizedPath.includes("control-points") || normalizedPath.includes("standards")) {
    return "Defines or re-exports control point standards and identifiers.";
  }
  if (normalizedPath.includes("audit-engine") || normalizedPath.includes("audit")) {
    return "Evaluates control points or stores audit result status and evidence.";
  }
  if (normalizedPath.includes("master-design")) {
    return "Maps or renders control point data for the master design review surfaces.";
  }
  if (normalizedPath.includes("dashboard")) {
    return "Displays control point or standards status in a dashboard view.";
  }

  const lowered = content.toLowerCase();
  if (lowered.includes("standardscontrolpoints") || lowered.includes("control_points_master")) {
    return "Stores control point collections or references to the shared registry.";
  }
  if (lowered.includes("audit_reason") || lowered.includes("last_checked_at") || lowered.includes("score")) {
    return "Contains control point audit status, evidence, or scoring data.";
  }
  return "References control point, standards, or audit metadata in project code or docs.";
}

function collectMatchingFiles() {
  const allFiles: string[] = [];
  walkDirectory(ROOT, allFiles);

  const matches = new Map<string, InventoryFileEntry>();

  for (const absolutePath of allFiles) {
    const relativePath = path.relative(ROOT, absolutePath).replace(/\\/g, "/");
    let content = "";
    try {
      content = fs.readFileSync(absolutePath, "utf8");
    } catch {
      continue;
    }

    const normalized = content.toLowerCase();
    const hasSearchMatch = SEARCH_TERMS.some((term) => normalized.includes(term.toLowerCase()));
    const isPreferredTarget = PREFERRED_TARGETS.some((target) => relativePath.endsWith(target));
    if (!hasSearchMatch && !isPreferredTarget) {
      continue;
    }

    matches.set(relativePath, {
      relativePath,
      absolutePath,
      purpose: buildPurpose(relativePath, content),
    });
  }

  return [...matches.values()].sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function addControlPointsFromSource(
  entries: Map<string, ControlPointInventoryEntry>,
  controlPoints: readonly ControlPointLike[],
  sourceFile: string,
) {
  for (const controlPoint of controlPoints) {
    const id = toStringValue(controlPoint.id);
    if (!id) {
      continue;
    }
    const name = toStringValue(controlPoint.title) || toStringValue(controlPoint.name) || "Not explicitly defined";
    const module = toStringValue(controlPoint.category_code) || toStringValue(controlPoint.category) || toStringValue(controlPoint.domain) || "Not explicitly defined";
    const existing = entries.get(id) ?? {
      id,
      name,
      module,
      sourceFiles: new Set<string>(),
    };

    if (existing.name === "Not explicitly defined" && name !== "Not explicitly defined") {
      existing.name = name;
    }
    if (existing.module === "Not explicitly defined" && module !== "Not explicitly defined") {
      existing.module = module;
    }
    existing.sourceFiles.add(sourceFile.replace(/\\/g, "/"));
    entries.set(id, existing);
  }
}

function collectControlPoints() {
  const entries = new Map<string, ControlPointInventoryEntry>();
  addControlPointsFromSource(entries, backendControlPoints as readonly ControlPointLike[], "backend/app/Support/Standards/control-points.ts");
  addControlPointsFromSource(entries, dataControlPoints as readonly ControlPointLike[], "data/standards/control-points.ts");
  addControlPointsFromSource(entries, masterDesignControlPoints as readonly ControlPointLike[], "lib/master-design-control-points.ts");
  addControlPointsFromSource(entries, CONTROL_POINTS_MASTER as readonly ControlPointLike[], "backend/app/Support/Standards/control-points-master.ts");
  return [...entries.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function buildFileInventoryContent(files: readonly InventoryFileEntry[], generatedAt: string) {
  const lines = [
    "CONTROL POINT FILE INVENTORY",
    `Generated at: ${generatedAt}`,
    "",
    `Total files found: ${files.length}`,
    "",
  ];

  files.forEach((file, index) => {
    lines.push(`${index + 1}. ${file.relativePath}`);
    lines.push(`   Absolute path: ${file.absolutePath}`);
    lines.push(`   Purpose: ${file.purpose}`);
    lines.push("");
  });

  return lines.join("\n");
}

function buildControlPointListContent(controlPoints: readonly ControlPointInventoryEntry[], generatedAt: string) {
  const lines = [
    "CONTROL POINT MASTER LIST",
    `Generated at: ${generatedAt}`,
    "",
    `Total control points found: ${controlPoints.length}`,
    "",
  ];

  controlPoints.forEach((entry, index) => {
    lines.push(`${index + 1}. ID: ${entry.id}`);
    lines.push(`   Name: ${entry.name || "Not explicitly defined"}`);
    lines.push(`   Module: ${entry.module || "Not explicitly defined"}`);
    lines.push(`   Source file(s): ${[...entry.sourceFiles].sort().join(", ")}`);
    lines.push("");
  });

  return lines.join("\n");
}

function buildExecutionTimeReport(steps: readonly StepRecord[]) {
  const lines = [
    "# Execution Time Report",
    "",
    "| Step | Start Time | End Time | Duration (seconds) | Status |",
    "|------|------------|----------|-------------------:|--------|",
  ];

  for (const step of steps) {
    lines.push(`| ${step.step} | ${step.startTime} | ${step.endTime} | ${step.durationSeconds.toFixed(2)} | ${step.status} |`);
  }

  lines.push("");
  return lines.join("\n");
}

async function main() {
  ensureDirectory(ARTIFACTS_DIR);

  const startedAt = new Date();
  const artifactFolder = path.join(ARTIFACTS_DIR, `control-point-inventory-${formatFolderTimestamp(startedAt)}`);
  ensureDirectory(artifactFolder);

  const steps: StepRecord[] = [];

  function runStep<T>(stepName: string, action: () => T) {
    const stepStart = new Date();
    let status = "success";
    let result: T;
    try {
      result = action();
    } catch (error) {
      status = `failed: ${error instanceof Error ? error.message : String(error)}`;
      throw error;
    } finally {
      const stepEnd = new Date();
      steps.push({
        step: stepName,
        startTime: stepStart.toISOString(),
        endTime: stepEnd.toISOString(),
        durationSeconds: (stepEnd.getTime() - stepStart.getTime()) / 1000,
        status,
      });
    }
    return result!;
  }

  const generatedAt = formatTimestamp(new Date());
  const files = runStep("Find all files containing control points", () => collectMatchingFiles());
  const controlPoints = runStep("Extract all unique control points", () => collectControlPoints());

  const filesInventoryPath = path.join(artifactFolder, "control-point-files.txt");
  const controlPointListPath = path.join(artifactFolder, "control-points-list.txt");
  const executionTimeReportPath = path.join(artifactFolder, "execution-time-report.md");

  runStep("Generate control-point-files.txt", () => {
    fs.writeFileSync(filesInventoryPath, buildFileInventoryContent(files, generatedAt), "utf8");
  });

  runStep("Generate control-points-list.txt", () => {
    fs.writeFileSync(controlPointListPath, buildControlPointListContent(controlPoints, generatedAt), "utf8");
  });

  runStep("Validate generated outputs", () => {
    const fileInventoryStats = fs.statSync(filesInventoryPath);
    const controlPointStats = fs.statSync(controlPointListPath);
    if (fileInventoryStats.size === 0 || controlPointStats.size === 0) {
      throw new Error("Generated inventory files must be non-empty.");
    }
    if (files.length === 0 || controlPoints.length === 0) {
      throw new Error("Inventory counts must be greater than zero.");
    }
    if (controlPoints.length !== new Set(controlPoints.map((entry) => entry.id)).size) {
      throw new Error("Control point list must be de-duplicated by ID.");
    }
  });

  runStep("Write execution-time-report.md", () => {
    fs.writeFileSync(executionTimeReportPath, buildExecutionTimeReport(steps), "utf8");
  });

  console.log(`ARTIFACT_FOLDER=${artifactFolder}`);
  console.log(`CONTROL_POINT_FILES=${filesInventoryPath}`);
  console.log(`CONTROL_POINTS_LIST=${controlPointListPath}`);
  console.log(`TOTAL_FILES=${files.length}`);
  console.log(`TOTAL_CONTROL_POINTS=${controlPoints.length}`);
}

void main();