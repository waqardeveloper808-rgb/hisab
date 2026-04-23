# Gulf Hisab Master Design vNext

Updated: 2026-04-18
Status: Primary law for governed execution under Prompt Engine v4.

## 1. System Constitution

### Purpose

Gulf Hisab is a GCC-focused accounting and operations system that must deliver reliable bookkeeping, invoicing, inventory control, payment handling, VAT compliance, traceability, and reviewable evidence through a real Next.js plus Laravel production architecture.

### Target standard

- Product quality target: Wafeq-level or above in workflow integrity, accounting correctness, traceability, and operational UX.
- Evidence target: business actions must be provable through stored data, API/UI output, and repeatable validation.

### Phase 1 scope definition

Phase 1 covers the operational baseline required for a live SME accounting workflow:

- Accounting Engine
- Invoice and Document Engine
- Inventory Engine
- Payment Engine
- Customer Advance Engine
- VAT Engine
- Reporting Engine
- Traceability Engine
- Integrity Enforcement Engine
- UI Validation Layer
- API Layer
- Testing Layer
- End-to-end company workflow from imported master data through reporting

### Non-negotiable rules

- Preview mode is not completion proof when authenticated runtime flow is available.
- A feature is not complete unless logic, storage, UX/API behavior, and evidence all exist.
- Placeholder routes do not count as shipped workflows.
- Accounting effects must remain journal-traceable and report-visible.
- Failures must be logged explicitly and must not be hidden.

## 2. Full Module Architecture

### Accounting Engine

- Responsibility: chart of accounts, journal generation, ledger posting, balances, financial statement inputs.
- Core records: accounts, journal entries, journal entry lines, opening balances, posting metadata.
- Depends on: Document Engine, Inventory Engine, Payment Engine, VAT Engine.

### Invoice Engine

- Responsibility: draft, finalize, view, send, and adjust sales documents.
- Core records: documents, document lines, document metadata, status transitions.
- Depends on: Customer data, Item data, Accounting Engine, VAT Engine.

### Inventory Engine

- Responsibility: item master data, stock persistence, quantity movement, inventory-linked accounting.
- Core records: items, inventory items, transactions, inventory-linked journal metadata.
- Depends on: Accounting Engine, Invoice Engine.

### Payment Engine

- Responsibility: record payments, allocate against documents, expose payment registers, support reconciliation candidates.
- Core records: payments, allocations, references, settlement metadata.
- Depends on: Invoice Engine, Accounting Engine, Reporting Engine.

### Customer Advance Engine

- Responsibility: customer advance receipt, balance tracking, application against documents.
- Core records: advance balances, allocation metadata, advance-related journals.
- Depends on: Payment Engine, Accounting Engine, Invoice Engine.

### VAT Engine

- Responsibility: tax calculation, tax persistence, output/input VAT visibility, VAT reporting inputs.
- Core records: document tax totals, line tax metadata, VAT summary/detail datasets.
- Depends on: Invoice Engine, Purchase flows, Reporting Engine.

### Reporting Engine

- Responsibility: invoice register, payment register, VAT summary/detail, trial balance, ledger, balance sheet, profit and loss, aging.
- Core records: report snapshots and query outputs derived from posted data.
- Depends on: Accounting Engine, VAT Engine, Payment Engine, Document Engine.

### Traceability Engine

- Responsibility: audit trail, source references, document-to-journal and inventory-to-journal linkage.
- Core records: audit trail rows, metadata references, source types and source ids.
- Depends on: all business engines.

### Integrity Enforcement Engine

- Responsibility: validation rules, invariant protection, stock blocking, payment bounds, required relations.
- Core records: validation errors, guarded service rules, blocked transitions.
- Depends on: all transactional flows.

### UI Validation Layer

- Responsibility: operational screens, route truth, field validation, state visibility, user feedback, no fake placeholders.
- Core records: page state, user actions, route ownership, evidence captures.

### API Layer

- Responsibility: authenticated request handling, proxy contract, backend route parity, persistence access.
- Core records: request/response envelopes, auth session, workspace headers.

### Testing Layer

- Responsibility: smoke, practical workflow, data validation, edge-case, regression validation.
- Core records: test output, evidence files, validation summaries.

## 3. Per-Module Contracts

### Accounting Engine contract

- Inputs: finalized documents, inventory movements, payments, opening balances, chart defaults.
- Outputs: journal entries, ledger balances, report data.
- Accounting impact: authoritative source of financial posting.
- Validation rules: balanced entries, valid account references, required source linkage.
- Traceability rules: every posting must retain source type and source id.
- Report impact: feeds trial balance, ledger, P&L, balance sheet, aging, VAT-linked reports.

### Invoice Engine contract

- Inputs: contact id, item ids, lines, dates, language, notes, payment instructions.
- Outputs: draft/finalized documents, line totals, payment-ready records.
- Accounting impact: creates sales-side financial events once finalized.
- Validation rules: saved contact required, saved items required, valid totals and due dates.
- Traceability rules: document id must link to journal and payment records.
- Report impact: invoice register, VAT outputs, receivables aging.

