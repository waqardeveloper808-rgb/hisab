import { evaluateControlPointExecution, getControlPointExecutionMap, type ControlPointExecutionResult } from "@/backend/app/Support/Standards/control-point-execution";
import { collectControlPointEvidence, getExactRootCauseDetails } from "@/backend/app/Support/Standards/evidence-engine";
import { analyzeRootCause, type FailureType, type RootCauseLayer, type RootCauseProbeType } from "@/backend/app/Support/Audit/root-cause-engine";
import { buildControlPointRiskSummary } from "@/backend/app/Support/Standards/risk-engine";
import { standardsControlPoints, standardsControlPointIds, type StandardsControlPoint } from "@/data/standards/control-points";
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type ControlPointAuditStatus = "PASS" | "FAIL" | "PARTIAL" | "BLOCKED";

export type ControlPointAuditResult = {
  status: ControlPointAuditStatus;
  score: number;
  last_checked_at: string;
  audit_reason: string;
  checked_items: string[];
  evidence: string[];
};

export type ControlPointAuditRecord = {
  controlPointId: string;
  nodeId: string;
  category: StandardsControlPoint["module_name"];
  result: ControlPointAuditResult;
};

export type ControlPointAuditSummary = {
  totalCount: number;
  evaluatedCount: number;
  passCount: number;
  failCount: number;
  partialCount: number;
  blockedCount: number;
  unevaluatedIds: string[];
  systemRiskLevel: "low" | "medium" | "high" | "critical";
  systemRiskScore: number;
  criticalFailureCount: number;
  weakModuleCount: number;
};

export type ControlPointIssueRecord = {
  issue_id: string;
  control_id: string;
  failure_type: FailureType;
  severity: string;
  standard_reference: string;
  module: string;
  root_cause: string;
  affected_files: string[];
  owner: string;
  fix_action: string;
  created_at: string;
  retest_required: boolean;
  retest_status: "pending" | "passed" | "failed";
  evidence_links: string[];
  closed_at: string | null;
};

const auditTimestamp = new Date().toISOString();

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getNodeId(controlPoint: StandardsControlPoint) {
  return `${controlPoint.module_code.toLowerCase()}-${slugify(controlPoint.title)}`;
}

function buildResult(
  status: ControlPointAuditStatus,
  score: number,
  auditReason: string,
  checkedItems: string[],
  evidence: string[],
): ControlPointAuditResult {
  return {
    status,
    score: Math.max(0, Math.min(100, Math.round(score))),
    last_checked_at: auditTimestamp,
    audit_reason: auditReason,
    checked_items: checkedItems,
    evidence,
  };
}

function buildAuditResult(controlPoint: StandardsControlPoint, execution: ControlPointExecutionResult): ControlPointAuditResult {
  const evidenceBundle = collectControlPointEvidence(controlPoint);
  return buildResult(
    execution.status,
    execution.score,
    execution.audit_reason,
    [
      ...execution.checked_items,
      `Execution category: ${evidenceBundle.category}.`,
      `Evaluator key: ${evidenceBundle.evaluatorKey}.`,
    ],
    execution.evidence,
  );
}

export const controlPointExecutionRecords = standardsControlPoints.map((controlPoint) => ({
  controlPoint,
  execution: evaluateControlPointExecution(controlPoint),
}));

export const controlPointRiskSummary = buildControlPointRiskSummary(controlPointExecutionRecords.map((record) => ({
  controlPoint: record.controlPoint,
  result: record.execution,
})));

export const controlPointAuditRecords: ControlPointAuditRecord[] = controlPointExecutionRecords.map((record) => ({
  controlPointId: record.controlPoint.id,
  nodeId: getNodeId(record.controlPoint),
  category: record.controlPoint.module_name,
  result: buildAuditResult(record.controlPoint, record.execution),
}));

export const controlPointAuditResultMap = new Map(controlPointAuditRecords.map((record) => [record.controlPointId, record.result]));

export const controlPointAuditNodeResultMap = new Map(controlPointAuditRecords.map((record) => [record.nodeId, record.result]));

export const controlPointExecutionMap = getControlPointExecutionMap(standardsControlPoints);

