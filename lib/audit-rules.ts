/* ─── Gulf Hisab AI Review Assistant — Audit Rules Engine ─── */
/* Static heuristic checks that run against the known route/module registry */

import type {
  AuditFinding,
  FindingSeverity,
  FindingCategory,
  AuditModule,
} from "./audit-types";
import { KNOWN_ROUTES } from "./audit-collector";

type SeedFinding = Omit<AuditFinding, "id" | "createdAt" | "updatedAt" | "evidence" | "generatedPrompt" | "auditRunId"> & {
  evidence: string[];
  generatedPrompt: string;
};

function seed(
  title: string,
  module: AuditModule,
  route: string,
  category: FindingCategory,
  severity: FindingSeverity,
  description: string,
  rootCause: string,
  suggestedFixes: string[],
): SeedFinding {
  return {
    title,
    module,
    route,
    category,
    severity,
    status: "new",
    description,
    rootCause,
    suggestedFixes,
    evidence: [],
    generatedPrompt: "",
  };
}

// ─── Rule: Placeholder Pages ───
function detectPlaceholderPages(): SeedFinding[] {
  return KNOWN_ROUTES
    .filter((r) => r.isPlaceholder)
    .map((r) => seed(
      `Placeholder page: ${r.label}`,
      r.module,
      r.route,
      "product_maturity",
      r.module === "sales" || r.module === "purchases" || r.module === "accounting" || r.module === "inventory" ? "critical" : "major",
      `Route ${r.route} resolves to the catch-all placeholder (WorkspaceModulePage) instead of a dedicated component. Shows generic module description and links instead of real workflow.`,
      `No dedicated page.tsx file with a real component import exists for this route. The app/workspace/[...slug]/page.tsx catch-all handles it.`,
      [
        `Create app/workspace/${r.route.replace("/workspace/", "")}/page.tsx with a dedicated component.`,
        `Build the component with proper register/form/dashboard pattern matching the module's purpose.`,
        `Remove reliance on catch-all for this route.`,
      ],
    ));
}

// ─── Rule: Wrong Action Contamination ───
function detectWrongActionContamination(): SeedFinding[] {
  const findings: SeedFinding[] = [];

  // Inventory Adjustments should NOT have: Create Invoice, Record Payment, Add Customer
  const inventoryAdjRoute = KNOWN_ROUTES.find((r) => r.route === "/workspace/user/inventory-adjustments");
  if (inventoryAdjRoute?.isPlaceholder) {
    findings.push(seed(
      "Wrong actions on Inventory Adjustments page",
      "inventory",
      "/workspace/user/inventory-adjustments",
      "wrong_action_contamination",
      "critical",
      "Inventory Adjustments page shows generic quick actions from the User role (Create Invoice, Record Payment, Add Customer) instead of inventory-specific actions (New Adjustment, Stock Count).",
      "The page uses the catch-all WorkspaceModulePage which inherits the role's generic quickActions instead of module-specific actions.",
      [
        "Build a dedicated InventoryAdjustmentsRegister component.",
        "Quick actions should be: New Adjustment, Stock Count, Import Adjustments.",
        "Remove all sales/AR-related actions from this page.",
      ],
    ));
  }

  // Supplier Payments should NOT have: Create Invoice, Add Customer
  const vendorPayRoute = KNOWN_ROUTES.find((r) => r.route === "/workspace/user/vendor-payments");
  if (vendorPayRoute?.isPlaceholder) {
    findings.push(seed(
      "Wrong actions on Supplier Payments page",
      "purchases",
      "/workspace/user/vendor-payments",
      "wrong_action_contamination",
      "critical",
      "Supplier Payments page shows Create Invoice and Add Customer actions instead of Record Supplier Payment, Link to Bill.",
      "Same catch-all inheritance of User role quickActions.",
      [
        "Build a dedicated SupplierPaymentsRegister component.",
        "Quick actions: Record Payment, Link to Bill, View Aging.",
        "Remove all sales-facing actions.",
      ],
    ));
  }

  // Stock Register should NOT have sales actions
  const stockRoute = KNOWN_ROUTES.find((r) => r.route === "/workspace/user/stock");
  if (stockRoute?.isPlaceholder) {
    findings.push(seed(
      "Wrong actions on Stock Register page",
      "inventory",
      "/workspace/user/stock",
      "wrong_action_contamination",
      "major",
      "Stock Register page shows generic quick actions from User role instead of stock-specific actions.",
      "Catch-all placeholder inheriting role actions.",
      [
        "Build a dedicated StockRegister component showing current stock levels per product.",
        "Quick actions: Adjust Stock, Filter by Category, Export.",
      ],
    ));
  }

  return findings;
}

