# Audit Engine Architecture

## 1. Purpose
1.1 The audit engine shall be the formal compliance executor for Gulf Hisab.
1.2 The audit engine shall inspect governed behavior, detect nonconformity, and enforce corrective loops.
1.3 The audit engine shall not invent product law.
1.4 The audit engine shall derive only from governing documents and observed evidence.

## 2. Scope
2.1 The audit engine shall operate across workspace, document, template, accounting, VAT, inventory, reporting, reconciliation, intelligence, HR, payroll, and timesheet surfaces.
2.2 The audit engine shall consume master design clauses, standards clauses, control-point registry entries, and observed production behavior or output.

## 3. Inputs
3.1 Master Design clauses.
3.2 Standards clauses.
3.3 Control-point registry entries.
3.4 Observed runtime behavior.
3.5 Generated output artifacts.
3.6 Evidence references.

## 4. Outputs
4.1 Findings.
4.2 Nonconformities.
4.3 Severity.
4.4 Evidence.
4.5 Root cause targets.
4.6 Corrective actions.
4.7 Retest status.
4.8 Closure status.

## 5. Boundary Rules
5.1 The audit engine shall not close a failure without retest evidence.
5.2 The audit engine shall not mark vague partial success as compliant.
5.3 The audit engine shall not act as a substitute for product law.

## 6. Clause IDs
6.1 Stable clauses in this document use the prefix `AUD-ARCH`.

## 7. Enforceable Clauses
- `AUD-ARCH-001`: The audit engine shall be the compliance executor.
- `AUD-ARCH-002`: The audit engine shall derive from governing documents only.
- `AUD-ARCH-003`: The audit engine shall consume clauses, registry entries, and observed behavior.
- `AUD-ARCH-004`: The audit engine shall emit findings, nonconformities, evidence, RCA targets, corrective actions, and retest status.
- `AUD-ARCH-005`: The audit engine shall not close without retest evidence.
- `AUD-ARCH-006`: Vague partial success shall not be compliant.
