# Gulf Hisab Master Design vNext - Phase 1 Governance

Updated: 2026-04-18
Mode: Master Design vNext + Prompt Engine v4 Governance

## 1. System Constitution

### Purpose

Gulf Hisab Phase 1 exists to deliver an enforceable accounting core for GCC SMEs where business workflows, accounting postings, VAT treatment, traceability, reporting, UI behavior, and API behavior all agree on the same source of truth.

### Target Standard

The target standard is Wafeq-level or above in workflow correctness, ledger integrity, traceability, tax consistency, and operator-facing reliability.

### Phase 1 Scope Definition

Phase 1 is limited to the accounting-critical operating path:

- sales invoices and payments
- inventory-linked sales and stock receipts
- customer advances and advance application
- VAT calculation and VAT reporting
- financial reporting correctness
- journal and ledger traceability
- UI and API workflow validation
- evidence-backed regression and stability validation

### Non-Negotiable Rules

- Runtime accounting enforcement must remain active.
- Validation rules must not be weakened to make workflows pass.
- Invoice posting formulas must not be changed unless explicitly required by accounting law.
- Inventory posting formulas must not be changed unless explicitly required by accounting law.
- Payment validation must not be bypassed.
- Account IDs must not be hardcoded.
- A workflow is not complete unless UI, API, data persistence, and reporting all agree.

## 2. Full Module Architecture

### Accounting Engine

- Owns account mapping, journal entries, ledger balances, trial balance, P&L, balance sheet, and posting rules.
- Primary backend surfaces: LedgerService, ReportController, account provisioning, accounting tests.

### Invoice Engine

- Owns draft, finalize, payable/receivable state transitions, invoice numbering, document totals, and invoice lifecycle.

### Inventory Engine

- Owns stock records, receipts, adjustments, sales-linked inventory relief, and inventory valuation journal linkage.

### Payment Engine

- Owns incoming/outgoing payments, allocations, unallocated balances, and settlement journals.

### Customer Advance Engine

- Owns overpayment credit creation, available advance computation, advance application, and advance consumption visibility.

### VAT Engine

- Owns tax category application, tax calculation, VAT output/input classification, and VAT reporting consistency.

### Reporting Engine

- Owns invoice register, payment register, general ledger, trial balance, P&L, balance sheet, VAT detail, and aging outputs.

### Traceability Engine

- Owns source-to-journal-to-ledger document linkage, document number discoverability, and allocation-level traceability.

### Integrity Enforcement Engine

- Owns runtime post-write accounting validation and blocking of inconsistent state.

### UI Validation Layer

- Owns browser-level validation of create/finalize/pay/report workflows under live-routed workspace behavior.

### API Layer

- Owns authenticated company endpoints, request validation, response contracts, and live backend proofability.

### Testing Layer

- Owns feature tests, workflow tests, smoke tests, regression tests, stability suites, and evidence generation tools.

## 3. Per-Module Contracts

### Accounting Engine Contract

- Inputs: finalized documents, payments, inventory transactions, account configuration, manual journals.
- Outputs: balanced journal entries, account movements, reports.
- Accounting impact: direct ownership of debits, credits, balances, retained earnings effects.
- Validation rules: every source event must produce balanced entries with valid accounts and preserved source metadata.
- Traceability rules: journals must retain source type, source id, document links, and line-level identifiers where applicable.
- Report impact: trial balance, P&L, balance sheet, ledger, and registers must reflect posted entries without silent exclusions.

### Invoice Engine Contract

- Inputs: contact, dates, lines, tax category, ledger account, item metadata.
- Outputs: draft/finalized invoice records, invoice totals, issue state, receivable state.
- Accounting impact: invoice finalization creates AR, revenue/income, VAT payable, and inventory-linked COGS/inventory relief where applicable.
- Validation rules: immutable finalized documents, correct totals, valid line data, valid tax and account configuration.
- Traceability rules: invoice number, line ids, source-linked journal metadata.
- Report impact: invoice register, customer statements, receivables aging, VAT outputs, P&L revenue, balance sheet AR.

### Inventory Engine Contract

- Inputs: item, quantity, cost, type, transaction date, reference, linked document metadata.
- Outputs: stock records, movement records, inventory journals.
- Accounting impact: inventory asset movement, COGS, adjustment postings.
- Validation rules: non-negative business rules where applicable, valid item linkage, valid inventory account mapping.
- Traceability rules: stock code, journal entry number, document linkage metadata, transaction references.
- Report impact: stock registers, general ledger inventory lines, balance sheet inventory asset.

### Payment Engine Contract

