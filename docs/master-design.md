# Gulf Hisab — Enforceable Master Design

Updated: 2026-04-18
Purpose: implementation-grade product reference for architecture review, module acceptance, and deficiency tracing.

## 1. Product Scope

Gulf Hisab is a finance operating system for GCC SMEs with a Next.js application shell and Laravel API. The product is not defined by pages; it is defined by coordinated engines that own records, workflows, permissions, outputs, and audit trails.

Compliance judgment uses three states only:

- Compliant: route, workflow, data contract, role context, output, and audit behavior match this document.
- Partial: a real module exists but one or more workflow, output, or integration obligations are missing.
- Non-compliant: the route is placeholder-driven, sample-driven, misleading, or materially disconnected from its owning engine.

## 2. Global System Boundaries

### 2.1 Engine boundaries

- Document Engine owns commercial transaction records and their business-state workflow.
- Template Engine owns template definitions, preview rendering rules, and PDF/print consistency. It does not own invoice posting logic.
- Accounting Engine owns ledgers, journals, balances, and statutory reports. It does not own template layout or document-edit UI.
- Inventory Engine owns item master data, stock movement, and inventory-linked accounting behavior.
- Banking Engine owns bank accounts and cash/bank transaction intake.
- Reconciliation Engine owns statement-line review, candidate matching, reconciliation status, and reconciliation closure. It must connect Banking and Accounting and cannot remain a detached register.
- Workspaces own role-specific orchestration and navigation, not core business rules.
- Audit / AI Orchestration owns health inspection of the system itself and must not become the substitute for business workflow implementation.

### 2.2 Workspace boundaries

- User Workspace owns company operations.
- Admin Workspace owns platform governance.
- Assistant Workspace owns support and customer-success operations.
- Agent Workspace owns commercial pipeline operations.
- No workspace home or route family may use generic overview language to hide missing role workflow.
- No role-specific route may render a catch-all generic placeholder for a module claimed as shipped.

### 2.3 Output boundaries

- Preview, PDF, and print outputs must use the same template contract.
- A module is not complete if register behavior works but preview/PDF rules diverge.

## 3. Record Model Overview

Core record families required by the product:

- Document records: invoices, quotations, proforma invoices, credit notes, debit notes, bills, purchase invoices, purchase orders, expenses, recurring invoice derivatives.
- Document line records: item, description, quantity, price, tax metadata, cost center, custom fields.
- Template records: template definition, applicable document types, locale mode, accent, section order, logo asset, watermark rules.
- Contact records: customers and suppliers.
- Item records: products, services, raw materials, finished goods.
- Inventory movement records: adjustment, receipt, issue/consumption, stock snapshot.
- Account records: chart of accounts with code, class, subtype, posting flags.
- Journal entry and journal entry line records.
- Payment records and allocations.
- Bank account records.
- Bank statement line records.
- Reconciliation match and reconcile-state records.
- Audit trail records.
- Platform records: plans, companies, support accounts, agents, referrals, subscriptions.

## 4. User Workspace Architecture

### Ownership

- Owns the company-operator shell and operational navigation for sales, purchases, inventory, accounting, banking, VAT, reports, templates, contacts, and settings.

### Required behavior

- Shell must present module-specific routes under the user context.
- High-frequency routes must render dedicated operational screens, not WorkspaceModulePage placeholders.
- Invoice and template workflows may switch shell density, but role identity and route truth must remain intact.

### Required pages

- Role home at /workspace/user.
- Dedicated module routes for every sidebar item that claims an operational module.

### Shared dependencies

- WorkspaceShell, WorkspacePathProvider, role-workspace registry, module-level data tables, document and directory APIs.

### Audit requirements

- Each user route must expose a real workflow owner through data-inspector or concrete component ownership.

### Permissions

- Company abilities only. User Workspace must not rely on platform abilities.

### Boundaries

- No platform governance UI in user routes.
- No generic catch-all module page for banking, reconciliation, reports, ledger, or templates once those modules are claimed as shipped.

## 5. Document Engine

### Owned records

- Document headers and lines for sales and purchase families.
- Document state transitions.
- Payment allocation links.
- Compliance metadata for e-invoicing.

