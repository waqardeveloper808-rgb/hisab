# Control Point Enforcement Rules

## 1. Enforcement Modes
1.1 Hard block shall stop execution.
1.2 Soft warning shall allow execution with a flag.
1.3 Auto-fix shall suggest correction only when deterministic correction is defined.

## 2. Rule Requirements
2.1 Hard block shall apply to nonrecoverable integrity failures.
2.2 Soft warning shall apply to recoverable or advisory deviations.
2.3 Auto-fix shall never conceal a noncompliance event.
2.4 Enforcement shall not bypass control-point evaluation.

## 3. Clause IDs
3.1 Stable clauses in this document use the prefix `CPE-RULE`.

## 4. Enforceable Clauses
- `CPE-RULE-001`: Hard block shall stop execution.
- `CPE-RULE-002`: Soft warning shall allow execution with a flag.
- `CPE-RULE-003`: Auto-fix shall only suggest deterministic correction.
- `CPE-RULE-004`: Enforcement shall not bypass evaluation.
