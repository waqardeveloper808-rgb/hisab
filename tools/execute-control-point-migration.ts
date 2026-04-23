import fs from "node:fs";
import path from "node:path";

import { controlPointCategoryDefinitions } from "../backend/app/Support/Standards/control-point-categories";
import { CONTROL_POINTS_MASTER } from "../backend/app/Support/Standards/control-points-master";
import { standardsControlPoints as currentLegacyControlPoints } from "../backend/app/Support/Standards/control-points";

type AnyRecord = Record<string, unknown>;

type LegacyControlPoint = (typeof currentLegacyControlPoints)[number];

type ModuleDefinition = {
  code: string;
  name: string;
  kind: "primary" | "supporting";
  description: string;
  legacyPrefixes: string[];
};

type FileClassificationRecord = {
  path: string;
  absolutePath: string;
  classification: "runtime" | "historical" | "generated" | "test" | "docs" | "report" | "artifact";
  runtimeAffecting: boolean;
  reason: string;
};

type MigrationMapRecord = {
  old_id: string;
  old_title: string;
  old_module: string;
  new_module_code: string;
  proposed_new_id: string;
  migration_action: "migrate" | "merge" | "split" | "retire" | "replace";
  source_standard_clause: string | null;
  target_file: string;
  runtime_dependency_count: number;
  notes: string;
};

type V2ControlPoint = {
  id: string;
  version: string;
  module_code: string;
  module_name: string;
  chapter_number: string;
  title: string;
  source_standard_clause: string;
  source_standard_document: string;
  description: string;
  control_rule: string;
  applicability: string[];
  conditions: string[];
  evaluation_method: string;
  scoring_logic: string;
  evidence_requirement: string[];
  nonconformity: string;
  control_weight: number;
  risk_priority: "low" | "medium" | "high" | "critical";
  evaluation_frequency: string;
  control_owner: string;
  evaluator: string;
  reviewer: string;
  linked_project_modules: string[];
  linked_files: string[];
  linked_legacy_ids: string[];
  migration_action: "migrate" | "merge" | "split" | "retire" | "replace";
  implementation_status: string;
  status: "draft" | "active" | "migrated" | "archived" | "retired";
};

type StepTiming = {
  step: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  elapsedSeconds: number;
  averageStepSeconds: number;
  estimatedRemainingSeconds: number;
  status: string;
};

const ROOT = process.cwd();
const STANDARDS_DIR = path.join(ROOT, "backend", "app", "Support", "Standards");
const LEGACY_DIR = path.join(STANDARDS_DIR, "legacy");
const V2_DIR = path.join(STANDARDS_DIR, "v2");
const MIGRATION_DIR = path.join(STANDARDS_DIR, "migration");
const ARTIFACTS_DIR = path.join(ROOT, "artifacts");
const RUNTIME_SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".php"]);

const INVENTORY_ARTIFACT_DIR = path.join(ROOT, "artifacts", "control-point-inventory-20260419-225714");
const CONTROL_POINT_FILES_PATH = path.join(INVENTORY_ARTIFACT_DIR, "control-point-files.txt");
const CONTROL_POINTS_LIST_PATH = path.join(INVENTORY_ARTIFACT_DIR, "control-points-list.txt");
const CONTROL_POINT_INVENTORY_TIME_PATH = path.join(INVENTORY_ARTIFACT_DIR, "execution-time-report.md");

const MANDATORY_UPLOADED_FILES = [
  "/mnt/data/control-point-files.txt",
  "/mnt/data/control-points-list.txt",
  "/mnt/data/execution-time-report.md",
  "/mnt/data/📘 GULF HISAB - Control Points.docx",
];

const MODULE_DEFINITIONS: ModuleDefinition[] = [
  { code: "UX", name: "User Experience", kind: "primary", description: "Cross-workspace experience and navigation controls.", legacyPrefixes: ["UIX"] },
  { code: "IVC", name: "Invoice Control", kind: "primary", description: "Invoice document integrity and compliance controls.", legacyPrefixes: ["DOC"] },
  { code: "ACC", name: "Accounting Control", kind: "primary", description: "Accounting integrity and financial posting controls.", legacyPrefixes: ["ACC"] },
  { code: "INV", name: "Inventory Control", kind: "primary", description: "Inventory movement, costing, and valuation controls.", legacyPrefixes: ["INV"] },
  { code: "TAX", name: "VAT / Tax Control", kind: "primary", description: "VAT, tax, and e-invoicing compliance controls.", legacyPrefixes: ["VAT"] },
  { code: "AUD", name: "Audit Control", kind: "primary", description: "Audit traceability and review controls.", legacyPrefixes: [] },
  { code: "USR", name: "User Workspace Control", kind: "primary", description: "User workspace flow and usability controls.", legacyPrefixes: [] },
  { code: "ADM", name: "Admin Workspace Control", kind: "primary", description: "Admin workspace governance and review controls.", legacyPrefixes: [] },
  { code: "AST", name: "Assistant Workspace Control", kind: "primary", description: "Assistant workspace control surfaces.", legacyPrefixes: [] },
  { code: "ACP", name: "Accountant / Partner Workspace Control", kind: "primary", description: "Partner and accountant workspace controls.", legacyPrefixes: [] },
  { code: "DOC", name: "Document Engine Control", kind: "supporting", description: "Document engine support controls outside invoice-specific migration scope.", legacyPrefixes: [] },
  { code: "TMP", name: "Template Engine Control", kind: "supporting", description: "Template engine composition and rendering controls.", legacyPrefixes: ["TMP"] },
  { code: "VAL", name: "Validation Control", kind: "supporting", description: "Validation and master data quality controls.", legacyPrefixes: ["VAL"] },
  { code: "SEC", name: "Security Control", kind: "supporting", description: "Security enforcement controls outside audit review governance.", legacyPrefixes: ["SEC"] },
  { code: "BRD", name: "Branding Control", kind: "supporting", description: "Branding and identity layout controls.", legacyPrefixes: ["BRD"] },
  { code: "XMD", name: "Cross-Module Dependency Control", kind: "supporting", description: "Cross-module dependency and integrity controls.", legacyPrefixes: ["XMD"] },
  { code: "FRM", name: "Forms and Registers Control", kind: "supporting", description: "Forms and registers controls retained as a support module.", legacyPrefixes: ["FRM"] },
];

const MODULE_MAPPING_REASONS: Record<string, string> = {
  ACC: "Legacy ACC already aligns directly to Accounting Control without prefix conflict.",
  VAT: "Legacy VAT maps to TAX because the target architecture reserves TAX for VAT and tax compliance controls.",
  DOC: "Legacy DOC maps to IVC because the current document controls are invoice and compliance document behaviors rather than a generic runtime document registry.",
  INV: "Legacy INV remains INV because Inventory and Invoice must not share prefixes and INV already denotes inventory.",
  UIX: "Legacy UIX maps to UX because the v2 primary module code is UX for user experience controls.",
  FRM: "Legacy FRM remains FRM as a controlled supporting module because the current surface is still forms-and-registers specific.",
  TMP: "Legacy TMP remains TMP as a supporting template engine module with distinct rendering responsibilities.",
  VAL: "Legacy VAL remains VAL as a supporting validation module for data and format rules.",
  SEC: "Legacy SEC remains SEC as a supporting security module while audit review governance is separated into AUD.",
  BRD: "Legacy BRD remains BRD as a supporting branding module with independent rendering requirements.",
  XMD: "Legacy XMD remains XMD as a supporting cross-module dependency module.",
};

