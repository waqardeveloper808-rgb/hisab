# Control Point Evaluation Flow

## 1. Flow
1.1 Trigger event.
1.2 Collect context.
1.3 Run mapped control points.
1.4 Return violations.

## 2. Flow Rules
2.1 Trigger events shall be declared.
2.2 Context shall include the module state required to evaluate the control point.
2.3 Control points shall run deterministically against the collected context.
2.4 Violations shall be returned in structured form.

## 3. Clause IDs
3.1 Stable clauses in this document use the prefix `CPE-FLOW`.

## 4. Enforceable Clauses
- `CPE-FLOW-001`: Trigger events shall initiate evaluation.
- `CPE-FLOW-002`: Context shall be collected before evaluation.
- `CPE-FLOW-003`: Mapped control points shall be executed.
- `CPE-FLOW-004`: Violations shall be returned structurally.
