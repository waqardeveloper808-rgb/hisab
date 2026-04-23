# Control Point Error Contract

## 1. Required Fields
1.1 code
1.2 message
1.3 module
1.4 violated_rule
1.5 severity
1.6 suggested_fix

## 2. Contract Rules
2.1 Every control-point error shall use the required fields.
2.2 The error contract shall remain machine-readable.
2.3 The error contract shall not hide the violated rule.

## 3. Clause IDs
3.1 Stable clauses in this document use the prefix `CPE-ERR`.

## 4. Enforceable Clauses
- `CPE-ERR-001`: Control-point errors shall include the required fields.
- `CPE-ERR-002`: Control-point errors shall remain machine-readable.
- `CPE-ERR-003`: Control-point errors shall expose the violated rule.