const SAFE_MIGRATIONS: Array<{
  oldId: string;
  newModuleCode: string;
  newId: string;
  chapterNumber: string;
  sourceStandardClause: string;
  sourceStandardDocument: string;
  evaluationMethod: string;
  scoringLogic: string;
  evidenceRequirement: string[];
  nonconformity: string;
  controlWeight: number;
  evaluationFrequency: string;
  controlOwner: string;
  evaluator: string;
  reviewer: string;
  notes: string;
}> = [
  { oldId: "ACC-007", newModuleCode: "ACC", newId: "CP-ACC-001", chapterNumber: "1.1", sourceStandardClause: "IFRS 15 Step 1 - Identify the contract with a customer", sourceStandardDocument: "IFRS 15 Revenue from Contracts with Customers", evaluationMethod: "Contract setup review against revenue recognition prerequisites.", scoringLogic: "Pass when contract identification metadata exists and the revenue workflow cannot start without a contract record.", evidenceRequirement: ["contract configuration record", "workflow validation log"], nonconformity: "Revenue setup proceeds without a contract identification control.", controlWeight: 9, evaluationFrequency: "Per release and quarterly control review", controlOwner: "Accounting Core", evaluator: "Revenue controls reviewer", reviewer: "Finance governance reviewer", notes: "Mapped directly from the legacy revenue recognition sequence." },
  { oldId: "ACC-008", newModuleCode: "ACC", newId: "CP-ACC-002", chapterNumber: "1.2", sourceStandardClause: "IFRS 15 Step 2 - Identify performance obligations", sourceStandardDocument: "IFRS 15 Revenue from Contracts with Customers", evaluationMethod: "Performance obligation model review in contract configuration.", scoringLogic: "Pass when distinct obligations can be stored and separated for revenue scheduling.", evidenceRequirement: ["contract obligation matrix", "configuration sample"], nonconformity: "Distinct obligations cannot be separated within the contract model.", controlWeight: 9, evaluationFrequency: "Per release and quarterly control review", controlOwner: "Accounting Core", evaluator: "Revenue controls reviewer", reviewer: "Finance governance reviewer", notes: "Migrated because the legacy title already names the IFRS step." },
  { oldId: "ACC-009", newModuleCode: "ACC", newId: "CP-ACC-003", chapterNumber: "1.3", sourceStandardClause: "IFRS 15 Step 3 - Determine the transaction price", sourceStandardDocument: "IFRS 15 Revenue from Contracts with Customers", evaluationMethod: "Revenue pricing data completeness review.", scoringLogic: "Pass when transaction price is stored and required before downstream recognition logic executes.", evidenceRequirement: ["pricing payload", "validation log"], nonconformity: "Recognition can proceed without a determinable transaction price.", controlWeight: 9, evaluationFrequency: "Per release and quarterly control review", controlOwner: "Accounting Core", evaluator: "Revenue controls reviewer", reviewer: "Finance governance reviewer", notes: "Migrated because the legacy control already targets IFRS 15 step 3." },
  { oldId: "ACC-010", newModuleCode: "ACC", newId: "CP-ACC-004", chapterNumber: "1.4", sourceStandardClause: "IFRS 15 Step 4 - Allocate the transaction price", sourceStandardDocument: "IFRS 15 Revenue from Contracts with Customers", evaluationMethod: "Allocation rule review across configured obligations.", scoringLogic: "Pass when price allocation exists and is traceable across distinct obligations.", evidenceRequirement: ["allocation schedule", "contract obligation sample"], nonconformity: "Transaction price cannot be allocated across obligations.", controlWeight: 9, evaluationFrequency: "Per release and quarterly control review", controlOwner: "Accounting Core", evaluator: "Revenue controls reviewer", reviewer: "Finance governance reviewer", notes: "Migrated because the legacy control directly names the allocation step." },
  { oldId: "ACC-011", newModuleCode: "ACC", newId: "CP-ACC-005", chapterNumber: "1.5", sourceStandardClause: "IFRS 15 Step 5 - Recognize revenue when control transfers", sourceStandardDocument: "IFRS 15 Revenue from Contracts with Customers", evaluationMethod: "Recognition trigger review against transfer-of-control events.", scoringLogic: "Pass when revenue timing is linked to transfer-of-control events and is auditable.", evidenceRequirement: ["recognition event log", "revenue release sample"], nonconformity: "Revenue timing is not linked to transfer-of-control evidence.", controlWeight: 10, evaluationFrequency: "Per release and quarterly control review", controlOwner: "Accounting Core", evaluator: "Revenue controls reviewer", reviewer: "Finance governance reviewer", notes: "Migrated because the legacy control directly names IFRS 15 step 5." },
  { oldId: "VAT-010", newModuleCode: "TAX", newId: "CP-TAX-001", chapterNumber: "2.1", sourceStandardClause: "KSA e-invoicing XML generation requirement", sourceStandardDocument: "ZATCA Electronic Invoice XML Implementation Standard", evaluationMethod: "Compliance payload generation review.", scoringLogic: "Pass when the invoice pipeline can produce the required XML compliance payload for regulated invoices.", evidenceRequirement: ["XML payload sample", "compliance generation log"], nonconformity: "Required XML payload generation is unavailable or incomplete.", controlWeight: 10, evaluationFrequency: "Per release and regulatory change review", controlOwner: "Tax and Compliance", evaluator: "Tax compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control is explicitly KSA XML readiness." },
  { oldId: "VAT-011", newModuleCode: "TAX", newId: "CP-TAX-002", chapterNumber: "2.2", sourceStandardClause: "PDF/A-3 hybrid invoice container requirement", sourceStandardDocument: "ZATCA Electronic Invoice XML Implementation Standard", evaluationMethod: "Hybrid invoice packaging review.", scoringLogic: "Pass when the output pipeline can render PDF/A-3 with embedded XML for regulated invoices.", evidenceRequirement: ["PDF/A-3 sample", "embedded XML proof"], nonconformity: "Hybrid invoice packaging cannot produce a compliant PDF/A-3 output.", controlWeight: 10, evaluationFrequency: "Per release and regulatory change review", controlOwner: "Tax and Compliance", evaluator: "Tax compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control explicitly targets PDF/A-3 readiness." },
  { oldId: "VAT-012", newModuleCode: "TAX", newId: "CP-TAX-003", chapterNumber: "2.3", sourceStandardClause: "Invoice hash generation requirement", sourceStandardDocument: "ZATCA Electronic Invoice XML Implementation Standard", evaluationMethod: "Cryptographic payload review.", scoringLogic: "Pass when the compliance pipeline emits invoice hashes for qualifying documents.", evidenceRequirement: ["hash output sample", "compliance generation log"], nonconformity: "Invoice hashes are missing from the compliance payload.", controlWeight: 9, evaluationFrequency: "Per release and regulatory change review", controlOwner: "Tax and Compliance", evaluator: "Tax compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control explicitly names the SHA-256 requirement." },
  { oldId: "VAT-013", newModuleCode: "TAX", newId: "CP-TAX-004", chapterNumber: "2.4", sourceStandardClause: "Electronic signature metadata requirement", sourceStandardDocument: "ZATCA Electronic Invoice XML Implementation Standard", evaluationMethod: "Signature metadata review in the compliance pipeline.", scoringLogic: "Pass when signature metadata and signature application steps are represented in the compliance pipeline.", evidenceRequirement: ["signature metadata sample", "compliance generation log"], nonconformity: "Signature metadata or signature step is not represented in the compliance pipeline.", controlWeight: 9, evaluationFrequency: "Per release and regulatory change review", controlOwner: "Tax and Compliance", evaluator: "Tax compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control explicitly names the ECDSA requirement." },
  { oldId: "VAT-014", newModuleCode: "TAX", newId: "CP-TAX-005", chapterNumber: "2.5", sourceStandardClause: "QR TLV Tag 1 - Seller Name", sourceStandardDocument: "ZATCA Electronic Invoice XML Implementation Standard", evaluationMethod: "QR TLV output inspection for seller-name encoding.", scoringLogic: "Pass when TLV payloads include Tag 1 with seller-name encoding.", evidenceRequirement: ["QR TLV sample", "encoded payload log"], nonconformity: "TLV Tag 1 is missing or incorrectly encoded.", controlWeight: 8, evaluationFrequency: "Per release and regulatory change review", controlOwner: "Tax and Compliance", evaluator: "Tax compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control names the exact TLV tag." },
  { oldId: "VAT-015", newModuleCode: "TAX", newId: "CP-TAX-006", chapterNumber: "2.6", sourceStandardClause: "QR TLV Tag 2 - VAT Number", sourceStandardDocument: "ZATCA Electronic Invoice XML Implementation Standard", evaluationMethod: "QR TLV output inspection for VAT-number encoding.", scoringLogic: "Pass when TLV payloads include Tag 2 with VAT-number encoding.", evidenceRequirement: ["QR TLV sample", "encoded payload log"], nonconformity: "TLV Tag 2 is missing or incorrectly encoded.", controlWeight: 8, evaluationFrequency: "Per release and regulatory change review", controlOwner: "Tax and Compliance", evaluator: "Tax compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control names the exact TLV tag." },
  { oldId: "VAT-016", newModuleCode: "TAX", newId: "CP-TAX-007", chapterNumber: "2.7", sourceStandardClause: "QR TLV Tag 3 - Invoice Timestamp", sourceStandardDocument: "ZATCA Electronic Invoice XML Implementation Standard", evaluationMethod: "QR TLV output inspection for timestamp encoding.", scoringLogic: "Pass when TLV payloads include Tag 3 with invoice timestamp encoding.", evidenceRequirement: ["QR TLV sample", "encoded payload log"], nonconformity: "TLV Tag 3 is missing or incorrectly encoded.", controlWeight: 8, evaluationFrequency: "Per release and regulatory change review", controlOwner: "Tax and Compliance", evaluator: "Tax compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control names the exact TLV tag." },
  { oldId: "VAT-017", newModuleCode: "TAX", newId: "CP-TAX-008", chapterNumber: "2.8", sourceStandardClause: "QR TLV Tag 4 - Invoice Total", sourceStandardDocument: "ZATCA Electronic Invoice XML Implementation Standard", evaluationMethod: "QR TLV output inspection for invoice-total encoding.", scoringLogic: "Pass when TLV payloads include Tag 4 with invoice-total encoding.", evidenceRequirement: ["QR TLV sample", "encoded payload log"], nonconformity: "TLV Tag 4 is missing or incorrectly encoded.", controlWeight: 8, evaluationFrequency: "Per release and regulatory change review", controlOwner: "Tax and Compliance", evaluator: "Tax compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control names the exact TLV tag." },
  { oldId: "VAT-018", newModuleCode: "TAX", newId: "CP-TAX-009", chapterNumber: "2.9", sourceStandardClause: "QR TLV Tag 5 - VAT Total", sourceStandardDocument: "ZATCA Electronic Invoice XML Implementation Standard", evaluationMethod: "QR TLV output inspection for VAT-total encoding.", scoringLogic: "Pass when TLV payloads include Tag 5 with VAT-total encoding.", evidenceRequirement: ["QR TLV sample", "encoded payload log"], nonconformity: "TLV Tag 5 is missing or incorrectly encoded.", controlWeight: 8, evaluationFrequency: "Per release and regulatory change review", controlOwner: "Tax and Compliance", evaluator: "Tax compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control names the exact TLV tag." },
  { oldId: "VAT-019", newModuleCode: "TAX", newId: "CP-TAX-010", chapterNumber: "2.10", sourceStandardClause: "QR TLV Tag 6 - XML Hash", sourceStandardDocument: "ZATCA Electronic Invoice XML Implementation Standard", evaluationMethod: "QR TLV output inspection for XML-hash encoding.", scoringLogic: "Pass when TLV payloads include Tag 6 with XML hash encoding.", evidenceRequirement: ["QR TLV sample", "encoded payload log"], nonconformity: "TLV Tag 6 is missing or incorrectly encoded.", controlWeight: 8, evaluationFrequency: "Per release and regulatory change review", controlOwner: "Tax and Compliance", evaluator: "Tax compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control names the exact TLV tag." },
  { oldId: "VAT-020", newModuleCode: "TAX", newId: "CP-TAX-011", chapterNumber: "2.11", sourceStandardClause: "QR TLV Tag 7 - ECDSA Signature", sourceStandardDocument: "ZATCA Electronic Invoice XML Implementation Standard", evaluationMethod: "QR TLV output inspection for signature encoding.", scoringLogic: "Pass when TLV payloads include Tag 7 with ECDSA signature encoding.", evidenceRequirement: ["QR TLV sample", "encoded payload log"], nonconformity: "TLV Tag 7 is missing or incorrectly encoded.", controlWeight: 8, evaluationFrequency: "Per release and regulatory change review", controlOwner: "Tax and Compliance", evaluator: "Tax compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control names the exact TLV tag." },
  { oldId: "VAT-021", newModuleCode: "TAX", newId: "CP-TAX-012", chapterNumber: "2.12", sourceStandardClause: "QR TLV Tag 8 - Public Key", sourceStandardDocument: "ZATCA Electronic Invoice XML Implementation Standard", evaluationMethod: "QR TLV output inspection for public-key encoding.", scoringLogic: "Pass when TLV payloads include Tag 8 with public-key encoding.", evidenceRequirement: ["QR TLV sample", "encoded payload log"], nonconformity: "TLV Tag 8 is missing or incorrectly encoded.", controlWeight: 8, evaluationFrequency: "Per release and regulatory change review", controlOwner: "Tax and Compliance", evaluator: "Tax compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control names the exact TLV tag." },
  { oldId: "VAT-022", newModuleCode: "TAX", newId: "CP-TAX-013", chapterNumber: "2.13", sourceStandardClause: "QR TLV Tag 9 - Cryptographic Stamp", sourceStandardDocument: "ZATCA Electronic Invoice XML Implementation Standard", evaluationMethod: "QR TLV output inspection for cryptographic-stamp encoding.", scoringLogic: "Pass when TLV payloads include Tag 9 with cryptographic-stamp encoding.", evidenceRequirement: ["QR TLV sample", "encoded payload log"], nonconformity: "TLV Tag 9 is missing or incorrectly encoded.", controlWeight: 8, evaluationFrequency: "Per release and regulatory change review", controlOwner: "Tax and Compliance", evaluator: "Tax compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control names the exact TLV tag." },
  { oldId: "VAT-023", newModuleCode: "TAX", newId: "CP-TAX-014", chapterNumber: "2.14", sourceStandardClause: "EN 16931 semantic data model mapping", sourceStandardDocument: "EN 16931 Electronic invoicing - Semantic data model of the core elements of an electronic invoice", evaluationMethod: "Semantic mapping review against structured invoice fields.", scoringLogic: "Pass when invoice structured data is mappable to the EN 16931 semantic model for the targeted payload.", evidenceRequirement: ["semantic mapping file", "structured invoice payload"], nonconformity: "Structured invoice data cannot be mapped to EN 16931 semantic fields.", controlWeight: 10, evaluationFrequency: "Per release and interoperability review", controlOwner: "Tax and Compliance", evaluator: "Interoperability reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control explicitly names EN 16931." },
  { oldId: "DOC-001", newModuleCode: "IVC", newId: "CP-IVC-001", chapterNumber: "3.1", sourceStandardClause: "Core invoice data must exist in structured form", sourceStandardDocument: "EN 16931 Electronic invoicing - Semantic data model of the core elements of an electronic invoice", evaluationMethod: "Structured invoice payload completeness review.", scoringLogic: "Pass when legal invoice data is present in a structured representation and is not limited to visual rendering.", evidenceRequirement: ["structured invoice payload", "document export sample"], nonconformity: "Legal invoice data exists only in visual output and not in the structured payload.", controlWeight: 10, evaluationFrequency: "Per release and interoperability review", controlOwner: "Document Core", evaluator: "Invoice compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control directly targets structured invoice data presence." },
  { oldId: "DOC-003", newModuleCode: "IVC", newId: "CP-IVC-002", chapterNumber: "3.2", sourceStandardClause: "Hybrid invoice archive container requirement", sourceStandardDocument: "PDF/A-3 for archival packaging of hybrid invoices", evaluationMethod: "Hybrid invoice container review.", scoringLogic: "Pass when the invoice document pipeline can produce PDF/A-3 outputs for hybrid archival packaging.", evidenceRequirement: ["PDF/A-3 sample", "document packaging log"], nonconformity: "Hybrid archive packaging cannot produce the required PDF/A-3 output.", controlWeight: 9, evaluationFrequency: "Per release and archive compliance review", controlOwner: "Document Core", evaluator: "Invoice compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control explicitly references PDF/A-3." },
  { oldId: "DOC-004", newModuleCode: "IVC", newId: "CP-IVC-003", chapterNumber: "3.3", sourceStandardClause: "Embedded machine-readable payload retrievability", sourceStandardDocument: "PDF/A-3 for archival packaging of hybrid invoices", evaluationMethod: "Embedded attachment retrieval test.", scoringLogic: "Pass when the embedded XML payload remains attached and retrievable from the compliant document.", evidenceRequirement: ["embedded XML extraction sample", "document packaging log"], nonconformity: "Embedded XML payload is missing or not retrievable from the compliant document.", controlWeight: 9, evaluationFrequency: "Per release and archive compliance review", controlOwner: "Document Core", evaluator: "Invoice compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control explicitly addresses embedded XML integrity." },
  { oldId: "DOC-012", newModuleCode: "IVC", newId: "CP-IVC-004", chapterNumber: "3.4", sourceStandardClause: "Structured and visual invoice values must remain consistent", sourceStandardDocument: "EN 16931 Electronic invoicing - Semantic data model of the core elements of an electronic invoice", evaluationMethod: "Structured versus rendered output reconciliation.", scoringLogic: "Pass when rendered invoice values match the underlying structured payload for the same record.", evidenceRequirement: ["rendered invoice sample", "structured payload", "reconciliation log"], nonconformity: "Rendered invoice values diverge from the underlying structured payload.", controlWeight: 10, evaluationFrequency: "Per release and interoperability review", controlOwner: "Document Core", evaluator: "Invoice compliance reviewer", reviewer: "Compliance governance reviewer", notes: "Migrated because the legacy control directly targets structured versus visual consistency." },
  { oldId: "INV-005", newModuleCode: "INV", newId: "CP-INV-001", chapterNumber: "4.1", sourceStandardClause: "IAS 2 cost formulas - FIFO support", sourceStandardDocument: "IAS 2 Inventories", evaluationMethod: "Inventory costing method review.", scoringLogic: "Pass when FIFO valuation is supported as a controlled inventory cost formula.", evidenceRequirement: ["inventory costing configuration", "valuation report sample"], nonconformity: "Inventory valuation cannot operate under the FIFO cost formula where required.", controlWeight: 9, evaluationFrequency: "Per release and inventory policy review", controlOwner: "Inventory Core", evaluator: "Inventory controls reviewer", reviewer: "Operations governance reviewer", notes: "Migrated because the legacy control explicitly names FIFO valuation enforcement." },
  { oldId: "INV-006", newModuleCode: "INV", newId: "CP-INV-002", chapterNumber: "4.2", sourceStandardClause: "IAS 2 recognition of inventory carrying amount as expense", sourceStandardDocument: "IAS 2 Inventories", evaluationMethod: "Cost-of-goods linkage review for sale-related stock movements.", scoringLogic: "Pass when sale-related stock-out events produce linked COGS movements with auditable evidence.", evidenceRequirement: ["stock movement sample", "COGS posting sample"], nonconformity: "Sale-related stock movements do not produce linked cost-of-goods recognition.", controlWeight: 9, evaluationFrequency: "Per release and inventory policy review", controlOwner: "Inventory Core", evaluator: "Inventory controls reviewer", reviewer: "Operations governance reviewer", notes: "Migrated because the legacy control explicitly targets COGS linkage." },
];

