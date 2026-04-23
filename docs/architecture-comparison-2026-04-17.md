# Gulf Hisab — Architecture Comparison, Acceptance Criteria, and Deficiency Register

Date: 2026-04-17
Method order preserved:

1. master design rewritten in docs/master-design.md
2. acceptance criteria defined below
3. current system compared against that design below
4. deficiencies listed below

## 1. Module-by-Module Acceptance Criteria

### 1.1 Document Engine

#### Sales invoice module

- Structural: /workspace/user/invoices and /workspace/invoices/[documentId] must exist as dedicated components, not catch-all placeholders.
- Workflow: create draft, edit draft, finalize, send, duplicate, record payment, preview, and full-view drilldown must work against real records.
- Output: preview and PDF URL must be available from the same document contract.
- Failure conditions: placeholder page, sample-only preview, dead send/payment actions, missing audit trail, mismatched register and full view.

#### Purchase bill module

- Structural: /workspace/user/bills and /workspace/bills/[documentId] must be dedicated components.
- Workflow: create, edit, post, pay, preview, and supplier context must work.
- Output: preview/PDF contract must match document settings.
- Failure conditions: form-only shell without post/payment linkage, missing cost-center/custom-field persistence.

#### Quotations / proformas / credit notes / debit notes

- Structural: family-specific routes under /workspace/user must resolve to dedicated modules or a dedicated shared engine component with family-specific behavior.
- Workflow: source-document linkage and correct state transitions must exist where required.
- Failure conditions: route exists but uses generic placeholder or reuses invoice labels/actions incorrectly.

### 1.2 Template Engine

#### Template registry and family routes

- Structural: all template routes must resolve to DocumentTemplatesRegister or an equivalent dedicated template module.
- Workflow: list, preview, create, update, set default, family filtering, logo asset assignment.
- Output: preview must render current draft settings.
- Failure conditions: names differ but layouts are materially identical, preview only with no persistence, dead upload or preset actions.

### 1.3 Accounting Engine

#### Accounting home

- Structural: /workspace/accounting must be dedicated and data-backed.
- Workflow: books snapshot and reports snapshot must populate summary and tables.
- Failure conditions: static dashboard, missing books/reports linkage.

#### Chart of accounts

- Structural: /workspace/user/chart-of-accounts must be dedicated.
- Workflow: list, create, update, posting-control flags visible.
- Failure conditions: placeholder route, no account save path.

#### Journals and reports

- Structural: journals and report routes must be dedicated or use a real shared report component.
- Workflow: report filters, rows, and accounting totals must derive from backend or declared preview state.
- Failure conditions: catch-all placeholder, fake rows with no contract.

### 1.4 Inventory Engine

#### Products & Services

- Structural: /workspace/user/products must be dedicated.
- Workflow: item list, search, create, item-type behavior, usable in document line flows.
- Failure conditions: no real item persistence, no differentiation between service and inventory-tracked items.

#### Stock register and adjustments

- Structural: dedicated routes must exist with real records.
- Workflow: stock quantities and adjustment posting must be operational.
- Failure conditions: placeholder route or no inventory movement contract.

### 1.5 Banking Engine

#### Banking overview

- Structural: /workspace/banking must be dedicated.
- Workflow: payment activity list and document-linked money movement must function.
- Failure conditions: static activity, no posting path, no open-document linkage.

#### Bank accounts

- Structural: /workspace/user/banking must be a real bank-account register, not sample rows.
- Workflow: load bank accounts from backend, select account, start statement import, open reconciliation in selected account context.
- Failure conditions: hardcoded sample rows, fake buttons, no reconciliation handoff.

### 1.6 Reconciliation Engine

#### Reconciliation

- Structural: /workspace/user/reconciliation must be dedicated.
- Workflow: load bank accounts, show statement lines, filter by status/date, import statement lines, review extracted lines before import, fetch candidate matches, match, reconcile.
- Failure conditions: sample rows, import button without parser/review/import, no account context, no match or reconcile persistence.

### 1.7 Admin Workspace

#### Admin home and governance routes

- Structural: admin home plus each sidebar route must be a dedicated working module.
- Workflow: customers, plans, support accounts, agents, audit, system health, and governance routes must present operational views.
- Failure conditions: home exists but sub-routes resolve to placeholder or wrong shared view.

### 1.8 Assistant Workspace

#### Assistant home and queue routes

- Structural: help queue, invoice help, onboarding, pending tasks, customer accounts routes must exist and be role-correct.
- Workflow: queue and follow-up logic must be visible and actionable.
- Failure conditions: home page with summary cards only, sidebar routes falling into placeholder.

### 1.9 Agent Workspace

#### Agent home and pipeline routes