### Workflows controlled

- Draft creation.
- Draft editing.
- Issue/finalize.
- Send.
- Duplicate.
- Void/cancel through accounting-safe reversal path.
- Record payment.
- Adjustment note issuance.
- Register-to-split-preview drilldown.

### Rendering and document discipline

- Preview, PDF, and print must render from one shared contract and one section model.
- Numbers must use comma-grouped formatting with two decimals for accountant-facing outputs.
- Text must not touch borders; box padding is mandatory in preview and PDF.
- Blank fields must be hidden completely rather than rendered as empty labels or placeholder rows.
- Notes must render only when populated.
- Amount in words must not appear unless a country-specific legal rule explicitly requires it.
- Invoice number belongs in the document information box only and must not be duplicated elsewhere.
- Seller VAT, issue date, supply date, and currency belong in the document information box.
- QR and compliance content may render only when legally applicable to the document type and state.
- Footer text must be intentional, compact, and audit-safe; filler or nonsensical footer text is non-compliant.
- Required visual order for sales documents is: seller/header, title, document information box, optional delivery information box, purchaser/customer box, product table, totals box, optional notes.
- Credit notes and debit notes must expose their purpose, source-document reference, and accounting implication without inheriting invoice-only labels.

### Required pages

- Register routes by document family.
- Document create/edit routes.
- Full document route per document id.
- Split-preview register for high-volume transaction families.

### Shared components

- TransactionForm.
- InvoiceRegister / document-family register equivalent.
- InvoiceDetailWorkspace or equivalent full preview container.
- AuditTrailPanel.
- AttachmentUploader.

### Data contracts

- List documents with filterable metadata and balances.
- Get document detail.
- Save draft.
- Finalize draft.
- Send document.
- Duplicate document.
- Record payment.
- Fetch preview HTML.
- Fetch PDF URL.

### Audit trail

- Every state change, send, payment, void, duplicate, and edit version must be traceable.

### Permissions

- Sales documents require sales abilities.
- Purchase documents require purchase abilities.
- Adjustments and finalize actions respect accounting/compliance rules.

### Connections

- Template Engine for rendering.
- Accounting Engine for posting.
- Inventory Engine for item and stock effect.
- VAT/Compliance for tax and ZATCA state.

### Boundaries

- Document Engine does not own template composition UI.
- Document Engine does not own ledger report logic.

### Enforceable compliance test

- A document module is non-compliant if register, preview, and PDF do not share one contract or if a transaction family is only a navigational card without real create/view/edit flow.
- A document family is partial if credit note, debit note, delivery note, proforma invoice, and tax invoice do not all follow the same cleanup rules and linked-reference discipline.

## 6. Template Engine

### Owned records

- DocumentTemplateRecord and related asset references.
- Section order, watermark, locale mode, branding, header/footer HTML, document-type assignment.

### Workflows controlled

- Template listing by document family.
- Create template.
- Edit template configuration.
- Preview template against a document type.
- Set default template.
- Activate/deactivate template.
- Associate logo asset.
- Associate stamp and signature assets.
- Reorder sections with WYSIWYG preview parity.

### Required pages

- All templates register.
- Family-specific template registers for invoice, quotation, proforma, credit note, debit note, purchase.
- Settings template route pointing to the same engine, not a different logic path.

### Shared components

- DocumentTemplatesRegister.
- ImportExportControls.

### Interaction rules

- Template editing must be full-screen, canvas-first, and real WYSIWYG rather than settings-only.
- Real-time preview must match final PDF structure, spacing, alignment, and conditional visibility.
- Section reordering is required.
- Row and column layout controls are required where the renderer supports structured blocks.
- Typography controls must include font family, font size, title size, and spacing controls.
- Alignment controls must include title and body alignment.
- Default-template persistence must be explicit and auditable.

### Data contracts

- List templates.
- Preview template.
- Create/update template.
- Upload/list assets.

### Audit trail

- Template changes must be attributable and default-template changes must be inspectable.

### Permissions

- Company settings manage permissions for company template routes.
- Platform template administration must remain separate if it exists.

### Connections

- Document Engine preview/page/PDF rendering.
- Branding assets.

### Boundaries

