import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { inspectRoutePage } from "./page-rules";
import { writeCombinedReports, writeRouteReport } from "./report-writer";
import { buildRootCauseAnalysis } from "./root-cause";
import { getRouteCodeSignals, inspectedRoutes, slugifyRoute, type RouteReport } from "./route-catalog";
import { runZatcaCheck } from "./zatca-check";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..", "..");
const reportsDir = path.join(__dirname, "reports");
const screenshotsDir = path.join(__dirname, "screenshots");
const baseUrl = process.env.INSPECTOR_BASE_URL ?? "http://localhost:3000";

async function main() {
  await mkdir(reportsDir, { recursive: true });
  await mkdir(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: baseUrl, viewport: { width: 1440, height: 1080 } });
  const reports: RouteReport[] = [];

  try {
    for (const route of inspectedRoutes) {
      const page = await context.newPage();
      const codeSignals = getRouteCodeSignals(workspaceRoot, route);
      const screenshotPath = path.join(screenshotsDir, `${slugifyRoute(route.path)}.png`);

      try {
        const artifacts = await inspectRoutePage(page, context, baseUrl, route);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        const uiFindings = [...artifacts.dom.emptyStateTexts.map((text) => `Empty/loading state text: ${text}`)];
        const logicFindings = [...artifacts.linkFindings];
        const visualFindings = [
          ...artifacts.dom.duplicateHeaders.map((heading) => `Duplicate heading text detected: ${heading}`),
          ...artifacts.dom.layoutIssues,
          ...artifacts.dom.overflowIssues,
          ...artifacts.dom.wastedSpaceReasons,
        ];
        const architectureFindings: string[] = [];
        const evidence: string[] = [];

        if (codeSignals.usesCatchAll) {
          architectureFindings.push(`No dedicated page file exists for ${route.path}; app/workspace/[...slug]/page.tsx is handling the route.`);
          evidence.push(`Missing direct page file: ${route.directPageFile}`);
        }

        if (artifacts.dom.fillerMatches.length > 0) {
          architectureFindings.push(`Placeholder markers found in DOM: ${artifacts.dom.fillerMatches.join(", ")}.`);
          evidence.push(`Placeholder markers: ${artifacts.dom.fillerMatches.join(", ")}`);
        }

        if (route.expectedRegister && !artifacts.dom.tableFound && !codeSignals.usesCatchAll) {
          uiFindings.push("Expected register table is missing.");
        }

        if (artifacts.dom.filtersFound === false && route.path === "/workspace/user/invoices") {
          uiFindings.push("Invoice register filters are missing.");
        }

        if (artifacts.dom.actionsFound.some((action) => /create|add|record/i.test(action)) === false) {
          uiFindings.push("No visible create action was found in the inspected route content.");
        }

        if (artifacts.networkFailures.length > 0) {
          logicFindings.push(...artifacts.networkFailures.map((failure) => `${failure.method} ${failure.url} returned ${failure.status}.`));
        }

        if (artifacts.dom.deadLinkCandidates.length > 0) {
          logicFindings.push(...artifacts.dom.deadLinkCandidates.map((candidate) => `Dead link candidate detected: ${candidate}.`));
        }

        const zatcaResult = await runZatcaCheck(page, context, baseUrl, route, screenshotsDir);
        const report = buildInitialReport({
          route: route.path,
          tableFound: artifacts.dom.tableFound,
          rowCount: artifacts.dom.rowCount,
          filtersFound: artifacts.dom.filtersFound,
          actionsFound: artifacts.dom.actionsFound,
          fillerTextFound: artifacts.dom.fillerMatches.length > 0,
          networkFailures: artifacts.networkFailures,
          uiFindings,
          logicFindings,
          visualFindings,
          architectureFindings,
          screenshotPath,
          apiCalls: artifacts.apiCalls,
          evidence,
          zatcaStatus: zatcaResult.status,
          zatcaDetails: zatcaResult.details,
        });

        const rootCause = buildRootCauseAnalysis(report);
        report.five_whys = rootCause.fiveWhys;
        report.root_cause_summary = rootCause.summary;
        report.recommended_fixes = rootCause.recommendedFixes;

        reports.push(report);
        await writeRouteReport(reportsDir, report);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const fallback: RouteReport = {
          route: route.path,
          verdict: "FAIL",
          table_found: false,
          row_count: 0,
          filters_found: false,
          actions_found: [],
          filler_text_found: false,
          network_failures: [],
          ui_findings: ["Inspector could not evaluate the route."],
          logic_findings: [message],
          visual_findings: [],
          architecture_findings: [],
          zatca_check: "NOT_AVAILABLE",
          five_whys: { analyses: [] },
          root_cause_summary: "Inspector execution failed before route evidence could be collected.",
          recommended_fixes: ["Stabilize the route or inspector runtime and rerun the inspection."],
          screenshot_path: screenshotPath,
          api_calls: [],
          evidence: [message],
        };

        reports.push(fallback);
        await writeRouteReport(reportsDir, fallback);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  await writeCombinedReports(reportsDir, reports);

  const failCount = reports.filter((report) => report.verdict === "FAIL").length;
  const placeholderCount = reports.filter((report) => report.verdict === "PLACEHOLDER").length;
  const authLimitedCount = reports.filter((report) => report.verdict === "AUTH_LIMITED").length;

  console.log(JSON.stringify({
    reportsDir,
    screenshotsDir,
    failCount,
    placeholderCount,
    authLimitedCount,
  }, null, 2));
}

function buildInitialReport(input: {
  route: string;
  tableFound: boolean;
  rowCount: number;
  filtersFound: boolean;
  actionsFound: string[];
  fillerTextFound: boolean;
  networkFailures: RouteReport["network_failures"];
  uiFindings: string[];
  logicFindings: string[];
  visualFindings: string[];
  architectureFindings: string[];
  screenshotPath: string;
  apiCalls: RouteReport["api_calls"];
  evidence: string[];
  zatcaStatus: RouteReport["zatca_check"];
  zatcaDetails?: RouteReport["zatca_details"];
}): RouteReport {
  const verdict = determineVerdict(input);

  return {
    route: input.route,
    verdict,
    table_found: input.tableFound,
    row_count: input.rowCount,
    filters_found: input.filtersFound,
    actions_found: input.actionsFound,
    filler_text_found: input.fillerTextFound,
    network_failures: input.networkFailures,
    ui_findings: dedupe(input.uiFindings),
    logic_findings: dedupe(input.logicFindings),
    visual_findings: dedupe(input.visualFindings),
    architecture_findings: dedupe(input.architectureFindings),
    zatca_check: input.zatcaStatus,
    five_whys: { analyses: [] },
    root_cause_summary: "",
    recommended_fixes: [],
    screenshot_path: input.screenshotPath,
    api_calls: input.apiCalls,
    evidence: dedupe(input.evidence),
    zatca_details: input.zatcaDetails,
  };
}

function determineVerdict(input: {
  tableFound: boolean;
  rowCount: number;
  fillerTextFound: boolean;
  networkFailures: RouteReport["network_failures"];
  visualFindings: string[];
  architectureFindings: string[];
}) {
  if (input.fillerTextFound || input.architectureFindings.some((finding) => /catch-all|placeholder/i.test(finding))) {
    return "PLACEHOLDER" as const;
  }

  if (input.visualFindings.some((finding) => /Document renders \d+ H1|Duplicate heading/i.test(finding))) {
    return "FAIL" as const;
  }

  if (input.networkFailures.some((failure) => failure.status === 401)) {
    return "AUTH_LIMITED" as const;
  }

  if (input.tableFound && input.rowCount === 0) {
    return "EMPTY_VALID" as const;
  }

  return input.networkFailures.length > 0 ? "FAIL" as const : "PASS" as const;
}

function dedupe(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});