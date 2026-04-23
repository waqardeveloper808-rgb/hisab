import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type ControlPointModule = "Invoice" | "Accounting" | "Inventory" | "VAT" | "UX" | "Audit" | "Import" | "Reports" | "Users";

export type ControlPointDefinition = {
  id: string;
  name: string;
  module: ControlPointModule;
  description: string;
  validate: () => Promise<void>;
  expected: string;
};

type ControlPointInventoryRecord = {
  id: string;
  name: string;
  module: ControlPointModule;
  description: string;
  expected: string;
};

const controlPointModuleDefinitions: Record<ControlPointModule, Array<Omit<ControlPointDefinition, "module">>> = {
  Invoice: [
    { id: "INV-001", name: "Invoice Creation Validation", description: "Invoice must be created and stored in DB", validate: async () => {}, expected: "Invoice exists in DB with valid totals" },
    { id: "INV-002", name: "Draft Invoice Persistence", description: "Draft invoices must persist before finalization", validate: async () => {}, expected: "Draft invoice is persisted with draft status" },
    { id: "INV-003", name: "Invoice Number Assignment", description: "Finalized invoices must receive a document number", validate: async () => {}, expected: "Finalized invoice has a generated document number" },
    { id: "INV-004", name: "Invoice Totals Accuracy", description: "Taxable, tax, and grand totals must remain consistent", validate: async () => {}, expected: "Stored totals equal the sum of invoice lines and VAT" },
    { id: "INV-005", name: "Invoice Customer Link", description: "Invoices must be linked to a valid customer", validate: async () => {}, expected: "Invoice references an existing customer record" },
    { id: "INV-006", name: "Invoice Payment Status", description: "Invoice payment status must track open, partial, and paid states", validate: async () => {}, expected: "Invoice balance and status reflect recorded payments" },
    { id: "INV-007", name: "Invoice Finalization Guard", description: "Finalized invoices must reject mutable updates", validate: async () => {}, expected: "Finalized invoices cannot be edited without a correction flow" },
    { id: "INV-008", name: "Invoice Ledger Posting", description: "Finalized invoices must create ledger entries", validate: async () => {}, expected: "A journal entry exists for each finalized invoice" },
    { id: "INV-009", name: "Invoice Route Coverage", description: "Invoice API routes must be reachable", validate: async () => {}, expected: "Invoice create, show, and finalize routes return success" },
    { id: "INV-010", name: "Invoice Workflow Proof", description: "Invoice workflow must be executable end to end", validate: async () => {}, expected: "Invoice workflow proof shows draft to paid completion" },
  ],
  Accounting: [
    { id: "ACC-001", name: "Chart Of Accounts Availability", description: "Baseline accounts must exist for each company", validate: async () => {}, expected: "Required chart of accounts codes are present" },
    { id: "ACC-002", name: "Journal Entry Creation", description: "Journal entries must persist for transactional postings", validate: async () => {}, expected: "Journal entries are stored with source references" },
    { id: "ACC-003", name: "Balanced Journal Lines", description: "Debits and credits must remain balanced", validate: async () => {}, expected: "Each journal entry balances to zero" },
    { id: "ACC-004", name: "Payment Ledger Posting", description: "Payments must generate accounting lines", validate: async () => {}, expected: "Payment posting creates journal evidence" },
    { id: "ACC-005", name: "Manual Journal Route", description: "Manual journal routes must work", validate: async () => {}, expected: "Manual journal list and create routes are available" },
    { id: "ACC-006", name: "Trial Balance Availability", description: "Trial balance report must be reachable", validate: async () => {}, expected: "Trial balance API responds with report data" },
    { id: "ACC-007", name: "Profit Loss Availability", description: "Profit and loss report must be reachable", validate: async () => {}, expected: "Profit and loss API responds with report data" },
    { id: "ACC-008", name: "Account Period Support", description: "Accounting periods must exist for operational posting", validate: async () => {}, expected: "Posting occurs inside an open accounting period" },
  ],
  Inventory: [
    { id: "STK-001", name: "Inventory Receipt Persistence", description: "Inventory receipts must persist in DB", validate: async () => {}, expected: "Inventory stock receipt rows exist in DB" },
    { id: "STK-002", name: "Inventory Stock Route", description: "Inventory stock routes must work", validate: async () => {}, expected: "Inventory stock list and create routes are reachable" },
    { id: "STK-003", name: "Inventory Quantity Tracking", description: "On-hand quantities must update after movements", validate: async () => {}, expected: "Inventory quantity reflects receipts, adjustments, and sales" },
    { id: "STK-004", name: "Inventory Sale Posting", description: "Inventory sales must post accounting entries", validate: async () => {}, expected: "Inventory sale creates linked journal entries" },
    { id: "STK-005", name: "Inventory Adjustment Posting", description: "Adjustments must post write-off or gain entries", validate: async () => {}, expected: "Inventory adjustment creates journal evidence" },
    { id: "STK-006", name: "Inventory Document Links", description: "Inventory sales must retain linked documents", validate: async () => {}, expected: "Inventory records store related invoice and delivery links" },
    { id: "STK-007", name: "Inventory Reduction On Invoice", description: "Selling stocked items must reduce stock", validate: async () => {}, expected: "Inventory quantity decreases after sale workflow" },
    { id: "STK-008", name: "Inventory Account Mapping", description: "Inventory transactions must use mapped accounts", validate: async () => {}, expected: "Inventory journals contain expected account codes" },
  ],
  VAT: [
    { id: "VAT-001", name: "VAT Category Availability", description: "VAT tax categories must exist per company", validate: async () => {}, expected: "VAT15 category exists for active companies" },
    { id: "VAT-002", name: "Output VAT Calculation", description: "Sales invoices must calculate output VAT", validate: async () => {}, expected: "Invoice tax totals match configured VAT rate" },
    { id: "VAT-003", name: "VAT Ledger Recording", description: "Finalized invoices must store VAT ledger metadata", validate: async () => {}, expected: "Compliance metadata records output VAT evidence" },
    { id: "VAT-004", name: "VAT Summary Report", description: "VAT summary report must be reachable", validate: async () => {}, expected: "VAT summary API returns data" },
  ],
  UX: [
    { id: "UX-001", name: "Invoice Workspace Route", description: "Invoice workspace route must render", validate: async () => {}, expected: "Invoice workspace UI route is reachable" },
    { id: "UX-002", name: "Inventory Workspace Route", description: "Inventory workspace route must render", validate: async () => {}, expected: "Inventory workspace UI route is reachable" },
    { id: "UX-003", name: "Accounting Workspace Route", description: "Accounting workspace route must render", validate: async () => {}, expected: "Accounting workspace UI route is reachable" },
    { id: "UX-004", name: "Reports Workspace Route", description: "Reports workspace route must render", validate: async () => {}, expected: "Reports workspace UI route is reachable" },
    { id: "UX-005", name: "Document Validation Surface", description: "Document validation UI must expose proof controls", validate: async () => {}, expected: "Document validation surface loads without blockers" },
    { id: "UX-006", name: "Sales Workflow Surface", description: "Sales workflow UI must expose evidence capture controls", validate: async () => {}, expected: "Sales workflow UI loads and supports evidence capture" },
    { id: "UX-007", name: "Accounting Workflow Surface", description: "Accounting workflow UI must expose evidence capture controls", validate: async () => {}, expected: "Accounting workflow UI loads and supports evidence capture" },
    { id: "UX-008", name: "Navigation Health", description: "Primary workflow routes must be navigable", validate: async () => {}, expected: "Workflow routes can be opened without 404s" },
    { id: "UX-009", name: "Audit Dashboard Health", description: "Audit dashboard route must render audit results", validate: async () => {}, expected: "Audit UI displays runtime results" },
    { id: "UX-010", name: "UX Workflow Proof", description: "UI proof must exist for the audited workflow", validate: async () => {}, expected: "Captured UI proof confirms reachable workflow surfaces" },
  ],
  Audit: [
    { id: "AUD-001", name: "Audit Engine Runtime", description: "Audit engine must execute without static PASS output", validate: async () => {}, expected: "Audit engine returns evidence-based statuses" },
    { id: "AUD-002", name: "Audit Artifact Output", description: "Audit engine must write a machine-readable report", validate: async () => {}, expected: "engine-audit-report.json is generated" },
    { id: "AUD-003", name: "Root Cause Output", description: "Root cause engine must classify failures", validate: async () => {}, expected: "root-cause-report.json is generated with classifications" },
    { id: "AUD-004", name: "Control Point Inventory Output", description: "Control point inventory must be written", validate: async () => {}, expected: "control-point-inventory.json is generated" },
    { id: "AUD-005", name: "Execution Log Output", description: "Execution log must capture step timings", validate: async () => {}, expected: "execution-log.md records step timings" },
    { id: "AUD-006", name: "Execution Time Report", description: "Execution time report must capture step durations", validate: async () => {}, expected: "execution-time-report.md is generated" },
    { id: "AUD-007", name: "Audit Retry Loop", description: "Audit engine must support rerun cycles", validate: async () => {}, expected: "At least three audit cycles can be executed" },
    { id: "AUD-008", name: "Critical Failure Detection", description: "Critical failures must never be reported as PASS", validate: async () => {}, expected: "Critical failures are surfaced as FAIL or BLOCKED" },
    { id: "AUD-009", name: "Evidence Coverage", description: "Audit findings must include DB, route, and API evidence where applicable", validate: async () => {}, expected: "Audit records include evidence details" },
    { id: "AUD-010", name: "Audit Final Status", description: "Audit final state must be computed from findings", validate: async () => {}, expected: "Audit summary reflects real counts from results" },
  ],
  Import: [
    { id: "IMP-001", name: "Contact Import Readiness", description: "Contact import data contracts must exist", validate: async () => {}, expected: "Import data contracts include contact fields" },
    { id: "IMP-002", name: "Item Import Readiness", description: "Item import data contracts must exist", validate: async () => {}, expected: "Import data contracts include item fields" },
    { id: "IMP-003", name: "Invoice Import Readiness", description: "Invoice import data contracts must exist", validate: async () => {}, expected: "Import data contracts include invoice fields" },
    { id: "IMP-004", name: "Import Route Coverage", description: "Import endpoints must be reachable where implemented", validate: async () => {}, expected: "Implemented import routes return expected responses" },
    { id: "IMP-005", name: "Import Validation Rules", description: "Import validation must reject malformed records", validate: async () => {}, expected: "Import validation surfaces field-level errors" },
    { id: "IMP-006", name: "Import Artifact Coverage", description: "Import flows must produce evidence when audited", validate: async () => {}, expected: "Audit evidence references import readiness checks" },
    { id: "IMP-007", name: "Template Import Mapping", description: "Imported templates must preserve field mapping", validate: async () => {}, expected: "Template imports map known fields correctly" },
    { id: "IMP-008", name: "Bulk Data Integrity", description: "Bulk import must retain record counts", validate: async () => {}, expected: "Imported counts match accepted records" },
    { id: "IMP-009", name: "Import User Access", description: "Import features must remain access controlled", validate: async () => {}, expected: "Unauthorized import calls are rejected" },
    { id: "IMP-010", name: "Import Workflow Proof", description: "Import readiness must be auditable", validate: async () => {}, expected: "Audit proof captures import validations or missing implementations" },
  ],
  Reports: [
    { id: "REP-001", name: "Invoice Register Report", description: "Invoice register report must be reachable", validate: async () => {}, expected: "Invoice register API returns data" },
    { id: "REP-002", name: "Payment Register Report", description: "Payment register report must be reachable", validate: async () => {}, expected: "Payments register API returns data" },
    { id: "REP-003", name: "VAT Summary Report", description: "VAT summary report must be reachable", validate: async () => {}, expected: "VAT summary API returns data" },
    { id: "REP-004", name: "Trial Balance Report", description: "Trial balance report must be reachable", validate: async () => {}, expected: "Trial balance API returns data" },
    { id: "REP-005", name: "General Ledger Report", description: "General ledger report must be reachable", validate: async () => {}, expected: "General ledger API returns data" },
    { id: "REP-006", name: "Profit Loss Report", description: "Profit and loss report must be reachable", validate: async () => {}, expected: "Profit and loss API returns data" },
  ],
  Users: [
    { id: "USR-001", name: "User Registration Route", description: "User registration route must work", validate: async () => {}, expected: "Registration API returns success for valid payloads" },
    { id: "USR-002", name: "User Login Route", description: "User login route must work", validate: async () => {}, expected: "Login API returns success for valid credentials" },
    { id: "USR-003", name: "Workspace Access Control", description: "Protected workspace routes must require access", validate: async () => {}, expected: "Unauthorized access is rejected" },
    { id: "USR-004", name: "Company User Listing", description: "Company user listing route must work", validate: async () => {}, expected: "Company users API returns data" },
    { id: "USR-005", name: "Support Account Listing", description: "Support account listing route must work", validate: async () => {}, expected: "Support account API returns data" },
    { id: "USR-006", name: "Role Update Route", description: "User role update route must work", validate: async () => {}, expected: "User update API returns success for authorized callers" },
    { id: "USR-007", name: "Audit Actor Capture", description: "User-driven workflows must preserve actor metadata", validate: async () => {}, expected: "Workflow records retain acting user identifiers" },
    { id: "USR-008", name: "Session Health", description: "Authenticated session state must support workspace requests", validate: async () => {}, expected: "Authenticated API calls succeed for workspace routes" },
    { id: "USR-009", name: "User Dummy Data Coverage", description: "Dummy workflow setup must include a valid acting user", validate: async () => {}, expected: "Workflow tests create an acting user" },
    { id: "USR-010", name: "User Workflow Proof", description: "User access flow must be auditable", validate: async () => {}, expected: "Audit proof captures authenticated workflow execution" },
  ],
};