export const controlPointAuditSummary: ControlPointAuditSummary = controlPointAuditRecords.reduce<ControlPointAuditSummary>((summary, record) => {
  summary.totalCount += 1;
  summary.evaluatedCount += 1;
  if (record.result.status === "PASS") {
    summary.passCount += 1;
  }
  if (record.result.status === "FAIL") {
    summary.failCount += 1;
  }
  if (record.result.status === "PARTIAL") {
    summary.partialCount += 1;
  }
  if (record.result.status === "BLOCKED") {
    summary.blockedCount += 1;
  }
  return summary;
}, {
  totalCount: 0,
  evaluatedCount: 0,
  passCount: 0,
  failCount: 0,
  partialCount: 0,
  blockedCount: 0,
  unevaluatedIds: standardsControlPointIds.filter((id) => !controlPointAuditRecords.some((record) => record.controlPointId === id)),
  systemRiskLevel: controlPointRiskSummary.system_risk_level,
  systemRiskScore: controlPointRiskSummary.system_risk_score,
  criticalFailureCount: controlPointRiskSummary.critical_failures.length,
  weakModuleCount: controlPointRiskSummary.weak_modules.length,
});

export function getControlPointAuditResult(controlPointId: string) {
  return controlPointAuditResultMap.get(controlPointId) ?? null;
}

export function getControlPointAuditResultByNodeId(nodeId: string) {
  return controlPointAuditNodeResultMap.get(nodeId) ?? null;
}

export function evaluateControlPoints(controlPoints: readonly StandardsControlPoint[] = standardsControlPoints) {
  return controlPoints.map((controlPoint) => ({
    controlPoint,
    result: getControlPointAuditResult(controlPoint.id) ?? buildAuditResult(controlPoint, evaluateControlPointExecution(controlPoint)),
  }));
}

export function getControlPointRootCause(controlPointId: string) {
  const controlPoint = standardsControlPoints.find((candidate) => candidate.id === controlPointId);
  if (!controlPoint) {
    return [] as string[];
  }

  return getExactRootCauseDetails(controlPoint);
}

export function buildControlPointIssueRecord(controlPoint: StandardsControlPoint, execution: ControlPointExecutionResult): ControlPointIssueRecord | null {
  if (execution.status === "PASS") {
    return null;
  }

  const rootCause = analyzeRootCause({
    symptom: execution.audit_reason,
    dependency: controlPoint.linked_files[0] ?? controlPoint.source_standard_document,
    fileHint: controlPoint.linked_files[0] ?? controlPoint.source_standard_document,
    functionHint: controlPoint.evaluation_method,
    businessImpact: controlPoint.nonconformity,
    hasDesignGap: execution.status === "BLOCKED",
    hasImplementationDefect: execution.status === "FAIL",
    hasRuntimeDependencyFailure: execution.status === "PARTIAL",
  });

  return {
    issue_id: `${controlPoint.id}-${execution.status.toLowerCase()}`,
    control_id: controlPoint.id,
    failure_type: rootCause.failure_type,
    severity: controlPoint.risk_priority,
    standard_reference: controlPoint.source_standard_clause,
    module: controlPoint.module_code,
    root_cause: rootCause.immediate_cause,
    affected_files: controlPoint.linked_files,
    owner: controlPoint.control_owner,
    fix_action: rootCause.corrective_action,
    created_at: auditTimestamp,
    retest_required: true,
    retest_status: "pending",
    evidence_links: execution.evidence,
    closed_at: null,
  };
}

export function buildIssuesRegister(controlPoints: readonly StandardsControlPoint[] = standardsControlPoints) {
  return controlPoints
    .map((controlPoint) => {
      const execution = evaluateControlPointExecution(controlPoint);
      return buildControlPointIssueRecord(controlPoint, execution);
    })
    .filter((record): record is ControlPointIssueRecord => record !== null);
}

export type RealAuditEvidence = {
  layer: RootCauseLayer;
  probe_type: RootCauseProbeType;
  db_rows: number;
  api_status: number;
  route_ok: boolean;
  workflow_test_ok: boolean;
  payload_present: boolean;
  workflow_test_name: string;
  route_reference: string;
  failing_target: string;
  db_metric: string;
  expected_schema: string;
  expected_invariant: string;
  evidence_collector: string;
  probable_fix_files: string[];
  details: string[];
};

export type RealAuditRecord = {
  control_point_id: string;
  module: string;
  name: string;
  status: ControlPointAuditStatus;
  score: number;
  evidence: RealAuditEvidence;
  root_cause: string;
  fix_required: boolean;
  expected: string;
};

