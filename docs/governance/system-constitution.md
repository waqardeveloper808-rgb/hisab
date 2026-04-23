# Gulf Hisab System Constitution

Updated: 2026-04-23
Status: Supreme governance document for product truth, document authority, and execution discipline.

## 1. Constitutional Authority

### 1.1 Clause ID system

- `SYS-CON-001`: Every enforceable governance rule shall use a stable clause identifier.
- `SYS-CON-002`: Clause identifiers shall be hierarchical, stable, and reusable in prompts, standards, control points, audits, and corrective actions.
- `SYS-CON-003`: Clause identifiers shall not be reused for a different rule.

### 1.2 Supremacy

- `SYS-CON-010`: This document is the supreme constitutional layer for Gulf Hisab governance.
- `SYS-CON-011`: No dashboard, control registry, audit engine, prompt, or generated registry may override this constitution.
- `SYS-CON-012`: If a conflict exists, this constitution governs and the conflicting artifact is subordinate or deprecated.

### 1.3 Binding hierarchy

- `SYS-CON-020`: The mandatory hierarchy is Constitution -> Master Design -> Standards -> Control Points -> Audit Protocol -> Root Cause / Corrective Action -> Architect Dashboard -> Execution Governance Rules.
- `SYS-CON-021`: A lower layer shall derive from the layer above it and shall not compete with it.
- `SYS-CON-022`: A UI page shall never be treated as the product law.

## 2. Source of Truth Law

### 2.1 One source of truth

- `SYS-CON-100`: The platform shall maintain one source of truth for governance law.
- `SYS-CON-101`: Duplicated governing statements across scattered files are not authoritative unless the governing file map explicitly declares them as derived, retained, merged, or deprecated.
- `SYS-CON-102`: The current source-of-truth set shall be the governance documents in `docs/governance/` listed in `governance-file-map.md`.

### 2.2 Document inheritance

- `SYS-CON-110`: JSON, registry, and TypeScript control artifacts shall inherit from the markdown constitutional documents.
- `SYS-CON-111`: Generated artifacts shall not outrank the markdown law that produced them.
- `SYS-CON-112`: Runtime code shall consume governance derivatives, but runtime code shall not redefine the governing clauses.

### 2.3 Deprecation law

- `SYS-CON-120`: Old master-design documents shall be explicitly labeled deprecated when a replacement governance document exists.
- `SYS-CON-121`: Deprecated documents may remain only as compatibility bridges or historical references.
- `SYS-CON-122`: Deprecated documents shall not be cited as primary law in future prompts.

## 3. Mandatory Governance Chain

### 3.1 Traceability chain

- `SYS-CON-200`: Every requirement shall be traceable from Master Design Clause -> Control Point -> Audit Check -> Root Cause Analysis -> Corrective Action -> Retest Evidence.
- `SYS-CON-201`: A requirement is incomplete if any link in that chain is missing.
- `SYS-CON-202`: Evidence shall be retained for each verified link.

### 3.2 Evidence rule

- `SYS-CON-210`: No audit may declare success without evidence.
- `SYS-CON-211`: No corrective action may close without loop retest evidence.
- `SYS-CON-212`: No module may be considered complete by UI existence alone.

## 4. Product Truth Boundaries

### 4.1 Ownership

- `SYS-CON-300`: Master Design owns product truth.
- `SYS-CON-301`: Standards own rule formalization.
- `SYS-CON-302`: Control Points own guard definitions.
- `SYS-CON-303`: Audit Engine owns compliance verification.
- `SYS-CON-304`: Root Cause Protocol owns corrective workflow.
- `SYS-CON-305`: Architect Dashboard owns governance visibility.
- `SYS-CON-306`: Business engines own runtime behavior.
- `SYS-CON-307`: UI pages do not define product law.

### 4.2 Boundary enforcement

- `SYS-CON-310`: Cross-layer confusion shall be treated as a governance defect.
- `SYS-CON-311`: A UI summary is a viewer, not a legal authority.
- `SYS-CON-312`: A preview, demo, or placeholder state shall not be counted as shipped workflow.

## 5. Architect Dashboard Requirement

### 5.1 Governance surface

- `SYS-CON-400`: The platform shall expose an Architect Dashboard as the visible governance control surface.
- `SYS-CON-401`: The Architect Dashboard shall show constitutional status, master design sections, control coverage, audit status, nonconformities, root cause queue, corrective-action queue, retest status, compliance heatmap, and module compliance state.
- `SYS-CON-402`: The Architect Dashboard shall be a governance viewer and command surface, not product law itself.

## 6. Execution Governance Rules

### 6.1 Execution discipline

- `SYS-CON-500`: Future prompts shall reference stable clause IDs.
- `SYS-CON-501`: Future implementation tasks shall state the governing clause(s) before changing files.
- `SYS-CON-502`: Implementation shall remain scoped to the smallest file set needed to satisfy the governing clause.
- `SYS-CON-503`: Runtime fixes shall not be disguised as governance rewrites.

### 6.2 Retest discipline

- `SYS-CON-510`: A control failure shall not be closed without retest.
- `SYS-CON-511`: A retest shall inspect actual behavior or generated evidence, not a verbal assurance.
- `SYS-CON-512`: Reopen is mandatory if retest evidence fails or is missing.