- Inputs: contact, direction, amount, date, method, reference, allocations.
- Outputs: payment record, allocations, updated document balances, payment journal.
- Accounting impact: cash/bank debit or credit, AR/AP settlement, advance creation when over/under allocated.
- Validation rules: payment amount must equal allocated plus unallocated amount; allocations must not exceed open balances.
- Traceability rules: payment number, allocation metadata, linked document numbers in journal details.
- Report impact: payments register, customer statements, general ledger settlement lines, trial balance cash/receivables/payables.

### Customer Advance Engine Contract

- Inputs: overpayment or manual advance application request.
- Outputs: customer advance balance, advance application journal, updated invoice status.
- Accounting impact: customer advance liability creation and reversal against AR.
- Validation rules: available advance must exist before application; application cannot exceed balance due or available advance.
- Traceability rules: advance source payment and application document must be discoverable in journals and invoice state.
- Report impact: trial balance account 2300, balance sheet liabilities, invoice balance due after application.

### VAT Engine Contract

- Inputs: taxable lines, tax category, tax rate, document type.
- Outputs: net amount, tax amount, VAT summary/detail rows.
- Accounting impact: VAT payable/receivable lines in journals.
- Validation rules: tax category required where taxable behavior is expected; credits reverse sign correctly.
- Traceability rules: tax category code and rate preserved through lines and reports.
- Report impact: VAT detail, VAT summary, P&L net revenue treatment, balance sheet VAT accounts.

### Reporting Engine Contract

- Inputs: posted accounting data and finalized workflow records.
- Outputs: registers, ledgers, summaries, statutory-style reports.
- Accounting impact: none directly, but must reflect posted reality exactly.
- Validation rules: no silent omission of seeded account types or posted lines.
- Traceability rules: filters by document number and source must reveal the correct entries.
- Report impact: this engine is the output layer for accounting correctness proof.

### Traceability Engine Contract

- Inputs: source events and journal lines.
- Outputs: searchability and linked metadata across journals and ledgers.
- Accounting impact: none directly, but required for auditability.
- Validation rules: invoice-level allocations must remain distinguishable when one payment covers multiple invoices.
- Traceability rules: document_numbers arrays and per-line document references are mandatory where a source spans multiple documents.
- Report impact: journal detail and ledger evidence must be inspectable per business document.

### Integrity Enforcement Engine Contract

- Inputs: candidate posted journal state after a business action.
- Outputs: allow or block with explicit validation failure.
- Accounting impact: prevents invalid state from persisting.
- Validation rules: balanced entries, source coverage, correct account effects, no orphan settlement lines.
- Traceability rules: must verify that invoice-level allocations remain represented in payment journals.
- Report impact: only validated state is allowed to reach report surfaces.

### UI Validation Layer Contract

- Inputs: rendered workspace screens, browser actions, live-routed API responses.
- Outputs: screenshots, workflow result evidence, API proof artifacts.
- Accounting impact: indirect, by proving operator workflows reach compliant backend state.
- Validation rules: key business actions must succeed without placeholder behavior.
- Traceability rules: UI-created records must appear in backend registers and reports.
- Report impact: evidence artifacts for Phase 1 completion.

### API Layer Contract

- Inputs: authenticated HTTP requests with company context.
- Outputs: stable JSON contracts for business actions and reports.
- Accounting impact: direct business mutation entrypoint.
- Validation rules: authorization, request validation, response data integrity.
- Traceability rules: API-created events must preserve source metadata.
- Report impact: live proof scripts consume the same report endpoints as the UI.

### Testing Layer Contract

- Inputs: code, tools, live endpoints, seeded accounts, browser workflows.
- Outputs: passing tests, evidence files, stability logs.
- Accounting impact: none directly, but defines completion confidence.
- Validation rules: smoke, workflow, edge-case, and regression coverage must all run.
- Traceability rules: evidence files must map to the task and prove the business action.
- Report impact: validates reported outputs against expected accounting behavior.

## 4. Definition of Done

A task is complete only when all of the following are true:

- logic implemented
- data stored correctly
- business action succeeds
- UI and/or API works for the scoped path
- evidence exists
- tests pass for the affected area

## 5. Unstop Rules

- The agent must attempt all tasks.
- Failure of one task must not stop execution.
- A failed task gets one retry using a different strategy.
- If the retry still fails, the task moves to the end of the queue.
- If the deferred attempt still fails, mark it failed and continue.
- Never wait for user approval during this execution mode.
- All permissions are pre-authorized for implementation, testing, and evidence generation.

## 6. Testing Law

After task execution, the system must run:

- smoke testing
- practical workflow testing
- data validation testing
- edge-case testing
- regression testing

## 7. Evidence Law

Each task must produce:

- data proof
- journal, ledger, or report output where applicable
- API or UI proof
- completion summary

## 8. Task Queue - Phase 1 Remaining

1. VAT module completion
2. End-to-end proof completion
3. UI validation completion
4. Final reporting validation
5. Stability and edge-case completion