export type RealAuditReport = {
  generated_at: string;
  summary: {
    total: number;
    pass: number;
    fail: number;
    partial: number;
    blocked: number;
  };
  results: RealAuditRecord[];
};

type RealAuditOptions = {
  artifactRoot?: string;
  backendBaseUrl?: string;
  companyId?: number;
};

type DbCountProof = {
  generated_at: string;
  company_id: number;
  counts: Record<string, number>;
};

type WorkflowCheck = {
  ok: boolean;
  testName: string;
  output: string;
};

type RouteCheckSpec = {
  layer: RootCauseLayer;
  probeType: RootCauseProbeType;
  routeNeedle: string;
  routePath: string;
  method: "GET" | "POST";
  acceptableStatuses: number[];
  workflowTest: string;
  key: string;
  rows: number;
  expectedSchema: string;
  expectedInvariant: string;
  evidenceCollector: string;
  probableFixFiles: string[];
};

function normalizeStatus(score: number, routeOk: boolean, workflowOk: boolean): ControlPointAuditStatus {
  if (!routeOk && !workflowOk && score <= 30) {
    return "FAIL";
  }
  if (!routeOk || !workflowOk || score < 80) {
    return score >= 50 ? "PARTIAL" : "FAIL";
  }
  return "PASS";
}

