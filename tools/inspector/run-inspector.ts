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

type InvoiceRegisterRow = {
  id: number;
  status: string;
  grandTotal?: number;
  grand_total?: number;
  balanceDue?: number;
  balance_due?: number;
  paidTotal?: number;
  paid_total?: number;
  contactName?: string;
  contact?: {
    display_name?: string;
  };
};

type PaymentRegisterRow = {
  id: number;
  amount: number;
  number?: string;
  payment_number?: string;
};

type TrialBalanceRow = {
  code: string;
};

type GeneralLedgerRow = {
  accountCode?: string;
  account_code?: string;
};

type BusinessLogicFacts = {
  hasDraftInvoices: boolean;
  hasOpenReceivables: boolean;
  hasPostedInvoices: boolean;
};

type PdfRouteCheck = {
  findings: string[];
  evidence: string[];
};

async function fetchInspectorData<T>(apiPath: string): Promise<T | null> {
  try {
    const response = await fetch(`${baseUrl}${apiPath}`);
    if (!response.ok) {
      return null;
    }

    const payload = await response.json() as { data?: T };
    return payload.data ?? null;
  } catch {
    return null;
  }
}

async function collectBusinessLogicFindings(routePath: string) {
  const findings: string[] = [];
  const evidence: string[] = [];
  const facts: BusinessLogicFacts = {
    hasDraftInvoices: false,
    hasOpenReceivables: false,
    hasPostedInvoices: false,
  };

  if (["/workspace/invoices/new", "/workspace/user/invoices", "/workspace/user/payments", "/workspace/user/chart-of-accounts"].includes(routePath)) {
    const [invoices, payments, trialBalance, generalLedger] = await Promise.all([
      fetchInspectorData<InvoiceRegisterRow[]>("/api/workspace/reports/invoice-register"),
      fetchInspectorData<PaymentRegisterRow[]>("/api/workspace/reports/payments-register"),
      fetchInspectorData<TrialBalanceRow[]>("/api/workspace/reports/trial-balance"),
      fetchInspectorData<GeneralLedgerRow[]>("/api/workspace/reports/general-ledger"),
    ]);

    if (invoices) {
      facts.hasDraftInvoices = invoices.some((invoice) => invoice.status === "draft");
      facts.hasOpenReceivables = invoices.some((invoice) => invoice.status !== "draft" && Number(invoice.balanceDue ?? invoice.balance_due ?? 0) > 0.05);
      facts.hasPostedInvoices = invoices.some((invoice) => invoice.status !== "draft");

      const invalidInvoice = invoices.find((invoice) => {
        const grandTotal = Number(invoice.grandTotal ?? invoice.grand_total ?? 0);
        const paidTotal = Number(invoice.paidTotal ?? invoice.paid_total ?? 0);
        const balanceDue = Number(invoice.balanceDue ?? invoice.balance_due ?? 0);
        const contactName = invoice.contactName ?? invoice.contact?.display_name ?? "";
        return !contactName || Math.abs((paidTotal + balanceDue) - grandTotal) > 0.05 || balanceDue < 0;
      });
      if (invalidInvoice) {
        findings.push(`Business rule failure: invoice ${invalidInvoice.id} has inconsistent customer or balance totals.`);
      }

      const paidStatusMismatch = invoices.find((invoice) => invoice.status === "paid" && Number(invoice.balanceDue ?? invoice.balance_due ?? 0) > 0.05);
      if (paidStatusMismatch) {
        findings.push(`Business rule failure: invoice ${paidStatusMismatch.id} is marked paid while balance remains open.`);
      }

      evidence.push(`Invoices inspected: ${invoices.length}`);
    }

    if (payments) {
      const invalidPayment = payments.find((payment) => !(payment.number ?? payment.payment_number) || payment.amount <= 0);
      if (invalidPayment) {
        findings.push(`Business rule failure: payment ${invalidPayment.id} is missing a number or positive amount.`);
      }

      evidence.push(`Payments inspected: ${payments.length}`);
    }

    if (payments?.length) {
      if (!trialBalance?.some((row) => row.code === "1210")) {
        findings.push("Workflow break: payments exist but the bank account is missing from trial balance output.");
      }

      if (!generalLedger?.some((row) => (row.accountCode ?? row.account_code) === "1210")) {
        findings.push("Workflow break: payments exist but no bank-account ledger entries were posted.");
      }
    }

    if (facts.hasPostedInvoices) {
      if (!generalLedger?.some((row) => (row.accountCode ?? row.account_code) === "1100")) {
        findings.push("Workflow break: finalized invoices exist but accounts receivable ledger entries were not posted.");
      }

      if (!generalLedger?.some((row) => (row.accountCode ?? row.account_code) === "4100")) {
        findings.push("Workflow break: finalized invoices exist but revenue ledger entries were not posted.");
      }
    }
  }

  return { findings, evidence, facts };
}

