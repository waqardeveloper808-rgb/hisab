# Control Point Governance

Updated: 2026-04-23
Status: Mandatory control-point derivation law.

## 1. Control Point Law

### 1.1 Clause IDs

- `CP-001`: Every control point shall have a stable control id.
- `CP-002`: Every control point shall reference exactly one or more source clauses.
- `CP-003`: Every control point shall be derived from a source standard clause and shall not exist without that source.

### 1.2 Required fields

- `CP-010`: Each control point shall include control id.
- `CP-011`: Each control point shall include linked master design clause id.
- `CP-012`: Each control point shall include linked module.
- `CP-013`: Each control point shall include purpose.
- `CP-014`: Each control point shall include expected behavior.
- `CP-015`: Each control point shall include failure condition.
- `CP-016`: Each control point shall include severity.
- `CP-017`: Each control point shall include measurable fields.
- `CP-018`: Each control point shall include evidence requirement.
- `CP-019`: Each control point shall include audit method.
- `CP-020`: Each control point shall include likely root cause zones.
- `CP-021`: Each control point shall include corrective action ownership.
- `CP-022`: Each control point shall include retest requirement.

### 1.3 Vague control prohibition

- `CP-030`: No control point may remain vague.
- `CP-031`: No control point may say "manual" unless automation is impossible and the justification is written.
- `CP-032`: Critical controls shall be automation-ready by design.

## 2. Registry Rules

### 2.1 Registry completeness

- `CP-040`: The control-point registry shall cover every governed clause that needs verification.
- `CP-041`: Registry gaps shall be treated as governance defects.
- `CP-042`: Duplicate control ids shall be treated as invalid registry state.

### 2.2 Evidence and linkage

- `CP-050`: Each control point shall carry evidence requirements that can be checked by audit.
- `CP-051`: Each control point shall retain traceable links to the files or runtime surfaces it governs.
- `CP-052`: Each control point shall identify the owner responsible for corrective closure.

## 3. Severity Rules

- `CP-060`: Severity shall be explicit and stable.
- `CP-061`: Severity shall map to enforcement priority and retest priority.
- `CP-062`: High and critical controls shall demand stronger evidence and shorter closure tolerance.

