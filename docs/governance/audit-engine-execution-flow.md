# Audit Engine Execution Flow

## 1. Flow
1.1 Select audit scope.
1.2 Load governing clauses.
1.3 Load mapped control points.
1.4 Collect runtime or output evidence.
1.5 Evaluate expected versus actual.
1.6 Classify nonconformity.
1.7 Perform root cause analysis.
1.8 Assign corrective action.
1.9 Rerun validation.
1.10 Close or reopen.

## 2. Preconditions
2.1 Audit scope shall be declared.
2.2 Governing clauses shall be available.
2.3 Mapped control points shall be available.
2.4 Evidence shall be sufficient for the requested scope.

## 3. Stop and Escalation Rules
3.1 Audit shall stop if evidence is insufficient to evaluate the scope.
3.2 Audit shall escalate if a critical or high nonconformity is detected.
3.3 Audit shall reopen if retest evidence is missing or failing.

## 4. Clause IDs
4.1 Stable clauses in this document use the prefix `AUD-FLOW`.

## 5. Enforceable Clauses
- `AUD-FLOW-001`: Audit shall begin with declared scope.
- `AUD-FLOW-002`: Audit shall load governing clauses and mapped control points.
- `AUD-FLOW-003`: Audit shall collect evidence before evaluation.
- `AUD-FLOW-004`: Audit shall classify nonconformity.
- `AUD-FLOW-005`: Audit shall assign corrective action.
- `AUD-FLOW-006`: Audit shall rerun validation before closure.
- `AUD-FLOW-007`: Audit shall reopen when retest evidence fails or is missing.
