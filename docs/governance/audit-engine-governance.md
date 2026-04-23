# Audit Engine Governance

Updated: 2026-04-23
Status: Mandatory audit enforcement law.

## 1. Audit Engine Authority

### 1.1 Clause IDs

- `AUD-001`: The audit engine shall read Master Design clauses.
- `AUD-002`: The audit engine shall load mapped control points.
- `AUD-003`: The audit engine shall inspect actual production behavior or generated evidence.

### 1.2 Audit sequence

1. Read governing clauses.
2. Load mapped control points.
3. Inspect actual production behavior or output.
4. Compare expected versus actual.
5. Classify compliance status.
6. Emit evidence.
7. Perform structured root cause analysis.
8. Assign corrective action target.
9. Rerun loop validation.
10. Close only on verified compliance.

## 2. Status Rules

### 2.1 Permitted outcomes

- `AUD-010`: Audit results shall use explicit structured statuses.
- `AUD-011`: Audit results shall include pass, fail, partial, or blocked where applicable.
- `AUD-012`: Audit results shall not collapse nonconformity into a vague success statement.

### 2.2 Forbidden language

- `AUD-020`: The audit engine shall not emit "looks good".
- `AUD-021`: The audit engine shall not emit "partial success" as closure language.
- `AUD-022`: The audit engine shall not emit "maybe fixed".
- `AUD-023`: The audit engine shall not emit "should work now" as a completion claim.

### 2.3 Evidence requirements

- `AUD-030`: Every audit result shall expose evidence links or evidence data.
- `AUD-031`: A pass without evidence shall be invalid.
- `AUD-032`: A failure without root cause detail shall be incomplete.

## 3. Closure Rules

- `AUD-040`: Audit closure shall occur only after retest evidence confirms compliance.
- `AUD-041`: Audit closure shall be blocked if the retest was not run.
- `AUD-042`: Audit closure shall reopen if the retest fails or evidence is insufficient.