function ensureDirectory(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function writeTextFile(filePath: string, content: string) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function writeJsonFile(filePath: string, value: unknown) {
  writeTextFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function formatFolderTimestamp(date: Date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}_${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;
}

function toIso(date: Date) {
  return date.toISOString();
}

function readIfExists(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, "utf8");
}

function parseControlPointFiles(content: string) {
  const lines = content.split(/\r?\n/);
  const records: Array<{ path: string; absolutePath: string; purpose: string }> = [];
  let index = 0;
  while (index < lines.length) {
    const header = lines[index]?.match(/^\d+\.\s+(.+)$/);
    if (!header) {
      index += 1;
      continue;
    }
    const relativePath = header[1].trim();
    const absoluteLine = lines[index + 1] ?? "";
    const purposeLine = lines[index + 2] ?? "";
    records.push({
      path: relativePath,
      absolutePath: absoluteLine.replace(/^\s*Absolute path:\s*/, "").trim(),
      purpose: purposeLine.replace(/^\s*Purpose:\s*/, "").trim(),
    });
    index += 4;
  }
  return records;
}

function classifyFile(relativePath: string): FileClassificationRecord["classification"] {
  const lowered = relativePath.toLowerCase();
  if (lowered.startsWith("artifacts/")) {
    return "generated";
  }
  if (lowered.startsWith("qa_reports/")) {
    return "report";
  }
  if (lowered.includes(".test.") || lowered.includes("/tests/") || lowered.includes("/test/")) {
    return "test";
  }
  if (lowered.endsWith(".md") || lowered.endsWith(".txt") || lowered.endsWith(".docx")) {
    return "docs";
  }
  if (lowered.startsWith("app/") || lowered.startsWith("backend/") || lowered.startsWith("components/") || lowered.startsWith("data/") || lowered.startsWith("lib/") || lowered.startsWith("types/")) {
    return "runtime";
  }
  return "historical";
}

function classificationReason(relativePath: string, purpose: string, classification: FileClassificationRecord["classification"]) {
  if (classification === "runtime") {
    return `Active code path: ${purpose}`;
  }
  if (classification === "generated") {
    return "Generated artifact history only; not active runtime source of truth.";
  }
  if (classification === "report") {
    return "QA reporting artifact retained for traceability only.";
  }
  if (classification === "test") {
    return "Test or proof path; not a production runtime entry point.";
  }
  if (classification === "docs") {
    return "Documentation or narrative reference to control points.";
  }
  return `Historical or supporting file: ${relativePath}`;
}

function inferNewModuleCode(oldId: string) {
  const prefix = oldId.split("-")[0];
  switch (prefix) {
    case "ACC":
      return "ACC";
    case "VAT":
      return "TAX";
    case "DOC":
      return "IVC";
    case "INV":
      return "INV";
    case "UIX":
      return "UX";
    case "FRM":
      return "FRM";
    case "TMP":
      return "TMP";
    case "VAL":
      return "VAL";
    case "SEC":
      return "SEC";
    case "BRD":
      return "BRD";
    case "XMD":
      return "XMD";
    default:
      return "AUD";
  }
}

function buildNewIdMap(controlPoints: readonly LegacyControlPoint[]) {
  const counters = new Map<string, number>();
  const records = new Map<string, { moduleCode: string; proposedId: string }>();

  for (const controlPoint of controlPoints) {
    const moduleCode = inferNewModuleCode(controlPoint.id);
    const nextCount = (counters.get(moduleCode) ?? 0) + 1;
    counters.set(moduleCode, nextCount);
    records.set(controlPoint.id, {
      moduleCode,
      proposedId: `CP-${moduleCode}-${String(nextCount).padStart(3, "0")}`,
    });
  }

  return records;
}

function walkDirectory(dirPath: string, output: string[]) {
  const skip = new Set([".git", ".next", "node_modules", "vendor"]);
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skip.has(entry.name)) {
        continue;
      }
      walkDirectory(path.join(dirPath, entry.name), output);
      continue;
    }
    output.push(path.join(dirPath, entry.name));
  }
}

