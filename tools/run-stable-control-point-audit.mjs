import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  appendExecutionLog,
  createArtifactPaths,
  ensureArtifactDirectories,
  initializeArtifactFiles,
  makeTimestampLabel,
  writeJson,
  writeText,
} from "./lib/audit-artifact-writer.mjs";
import { collectRuntimeAudit } from "./lib/audit-runtime-collector.mjs";
import { collectUiAuditOptional } from "./lib/audit-ui-collector.mjs";
import { finalizeArtifacts } from "./lib/finalize-artifacts.mjs";

const execFileAsync = promisify(execFile);

function summarizeMerged(runtimeResult, uiResult) {
  const runtimeSummary = runtimeResult.output?.summary ?? { total: 0, pass: 0, partial: 0, fail: 0, blocked: 0 };
  const overallStatus = runtimeResult.status === "fail"
    ? "blocked"
    : uiResult.status === "fail"
      ? "partial"
      : uiResult.status === "partial" || runtimeResult.status === "partial"
        ? "partial"
        : "full";

  return {
    generatedAt: new Date().toISOString(),
    classification: overallStatus,
    runtime: {
      status: runtimeResult.status,
      summary: runtimeSummary,
      weakModules: runtimeResult.output?.weakModules ?? [],
      criticalFailures: runtimeResult.output?.criticalFailures ?? [],
      error: runtimeResult.error,
    },
    ui: {
      status: uiResult.status,
      blockers: uiResult.blockers,
      pageReachable: uiResult.pageReachable,
      standardsCardVisible: uiResult.standardsCardVisible,
      formStandardsCardVisible: uiResult.formStandardsCardVisible,
      error: uiResult.error,
    },
  };
}

function mergedMarkdown(merged) {
  return [
    "# Merged Audit Results",
    "",
    `- classification: ${merged.classification}`,
    `- runtime_status: ${merged.runtime.status}`,
    `- ui_status: ${merged.ui.status}`,
    `- runtime_pass: ${merged.runtime.summary.pass}`,
    `- runtime_partial: ${merged.runtime.summary.partial}`,
    `- runtime_fail: ${merged.runtime.summary.fail}`,
    `- runtime_blocked: ${merged.runtime.summary.blocked}`,
    "",
    "## UI Blockers",
    ...(merged.ui.blockers.length ? merged.ui.blockers.map((blocker) => `- ${blocker.step}: ${blocker.message}`) : ["- none"]),
    "",
  ].join("\n") + "\n";
}

function completionSummary({ objective, runtimeResult, uiResult, merged, packagingResult, artifactDir }) {
  const blockerLines = [];
  const runtimeSummary = runtimeResult.output?.summary;
  if (runtimeResult.error) {
    blockerLines.push(`- runtime collector: ${runtimeResult.error}`);
  } else if (runtimeResult.status !== "pass" && runtimeSummary) {
    blockerLines.push(`- runtime status ${runtimeResult.status}: pass=${runtimeSummary.pass}, partial=${runtimeSummary.partial}, fail=${runtimeSummary.fail}, blocked=${runtimeSummary.blocked}.`);
  }
  if (uiResult.blockers.length) {
    blockerLines.push(...uiResult.blockers.map((blocker) => `- ${blocker.step}: ${blocker.message}`));
  }
  if (packagingResult.failureReason) {
    blockerLines.push(`- packaging: ${packagingResult.failureReason}`);
  }

  return [
    "# Completion Summary",
    "",
    "## Objective",
    `- ${objective}`,
    "",
    "## What Succeeded",
    `- Runtime audit collector executed and wrote results with status ${runtimeResult.status}.`,
    `- UI audit collector executed and wrote results with status ${uiResult.status}.`,
    `- Merged audit outputs were written to ${artifactDir}.`,
    `- Packaging completed with status ${packagingResult.zipStatus}.`,
    "",
    "## What Failed",
    ...(blockerLines.length ? blockerLines : ["- none"]),
    "",
    "## Runtime Audit",
    `- ${runtimeResult.status}`,
    "",
    "## UI Audit",
    `- ${uiResult.status}`,
    "",
    "## Packaging",
    `- ${packagingResult.zipStatus}`,
    "",
    "## Exact Blocker",
    ...(blockerLines.length ? blockerLines : ["- none"]),
    "",
    "## Next Recommended Step",
    `- Review ${uiResult.status !== "pass" ? "UI blocker records and selector ownership in the Master Design view" : "runtime failures in merged-audit-results.json"}.`,
    `- Re-run the stable command if the underlying blocker is fixed: npm run audit:control-points:stable.`,
    `- Current merged classification: ${merged.classification}.`,
    "",
  ].join("\n");
}

async function captureChangedFiles(repoRoot, artifactDir) {
  try {
    const { stdout } = await execFileAsync("git", ["diff", "--name-only"], {
      cwd: repoRoot,
      maxBuffer: 1024 * 1024 * 8,
    });
    await writeText(path.join(artifactDir, "changed-files.txt"), stdout.trim() ? `${stdout.trim()}\n` : "No unstaged file changes detected.\n");
  } catch (error) {
    await writeText(path.join(artifactDir, "changed-files.txt"), `Unable to read changed files: ${error instanceof Error ? error.message : String(error)}\n`);
  }
}