- Structural: leads, referrals, assigned accounts, pipeline, follow-ups, pending outreach, activity routes must exist and be role-correct.
- Workflow: lead tracking and follow-up progression must be visible.
- Failure conditions: home page only, sidebar routes falling into placeholder.

### 1.10 Audit / AI Orchestration Engine

- Structural: review dashboard sub-routes must represent real subviews or explicit scoped state.
- Workflow: findings, routes, prompts, evidence, history must differ in purpose and visible content.
- Failure conditions: every sub-route simply renders the same dashboard with no scoped behavior.

## 2. Comparison Findings

### 2.1 Compliant or mostly real

| Engine / Module | Status | Evidence | Finding |
|---|---|---|---|
| Document Engine invoice routes | Partial | components/workspace/InvoiceRegister.tsx, components/workspace/InvoiceDetailWorkspace.tsx, components/workflow/TransactionForm.tsx | Real register, detail, preview, finalize, send, and payment actions exist. Full cross-family audit not completed here. |
| Template Engine | Partial | components/workspace/DocumentTemplatesRegister.tsx | Real listing, preview, create/update, asset upload exist. Template diversity enforcement remains unproven from code alone. |
| Accounting home and report routes | Partial | components/workspace/AccountingOverview.tsx, components/workspace/AccountingReportPage.tsx, app/workspace/user/reports/*.tsx | Real data-backed reporting surfaces exist. Cash-flow note explicitly admits reconciliation gap. |
| Products & Services register | Partial | components/workspace/ProductsServicesRegister.tsx | Real list/create/search exists, but inventory-tracked depth and account-mapping discipline are not enforced here. |
| Banking overview | Partial | components/workspace/BankingOverview.tsx | Real payment activity and payment posting UI exists, but this is payment-centric banking, not bank-account or statement-intake banking. |
| Admin home | Partial | components/workspace/AdminWorkspaceHome.tsx | Data-backed home exists, but route-family completion is not proven. |
| Assistant home | Partial | components/workspace/AssistantWorkspaceHome.tsx | Data-backed home exists, but queue routes are not implemented as dedicated workflows. |
| Agent home | Partial | components/workspace/AgentWorkspaceHome.tsx | Data-backed home exists, but pipeline route family is not implemented as dedicated workflows. |

### 2.2 Non-compliant or materially deficient

| Engine / Module | Status | Evidence | Finding |
|---|---|---|---|
| Catch-all role routes | Non-compliant | app/workspace/[...slug]/page.tsx, components/workspace/WorkspaceModulePage.tsx, data/role-workspace.ts | Many role routes resolve to generic placeholder content instead of real operational modules. |
| Bank Accounts module | Non-compliant | app/workspace/user/banking/page.tsx, components/workspace/BankAccountsRegister.tsx | Dedicated route exists but is sample-driven only, with fake add/edit/reconcile controls and no backend contract. |
| Reconciliation module | Non-compliant | app/workspace/user/reconciliation/page.tsx, components/workspace/ReconciliationPage.tsx, backend/app/Http/Controllers/Api/ReconciliationController.php, lib/workspace-api.ts | Backend reconciliation API exists, but frontend route is sample-only and does not exercise import/match/reconcile workflow. |
| Assistant route family | Non-compliant | data/role-workspace.ts, app/workspace/[...slug]/page.tsx | Sidebar claims help queue, onboarding, pending tasks, invoice help, customer accounts; these routes fall to generic placeholder. |
| Agent route family | Non-compliant | data/role-workspace.ts, app/workspace/[...slug]/page.tsx | Sidebar claims leads, referrals, assigned accounts, pipeline, follow-ups, outreach, activity; these routes fall to generic placeholder. |
| Admin governance route family | Partial to Non-compliant | data/role-workspace.ts, app/workspace/[...slug]/page.tsx | Some admin routes are dedicated, but multiple governance routes still resolve to catch-all placeholder. |
| Audit review sub-routes | Partial | app/workspace/admin/review/*/page.tsx | Multiple sub-routes reuse the same ReviewDashboard without route-scoped subview behavior visible at route level. |

### 2.3 Architectural contamination findings

- Role-route contamination: role registries declare many assistant and agent modules that do not exist as dedicated workflows and instead inherit generic placeholder behavior from WorkspaceModulePage.
- Banking/Reconciliation contamination: Banking overview is real for payments, but bank-account and statement-reconciliation workflows are detached from that engine and replaced by sample-only UIs.
- Audit-view contamination: review sub-routes visually imply distinct modules while reusing one dashboard component without visible route-specific specialization.

## 3. Exact Deficiency Register

### Critical

#### D-001 — Banking Engine / Bank Accounts module is sample-driven and disconnected from backend

