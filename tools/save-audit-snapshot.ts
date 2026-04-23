import { writeFileSync } from "fs";
import { evaluateControlPoints } from "../lib/control-point-audit-engine";

const rows = evaluateControlPoints();
const summary = rows.reduce((a, r) => {
  a.total++;
  a[r.result.status.toLowerCase()]++;
  return a;
}, { total: 0, pass: 0, partial: 0, fail: 0, blocked: 0 });

const byModule = {};
rows.forEach((r) => {
  const m = r.controlPoint.module_code;
  if (!byModule[m]) byModule[m] = { pass: 0, partial: 0, fail: 0 };
  byModule[m][r.result.status.toLowerCase()]++;
});

const outPath = process.argv[2] || "artifacts/audit-snapshot.json";
const result = {
  summary,
  by_module: byModule,
  timestamp: new Date().toISOString(),
  run_label: process.argv[3] || "audit",
};

writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(`Audit written to ${outPath}: ${JSON.stringify(summary)}`);