- Template Engine cannot become document posting logic.
- Fake template diversity is non-compliant: naming five families is not enough if rendered structures do not materially differ.
- A template feature is non-compliant if it previews a fake sample path that diverges from the real document renderer.

## 7. Accounting Engine

### Owned records

- Accounts.
- Journal entries and lines.
- Opening balances.
- Ledger balances.
- Reporting snapshots derived from posted finance activity.

### Workflows controlled

- Chart-of-accounts maintenance.
- Manual journal creation/posting/reversal.
- Source-linked journal generation from document/payment/inventory events.
- Trial balance, general ledger, P&L, balance sheet, cash flow, aging, audit trail reporting.

### Posting rules

- Strict double-entry is mandatory for every posted workflow.
- Compound journal entries are mandatory where a source event affects multiple target accounts.
- Sales discounts must post explicitly to a dedicated discount/contra-revenue account and must not be silently buried inside revenue.
- Customer balance definition is: invoices minus payments minus credit notes plus debit notes plus or minus explicit adjustments.
- Credit note and debit note behavior must propagate through document workflow, customer balance, journal posting, aging, VAT reporting, and dashboard/report summaries.
- VAT logic must evaluate customer origin, country, VAT status, supply location, and classification; outside-KSA status alone is not sufficient.
- Journal metadata must retain source type, source id, linked document numbers, counterparties, posting date, and VAT effect.
- Journal intelligence must suggest or preserve supporting document links when a manual journal implies sale, inventory issue, or service delivery.

### Required pages

- Accounting home.
- Chart of accounts register.
- Journal entries register.
- Ledger/books route.
- Opening balances route.
- Dedicated report routes.

### Shared components

- AccountingOverview.
- AccountingReportPage.
- ChartOfAccountsRegister.
- JournalEntriesRegister.

### Visibility and drilldown rules

- Journal rows must expose linked source documents visibly in the register.
- Journal rows must be previewable/openable from the register with source-aware actions.
- Audit visibility must show origin, linked document number, counterparty, posting date, and VAT effect.

### Data contracts

- Accounts list/create/update.
- Journals list/create/show/post/reverse.
- Report endpoints.

### Audit trail

- Posted journals immutable except reversal.
- Source documents linked to source-generated journals.

### Permissions

- Company accounting/report abilities.

### Connections

- Document Engine.
- Inventory Engine.
- Banking/Reconciliation Engines.

### Boundaries

- Accounting overview cannot substitute for dedicated registers.
- Cash flow report is partial if reconciliation linkage is absent.
- Reporting is partial if P&L, VAT, receivables aging, customer statements, and journal drilldown disagree on the same source transaction.

## 8. Inventory Engine

### Owned records

- Item master.
- Inventory adjustments.
- Stock register snapshots.
- Item account mappings.

### Workflows controlled

- Create/edit item.
- Search/filter item master.
- Track inventory-vs-service behavior.
- Record inventory adjustments.
- Surface stock balances.

### Stock and accounting rules

- Sale posting must reduce stock and generate COGS where applicable.
- Delivery note behavior must be explicit: reserve or reduce stock according to the chosen flow, and the same rule must propagate consistently to journals and registers.
- Inventory movement that affects valuation must link to accounting entries.
- Stock insufficiency must block finalization before document state change.
- Stock insufficiency UX must provide a warning, suggest inventory addition, route to inventory intake, and preserve enough context to return to the interrupted flow.
- Credit note and debit note flows must handle stock reversal or incremental stock effect explicitly when inventory-linked lines are involved.
- Intelligent workflow suggestions must remain active after inventory-affecting steps.

### Required pages

- Products & Services register.
- Stock register.
- Inventory adjustments register.

### Shared components

- ProductsServicesRegister.
- StockRegister.
- InventoryAdjustmentsRegister.

### Data contracts

- Workspace directory item list.
- Create item.
- Inventory adjustment APIs.

### Audit trail

- Item create/edit and stock movement must be auditable.

### Permissions

- Company inventory/manage abilities.

### Connections

- Document Engine line items.
- Accounting Engine inventory postings.

### Boundaries

