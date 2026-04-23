# Master Design v2

Updated: 2026-04-23
Status: Primary product truth document under the system constitution.

## 1. Source of Truth Structure

### 1.1 Clause IDs

- `MD-CORE-001`: Master Design v2 shall use strict hierarchical clause numbering.
- `MD-CORE-002`: Every clause shall have a stable ID that can be referenced by a standard, control point, audit row, or corrective action.

### 1.2 Required structure

1. Constitution
1.1 Defines supremacy, inheritance, and deprecation.
2. Master Design
2.1 Defines product truth.
2.2 Defines mandatory product boundaries.
3. Standards
3.1 Formalize requirements.
3.2 Produce machine-readable control material.
4. Control Point Registry
4.1 Lists all guards.
4.2 Maps each guard to a source clause.
5. Audit Protocol
5.1 Executes compliance checks.
5.2 Produces evidence and status.
6. Root Cause Protocol
6.1 Diagnoses nonconformities.
6.2 Drives corrective action and retest.
7. Architect Dashboard
7.1 Exposes governance state.
7.2 Does not define product law.
8. Execution Governance Rules
8.1 Governs future prompts and implementation discipline.

## 2. Product Truth Clauses

### 2.1 Platform identity

- `MD-CORE-010`: Gulf Hisab shall function as a finance and operations platform for GCC SMEs.
- `MD-CORE-011`: The platform shall coordinate business engines, governance engines, and evidence engines under one traceable law set.

### 2.2 Truth boundaries

- `MD-CORE-020`: A page does not become authoritative by existing in the UI.
- `MD-CORE-021`: A preview or placeholder shall not be counted as shipped workflow.
- `MD-CORE-022`: Business truth shall be confirmed by storage, route behavior, output, and audit evidence together.

### 2.3 Required traceability

- `MD-CORE-030`: Every requirement shall map from source clause to control point to audit record to corrective closure.
- `MD-CORE-031`: Every compliance claim shall expose evidence or shall be rejected.

## 3. Machine-Readable Derivatives

### 3.1 Inheritance rule

- `MD-CORE-040`: Markdown governance documents are the source of truth.
- `MD-CORE-041`: JSON and TypeScript registries derived from this document shall preserve clause IDs.
- `MD-CORE-042`: Generated files shall not introduce new product law.

### 3.2 Prompt references

- `MD-CORE-050`: Future prompts shall cite clause IDs instead of informal references.
- `MD-CORE-051`: Future prompts shall state the governing document and clause set before requesting implementation.

