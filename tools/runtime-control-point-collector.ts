void (async () => {
  const { evaluateControlPoints } = await import("@/lib/control-point-audit-engine");
  const { getActualSystemMap } = await import("@/lib/mapping-engine");

  const rows = evaluateControlPoints();
  const map = getActualSystemMap();

  const summary = rows.reduce((acc, row) => {
    acc.total += 1;
    const key = row.result.status.toLowerCase() as "pass" | "partial" | "fail" | "blocked";
    acc[key] += 1;
    return acc;
  }, { total: 0, pass: 0, partial: 0, fail: 0, blocked: 0 });

  const weakModules = Object.values(rows.reduce<Record<string, { module: string; count: number; statuses: Array<{ id: string; status: string; score: number }> }>>((acc, row) => {
    const moduleKey = row.controlPoint.module_code;
    acc[moduleKey] ??= { module: moduleKey, count: 0, statuses: [] };
    if (row.result.status !== "PASS") {
      acc[moduleKey].count += 1;
      acc[moduleKey].statuses.push({
        id: row.controlPoint.id,
        status: row.result.status,
        score: row.result.score,
      });
    }
    return acc;
  }, {})).filter((entry) => entry.count > 0).sort((a, b) => b.count - a.count);

  const criticalFailures = rows
    .filter((row) => row.result.status === "FAIL" || row.result.status === "BLOCKED")
    .map((row) => ({
      id: row.controlPoint.id,
      title: row.controlPoint.title,
      module_code: row.controlPoint.module_code,
      audit_reason: row.result.audit_reason,
      score: row.result.score,
    }));

  const moduleHealthSummary = map.modules.map((module) => ({
    id: module.id,
    status: module.status,
    completionPercentage: module.completionPercentage,
    proofStatus: module.proof.status,
    blockerCount: module.blockers.length,
  }));

  process.stdout.write(`${JSON.stringify({
    generatedAt: new Date().toISOString(),
    summary,
    weakModules,
    criticalFailures,
    moduleHealthSummary,
    rows: rows.map((row) => ({
      controlPoint: {
        id: row.controlPoint.id,
        title: row.controlPoint.title,
        module_code: row.controlPoint.module_code,
        module_name: row.controlPoint.module_name,
      },
      result: row.result,
    })),
  }, null, 2)}\n`);
})().catch((error: unknown) => {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});