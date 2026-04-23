# Control Point Registry

The canonical machine-readable registry is [control-point-registry.json](./control-point-registry.json).

## Module Groups
- `governance`: CP-GOV-001 through CP-GOV-008
- `workspace`: CP-WSP-001 through CP-WSP-003
- `ux`: CP-UX-001 through CP-UX-004
- `document_engine`: CP-DOC-001 and CP-DOC-004
- `preview_engine`: CP-DOC-002
- `template_engine`: CP-DOC-003
- `compliance`: CP-DOC-005
- `accounting`: CP-ACC-001 through CP-ACC-004
- `vat`: CP-ACC-005
- `reporting`: CP-ACC-006 and CP-RPT-001
- `inventory`: CP-INV-001 through CP-INV-004
- `reconciliation`: CP-REC-001
- `intelligence`: CP-INT-001
- `hr`: CP-HR-001
- `attendance`: CP-ATT-001
- `payroll`: CP-PAY-001 and CP-PAY-002

## Canonical Rule
1. Every control point shall carry a source clause, trigger, severity, failure condition, evidence requirement, and root-cause zones.
2. Every control point shall be normalized for machine use and human audit.
3. Duplicate semantics are merged into canonical controls with clause tags preserved for traceability.

## Hardening Contract
1. Every control point in `control-point-registry.json` shall also carry `expected_state`, `failure_condition`, `validation_method`, `cross_validation_sources`, `measurable_fields`, and `anti_cheat_rules`.
2. `expected_state` shall be machine-readable and expressed as boolean predicates over observable fields.
3. `failure_condition` shall be machine-readable and expressed as boolean predicates that reproduce a failure deterministically.
4. `validation_method` shall use controlled values and shall not be left vague.
5. `cross_validation_sources` shall name the minimum independent sources required to prove the control.
6. `measurable_fields` shall list the exact fields used to evaluate the control.
7. `anti_cheat_rules` shall define how a false pass could be produced and how that false pass is prevented.
8. No control shall be considered hardened unless its evidence path can be reproduced from the registry and the governing document set.