function metricForModule(module: string, counts: DbCountProof["counts"]): RouteCheckSpec {
  switch (module) {
    case "Invoice":
      return { layer: "api", probeType: "api_probe", key: "invoices", rows: counts.invoices ?? 0, routeNeedle: "Route::post('/sales-documents'", routePath: "/api/companies/2/sales-documents", method: "POST", acceptableStatuses: [401, 403, 422], workflowTest: "SalesTaxInvoiceFlowTest", expectedSchema: "{ success: true, data: [], meta }", expectedInvariant: "Invoice register accepts [] as a valid empty state without rendering a fake outage.", evidenceCollector: "tools/capture-sales-workflow-evidence.mjs", probableFixFiles: ["components/workspace/InvoiceRegister.tsx", "lib/workspace-api.ts"] };
    case "Accounting":
      return { layer: "service", probeType: "invariant_probe", key: "journal_entries", rows: counts.journal_entries ?? 0, routeNeedle: "Route::get('/reports/trial-balance'", routePath: "/api/companies/2/reports/trial-balance", method: "GET", acceptableStatuses: [401, 403, 200], workflowTest: "SalesTaxInvoiceFlowTest", expectedSchema: "{ success: true, data: { trialBalance, ledger, auditTrail } }", expectedInvariant: "Accounting views must handle zero rows as a valid empty ledger state.", evidenceCollector: "tools/prove-accounting-ui-workflow.mjs", probableFixFiles: ["components/workspace/BooksOverview.tsx", "components/workspace/AccountingOverview.tsx", "lib/workspace-api.ts"] };
    case "Inventory":
      return { layer: "database", probeType: "db_probe", key: "inventory_transactions", rows: counts.inventory_transactions ?? 0, routeNeedle: "Route::post('/inventory/sales'", routePath: "/api/companies/2/inventory/sales", method: "POST", acceptableStatuses: [401, 403, 422], workflowTest: "InventoryAccountingWorkflowTest", expectedSchema: "{ success: true, data: [] }", expectedInvariant: "Inventory register must render rows when present and a non-error empty state when absent.", evidenceCollector: "tools/prove-accounting-ui-workflow.mjs", probableFixFiles: ["components/workspace/StockRegister.tsx", "lib/workspace-api.ts"] };
    case "VAT":
      return { layer: "api", probeType: "invariant_probe", key: "vat_related_records", rows: counts.vat_related_records ?? 0, routeNeedle: "Route::get('/reports/vat-summary'", routePath: "/api/companies/2/reports/vat-summary", method: "GET", acceptableStatuses: [401, 403, 200], workflowTest: "SalesTaxInvoiceFlowTest", expectedSchema: "{ success: true, data: { output_vat, input_vat, net_vat_payable } }", expectedInvariant: "VAT zero values must remain valid and must not trigger an error state.", evidenceCollector: "tools/capture-document-validation.mjs", probableFixFiles: ["components/workspace/VatOverview.tsx", "lib/workspace-api.ts"] };
    case "Reports":
      return { layer: "api", probeType: "api_probe", key: "invoices", rows: counts.invoices ?? 0, routeNeedle: "Route::get('/reports/profit-loss'", routePath: "/api/companies/2/reports/profit-loss", method: "GET", acceptableStatuses: [401, 403, 200], workflowTest: "SalesTaxInvoiceFlowTest", expectedSchema: "{ success: true, data }", expectedInvariant: "Report routes must return structured data for the active company.", evidenceCollector: "lib/control-point-audit-engine.ts", probableFixFiles: ["lib/workspace-api.ts"] };
    case "Users":
      return { layer: "route", probeType: "api_probe", key: "companies", rows: counts.companies ?? 0, routeNeedle: "Route::post('/login'", routePath: "/api/auth/login", method: "POST", acceptableStatuses: [422, 401, 200], workflowTest: "SalesTaxInvoiceFlowTest", expectedSchema: "HTTP auth response with structured validation or success envelope", expectedInvariant: "Auth routes must reject invalid input and preserve session flows.", evidenceCollector: "lib/control-point-audit-engine.ts", probableFixFiles: ["app/api", "backend/routes"] };
    case "Audit":
      return { layer: "service", probeType: "api_probe", key: "journal_entries", rows: counts.journal_entries ?? 0, routeNeedle: "Route::get('/health'", routePath: "/api/health", method: "GET", acceptableStatuses: [200], workflowTest: "SalesTaxInvoiceFlowTest", expectedSchema: "HTTP 200 health payload", expectedInvariant: "Audit health route must remain live before interpreting downstream control points.", evidenceCollector: "lib/control-point-audit-engine.ts", probableFixFiles: ["backend/routes", "backend/app"] };
    case "UX":
      return { layer: "ui", probeType: "ui_probe", key: "invoices", rows: counts.invoices ?? 0, routeNeedle: "Route::get('/sales-documents'", routePath: "/api/companies/2/sales-documents", method: "GET", acceptableStatuses: [401, 403, 200], workflowTest: "SalesTaxInvoiceFlowTest", expectedSchema: "UI list state backed by sales document envelope", expectedInvariant: "UI must distinguish loading, auth-limited, empty, and error states.", evidenceCollector: "tools/capture-sales-workflow-evidence.mjs", probableFixFiles: ["components/workspace/InvoiceRegister.tsx", "components/workspace/WorkspaceShell.tsx"] };
    case "Import":
      return { layer: "service", probeType: "api_probe", key: "customers", rows: counts.customers ?? 0, routeNeedle: "Route::post('/contacts'", routePath: "/api/companies/2/contacts", method: "POST", acceptableStatuses: [401, 403, 422], workflowTest: "SalesTaxInvoiceFlowTest", expectedSchema: "Structured contact creation response", expectedInvariant: "Import workflows must reject invalid rows and create valid ones.", evidenceCollector: "tools/run-compliant-master-data-seed.mjs", probableFixFiles: ["lib/workspace-api.ts", "backend/app"] };
    default:
      return { layer: "api", probeType: "api_probe", key: "companies", rows: counts.companies ?? 0, routeNeedle: "Route::post('/login'", routePath: "/api/auth/login", method: "POST", acceptableStatuses: [422, 401, 200], workflowTest: "SalesTaxInvoiceFlowTest", expectedSchema: "Structured response", expectedInvariant: "Module must be backed by a live probe.", evidenceCollector: "lib/control-point-audit-engine.ts", probableFixFiles: [] };
  }
}

async function queryDbCountProof(companyId: number) {
  const { stdout } = await execFileAsync("php", ["db_count_proof.php"], {
    cwd: path.join(process.cwd(), "backend"),
    env: {
      ...process.env,
      COMPANY_ID: String(companyId),
    },
    maxBuffer: 1024 * 1024 * 8,
  });

  return JSON.parse(stdout) as DbCountProof;
}

async function runWorkflowCheck(testName: string): Promise<WorkflowCheck> {
  try {
    const { stdout, stderr } = await execFileAsync("php", ["artisan", "test", "--filter", testName], {
      cwd: path.join(process.cwd(), "backend"),
      env: process.env,
      maxBuffer: 1024 * 1024 * 16,
    });
    const output = `${stdout}${stderr}`.trim();
    return {
      ok: /PASS|OK \(/i.test(output) && !/FAILURES|ERRORS!/i.test(output),
      testName,
      output,
    };
  } catch (error) {
    const output = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      testName,
      output,
    };
  }
}

async function fetchApiStatus(url: string) {
  try {
    const response = await fetch(url, { method: "GET" });
    return response.status;
  } catch {
    return 0;
  }
}

