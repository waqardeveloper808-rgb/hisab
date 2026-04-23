import fs from "node:fs";
import path from "node:path";

import { standardsControlPoints as backendControlPoints } from "../backend/app/Support/Standards/control-points";
import { standardsControlPoints as registryControlPoints } from "../backend/app/Support/Standards/control-point-registry";
import { CONTROL_POINTS_MASTER } from "../backend/app/Support/Standards/control-points-master";
import { standardsControlPoints as dataControlPoints } from "../data/standards/control-points";
import { masterDesignControlPoints } from "../lib/master-design-control-points";

type ControlPointLike = Record<string, unknown>;
type SourceRole = "canonical" | "compatibility" | "derived";
type DuplicateType = "exact duplicate" | "compatibility duplicate" | "derived duplicate" | "conflicting duplicate" | "unique";

type ExtractedEntry = {
  extractedIndex: number;
  sourceFile: string;
  sourceCollection: string;
  sourceRole: SourceRole;
  controlPoint: ControlPointLike;
  controlPointId: string;
  categoryCode: string;
  title: string;
  contentHash: string;
  comparableHash: string;
};

type IdGroup = {
  id: string;
  entries: ExtractedEntry[];
};

type ReviewFlags = {
  missingFields: boolean;
  conflictingWording: boolean;
  likelyWeak: boolean;
  likelyDuplicateOnly: boolean;
};

type StepTiming = {
  step: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  elapsedSeconds: number;
  estimatedRemainingSeconds: number;
};

const ROOT = process.cwd();
const STANDARDS_DIR = path.join(ROOT, "backend", "app", "Support", "Standards");
const ARTIFACTS_DIR = path.join(ROOT, "artifacts");
const TOTAL_STEPS = 7;
const CATEGORY_ORDER = ["ACC", "INV", "VAT", "DOC", "TMP", "UIX", "FRM", "VAL", "SEC", "BRD", "XMD"] as const;
const REVIEW_FIELDS = ["category", "title", "purpose", "rule", "condition", "expected_behavior", "pass_criteria", "fail_criteria"] as const;
const REQUIRED_FIELDS = [
  "id",
  "category",
  "domain",
  "title",
  "purpose",
  "rule",
  "condition",
  "expected_behavior",
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
] as const;

const SOURCE_DEFINITIONS = [
  {
    sourceFile: "C:\\hisab\\backend\\app\\Support\\Standards\\control-points.ts",
    sourceCollection: "standardsControlPoints",
    sourceRole: "canonical" as const,
    controlPoints: backendControlPoints as readonly ControlPointLike[],
  },
  {
    sourceFile: "C:\\hisab\\backend\\app\\Support\\Standards\\control-point-registry.ts",
    sourceCollection: "standardsControlPoints",
    sourceRole: "compatibility" as const,
    controlPoints: registryControlPoints as readonly ControlPointLike[],
  },
  {
    sourceFile: "C:\\hisab\\data\\standards\\control-points.ts",
    sourceCollection: "standardsControlPoints",
    sourceRole: "compatibility" as const,
    controlPoints: dataControlPoints as readonly ControlPointLike[],
  },
  {
    sourceFile: "C:\\hisab\\lib\\master-design-control-points.ts",
    sourceCollection: "masterDesignControlPoints",
    sourceRole: "derived" as const,
    controlPoints: masterDesignControlPoints as readonly ControlPointLike[],
  },
  {
    sourceFile: "C:\\hisab\\backend\\app\\Support\\Standards\\control-points-master.ts",
    sourceCollection: "CONTROL_POINTS_MASTER",
    sourceRole: "derived" as const,
    controlPoints: CONTROL_POINTS_MASTER as readonly ControlPointLike[],
  },
] as const;

const MASTER_MARKDOWN_PATH = path.join(STANDARDS_DIR, "control-points-master.md");
const SUMMARY_MARKDOWN_PATH = path.join(STANDARDS_DIR, "control-points-summary.md");