// ─── Rule: Inventory Logic Flaws ───
function detectInventoryFlaws(): SeedFinding[] {
  const findings: SeedFinding[] = [];

  // Item code enforcement was added — QuickCreateItemForm now requires code for
  // product, raw_material, and finished_good types. Keeping as medium for
  // uniqueness validation which is still pending server-side.
  findings.push(seed(
    "Item code uniqueness not validated server-side",
    "inventory",
    "/workspace/user/products",
    "inventory_logic",
    "medium",
    "QuickCreateItemForm now enforces mandatory item codes for inventory-tracked items, but uniqueness validation is only client-side. Server-side unique constraint on item_code is needed.",
    "Backend Item model does not yet enforce a unique constraint on the sku/item_code column.",
    [
      "Add unique index on items.sku in the database migration.",
      "Return 422 with clear message when duplicate code is submitted.",
    ],
  ));

  return findings;
}

// ─── Rule: Accounting Logic ───
function detectAccountingFlaws(): SeedFinding[] {
  const findings: SeedFinding[] = [];

  findings.push(seed(
    "Bill/expense account classification too shallow",
    "accounting",
    "/workspace/bills/new",
    "accounting_logic",
    "major",
    "The bill creation form does not explicitly support expense categories like salary, HR, R&D, PR, utilities, rent, consulting through the account selection path. Users must manually pick the right expense account without category guidance.",
    "TransactionForm uses a flat account picker without expense-category grouping or shortcuts.",
    [
      "Group expense accounts by category in the account picker: Operations, HR & Payroll, Professional Services, Administrative, Utilities, Marketing.",
      "Show expense account category hints in the line item editor when creating bills.",
      "Ensure the CoA has appropriate expense sub-accounts for these categories.",
    ],
  ));

  findings.push(seed(
    "Journal entry account dropdown may clip or overflow",
    "accounting",
    "/workspace/user/journal-entries",
    "form_quality",
    "major",
    "The journal entry form uses an account picker dropdown that may clip behind other UI elements or overflow the viewport, making account selection difficult.",
    "Dropdown z-index and positioning may not account for the workspace shell's sidebar and header layers.",
    [
      "Ensure account picker dropdown uses z-50 or higher.",
      "Use portal-based dropdown rendering to escape parent overflow:hidden containers.",
      "Test with sidebar open and closed states.",
    ],
  ));

  return findings;
}

// ─── Rule: Document Engine ───
function detectDocumentEngineFlaws(): SeedFinding[] {
  const findings: SeedFinding[] = [];

  // Check if any document register pages might show preview by default
  const docRoutes = KNOWN_ROUTES.filter((r) =>
    ["invoices", "quotations", "bills", "credit-notes", "debit-notes", "proforma-invoices", "purchase-orders", "expenses"].some(
      (seg) => r.route.includes(seg)
    ) && r.module !== "templates"
  );

  // Template-specific document registers that need the same behavior
  for (const r of docRoutes) {
    if (r.isPlaceholder && (r.module === "purchases" || r.module === "sales")) {
      findings.push(seed(
        `Document register missing for: ${r.label}`,
        r.module,
        r.route,
        "document_engine",
        r.route.includes("bill") || r.route.includes("purchase-order") ? "critical" : "major",
        `${r.label} route uses the generic catch-all placeholder instead of a document register with proper register-only default, split preview, and document-type-specific columns.`,
        "No dedicated register component exists for this document type.",
        [
          `Build a dedicated register component for ${r.label} following the DocumentCenterOverview pattern.`,
          "Ensure register-only default mode, split on click, compact rows, hidden filters.",
        ],
      ));
    }
  }

  return findings;
}

