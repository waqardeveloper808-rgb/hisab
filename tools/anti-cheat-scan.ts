import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const artifactRoot = process.env.ARTIFACT_DIR ?? path.join(repoRoot, "artifacts", "system_recovery_manual");
const outputFile = path.join(artifactRoot, "reports", process.env.ANTI_CHEAT_OUTPUT ?? "anti_cheat_scan_after.json");

const roots = [
  "backend/app",
  "backend/routes",
  "backend/tests",
  "app",
  "components",
  "lib",
  "data",
  "tools",
];

const rules = [
  { code: "EMPTY_CATCH_ARROW", pattern: /\.catch\s*\(\s*\(\)\s*=>\s*\{\s*\}\s*\)/g, message: "Empty promise catch block" },
  { code: "EMPTY_CATCH_BLOCK", pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g, message: "Empty catch block" },
  { code: "BACKEND_READY_FALSE", pattern: /backendReady\s*:\s*false/g, message: "Static backendReady false flag" },
  { code: "EMPTY_ARRAY_RETURN", pattern: /return\s+\[\]\s*;|return\s+\[\]\s+as\s+/g, message: "Potential empty-array failure fallback" },
  { code: "SESSION_FALLBACK", pattern: /Workspace session is required|Authenticated backend workspace access is required for this core flow/g, message: "Session fallback banner string" },
];

async function walk(dir: string, files: string[]) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "vendor") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, files);
      continue;
    }

    if (/\.(ts|tsx|js|mjs|php|json|md)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
}

async function main() {
  const files: string[] = [];
  for (const root of roots) {
    const full = path.join(repoRoot, root);
    try {
      await walk(full, files);
    } catch {
      // Ignore missing roots.
    }
  }

  const findings: Array<Record<string, unknown>> = [];

  for (const file of files) {
    const source = await fs.readFile(file, "utf8");
    for (const rule of rules) {
      const matches = [...source.matchAll(rule.pattern)];
      for (const match of matches) {
        const index = match.index ?? 0;
        const line = source.slice(0, index).split(/\r?\n/).length;
        findings.push({
          code: rule.code,
          message: rule.message,
          file: path.relative(repoRoot, file).replace(/\\/g, "/"),
          line,
          sample: match[0],
        });
      }
    }
  }

  const report = {
    generated_at: new Date().toISOString(),
    total_findings: findings.length,
    findings,
  };

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

void main();
