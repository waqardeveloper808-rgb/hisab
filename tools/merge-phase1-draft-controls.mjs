/**
 * Merge docs/governance/control-point-appendix-phase1-draft.json into
 * docs/governance/control-point-registry.json (append-only; abort on duplicate id).
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.join(process.cwd());
const registryPath = path.join(root, "docs", "governance", "control-point-registry.json");
const appendixPath = path.join(root, "docs", "governance", "control-point-appendix-phase1-draft.json");

const registryRaw = await readFile(registryPath, "utf8");
const appendixRaw = await readFile(appendixPath, "utf8");

const registry = JSON.parse(registryRaw);
const appendix = JSON.parse(appendixRaw);

if (!Array.isArray(registry.controls) || !Array.isArray(appendix.controls)) {
  console.error("merge-phase1-draft-controls: invalid controls arrays");
  process.exit(1);
}

const ids = new Set(registry.controls.map((c) => c.id));
let added = 0;
for (const c of appendix.controls) {
  if (ids.has(c.id)) {
    console.warn(`merge-phase1-draft-controls: skip already-present id ${c.id}`);
    continue;
  }
  registry.controls.push(c);
  ids.add(c.id);
  added++;
}

await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
console.log(`Merged ${added} appendix controls → ${registryPath}`);