- Service-only item creation is not enough to claim inventory completion.
- Inventory-tracked items require code and account mapping discipline.
- Inventory is partial if stock movement exists without journal linkage, or journal linkage exists without visible source references.

## 8.1 Workflow Intelligence

- No dead-end forms are allowed in primary sales, delivery, payment, or inventory workflows.
- After delivery note completion, the system should guide toward invoice creation.
- After invoice completion, the system should guide toward payment recording.
- After payment completion, the system should guide toward journal and report review.
- Compact SaaS density and inline creation patterns must remain intact where operationally possible.

## 8.2 VAT / Customer / KSA Decision Rules

- Customer records must capture origin, country, VAT status, and customer type.
- VAT and ZATCA decisions must be evidence-based and derived from customer origin, country, VAT status, supply location, and tax classification.
- Warnings are required whenever VAT treatment changes because of customer or supply inputs.
- KSA-local standard flows should avoid unnecessary compliance clutter or misleading warnings.

## 8.3 Proof and execution discipline

- A task is not complete unless code, UI behavior, workflow outcome, and stored data are all verified together.
- Validation evidence must include screenshots, PDFs where relevant, route checks, and machine-readable proof artifacts.
- If a task is stuck for more than one focused attempt, retry once with a different path, then log the blocker and continue.
- Final reporting must separate completed, fixed, remaining, failed/blocked, and evidence sections.

## 8.4 UI / UX enforcement

- Operational screens must favor dense, accountant-friendly layouts over marketing spacing.
- Primary forms must expose inline recovery paths for missing prerequisites such as contact, item, inventory, account, or template.
- Every save, finalize, match, reconcile, import, and payment action must surface explicit loading, success, and failure states.
- Empty states must suggest the next operational action and link directly to it.
- Report pages must keep summary, drill-down, and export actions visible without forcing unnecessary navigation.
- No module may strand the user after a blocking validation event; the next valid action must be visible.

## 9. Banking Engine

### Owned records

- Bank accounts.
- Payment activity views.
- Statement intake requests before reconciliation.

### Workflows controlled

- Bank account list and account selection.
- Review cash/bank movement by account.
- Statement import initiation and extraction review.

### Required pages

- Banking overview for payment activity.
- Bank accounts route.
- Link onward into reconciliation by selected bank account.

### Shared components

- BankingOverview.
- BankAccountsRegister.

### Data contracts

- List bank accounts.
- Payment activity snapshot.
- Statement import submission.

### Audit trail

- Statement import action and account context must be visible.

### Permissions

- Company payments/manage abilities.

### Connections

- Accounting Engine for bank GL accounts.
- Reconciliation Engine for matching workflow.

### Boundaries

- Banking is non-compliant if bank accounts are sample rows with no backend linkage.
- Banking is non-compliant if import begins and ends in the same page without reconciliation handoff.

## 10. Reconciliation Engine

### Owned records

- Statement lines.
- Candidate matches.
- Match status.
- Reconciled state.

### Workflows controlled

- Load statement lines by account.
- Filter by status/date.
- Import statement lines.
- Review parsed lines before import.
- Find candidates.
- Match statement lines to journal lines.
- Reconcile matched statement lines.

### Required pages

- Dedicated reconciliation route under user workspace.

### Shared components

- ReconciliationPage or equivalent dedicated workflow component.

### Data contracts

- List bank accounts.
- List statement lines.
- Import statement lines.
- Candidate lookup.
- Match endpoint.
- Reconcile endpoint.

### Audit trail

- Imported line origin, match action, and reconcile action must be traceable.

### Permissions

- Company payments/manage and accounting visibility.

### Connections

- Banking Engine intake.
- Accounting Engine journal lines.
- Cash Flow and bank reporting outputs.

### Boundaries

- Reconciliation is non-compliant if it renders static sample entries or fake action buttons.
- Reconciliation is non-compliant if candidate matching exists in the API but not in the UI.

## 10.1 Import Engine requirements

- Import intake must accept pasted rows and uploaded spreadsheet or CSV files.
- Column recognition must suggest mappings for date, reference, description, debit, credit, amount, VAT, customer, and running balance where present.
- Users must be able to override suggested mappings before commit.
- Preview must distinguish valid rows from invalid rows before any backend write occurs.
- Validation must show row-level errors and a summary count of accepted versus blocked rows.
- Import logs must persist enough context to review source account, imported row count, invalid row count, and import time.
- Successful import must hand the user directly back into matching and reconciliation rather than ending at a dead confirmation state.

