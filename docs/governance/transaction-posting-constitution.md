# Transaction Posting Constitution

Updated: 2026-04-23
Status: Governing posting law for financial workflows.

## 1. Posting Authority

### 1.1 Clause IDs

- `ACC-PST-001`: No business-critical financial workflow may skip journal logic.
- `ACC-PST-002`: Invoice, payment, inventory, and VAT flows shall reconcile through governed postings.
- `ACC-PST-003`: Payment allocation shall affect outstanding balance correctly.

### 1.2 Posting scope

- `ACC-PST-010`: Sales invoice finalization shall create governed postings.
- `ACC-PST-011`: Credit note issuance shall create governed reversal or adjustment postings.
- `ACC-PST-012`: Debit note issuance shall create governed adjustment postings.
- `ACC-PST-013`: Purchase bill finalization shall create governed postings.
- `ACC-PST-014`: Purchase credit and debit adjustments shall create governed postings.
- `ACC-PST-015`: Payment receipt shall create governed postings.
- `ACC-PST-016`: Supplier payment shall create governed postings.
- `ACC-PST-017`: Customer advance receipt shall create governed postings.
- `ACC-PST-018`: Customer advance application shall create governed clearing postings.
- `ACC-PST-019`: Inventory receipt shall create governed inventory and/or accounting effects.
- `ACC-PST-020`: Inventory issue or consumption shall create governed COGS or inventory effects where relevant.
- `ACC-PST-021`: Stock adjustment shall create governed posting effects.
- `ACC-PST-022`: COGS generation on sale shall be governed and traceable.
- `ACC-PST-023`: VAT posting effect shall remain synchronized with accounting and document truth.
- `ACC-PST-024`: Deferred, prepaid, and accrual-ready rules shall be respected where relevant.
- `ACC-PST-025`: Period-end adjustment readiness shall preserve closing integrity.

### 1.3 Required event record

- `ACC-PST-030`: Each governed event shall define source event, inputs, validations, accounting effect, journal obligations, traceability obligations, reporting effect, and forbidden shortcuts.
- `ACC-PST-031`: Balance in documents shall mean outstanding after payments, credit notes, debit notes, and adjustments.
- `ACC-PST-032`: Document, payment, inventory, and VAT flows shall remain reconcilable.

### 1.4 Forbidden shortcuts

- `ACC-PST-040`: No posting shortcut shall bypass journals.
- `ACC-PST-041`: No financial event shall mutate balances without traceable journal impact.
- `ACC-PST-042`: No report-only state shall be allowed to substitute for posting truth.