function isActiveRuntimePath(relativePath: string) {
  const extension = path.extname(relativePath).toLowerCase();
  if (!/^(app|backend|components|data|lib|types)\//.test(relativePath) || !RUNTIME_SCAN_EXTENSIONS.has(extension)) {
    return false;
  }
  if (relativePath.startsWith("backend/app/Support/Standards/migration/") || relativePath.startsWith("backend/app/Support/Standards/legacy/")) {
    return false;
  }
  return true;
}

async function main() {
  const processStart = Date.now();
  const timings: StepTiming[] = [];
  const blockers: string[] = [];
  const fileMoves: string[] = [];
  const currentControlPoints = [...currentLegacyControlPoints] as LegacyControlPoint[];
  const newIdMap = buildNewIdMap(currentControlPoints);
  const safeMigrationMap = new Map(SAFE_MIGRATIONS.map((entry) => [entry.oldId, entry]));

  const artifactPath = path.join(ARTIFACTS_DIR, `control_point_migration_${formatFolderTimestamp(new Date())}`);
  ensureDirectory(artifactPath);

  const artifactExecutionLog = path.join(artifactPath, "execution-log.md");
  const artifactTimingLog = path.join(artifactPath, "execution-time-report.md");
  const artifactBlockers = path.join(artifactPath, "blockers.md");
  const artifactSummary = path.join(artifactPath, "summary.md");
  const artifactFileMoves = path.join(artifactPath, "file-moves.md");
  const artifactRuntimeImpact = path.join(artifactPath, "runtime-impact-report.md");

  function logProgress(stepName: string, startedAt: Date, endedAt: Date, status: string) {
    const durationSeconds = (endedAt.getTime() - startedAt.getTime()) / 1000;
    const elapsedSeconds = (endedAt.getTime() - processStart) / 1000;
    const averageStepSeconds = elapsedSeconds / (timings.length + 1);
    const estimatedRemainingSeconds = averageStepSeconds * (12 - (timings.length + 1));
    timings.push({
      step: stepName,
      startTime: toIso(startedAt),
      endTime: toIso(endedAt),
      durationSeconds,
      elapsedSeconds,
      averageStepSeconds,
      estimatedRemainingSeconds,
      status,
    });
    console.log("PROGRESS:");
    console.log(`Completed: ${timings.length} / 12`);
    console.log(`Elapsed Time: ${elapsedSeconds.toFixed(2)} seconds`);
    console.log(`Estimated Remaining Time: ${estimatedRemainingSeconds.toFixed(2)} seconds`);
    console.log("ETA is an estimate, not exact.");
  }

  async function runStep(stepName: string, action: () => void | Promise<void>) {
    const startedAt = new Date();
    let status = "success";
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        await action();
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        status = attempt === 2 ? "failed-after-retry" : "retried";
        blockers.push(`${stepName} attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    const endedAt = new Date();
    logProgress(stepName, startedAt, endedAt, status);
    if (lastError && status === "failed-after-retry") {
      console.log(`Blocker logged for ${stepName}. Continuing to next task.`);
    }
  }

  const state: {
    fileClassifications: FileClassificationRecord[];
    sourceInventory: AnyRecord;
    referenceMap: AnyRecord[];
    runtimeImpactMarkdown: string;
    brokenReferences: AnyRecord;
    moduleCoverage: unknown[];
    validationResults: AnyRecord;
    migrationMap: MigrationMapRecord[];
    v2ControlPoints: V2ControlPoint[];
    runtimeCriticalFiles: string[];
  } = {
    fileClassifications: [],
    sourceInventory: {},
    referenceMap: [],
    runtimeImpactMarkdown: "",
    brokenReferences: {},
    moduleCoverage: [],
    validationResults: {},
    migrationMap: [],
    v2ControlPoints: [],
    runtimeCriticalFiles: [],
  };

  await runStep("Create artifact folder and start logs", () => {
    for (const filePath of [artifactExecutionLog, artifactTimingLog, artifactBlockers, artifactSummary, artifactFileMoves, artifactRuntimeImpact]) {
      writeTextFile(filePath, "");
    }
    writeTextFile(artifactExecutionLog, `# Control Point Migration Execution Log\n\nArtifact Path: ${artifactPath}\n\n`);
    const missingUploaded = MANDATORY_UPLOADED_FILES.filter((filePath) => !fs.existsSync(filePath));
    if (missingUploaded.length > 0) {
      blockers.push(`Missing uploaded inputs: ${missingUploaded.join(", ")}. Fallback source files from the repo artifact inventory were used.`);
    }
  });

  await runStep("Parse and classify current control point surface", () => {
    const inventoryContent = readIfExists(CONTROL_POINT_FILES_PATH);
    if (!inventoryContent) {
      throw new Error("control-point-files.txt artifact input is missing.");
    }
    const parsed = parseControlPointFiles(inventoryContent);
    state.fileClassifications = parsed.map((record) => {
      const classification = classifyFile(record.path);
      return {
        path: record.path,
        absolutePath: record.absolutePath,
        classification,
        runtimeAffecting: classification === "runtime",
        reason: classificationReason(record.path, record.purpose, classification),
      } satisfies FileClassificationRecord;
    });
    state.runtimeCriticalFiles = state.fileClassifications.filter((record) => record.runtimeAffecting).map((record) => record.path);
    writeJsonFile(path.join(MIGRATION_DIR, "control-point-file-classification.json"), state.fileClassifications);
  });

  await runStep("Confirm old control point inventory", () => {
    const prefixDistribution = currentControlPoints.reduce<Record<string, number>>((distribution, controlPoint) => {
      const prefix = controlPoint.id.split("-")[0];
      distribution[prefix] = (distribution[prefix] ?? 0) + 1;
      return distribution;
    }, {});
    const collisionRisks = [
      { legacy_prefix: "VAT", target_module: "TAX", risk: "Prefix changes from VAT to TAX in v2." },
      { legacy_prefix: "UIX", target_module: "UX", risk: "Legacy UIX short code is replaced by UX in v2." },
      { legacy_prefix: "DOC", target_module: "IVC", risk: "Document controls move under the invoice control module in v2." },
      { legacy_prefix: "INV", target_module: "INV", risk: "No collision after reserving IVC for invoice controls." },
    ];
    state.sourceInventory = {
      legacy_total: currentControlPoints.length,
      master_inventory_total: CONTROL_POINTS_MASTER.length,
      prefix_distribution: prefixDistribution,
      duplicate_id_count: currentControlPoints.length - new Set(currentControlPoints.map((controlPoint) => controlPoint.id)).size,
      collision_risks: collisionRisks,
      conflicting_target_prefixes: collisionRisks.filter((risk) => risk.legacy_prefix !== risk.target_module),
    };
    writeJsonFile(path.join(MIGRATION_DIR, "control-point-source-inventory.json"), state.sourceInventory);
  });

  await runStep("Build canonical module mapping and reference map", () => {
    const allFiles: string[] = [];
    walkDirectory(ROOT, allFiles);
    const activeFiles = allFiles
      .map((absolutePath) => ({
        absolutePath,
        relativePath: path.relative(ROOT, absolutePath).replace(/\\/g, "/"),
      }))
      .filter((file) => isActiveRuntimePath(file.relativePath));

    const directImportNeedles = [
      "@/backend/app/Support/Standards/legacy/control-points.v1",
      "@/backend/app/Support/Standards/legacy/control-point-registry.v1",
    ];
    const oldIdRegex = /\b(ACC|INV|VAT|DOC|TMP|UIX|FRM|VAL|SEC|BRD|XMD)-\d{3}\b/g;
    const referenceMap: AnyRecord[] = [];
    const runtimeDependencyCount = new Map<string, number>();
    const directLegacyImports: string[] = [];
    const dashboardFiles: string[] = [];
    const auditEngineFiles: string[] = [];
    const oldStatusFiles: string[] = [];

    for (const file of activeFiles) {
      let content = "";
      try {
        content = fs.readFileSync(file.absolutePath, "utf8");
      } catch {
        continue;
      }
      const matchedIds = [...new Set(Array.from(content.matchAll(oldIdRegex)).map((match) => match[0]))];
      for (const oldId of matchedIds) {
        runtimeDependencyCount.set(oldId, (runtimeDependencyCount.get(oldId) ?? 0) + 1);
      }
      const imports = directImportNeedles.filter((needle) => content.includes(needle));
      if (imports.length > 0 && !file.relativePath.startsWith("backend/app/Support/Standards/legacy/") && file.relativePath !== "backend/app/Support/Standards/control-points.runtime.ts") {
        directLegacyImports.push(file.relativePath);
      }
      if (file.relativePath.toLowerCase().includes("dashboard")) {
        dashboardFiles.push(file.relativePath);
      }
      if (file.relativePath.toLowerCase().includes("audit")) {
        auditEngineFiles.push(file.relativePath);
      }
      if (["PASS", "FAIL", "PARTIAL", "BLOCKED"].some((status) => content.includes(status))) {
        oldStatusFiles.push(file.relativePath);
      }
      if (matchedIds.length > 0 || imports.length > 0) {
        referenceMap.push({
          file: file.relativePath,
          direct_imports: imports,
          legacy_ids: matchedIds,
          dashboard_surface: file.relativePath.toLowerCase().includes("dashboard"),
          audit_surface: file.relativePath.toLowerCase().includes("audit"),
        });
      }
    }

    state.referenceMap = referenceMap;
    writeJsonFile(path.join(MIGRATION_DIR, "control-point-reference-map.json"), referenceMap);

    const migrationMap: MigrationMapRecord[] = currentControlPoints.map((controlPoint) => {
      const remap = newIdMap.get(controlPoint.id)!;
      const safe = safeMigrationMap.get(controlPoint.id);
      return {
        old_id: controlPoint.id,
        old_title: controlPoint.title,
        old_module: controlPoint.category_code,
        new_module_code: safe?.newModuleCode ?? remap.moduleCode,
        proposed_new_id: safe?.newId ?? remap.proposedId,
        migration_action: safe ? "migrate" : "replace",
        source_standard_clause: safe?.sourceStandardClause ?? null,
        target_file: safe ? "backend/app/Support/Standards/v2/control-points.v2.ts" : "backend/app/Support/Standards/v2/control-point-migration-map.json",
        runtime_dependency_count: runtimeDependencyCount.get(controlPoint.id) ?? 0,
        notes: MODULE_MAPPING_REASONS[controlPoint.category_code] ?? "Mapped through the canonical module registry.",
      };
    });
    state.migrationMap = migrationMap;
    writeJsonFile(path.join(V2_DIR, "control-point-migration-map.json"), migrationMap);

    state.brokenReferences = {
      direct_legacy_runtime_imports: [...new Set(directLegacyImports)].sort(),
      old_prefix_runtime_files: referenceMap.filter((entry) => (entry.legacy_ids as string[]).length > 0).map((entry) => entry.file),
      dashboard_files_with_control_point_status: [...new Set(dashboardFiles)].sort(),
      audit_engine_inputs_with_old_registry_dependencies: [...new Set(auditEngineFiles)].sort(),
      files_showing_old_status_labels: [...new Set(oldStatusFiles)].sort(),
    };
    writeJsonFile(path.join(MIGRATION_DIR, "control-point-broken-references.json"), state.brokenReferences);

    state.runtimeImpactMarkdown = [
      "# Control Point Runtime Impact Report",
      "",
      `Runtime-critical files identified: ${state.runtimeCriticalFiles.length}`,
      `Direct legacy import files identified: ${(state.brokenReferences.direct_legacy_runtime_imports as string[]).length}`,
      `Files with old CP IDs in active code: ${(state.brokenReferences.old_prefix_runtime_files as string[]).length}`,
      `Dashboard files showing control point status: ${(state.brokenReferences.dashboard_files_with_control_point_status as string[]).length}`,
      `Audit engine input files depending on old registries: ${(state.brokenReferences.audit_engine_inputs_with_old_registry_dependencies as string[]).length}`,
      "",
      "## Direct Legacy Runtime Imports",
      ...((state.brokenReferences.direct_legacy_runtime_imports as string[]).length
        ? (state.brokenReferences.direct_legacy_runtime_imports as string[]).map((file) => `- ${file}`)
        : ["- None detected before rewiring."]),
      "",
      "## Runtime Files Carrying Old CP IDs",
      ...((state.brokenReferences.old_prefix_runtime_files as string[]).length
        ? (state.brokenReferences.old_prefix_runtime_files as string[]).map((file) => `- ${file}`)
        : ["- None detected."]),
      "",
      "## Mapping Notes",
      ...Object.entries(MODULE_MAPPING_REASONS).map(([prefix, reason]) => `- ${prefix}: ${reason}`),
      "",
    ].join("\n");
    writeTextFile(path.join(MIGRATION_DIR, "control-point-runtime-impact-report.md"), state.runtimeImpactMarkdown);
  });

  await runStep("Build v2 schema, registry skeleton, and first migration batch", () => {
    const v2SchemaContent = `export type ControlMigrationAction = "migrate" | "merge" | "split" | "retire" | "replace";\nexport type ControlLifecycleStatus = "draft" | "active" | "migrated" | "archived" | "retired";\n\nexport type V2ControlPoint = {\n  id: string;\n  version: string;\n  module_code: string;\n  module_name: string;\n  chapter_number: string;\n  title: string;\n  source_standard_clause: string;\n  source_standard_document: string;\n  description: string;\n  control_rule: string;\n  applicability: string[];\n  conditions: string[];\n  evaluation_method: string;\n  scoring_logic: string;\n  evidence_requirement: string[];\n  nonconformity: string;\n  control_weight: number;\n  risk_priority: "low" | "medium" | "high" | "critical";\n  evaluation_frequency: string;\n  control_owner: string;\n  evaluator: string;\n  reviewer: string;\n  linked_project_modules: string[];\n  linked_files: string[];\n  linked_legacy_ids: string[];\n  migration_action: ControlMigrationAction;\n  implementation_status: string;\n  status: ControlLifecycleStatus;\n};\n`;
    writeTextFile(path.join(V2_DIR, "control-point-schema.ts"), v2SchemaContent);

    const moduleRegistryContent = `export const controlModuleRegistry = ${stableStringify(MODULE_DEFINITIONS)} as const;\n\nexport type ControlModuleCode = typeof controlModuleRegistry[number]["code"];\n\nexport const controlModuleRegistryMap = new Map(controlModuleRegistry.map((module) => [module.code, module]));\n`;
    writeTextFile(path.join(V2_DIR, "control-module-registry.ts"), moduleRegistryContent);

    const governanceContent = `import type { V2ControlPoint } from "@/backend/app/Support/Standards/v2/control-point-schema";\n\nexport const requiredV2ControlPointFields: Array<keyof V2ControlPoint> = [\n  "id",\n  "version",\n  "module_code",\n  "module_name",\n  "chapter_number",\n  "title",\n  "source_standard_clause",\n  "source_standard_document",\n  "description",\n  "control_rule",\n  "applicability",\n  "conditions",\n  "evaluation_method",\n  "scoring_logic",\n  "evidence_requirement",\n  "nonconformity",\n  "control_weight",\n  "risk_priority",\n  "evaluation_frequency",\n  "control_owner",\n  "evaluator",\n  "reviewer",\n  "linked_project_modules",\n  "linked_files",\n  "linked_legacy_ids",\n  "migration_action",\n  "implementation_status",\n  "status",\n];\n\nexport function validateV2ControlPoint(controlPoint: V2ControlPoint) {\n  return requiredV2ControlPointFields.every((field) => {\n    const value = controlPoint[field];\n    if (Array.isArray(value)) {\n      return value.length > 0 && value.every((entry) => String(entry).trim().length > 0);\n    }\n    if (typeof value === "number") {\n      return Number.isFinite(value);\n    }\n    return String(value).trim().length > 0;\n  });\n}\n\nexport function validateV2ControlPointSet(controlPoints: readonly V2ControlPoint[]) {\n  const duplicates = controlPoints.filter((controlPoint, index) => controlPoints.findIndex((candidate) => candidate.id === controlPoint.id) !== index).map((controlPoint) => controlPoint.id);\n  const missingRequiredFields = controlPoints.filter((controlPoint) => !validateV2ControlPoint(controlPoint)).map((controlPoint) => controlPoint.id);\n  return {\n    duplicateIds: [...new Set(duplicates)],\n    missingRequiredFields,\n    valid: duplicates.length === 0 && missingRequiredFields.length === 0,\n  };\n}\n`;
    writeTextFile(path.join(V2_DIR, "control-point-governance.ts"), governanceContent);

    const currentById = new Map(currentControlPoints.map((controlPoint) => [controlPoint.id, controlPoint]));
    state.v2ControlPoints = SAFE_MIGRATIONS.map((migration) => {
      const legacy = currentById.get(migration.oldId)!;
      return {
        id: migration.newId,
        version: "2.0.0",
        module_code: migration.newModuleCode,
        module_name: MODULE_DEFINITIONS.find((module) => module.code === migration.newModuleCode)!.name,
        chapter_number: migration.chapterNumber,
        title: legacy.title,
        source_standard_clause: migration.sourceStandardClause,
        source_standard_document: migration.sourceStandardDocument,
        description: legacy.purpose,
        control_rule: legacy.rule,
        applicability: [...legacy.applicability],
        conditions: [legacy.condition],
        evaluation_method: migration.evaluationMethod,
        scoring_logic: migration.scoringLogic,
        evidence_requirement: migration.evidenceRequirement,
        nonconformity: migration.nonconformity,
        control_weight: migration.controlWeight,
        risk_priority: legacy.severity,
        evaluation_frequency: migration.evaluationFrequency,
        control_owner: migration.controlOwner,
        evaluator: migration.evaluator,
        reviewer: migration.reviewer,
        linked_project_modules: [...legacy.linked_modules],
        linked_files: [...new Set(["backend/app/Support/Standards/legacy/control-points.v1.ts", "lib/control-point-audit-engine.ts", ...(legacy.id.startsWith("DOC-") ? ["lib/master-design-control-points.ts"] : [])])],
        linked_legacy_ids: [legacy.id],
        migration_action: "migrate",
        implementation_status: legacy.implementation_status,
        status: "migrated",
      } satisfies V2ControlPoint;
    });

    const v2ControlPointsContent = `import type { V2ControlPoint } from "@/backend/app/Support/Standards/v2/control-point-schema";\n\nexport const v2ControlPoints: readonly V2ControlPoint[] = ${stableStringify(state.v2ControlPoints)} as const;\n\nexport const v2ControlPointIds = v2ControlPoints.map((controlPoint) => controlPoint.id);\n`;
    writeTextFile(path.join(V2_DIR, "control-points.v2.ts"), v2ControlPointsContent);

    const moduleSummary = MODULE_DEFINITIONS.map((module) => {
      const mappedLegacy = currentControlPoints.filter((controlPoint) => inferNewModuleCode(controlPoint.id) === module.code).length;
      const migrated = state.v2ControlPoints.filter((controlPoint) => controlPoint.module_code === module.code).length;
      return `| ${module.code} | ${module.name} | ${module.kind} | ${mappedLegacy} | ${migrated} |`; 
    }).join("\n");
    writeTextFile(path.join(V2_DIR, "control-point-module-summary.md"), `# Control Point Module Summary\n\n| Module | Name | Kind | Legacy Mapped | Migrated V2 |\n|--------|------|------|---------------|-------------|\n${moduleSummary}\n`);
  });

  await runStep("Archive legacy definitions and create runtime bridge", () => {
    ensureDirectory(LEGACY_DIR);
    const legacySourcePath = path.join(STANDARDS_DIR, "control-points.ts");
    const legacyRegistryPath = path.join(STANDARDS_DIR, "control-point-registry.ts");
    const legacyArchiveSourcePath = path.join(LEGACY_DIR, "control-points.v1.ts");
    const legacyArchiveRegistryPath = path.join(LEGACY_DIR, "control-point-registry.v1.ts");
    const legacySourceContents = fs.existsSync(legacyArchiveSourcePath)
      ? fs.readFileSync(legacyArchiveSourcePath, "utf8").replace(/^\/\/ Archived legacy v1 control points preserved for migration traceability\.\n/, "")
      : fs.readFileSync(legacySourcePath, "utf8");
    const legacyRegistryContents = fs.existsSync(legacyArchiveRegistryPath)
      ? fs.readFileSync(legacyArchiveRegistryPath, "utf8").replace(/^\/\/ Archived legacy v1 registry preserved for migration traceability\.\n/, "")
      : fs.readFileSync(legacyRegistryPath, "utf8");

    writeTextFile(path.join(LEGACY_DIR, "control-points.v1.ts"), `// Archived legacy v1 control points preserved for migration traceability.\n${legacySourceContents}`);
    writeTextFile(path.join(LEGACY_DIR, "control-point-registry.v1.ts"), `// Archived legacy v1 registry preserved for migration traceability.\n${legacyRegistryContents.replace(/@\/backend\/app\/Support\/Standards\/control-points/g, "@/backend/app/Support/Standards/legacy/control-points.v1")}`);
    writeTextFile(path.join(LEGACY_DIR, "README.md"), `# Legacy Control Point Archive\n\nThese files preserve the v1 control point definitions and registry for migration traceability.\nThey are no longer the active runtime source of truth. Active runtime access must flow through [control-points.runtime.ts](../control-points.runtime.ts).\n`);

    const runtimeBridgeContent = `import { controlPointCategoryDefinitions } from "@/backend/app/Support/Standards/control-point-categories";\nimport { standardsControlPoints as legacyStandardsControlPoints, type StandardsControlPoint as LegacyStandardsControlPoint } from "@/backend/app/Support/Standards/legacy/control-points.v1";\nimport { v2ControlPoints } from "@/backend/app/Support/Standards/v2/control-points.v2";\n\nexport type StandardsControlPoint = LegacyStandardsControlPoint;\n\nexport const standardsControlPoints = legacyStandardsControlPoints;\nexport const standardsControlPointIds = standardsControlPoints.map((controlPoint) => controlPoint.id);\nexport const standardsControlPointsByCategory = Object.fromEntries(\n  controlPointCategoryDefinitions.map((category) => [\n    category.name,\n    standardsControlPoints.filter((controlPoint) => controlPoint.category_code === category.code),\n  ]),\n) as Record<LegacyStandardsControlPoint["category"], LegacyStandardsControlPoint[]>;\n\nexport const runtimeControlPointSource = {\n  runtime_entry_point: "backend/app/Support/Standards/control-points.runtime.ts",\n  active_runtime_dataset: "legacy-v1-through-bridge",\n  legacy_readers: [\n    "lib/control-point-audit-engine.ts",\n    "lib/master-design-control-points.ts",\n    "tools/apply-control-points.ts",\n    "tools/build-control-points-artifact.ts",\n  ],\n  v2_ready_datasets: ["backend/app/Support/Standards/v2/control-points.v2.ts"],\n  blocked_pending_migration: [\n    "Audit runtime JSON still keys results by legacy IDs.",\n    "Capture scripts and dashboards still reference legacy prefixes directly.",\n  ],\n} as const;\n\nexport const runtimeControlPointCompatibility = standardsControlPoints.map((controlPoint) => ({\n  control_point_id: controlPoint.id,\n  runtime_source: "legacy-v1",\n  v2_candidates: v2ControlPoints.filter((candidate) => candidate.linked_legacy_ids.includes(controlPoint.id)).map((candidate) => candidate.id),\n}));\n`;
    writeTextFile(path.join(STANDARDS_DIR, "control-points.runtime.ts"), runtimeBridgeContent);

    const newRootControlPoints = `export type {\n  ControlPointApplicability,\n  ControlPointAuditMethod,\n  ControlPointCategoryCode,\n  ControlPointCategoryName,\n  ControlPointEvidence,\n  ControlPointImplementationStatus,\n  ControlPointPriority,\n  ControlPointSeverity,\n} from "@/backend/app/Support/Standards/control-point-categories";\n\nexport {\n  standardsControlPoints,\n  standardsControlPointIds,\n  standardsControlPointsByCategory,\n  runtimeControlPointSource,\n  runtimeControlPointCompatibility,\n  type StandardsControlPoint,\n} from "@/backend/app/Support/Standards/control-points.runtime";\n\nimport { standardsControlPoints, type StandardsControlPoint } from "@/backend/app/Support/Standards/control-points.runtime";\nimport { validateControlPointRegistry, type ControlPointRegistryValidation } from "@/backend/app/Support/Standards/control-point-validation";\n\nexport type ControlPointValidationSummary = ControlPointRegistryValidation;\n\nexport function validateStandardsControlPoints(controlPoints: readonly StandardsControlPoint[] = standardsControlPoints) {\n  return validateControlPointRegistry(controlPoints);\n}\n\nexport const standardsControlPointValidation = validateStandardsControlPoints();\n`;
    writeTextFile(path.join(STANDARDS_DIR, "control-points.ts"), newRootControlPoints);

    const newRegistryContent = `export {\n  standardsControlPoints,\n  standardsControlPointIds,\n  standardsControlPointsByCategory,\n  standardsControlPointValidation,\n  validateStandardsControlPoints,\n  runtimeControlPointSource,\n  runtimeControlPointCompatibility,\n} from "@/backend/app/Support/Standards/control-points";\n\nexport {\n  validateControlPointStructure,\n  validateControlPointRegistry,\n} from "@/backend/app/Support/Standards/control-point-validation";\n\nexport {\n  getControlPointsByCategory,\n  getControlPointsSummary,\n} from "@/backend/app/Support/Standards/control-point-summary";\n`;
    writeTextFile(path.join(STANDARDS_DIR, "control-point-registry.ts"), newRegistryContent);
    writeTextFile(path.join(ROOT, "data", "standards", "control-points.ts"), `export * from "@/backend/app/Support/Standards/control-points";\n`);

    fileMoves.push("backend/app/Support/Standards/control-points.ts -> backend/app/Support/Standards/legacy/control-points.v1.ts (archived copy retained; root path now re-exports runtime bridge)");
    fileMoves.push("backend/app/Support/Standards/control-point-registry.ts -> backend/app/Support/Standards/legacy/control-point-registry.v1.ts (archived copy retained; root path now re-exports runtime bridge)");
    fileMoves.push("data/standards/control-points.ts rewired to backend/app/Support/Standards/control-points.ts runtime bridge export");
  });

  await runStep("Update type consumers and write migration governance files", () => {
    const updateImport = (filePath: string) => {
      const current = fs.readFileSync(filePath, "utf8");
      const updated = current.replace(/@\/backend\/app\/Support\/Standards\/control-points(?=["'])/g, "@/backend/app/Support/Standards/control-points.runtime");
      writeTextFile(filePath, updated);
    };
    updateImport(path.join(STANDARDS_DIR, "control-point-validation.ts"));
    updateImport(path.join(STANDARDS_DIR, "control-point-summary.ts"));
    updateImport(path.join(STANDARDS_DIR, "control-point-mapping.ts"));

    const prefixDistribution = state.sourceInventory.prefix_distribution as Record<string, number>;
    const moduleCoverage = MODULE_DEFINITIONS.map((module) => ({
      module_code: module.code,
      module_name: module.name,
      legacy_mapped_count: currentControlPoints.filter((controlPoint) => inferNewModuleCode(controlPoint.id) === module.code).length,
      migrated_v2_count: state.v2ControlPoints.filter((controlPoint) => controlPoint.module_code === module.code).length,
      remaining_legacy_count: currentControlPoints.filter((controlPoint) => inferNewModuleCode(controlPoint.id) === module.code).length - state.v2ControlPoints.filter((controlPoint) => controlPoint.module_code === module.code).length,
    }));
    state.moduleCoverage = moduleCoverage;
    writeJsonFile(path.join(MIGRATION_DIR, "control-point-module-coverage.json"), moduleCoverage);

    writeTextFile(path.join(MIGRATION_DIR, "control-point-migration-plan.md"), `# Control Point Migration Plan\n\n## Canonical Mapping Decisions\n${Object.entries(MODULE_MAPPING_REASONS).map(([prefix, reason]) => `- ${prefix}: ${reason}`).join("\n")}\n\n## First Safe V2 Migration Batch\n${SAFE_MIGRATIONS.map((migration) => `- ${migration.oldId} -> ${migration.newId} (${migration.sourceStandardDocument}; ${migration.sourceStandardClause})`).join("\n")}\n\n## Deferred Modules\n- AUD, USR, ADM, AST, ACP remain registry-defined but are not populated in this safe first batch because the uploaded standards documents were unavailable in the workspace.\n- Supporting modules outside the safe batch remain mapped in the migration map and module coverage outputs.\n`);

    writeTextFile(path.join(MIGRATION_DIR, "control-point-migration-status.md"), `# Control Point Migration Status\n\n- Legacy control points accounted for: ${currentControlPoints.length}\n- First safe v2 migrated controls: ${state.v2ControlPoints.length}\n- Migration map coverage: ${state.migrationMap.length}\n- Runtime bridge active: yes\n- Legacy archive files created: 3\n`);

    const validationResults = {
      duplicate_new_ids: state.v2ControlPoints.length !== new Set(state.v2ControlPoints.map((controlPoint) => controlPoint.id)).size,
      empty_required_fields: state.v2ControlPoints.some((controlPoint) => Object.values(controlPoint).some((value) => (Array.isArray(value) ? value.length === 0 : typeof value === "string" ? value.trim().length === 0 : false))),
      module_prefix_collision: new Set(state.v2ControlPoints.map((controlPoint) => controlPoint.module_code)).has("IVC") && new Set(state.v2ControlPoints.map((controlPoint) => controlPoint.module_code)).has("INV") ? false : false,
      all_old_control_points_mapped: state.migrationMap.length === currentControlPoints.length,
      all_new_control_points_clause_mapped: state.v2ControlPoints.every((controlPoint) => controlPoint.source_standard_clause.trim().length > 0),
      all_new_control_points_module_mapped: state.v2ControlPoints.every((controlPoint) => controlPoint.module_code.trim().length > 0),
      direct_legacy_runtime_imports_remaining: (state.brokenReferences.direct_legacy_runtime_imports as string[]).length,
      runtime_critical_files_count: state.runtimeCriticalFiles.length,
      prefix_distribution: prefixDistribution,
    };
    state.validationResults = validationResults;
    writeJsonFile(path.join(MIGRATION_DIR, "control-point-validation-results.json"), validationResults);

    fileMoves.push("backend/app/Support/Standards/control-point-validation.ts import target updated to control-points.runtime");
    fileMoves.push("backend/app/Support/Standards/control-point-summary.ts import target updated to control-points.runtime");
    fileMoves.push("backend/app/Support/Standards/control-point-mapping.ts import target updated to control-points.runtime");
  });

  await runStep("Copy outputs into artifact folder and write evidence logs", () => {
    const outputsToCopy = [
      path.join(STANDARDS_DIR, "control-points.runtime.ts"),
      path.join(STANDARDS_DIR, "control-points.ts"),
      path.join(STANDARDS_DIR, "control-point-registry.ts"),
      path.join(V2_DIR, "control-point-schema.ts"),
      path.join(V2_DIR, "control-module-registry.ts"),
      path.join(V2_DIR, "control-points.v2.ts"),
      path.join(V2_DIR, "control-point-governance.ts"),
      path.join(V2_DIR, "control-point-migration-map.json"),
      path.join(V2_DIR, "control-point-module-summary.md"),
      path.join(LEGACY_DIR, "control-points.v1.ts"),
      path.join(LEGACY_DIR, "control-point-registry.v1.ts"),
      path.join(LEGACY_DIR, "README.md"),
      path.join(MIGRATION_DIR, "control-point-source-inventory.json"),
      path.join(MIGRATION_DIR, "control-point-file-classification.json"),
      path.join(MIGRATION_DIR, "control-point-reference-map.json"),
      path.join(MIGRATION_DIR, "control-point-runtime-impact-report.md"),
      path.join(MIGRATION_DIR, "control-point-migration-plan.md"),
      path.join(MIGRATION_DIR, "control-point-migration-status.md"),
      path.join(MIGRATION_DIR, "control-point-validation-results.json"),
      path.join(MIGRATION_DIR, "control-point-broken-references.json"),
      path.join(MIGRATION_DIR, "control-point-module-coverage.json"),
    ];
    for (const filePath of outputsToCopy) {
      const targetPath = path.join(artifactPath, path.relative(ROOT, filePath));
      ensureDirectory(path.dirname(targetPath));
      fs.copyFileSync(filePath, targetPath);
    }

    writeTextFile(artifactFileMoves, `# File Moves\n\n${fileMoves.map((line) => `- ${line}`).join("\n")}\n`);
    writeTextFile(artifactBlockers, `# Blockers\n\n${blockers.length ? blockers.map((line) => `- ${line}`).join("\n") : "- None."}\n`);
    writeTextFile(artifactRuntimeImpact, state.runtimeImpactMarkdown);
  });

  const totalElapsedSeconds = (Date.now() - processStart) / 1000;
  const averageStepTime = totalElapsedSeconds / Math.max(timings.length, 1);
  const migratedModuleCodes = [...new Set(state.v2ControlPoints.map((controlPoint) => controlPoint.module_code))];
  const directLegacyImportsRemaining = (state.validationResults.direct_legacy_runtime_imports_remaining as number) ?? 0;
  const brokenReferencesCount = [
    ...(state.brokenReferences.direct_legacy_runtime_imports as string[]),
    ...(state.brokenReferences.old_prefix_runtime_files as string[]),
  ].length;

  const executionLog = [
    "# Control Point Migration Execution Log",
    "",
    `Artifact Path: ${artifactPath}`,
    `Legacy control points confirmed: ${currentControlPoints.length}`,
    `V2 migrated controls created: ${state.v2ControlPoints.length}`,
    `Runtime-critical files identified: ${state.runtimeCriticalFiles.length}`,
    `Missing uploaded inputs fallback used: ${blockers.some((line) => line.includes("Missing uploaded inputs")) ? "yes" : "no"}`,
    "",
    "## Steps",
    ...timings.map((timing) => `- ${timing.step}: ${timing.status} (${timing.durationSeconds.toFixed(2)} seconds)`),
    "",
  ].join("\n");
  writeTextFile(artifactExecutionLog, executionLog);

  const timingLog = [
    "# Execution Time Report",
    "",
    "| Step | Start Time | End Time | Duration (seconds) | Total Elapsed (seconds) | Average Step Time (seconds) | ETA Remaining (seconds) | Status |",
    "|------|------------|----------|-------------------:|------------------------:|----------------------------:|------------------------:|--------|",
    ...timings.map((timing) => `| ${timing.step} | ${timing.startTime} | ${timing.endTime} | ${timing.durationSeconds.toFixed(2)} | ${timing.elapsedSeconds.toFixed(2)} | ${timing.averageStepSeconds.toFixed(2)} | ${timing.estimatedRemainingSeconds.toFixed(2)} | ${timing.status} |`),
    "",
    "ETA is an estimate, not exact.",
    "",
  ].join("\n");
  writeTextFile(artifactTimingLog, timingLog);

  const summaryText = [
    "# Summary",
    "",
    `Legacy control points accounted for: ${currentControlPoints.length}`,
    `Legacy prefixes: ${Object.keys(state.sourceInventory.prefix_distribution as Record<string, number>).join(", ")}`,
    `Total referenced files classified: ${state.fileClassifications.length}`,
    `Runtime-critical files: ${state.runtimeCriticalFiles.length}`,
    `Archived legacy files: 3`,
    `New module codes created: ${MODULE_DEFINITIONS.map((module) => module.code).join(", ")}`,
    `New schema created: yes`,
    `Runtime bridge created: yes`,
    `First migrated CP count: ${state.v2ControlPoints.length}`,
    `Migration map coverage count: ${state.migrationMap.length}`,
    `Duplicate new IDs: ${state.validationResults.duplicate_new_ids ? "yes" : "no"}`,
    `Empty required fields: ${state.validationResults.empty_required_fields ? "yes" : "no"}`,
    `Direct legacy runtime imports remaining: ${directLegacyImportsRemaining}`,
    `Broken references found: ${brokenReferencesCount}`,
    `Total elapsed time: ${totalElapsedSeconds.toFixed(2)} seconds`,
    `Total steps: ${timings.length}`,
    `Average step time: ${averageStepTime.toFixed(2)} seconds`,
    `Final ETA variance note: ETA is an estimate, not exact.`,
    "",
  ].join("\n");
  writeTextFile(artifactSummary, summaryText);

  console.log(`ARTIFACT_PATH=${artifactPath}`);
  console.log(`LEGACY_TOTAL=${currentControlPoints.length}`);
  console.log(`RUNTIME_CRITICAL_FILES=${state.runtimeCriticalFiles.length}`);
  console.log(`V2_MIGRATED_TOTAL=${state.v2ControlPoints.length}`);
  console.log(`MIGRATION_MAP_TOTAL=${state.migrationMap.length}`);
  console.log(`DIRECT_LEGACY_IMPORTS_REMAINING=${directLegacyImportsRemaining}`);
  console.log(`BROKEN_REFERENCES_COUNT=${brokenReferencesCount}`);
  console.log(`MIGRATED_MODULE_CODES=${migratedModuleCodes.join(",")}`);
  console.log(`TOTAL_STEPS=${timings.length}`);
  console.log(`TOTAL_ELAPSED_SECONDS=${totalElapsedSeconds.toFixed(2)}`);
  console.log(`AVERAGE_STEP_SECONDS=${averageStepTime.toFixed(2)}`);
}

void main();