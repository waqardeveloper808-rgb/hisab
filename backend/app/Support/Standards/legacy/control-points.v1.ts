// Archived legacy v1 control points preserved for migration traceability.
import type { MasterDesignModuleId } from "@/types/master-design";
import {
  controlPointCategoryDefinitions,
  controlPointCategoryNames,
  getControlPointCategoryDefinition,
  type ControlPointApplicability,
  type ControlPointAuditMethod,
  type ControlPointCategoryCode,
  type ControlPointCategoryName,
  type ControlPointEvidence,
  type ControlPointImplementationStatus,
  type ControlPointPriority,
  type ControlPointSeverity,
} from "@/backend/app/Support/Standards/control-point-categories";
import { validateControlPointRegistry, type ControlPointRegistryValidation } from "@/backend/app/Support/Standards/control-point-validation";

export type {
  ControlPointApplicability,
  ControlPointAuditMethod,
  ControlPointCategoryCode,
  ControlPointCategoryName,
  ControlPointEvidence,
  ControlPointImplementationStatus,
  ControlPointPriority,
  ControlPointSeverity,
} from "@/backend/app/Support/Standards/control-point-categories";

export type ControlPointCategory = ControlPointCategoryName;

export type ControlPointMasterDesignReference = {
  nodeId: string;
  nodeTitle: string;
  parentNodeId: string;
  parentNodeTitle: string;
  path: string[];
};

export type ControlPointCategoryMapping = {
  requestedCategory: ControlPointCategory;
  masterDesignCategory: string;
  source: "master-design-hierarchy";
};

export type StandardsControlPoint = {
  id: string;
  category_code: ControlPointCategoryCode;
  category: ControlPointCategory;
  domain: string;
  title: string;
  name: string;
  purpose: string;
  rule: string;
  condition: string;
  expected_behavior: string;
  failure_conditions: string[];
  measurable_fields: string[];
  audit_method: ControlPointAuditMethod;
  audit_steps: string[];
  pass_criteria: string;
  fail_criteria: string;
  severity: ControlPointSeverity;
  priority: ControlPointPriority;
  applicability: ControlPointApplicability[];
  implementation_status: ControlPointImplementationStatus;
  linked_modules: MasterDesignModuleId[];
  linked_processes: string[];
  linked_workflows: string[];
  evidence_required: string[];
  owner: string;
  notes: string;
  master_design_reference: ControlPointMasterDesignReference;
  category_mapping: ControlPointCategoryMapping;
};