async function writeStructuredFailure(artifactDir, error) {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  await appendExecutionLog(artifactDir, `- fatal_error: ${message}`);
  await writeText(path.join(artifactDir, "merged-audit-results.md"), `# Merged Audit Results\n\n- classification: blocked\n- fatal_error: ${message}\n`);
  await writeJson(path.join(artifactDir, "merged-audit-results.json"), {
    generatedAt: new Date().toISOString(),
    classification: "blocked",
    fatalError: message,
  });
}

async function overwriteFinalFiles(artifactDir, finalLogLines, finalSummary) {
  await writeText(path.join(artifactDir, "execution-log.md"), `${finalLogLines.join("\n")}\n`);
  await writeText(path.join(artifactDir, "completion-summary.md"), finalSummary);
}

export async function runStableControlPointAudit(options = {}) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const baseUrl = (options.baseUrl ?? process.env.BASE_URL ?? "http://127.0.0.1:3006").trim().replace(/\/$/, "");
  const startedAt = new Date().toISOString();
  const objective = "Execution Stability Layer Hardening control-point audit";
  const artifactDir = path.resolve(options.outputDir ?? process.env.OUTPUT_DIR ?? path.join(repoRoot, "artifacts", `execution_stability_hardening_${makeTimestampLabel()}`));
  const paths = createArtifactPaths(artifactDir);

  await ensureArtifactDirectories(paths);
  await initializeArtifactFiles(artifactDir, { objective, startedAt });

  let runtimeResult = {
    collector: "runtime",
    status: "fail",
    startedAt,
    endedAt: null,
    output: { summary: { total: 0, pass: 0, partial: 0, fail: 0, blocked: 0 }, weakModules: [], criticalFailures: [] },
    error: "runtime collector did not run",
  };
  let uiResult = {
    collector: "ui",
    status: "fail",
    pageReachable: false,
    standardsCardVisible: false,
    formStandardsCardVisible: false,
    fallbackUsed: false,
    retries: 0,
    detailPanelText: "",
    blockers: [],
    startedAt,
    endedAt: null,
    error: "ui collector did not run",
  };
  let merged = null;

  try {
    await appendExecutionLog(artifactDir, `- start_time: ${startedAt}`);
    await appendExecutionLog(artifactDir, `- artifact_folder: ${artifactDir}`);
    await appendExecutionLog(artifactDir, `- stage_prepare_end: ${new Date().toISOString()}`);

    runtimeResult = await collectRuntimeAudit({ artifactDir, repoRoot });
    uiResult = await collectUiAuditOptional({
      artifactDir,
      baseUrl,
      simulateMissingSelector: options.simulateMissingSelector ?? process.env.SIMULATE_MISSING_FORM_STANDARDS === "1",
    });

    merged = summarizeMerged(runtimeResult, uiResult);
    await writeJson(path.join(artifactDir, "merged-audit-results.json"), merged);
    await writeText(path.join(artifactDir, "merged-audit-results.md"), mergedMarkdown(merged));
    await captureChangedFiles(repoRoot, artifactDir);
  } catch (error) {
    await writeStructuredFailure(artifactDir, error);
  } finally {
    const endedAt = new Date().toISOString();
    const currentMerged = merged ?? summarizeMerged(runtimeResult, uiResult);
    const finalLogLines = [
      "# Execution Log",
      "",
      `- start_time: ${startedAt}`,
      `- end_time: ${endedAt}`,
      `- duration_ms: ${new Date(endedAt).getTime() - new Date(startedAt).getTime()}`,
      `- artifact_folder: ${artifactDir}`,
      "- stage_prepare: pass",
      `- stage_collect_runtime: ${runtimeResult.status}`,
      `- stage_collect_ui: ${uiResult.status}`,
      `- stage_summarize: ${currentMerged.classification}`,
      "- stage_finalize: running",
      ...(runtimeResult.output?.summary ? [`- runtime_counts: pass=${runtimeResult.output.summary.pass}, partial=${runtimeResult.output.summary.partial}, fail=${runtimeResult.output.summary.fail}, blocked=${runtimeResult.output.summary.blocked}`] : []),
      ...(uiResult.blockers.length ? uiResult.blockers.map((blocker) => `- blocker: ${blocker.step} -> ${blocker.message}`) : []),
      ...(runtimeResult.error ? [`- runtime_error: ${runtimeResult.error}`] : []),
    ];
    const summary = completionSummary({
      objective,
      runtimeResult,
      uiResult,
      merged: currentMerged,
      packagingResult: { zipStatus: "pending", failureReason: "" },
      artifactDir,
    });
    const packagingResult = await finalizeArtifacts({ artifactDir, finalLogLines, completionSummary: summary });
    const finalSummary = completionSummary({ objective, runtimeResult, uiResult, merged: currentMerged, packagingResult, artifactDir });
    const finalLines = [...finalLogLines, `- stage_finalize: ${packagingResult.zipStatus}`, `- zip_path: ${packagingResult.zipPath}`, `- zip_failure_reason: ${packagingResult.failureReason || "none"}`];
    await overwriteFinalFiles(artifactDir, finalLines, finalSummary);
    return {
      artifactDir,
      zipPath: packagingResult.zipPath,
      runtimeResult,
      uiResult,
      merged: currentMerged,
      packagingResult,
      missingSelectorStillBlockedExecution: false,
    };
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  runStableControlPointAudit()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}