function buildControlPointRegistry() {
  const seenIds = new Set<string>();
  const registry = {} as Record<ControlPointModule, ControlPointDefinition[]>;

  for (const [moduleName, definitions] of Object.entries(controlPointModuleDefinitions) as Array<[ControlPointModule, Array<Omit<ControlPointDefinition, "module">>]>) {
    if (!moduleName.trim()) {
      throw new Error("Control point module name cannot be empty.");
    }

    const moduleEntries = definitions.map((definition) => {
      if (seenIds.has(definition.id)) {
        throw new Error(`Duplicate control point id detected: ${definition.id}`);
      }
      if (!definition.name.trim() || !definition.description.trim() || !definition.expected.trim()) {
        throw new Error(`Control point ${definition.id} contains empty required fields.`);
      }
      seenIds.add(definition.id);
      return {
        ...definition,
        module: moduleName,
      } satisfies ControlPointDefinition;
    });

    registry[moduleName] = moduleEntries;
  }

  return Object.freeze(registry);
}

export const ControlPointRegistry = buildControlPointRegistry();

function getControlPointInventoryRecords(): ControlPointInventoryRecord[] {
  return Object.values(ControlPointRegistry).flatMap((moduleEntries) => moduleEntries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    module: entry.module,
    description: entry.description,
    expected: entry.expected,
  })));
}

export function getControlPointStats() {
  const modules = Object.keys(ControlPointRegistry);
  let total = 0;

  const breakdown = modules.map((moduleName) => {
    const count = ControlPointRegistry[moduleName as ControlPointModule].length;
    total += count;
    return { module: moduleName, count };
  });

  return {
    total_modules: modules.length,
    total_control_points: total,
    breakdown,
  };
}

export async function writeControlPointInventoryArtifact(targetFilePath = path.join(process.cwd(), "artifacts", "control-point-inventory.json")) {
  const payload = {
    generated_at: new Date().toISOString(),
    stats: getControlPointStats(),
    control_points: getControlPointInventoryRecords(),
  };

  await mkdir(path.dirname(targetFilePath), { recursive: true });
  await writeFile(targetFilePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  return payload;
}