async function validateInvoicePdfRoute(): Promise<PdfRouteCheck> {
  const findings: string[] = [];
  const evidence: string[] = [];
  const invoices = await fetchInspectorData<InvoiceRegisterRow[]>("/api/workspace/reports/invoice-register");
  const targetInvoice = invoices?.find((invoice) => invoice.status !== "draft") ?? invoices?.[0];

  if (!targetInvoice) {
    findings.push("Invoice PDF route could not be validated because no invoice row was available.");
    return { findings, evidence };
  }

  try {
    const response = await fetch(`${baseUrl}/workspace/invoices/${targetInvoice.id}/pdf`);
    const contentType = response.headers.get("content-type") ?? "";
    const contentDisposition = response.headers.get("content-disposition") ?? "";
    const payload = await response.arrayBuffer();

    evidence.push(`Invoice PDF route returned ${payload.byteLength} bytes for invoice ${targetInvoice.id}.`);

    if (!response.ok) {
      findings.push(`Invoice PDF route returned ${response.status} for invoice ${targetInvoice.id}.`);
    }

    if (!contentType.toLowerCase().includes("application/pdf")) {
      findings.push(`Invoice PDF route returned the wrong content type: ${contentType || "missing"}.`);
    }

    if (!/attachment|inline/i.test(contentDisposition)) {
      findings.push("Invoice PDF route did not expose a content-disposition header.");
    }

    if (payload.byteLength < 800) {
      findings.push(`Invoice PDF route returned an unexpectedly small payload (${payload.byteLength} bytes).`);
    }
  } catch (error) {
    findings.push(`Invoice PDF route could not be fetched: ${error instanceof Error ? error.message : String(error)}.`);
  }

  return { findings, evidence };
}

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
          ...artifacts.dom.duplicateTopLevelHeadings.map((heading) => `Duplicate top-level heading detected: ${heading}`),
          ...artifacts.dom.duplicateHeaders.map((heading) => `Duplicate heading text detected: ${heading}`),
          ...artifacts.dom.layoutIssues,
          ...artifacts.dom.overflowIssues,
          ...artifacts.dom.wastedSpaceReasons,
        ];
        const architectureFindings: string[] = [];
        const evidence: string[] = [];

        if (artifacts.dom.routeOwner === "catch-all") {
          architectureFindings.push(`Catch-all route usage detected from DOM marker for ${route.path}.`);
          evidence.push("DOM marker reported catch-all ownership.");
        }

        if (codeSignals.usesCatchAll) {
          architectureFindings.push(`No dedicated page file exists for ${route.path}; app/workspace/[...slug]/page.tsx is handling the route.`);
          evidence.push(`Missing direct page file: ${route.directPageFile}`);
        }

        if (route.expectedRegister && artifacts.dom.realRegisterMarkers.length === 0) {
          architectureFindings.push("No real register marker was exposed in the DOM.");
          evidence.push(`Register markers seen: ${artifacts.dom.registerMarkers.join(", ") || "none"}`);
        }

        if (route.expectedWorkflow) {
          if (artifacts.dom.workflowForm !== "invoice") {
            logicFindings.push("Workflow break: transaction form workflow marker is missing from the page.");
          }

          const missingMarkers = (route.requiredWorkflowMarkers ?? []).filter((marker) => !artifacts.dom.workflowMarkers.includes(marker));
          if (missingMarkers.length > 0) {
            logicFindings.push(`Workflow break: missing workflow steps in DOM markers: ${missingMarkers.join(", ")}.`);
          }

          const missingInlineCreate = ["contact", "item"].filter((marker) => !artifacts.dom.inlineCreateMarkers.includes(marker));
          if (missingInlineCreate.length > 0) {
            logicFindings.push(`Dead-end form: inline create is missing for ${missingInlineCreate.join(", ")}.`);
          }
        }

        if (artifacts.dom.fillerMatches.length > 0) {
          architectureFindings.push(`Placeholder markers found in DOM: ${artifacts.dom.fillerMatches.join(", ")}.`);
          evidence.push(`Placeholder markers: ${artifacts.dom.fillerMatches.join(", ")}`);
        }

        if (artifacts.dom.dataMode === "preview") {
          evidence.push("DOM marker reported preview data mode.");
        }

        if (artifacts.dom.splitViewFound) {
          evidence.push("Split-view operating layout detected.");
        }

        if (artifacts.dom.previewSurfaceFound) {
          evidence.push("Preview/detail surface detected alongside the register.");
        }

        if (artifacts.dom.importExportFound) {
          evidence.push("Import/export controls detected.");
        }

        if (artifacts.dom.createTargets.length > 0) {
          evidence.push(`Create targets: ${artifacts.dom.createTargets.join(", ")}`);
        }

        if (route.expectedRegister && !artifacts.dom.tableFound && !codeSignals.usesCatchAll) {
          uiFindings.push("Expected register table is missing.");
          uiFindings.push("No real register was detected for an expected register route.");
        }

        if (route.expectedRegister && !artifacts.dom.rowClickableFound) {
          uiFindings.push("Register rows are not exposed as clickable operating surfaces.");
        }

        if (route.expectedRegister && !artifacts.dom.previewSurfaceFound) {
          uiFindings.push("Register context is lost because no split preview surface was detected.");
        }

        if (route.expectedRegister && !artifacts.dom.splitViewFound) {
          visualFindings.push("Register does not expose a split-view operating layout.");
        }

        if (route.expectedRegister && artifacts.dom.splitViewFound && artifacts.dom.previewSurfaceFound && artifacts.dom.splitViewSideBySide === false) {
          visualFindings.push("Split view collapses vertically on a large desktop viewport instead of keeping the register and preview side by side.");
        }

        if (route.expectedRegister && !artifacts.dom.importExportFound) {
          uiFindings.push("Import/export controls are missing from the register surface.");
        }

        if (route.path === "/workspace/user/invoices" && artifacts.dom.qrInsideRegister) {
          logicFindings.push("Invoice register exposes a ZATCA/QR element inside the register table instead of the document view.");
        }

        if (route.requiredCreateHrefIncludes?.length) {
          const missingCreateTargets = route.requiredCreateHrefIncludes.filter((requiredTarget) => !artifacts.dom.createTargets.some((target) => target.includes(requiredTarget)));
          if (missingCreateTargets.length > 0) {
            logicFindings.push(`Create action routes to the wrong target. Missing create target fragments: ${missingCreateTargets.join(", ")}.`);
          }
        }

        if (route.path === "/workspace/user/document-templates" && artifacts.dom.guidanceCount > 0) {
          visualFindings.push("Template engine still renders guidance-heavy notices instead of a direct editing surface.");
        }

        if (artifacts.dom.filtersFound === false && route.path === "/workspace/user/invoices") {
          uiFindings.push("Invoice register filters are missing.");
        }

        const requiresCreateAction = route.createActionLabels.length > 0;
        const hasExpectedCreateAction =
          route.createActionLabels.some((label) => artifacts.dom.actionsFound.some((action) => action.toLowerCase().includes(label.toLowerCase()))) ||
          artifacts.dom.actionsFound.some((action) => /create|add|record|new|capture/i.test(action));

        if (requiresCreateAction && !hasExpectedCreateAction) {
          uiFindings.push("No visible create action was found in the inspected route content.");
        }

        if (artifacts.networkFailures.length > 0) {
          logicFindings.push(...artifacts.networkFailures.map((failure) => `${failure.method} ${failure.url} returned ${failure.status}.`));
        }

        const repeatedDocumentCalls = artifacts.apiCallTallies.filter((entry) => entry.url.includes("/api/workspace/documents/") && entry.count > 2);
        const repeatedTemplatePreviewCalls = artifacts.apiCallTallies.filter((entry) => entry.url.includes("/api/workspace/templates/preview") && entry.count > 2);

        if (repeatedDocumentCalls.length > 0) {
          logicFindings.push(...repeatedDocumentCalls.map((entry) => `Preview loop risk: ${entry.method} ${entry.url} was requested ${entry.count} times during the initial settle window.`));
        }

        if (route.path === "/workspace/user/document-templates" && repeatedTemplatePreviewCalls.length > 0) {
          logicFindings.push(...repeatedTemplatePreviewCalls.map((entry) => `Template preview churn: ${entry.method} ${entry.url} was requested ${entry.count} times during initial load.`));
        }

        if (artifacts.dom.deadLinkCandidates.length > 0) {
          logicFindings.push(...artifacts.dom.deadLinkCandidates.map((candidate) => `Dead link candidate detected: ${candidate}.`));
        }

        const businessChecks = await collectBusinessLogicFindings(route.path);
        logicFindings.push(...businessChecks.findings);
        evidence.push(...businessChecks.evidence);

        if (route.path === "/workspace/user/invoices" && businessChecks.facts.hasDraftInvoices) {
          const hasIssueAction = [...artifacts.dom.actionsFound, ...artifacts.dom.previewActionsFound].some((action) => /issue/i.test(action));
          const hasEditAction = [...artifacts.dom.actionsFound, ...artifacts.dom.previewActionsFound].some((action) => /edit/i.test(action));

          if (!hasIssueAction) {
            logicFindings.push("Invoice lifecycle break: draft invoices exist but no visible issue action was detected.");
          }

          if (!hasEditAction) {
            logicFindings.push("Invoice lifecycle break: draft invoices exist but no visible edit action was detected.");
          }
        }

        if (route.path === "/workspace/user/invoices" && businessChecks.facts.hasOpenReceivables) {
          const hasPaymentAction = [...artifacts.dom.actionsFound, ...artifacts.dom.previewActionsFound].some((action) => /payment/i.test(action));

          if (!hasPaymentAction) {
            logicFindings.push("Invoice lifecycle break: open receivables exist but no visible payment action was detected.");
          }
        }

        if (route.path === "/workspace/user/invoices" && businessChecks.facts.hasPostedInvoices) {
          const hasDownloadAction = [...artifacts.dom.actionsFound, ...artifacts.dom.previewActionsFound].some((action) => /download/i.test(action));

          if (!hasDownloadAction) {
            logicFindings.push("Invoice lifecycle break: issued invoices exist but no visible download action was detected.");
          }

          const pdfRouteCheck = await validateInvoicePdfRoute();
          logicFindings.push(...pdfRouteCheck.findings);
          evidence.push(...pdfRouteCheck.evidence);
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
  uiFindings: string[];
  logicFindings: string[];
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

  if (input.logicFindings.length > 0) {
    return "FAIL" as const;
  }

  if (input.uiFindings.some((finding) => /Expected register table is missing|No visible create action/i.test(finding))) {
    return "FAIL" as const;
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