- Engine: Banking Engine
- Module: Bank Accounts
- Route: /workspace/user/banking
- Files: app/workspace/user/banking/page.tsx, components/workspace/BankAccountsRegister.tsx, lib/workspace-api.ts
- Expected: backend-driven bank account register with real account records, selected account state, statement import initiation, and handoff into reconciliation.
- Current: hardcoded sample accounts, fake Add/Edit/Reconcile/Transactions buttons, no backend account load, no import flow, no handoff contract.
- Reason deficient: violates Banking Engine acceptance criteria for structural correctness, workflow correctness, and handoff into Reconciliation Engine.

#### D-002 — Reconciliation Engine route is sample-only despite existing backend contract

- Engine: Reconciliation Engine
- Module: Reconciliation
- Route: /workspace/user/reconciliation
- Files: app/workspace/user/reconciliation/page.tsx, components/workspace/ReconciliationPage.tsx, backend/app/Http/Controllers/Api/ReconciliationController.php, lib/workspace-api.ts
- Expected: account-scoped reconciliation workflow using backend statement lines, import review, match candidates, match action, reconcile action, and filters.
- Current: static sample entries, fake import and auto-match controls, no account load, no backend import/match/reconcile execution.
- Reason deficient: breaks route truth, workflow truth, and banking-accounting linkage.

### Major

#### D-003 — Role catch-all placeholder is still serving claimed modules

- Engine: Role & Permission Architecture / Workspace Architecture
- Module: assistant, agent, and some admin governance sub-routes
- Route: multiple role routes under /workspace/[role]/*
- Files: app/workspace/[...slug]/page.tsx, components/workspace/WorkspaceModulePage.tsx, data/role-workspace.ts
- Expected: dedicated queue/pipeline/governance modules for every sidebar route claimed as an operational module.
- Current: generic placeholder page with generic status and related-route links.
- Reason deficient: module truth is being replaced by route existence.

#### D-004 — Assistant workspace route family overclaims implementation

- Engine: Assistant Workspace
- Module: help queue, onboarding, pending tasks, invoice help, customer accounts
- Route: /workspace/assistant/* declared in role registry
- Files: data/role-workspace.ts, app/workspace/[...slug]/page.tsx
- Expected: dedicated support-operation screens with queue logic.
- Current: home page exists; subordinate routes are placeholders.
- Reason deficient: role workflow truth missing.

#### D-005 — Agent workspace route family overclaims implementation

- Engine: Agent Workspace
- Module: leads, referrals, assigned accounts, pipeline, follow-ups, pending outreach, activity
- Route: /workspace/agent/* declared in role registry
- Files: data/role-workspace.ts, app/workspace/[...slug]/page.tsx
- Expected: dedicated pipeline screens with lead/follow-up progression.
- Current: home page exists; subordinate routes are placeholders.
- Reason deficient: role workflow truth missing.

#### D-006 — Admin governance route family remains incomplete

- Engine: Admin Workspace
- Module: system health, integrations, access management, company reviews, document templates
- Route: admin sidebar routes not backed by dedicated route modules
- Files: data/role-workspace.ts, app/workspace/[...slug]/page.tsx
- Expected: dedicated governance views.
- Current: several routes collapse to placeholder.
- Reason deficient: platform governance route truth incomplete.

### Medium

#### D-007 — Template family diversity is not yet proven as materially distinct

- Engine: Template Engine
- Module: template families
- Files: components/workspace/DocumentTemplatesRegister.tsx
- Expected: materially distinct rendering behavior across template families, not just labels and settings names.
- Current: presets exist, but visual/output differentiation remains unverified.
- Reason deficient: output truth not yet proven.

#### D-008 — Inventory Engine depth remains below declared scope

- Engine: Inventory Engine
- Module: stock register and adjustments ecosystem
- Files: components/workspace/ProductsServicesRegister.tsx and related user routes
- Expected: tracked-item discipline, account mapping, stock movement truth.
- Current: item create/list exists but engine depth remains partial.
- Reason deficient: item master exists without full inventory workflow depth.

## 4. Approved Implementation Scope For This Pass

This implementation pass is limited to listed deficiencies D-001 and D-002 because they are critical, backend contracts already exist, and they can be corrected without inventing fake completion for unrelated role-route families.

Dependency order:

1. Extend workspace API contracts for reconciliation import and candidate lookup.
2. Replace BankAccountsRegister sample data with backend-driven register and reconciliation handoff.
3. Replace ReconciliationPage sample UI with account-scoped import, review, match, and reconcile workflow.
4. Verify the corrected banking routes and workflows.

Unimplemented listed deficiencies remain open and must stay reported as broken.