const sourceMapPath = path.join(STANDARDS_DIR, "control-points-source-map.md");
const uniqueIdInventoryPath = path.join(STANDARDS_DIR, "control-points-unique-id-inventory.md");
const canonicalReviewPath = path.join(STANDARDS_DIR, "control-points-canonical-review.md");
const normalizationSummaryPath = path.join(STANDARDS_DIR, "control-points-normalization-summary.md");
const conflictsPath = path.join(STANDARDS_DIR, "control-points-conflicts.md");
const executionLogPath = path.join(STANDARDS_DIR, "execution-log.md");
const executionTimeReportPath = path.join(STANDARDS_DIR, "execution-time-report.md");
const blockersPath = path.join(STANDARDS_DIR, "blockers.md");

function ensureDirectory(directoryPath: string) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

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

function writeFile(filePath: string, content: string) {
  fs.writeFileSync(filePath, content, "utf8");
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

  return JSON.stringify(value);
}

function toArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function escapeCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`).join(",")}}`;
  }

  return JSON.stringify(value);
}

function simpleHash(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function comparableControlPoint(controlPoint: ControlPointLike) {
  const comparable: ControlPointLike = {};
  for (const key of Object.keys(controlPoint).sort()) {
    if (["state", "checked_items", "evidence", "score", "last_checked_at", "audit_reason"].includes(key)) {
      continue;
    }
    comparable[key] = controlPoint[key];
  }
  return comparable;
}

function collectExtractedEntries() {
  const entries: ExtractedEntry[] = [];
  let extractedIndex = 1;

  for (const definition of SOURCE_DEFINITIONS) {
    for (const controlPoint of definition.controlPoints) {
      const controlPointId = toStringValue(controlPoint.id);
      const categoryCode = toStringValue(controlPoint.category_code);
      const title = toStringValue(controlPoint.title);
      entries.push({
        extractedIndex,
        sourceFile: definition.sourceFile,
        sourceCollection: definition.sourceCollection,
        sourceRole: definition.sourceRole,
        controlPoint,
        controlPointId,
        categoryCode,
        title,
        contentHash: simpleHash(stableStringify(controlPoint)),
        comparableHash: simpleHash(stableStringify(comparableControlPoint(controlPoint))),
      });
      extractedIndex += 1;
    }
  }

  return entries;
}

function groupById(entries: readonly ExtractedEntry[]) {
  const grouped = new Map<string, ExtractedEntry[]>();
  for (const entry of entries) {
    const group = grouped.get(entry.controlPointId) ?? [];
    group.push(entry);
    grouped.set(entry.controlPointId, group);
  }

  return [...grouped.entries()]
    .map(([id, groupEntries]) => ({ id, entries: groupEntries }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function findMissingFields(controlPoint: ControlPointLike) {
  return REQUIRED_FIELDS.filter((field) => {
    const value = controlPoint[field];
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return toStringValue(value).trim().length === 0;
  });
}

function detectConflictFields(entries: readonly ExtractedEntry[]) {
  const conflicts = new Set<string>();

  for (const field of REVIEW_FIELDS) {
    const values = new Set(entries.map((entry) => stableStringify(entry.controlPoint[field])));
    if (values.size > 1) {
      conflicts.add(field);
    }
  }

  const categories = new Set(entries.map((entry) => stableStringify(entry.controlPoint.category_code ?? entry.controlPoint.category)));
  if (categories.size > 1) {
    conflicts.add("category");
  }

  const missingFieldNames = new Set(entries.flatMap((entry) => findMissingFields(entry.controlPoint)));
  if (missingFieldNames.size > 0) {
    conflicts.add("required_fields_missing");
  }

  return [...conflicts];
}

function classifyDuplicateType(entries: readonly ExtractedEntry[], conflictFields: readonly string[]): DuplicateType {
  if (entries.length === 1) {
    return "unique";
  }

  if (conflictFields.length > 0) {
    return "conflicting duplicate";
  }

  if (entries.some((entry) => entry.sourceRole === "derived")) {
    return "derived duplicate";
  }

  if (entries.some((entry) => entry.sourceRole === "compatibility")) {
    return "compatibility duplicate";
  }

  return "exact duplicate";
}

function pickCanonicalCandidate(entries: readonly ExtractedEntry[]) {
  const sourcePriority: Record<SourceRole, number> = {
    canonical: 0,
    compatibility: 1,
    derived: 2,
  };

  return [...entries].sort((left, right) => {
    const missingDifference = findMissingFields(left.controlPoint).length - findMissingFields(right.controlPoint).length;
    if (missingDifference !== 0) {
      return missingDifference;
    }

    const leftFieldCount = Object.keys(left.controlPoint).length;
    const rightFieldCount = Object.keys(right.controlPoint).length;
    if (leftFieldCount !== rightFieldCount) {
      return rightFieldCount - leftFieldCount;
    }

    return sourcePriority[left.sourceRole] - sourcePriority[right.sourceRole];
  })[0];
}

function countReviewFlags(groups: readonly IdGroup[]) {
  const counts = Object.fromEntries(CATEGORY_ORDER.map((category) => [category, 0])) as Record<(typeof CATEGORY_ORDER)[number], number>;

  for (const group of groups) {
    const canonical = pickCanonicalCandidate(group.entries);
    const flags = buildReviewFlags(group.entries);
    if (flags.missingFields || flags.conflictingWording || flags.likelyWeak || flags.likelyDuplicateOnly) {
      const categoryCode = canonical.categoryCode as (typeof CATEGORY_ORDER)[number];
      if (categoryCode in counts) {
        counts[categoryCode] += 1;
      }
    }
  }

  return counts;
}

function buildReviewFlags(entries: readonly ExtractedEntry[]): ReviewFlags {
  const canonical = pickCanonicalCandidate(entries);
  const conflictFields = detectConflictFields(entries);
  const missingFields = findMissingFields(canonical.controlPoint);
  const duplicateType = classifyDuplicateType(entries, conflictFields);

  return {
    missingFields: missingFields.length > 0,
    conflictingWording: conflictFields.some((field) => REVIEW_FIELDS.includes(field as (typeof REVIEW_FIELDS)[number])),
    likelyWeak: missingFields.length > 0 || ["future_ready", "partial"].includes(toStringValue(canonical.controlPoint.implementation_status)),
    likelyDuplicateOnly: entries.length > 1 && duplicateType !== "conflicting duplicate",
  };
}

function buildSourceMap(entries: readonly ExtractedEntry[]) {
  const idCounts = new Map<string, number>();
  const contentHashCounts = new Map<string, number>();
  for (const entry of entries) {
    idCounts.set(entry.controlPointId, (idCounts.get(entry.controlPointId) ?? 0) + 1);
    contentHashCounts.set(entry.contentHash, (contentHashCounts.get(entry.contentHash) ?? 0) + 1);
  }

  return [
    "# Control Points Source Map",
    "",
    `Raw extracted entries: ${entries.length}`,
    "",
    "| extracted_index | control_point_id | title | category | exact source file | source collection name | duplicate by ID | duplicate by full content hash | source class |",
    "|---:|---|---|---|---|---|---|---|---|",
    ...entries.map((entry) =>
      `| ${entry.extractedIndex} | ${escapeCell(entry.controlPointId)} | ${escapeCell(entry.title)} | ${escapeCell(entry.categoryCode)} | ${escapeCell(entry.sourceFile)} | ${escapeCell(entry.sourceCollection)} | ${idCounts.get(entry.controlPointId)! > 1 ? "yes" : "no"} | ${contentHashCounts.get(entry.contentHash)! > 1 ? "yes" : "no"} | ${entry.sourceRole} |`,
    ),
    "",
  ].join("\n");
}

function buildUniqueIdInventory(groups: readonly IdGroup[]) {
  const counts = {
    exact: 0,
    compatibility: 0,
    derived: 0,
    conflicting: 0,
  };

  const lines = [
    "# Control Points Unique ID Inventory",
    "",
    `RAW EXTRACTED TOTAL = ${groups.reduce((total, group) => total + group.entries.length, 0)}`,
    `UNIQUE IDS TOTAL = ${groups.length}`,
  ];

  const duplicateLines: string[] = [];

  for (const group of groups) {
    const conflictFields = detectConflictFields(group.entries);
    const duplicateType = classifyDuplicateType(group.entries, conflictFields);
    if (duplicateType === "exact duplicate") {
      counts.exact += 1;
    }
    if (duplicateType === "compatibility duplicate") {
      counts.compatibility += 1;
    }
    if (duplicateType === "derived duplicate") {
      counts.derived += 1;
    }
    if (duplicateType === "conflicting duplicate") {
      counts.conflicting += 1;
    }

    const canonical = pickCanonicalCandidate(group.entries);
    duplicateLines.push(
      [
        `## ${group.id}`,
        "",
        `- ID: ${group.id}`,
        `- Category: ${canonical.categoryCode}`,
        `- Title: ${canonical.title}`,
        `- Number of occurrences across all sources: ${group.entries.length}`,
        "- List of source files where found:",
        ...[...new Set(group.entries.map((entry) => entry.sourceFile))].map((sourceFile) => `  - ${sourceFile}`),
        `- Duplicate type: ${duplicateType}`,
        "",
      ].join("\n"),
    );
  }

  lines.push(`EXACT DUPLICATE COUNT = ${counts.exact}`);
  lines.push(`COMPATIBILITY DUPLICATE COUNT = ${counts.compatibility}`);
  lines.push(`DERIVED DUPLICATE COUNT = ${counts.derived}`);
  lines.push(`CONFLICTING DUPLICATE COUNT = ${counts.conflicting}`);
  lines.push("");
  lines.push(...duplicateLines);

  return {
    markdown: lines.join("\n"),
    counts,
  };
}

function buildCanonicalReview(groups: readonly IdGroup[]) {
  return [
    "# Control Points Canonical Review",
    "",
    ...groups.map((group) => {
      const canonical = pickCanonicalCandidate(group.entries);
      const duplicateType = classifyDuplicateType(group.entries, detectConflictFields(group.entries));
      const flags = buildReviewFlags(group.entries);
      const otherOccurrences = group.entries.filter((entry) => entry !== canonical);

      return [
        "--------------------------------------------------",
        `CONTROL POINT ID: ${group.id}`,
        `CATEGORY: ${canonical.categoryCode}`,
        `TITLE: ${canonical.title}`,
        "",
        "CANONICAL CANDIDATE SOURCE:",
        `- ${canonical.sourceFile}`,
        "",
        "OTHER OCCURRENCES:",
        ...(otherOccurrences.length ? otherOccurrences.map((entry) => `- ${entry.sourceFile}`) : ["- none"]),
        "",
        "DUPLICATE STATUS:",
        `- ${duplicateType.replace(" duplicate", "")}`,
        "",
        "CONTENT SNAPSHOT:",
        `- purpose: ${toStringValue(canonical.controlPoint.purpose)}`,
        `- rule: ${toStringValue(canonical.controlPoint.rule)}`,
        `- condition: ${toStringValue(canonical.controlPoint.condition)}`,
        `- expected_behavior: ${toStringValue(canonical.controlPoint.expected_behavior)}`,
        `- pass_criteria: ${toStringValue(canonical.controlPoint.pass_criteria)}`,
        `- fail_criteria: ${toStringValue(canonical.controlPoint.fail_criteria)}`,
        "",
        "REVIEW FLAGS:",
        `- missing fields? ${flags.missingFields ? "yes" : "no"}`,
        `- conflicting wording? ${flags.conflictingWording ? "yes" : "no"}`,
        `- likely weak? ${flags.likelyWeak ? "yes" : "no"}`,
        `- likely duplicate only? ${flags.likelyDuplicateOnly ? "yes" : "no"}`,
        "",
        "NOTES:",
        `- occurrences: ${group.entries.length}`,
        `- source roles present: ${[...new Set(group.entries.map((entry) => entry.sourceRole))].join(", ")}`,
        `- missing fields in canonical candidate: ${findMissingFields(canonical.controlPoint).join(", ") || "none"}`,
        "--------------------------------------------------",
      ].join("\n");
    }),
  ].join("\n");
}

function buildNormalizationSummary(groups: readonly IdGroup[]) {
  const reviewFlagCounts = countReviewFlags(groups);
  const rows = CATEGORY_ORDER.map((category) => {
    const categoryGroups = groups.filter((group) => pickCanonicalCandidate(group.entries).categoryCode === category);
    const rawExtracted = categoryGroups.reduce((total, group) => total + group.entries.length, 0);
    const conflicting = categoryGroups.filter((group) => classifyDuplicateType(group.entries, detectConflictFields(group.entries)) === "conflicting duplicate").length;
    const exact = categoryGroups.filter((group) => classifyDuplicateType(group.entries, detectConflictFields(group.entries)) === "exact duplicate").length;
    return {
      category,
      rawExtracted,
      uniqueIds: categoryGroups.length,
      exactDuplicates: exact,
      conflictingDuplicates: conflicting,
      reviewFlags: reviewFlagCounts[category],
    };
  });

  const totalRow = {
    rawExtracted: rows.reduce((total, row) => total + row.rawExtracted, 0),
    uniqueIds: rows.reduce((total, row) => total + row.uniqueIds, 0),
    exactDuplicates: rows.reduce((total, row) => total + row.exactDuplicates, 0),
    conflictingDuplicates: rows.reduce((total, row) => total + row.conflictingDuplicates, 0),
    reviewFlags: rows.reduce((total, row) => total + row.reviewFlags, 0),
  };

  return {
    markdown: [
      "# Control Points Normalization Summary",
      "",
      "| Category | Raw Extracted | Unique IDs | Exact Duplicates | Conflicting Duplicates | Review Flags |",
      "|----------|---------------|------------|------------------|------------------------|--------------|",
      ...rows.map((row) => `| ${row.category} | ${row.rawExtracted} | ${row.uniqueIds} | ${row.exactDuplicates} | ${row.conflictingDuplicates} | ${row.reviewFlags} |`),
      `| TOTAL | ${totalRow.rawExtracted} | ${totalRow.uniqueIds} | ${totalRow.exactDuplicates} | ${totalRow.conflictingDuplicates} | ${totalRow.reviewFlags} |`,
      "",
    ].join("\n"),
    rows,
  };
}

function buildConflictReport(groups: readonly IdGroup[]) {
  const conflictGroups = groups
    .map((group) => ({ group, conflictFields: detectConflictFields(group.entries) }))
    .filter(({ conflictFields }) => conflictFields.length > 0);

  if (!conflictGroups.length) {
    return "# Control Points Conflicts\n\nNo conflicting duplicate groups were detected across the reviewed sources.\n";
  }

  return [
    "# Control Points Conflicts",
    "",
    ...conflictGroups.map(({ group, conflictFields }) => {
      const perFieldComparisons = conflictFields.map((field) => {
        if (field === "required_fields_missing") {
          return `- required_fields_missing: ${group.entries.map((entry) => `${entry.sourceFile} => ${findMissingFields(entry.controlPoint).join(", ") || "none"}`).join(" | ")}`;
        }

        return `- ${field}: ${group.entries.map((entry) => `${entry.sourceFile} => ${toStringValue(entry.controlPoint[field]) || "(empty)"}`).join(" | ")}`;
      });

      return [
        `## ${group.id}`,
        `- ID: ${group.id}`,
        "- sources involved:",
        ...group.entries.map((entry) => `  - ${entry.sourceFile}`),
        `- field(s) conflicting: ${conflictFields.join(", ")}`,
        "- short factual comparison:",
        ...perFieldComparisons.map((line) => `  ${line}`),
        "",
      ].join("\n");
    }),
  ].join("\n");
}

function parseMasterMarkdownCount() {
  const content = fs.readFileSync(MASTER_MARKDOWN_PATH, "utf8");
  const matches = content.match(/^### CONTROL POINT:/gm);
  return matches?.length ?? 0;
}

function parseSummaryTotal() {
  const content = fs.readFileSync(SUMMARY_MARKDOWN_PATH, "utf8");
  const match = content.match(/TOTAL CONTROL POINTS:\s*(\d+)/);
  return match ? Number(match[1]) : 0;
}

function buildExecutionTimeReport(stepTimings: readonly StepTiming[]) {
  return [
    "# Execution Time Report",
    "",
    "| Step | Started At | Ended At | Duration (seconds) | Elapsed Time (seconds) | Estimated Remaining Time (seconds) |",
    "|------|------------|----------|-------------------:|-----------------------:|-----------------------------------:|",
    ...stepTimings.map(
      (timing) => `| ${timing.step} | ${timing.startedAt} | ${timing.endedAt} | ${timing.durationSeconds.toFixed(2)} | ${timing.elapsedSeconds.toFixed(2)} | ${timing.estimatedRemainingSeconds.toFixed(2)} |`,
    ),
    "",
    "ETA is an estimate, not exact.",
    "",
  ].join("\n");
}

function buildExecutionLog(stepTimings: readonly StepTiming[], verification: { masterMarkdownCount: number; summaryTotal: number; rawExtractedTotal: number; uniqueIdsTotal: number }) {
  return [
    "# Execution Log",
    "",
    `Raw extracted total analyzed: ${verification.rawExtractedTotal}`,
    `Unique IDs total analyzed: ${verification.uniqueIdsTotal}`,
    `control-points-master.md heading count: ${verification.masterMarkdownCount}`,
    `control-points-summary.md reported total: ${verification.summaryTotal}`,
    "",
    ...stepTimings.flatMap((timing, index) => [
      `## Step ${index + 1}: ${timing.step}`,
      `- Started At: ${timing.startedAt}`,
      `- Ended At: ${timing.endedAt}`,
      `- Duration: ${timing.durationSeconds.toFixed(2)} seconds`,
      `- Elapsed Time: ${timing.elapsedSeconds.toFixed(2)} seconds`,
      `- Estimated Remaining Time: ${timing.estimatedRemainingSeconds.toFixed(2)} seconds`,
      "- ETA is an estimate, not exact.",
      "",
    ]),
  ].join("\n");
}

function buildBlockers(blockers: readonly string[]) {
  return [
    "# Blockers",
    "",
    ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ["- None."]),
    "",
  ].join("\n");
}

async function main() {
  ensureDirectory(STANDARDS_DIR);
  ensureDirectory(ARTIFACTS_DIR);

  const stepTimings: StepTiming[] = [];
  const blockers: string[] = [];
  const processStart = Date.now();

  const entries = collectExtractedEntries();
  const groups = groupById(entries);
  const masterMarkdownCount = parseMasterMarkdownCount();
  const summaryTotal = parseSummaryTotal();

  const context = {
    sourceMap: "",
    inventory: { markdown: "", counts: { exact: 0, compatibility: 0, derived: 0, conflicting: 0 } },
    canonicalReview: "",
    normalizationSummary: { markdown: "", rows: [] as Array<{ category: string; rawExtracted: number; uniqueIds: number; exactDuplicates: number; conflictingDuplicates: number; reviewFlags: number }> },
    conflicts: "",
    artifactPath: "",
  };

  async function runStep(stepNumber: number, stepName: string, action: () => void) {
    const startedAtDate = new Date();
    const startedAt = startedAtDate.toISOString();
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        action();
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        blockers.push(`${stepName} attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const endedAtDate = new Date();
    const endedAt = endedAtDate.toISOString();
    const durationSeconds = (endedAtDate.getTime() - startedAtDate.getTime()) / 1000;
    const elapsedSeconds = (endedAtDate.getTime() - processStart) / 1000;
    const completedSteps = stepTimings.length + 1;
    const averageStepTime = elapsedSeconds / completedSteps;
    const estimatedRemainingSeconds = averageStepTime * (TOTAL_STEPS - completedSteps);

    stepTimings.push({
      step: stepName,
      startedAt,
      endedAt,
      durationSeconds,
      elapsedSeconds,
      estimatedRemainingSeconds,
    });

    console.log("PROGRESS:");
    console.log(`Completed: ${stepNumber} / ${TOTAL_STEPS}`);
    console.log(`Elapsed Time: ${elapsedSeconds.toFixed(2)} seconds`);
    console.log(`Estimated Remaining Time: ${estimatedRemainingSeconds.toFixed(2)} seconds`);
    console.log("ETA is an estimate, not exact.");

    if (lastError) {
      console.log(`Step ${stepName} completed with blocker logging after retry.`);
    }
  }

  await runStep(1, "Build raw source map", () => {
    context.sourceMap = buildSourceMap(entries);
    writeFile(sourceMapPath, context.sourceMap);
  });

  await runStep(2, "Build unique ID inventory", () => {
    context.inventory = buildUniqueIdInventory(groups);
    writeFile(uniqueIdInventoryPath, context.inventory.markdown);
  });

  await runStep(3, "Build canonical review file", () => {
    context.canonicalReview = buildCanonicalReview(groups);
    writeFile(canonicalReviewPath, context.canonicalReview);
  });

  await runStep(4, "Build category normalization summary", () => {
    context.normalizationSummary = buildNormalizationSummary(groups);
    writeFile(normalizationSummaryPath, context.normalizationSummary.markdown);
  });

  await runStep(5, "Build conflict report", () => {
    context.conflicts = buildConflictReport(groups);
    writeFile(conflictsPath, context.conflicts);
  });

  await runStep(6, "Write execution logs", () => {
    writeFile(
      executionTimeReportPath,
      buildExecutionTimeReport(stepTimings),
    );
    writeFile(
      executionLogPath,
      buildExecutionLog(stepTimings, {
        masterMarkdownCount,
        summaryTotal,
        rawExtractedTotal: entries.length,
        uniqueIdsTotal: groups.length,
      }),
    );
    writeFile(blockersPath, buildBlockers(blockers));
  });

  await runStep(7, "Create artifact folder", () => {
    const artifactPath = path.join(ARTIFACTS_DIR, `control_points_normalization_review_${formatTimestamp(new Date())}`);
    ensureDirectory(artifactPath);
    context.artifactPath = artifactPath;

    for (const filePath of [
      sourceMapPath,
      uniqueIdInventoryPath,
      canonicalReviewPath,
      normalizationSummaryPath,
      conflictsPath,
      executionLogPath,
      executionTimeReportPath,
      blockersPath,
    ]) {
      fs.copyFileSync(filePath, path.join(artifactPath, path.basename(filePath)));
    }
  });

  writeFile(
    executionTimeReportPath,
    buildExecutionTimeReport(stepTimings),
  );
  writeFile(
    executionLogPath,
    buildExecutionLog(stepTimings, {
      masterMarkdownCount,
      summaryTotal,
      rawExtractedTotal: entries.length,
      uniqueIdsTotal: groups.length,
    }),
  );
  writeFile(blockersPath, buildBlockers(blockers));

  for (const filePath of [executionLogPath, executionTimeReportPath, blockersPath]) {
    fs.copyFileSync(filePath, path.join(context.artifactPath, path.basename(filePath)));
  }

  const totalExecutionTime = (Date.now() - processStart) / 1000;
  const averageStepTime = totalExecutionTime / TOTAL_STEPS;
  const categorySummaryLines = context.normalizationSummary.rows.map(
    (row) => `| ${row.category} | ${row.rawExtracted} | ${row.uniqueIds} | ${row.reviewFlags} |`,
  );

  console.log("CONTROL POINTS NORMALIZATION REVIEW SUMMARY");
  console.log("");
  console.log(`RAW EXTRACTED TOTAL: ${entries.length}`);
  console.log(`UNIQUE IDS TOTAL: ${groups.length}`);
  console.log(`EXACT DUPLICATES: ${context.inventory.counts.exact}`);
  console.log(`COMPATIBILITY DUPLICATES: ${context.inventory.counts.compatibility}`);
  console.log(`DERIVED DUPLICATES: ${context.inventory.counts.derived}`);
  console.log(`CONFLICTING DUPLICATES: ${context.inventory.counts.conflicting}`);
  console.log("");
  console.log("CATEGORY SUMMARY");
  console.log("| Category | Raw Extracted | Unique IDs | Review Flags |");
  console.log("|----------|---------------|------------|--------------|");
  for (const line of categorySummaryLines) {
    console.log(line);
  }
  console.log("");
  console.log("ARTIFACT FOLDER:");
  console.log(context.artifactPath);
  console.log("");
  console.log("ZIP FILES:");
  console.log("C:\\hisab\\artifacts\\control_points_normalization_review.zip");
  console.log("C:\\hisab\\artifacts\\control_points_normalization_logs.zip");
  console.log("");
  console.log(`TOTAL EXECUTION TIME: ${totalExecutionTime.toFixed(2)} seconds`);
  console.log(`TOTAL STEPS: ${TOTAL_STEPS}`);
  console.log(`AVERAGE STEP TIME: ${averageStepTime.toFixed(2)} seconds`);
}

void main();