async function executeRouteCheck(baseUrl: string, spec: RouteCheckSpec) {
  const response = await fetch(`${baseUrl}${spec.routePath}`, {
    method: spec.method,
    headers: {
      "Content-Type": "application/json",
    },
    body: spec.method === "POST" ? JSON.stringify({}) : undefined,
  }).catch(() => null);

  if (!response) {
    return { ok: false, status: 0 };
  }

  return {
    ok: spec.acceptableStatuses.includes(response.status),
    status: response.status,
  };
}

function buildRealAuditRecord(controlPoint: { id: string; name: string; module: string; expected: string }, counts: DbCountProof["counts"], routeSpec: RouteCheckSpec, routeCheck: { ok: boolean; status: number }, workflowChecks: Map<string, WorkflowCheck>, apiStatus: number): RealAuditRecord {
  const workflowCheck = workflowChecks.get(routeSpec.workflowTest) ?? {
    ok: false,
    testName: routeSpec.workflowTest,
    output: "Workflow check did not run.",
  };
  const routeOk = routeCheck.ok;
  const dbRows = routeSpec.rows;
  const payloadPresent = routeCheck.status !== 0;
  const score = Math.max(0, Math.min(100, Math.round((routeOk ? 30 : 0) + (workflowCheck.ok ? 40 : 0) + Math.min(dbRows, 6) * 5 + (apiStatus === 200 ? 10 : 0))));
  const status = normalizeStatus(score, routeOk, workflowCheck.ok);
  const rootCause = analyzeRootCause({
    controlPointId: controlPoint.id,
    layer: routeSpec.layer,
    probeType: routeSpec.probeType,
    failingTarget: `${routeSpec.routePath} :: ${routeSpec.key}`,
    probableFixFiles: routeSpec.probableFixFiles,
    apiStatus: routeCheck.status,
    dbRows,
    payloadPresent,
    staleAuditSource: apiStatus !== 200,
    hasImplementationDefect: status === "FAIL",
    hasRuntimeDependencyFailure: !workflowCheck.ok || !routeOk,
    symptom: `${controlPoint.name} returned ${routeCheck.status || "no response"} with workflow ${workflowCheck.ok ? "passing" : "failing"}.`,
    dependency: routeSpec.routePath,
    fileHint: routeSpec.probableFixFiles[0] ?? routeSpec.routePath,
    functionHint: routeSpec.evidenceCollector,
    businessImpact: controlPoint.expected,
  });

  return {
    control_point_id: controlPoint.id,
    module: controlPoint.module,
    name: controlPoint.name,
    status,
    score,
    evidence: {
      layer: routeSpec.layer,
      probe_type: routeSpec.probeType,
      db_rows: dbRows,
      api_status: apiStatus,
      route_ok: routeOk,
      workflow_test_ok: workflowCheck.ok,
      payload_present: payloadPresent,
      workflow_test_name: workflowCheck.testName,
      route_reference: `${routeSpec.routeNeedle} -> ${routeSpec.routePath} [${routeCheck.status}]`,
      failing_target: `${routeSpec.routePath} :: ${routeSpec.key}`,
      db_metric: routeSpec.key,
      expected_schema: routeSpec.expectedSchema,
      expected_invariant: routeSpec.expectedInvariant,
      evidence_collector: routeSpec.evidenceCollector,
      probable_fix_files: routeSpec.probableFixFiles,
      details: [workflowCheck.output],
    },
    root_cause: rootCause.probable_root_cause,
    fix_required: status !== "PASS",
    expected: controlPoint.expected,
  };
}

