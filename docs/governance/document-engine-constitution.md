# Document Engine Constitution

Updated: 2026-04-23
Status: Supreme document-system constitution for document truth, rendering parity, and compliance-bound execution.

## 1. Authority

### 1.1 Clause IDs

- `DOC-ENG-001`: The document engine shall be deterministic.
- `DOC-ENG-002`: The document engine shall maintain a single source of document truth.
- `DOC-ENG-003`: The document engine shall not derive document logic from UI state.
- `DOC-ENG-004`: The document engine shall expose a strict backend-to-template contract.

### 1.2 Truth hierarchy

- `DOC-ENG-010`: Finalized document data shall be authoritative over preview, template editor, and UI interpretation.
- `DOC-ENG-011`: Preview and PDF shall represent the same governed document state.
- `DOC-ENG-012`: Template definitions shall shape presentation only and shall not redefine business truth.

### 1.3 Forbiddances

- `DOC-ENG-020`: No UI-derived document logic shall be accepted as governing truth.
- `DOC-ENG-021`: No duplicate document truth shall exist across preview and PDF paths.
- `DOC-ENG-022`: No final document output shall depend on uncontrolled template freedom.

## 2. Deterministic Behavior

- `DOC-ENG-030`: Every document rendering path shall use the same document contract version for equivalent state.
- `DOC-ENG-031`: The same input state shall produce the same governed output class.
- `DOC-ENG-032`: Any change in output shall be explainable through versioned document, template, or compliance data.

## 3. Finalization Discipline

- `DOC-ENG-040`: Finalization shall lock the governed business state.
- `DOC-ENG-041`: Finalized documents shall be immutable except through governed cancellation, duplication, or correction flows.
- `DOC-ENG-042`: Version tracking shall remain mandatory for every document lifecycle transition.

