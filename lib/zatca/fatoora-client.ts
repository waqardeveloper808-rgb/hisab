import { promisify } from "node:util";
import { execFile } from "node:child_process";
import type { ZatcaSandboxResult } from "./types";

const execFileAsync = promisify(execFile);

function replacePlaceholders(command: string, filePath: string) {
  return command
    .replace(/\{xml\}/gi, filePath)
    .replace(/\{pdf\}/gi, filePath);
}

export async function runExternalComplianceCommand(commandTemplate: string, filePath: string): Promise<ZatcaSandboxResult> {
  if (!commandTemplate.trim()) {
    return { status: "blocked", blockers: ["command-missing"] };
  }

  const command = replacePlaceholders(commandTemplate, filePath);
  try {
    const { stdout, stderr } = await execFileAsync("cmd.exe", ["/d", "/s", "/c", command], {
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    });
    return {
      status: "ready",
      blockers: [],
      command,
      stdout,
      stderr,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "external-command-failed";
    return {
      status: "blocked",
      blockers: [message],
      command,
      stdout: "",
      stderr: message,
    };
  }
}

