# Reporting Control-Point Seeds

## 1. Scope
1.1 These seeds define control definitions for future reporting control points.

## 2. Seed List
- `RPT-CP-001`: Report mismatch
- `RPT-CP-002`: Missing drill-down
- `RPT-CP-003`: Inconsistent totals
- `RPT-CP-004`: VAT versus invoice mismatch
- `RPT-CP-005`: Stock versus accounting mismatch
- `RPT-CP-006`: Orphan transactions

## 3. Required Seed Fields
3.1 Each future control point shall include control id, source clause id, module, title, purpose, expected behavior, failure condition, severity, measurable fields, evidence requirement, likely root-cause zones, and retest requirement.

## 4. Clause IDs
4.1 Stable clauses in this document use the prefix `RPT-CP`.

## 5. Enforceable Clauses
- `RPT-CP-001`: Reporting control points shall be clause-linked.
- `RPT-CP-002`: Reporting control points shall be measurable.
- `RPT-CP-003`: Reporting control points shall require evidence.
- `RPT-CP-004`: Reporting control points shall define retest requirements.