## 11. Admin Workspace Architecture

### Owned role workflows

- Customer governance.
- Plan control.
- Support-account control.
- Agent administration.
- System health and audit surfaces.

### Required pages

- Admin home.
- Customers.
- Plans.
- Support Accounts.
- Agents.
- Audit.
- System Health.
- Access/Governance routes when listed in sidebar.

### Boundaries

- Admin home cards do not satisfy admin module completion.
- Admin workspace cannot point to routes that resolve to generic placeholder if those routes are claimed in the sidebar.

## 12. Assistant Workspace Architecture

### Owned role workflows

- Help queue.
- AI help.
- Invoice guidance.
- Onboarding.
- Pending tasks.
- Customer account escalation context.

### Required pages

- Assistant home plus dedicated queue and workflow routes for each sidebar item.

### Boundaries

- Assistant workspace is non-compliant if it only shows platform customer tables and links to non-existent operational queues.

## 13. Agent Workspace Architecture

### Owned role workflows

- Leads.
- Referrals.
- Assigned accounts.
- Pipeline.
- Follow-ups.
- Pending outreach.
- Activity log.

### Required pages

- Agent home plus dedicated pipeline routes for each sidebar item.

### Boundaries

- Agent workspace is non-compliant if the home exists but route family collapses into placeholders.

## 14. Audit / AI Orchestration Engine

### Owned records

- Findings.
- Health scores.
- Route inventory.
- Evidence references.
- Prompt outputs.

### Workflows controlled

- Collect route/module/runtime evidence.
- Score and classify defects.
- Present review dashboards.

### Required pages

- Review dashboard.
- Findings.
- Module health.
- Route health.
- Accounting audit.
- Inventory audit.
- Documents audit.
- Density audit.
- Evidence.
- Prompt generator.
- History.

### Boundaries

- Review sub-routes should not all render the exact same generic dashboard state without subview logic.

## 15. Register Architecture

### Required behavior

- Registers are default working surfaces for list-heavy modules.
- Default state is list/register first.
- Split preview occurs only after selecting a row.
- Bulk action bars appear only with selection.
- Filters remain collapsible, not permanently expanded.

### Non-compliance rules

- Static cards masquerading as registers are non-compliant.
- Generic overview pages are non-compliant for transaction-heavy modules that require real registers.

## 16. Role & Permission Architecture

### Required behavior

- Sidebar routes must correspond to actual permissions and actual routes.
- User role uses company abilities.
- Admin role uses platform abilities.
- Assistant and Agent roles must not inherit generic user quick actions or placeholder flows.

### Non-compliance rules

- Any catch-all route using role home actions instead of module actions is partial at best and usually non-compliant.

## 17. Preview / PDF / Export Architecture

### Required behavior

- Preview HTML, full page view, print/PDF URL, and template selection must remain consistent.
- PDF download must use the same template family and business fields as the preview.
- Import/export controls must correspond to actual import/export workflows.

### Non-compliance rules

- Preview-only template fidelity with inconsistent PDF output is non-compliant.

## 18. UI Density / Layout Architecture

### Required behavior

- Compact operational density for workspace modules.
- No oversized marketing-card behavior inside core workspace modules.
- Shell density may change for invoice/template workflows but must remain operational.

### Non-compliance rules

- Role modules with decorative large cards but shallow workflow are non-compliant.

## 19. Product Truth Rules

- A visible route is not proof of module completion.
- A dedicated component is not proof of workflow completion if it uses sample data.
- A backend contract is not proof of module completion if the frontend never exercises it.
- A role home page is not proof that the role workspace is operational.

## 20. Immediate Review Targets From This Design

High-risk modules that must be checked against this design before claiming maturity:

- User Banking / Bank Accounts.
- User Reconciliation.
- Assistant sub-routes.
- Agent sub-routes.
- Admin governance sub-routes.
- Template-family diversity and preview/PDF consistency.
- Inventory depth beyond item creation.