### Inventory Engine contract

- Inputs: item master data, receipts, adjustments, sales-linked stock events.
- Outputs: stock records, transactions, inventory journals where applicable.
- Accounting impact: inventory, COGS, adjustments when configured.
- Validation rules: no invalid quantities, no broken item/account links, uniqueness where required.
- Traceability rules: movement must link to source document or adjustment event.
- Report impact: stock visibility, profitability by product, inventory-linked journals.

### Payment Engine contract

- Inputs: document id, amount, date, method, reference.
- Outputs: payment records, allocations, settlement journals/candidates.
- Accounting impact: clears receivable/payable and impacts cash/bank.
- Validation rules: payment amount positive, allocation within remaining balance.
- Traceability rules: payment must reference source document and journal lines.
- Report impact: payments register, aging, reconciliation candidate pool.

### Customer Advance Engine contract

- Inputs: advance receipt, customer id, application amount, source document.
- Outputs: advance balances and application events.
- Accounting impact: customer advance liability and application clearing.
- Validation rules: cannot apply more than available advance.
- Traceability rules: advance source and application target must be linked.
- Report impact: customer balance accuracy and ledger visibility.

### VAT Engine contract

- Inputs: taxable lines, tax rates, document direction, purchase/sales context.
- Outputs: line VAT, document VAT totals, VAT summary/detail datasets.
- Accounting impact: VAT payable/receivable entries.
- Validation rules: tax amount math must match persisted values.
- Traceability rules: VAT must remain attributable to document and lines.
- Report impact: VAT summary, VAT detail, received/paid details.

### Reporting Engine contract

- Inputs: posted accounting, document, payment, and tax data.
- Outputs: queryable report datasets and UI/API views.
- Accounting impact: none directly, but must reflect posted truth.
- Validation rules: report rows must reconcile to underlying records.
- Traceability rules: rows must be explainable from source records.
- Report impact: natively owns report delivery.

### Traceability Engine contract

- Inputs: business events across modules.
- Outputs: inspectable source links and audit entries.
- Accounting impact: no posting change; evidence layer only.
- Validation rules: no orphan source metadata for posted events.
- Traceability rules: all critical events must be attributable.
- Report impact: audit trail and review flows.

### Integrity Enforcement Engine contract

- Inputs: attempted state transitions and writes.
- Outputs: allowed transition or explicit failure.
- Accounting impact: prevents invalid accounting states.
- Validation rules: enforce stock, payment, required linkage, status transitions.
- Traceability rules: blocked actions should remain diagnosable.
- Report impact: protects report correctness indirectly.

### UI Validation Layer contract

- Inputs: user actions, route context, API responses.
- Outputs: clear operational feedback, correct route behavior, no hidden failure.
- Accounting impact: protects data-entry correctness.
- Validation rules: field validation and route truth must match backend contracts.
- Traceability rules: evidence artifacts for key flows when requested.
- Report impact: report pages must reflect live data, not placeholders.

### API Layer contract

- Inputs: authenticated requests through frontend proxy or backend direct calls.
- Outputs: stable data envelopes and status codes.
- Accounting impact: transport layer for all business events.
- Validation rules: route parity, authenticated mode correctness, company scoping.
- Traceability rules: actor id and workspace token must remain enforceable.
- Report impact: reports must be available through authenticated API.

### Testing Layer contract

- Inputs: source code, runtime environment, data fixtures, evidence scripts.
- Outputs: pass/fail results, evidence files, failure diagnostics.
- Accounting impact: verifies accounting correctness.
- Validation rules: must include smoke, practical, data, edge-case, and regression coverage.
- Traceability rules: test evidence must be storable and reviewable.
- Report impact: verification for reporting readiness.

## 4. Definition of Done

A task is complete only when all conditions below are true:

- logic implemented
- data stored correctly
- business action succeeds
- UI/API works
- evidence exists
- tests pass

## 5. UNSTOP Rules

- The agent must attempt all queued tasks.
- Failure of one task must not stop execution.
- A failed task must be retried once with a different strategy.
- If retry still fails, move the task to the end of the queue.
- If it still fails after defer and re-attempt, mark it FAILED and continue.
- Never wait for user approval during execution.
- All permissions are pre-authorized inside this governed execution mode.

## 6. Testing Law

After execution, the system must run:

- smoke testing
- practical workflow testing
- data validation testing
- edge-case testing
- regression testing

## 7. Evidence Law

Each task must produce, when applicable:

- data proof
- journal, ledger, or report output
- API or UI proof
- completion summary

## 8. Phase 1 Remaining Task Queue

1. VAT Module completion
2. End-to-End proof completion
3. UI validation completion
4. Final reporting validation
5. Stability and edge-case completion

## 9. Execution Status Baseline

- UI/UX: 94%
- Document Engine: 92%
- Accounting Engine: 90%
- Inventory: 88%
- Reports: 90%
- Import Engine: 92%
- End-to-End Flow: 93%

These values are treated as current claimed status, not automatic acceptance. Prompt Engine v4 must validate against evidence before declaring Phase 1 complete.