export async function runRealControlPointAudit(options: RealAuditOptions = {}): Promise<RealAuditReport> {
  const artifactRoot = options.artifactRoot ?? path.join(process.cwd(), "artifacts");
  const outputPath = path.join(artifactRoot, "engine-audit-report.json");
  const backendBaseUrl = (options.backendBaseUrl ?? process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
  const companyId = options.companyId ?? Number(process.env.COMPANY_ID ?? 2);
  const dbProof = await queryDbCountProof(companyId);
  const apiStatus = await fetchApiStatus(`${backendBaseUrl}/api/health`);
  const [salesWorkflow, inventoryWorkflow] = await Promise.all([
    runWorkflowCheck("SalesTaxInvoiceFlowTest"),
    runWorkflowCheck("InventoryAccountingWorkflowTest"),
  ]);
  const workflowChecks = new Map<string, WorkflowCheck>([
    [salesWorkflow.testName, salesWorkflow],
    [inventoryWorkflow.testName, inventoryWorkflow],
  ]);
  const engineModule = await import("@/backend/app/Support/Standards/control-point-registry");
  const registry = engineModule.ControlPointRegistry as Record<string, Array<{ id: string; name: string; module: string; expected: string }>>;
  const flattened = Object.values(registry).flatMap((entries) => entries);
  const routeChecks = await Promise.all(flattened.map(async (controlPoint) => {
    const routeSpec = metricForModule(controlPoint.module, dbProof.counts);
    const routeCheck = await executeRouteCheck(backendBaseUrl, routeSpec);
    return { controlPoint, routeSpec, routeCheck };
  }));
  const results = routeChecks.map(({ controlPoint, routeSpec, routeCheck }) => buildRealAuditRecord(controlPoint, dbProof.counts, routeSpec, routeCheck, workflowChecks, apiStatus));

  const summary = results.reduce<RealAuditReport["summary"]>((accumulator, record) => {
    accumulator.total += 1;
    if (record.status === "PASS") {
      accumulator.pass += 1;
    }
    if (record.status === "FAIL") {
      accumulator.fail += 1;
    }
    if (record.status === "PARTIAL") {
      accumulator.partial += 1;
    }
    if (record.status === "BLOCKED") {
      accumulator.blocked += 1;
    }
    return accumulator;
  }, {
    total: 0,
    pass: 0,
    fail: 0,
    partial: 0,
    blocked: 0,
  });

  const report: RealAuditReport = {
    generated_at: new Date().toISOString(),
    summary,
    results,
  };

  await mkdir(artifactRoot, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return report;
}

export async function runTargetedRealControlPointAudit(controlPointIds: string[], options: RealAuditOptions = {}) {
  const artifactRoot = options.artifactRoot ?? path.join(process.cwd(), "artifacts");
  const backendBaseUrl = (options.backendBaseUrl ?? process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
  const companyId = options.companyId ?? Number(process.env.COMPANY_ID ?? 2);
  const dbProof = await queryDbCountProof(companyId);
  const apiStatus = await fetchApiStatus(`${backendBaseUrl}/api/health`);
  const [salesWorkflow, inventoryWorkflow] = await Promise.all([
    runWorkflowCheck("SalesTaxInvoiceFlowTest"),
    runWorkflowCheck("InventoryAccountingWorkflowTest"),
  ]);
  const workflowChecks = new Map<string, WorkflowCheck>([
    [salesWorkflow.testName, salesWorkflow],
    [inventoryWorkflow.testName, inventoryWorkflow],
  ]);
  const engineModule = await import("@/backend/app/Support/Standards/control-point-registry");
  const registry = engineModule.ControlPointRegistry as Record<string, Array<{ id: string; name: string; module: string; expected: string }>>;
  const flattened = Object.values(registry).flatMap((entries) => entries).filter((controlPoint) => controlPointIds.includes(controlPoint.id));
  const routeChecks = await Promise.all(flattened.map(async (controlPoint) => {
    const routeSpec = metricForModule(controlPoint.module, dbProof.counts);
    const routeCheck = await executeRouteCheck(backendBaseUrl, routeSpec);
    return { controlPoint, routeSpec, routeCheck };
  }));
  const filteredResults = routeChecks.map(({ controlPoint, routeSpec, routeCheck }) => buildRealAuditRecord(controlPoint, dbProof.counts, routeSpec, routeCheck, workflowChecks, apiStatus));
  const report = {
    generated_at: new Date().toISOString(),
    summary: filteredResults.reduce((accumulator, record) => {
      accumulator.total += 1;
      if (record.status === "PASS") accumulator.pass += 1;
      if (record.status === "FAIL") accumulator.fail += 1;
      if (record.status === "PARTIAL") accumulator.partial += 1;
      if (record.status === "BLOCKED") accumulator.blocked += 1;
      return accumulator;
    }, { total: 0, pass: 0, fail: 0, partial: 0, blocked: 0 }),
    results: filteredResults,
  };

  await mkdir(artifactRoot, { recursive: true });
  await writeFile(path.join(artifactRoot, "targeted-engine-audit-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return {
    generated_at: report.generated_at,
    summary: report.summary,
    results: report.results,
  };
}
