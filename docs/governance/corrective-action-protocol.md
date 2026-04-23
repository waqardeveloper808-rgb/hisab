# Corrective Action Protocol

## 1. Required Fields
1.1 action_id
1.2 source_audit_id
1.3 failed_clause_id
1.4 failed_control_point_id
1.5 target_module
1.6 target_layer
1.7 exact_remediation_target
1.8 expected_fix_outcome
1.9 regression_risks
1.10 validation_steps
1.11 assigned_owner
1.12 due_state
1.13 reopen_trigger

## 2. Protocol Rules
2.1 Corrective action shall not be valid without an exact remediation target.
2.2 Corrective action shall not be complete on code change alone.
2.3 Corrective action shall remain linked to retest.

## 3. Clause IDs
3.1 Stable clauses in this document use the prefix `AUD-COR`.

## 4. Enforceable Clauses
- `AUD-COR-001`: Corrective action shall include the required fields.
- `AUD-COR-002`: Corrective action shall identify an exact remediation target.
- `AUD-COR-003`: Corrective action shall remain linked to retest.
- `AUD-COR-004`: Code change alone shall not complete corrective action.
