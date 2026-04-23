# Document Lifecycle Constitution

Updated: 2026-04-23
Status: Governing document state-transition law.

## 1. Lifecycle Authority

### 1.1 Clause IDs

- `DOC-LC-001`: Document lifecycle shall use governed stages.
- `DOC-LC-002`: Finalized documents shall be immutable.
- `DOC-LC-003`: Audit trail shall be mandatory for lifecycle transitions.

### 1.2 Stages

1. Draft
2. Sent
3. Approved
4. Finalized
5. Cancelled

### 1.3 State rules

- `DOC-LC-010`: Draft may be edited.
- `DOC-LC-011`: Sent shall preserve message and traceability context.
- `DOC-LC-012`: Approved shall remain governed by downstream finalization rules.
- `DOC-LC-013`: Finalized shall be immutable except through governed duplication or cancellation.
- `DOC-LC-014`: Cancelled shall remain traceable and reversible only through governed correction flows.

### 1.4 Versioning

- `DOC-LC-020`: Version tracking shall be mandatory at every lifecycle transition.
- `DOC-LC-021`: The lifecycle shall retain enough history to explain all finalized states.