// ─── Rule: Layout / Branding ───
function detectLayoutBrandingFlaws(): SeedFinding[] {
  const findings: SeedFinding[] = [];

  findings.push(seed(
    "Layout Editor may lack EditableRegion wrappers on pages",
    "shell",
    "/workspace/user",
    "layout_density",
    "medium",
    "The Layout Editor infrastructure (LayoutEditorProvider, LayoutEditorPanel, EditableRegion) was built but EditableRegion wrappers may not be applied to individual page components yet, limiting editor functionality.",
    "EditableRegion must wrap specific page sections for the layout editor to detect and modify them.",
    [
      "Wrap key page sections (register, preview, toolbar, sidebar groups) in EditableRegion.",
      "Assign meaningful regionId values for each wrapped section.",
    ],
  ));

  return findings;
}

// ─── Rule: Shell / Navigation ───
function detectNavigationFlaws(): SeedFinding[] {
  const findings: SeedFinding[] = [];

  // Dead/breaking routes in sidebar
  const placeholderRoutes = KNOWN_ROUTES.filter((r) => r.isPlaceholder);
  if (placeholderRoutes.length > 10) {
    findings.push(seed(
      `${placeholderRoutes.length} sidebar routes resolve to placeholders`,
      "shell",
      "/workspace",
      "shell_navigation",
      "major",
      `${placeholderRoutes.length} routes in the sidebar navigation resolve to the catch-all placeholder page instead of dedicated components. This creates a poor navigation experience where users click menu items and see generic module descriptions.`,
      "Many routes lack dedicated page.tsx files with real component implementations.",
      [
        "Prioritize building dedicated pages for high-traffic routes (reports, ledger, banking, reconciliation).",
        "For lower-priority routes, build at minimum a proper empty-state component instead of the generic WorkspaceModulePage.",
      ],
    ));
  }

  return findings;
}

// ─── Rule: Compliance ───
function detectComplianceFlaws(): SeedFinding[] {
  const findings: SeedFinding[] = [];

  findings.push(seed(
    "Missing audit trail UI for journal entries and documents",
    "accounting",
    "/workspace/user/journal-entries",
    "compliance",
    "medium",
    "While AuditTrailPanel component exists and AuditLog model is in the backend, the journal entries register and document registers may not consistently show audit trail information inline.",
    "Audit trail panel needs explicit integration in each register's detail/preview view.",
    [
      "Ensure InvoiceDetailWorkspace includes AuditTrailPanel.",
      "Add audit trail tab/section to journal entry detail view.",
      "Connect to backend AuditLog model for real event data.",
    ],
  ));

  return findings;
}

// ─── Run All Rules ───
export function runAllAuditRules(): SeedFinding[] {
  return [
    ...detectPlaceholderPages(),
    ...detectWrongActionContamination(),
    ...detectInventoryFlaws(),
    ...detectAccountingFlaws(),
    ...detectDocumentEngineFlaws(),
    ...detectLayoutBrandingFlaws(),
    ...detectNavigationFlaws(),
    ...detectComplianceFlaws(),
  ];
}

// ─── Categorized Summary ───
export function summarizeFindings(findings: SeedFinding[]): Record<FindingCategory, number> {
  const summary: Record<string, number> = {};
  for (const f of findings) {
    summary[f.category] = (summary[f.category] ?? 0) + 1;
  }
  return summary as Record<FindingCategory, number>;
}
