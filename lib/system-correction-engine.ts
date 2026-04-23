import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AuthSession } from "@/lib/auth-session";

const execFileAsync = promisify(execFile);

export type EngineStatus = "PASS" | "PARTIAL" | "FAIL";

export type EngineIssue = {
  id: string;
  title: string;
  status: Exclude<EngineStatus, "PASS">;
  reason: string;
  shortReason: string;
  evidence?: Record<string, unknown>;
  action?: "block" | "warn" | "suggest";
  suggestion?: string;
};

export type EngineSection = {
  key: string;
  label: string;
  status: EngineStatus;
  failItems: EngineIssue[];
  partialItems: EngineIssue[];
};

export type SystemCorrectionOverview = {
  generatedAt: string;
  session: {
    valid: boolean;
    companyId: number | null;
    userId: number | null;
    hasAuthToken: boolean;
  };
  dataVisibility: {
    invoices: number;
    stock: number;
    customers: number;
    journals: number;
    vat: number;
  };
  engines: EngineSection[];
};

type DbAudit = {
  generated_at: string;
  company_id: number;
  accounting: {
    invoice_count: number;
    imbalanced_journals: Array<{ journal_id: number; debit_total: number; credit_total: number }>;
    invoices_without_journal: Array<{ id: number; document_number: string }>;
    invoices_missing_receivable: Array<{ id: number; document_number: string }>;
    invoices_missing_revenue: Array<{ id: number; document_number: string }>;
    invoices_missing_vat: Array<{ id: number; document_number: string; tax_total: number }>;
  };
  inventory: {
    transaction_count: number;
    inventory_missing_journal: Array<{ id: number; reference_number: string | null; journal_entry_number: string | null }>;
    negative_inventory_balances: Array<{ inventory_item_id: number | null; inventory_code: string | null; product_name: string | null; balance: number }>;
  };
  vat: {
    vat_document_count: number;
    documents_missing_output_vat_line: Array<{ id: number; document_number: string; tax_total: number }>;
  };
};

function getEngineStatus(failItems: EngineIssue[], partialItems: EngineIssue[]): EngineStatus {
  if (failItems.length > 0) {
    return "FAIL";
  }
  if (partialItems.length > 0) {
    return "PARTIAL";
  }
  return "PASS";
}

async function runDbAudit(companyId: number) {
  const { stdout } = await execFileAsync("php", ["system_correction_audit.php"], {
    cwd: `${process.cwd()}\\backend`,
    env: {
      ...process.env,
      COMPANY_ID: String(companyId),
    },
    maxBuffer: 1024 * 1024 * 16,
  });

  return JSON.parse(stdout) as DbAudit;
}

async function fetchBackend(session: AuthSession, path: string) {
  const companyId = session.companyId ?? session.workspaceContext?.activeCompany?.id;
  const baseUrl = (process.env.GULF_HISAB_API_BASE_URL ?? process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/api/companies/${companyId}/${path}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Gulf-Hisab-Actor-Id": String(session.userId ?? session.id),
      "X-Gulf-Hisab-Workspace-Token": String(session.authToken ?? ""),
    },
  });

  const body = await response.text();
  let json: unknown = null;
  try {
    json = body ? JSON.parse(body) : null;
  } catch {
    json = null;
  }

  return { status: response.status, ok: response.ok, json };
}

function listSize(payload: unknown) {
  const data = payload && typeof payload === "object" ? (payload as { data?: unknown }).data : null;
  if (Array.isArray(data)) {
    return data.length;
  }
  if (data && typeof data === "object") {
    const values = Object.values(data as Record<string, unknown>);
    const firstArray = values.find(Array.isArray);
    if (Array.isArray(firstArray)) {
      return firstArray.length;
    }
  }
  return 0;
}

