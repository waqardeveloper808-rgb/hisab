# Reporting Engine Constitution

## 1. Purpose
1.1 The reporting engine shall be the read-only truth layer for Gulf Hisab.
1.2 The reporting engine shall derive truth only from the accounting engine, inventory engine, and VAT engine.
1.3 The reporting engine shall not introduce independent calculation logic.
1.4 The reporting engine shall not override posted truth.

## 2. Source of Truth
2.1 Reports shall reflect posted financial and operational truth only.
2.2 Every report output shall be traceable to source records, journals, documents, or movement logs.
2.3 Every report number shall support drill-down to the contributing source data.
2.4 Report aggregation shall preserve lineage and reconciliation evidence.

## 3. Boundaries
3.1 The reporting engine shall not mutate source records.
3.2 The reporting engine shall not repair broken upstream integrity.
3.3 The reporting engine shall not conceal inconsistency.
3.4 The reporting engine shall fail explicitly when required inputs are missing or inconsistent.

## 4. Clause IDs
4.1 Stable clauses in this document use the prefix `RPT-CON`.
4.2 Future control points and audits shall reference the exact clause IDs defined here.

## 5. Enforceable Clauses
- `RPT-CON-001`: Reporting shall be read-only.
- `RPT-CON-002`: Reporting shall derive only from accounting, inventory, and VAT engines.
- `RPT-CON-003`: Reporting shall not compute independent truth.
- `RPT-CON-004`: Every report value shall be traceable.
- `RPT-CON-005`: Every report value shall support drill-down.
- `RPT-CON-006`: Report failure shall be explicit when source truth is missing or inconsistent.
