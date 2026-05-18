#!/usr/bin/env node
/**
 * Launcher: node tools/proof-template-v2.mjs <artifactRoot> [baseUrl]
 * Runs tools/proof-template-v2-core.ts via tsx.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const artifact = process.argv[2];
const base = process.argv[3] ?? "http://localhost:3000";

if (!artifact) {
  console.error("Usage: node tools/proof-template-v2.mjs <artifactRoot> [baseUrl]");
  process.exit(1);
}

const r = spawnSync(
  "npx",
  ["tsx", join(root, "tools", "proof-template-v2-core.ts"), artifact, base],
  { cwd: root, stdio: "inherit", shell: true, env: process.env },
);

process.exit(typeof r.status === "number" ? r.status : 1);
