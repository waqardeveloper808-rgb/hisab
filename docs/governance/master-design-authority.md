# Master Design Authority & Hierarchy

Updated: 2026-04-23
Status: Derived constitutional authority document.

## 1. Authority Model

### 1.1 Clause IDs

- `MD-AUTH-001`: Master Design clauses shall be assigned stable identifiers.
- `MD-AUTH-002`: Master Design clause IDs shall be referenced by standards, control points, audits, and corrective actions.
- `MD-AUTH-003`: Clause numbering shall be hierarchical and machine-readable.

### 1.2 Authority order

- `MD-AUTH-010`: Master Design is the product constitution below the system constitution and above all standards.
- `MD-AUTH-011`: Standards may formalize Master Design clauses but shall not contradict them.
- `MD-AUTH-012`: Control points shall derive from Master Design clauses and shall not exist without them.

### 1.3 Document hierarchy

1. Constitution
1.1 Supreme governance law.
1.2 Defines source-of-truth and deprecation rules.
2. Master Design
2.1 Product truth.
2.2 Defines what the platform is.
3. Standards
3.1 Rule formalization.
3.2 Defines how clauses become checks.
4. Control Points
4.1 Guard definitions.
4.2 Define measurable compliance conditions.
5. Audit Protocol
5.1 Verification process.
5.2 Produces evidence and status.
6. Root Cause / Corrective Action
6.1 Repair protocol.
6.2 Requires retest before closure.
7. Architect Dashboard
7.1 Visibility surface.
7.2 Never primary law.
8. Execution Governance Rules
8.1 Prompt and implementation discipline.
8.2 Scoped execution and retest rules.

## 2. Master Design Ownership

### 2.1 Product truth

- `MD-AUTH-020`: Master Design shall define product truth for accounting, document, workspace, audit, and governance behavior.
- `MD-AUTH-021`: Master Design shall not be a narrative note or marketing summary.
- `MD-AUTH-022`: Master Design shall define the enforceable product structure, mandatory behavior, and acceptance boundaries.

### 2.2 Non-competition rule

- `MD-AUTH-030`: Standards shall not compete with Master Design.
- `MD-AUTH-031`: Control points shall not create new product intent.
- `MD-AUTH-032`: Audit findings shall not redefine the requirement they evaluate.

## 3. Secondary Artifacts

### 3.1 Derived files

- `MD-AUTH-040`: JSON registries, generated control-point sets, and runtime maps are secondary artifacts.
- `MD-AUTH-041`: Secondary artifacts shall inherit from markdown governance law.
- `MD-AUTH-042`: Secondary artifacts may summarize or operationalize the law, but they shall not become the law.

### 3.2 Deprecation rule

- `MD-AUTH-050`: When a newer governance file replaces an older one, the older file shall be marked deprecated in the file map.
- `MD-AUTH-051`: Deprecated files shall not be used to resolve conflicts.

