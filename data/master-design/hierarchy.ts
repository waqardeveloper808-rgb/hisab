import type { MasterDesignHierarchyNodeSpec, MasterDesignModuleId, MasterDesignNodeType } from "@/types/master-design";
import type { ModuleExecutionStatus } from "@/types/system-map";
import { buildStandardsHierarchyNodes, getControlPointByNodeId } from "@/lib/master-design-control-points";

type RawHierarchyNode = {
  id: string;
  title: string;
  type: MasterDesignNodeType;
  description: string;
  status?: ModuleExecutionStatus;
  completionPercentage?: number;
  linkedStandards?: string[];
  linkedAudits?: string[];
  linkedWorkflows?: string[];
  linkedModuleIds?: MasterDesignModuleId[];
  fakeCompleteRisk?: string | null;
  topBlockerHint?: string | null;
  children?: RawHierarchyNode[];
};

function node(definition: RawHierarchyNode): RawHierarchyNode {
  return {
    status: "PARTIAL",
    completionPercentage: 48,
    linkedStandards: [],
    linkedAudits: [],
    linkedWorkflows: [],
    linkedModuleIds: [],
    fakeCompleteRisk: null,
    topBlockerHint: null,
    children: [],
    ...definition,
  };
}

function finalizeNode(raw: RawHierarchyNode, parentId: string | null = null): MasterDesignHierarchyNodeSpec {
  const children = (raw.children ?? []).map((child) => finalizeNode(child, raw.id));
  const childCount = children.length;
  const completedChildren = children.filter((child) => child.status === "COMPLETE").length;
  const partialChildren = children.filter((child) => child.status === "PARTIAL" || child.status === "MISSING" || child.status === "FAKE-COMPLETE").length;
  const blockedChildren = children.filter((child) => child.status === "BLOCKED").length;
  const blockerCount = blockedChildren + (raw.topBlockerHint ? 1 : 0);

  return {
    id: raw.id,
    parentId,
    title: raw.title,
    type: raw.type,
    description: raw.description,
    status: raw.status ?? "PARTIAL",
    completionPercentage: raw.completionPercentage ?? 0,
    childCount,
    completedChildren,
    partialChildren,
    blockedChildren,
    blockerCount,
    linkedStandards: raw.linkedStandards ?? [],
    linkedAudits: raw.linkedAudits ?? [],
    linkedWorkflows: raw.linkedWorkflows ?? [],
    linkedModuleIds: raw.linkedModuleIds ?? [],
    fakeCompleteRisk: raw.fakeCompleteRisk ?? null,
    topBlockerHint: raw.topBlockerHint ?? null,
    children,
  };
}

const masterDesignModuleIds: MasterDesignModuleId[] = [
  "identity-workspace",
  "company-profile",
  "contacts-counterparties",
  "product-item-service",
  "document-engine",
  "template-engine",
  "accounting-engine",
  "inventory-engine",
  "tax-vat-engine",
  "reports-engine",
  "import-engine",
  "workflow-intelligence",
  "compliance-layer",
  "proof-layer",
  "ui-ux-shell",
  "country-service-architecture",
  "end-to-end-workflow-proof",
];

function isMasterDesignModuleId(value: string): value is MasterDesignModuleId {
  return masterDesignModuleIds.includes(value as MasterDesignModuleId);
}

function controlPointLinkedModules(nodeId: string) {
  return (getControlPointByNodeId(nodeId)?.linked_modules ?? []).filter(isMasterDesignModuleId);
}

function controlPointSeverity(nodeId: string) {
  return getControlPointByNodeId(nodeId)?.severity ?? null;
}

function generatedStandardNode(rawNode: ReturnType<typeof buildStandardsHierarchyNodes>[number]): RawHierarchyNode {
  const severity = controlPointSeverity(rawNode.id);
  const controlPoint = getControlPointByNodeId(rawNode.id);

  return node({
    id: rawNode.id,
    title: rawNode.title,
    type: "standard",
    description: rawNode.description,
    status: "MISSING",
    completionPercentage: 0,
    linkedStandards: rawNode.controlPointId ? [rawNode.controlPointId] : [],
    linkedModuleIds: controlPointLinkedModules(rawNode.id),
    topBlockerHint: controlPoint ? `Current control-point severity: ${severity}. Audit status: ${controlPoint.state.status}.` : null,
    children: rawNode.children.map((child) => generatedStandardNode(child)),
  });
}

