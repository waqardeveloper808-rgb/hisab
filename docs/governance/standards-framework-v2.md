# Standards Framework v2

Updated: 2026-04-23
Status: Formalization layer derived from Master Design v2.

## 1. Standards Authority

### 1.1 Clause IDs

- `STD-001`: Standards shall formalize Master Design clauses into measurable requirements.
- `STD-002`: Standards shall not redefine product intent.
- `STD-003`: Standards shall be written so that a control point can validate them without guessing.

### 1.2 Structure

1. Source clause
1.1 Master Design clause ID.
1.2 Human-readable clause text.
2. Standard rule
2.1 Formal obligation derived from the source clause.
2.2 Measurable and testable.
3. Control mapping
3.1 One or more control points.
3.2 Explicit evidence requirements.
4. Audit mapping
4.1 Expected verification method.
4.2 Expected result states.

## 2. Standardization Rules

### 2.1 Formalization requirements

- `STD-010`: Every standard shall name its source clause.
- `STD-011`: Every standard shall define expected behavior, failure condition, and evidence requirement.
- `STD-012`: Every standard shall identify whether automation is required, preferred, or unavailable.

### 2.2 No ambiguity

- `STD-020`: Standards shall not use vague terms such as "good enough", "looks right", or "manual review only" without justification.
- `STD-021`: If automation is impossible, the standard shall explain why and shall define the fallback evidence.
- `STD-022`: Critical standards shall be automation-ready by design.

### 2.3 Inheritance to registries

- `STD-030`: Control registries shall inherit from standards, not from ad hoc implementation notes.
- `STD-031`: Audit registries shall inherit from standards and control registries.
- `STD-032`: Root cause records shall point back to the same clause IDs.