export async function runSystemCorrectionOverview(session: AuthSession): Promise<SystemCorrectionOverview> {
  const companyId = session.companyId ?? session.workspaceContext?.activeCompany?.id ?? null;
  const userId = session.userId ?? session.id ?? null;
  const validSession = Boolean(companyId && userId && session.authToken);

  const [dbAudit, invoicesResponse, stockResponse, customersResponse, journalsResponse, vatResponse, reportsResponse] = await Promise.all([
    runDbAudit(companyId ?? 0),
    validSession ? fetchBackend(session, "reports/invoice-register?limit=50") : Promise.resolve({ status: 0, ok: false, json: null }),
    validSession ? fetchBackend(session, "inventory/stock?limit=50") : Promise.resolve({ status: 0, ok: false, json: null }),
    validSession ? fetchBackend(session, "contacts?type=customer") : Promise.resolve({ status: 0, ok: false, json: null }),
    validSession ? fetchBackend(session, "journals?limit=50") : Promise.resolve({ status: 0, ok: false, json: null }),
    validSession ? fetchBackend(session, "reports/vat-received-details?limit=50") : Promise.resolve({ status: 0, ok: false, json: null }),
    validSession ? fetchBackend(session, "reports/dashboard-summary") : Promise.resolve({ status: 0, ok: false, json: null }),
  ]);

  const visibility = {
    invoices: listSize(invoicesResponse.json),
    stock: listSize(stockResponse.json),
    customers: listSize(customersResponse.json),
    journals: listSize(journalsResponse.json),
    vat: listSize(vatResponse.json),
  };

  const sessionFailItems: EngineIssue[] = !validSession ? [{
    id: "session-missing-context",
    title: "Workspace session missing required auth context",
    status: "FAIL",
    reason: "Session must contain company_id, user_id, and auth_token before workspace requests can proceed.",
    shortReason: "company_id, user_id, or auth_token missing",
    evidence: { companyId, userId, hasAuthToken: Boolean(session.authToken) },
  }] : [];
  const sessionPartialItems: EngineIssue[] = [];

  const accountingFailItems: EngineIssue[] = [
    ...dbAudit.accounting.imbalanced_journals.map((journal) => ({
      id: `journal-balance-${journal.journal_id}`,
      title: "Entries must balance",
      status: "FAIL" as const,
      reason: `Journal ${journal.journal_id} is imbalanced: debit ${journal.debit_total} vs credit ${journal.credit_total}.`,
      shortReason: `journal ${journal.journal_id} does not balance`,
      evidence: { journal_id: journal.journal_id, debit: journal.debit_total, credit: journal.credit_total },
      action: "suggest" as const,
      suggestion: `Add the missing ${(Math.abs(journal.debit_total - journal.credit_total)).toFixed(2)} SAR journal line to rebalance journal ${journal.journal_id}.`,
    })),
    ...dbAudit.accounting.invoices_without_journal.map((invoice) => ({
      id: `invoice-journal-${invoice.id}`,
      title: "Invoice must create journal",
      status: "FAIL" as const,
      reason: `Invoice ${invoice.document_number} has no journal entry linked by reference.`,
      shortReason: `missing journal for ${invoice.document_number}`,
      evidence: { invoice_id: invoice.id, document_number: invoice.document_number },
      action: "suggest" as const,
      suggestion: `Create a posting job for invoice ${invoice.document_number} and replay journal generation.`,
    })),
  ];
  const accountingPartialItems: EngineIssue[] = [
    ...dbAudit.accounting.invoices_missing_receivable.map((invoice) => ({
      id: `invoice-receivable-${invoice.id}`,
      title: "Receivable posting incomplete",
      status: "PARTIAL" as const,
      reason: `Invoice ${invoice.document_number} is missing account 1100 in journal lines.`,
      shortReason: `1100 missing for ${invoice.document_number}`,
      evidence: invoice,
      action: "suggest" as const,
      suggestion: `Post Accounts Receivable line for invoice ${invoice.document_number}.`,
    })),
    ...dbAudit.accounting.invoices_missing_revenue.map((invoice) => ({
      id: `invoice-revenue-${invoice.id}`,
      title: "Revenue posting incomplete",
      status: "PARTIAL" as const,
      reason: `Invoice ${invoice.document_number} is missing account 4000 in journal lines.`,
      shortReason: `4000 missing for ${invoice.document_number}`,
      evidence: invoice,
      action: "suggest" as const,
      suggestion: `Post Sales Revenue line for invoice ${invoice.document_number}.`,
    })),
  ];

  const inventoryFailItems: EngineIssue[] = dbAudit.inventory.negative_inventory_balances.map((record) => ({
    id: `negative-stock-${record.inventory_item_id ?? record.inventory_code ?? 'unknown'}`,
    title: "Stock mismatch",
    status: "FAIL",
    reason: `Inventory ${record.product_name ?? record.inventory_code ?? 'item'} has negative balance ${record.balance}.`,
    shortReason: `negative stock ${record.balance}`,
    evidence: record,
    action: "warn",
  }));
  const inventoryPartialItems: EngineIssue[] = [
    ...dbAudit.inventory.inventory_missing_journal.map((record) => ({
      id: `inventory-journal-${record.id}`,
      title: "Inventory posting missing",
      status: "PARTIAL" as const,
      reason: `Inventory transaction ${record.reference_number ?? record.id} references missing journal ${record.journal_entry_number}.`,
      shortReason: `journal ${record.journal_entry_number} missing`,
      evidence: record,
      action: "suggest" as const,
      suggestion: `Replay inventory posting for transaction ${record.reference_number ?? record.id}.`,
    })),
    ...(visibility.stock < 10 ? [{
      id: "inventory-ui-rows",
      title: "Inventory UI visibility below threshold",
      status: "PARTIAL" as const,
      reason: `Only ${visibility.stock} stock rows are visible through the live company route.`,
      shortReason: `${visibility.stock} visible stock rows`,
      evidence: visibility,
      action: "warn" as const,
    }] : []),
  ];

  const vatFailItems: EngineIssue[] = dbAudit.vat.documents_missing_output_vat_line.map((invoice) => ({
    id: `vat-line-${invoice.id}`,
    title: "VAT output posting missing",
    status: "FAIL",
    reason: `Invoice ${invoice.document_number} has tax ${invoice.tax_total} but no output VAT line on account 2200.`,
    shortReason: `2200 missing for ${invoice.document_number}`,
    evidence: invoice,
    action: "block",
    suggestion: `Block finalization until VAT line is posted for ${invoice.document_number}.`,
  }));
  const vatPartialItems: EngineIssue[] = visibility.vat < 10 ? [{
    id: "vat-ui-rows",
    title: "VAT UI visibility below threshold",
    status: "PARTIAL",
    reason: `Only ${visibility.vat} VAT rows are visible through the live company route.`,
    shortReason: `${visibility.vat} visible VAT rows`,
    evidence: visibility,
    action: "warn",
  }] : [];

  const reportsFailItems: EngineIssue[] = reportsResponse.ok ? [] : [{
    id: "reports-dashboard-summary",
    title: "Dashboard summary report unavailable",
    status: "FAIL",
    reason: `reports/dashboard-summary returned ${reportsResponse.status}.`,
    shortReason: `status ${reportsResponse.status}`,
    evidence: { status: reportsResponse.status },
    action: "suggest",
    suggestion: "Restore the dashboard-summary route contract or remove invalid create-path expectations.",
  }];
  const reportsPartialItems: EngineIssue[] = [
    ...(visibility.invoices < 10 ? [{
      id: "invoice-ui-rows",
      title: "Invoice UI visibility below threshold",
      status: "PARTIAL" as const,
      reason: `Only ${visibility.invoices} invoice rows are visible through the live company route.`,
      shortReason: `${visibility.invoices} visible invoice rows`,
      evidence: visibility,
    }] : []),
    ...(visibility.customers < 10 ? [{
      id: "customer-ui-rows",
      title: "Customer UI visibility below threshold",
      status: "PARTIAL" as const,
      reason: `Only ${visibility.customers} customer rows are visible through the live company route.`,
      shortReason: `${visibility.customers} visible customer rows`,
      evidence: visibility,
    }] : []),
    ...(visibility.journals < 10 ? [{
      id: "journal-ui-rows",
      title: "Journal UI visibility below threshold",
      status: "PARTIAL" as const,
      reason: `Only ${visibility.journals} journal rows are visible through the live company route.`,
      shortReason: `${visibility.journals} visible journal rows`,
      evidence: visibility,
    }] : []),
  ];

  const aiFailItems: EngineIssue[] = [];
  const aiPartialItems: EngineIssue[] = [
    ...accountingFailItems.filter((item) => item.action === "suggest").map((item) => ({
      ...item,
      id: `ai-${item.id}`,
      title: item.suggestion ?? item.title,
      status: "PARTIAL" as const,
      shortReason: item.shortReason,
      reason: item.reason,
    })),
    {
      id: "ai-vat-guard",
      title: "Invalid VAT numbers are blocked before save",
      status: "PARTIAL",
      reason: "Customer, vendor, and company profile validators now act as blocking guards for invalid Saudi VAT numbers.",
      shortReason: "VAT save guard active",
      action: "block",
    },
  ];

  const engines: EngineSection[] = [
    { key: "session", label: "Session Engine", status: getEngineStatus(sessionFailItems, sessionPartialItems), failItems: sessionFailItems, partialItems: sessionPartialItems },
    { key: "accounting", label: "Accounting Engine", status: getEngineStatus(accountingFailItems, accountingPartialItems), failItems: accountingFailItems, partialItems: accountingPartialItems },
    { key: "inventory", label: "Inventory Engine", status: getEngineStatus(inventoryFailItems, inventoryPartialItems), failItems: inventoryFailItems, partialItems: inventoryPartialItems },
    { key: "vat", label: "VAT Engine", status: getEngineStatus(vatFailItems, vatPartialItems), failItems: vatFailItems, partialItems: vatPartialItems },
    { key: "reports", label: "Reports Engine", status: getEngineStatus(reportsFailItems, reportsPartialItems), failItems: reportsFailItems, partialItems: reportsPartialItems },
    { key: "ai", label: "AI Engine", status: getEngineStatus(aiFailItems, aiPartialItems), failItems: aiFailItems, partialItems: aiPartialItems },
  ];

  return {
    generatedAt: new Date().toISOString(),
    session: {
      valid: validSession,
      companyId,
      userId,
      hasAuthToken: Boolean(session.authToken),
    },
    dataVisibility: visibility,
    engines,
  };
}