type ControlPointSeed = {
  id: string;
  domain: string;
  title: string;
  purpose: string;
  rule: string;
  condition?: string;
  expected_behavior?: string;
  failure_conditions?: string[];
  measurable_fields?: string[];
  audit_method?: ControlPointAuditMethod;
  audit_steps?: string[];
  pass_criteria?: string;
  fail_criteria?: string;
  severity?: ControlPointSeverity;
  priority?: ControlPointPriority;
  applicability?: ControlPointApplicability[];
  implementation_status?: ControlPointImplementationStatus;
  linked_modules?: MasterDesignModuleId[];
  linked_processes?: string[];
  evidence_required?: ControlPointEvidence[];
  owner?: string;
  notes?: string;
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function createReference(categoryCode: ControlPointCategoryCode, title: string): ControlPointMasterDesignReference {
  const category = getControlPointCategoryDefinition(categoryCode);
  return {
    nodeId: slugify(title),
    nodeTitle: title,
    parentNodeId: category.parentNodeId,
    parentNodeTitle: category.parentNodeTitle,
    path: ["Whole System", "Standards", category.parentNodeTitle, title],
  };
}

function createMapping(categoryCode: ControlPointCategoryCode): ControlPointCategoryMapping {
  const category = getControlPointCategoryDefinition(categoryCode);
  return {
    requestedCategory: category.name,
    masterDesignCategory: category.parentNodeTitle,
    source: "master-design-hierarchy",
  };
}

function createControlPoint(categoryCode: ControlPointCategoryCode, seed: ControlPointSeed): StandardsControlPoint {
  const category = getControlPointCategoryDefinition(categoryCode);
  const title = seed.title.trim();
  const linkedProcesses = seed.linked_processes ?? [seed.domain.toLowerCase(), title.toLowerCase()];
  const failureConditions = seed.failure_conditions ?? [
    `${seed.id.toLowerCase()} rule is bypassed in a primary transaction path`,
    `${seed.id.toLowerCase()} control evidence is missing or incomplete`,
    `${seed.id.toLowerCase()} behavior differs between interactive and downstream flows`,
  ];
  const auditSteps = seed.audit_steps ?? [
    `Inspect the ${title.toLowerCase()} rule in the relevant module and supporting process configuration.`,
    `Execute or simulate a representative ${seed.domain.toLowerCase()} scenario and verify the rule is enforced.`,
    `Review resulting evidence and confirm the outcome matches the expected control behavior.`,
  ];
  const evidenceRequired = seed.evidence_required ?? ["test result", "validation log", "structured payload"];

  return {
    id: seed.id,
    category_code: categoryCode,
    category: category.name,
    domain: seed.domain,
    title,
    name: title,
    purpose: seed.purpose,
    rule: seed.rule,
    condition: seed.condition ?? `When the system executes or validates ${seed.domain.toLowerCase()} behavior that falls under ${title.toLowerCase()}.`,
    expected_behavior: seed.expected_behavior ?? `The system enforces ${title.toLowerCase()} consistently and emits auditable evidence whenever the rule is evaluated.`,
    failure_conditions: failureConditions,
    measurable_fields: seed.measurable_fields ?? ["rule_status", "actor", "timestamp", "source_reference"],
    audit_method: seed.audit_method ?? "manual",
    audit_steps: auditSteps,
    pass_criteria: seed.pass_criteria ?? `${title} is enforced across the mapped modules and processes with traceable evidence.`,
    fail_criteria: seed.fail_criteria ?? `${title} is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.`,
    severity: seed.severity ?? "high",
    priority: seed.priority ?? "immediate",
    applicability: seed.applicability ?? ["KSA", "Gulf", "EU", "Global"],
    implementation_status: seed.implementation_status ?? "future_ready",
    linked_modules: seed.linked_modules ?? category.defaultModules,
    linked_processes: linkedProcesses,
    linked_workflows: linkedProcesses,
    evidence_required: evidenceRequired,
    owner: seed.owner ?? category.defaultOwner,
    notes: seed.notes ?? `${title} is part of the ${category.name} standards layer and is prepared for later audit-engine binding.`,
    master_design_reference: createReference(categoryCode, title),
    category_mapping: createMapping(categoryCode),
  };
}

const accountingControlPoints = [
  createControlPoint("ACC", { id: "ACC-001", domain: "Ledger Integrity", title: "Double Entry Enforcement", purpose: "Prevent ledger corruption by ensuring every journal remains balanced.", rule: "Total debit must equal total credit at transaction save and post time for all journal transactions.", linked_modules: ["accounting-engine", "document-engine", "workflow-intelligence"], linked_processes: ["journal posting", "invoice posting", "payment posting", "adjustments"], severity: "critical", implementation_status: "implemented", evidence_required: ["test result", "validation log", "journal payload sample"], notes: "Foundational accounting integrity control point." }),
  createControlPoint("ACC", { id: "ACC-002", domain: "Ledger Integrity", title: "Accounting Equation Integrity", purpose: "Protect ledger-level balance-sheet truth after every posting cycle.", rule: "Postings must preserve Assets = Liabilities + Equity at ledger level.", linked_modules: ["accounting-engine", "reports-engine"], linked_processes: ["ledger rollup", "financial statement generation"], severity: "critical", implementation_status: "future_ready" }),
  createControlPoint("ACC", { id: "ACC-003", domain: "Journal Design", title: "Compound Entry Support", purpose: "Allow valid multi-line accounting transactions without breaking transaction unity.", rule: "A single transaction may validly contain three or more account lines and must remain one transaction.", linked_processes: ["journal drafting", "compound posting"] }),
  createControlPoint("ACC", { id: "ACC-004", domain: "Chart of Accounts", title: "Contra Account Polarity", purpose: "Ensure contra balances are modeled and reviewed with the correct opposite orientation.", rule: "Contra accounts must carry balance orientation opposite to parent classification.", linked_processes: ["account classification", "trial balance review"] }),
  createControlPoint("ACC", { id: "ACC-005", domain: "Commercial Posting", title: "Discount Allowed Posting", purpose: "Ensure discounts granted to customers remain visible in financial reporting.", rule: "Discount allowed must post to dedicated expense or revenue-reduction logic and must not disappear silently.", linked_modules: ["accounting-engine", "document-engine", "reports-engine"], linked_processes: ["sales settlement", "invoice finalization"] }),
  createControlPoint("ACC", { id: "ACC-006", domain: "Commercial Posting", title: "Discount Received Posting", purpose: "Ensure supplier-side discounts are recorded through explicit accounting treatment.", rule: "Discount received must post to dedicated income or cost-reduction logic.", linked_processes: ["purchase settlement", "vendor payment allocation"] }),
  createControlPoint("ACC", { id: "ACC-007", domain: "Revenue Recognition", title: "Revenue Recognition - Contract Identification", purpose: "Prepare revenue accounting for IFRS 15 step 1 contract identification.", rule: "System must support identifying contract as the first IFRS 15 step before revenue recognition begins.", linked_modules: ["accounting-engine", "document-engine", "company-profile"], linked_processes: ["contract capture", "revenue setup"], implementation_status: "future_ready" }),
  createControlPoint("ACC", { id: "ACC-008", domain: "Revenue Recognition", title: "Revenue Recognition - Performance Obligations", purpose: "Prepare the accounting layer to separate obligations within a customer contract.", rule: "System must support separate obligations like license, service, support, and delivery.", linked_processes: ["contract modeling", "revenue obligation mapping"], implementation_status: "future_ready" }),
  createControlPoint("ACC", { id: "ACC-009", domain: "Revenue Recognition", title: "Revenue Recognition - Transaction Price", purpose: "Ensure transaction price is captured before recognition logic runs.", rule: "System must store determinable transaction price before recognition.", linked_processes: ["contract pricing", "revenue review"], implementation_status: "future_ready" }),
  createControlPoint("ACC", { id: "ACC-010", domain: "Revenue Recognition", title: "Revenue Recognition - Allocation", purpose: "Support allocation of contract price across obligations for compliant reporting.", rule: "Transaction price allocation across obligations must be supported.", linked_processes: ["allocation setup", "recognition schedule review"], implementation_status: "future_ready" }),
  createControlPoint("ACC", { id: "ACC-011", domain: "Revenue Recognition", title: "Revenue Recognition - Transfer of Control", purpose: "Ensure recognition timing follows the actual transfer-of-control event.", rule: "Revenue recognition timing must follow transfer-of-control event logic.", linked_processes: ["recognition event posting", "revenue release"], implementation_status: "future_ready" }),
  createControlPoint("ACC", { id: "ACC-012", domain: "Balance Sheet Timing", title: "Deferred Revenue Handling", purpose: "Keep unearned revenue on the balance sheet until release conditions are met.", rule: "Advance-billed but not-yet-earned amounts must remain deferred until release conditions are met.", linked_processes: ["advance billing", "deferred release"], implementation_status: "future_ready" }),
  createControlPoint("ACC", { id: "ACC-013", domain: "Balance Sheet Timing", title: "Prepaid Expense Handling", purpose: "Keep prepaid assets from being recognized too early.", rule: "Prepaid amounts must remain on the balance sheet until recognized over time or use.", linked_processes: ["prepayment capture", "expense amortization"], implementation_status: "future_ready" }),
  createControlPoint("ACC", { id: "ACC-014", domain: "Period Adjustments", title: "Accrued Expense Adjustments", purpose: "Allow period-end expense recognition even when supplier invoices arrive later.", rule: "Accrued expenses must be postable even if supplier invoice is not yet received.", linked_processes: ["accrual posting", "period-end adjustments"], implementation_status: "future_ready" }),
  createControlPoint("ACC", { id: "ACC-015", domain: "Period Matching", title: "Matching Principle Enforcement", purpose: "Support expense timing aligned with associated revenue periods when applicable.", rule: "Expense recognition should align to associated revenue period when applicable.", linked_processes: ["period matching", "close review"], implementation_status: "future_ready" }),
  createControlPoint("ACC", { id: "ACC-016", domain: "Reporting Integrity", title: "Trial Balance Validation", purpose: "Expose imbalance risk directly in the reporting layer.", rule: "Trial balance must calculate and expose imbalance if present.", linked_modules: ["accounting-engine", "reports-engine"], linked_processes: ["trial balance generation", "close checklist"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("ACC", { id: "ACC-017", domain: "Period Governance", title: "Period Closing Block", purpose: "Prevent financial period closure when integrity issues remain unresolved.", rule: "Close or lock period must fail if trial balance or posting integrity issues remain.", linked_processes: ["period close", "lock controls"], severity: "critical", implementation_status: "future_ready" }),
  createControlPoint("ACC", { id: "ACC-018", domain: "Journal Governance", title: "Journal Immutability After Final Post", purpose: "Protect posted audit trails from destructive edits.", rule: "Finalized journals must not be destructively edited; only reversal or adjustment path is allowed.", linked_processes: ["posted journal review", "reversal workflow"], severity: "critical", implementation_status: "partial" }),
  createControlPoint("ACC", { id: "ACC-019", domain: "Journal Governance", title: "Reversal Entry Integrity", purpose: "Ensure reversals preserve original transaction lineage.", rule: "Reversal must preserve traceability to original transaction.", linked_processes: ["reversal creation", "audit trace review"], implementation_status: "partial" }),
  createControlPoint("ACC", { id: "ACC-020", domain: "Traceability", title: "Source Document Traceability", purpose: "Keep accounting entries permanently tied to their originating business document.", rule: "Journal must keep immutable source UUID or reference to originating business document.", linked_modules: ["accounting-engine", "document-engine", "proof-layer"], linked_processes: ["source posting", "audit evidence retrieval"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("ACC", { id: "ACC-021", domain: "Reconciliation", title: "Subledger-to-GL Consistency", purpose: "Ensure customer and vendor subledgers reconcile back to controlling accounts.", rule: "AR, AP, customer, and vendor balances must reconcile to controlling GL accounts.", linked_modules: ["accounting-engine", "reports-engine", "contacts-counterparties"], linked_processes: ["aging review", "subledger reconciliation"], severity: "critical", implementation_status: "future_ready" }),
  createControlPoint("ACC", { id: "ACC-022", domain: "Currency Readiness", title: "Multi-Currency Posting Readiness", purpose: "Prepare the accounting standards layer for foreign currency traceability and reporting.", rule: "Accounting control point structure must be ready for base versus foreign currency storage and audit trace.", linked_processes: ["foreign currency capture", "fx audit trace"], implementation_status: "future_ready" }),
] as const;

const inventoryControlPoints = [
  createControlPoint("INV", { id: "INV-001", domain: "Stock Integrity", title: "Stock Availability Validation", purpose: "Block issues and shipments that exceed approved stock availability.", rule: "Issue, sale, or shipment cannot exceed permitted stock unless approved exception flow exists.", linked_modules: ["inventory-engine", "document-engine", "workflow-intelligence"], linked_processes: ["stock issue", "shipment validation"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("INV", { id: "INV-002", domain: "Stock Governance", title: "Negative Stock Disabled by Default", purpose: "Make safe inventory behavior the default operating mode.", rule: "Negative stock must default to disallowed state.", linked_processes: ["inventory policy", "item movement validation"], severity: "high", implementation_status: "implemented" }),
  createControlPoint("INV", { id: "INV-003", domain: "Stock Governance", title: "Negative Stock Exception Governance", purpose: "Ensure exception-based negative stock use is explicit and reviewable.", rule: "If negative stock is enabled, the event must be explicitly flagged and auditable.", linked_processes: ["exception approval", "negative stock logging"], implementation_status: "future_ready" }),
  createControlPoint("INV", { id: "INV-004", domain: "Valuation Correction", title: "Backdated Reposting Correction", purpose: "Correct historical valuation effects when late receipts change prior negative stock outcomes.", rule: "Late purchase entries must trigger valuation correction logic for previous negative stock effects.", linked_processes: ["backdated receipt handling", "valuation correction"], implementation_status: "future_ready" }),
  createControlPoint("INV", { id: "INV-005", domain: "Valuation", title: "FIFO Valuation Enforcement", purpose: "Keep inventory valuation aligned to FIFO as the core standard.", rule: "Inventory valuation must support FIFO as a core standard.", linked_processes: ["cost layer consumption", "inventory valuation reporting"], implementation_status: "future_ready" }),
  createControlPoint("INV", { id: "INV-006", domain: "Costing", title: "COGS Linkage", purpose: "Ensure every sale-related stock-out produces auditable cost-of-goods movement.", rule: "Every stock-out affecting sale must produce linked cost movement to COGS.", linked_modules: ["inventory-engine", "accounting-engine", "document-engine"], linked_processes: ["delivery posting", "sale finalization"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("INV", { id: "INV-007", domain: "Synchronization", title: "Inventory-to-Accounting Synchronization", purpose: "Keep stock movement and financial impact aligned across modules.", rule: "Inventory asset, COGS, adjustment, and stock movement must reconcile with the accounting engine.", linked_modules: ["inventory-engine", "accounting-engine", "reports-engine"], linked_processes: ["inventory posting", "stock valuation review"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("INV", { id: "INV-008", domain: "Traceability", title: "Lot Traceability", purpose: "Preserve batch lineage for operational and regulatory review.", rule: "Stock must support lot and batch lineage.", linked_processes: ["lot assignment", "batch recall trace"], implementation_status: "future_ready" }),
  createControlPoint("INV", { id: "INV-009", domain: "Traceability", title: "Bin / Location Traceability", purpose: "Maintain location history for warehouse accountability.", rule: "Stock movements must preserve warehouse, bin, and location history.", linked_processes: ["warehouse move", "bin history review"], implementation_status: "future_ready" }),
  createControlPoint("INV", { id: "INV-010", domain: "Inventory Planning", title: "ABC Classification Support", purpose: "Support operational prioritization of inventory review and replenishment.", rule: "Items must support ABC categorization metadata.", linked_processes: ["item classification", "planning review"], implementation_status: "future_ready" }),
  createControlPoint("INV", { id: "INV-011", domain: "Inventory Counting", title: "Cycle Count Support", purpose: "Allow periodic stock counts without full warehouse shutdown.", rule: "System must support periodic partial stock counts without full operational shutdown.", linked_processes: ["cycle count planning", "variance posting"], implementation_status: "future_ready" }),
  createControlPoint("INV", { id: "INV-012", domain: "Inventory Planning", title: "Safety Stock Threshold", purpose: "Enable minimum-stock governance before stock-outs occur.", rule: "Reorder and alert logic must support minimum stock buffer.", linked_processes: ["reorder alerting", "stock risk review"], implementation_status: "future_ready" }),
  createControlPoint("INV", { id: "INV-013", domain: "Inventory Planning", title: "Reorder Point Governance", purpose: "Keep reorder thresholds configurable and traceable.", rule: "Reorder thresholds must be configurable and traceable.", linked_processes: ["reorder configuration", "planning audit"], implementation_status: "future_ready" }),
  createControlPoint("INV", { id: "INV-014", domain: "Valuation Integrity", title: "Valuation Mismatch Detection", purpose: "Flag quantity-value mismatches before they distort inventory reporting.", rule: "System must flag mismatch between stock quantity and stock valuation integrity.", linked_processes: ["stock valuation check", "variance investigation"], implementation_status: "future_ready" }),
  createControlPoint("INV", { id: "INV-015", domain: "Adjustment Governance", title: "Inventory Adjustment Traceability", purpose: "Ensure manual inventory changes remain accountable when financial impact exists.", rule: "Manual adjustments must require reason, user, timestamp, and accounting linkage when financial impact exists.", linked_modules: ["inventory-engine", "accounting-engine", "proof-layer"], linked_processes: ["inventory adjustment", "adjustment approval"], severity: "critical", implementation_status: "partial" }),
] as const;

const vatControlPoints = [
  createControlPoint("VAT", { id: "VAT-001", domain: "Tax Separation", title: "Output VAT Separation", purpose: "Keep output tax distinct from net sales value.", rule: "Output VAT must be recorded separately from net sales values.", linked_modules: ["tax-vat-engine", "accounting-engine", "document-engine"], linked_processes: ["sales tax calculation", "invoice presentation"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("VAT", { id: "VAT-002", domain: "Tax Separation", title: "Input VAT Separation", purpose: "Keep recoverable purchase tax distinct from purchase net values.", rule: "Input VAT must be recorded separately from net purchase and expense values.", linked_processes: ["purchase tax capture", "expense tax capture"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("VAT", { id: "VAT-003", domain: "Tax Calculation", title: "VAT Payable Formula", purpose: "Ensure VAT liability can be reviewed from source components.", rule: "VAT payable must be calculable as output VAT minus recoverable input VAT.", linked_processes: ["vat return preparation", "tax reconciliation"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("VAT", { id: "VAT-004", domain: "Tax Decision Engine", title: "Customer Origin Capture Dependency", purpose: "Make tax decisions depend on customer origin where required by regime logic.", rule: "Tax decision engine must depend on customer origin data when relevant.", linked_modules: ["tax-vat-engine", "contacts-counterparties"], linked_processes: ["customer tax classification", "tax decision resolution"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-005", domain: "Tax Decision Engine", title: "Supply Location Dependency", purpose: "Apply place-of-supply logic consistently.", rule: "Tax treatment must depend on place and supply-location rules.", linked_processes: ["place of supply evaluation", "cross-border tax decision"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-006", domain: "Tax Decision Engine", title: "Customer VAT Status Dependency", purpose: "Use customer registration status when determining tax treatment.", rule: "Tax decision engine must use customer VAT registration status.", linked_processes: ["customer VAT status evaluation", "tax treatment selection"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-007", domain: "Tax Decision Engine", title: "B2B vs B2C Differentiation", purpose: "Ensure business and consumer tax treatment diverge when regulation requires it.", rule: "VAT path must differ correctly for B2B versus B2C where applicable.", linked_processes: ["customer type decision", "tax output selection"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-008", domain: "Cross-Border Tax", title: "Reverse Charge Eligibility", purpose: "Support reverse-charge treatment for qualifying services.", rule: "Reverse charge logic must be supported for qualifying cross-border B2B services.", linked_processes: ["cross-border service invoicing", "reverse charge classification"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-009", domain: "Cross-Border Tax", title: "Reverse Charge Labeling", purpose: "Keep reverse-charge treatment visible in both machine and human-readable outputs.", rule: "Reverse charge treatment must appear correctly in structured data and visible output where required.", linked_modules: ["tax-vat-engine", "document-engine", "compliance-layer"], linked_processes: ["structured invoice output", "tax note rendering"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-010", domain: "KSA E-Invoicing", title: "KSA XML Generation Readiness", purpose: "Prepare invoice compliance for KSA XML generation.", rule: "KSA invoice compliance structure must support XML generation.", linked_modules: ["tax-vat-engine", "document-engine", "compliance-layer"], linked_processes: ["ksa xml build", "invoice compliance export"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-011", domain: "KSA E-Invoicing", title: "KSA PDF/A-3 Readiness", purpose: "Prepare the document pipeline for compliant hybrid PDF output.", rule: "Compliant invoice pipeline must support PDF/A-3 with embedded XML.", linked_processes: ["pdf generation", "hybrid document packaging"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-012", domain: "KSA E-Invoicing", title: "SHA-256 Hash Requirement", purpose: "Prepare compliance hashing for invoice payload integrity.", rule: "Compliance pipeline must support invoice hash generation.", linked_processes: ["invoice hash generation", "compliance payload signing"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-013", domain: "KSA E-Invoicing", title: "ECDSA Signature Requirement", purpose: "Prepare compliance signing capability for regulated invoice exchange.", rule: "Compliance pipeline must support signature metadata and signature step.", linked_processes: ["signature metadata generation", "signature application"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-014", domain: "KSA QR TLV", title: "QR TLV Tag 1 Seller Name", purpose: "Ensure seller-name TLV support exists in the compliance payload.", rule: "QR TLV output must support Tag 1 for seller name.", linked_processes: ["qr tlv generation", "seller identity encoding"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-015", domain: "KSA QR TLV", title: "QR TLV Tag 2 VAT Number", purpose: "Ensure VAT-number TLV support exists in the compliance payload.", rule: "QR TLV output must support Tag 2 for VAT number.", linked_processes: ["qr tlv generation", "vat identity encoding"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-016", domain: "KSA QR TLV", title: "QR TLV Tag 3 Timestamp", purpose: "Ensure timestamp TLV support exists in the compliance payload.", rule: "QR TLV output must support Tag 3 for invoice timestamp.", linked_processes: ["qr tlv generation", "invoice timestamp encoding"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-017", domain: "KSA QR TLV", title: "QR TLV Tag 4 Invoice Total", purpose: "Ensure invoice-total TLV support exists in the compliance payload.", rule: "QR TLV output must support Tag 4 for invoice total.", linked_processes: ["qr tlv generation", "invoice total encoding"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-018", domain: "KSA QR TLV", title: "QR TLV Tag 5 VAT Total", purpose: "Ensure VAT-total TLV support exists in the compliance payload.", rule: "QR TLV output must support Tag 5 for VAT total.", linked_processes: ["qr tlv generation", "vat total encoding"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-019", domain: "KSA QR TLV", title: "QR TLV Tag 6 XML Hash", purpose: "Ensure XML-hash TLV support exists in the compliance payload.", rule: "QR TLV output must support Tag 6 for XML hash.", linked_processes: ["qr tlv generation", "xml hash encoding"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-020", domain: "KSA QR TLV", title: "QR TLV Tag 7 ECDSA Signature", purpose: "Ensure signature TLV support exists in the compliance payload.", rule: "QR TLV output must support Tag 7 for ECDSA signature.", linked_processes: ["qr tlv generation", "signature encoding"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-021", domain: "KSA QR TLV", title: "QR TLV Tag 8 Public Key", purpose: "Ensure public-key TLV support exists in the compliance payload.", rule: "QR TLV output must support Tag 8 for public key.", linked_processes: ["qr tlv generation", "public key encoding"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-022", domain: "KSA QR TLV", title: "QR TLV Tag 9 Stamp / Cryptographic Stamp", purpose: "Ensure stamp TLV support exists in the compliance payload.", rule: "QR TLV output must support Tag 9 for stamp or cryptographic stamp.", linked_processes: ["qr tlv generation", "stamp encoding"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-023", domain: "EU E-Invoicing", title: "EN 16931 Semantic Mapping", purpose: "Prepare invoice structured data for EU semantic interoperability.", rule: "Invoice structured data must support EU semantic field mapping under EN 16931.", linked_modules: ["document-engine", "compliance-layer", "tax-vat-engine"], linked_processes: ["semantic mapping", "eu invoice payload generation"], applicability: ["EU", "Global"], implementation_status: "future_ready" }),
  createControlPoint("VAT", { id: "VAT-024", domain: "Structured Tax Data", title: "Structured Tax Data Completeness", purpose: "Keep tax-critical fields available in machine-readable form for downstream compliance use.", rule: "Tax-critical fields must exist in machine-readable structure, not only visual PDF text.", linked_modules: ["tax-vat-engine", "document-engine", "compliance-layer"], linked_processes: ["structured payload review", "tax export validation"], severity: "critical", implementation_status: "implemented" }),
] as const;

const documentControlPoints = [
  createControlPoint("DOC", { id: "DOC-001", domain: "Structured Documents", title: "Mandatory Structured Data Presence", purpose: "Ensure legally relevant invoice data exists beyond visual rendering.", rule: "Legal invoice fields must exist in structured representation, not just printed text.", linked_modules: ["document-engine", "compliance-layer"], linked_processes: ["document serialization", "compliance export"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("DOC", { id: "DOC-002", domain: "Rendering Integrity", title: "Preview-to-PDF Parity", purpose: "Keep previewed business truth aligned with exported PDF output.", rule: "Preview must match final rendered PDF materially and visually.", linked_modules: ["document-engine", "template-engine"], linked_processes: ["document preview", "pdf rendering"], severity: "high", implementation_status: "partial" }),
  createControlPoint("DOC", { id: "DOC-003", domain: "Compliance Rendering", title: "PDF/A-3 Container Standard", purpose: "Prepare document generation for hybrid archival compliance packaging.", rule: "PDF generation path must support hybrid archival PDF/A-3 model.", linked_processes: ["pdf container generation", "hybrid archive review"], implementation_status: "future_ready" }),
  createControlPoint("DOC", { id: "DOC-004", domain: "Compliance Rendering", title: "Embedded XML Attachment Integrity", purpose: "Keep embedded XML retrievable after compliant document generation.", rule: "Embedded XML must remain attached and retrievable in compliant documents.", linked_processes: ["embedded xml packaging", "attachment retrieval"], implementation_status: "future_ready" }),
  createControlPoint("DOC", { id: "DOC-005", domain: "Layout Governance", title: "Layout Order Standard", purpose: "Ensure rendered documents follow approved master-design layout sequencing.", rule: "Invoice and document sections must follow approved order from master design.", linked_processes: ["template composition", "document layout review"], implementation_status: "partial" }),
  createControlPoint("DOC", { id: "DOC-006", domain: "Layout Governance", title: "Hide Empty Fields", purpose: "Avoid noisy legal documents with meaningless empty labels or boxes.", rule: "Blank optional fields must not render as meaningless labels or boxes.", linked_processes: ["conditional section rendering", "document cleanliness review"], implementation_status: "implemented" }),
  createControlPoint("DOC", { id: "DOC-007", domain: "Totals Integrity", title: "Totals Accuracy", purpose: "Ensure totals remain mathematically consistent across document output.", rule: "Subtotal, VAT, discounts, rounding, and grand total must reconcile.", linked_modules: ["document-engine", "tax-vat-engine", "accounting-engine"], linked_processes: ["document total calculation", "pdf output review"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("DOC", { id: "DOC-008", domain: "Localization", title: "Bilingual Support Readiness", purpose: "Prepare documents for stable English and Arabic output.", rule: "Template system must support English and Arabic layout consistency.", linked_modules: ["document-engine", "template-engine", "ui-ux-shell"], linked_processes: ["language rendering", "bilingual preview"], implementation_status: "partial" }),
  createControlPoint("DOC", { id: "DOC-009", domain: "Pagination", title: "Multi-Page Continuity", purpose: "Maintain numbering and layout continuity across multi-page documents.", rule: "Multi-page documents must preserve numbering and layout continuity.", linked_processes: ["pagination", "multi-page print review"], implementation_status: "future_ready" }),
  createControlPoint("DOC", { id: "DOC-010", domain: "Layout Readiness", title: "Multi-Layout Book Support", purpose: "Keep the engine structurally ready for mixed page layouts where needed.", rule: "Document engine should be structurally ready for mixed orientation and multi-layout pages.", linked_processes: ["orientation planning", "document composition strategy"], implementation_status: "future_ready" }),
  createControlPoint("DOC", { id: "DOC-011", domain: "Evidence Linkage", title: "External Attachment Linkage", purpose: "Allow business-supporting attachments to stay linked to the core document record.", rule: "Referenced supporting documents must be attachable and traceable.", linked_modules: ["document-engine", "proof-layer"], linked_processes: ["attachment upload", "supporting evidence review"], implementation_status: "partial" }),
  createControlPoint("DOC", { id: "DOC-012", domain: "Consistency", title: "Structured vs Visual Consistency", purpose: "Prevent divergence between visible values and underlying structured data.", rule: "Values shown visually must match underlying structured data.", linked_modules: ["document-engine", "template-engine", "compliance-layer"], linked_processes: ["structured data verification", "rendered output review"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("DOC", { id: "DOC-013", domain: "Conditional Sections", title: "Delivery / Optional Section Conditional Display", purpose: "Render optional sections only when real data exists.", rule: "Delivery information and optional sections render only when populated.", linked_processes: ["conditional section evaluation", "delivery metadata rendering"], implementation_status: "implemented" }),
  createControlPoint("DOC", { id: "DOC-014", domain: "Layout Governance", title: "Footer / Header Cleanliness", purpose: "Keep printed outputs free from placeholder noise and duplicated labels.", rule: "Headers and footers must not include junk text, duplicated labels, or non-business placeholders.", linked_processes: ["header footer rendering", "output quality review"], implementation_status: "implemented" }),
] as const;

const templateControlPoints = [
  createControlPoint("TMP", { id: "TMP-001", domain: "Editor Standards", title: "WYSIWYG Requirement", purpose: "Keep template editing aligned with visible business output.", rule: "Template engine must support WYSIWYG editing for business users.", linked_modules: ["template-engine", "ui-ux-shell"], linked_processes: ["template editing", "layout composition"], implementation_status: "partial" }),
  createControlPoint("TMP", { id: "TMP-002", domain: "Preview Standards", title: "Real-Time Preview Parity", purpose: "Ensure template preview reflects the current draft state.", rule: "Template engine must provide real-time preview parity with current template state.", linked_processes: ["template preview", "draft synchronization"], implementation_status: "partial" }),
  createControlPoint("TMP", { id: "TMP-003", domain: "Layout Composition", title: "Drag-and-Drop Layout Readiness", purpose: "Prepare the engine for controlled drag-and-drop layout composition.", rule: "Template engine must be structurally ready for drag-and-drop layout control.", linked_processes: ["layout composition", "section positioning"], implementation_status: "future_ready" }),
  createControlPoint("TMP", { id: "TMP-004", domain: "Layout Composition", title: "Section-Based Composition", purpose: "Compose templates from clear section blocks rather than opaque HTML fragments.", rule: "Template engine must support section-based composition.", linked_processes: ["section definition", "section ordering"], implementation_status: "implemented" }),
  createControlPoint("TMP", { id: "TMP-005", domain: "Layout Composition", title: "Row / Column Grid Support", purpose: "Prepare templates for deterministic spatial composition.", rule: "Template engine must support row and column grid composition.", linked_processes: ["grid layout", "responsive section arrangement"], implementation_status: "future_ready" }),
  createControlPoint("TMP", { id: "TMP-006", domain: "Conditional Rendering", title: "Conditional Rendering Support", purpose: "Allow sections to appear only when relevant business data is present.", rule: "Template engine must support conditional rendering.", linked_processes: ["conditional section rendering", "template data checks"], implementation_status: "implemented" }),
  createControlPoint("TMP", { id: "TMP-007", domain: "Brand Placement", title: "Logo Placement Control", purpose: "Keep logo placement explicit and consistent across template variants.", rule: "Template engine must support explicit logo placement control.", linked_processes: ["branding placement", "header composition"], implementation_status: "implemented" }),
  createControlPoint("TMP", { id: "TMP-008", domain: "Brand Placement", title: "Stamp Placement Control", purpose: "Prepare document designs for controlled stamp positioning.", rule: "Template engine must support explicit stamp placement control.", linked_processes: ["stamp placement", "approval rendering"], implementation_status: "future_ready" }),
  createControlPoint("TMP", { id: "TMP-009", domain: "Brand Placement", title: "Signature Placement Control", purpose: "Prepare document designs for controlled signature positioning.", rule: "Template engine must support explicit signature placement control.", linked_processes: ["signature placement", "signatory output"], implementation_status: "future_ready" }),
  createControlPoint("TMP", { id: "TMP-010", domain: "Template Governance", title: "Multi-Template Support", purpose: "Allow multiple approved layouts per business document type.", rule: "Template engine must support multiple templates.", linked_processes: ["template selection", "template assignment"], implementation_status: "implemented" }),
  createControlPoint("TMP", { id: "TMP-011", domain: "Template Governance", title: "Default Template Governance", purpose: "Ensure a controlled default exists for each document context.", rule: "Template engine must support governed default-template behavior.", linked_processes: ["default template assignment", "template fallback"], implementation_status: "implemented" }),
  createControlPoint("TMP", { id: "TMP-012", domain: "Rendering Integrity", title: "PDF Render Consistency", purpose: "Keep final PDF output consistent with approved template structure.", rule: "Template engine must render consistent PDF output from the saved template definition.", linked_processes: ["pdf render", "template output comparison"], implementation_status: "partial" }),
] as const;

const uiControlPoints = [
  createControlPoint("UIX", { id: "UIX-001", domain: "Comprehension", title: "5-Second Understanding Rule", purpose: "Ensure operators can understand the page purpose almost immediately.", rule: "Primary workspace surfaces must communicate purpose and action within five seconds.", linked_modules: ["ui-ux-shell", "identity-workspace"], linked_processes: ["workspace landing", "page comprehension review"], implementation_status: "future_ready" }),
  createControlPoint("UIX", { id: "UIX-002", domain: "Task Efficiency", title: "5-Click Completion Rule", purpose: "Keep common workflows operationally short.", rule: "Common business tasks should complete within five logical clicks when preconditions are satisfied.", linked_processes: ["task path review", "workflow optimization baseline"], implementation_status: "future_ready" }),
  createControlPoint("UIX", { id: "UIX-003", domain: "Recovery", title: "No Dead-End Screens", purpose: "Avoid inert screens that leave users without a next action.", rule: "Screens must not become dead ends when blocked, empty, or partially available.", linked_processes: ["empty state review", "blocked state review"], implementation_status: "partial" }),
  createControlPoint("UIX", { id: "UIX-004", domain: "Navigation Context", title: "Breadcrumb Requirement for Deep Paths", purpose: "Expose route context for deeper operational paths.", rule: "Deep routes must expose breadcrumb context or equivalent path guidance.", linked_processes: ["deep route navigation", "path context review"], implementation_status: "future_ready" }),
  createControlPoint("UIX", { id: "UIX-005", domain: "Navigation Context", title: "Sidebar Hierarchy Standard", purpose: "Ensure navigation grouping reflects operational hierarchy.", rule: "Sidebar hierarchy must reflect real module and task grouping.", linked_processes: ["sidebar review", "route grouping review"], implementation_status: "implemented" }),
  createControlPoint("UIX", { id: "UIX-006", domain: "Operational Density", title: "Dense Data Table Standard", purpose: "Support operator scanning in data-heavy accounting workflows.", rule: "Dense business tables must remain information-rich and scan-friendly.", linked_processes: ["table density review", "list scanning review"], implementation_status: "partial" }),
  createControlPoint("UIX", { id: "UIX-007", domain: "Navigation Context", title: "Sticky Header Requirement", purpose: "Keep key page context and actions visible during long-page work.", rule: "Operational surfaces must support sticky header context where navigation depth requires it.", linked_processes: ["page header review", "long-scroll workflow review"], implementation_status: "partial" }),
  createControlPoint("UIX", { id: "UIX-008", domain: "Recovery", title: "Empty-State CTA Requirement", purpose: "Ensure empty states remain actionable.", rule: "Empty states must include a relevant call to action.", linked_processes: ["empty register review", "first-action review"], implementation_status: "implemented" }),
  createControlPoint("UIX", { id: "UIX-009", domain: "Role Experience", title: "Role-Based UI Visibility", purpose: "Align surface visibility to role-based workspace expectations.", rule: "UI visibility must vary correctly by role and permissions.", linked_modules: ["identity-workspace", "ui-ux-shell"], linked_processes: ["role switch review", "permission-based page visibility"], implementation_status: "implemented" }),
  createControlPoint("UIX", { id: "UIX-010", domain: "Operational Density", title: "High-Volume Scanning Readiness", purpose: "Keep large transaction lists scan-friendly for operators.", rule: "UI must support high-volume scanning of operational lists and states.", linked_processes: ["register scanning", "high-volume review"], implementation_status: "future_ready" }),
  createControlPoint("UIX", { id: "UIX-011", domain: "Navigation Context", title: "Navigation Predictability", purpose: "Ensure route behavior remains predictable across workspace movement.", rule: "Navigation patterns must remain predictable across role workspaces and module surfaces.", linked_processes: ["route transition review", "workspace navigation review"], implementation_status: "implemented" }),
] as const;

const formControlPoints = [
  createControlPoint("FRM", { id: "FRM-001", domain: "Validation UX", title: "Inline Validation", purpose: "Expose validation feedback close to the field interaction point.", rule: "Forms must support inline validation.", linked_modules: ["ui-ux-shell", "workflow-intelligence", "contacts-counterparties"], linked_processes: ["form entry", "field validation"], severity: "high", implementation_status: "implemented" }),
  createControlPoint("FRM", { id: "FRM-002", domain: "Validation UX", title: "Required Field Visibility", purpose: "Make required data obvious before submission fails.", rule: "Required fields must be visibly marked before submission.", linked_processes: ["form entry", "field requirement review"], implementation_status: "implemented" }),
  createControlPoint("FRM", { id: "FRM-003", domain: "Validation UX", title: "Clear Error Message Standard", purpose: "Ensure validation failures tell the user what to fix.", rule: "Error messages must be clear, actionable, and contextual.", linked_processes: ["error rendering", "submission review"], implementation_status: "implemented" }),
  createControlPoint("FRM", { id: "FRM-004", domain: "Persistence UX", title: "Explicit Save Behavior", purpose: "Show operators when business data was actually saved.", rule: "Save behavior must provide explicit persistence confirmation.", linked_processes: ["save feedback", "settings persistence"], implementation_status: "implemented" }),
  createControlPoint("FRM", { id: "FRM-005", domain: "Persistence UX", title: "Draft Behavior Standard", purpose: "Distinguish draft state from final saved state where draft workflows exist.", rule: "Forms must support and communicate draft behavior where applicable.", linked_processes: ["draft save", "draft status display"], implementation_status: "partial" }),
  createControlPoint("FRM", { id: "FRM-006", domain: "Risk Control", title: "Critical Action Confirmation", purpose: "Prevent irreversible actions from firing without explicit operator intent.", rule: "Critical actions must require confirmation.", linked_processes: ["destructive action confirmation", "high-risk form action"], implementation_status: "future_ready" }),
  createControlPoint("FRM", { id: "FRM-007", domain: "Register Use", title: "Register Filtering Capability", purpose: "Support operational narrowing of large business registers.", rule: "Registers must support filtering.", linked_processes: ["register filtering", "list review"], implementation_status: "partial" }),
  createControlPoint("FRM", { id: "FRM-008", domain: "Register Use", title: "Multi-Parameter Filter Readiness", purpose: "Prepare list views for compound operational queries.", rule: "Registers must be ready for multi-parameter filtering.", linked_processes: ["advanced filter design", "multi-field register search"], implementation_status: "future_ready" }),
  createControlPoint("FRM", { id: "FRM-009", domain: "Register Use", title: "Column Customization Readiness", purpose: "Prepare high-volume registers for role-specific information views.", rule: "Registers must be ready for column customization.", linked_processes: ["register column preference", "dense list personalization"], implementation_status: "future_ready" }),
  createControlPoint("FRM", { id: "FRM-010", domain: "Register Use", title: "Drill-Down to Object Page", purpose: "Allow operators to move from list context into object detail context.", rule: "Registers must support drill-down to the object page.", linked_processes: ["register row navigation", "detail review"], implementation_status: "partial" }),
  createControlPoint("FRM", { id: "FRM-011", domain: "Persistence UX", title: "Unsaved Change Protection", purpose: "Protect operators from losing in-progress work.", rule: "Forms must protect against silent loss of unsaved critical changes.", linked_processes: ["unsaved changes warning", "navigation guard"], implementation_status: "future_ready" }),
  createControlPoint("FRM", { id: "FRM-012", domain: "Validation UX", title: "Form Submission Blocking on Invalid Critical Data", purpose: "Ensure invalid critical data cannot be persisted through the primary submission path.", rule: "Form submission must block on invalid critical data.", linked_processes: ["submission validation", "critical data gating"], severity: "critical", implementation_status: "implemented" }),
] as const;

const validationControlPoints = [
  createControlPoint("VAL", { id: "VAL-001", domain: "Identity Validation", title: "KSA VAT Number Format", purpose: "Ensure KSA VAT numbers follow format and length expectations.", rule: "KSA VAT number validation must enforce regulated format and length.", linked_modules: ["company-profile", "contacts-counterparties", "ui-ux-shell"], linked_processes: ["vat entry", "vat validation"], implementation_status: "implemented", evidence_required: ["ui evidence", "validation log", "master data sample"] }),
  createControlPoint("VAL", { id: "VAL-002", domain: "Identity Validation", title: "EU VAT Number Readiness", purpose: "Prepare the validation layer for EU VAT registration structures.", rule: "Validation layer must be ready to support EU VAT number patterns.", linked_processes: ["eu vat entry", "cross-border master data validation"], applicability: ["EU", "Global"], implementation_status: "future_ready" }),
  createControlPoint("VAL", { id: "VAL-003", domain: "Identity Validation", title: "CR Number Numeric / Length Rule", purpose: "Ensure commercial registration values are structurally valid.", rule: "CR number validation must enforce numeric content and expected length.", linked_processes: ["company registration entry", "registration validation"], implementation_status: "implemented" }),
  createControlPoint("VAL", { id: "VAL-004", domain: "Contact Validation", title: "Phone Number Structure", purpose: "Ensure phone inputs follow a defined structure.", rule: "Phone number validation must enforce basic structural correctness.", linked_processes: ["contact entry", "phone validation"], implementation_status: "implemented" }),
  createControlPoint("VAL", { id: "VAL-005", domain: "Contact Validation", title: "Country-Aware Phone Validation", purpose: "Prepare validation logic for country-specific phone expectations.", rule: "Phone validation must support country-aware rules.", linked_processes: ["country-based phone validation", "regional master data validation"], implementation_status: "future_ready" }),
  createControlPoint("VAL", { id: "VAL-006", domain: "Contact Validation", title: "Email Structure Rule", purpose: "Ensure email inputs follow a valid structure.", rule: "Email validation must enforce valid email structure.", linked_processes: ["email entry", "email validation"], implementation_status: "implemented" }),
  createControlPoint("VAL", { id: "VAL-007", domain: "Address Validation", title: "Postal Code Format", purpose: "Ensure postal code inputs follow an expected structural rule.", rule: "Postal code validation must enforce configured format.", linked_processes: ["address entry", "postal code validation"], implementation_status: "implemented" }),
  createControlPoint("VAL", { id: "VAL-008", domain: "Address Validation", title: "PO Box Format", purpose: "Ensure PO Box inputs follow a recognizable structure.", rule: "PO Box validation must enforce supported structure.", linked_processes: ["address entry", "po box validation"], implementation_status: "implemented" }),
  createControlPoint("VAL", { id: "VAL-009", domain: "Address Validation", title: "Address Line Structured Fields", purpose: "Prevent business address data from collapsing into a single opaque free-text field.", rule: "Address capture must support structured address-line fields.", linked_processes: ["company address capture", "customer address capture"], implementation_status: "implemented" }),
  createControlPoint("VAL", { id: "VAL-010", domain: "Address Validation", title: "City / Region / Country Completeness", purpose: "Ensure core location components remain complete for business identity and tax logic.", rule: "Address validation must ensure city, region where applicable, and country completeness.", linked_processes: ["address validation", "tax dependency review"], implementation_status: "future_ready" }),
  createControlPoint("VAL", { id: "VAL-011", domain: "Contact Validation", title: "Fax Format Rule", purpose: "Ensure fax inputs, when used, follow an expected structure.", rule: "Fax validation must enforce supported format.", linked_processes: ["fax entry", "fax validation"], implementation_status: "implemented" }),
  createControlPoint("VAL", { id: "VAL-012", domain: "Financial Validation", title: "Currency Code Validity", purpose: "Ensure currency identifiers remain standard-compliant.", rule: "Currency code validation must enforce valid currency identifiers.", linked_processes: ["currency entry", "currency normalization"], implementation_status: "future_ready" }),
  createControlPoint("VAL", { id: "VAL-013", domain: "Financial Validation", title: "Date Format Validity", purpose: "Ensure date inputs remain machine and business valid.", rule: "Date validation must enforce valid date structure and parseability.", linked_processes: ["date entry", "date validation"], implementation_status: "future_ready" }),
  createControlPoint("VAL", { id: "VAL-014", domain: "Financial Validation", title: "Amount Precision Rule", purpose: "Ensure monetary fields keep controlled precision.", rule: "Amount validation must enforce supported precision rules.", linked_processes: ["amount entry", "monetary rounding validation"], implementation_status: "future_ready" }),
  createControlPoint("VAL", { id: "VAL-015", domain: "Financial Validation", title: "Quantity Precision Rule", purpose: "Ensure quantity fields keep controlled precision.", rule: "Quantity validation must enforce supported precision rules.", linked_processes: ["quantity entry", "quantity rounding validation"], implementation_status: "future_ready" }),
  createControlPoint("VAL", { id: "VAL-016", domain: "Presentation Validation", title: "Comma Grouping / Number Presentation Rule", purpose: "Keep visible numeric formatting readable and predictable.", rule: "Number presentation rules must support readable grouping without altering stored numeric truth.", linked_processes: ["numeric formatting", "document number presentation"], implementation_status: "future_ready" }),
  createControlPoint("VAL", { id: "VAL-017", domain: "Validation UX", title: "Inline Guidance Requirement", purpose: "Ensure users receive format guidance before they hit preventable validation errors.", rule: "Relevant validation fields must expose inline guidance where structure is not obvious.", linked_processes: ["field hint rendering", "input guidance"], implementation_status: "implemented" }),
  createControlPoint("VAL", { id: "VAL-018", domain: "Validation UX", title: "Submission Blocking Rule", purpose: "Ensure critical invalid data cannot pass through save or submit flows.", rule: "Submission must block when critical validation rules fail.", linked_processes: ["submit gating", "critical validation enforcement"], severity: "critical", implementation_status: "implemented" }),
] as const;

const securityControlPoints = [
  createControlPoint("SEC", { id: "SEC-001", domain: "Tenant Isolation", title: "Tenant Resource Ownership Check", purpose: "Ensure records belong to the tenant context that is attempting access.", rule: "Every protected resource access must verify tenant resource ownership.", linked_modules: ["identity-workspace", "proof-layer", "compliance-layer"], linked_processes: ["resource fetch", "resource mutation"], severity: "critical", implementation_status: "future_ready" }),
  createControlPoint("SEC", { id: "SEC-002", domain: "Tenant Isolation", title: "User Belongs to Tenant Check", purpose: "Ensure the acting user is attached to the tenant context they are using.", rule: "Every protected action must verify that the user belongs to the active tenant.", linked_processes: ["session validation", "tenant membership validation"], severity: "critical", implementation_status: "future_ready" }),
  createControlPoint("SEC", { id: "SEC-003", domain: "Tenant Isolation", title: "Role Allows Action Check", purpose: "Ensure role and permission checks complete the triple-check isolation rule.", rule: "Every protected action must verify the active role allows the requested action.", linked_processes: ["ability check", "permission validation"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("SEC", { id: "SEC-004", domain: "Tenant Isolation", title: "Cross-Tenant Leak Prevention", purpose: "Prevent accidental or unauthorized data exposure across tenant boundaries.", rule: "System must prevent cross-tenant data leaks in reads, writes, exports, and logs.", linked_processes: ["tenant-bound query review", "cross-tenant export review"], severity: "critical", implementation_status: "future_ready" }),
  createControlPoint("SEC", { id: "SEC-005", domain: "Access Control", title: "RBAC Enforcement", purpose: "Ensure roles and permissions are actually enforced, not just documented.", rule: "System must enforce role-based access control across protected actions.", linked_modules: ["identity-workspace", "ui-ux-shell", "proof-layer"], linked_processes: ["role gating", "permission enforcement"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("SEC", { id: "SEC-006", domain: "Audit Logging", title: "Sensitive Action Logging", purpose: "Keep critical business and security actions auditable.", rule: "Sensitive actions must be logged.", linked_processes: ["sensitive action capture", "security review"], severity: "high", implementation_status: "future_ready" }),
  createControlPoint("SEC", { id: "SEC-007", domain: "Audit Logging", title: "Audit Log User Identity", purpose: "Ensure audit entries identify the acting user.", rule: "Audit logs must store the acting user identity.", linked_processes: ["audit entry creation", "user identity trace"], implementation_status: "future_ready" }),
  createControlPoint("SEC", { id: "SEC-008", domain: "Audit Logging", title: "Audit Log Timestamp", purpose: "Ensure audit entries carry event timing for review and sequencing.", rule: "Audit logs must store event timestamp.", linked_processes: ["audit entry creation", "event chronology review"], implementation_status: "future_ready" }),
  createControlPoint("SEC", { id: "SEC-009", domain: "Audit Logging", title: "Audit Log IP Capture", purpose: "Prepare audit logging for network-origin traceability.", rule: "Audit logs must capture IP information where applicable.", linked_processes: ["audit entry enrichment", "network trace review"], implementation_status: "future_ready" }),
  createControlPoint("SEC", { id: "SEC-010", domain: "Audit Logging", title: "Audit Log Immutability", purpose: "Prevent audit history from being silently rewritten.", rule: "Audit logs must be immutable once committed.", linked_processes: ["audit storage", "tamper review"], severity: "critical", implementation_status: "future_ready" }),
  createControlPoint("SEC", { id: "SEC-011", domain: "Retention", title: "90-Day Hot Retention", purpose: "Prepare recent audit data for rapid operational access.", rule: "Audit retention must support at least 90 days of hot-access storage.", linked_processes: ["audit retention policy", "recent audit retrieval"], implementation_status: "future_ready" }),
  createControlPoint("SEC", { id: "SEC-012", domain: "Retention", title: "Long-Term Archive Retention", purpose: "Prepare long-term audit storage beyond the hot window.", rule: "Audit retention must support long-term archived storage.", linked_processes: ["archive retention policy", "historical evidence retrieval"], implementation_status: "future_ready" }),
  createControlPoint("SEC", { id: "SEC-013", domain: "Failure Evidence", title: "Process Abort Logging", purpose: "Ensure failed or aborted sensitive processes are visible for review.", rule: "Sensitive or regulated process aborts must be logged.", linked_processes: ["process failure capture", "abort review"], implementation_status: "future_ready" }),
  createControlPoint("SEC", { id: "SEC-014", domain: "Audit Review", title: "Audit Readiness Reviewability", purpose: "Make audit evidence retrievable for later regulator or auditor review.", rule: "Audit evidence must be reviewable in a structured way.", linked_processes: ["audit review", "evidence retrieval"], implementation_status: "future_ready" }),
  createControlPoint("SEC", { id: "SEC-015", domain: "Audit Review", title: "Security Evidence Traceability", purpose: "Ensure security evidence remains linked to the relevant action or record.", rule: "Security evidence must remain traceable to the protected action or object.", linked_processes: ["security evidence storage", "traceability review"], implementation_status: "future_ready" }),
] as const;

const brandingControlPoints = [
  createControlPoint("BRD", { id: "BRD-001", domain: "Brand Asset Governance", title: "Full Wordmark Usage Rule", purpose: "Ensure the full Gulf Hisab wordmark is used wherever full brand identity is required.", rule: "Use Gulf Hisab SVG Logo 1 where full brand identity is required.", linked_modules: ["template-engine", "document-engine", "ui-ux-shell"], linked_processes: ["header branding", "workspace branding"], implementation_status: "future_ready", evidence_required: ["document sample", "template preview", "ui evidence"] }),
  createControlPoint("BRD", { id: "BRD-002", domain: "Brand Asset Governance", title: "Icon-Only Usage Rule", purpose: "Ensure icon-only branding is reserved for compact contexts.", rule: "Use Gulf Hisabl SVG Logo 2 only where compact icon usage is appropriate.", linked_processes: ["compact header branding", "icon branding review"], implementation_status: "future_ready" }),
  createControlPoint("BRD", { id: "BRD-003", domain: "Document Branding", title: "Document Header Branding Rule", purpose: "Keep official document headers aligned to approved brand usage.", rule: "Document headers must use approved Gulf Hisab branding consistently.", linked_processes: ["document header rendering", "template branding review"], implementation_status: "future_ready" }),
  createControlPoint("BRD", { id: "BRD-004", domain: "Document Branding", title: "No Logo Overlap Rule", purpose: "Prevent logos from colliding with business content or legal fields.", rule: "Brand logos must not overlap document content or compliance fields.", linked_processes: ["logo placement review", "output collision review"], implementation_status: "future_ready" }),
  createControlPoint("BRD", { id: "BRD-005", domain: "Asset Quality", title: "Logo Resolution / Quality Rule", purpose: "Keep document and UI outputs free from degraded branding quality.", rule: "Brand logos must render at approved resolution and quality.", linked_processes: ["asset quality validation", "pdf branding review"], implementation_status: "future_ready" }),
  createControlPoint("BRD", { id: "BRD-006", domain: "Document Branding", title: "Watermark Governance Rule", purpose: "Control when watermarking is allowed and how it appears.", rule: "Watermarks must follow governed business rules and must not compromise readability.", linked_processes: ["watermark rendering", "document review"], implementation_status: "future_ready" }),
  createControlPoint("BRD", { id: "BRD-007", domain: "Localization", title: "Bilingual Branding Layout Consistency", purpose: "Keep bilingual branding balanced across English and Arabic layouts.", rule: "Branding layout must remain consistent across bilingual outputs.", linked_processes: ["bilingual template review", "brand alignment review"], implementation_status: "future_ready" }),
  createControlPoint("BRD", { id: "BRD-008", domain: "Template Branding", title: "Template Branding Consistency", purpose: "Ensure all approved templates respect the same official brand rules.", rule: "Templates must apply brand assets consistently across approved layouts.", linked_processes: ["template branding review", "default template review"], implementation_status: "future_ready" }),
  createControlPoint("BRD", { id: "BRD-009", domain: "Rendering Integrity", title: "Output Branding Consistency Across Preview/PDF", purpose: "Ensure branding does not drift between preview and final PDF outputs.", rule: "Branding must remain consistent across preview and PDF output.", linked_processes: ["preview branding review", "pdf branding review"], implementation_status: "future_ready" }),
] as const;

const crossModuleControlPoints = [
  createControlPoint("XMD", { id: "XMD-001", domain: "Cross-Module Traceability", title: "Invoice-to-Journal Link", purpose: "Ensure invoices retain a traceable accounting posting link.", rule: "Every posted invoice must link to its resulting journal.", linked_modules: ["document-engine", "accounting-engine", "proof-layer"], linked_processes: ["invoice finalization", "journal trace review"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("XMD", { id: "XMD-002", domain: "Cross-Module Traceability", title: "Payment-to-Journal Link", purpose: "Ensure payment activity remains traceable into accounting.", rule: "Every posted payment must link to its resulting journal.", linked_processes: ["payment posting", "payment journal review"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("XMD", { id: "XMD-003", domain: "Cross-Module Traceability", title: "Inventory-to-COGS-to-Journal Link", purpose: "Ensure physical movement, costing, and accounting remain connected.", rule: "Every sale-related inventory movement must link through COGS into journal impact.", linked_modules: ["inventory-engine", "accounting-engine", "document-engine"], linked_processes: ["stock-out posting", "cogs journal review"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("XMD", { id: "XMD-004", domain: "Cross-Module Traceability", title: "Credit Note Accounting Link", purpose: "Ensure credit-note commercial adjustments remain connected to accounting impact.", rule: "Every posted credit note must retain accounting linkage.", linked_processes: ["credit note posting", "credit note journal review"], implementation_status: "future_ready" }),
  createControlPoint("XMD", { id: "XMD-005", domain: "Cross-Module Traceability", title: "Debit Note Accounting Link", purpose: "Ensure debit-note commercial adjustments remain connected to accounting impact.", rule: "Every posted debit note must retain accounting linkage.", linked_processes: ["debit note posting", "debit note journal review"], implementation_status: "future_ready" }),
  createControlPoint("XMD", { id: "XMD-006", domain: "State Consistency", title: "Document Status vs Accounting State Consistency", purpose: "Prevent documents and accounting state from drifting apart.", rule: "Document status must remain consistent with resulting accounting state.", linked_modules: ["document-engine", "accounting-engine", "workflow-intelligence"], linked_processes: ["status transition review", "posting state review"], severity: "critical", implementation_status: "future_ready" }),
  createControlPoint("XMD", { id: "XMD-007", domain: "State Consistency", title: "VAT Engine vs Invoice Engine Consistency", purpose: "Ensure tax decisions and invoice data remain aligned.", rule: "VAT engine output must remain consistent with invoice engine data and presentation.", linked_modules: ["tax-vat-engine", "document-engine", "compliance-layer"], linked_processes: ["invoice tax review", "compliance payload review"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("XMD", { id: "XMD-008", domain: "Master Data Dependency", title: "Customer Master Data Dependency Integrity", purpose: "Keep customer master data dependencies explicit and reliable across modules.", rule: "Customer-dependent flows must use current controlled master data without silent divergence.", linked_modules: ["contacts-counterparties", "document-engine", "tax-vat-engine"], linked_processes: ["customer selection", "tax decision dependency"], implementation_status: "future_ready" }),
  createControlPoint("XMD", { id: "XMD-009", domain: "Master Data Dependency", title: "Company Profile Single Source of Truth Dependency", purpose: "Keep company identity and compliance metadata centralized.", rule: "Dependent modules must source company identity and compliance metadata from the controlled company profile source of truth.", linked_modules: ["company-profile", "document-engine", "tax-vat-engine", "template-engine"], linked_processes: ["company profile propagation", "document default rendering"], severity: "critical", implementation_status: "implemented" }),
  createControlPoint("XMD", { id: "XMD-010", domain: "State Consistency", title: "Register / Detail / Print Data Consistency", purpose: "Ensure the same business truth appears in lists, details, and printed outputs.", rule: "Register, detail, and print surfaces must remain consistent for the same record.", linked_modules: ["document-engine", "ui-ux-shell", "template-engine"], linked_processes: ["register review", "detail review", "print review"], severity: "high", implementation_status: "future_ready" }),
] as const;

export const standardsControlPoints = [
  ...accountingControlPoints,
  ...inventoryControlPoints,
  ...vatControlPoints,
  ...documentControlPoints,
  ...templateControlPoints,
  ...uiControlPoints,
  ...formControlPoints,
  ...validationControlPoints,
  ...securityControlPoints,
  ...brandingControlPoints,
  ...crossModuleControlPoints,
] as const satisfies readonly StandardsControlPoint[];

export const standardsControlPointCategories = controlPointCategoryNames;
export const standardsControlPointIds = standardsControlPoints.map((controlPoint) => controlPoint.id);

export const standardsControlPointsByCategory = Object.fromEntries(
  controlPointCategoryDefinitions.map((category) => [
    category.name,
    standardsControlPoints.filter((controlPoint) => controlPoint.category_code === category.code),
  ]),
) as Record<ControlPointCategory, StandardsControlPoint[]>;

export type ControlPointValidationSummary = ControlPointRegistryValidation;

export function validateStandardsControlPoints(controlPoints: readonly StandardsControlPoint[] = standardsControlPoints) {
  return validateControlPointRegistry(controlPoints);
}

export const standardsControlPointValidation = validateStandardsControlPoints();