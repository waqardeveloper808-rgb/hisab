import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const backendDir = path.join(repoRoot, "backend");
const artifactRoot = process.env.ARTIFACT_DIR ?? path.join(repoRoot, "artifacts", "system_recovery_manual");
const reportPath = path.join(artifactRoot, "reports", "data_counts_after.json");
const dbProofDir = path.join(artifactRoot, "db_proofs");
const companyId = Number(process.env.COMPANY_ID ?? process.env.GULF_HISAB_COMPANY_ID ?? 2);

async function main() {
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.mkdir(dbProofDir, { recursive: true });

  const raw = execFileSync("php", ["db_count_proof.php"], {
    cwd: backendDir,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 8,
    env: {
      ...process.env,
      COMPANY_ID: String(companyId),
    },
  });

  await fs.writeFile(reportPath, `${raw.trim()}\n`, "utf8");
  await fs.writeFile(path.join(dbProofDir, "data_counts_after.raw.json"), `${raw.trim()}\n`, "utf8");
  process.stdout.write(raw.trim());
}

void main();
