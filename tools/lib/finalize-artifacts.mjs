import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ensureRequiredFilesExist, writeText } from "./audit-artifact-writer.mjs";

const execFileAsync = promisify(execFile);

async function runZipPrimary(zipPath, artifactDir) {
  const command = [
    "-NoProfile",
    "-Command",
    `if (Test-Path '${zipPath}') { Remove-Item '${zipPath}' -Force }; Compress-Archive -Path '${path.join(artifactDir, "*")}' -DestinationPath '${zipPath}' -Force`,
  ];
  await execFileAsync("powershell.exe", command, { maxBuffer: 1024 * 1024 * 16 });
  return { method: "Compress-Archive", fallbackUsed: false };
}

async function runZipFallback(zipPath, artifactDir) {
  const parentDir = path.dirname(artifactDir);
  const artifactName = path.basename(artifactDir);
  await execFileAsync("tar.exe", ["-a", "-c", "-f", zipPath, "-C", parentDir, artifactName], {
    maxBuffer: 1024 * 1024 * 16,
  });
  return { method: "tar.exe -a", fallbackUsed: true };
}

async function tryOpenFolder(artifactDir) {
  try {
    await execFileAsync("powershell.exe", ["-NoProfile", "-Command", `Start-Process explorer.exe '${artifactDir}'`], { maxBuffer: 1024 * 1024 });
    return true;
  } catch {
    return false;
  }
}

export async function finalizeArtifacts({ artifactDir, finalLogLines, completionSummary }) {
  await ensureRequiredFilesExist(artifactDir);

  const zipPath = `${artifactDir}.zip`;
  let zipStatus = "FAILED";
  let primaryMethod = "Compress-Archive";
  let fallbackUsed = "no";
  let failureReason = "";

  await writeText(path.join(artifactDir, "execution-log.md"), `${finalLogLines.join("\n")}\n`);
  await writeText(path.join(artifactDir, "completion-summary.md"), completionSummary);

  try {
    const primary = await runZipPrimary(zipPath, artifactDir);
    primaryMethod = primary.method;
    zipStatus = "SUCCESS";
  } catch (primaryError) {
    failureReason = primaryError instanceof Error ? primaryError.message : String(primaryError);
    try {
      const fallback = await runZipFallback(zipPath, artifactDir);
      fallbackUsed = fallback.fallbackUsed ? "yes" : "no";
      primaryMethod = `${primaryMethod} -> ${fallback.method}`;
      zipStatus = "SUCCESS";
      failureReason = failureReason ? `Primary failed: ${failureReason}` : "";
    } catch (fallbackError) {
      fallbackUsed = "yes";
      const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      failureReason = failureReason ? `Primary failed: ${failureReason}; Fallback failed: ${fallbackMessage}` : fallbackMessage;
    }
  }

  const packagingValidation = [
    `artifact_folder_exists: yes`,
    `zip_attempted: yes`,
    `zip_exists: ${await fs.access(zipPath).then(() => "yes").catch(() => "no")}`,
    `completion_summary_exists: ${await fs.access(path.join(artifactDir, "completion-summary.md")).then(() => "yes").catch(() => "no")}`,
    `zip_status_exists: ${await fs.access(path.join(artifactDir, "zip-status.txt")).then(() => "yes").catch(() => "no")}`,
  ].join("\n") + "\n";
  await writeText(path.join(artifactDir, "packaging-validation.txt"), packagingValidation);

  const zipStatusText = [
    `status: ${zipStatus}`,
    `primary_method: ${primaryMethod}`,
    `fallback_used: ${fallbackUsed}`,
    `zip_path: ${zipStatus === "SUCCESS" ? zipPath : ""}`,
    `failure_reason: ${failureReason}`,
    `generated_at: ${new Date().toISOString()}`,
    "",
  ].join("\n");
  await writeText(path.join(artifactDir, "zip-status.txt"), zipStatusText);

  const folderOpened = await tryOpenFolder(artifactDir);

  return {
    zipStatus: zipStatus === "SUCCESS" ? "pass" : "fail",
    zipPath,
    folderOpened,
    failureReason,
  };
}