const rawHierarchy = node({
  id: "whole-system",
  title: "Whole System",
  type: "system",
  description: "Command view of Hisabix delivery across product layers, engines, workspaces, standards, proof, and remaining execution risk.",
  status: "PARTIAL",
  completionPercentage: 61,
  linkedStandards: ["Product truth before polish", "No fake completion", "Country expansion must remain unblocked"],
  linkedAudits: ["Master Design control audit", "Workspace restoration audit"],
  linkedWorkflows: ["Workspace entry", "Master Design drill-down", "Evidence packaging"],
  linkedModuleIds: ["identity-workspace", "ui-ux-shell", "workflow-intelligence", "proof-layer", "country-service-architecture"],
  fakeCompleteRisk: "A polished control page can hide broken workflow truth if cards are not tied to real comparison state.",
  topBlockerHint: "Keep hierarchy navigation dense and actionable while preserving the existing execution surfaces below.",
  children: [
    node({
      id: "core-system",
      title: "Core System",
      type: "category",
      description: "Operational product surface for company setup, counterparties, catalog, sales, purchases, accounting, and inventory.",
      status: "PARTIAL",
      completionPercentage: 67,
      linkedStandards: ["Business truth persists once", "Commercial flows must not route through marketing"],
      linkedAudits: ["Operational module audit"],
      linkedWorkflows: ["Company setup", "Sales document lifecycle", "Accounting review"],
      linkedModuleIds: ["company-profile", "contacts-counterparties", "product-item-service", "document-engine", "accounting-engine", "inventory-engine"],
      children: [
        node({
          id: "company-and-identity",
          title: "Company & Identity",
          type: "sub-category",
          description: "Company metadata, branches, legal identity, and ownership defaults consumed by documents and reports.",
          completionPercentage: 72,
          linkedWorkflows: ["Company setup to invoice output"],
          linkedModuleIds: ["company-profile", "identity-workspace"],
        }),
        node({
          id: "commercial-records",
          title: "Commercial Records",
          type: "sub-category",
          description: "Customers, suppliers, products, services, and reusable commercial data that feed downstream workflows.",
          completionPercentage: 69,
          linkedWorkflows: ["Customer setup", "Supplier setup", "Item reuse in document"],
          linkedModuleIds: ["contacts-counterparties", "product-item-service"],
        }),
        node({
          id: "accounting-and-inventory-core",
          title: "Accounting & Inventory Core",
          type: "sub-category",
          description: "Ledger truth, journals, stock state, and transaction-linked inventory accounting.",
          status: "BLOCKED",
          completionPercentage: 58,
          linkedAudits: ["Accounting truth audit", "Inventory accounting audit"],
          linkedWorkflows: ["Stock intake", "Invoice to ledger"],
          linkedModuleIds: ["accounting-engine", "inventory-engine"],
          topBlockerHint: "Evidence must keep proving live posting and stock valuation behavior.",
        }),
      ],
    }),
    node({
      id: "engine-system",
      title: "Engine System",
      type: "category",
      description: "Document, template, accounting, inventory, VAT, report, import, and workflow engines that own business truth.",
      status: "PARTIAL",
      completionPercentage: 59,
      linkedStandards: ["Engines own truth", "Cross-engine linkage must be explicit"],
      linkedAudits: ["Engine linkage audit"],
      linkedWorkflows: ["Template edit to live output", "Invoice to accounting to VAT"],
      linkedModuleIds: ["document-engine", "template-engine", "accounting-engine", "inventory-engine", "tax-vat-engine", "reports-engine", "import-engine", "workflow-intelligence"],
      children: [
        node({
          id: "document-engine-cluster",
          title: "Document Engine Cluster",
          type: "sub-category",
          description: "Drafting, finalization, preview, PDF, and commercial-document rendering contract.",
          completionPercentage: 63,
          linkedModuleIds: ["document-engine", "template-engine"],
        }),
        node({
          id: "financial-engine-cluster",
          title: "Financial Engine Cluster",
          type: "sub-category",
          description: "Accounting, inventory, and VAT engines tied to posting and reconciliation truth.",
          status: "BLOCKED",
          completionPercentage: 54,
          linkedModuleIds: ["accounting-engine", "inventory-engine", "tax-vat-engine"],
          topBlockerHint: "Do not overstate completion while proof is still needed around end-to-end transaction posting.",
        }),
        node({
          id: "report-import-cluster",
          title: "Report & Import Cluster",
          type: "sub-category",
          description: "Imports, reconciliation, and reporting outputs that expose the resulting system truth.",
          completionPercentage: 60,
          linkedModuleIds: ["reports-engine", "import-engine"],
        }),
      ],
    }),
    node({
      id: "layer-system",
      title: "Layer System",
      type: "category",
      description: "Shell, guidance, proof, and orchestration layers that expose engine state without masking it.",
      status: "PARTIAL",
      completionPercentage: 66,
      linkedStandards: ["Layers report truth, they do not replace missing engines"],
      linkedAudits: ["Layer integrity audit"],
      linkedWorkflows: ["Sidebar use", "Control-surface review", "Evidence review"],
      linkedModuleIds: ["ui-ux-shell", "workflow-intelligence", "proof-layer"],
      fakeCompleteRisk: "The shell can look complete even when critical workflows still fail behind it.",
      children: [
        node({
          id: "workspace-shell-layer",
          title: "Workspace Shell",
          type: "sub-category",
          description: "Sidebar, dense navigation, role switching, page framing, and route ownership inside the product shell.",
          completionPercentage: 78,
          linkedModuleIds: ["ui-ux-shell", "identity-workspace"],
        }),
        node({
          id: "workflow-guidance-layer",
          title: "Workflow Guidance",
          type: "sub-category",
          description: "Guidance, assistant surfaces, and workflow visibility layers that must remain tied to real blockers.",
          completionPercentage: 51,
          linkedModuleIds: ["workflow-intelligence"],
        }),
        node({
          id: "evidence-layer",
          title: "Evidence Layer",
          type: "sub-category",
          description: "Proof scripts, screenshots, and validation logs used to accept or reject completion claims.",
          status: "PARTIAL",
          completionPercentage: 69,
          linkedModuleIds: ["proof-layer", "end-to-end-workflow-proof"],
        }),
      ],
    }),
    node({
      id: "workflow-system",
      title: "Workflow System",
      type: "category",
      description: "Business and control workflows that must stay visible, navigable, and provable across the product.",
      completionPercentage: 57,
      linkedAudits: ["Workflow continuity audit"],
      linkedWorkflows: ["Sales lifecycle", "Purchase lifecycle", "Workspace switching"],
      linkedModuleIds: ["document-engine", "accounting-engine", "inventory-engine", "proof-layer"],
      children: [
        node({
          id: "sales-workflows",
          title: "Sales Workflows",
          type: "workflow",
          description: "Quotation, proforma, tax invoice, payment, and receivable continuity.",
          completionPercentage: 64,
          linkedModuleIds: ["document-engine", "accounting-engine", "reports-engine"],
        }),
        node({
          id: "purchase-workflows",
          title: "Purchase Workflows",
          type: "workflow",
          description: "Bill creation, supplier coordination, payment, and payable continuity.",
          completionPercentage: 55,
          linkedModuleIds: ["document-engine", "accounting-engine"],
        }),
        node({
          id: "inventory-workflows",
          title: "Inventory Workflows",
          type: "workflow",
          description: "Stock receipt, issue, adjustment, and accounting-linked stock movement flows.",
          status: "BLOCKED",
          completionPercentage: 49,
          linkedModuleIds: ["inventory-engine", "accounting-engine"],
          topBlockerHint: "Inventory proof still needs to stay visible as a live blocker where required.",
        }),
      ],
    }),
    node({
      id: "standards",
      title: "Standards",
      type: "category",
      description: "Execution rules and UX standards sourced from the structured control-points registry and attached to live Master Design nodes.",
      status: "MISSING",
      completionPercentage: 0,
      linkedStandards: ["Visible standards registry", "No fake-complete standards claims"],
      linkedAudits: ["Standards compliance audit"],
      linkedModuleIds: ["ui-ux-shell", "document-engine", "proof-layer"],
      fakeCompleteRisk: "Standards can look complete on paper while product behavior still violates them in practice.",
      children: buildStandardsHierarchyNodes().map((child) => generatedStandardNode(child)),
    }),
    node({
      id: "audits",
      title: "Audits",
      type: "category",
      description: "Audit registry for practical system review categories that will expand later without changing this layout.",
      completionPercentage: 44,
      linkedAudits: ["Button audit", "Workflow audit", "Navigation audit"],
      linkedModuleIds: ["workflow-intelligence", "proof-layer", "ui-ux-shell"],
      children: [
        node({ id: "button-audit", title: "Button Audit", type: "audit", description: "Action discoverability and correctness audit.", completionPercentage: 38, linkedModuleIds: ["ui-ux-shell"] }),
        node({ id: "form-audit", title: "Form Audit", type: "audit", description: "Validation, save, draft, and error audit.", completionPercentage: 41, linkedModuleIds: ["document-engine"] }),
        node({ id: "register-audit", title: "Register Audit", type: "audit", description: "List density, filtering, and row-detail audit.", completionPercentage: 37, linkedModuleIds: ["reports-engine"] }),
        node({ id: "workflow-audit", title: "Workflow Audit", type: "audit", description: "End-to-end workflow completion and no-dead-end audit.", completionPercentage: 50, linkedModuleIds: ["workflow-intelligence", "proof-layer"] }),
        node({ id: "navigation-audit", title: "Navigation Audit", type: "audit", description: "Sidebar, route ownership, breadcrumbs, and switching audit.", completionPercentage: 61, linkedModuleIds: ["identity-workspace", "ui-ux-shell"] }),
        node({ id: "workspace-audit", title: "Workspace Audit", type: "audit", description: "User, admin, assistant, agent, and Master Design access audit.", completionPercentage: 64, linkedModuleIds: ["identity-workspace"] }),
        node({ id: "ui-audit", title: "UI Audit", type: "audit", description: "Visual consistency, density, and interaction affordance audit.", completionPercentage: 40, linkedModuleIds: ["ui-ux-shell"] }),
        node({ id: "ux-audit", title: "UX Audit", type: "audit", description: "Comprehension, task path clarity, and dead-end audit.", completionPercentage: 43, linkedModuleIds: ["ui-ux-shell"] }),
        node({ id: "graphics-audit", title: "Graphics Audit", type: "audit", description: "Graphic clarity and hierarchy audit for control surfaces.", completionPercentage: 29, linkedModuleIds: ["ui-ux-shell"] }),
        node({ id: "text-cards-audit", title: "Text & Cards Audit", type: "audit", description: "Card density and copy precision audit.", completionPercentage: 36, linkedModuleIds: ["ui-ux-shell"] }),
        node({ id: "document-audit", title: "Document Audit", type: "audit", description: "Document preview, finalization, and output parity audit.", completionPercentage: 45, linkedModuleIds: ["document-engine", "template-engine"] }),
        node({ id: "template-audit", title: "Template Audit", type: "audit", description: "Template editing and output linkage audit.", completionPercentage: 39, linkedModuleIds: ["template-engine"] }),
        node({ id: "import-audit", title: "Import Audit", type: "audit", description: "Import validation, mapping, and execution audit.", completionPercentage: 48, linkedModuleIds: ["import-engine"] }),
        node({ id: "security-audit", title: "Security Audit", type: "audit", description: "Role access, visibility, and workspace security audit.", completionPercentage: 44, linkedModuleIds: ["identity-workspace"] }),
        node({ id: "compliance-audit", title: "Compliance Audit", type: "audit", description: "Country-specific VAT and compliance behavior audit.", completionPercentage: 46, linkedModuleIds: ["tax-vat-engine"] }),
        node({ id: "reporting-audit", title: "Reporting Audit", type: "audit", description: "Report accuracy and explainability audit.", completionPercentage: 41, linkedModuleIds: ["reports-engine"] }),
        node({ id: "proof-audit", title: "Proof Audit", type: "audit", description: "Evidence quality and proof continuity audit.", completionPercentage: 58, linkedModuleIds: ["proof-layer", "end-to-end-workflow-proof"] }),
      ],
    }),
    node({
      id: "navigation-workspace",
      title: "Navigation / Workspace",
      type: "category",
      description: "Workspace-specific navigation and discoverability structure across roles and shell surfaces.",
      completionPercentage: 73,
      linkedStandards: ["Back never leaves users lost", "Workspace access remains product-first"],
      linkedAudits: ["Workspace audit", "Navigation audit"],
      linkedWorkflows: ["Role switching", "Sidebar navigation", "Quick create"],
      linkedModuleIds: ["identity-workspace", "ui-ux-shell"],
      children: [
        node({ id: "user-workspace-node", title: "User Workspace", type: "sub-category", description: "Primary operational workspace for end users.", completionPercentage: 84, linkedModuleIds: ["identity-workspace", "ui-ux-shell"] }),
        node({ id: "admin-workspace-node", title: "Admin Workspace", type: "sub-category", description: "Administrative workspace with governance and oversight tools.", completionPercentage: 71, linkedModuleIds: ["identity-workspace", "ui-ux-shell"] }),
        node({ id: "assistant-workspace-node", title: "Assistant Workspace", type: "sub-category", description: "Assistant workspace for guided execution and support roles.", completionPercentage: 69, linkedModuleIds: ["identity-workspace", "ui-ux-shell"] }),
        node({ id: "agent-workspace-node", title: "Agent Workspace", type: "sub-category", description: "Agent workspace for support, execution, and workflow intervention.", completionPercentage: 67, linkedModuleIds: ["identity-workspace", "ui-ux-shell"] }),
        node({ id: "sidebar-architecture", title: "Sidebar Architecture", type: "sub-category", description: "Sidebar grouping, persistence, and discoverability inside the product shell.", completionPercentage: 79, linkedModuleIds: ["ui-ux-shell"] }),
        node({ id: "workspace-switching", title: "Workspace Switching", type: "sub-category", description: "Role-switch links and destination continuity between workspaces.", completionPercentage: 76, linkedModuleIds: ["identity-workspace", "ui-ux-shell"] }),
        node({ id: "breadcrumbs-node", title: "Breadcrumbs", type: "sub-category", description: "Context-preserving location indicators and ancestor navigation.", completionPercentage: 61, linkedModuleIds: ["ui-ux-shell"] }),
        node({ id: "quick-create", title: "Quick Create", type: "sub-category", description: "Fast-entry patterns that shorten common document and record creation paths.", completionPercentage: 43, linkedModuleIds: ["ui-ux-shell", "document-engine"] }),
        node({ id: "discoverability", title: "Discoverability", type: "sub-category", description: "Users should be able to understand where to click next without guesswork.", completionPercentage: 58, linkedModuleIds: ["ui-ux-shell", "workflow-intelligence"] }),
        node({ id: "empty-state-guidance", title: "Empty-State Guidance", type: "sub-category", description: "Empty states should teach users what to do next instead of ending the flow.", completionPercentage: 47, linkedModuleIds: ["ui-ux-shell", "workflow-intelligence"] }),
      ],
    }),
    node({
      id: "product-ux-ui",
      title: "UX / UI",
      type: "category",
      description: "Dense card, panel, table, and interaction behavior for workspace users and operators.",
      completionPercentage: 56,
      linkedStandards: ["Dense layout", "Fast comprehension", "No dead-end control surfaces"],
      linkedAudits: ["UI audit", "UX audit"],
      linkedModuleIds: ["ui-ux-shell", "workflow-intelligence"],
      children: [
        node({ id: "dense-cards", title: "Dense Cards", type: "sub-category", description: "Card system for rapid comprehension without giant decorative surfaces.", completionPercentage: 64, linkedModuleIds: ["ui-ux-shell"] }),
        node({ id: "detail-panels", title: "Detail Panels", type: "sub-category", description: "Side panels that explain context, blockers, evidence, and next steps.", completionPercentage: 57, linkedModuleIds: ["ui-ux-shell", "workflow-intelligence"] }),
        node({ id: "table-compatibility", title: "Table Compatibility", type: "sub-category", description: "Keep existing dense tables and execution summaries available beneath the new visual layer.", completionPercentage: 74, linkedModuleIds: ["ui-ux-shell", "proof-layer"] }),
        node({ id: "responsive-structure", title: "Responsive Structure", type: "sub-category", description: "Layout must stack cleanly without breaking comprehension on narrower screens.", completionPercentage: 50, linkedModuleIds: ["ui-ux-shell"] }),
      ],
    }),
    node({
      id: "security-rbac",
      title: "Security",
      type: "category",
      description: "Role-aware workspace visibility and access constraints that future role expansion depends on.",
      completionPercentage: 54,
      linkedStandards: ["Role visibility must match real authority"],
      linkedAudits: ["Security audit", "Workspace audit"],
      linkedModuleIds: ["identity-workspace"],
      children: [
        node({ id: "role-visibility", title: "Role Visibility", type: "sub-category", description: "Users only see the workspace surfaces they should access.", completionPercentage: 63, linkedModuleIds: ["identity-workspace"] }),
        node({ id: "workspace-separation", title: "Workspace Separation", type: "sub-category", description: "Role workspaces remain distinct and future role programs remain expandable.", completionPercentage: 56, linkedModuleIds: ["identity-workspace", "country-service-architecture"] }),
        node({ id: "session-boundaries", title: "Session Boundaries", type: "sub-category", description: "Session state should keep users inside the correct product shell and role context.", completionPercentage: 43, linkedModuleIds: ["identity-workspace"] }),
      ],
    }),
    node({
      id: "template-capability-matrix",
      title: "Templates",
      type: "category",
      description: "Capability map for template editing, binding, preview parity, and future canvas-grade editing depth.",
      completionPercentage: 46,
      linkedStandards: ["Live preview parity", "PDF parity", "Future canvas editing path remains open"],
      linkedAudits: ["Template audit", "Document audit"],
      linkedModuleIds: ["template-engine", "document-engine"],
      children: [
        node({ id: "layout-engine", title: "Layout Engine", type: "sub-category", description: "Base layout structure and template section scaffolding.", completionPercentage: 52, linkedModuleIds: ["template-engine"] }),
        node({ id: "section-ordering", title: "Section Ordering", type: "sub-category", description: "Control of section order and structural sequencing.", completionPercentage: 48, linkedModuleIds: ["template-engine"] }),
        node({ id: "grid-row-column-system", title: "Grid / Row / Column System", type: "sub-category", description: "Reusable structural grid controls for template layout.", completionPercentage: 44, linkedModuleIds: ["template-engine"] }),
        node({ id: "template-component-system", title: "Component System", type: "sub-category", description: "Reusable components and shared document rendering blocks.", completionPercentage: 47, linkedModuleIds: ["template-engine"] }),
        node({ id: "field-binding", title: "Field Binding", type: "sub-category", description: "Binding between document data and template fields.", completionPercentage: 58, linkedModuleIds: ["template-engine", "document-engine"] }),
        node({ id: "conditional-rendering", title: "Conditional Rendering", type: "sub-category", description: "Conditional visibility and fallback behavior within templates.", completionPercentage: 38, linkedModuleIds: ["template-engine"] }),
        node({ id: "typography-controls", title: "Typography Controls", type: "sub-category", description: "Text scale, weight, spacing, and hierarchy controls inside templates.", completionPercentage: 42, linkedModuleIds: ["template-engine"] }),
        node({ id: "branding-assets", title: "Branding Assets", type: "sub-category", description: "Logo, color, and brand asset application inside templates.", completionPercentage: 61, linkedModuleIds: ["template-engine", "company-profile"] }),
        node({ id: "multi-template-support", title: "Multi-template Support", type: "sub-category", description: "More than one template option across document families.", completionPercentage: 49, linkedModuleIds: ["template-engine"] }),
        node({ id: "default-template-selection", title: "Default Template Selection", type: "sub-category", description: "Default template assignment for a company or document family.", completionPercentage: 57, linkedModuleIds: ["template-engine"] }),
        node({ id: "per-document-override", title: "Per-document Override", type: "sub-category", description: "Document-level template override behavior.", completionPercentage: 46, linkedModuleIds: ["template-engine", "document-engine"] }),
        node({ id: "live-preview-parity", title: "Live Preview Parity", type: "sub-category", description: "The live preview must match the effective rendered output.", completionPercentage: 62, linkedModuleIds: ["template-engine", "document-engine"] }),
        node({ id: "pdf-parity", title: "PDF Parity", type: "sub-category", description: "Generated PDF output must match the controlled template outcome.", completionPercentage: 41, linkedModuleIds: ["template-engine", "document-engine"] }),
        node({ id: "wysiwyg-canvas-editing", title: "WYSIWYG Canvas-first Editing", type: "sub-category", description: "Future canvas-grade editing direction that should not be blocked by current architecture.", completionPercentage: 31, linkedModuleIds: ["template-engine"] }),
        node({ id: "drag-drop-editing", title: "Drag / Drop Editing", type: "sub-category", description: "Future structural editing using drag and drop interactions.", completionPercentage: 24, linkedModuleIds: ["template-engine"] }),
      ],
    }),
    node({
      id: "reports-category",
      title: "Reports",
      type: "category",
      description: "Financial, operational, and compliance reporting surfaces that expose system truth.",
      completionPercentage: 53,
      linkedAudits: ["Reporting audit"],
      linkedWorkflows: ["Trial balance", "Profit and loss", "VAT summary"],
      linkedModuleIds: ["reports-engine", "tax-vat-engine"],
      children: [
        node({ id: "financial-reports", title: "Financial Reports", type: "sub-category", description: "Trial balance, ledger, and financial performance reporting.", completionPercentage: 57, linkedModuleIds: ["reports-engine", "accounting-engine"] }),
        node({ id: "operational-reports", title: "Operational Reports", type: "sub-category", description: "Commercial and inventory reporting for day-to-day operations.", completionPercentage: 49, linkedModuleIds: ["reports-engine", "inventory-engine"] }),
        node({ id: "compliance-reports", title: "Compliance Reports", type: "sub-category", description: "VAT and compliance reporting tied to country logic.", completionPercentage: 54, linkedModuleIds: ["reports-engine", "tax-vat-engine"] }),
      ],
    }),
    node({
      id: "proof-evidence-system",
      title: "Proof System",
      type: "category",
      description: "Capture, export, packaging, and proof-readiness structure for accepting completion claims.",
      completionPercentage: 68,
      linkedStandards: ["Failure must be explicit", "Artifacts must retain execution evidence"],
      linkedAudits: ["Proof audit"],
      linkedWorkflows: ["Screenshot capture", "Summary export", "Artifact packaging"],
      linkedModuleIds: ["proof-layer", "end-to-end-workflow-proof"],
      children: [
        node({ id: "capture-scripts", title: "Capture Scripts", type: "evidence", description: "Headless runners and evidence capture scripts for workflow proof.", completionPercentage: 74, linkedModuleIds: ["proof-layer", "end-to-end-workflow-proof"] }),
        node({ id: "artifact-packaging", title: "Artifact Packaging", type: "evidence", description: "Structured logs, reports, screenshots, and export packaging.", completionPercentage: 69, linkedModuleIds: ["proof-layer"] }),
        node({ id: "proof-readiness", title: "Proof Readiness", type: "evidence", description: "Whether current proof shows the workflow end to end without misleading green status.", completionPercentage: 60, linkedModuleIds: ["proof-layer", "workflow-intelligence"] }),
      ],
    }),
    node({
      id: "remaining-work-risks",
      title: "Remaining Work / Fake Completion",
      type: "category",
      description: "Known risks, blocked items, and fake-complete surfaces that still stand between current state and true completion.",
      status: "FAKE-COMPLETE",
      completionPercentage: 39,
      linkedAudits: ["Control surface audit", "Workflow continuity audit"],
      linkedWorkflows: ["Blocker review", "Remaining-work planning"],
      linkedModuleIds: ["workflow-intelligence", "proof-layer", "country-service-architecture"],
      fakeCompleteRisk: "This category exists specifically to prevent polished visual progress from hiding unfinished workflow truth.",
      children: [
        node({ id: "known-blockers", title: "Known Blockers", type: "risk", description: "Current blockers extracted from the comparison engine and proof runs.", status: "BLOCKED", completionPercentage: 31, linkedModuleIds: ["proof-layer", "workflow-intelligence"], topBlockerHint: "Keep the blocker chain visible in the detail panel." }),
        node({ id: "fake-complete-surfaces", title: "Fake-Complete Surfaces", type: "risk", description: "Areas that look present but still overstate what works in practice.", status: "FAKE-COMPLETE", completionPercentage: 36, linkedModuleIds: ["ui-ux-shell", "workflow-intelligence"] }),
        node({ id: "phase1-remaining-work", title: "Phase 1 Remaining Work", type: "risk", description: "Outstanding delivery work that still needs evidence-backed completion.", completionPercentage: 50, linkedModuleIds: ["workflow-intelligence", "proof-layer"] }),
        node({ id: "future-expansion-readiness", title: "Future Expansion Readiness", type: "risk", description: "Architecture readiness for country workspaces, referrals, partner programs, and France expansion.", completionPercentage: 41, linkedModuleIds: ["country-service-architecture", "identity-workspace"] }),
      ],
    }),
  ],
});

export const masterDesignHierarchy: MasterDesignHierarchyNodeSpec = finalizeNode(rawHierarchy);
