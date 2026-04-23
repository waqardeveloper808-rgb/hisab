# Audit Engine Output Contract

## 1. Required Fields
1.1 audit_id
1.2 scope
1.3 module
1.4 control_point_id
1.5 clause_id
1.6 expected_state
1.7 actual_state
1.8 severity
1.9 status
1.10 evidence_refs
1.11 root_cause_hypothesis
1.12 root_cause_confirmed
1.13 corrective_action_id
1.14 retest_status
1.15 closure_status
1.16 timestamps
1.17 owner

## 2. Contract Rules
2.1 The output contract shall be machine-readable.
2.2 Every audit result shall include the required fields.
2.3 Every audit result shall preserve traceability to evidence.

## 3. Clause IDs
3.1 Stable clauses in this document use the prefix `AUD-OUT`.

## 4. Enforceable Clauses
- `AUD-OUT-001`: Audit outputs shall include the required fields.
- `AUD-OUT-002`: Audit outputs shall remain machine-readable.
- `AUD-OUT-003`: Audit outputs shall preserve evidence traceability.
