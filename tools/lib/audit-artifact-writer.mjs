import fs from "node:fs/promises";
import path from "node:path";

export const REQUIRED_ARTIFACT_FILES = [
  "execution-log.md",
  "completion-summary.md",
  "zip-status.txt",
  "runtime-control-point-results.json",
  "runtime-control-point-results.md",
  "ui-audit-results.json",
  "ui-audit-results.md",
  "merged-audit-results.json",
  "merged-audit-results.md",
  "ui-audit-blockers.json",
  "changed-files.txt",
  "command-output.txt",
  "packaging-validation.txt",
];

export function makeTimestampLabel(date = new Date()) {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
}

export function createArtifactPaths(artifactDir) {
  return {
    root: artifactDir,
    logs: path.join(artifactDir, "logs"),
    reports: path.join(artifactDir, "reports"),
    screenshots: path.join(artifactDir, "screenshots"),
  };
}

export async function ensureArtifactDirectories(paths) {
  await Promise.all(Object.values(paths).map((dir) => fs.mkdir(dir, { recursive: true })));
}

export async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function writeText(filePath, value) {
  await fs.writeFile(filePath, value, "utf8");
}

export async function appendText(filePath, value) {
  await fs.appendFile(filePath, value, "utf8");
}

export async function initializeArtifactFiles(artifactDir, metadata) {
  const initialSummary = [
    "# Completion Summary",
    "",
    "## Objective",
    `- ${metadata.objective}`,
    "",
    "## Status",
    "- Run initialized.",
    "",
    "## What Succeeded",
    "- No stages have completed yet.",
    "",
    "## What Failed",
    "- None yet.",
    "",
    "## Runtime Audit",
    "- pending",
    "",
    "## UI Audit",
    "- pending",
    "",
    "## Packaging",
    "- pending",
    "",
    "## Exact Blocker",
    "- none",
    "",
    "## Next Recommended Step",
    "- Continue execution.",
    "",
  ].join("\n");

  const initialZipStatus = [
    "status: PENDING",
    "primary_method:",
    "fallback_used: no",
    "zip_path:",
    "failure_reason:",
    `generated_at: ${metadata.startedAt}`,
    "",
  ].join("\n");

  const initialLog = [
    "# Execution Log",
    "",
    `- start_time: ${metadata.startedAt}`,
    `- objective: ${metadata.objective}`,
    `- artifact_folder: ${artifactDir}`,
    "- stage_prepare: initialized",
    "",
  ].join("\n");

  await Promise.all(REQUIRED_ARTIFACT_FILES.map(async (name) => {
    const target = path.join(artifactDir, name);
    if (name.endsWith(".json")) {
      await writeJson(target, { status: "pending", reason: "File initialized before collectors ran." });
      return;
    }
    if (name === "completion-summary.md") {
      await writeText(target, initialSummary);
      return;
    }
    if (name === "zip-status.txt") {
      await writeText(target, initialZipStatus);
      return;
    }
    if (name === "execution-log.md") {
      await writeText(target, initialLog);
      return;
    }
    await writeText(target, "initialized\n");
  }));
}

export async function appendExecutionLog(artifactDir, line) {
  await appendText(path.join(artifactDir, "execution-log.md"), `${line}\n`);
}

export async function appendCommandOutput(artifactDir, line) {
  await appendText(path.join(artifactDir, "command-output.txt"), `${line}\n`);
}

export async function ensureRequiredFilesExist(artifactDir) {
  for (const name of REQUIRED_ARTIFACT_FILES) {
    const target = path.join(artifactDir, name);
    try {
      await fs.access(target);
    } catch {
      if (name.endsWith(".json")) {
        await writeJson(target, { status: "missing-created-late", reason: "File was missing and created during finalization." });
      } else {
        await writeText(target, "created during finalization\n");
      }
    }
  }
}