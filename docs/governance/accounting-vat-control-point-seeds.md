# Accounting and VAT Control Point Seeds

Updated: 2026-04-23
Status: Seed document for accounting and VAT control-point generation.

## 1. Seed Scope

- `ACC-CP-001`: These seeds shall be used to generate future accounting and VAT control points.

## 2. Seed Categories

- `ACC-CP-010`: Double-entry enforcement.
- `ACC-CP-011`: Accounting equation integrity.
- `ACC-CP-012`: Trial balance validation.
- `ACC-CP-013`: Journal immutability after final post.
- `ACC-CP-014`: Reversal lineage integrity.
- `ACC-CP-015`: Posting-source traceability.
- `ACC-CP-016`: Required account mapping presence.
- `ACC-CP-017`: Invoice posting correctness.
- `ACC-CP-018`: Payment allocation correctness.
- `ACC-CP-019`: Customer advance treatment.
- `ACC-CP-020`: VAT math correctness.
- `ACC-CP-021`: VAT received/paid/payable integrity.
- `ACC-CP-022`: Report-to-ledger reconciliation.
- `ACC-CP-023`: Aged balance correctness.
- `ACC-CP-024`: Stock-to-accounting linkage where applicable.
- `ACC-CP-025`: Period close block if financial integrity fails.

## 3. Seed Expectations

- `ACC-CP-030`: Each control point shall include control id, source clause id, module, title, purpose, expected behavior, failure condition, severity, measurable fields, evidence requirement, likely root-cause zones, and retest requirement.
- `ACC-CP-031`: Each control point shall be traceable to a governing clause.
- `ACC-CP-032`: Each control point shall be machine-auditable.

