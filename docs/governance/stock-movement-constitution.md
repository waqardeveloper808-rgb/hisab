# Stock Movement Constitution

Updated: 2026-04-23
Status: Governing movement law for stock quantity changes.

## 1. Movement Authority

### 1.1 Clause IDs

- `INV-MOV-001`: Every stock change shall be recorded as a movement.
- `INV-MOV-002`: Quantity shall never be undefined in governed stock movement.
- `INV-MOV-003`: Movement logging shall be mandatory for all stock changes.

### 1.2 Movement types

- `INV-MOV-010`: Supported movement types shall include purchase receipt, sales issue, stock adjustment, return, and transfer where future-ready.
- `INV-MOV-011`: Return movements shall preserve source lineage.
- `INV-MOV-012`: Transfer movement support shall remain future-ready where not yet operational.

### 1.3 Stock rules

- `INV-MOV-020`: Negative stock rules shall be explicit and auditable.
- `INV-MOV-021`: Negative stock shall be blocked unless a governed exception allows it.
- `INV-MOV-022`: Missing movement logs shall invalidate the stock change claim.

