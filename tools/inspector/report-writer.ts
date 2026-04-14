import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RouteReport } from "./route-catalog";

export async function writeRouteReport(reportsDir: string, report: RouteReport) {
  await mkdir(reportsDir, { recursive: true });
  const filePath = path.join(reportsDir, `${report.route.replace(/^\//, "").replace(/[\/]+/g, "-")}.json`);
  await writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return filePath;
}

export async function writeCombinedReports(reportsDir: string, reports: RouteReport[]) {
  await mkdir(reportsDir, { recursive: true });

  const combined = {
    generated_at: new Date().toISOString(),
    totals: {
      routes: reports.length,
      pass: reports.filter((report) => report.verdict === "PASS").length,
      fail: reports.filter((report) => report.verdict === "FAIL").length,
      auth_limited: reports.filter((report) => report.verdict === "AUTH_LIMITED").length,
      placeholder: reports.filter((report) => report.verdict === "PLACEHOLDER").length,
      empty_valid: reports.filter((report) => report.verdict === "EMPTY_VALID").length,
    },
    reports,
  };

  const jsonPath = path.join(reportsDir, "combined-summary.json");
  await writeFile(jsonPath, `${JSON.stringify(combined, null, 2)}\n`, "utf8");

  const markdownLines = [
    "# Workspace Inspector Summary",
    "",
    `Generated: ${combined.generated_at}`,
    "",
    `Routes inspected: ${combined.totals.routes}`,
    `PASS: ${combined.totals.pass}`,
    `FAIL: ${combined.totals.fail}`,
    `AUTH_LIMITED: ${combined.totals.auth_limited}`,
    `PLACEHOLDER: ${combined.totals.placeholder}`,
    `EMPTY_VALID: ${combined.totals.empty_valid}`,
    "",
    "## Route Verdicts",
    "",
    ...reports.map((report) => `- ${report.route}: ${report.verdict} | rows=${report.row_count} | zatca=${report.zatca_check}`),
    "",
    "## Root Cause Highlights",
    "",
    ...reports.map((report) => `- ${report.route}: ${report.root_cause_summary}`),
    "",
  ];

  const markdownPath = path.join(reportsDir, "combined-summary.md");
  await writeFile(markdownPath, `${markdownLines.join("\n")}\n`, "utf8");

  return { jsonPath, markdownPath };
}