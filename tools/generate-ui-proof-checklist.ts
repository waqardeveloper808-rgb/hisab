import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const artifactRoot = process.env.ARTIFACT_DIR ?? path.join(repoRoot, "artifacts", "system_recovery_manual");
const outputFile = path.join(artifactRoot, "ui_proofs", "ui-proof-checklist.md");

const pages = [
  ["Invoices", "/workspace/user/invoices"],
  ["Quotations", "/workspace/user/quotations"],
  ["Credit Notes", "/workspace/user/credit-notes"],
  ["Debit Notes", "/workspace/user/debit-notes"],
  ["Bills", "/workspace/user/bills"],
  ["Journal Entries", "/workspace/user/journal-entries"],
  ["Ledger", "/workspace/user/ledger"],
  ["Template List", "/workspace/user/invoice-templates"],
  ["Template Editor", "/workspace/settings/templates"],
  ["Invoice Preview", "/workspace/invoices/new"],
] as const;

async function main() {
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  const content = [
    "# UI Proof Checklist",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "Capture a fresh screenshot or markdown proof note for each page after login and after data refresh.",
    "",
    ...pages.flatMap(([label, href]) => [
      `## ${label}`,
      `- Route: ${href}`,
      "- Confirm page loads without auth/session fallback banner.",
      "- Confirm register is populated for the active company context.",
      "- Confirm create/edit/preview controls are visible when applicable.",
      "- Save screenshot or note path below.",
      "- Evidence:",
      "",
    ]),
  ].join("\n");

  await fs.writeFile(outputFile, `${content}\n`, "utf8");
  process.stdout.write(outputFile);
}

void main();
