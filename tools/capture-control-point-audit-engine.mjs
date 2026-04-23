import path from "node:path";
import process from "node:process";
import { runStableControlPointAudit } from "./run-stable-control-point-audit.mjs";

const stamp = new Date().toISOString();
const timestamp = `${stamp.slice(0, 10).replace(/-/g, "")}_${stamp.slice(11, 19).replace(/:/g, "")}`;

runStableControlPointAudit({
  repoRoot: process.cwd(),
  baseUrl: process.env.BASE_URL ?? "http://127.0.0.1:3006",
  outputDir: process.env.OUTPUT_DIR ?? path.join(process.cwd(), "artifacts", `audit_engine_corrected_${timestamp}`),
})
  .then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  })
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
