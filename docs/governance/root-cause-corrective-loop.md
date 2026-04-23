# Root Cause and Corrective Loop Law

Updated: 2026-04-23
Status: Mandatory nonconformity handling protocol.

## 1. Protocol Authority

### 1.1 Clause IDs

- `RCA-001`: Every nonconformity shall trigger root cause analysis.
- `RCA-002`: Every corrective action shall be linked to an exact file or service target.
- `RCA-003`: Every corrective action shall be tied to the exact broken rule.

## 2. Required Protocol

### 2.1 Detection

1. Detect nonconformity.
2. Record the failing control id.
3. Record the failed clause id.
4. Record the observed failure evidence.

### 2.2 Analysis

- `RCA-010`: Root cause analysis shall identify the exact reason for failure.
- `RCA-011`: Root cause analysis shall identify the exact file, service, route, or registry target.
- `RCA-012`: Root cause analysis shall identify regression risk.

### 2.3 Correction

- `RCA-020`: Fix planning shall define the exact corrective action.
- `RCA-021`: Corrective execution shall target the defined file or service only.
- `RCA-022`: Corrective execution shall not expand into unrelated redesign.

### 2.4 Retest

- `RCA-030`: Retest shall verify the exact broken rule.
- `RCA-031`: Retest shall record the exact evidence of the fix.
- `RCA-032`: Retest shall confirm whether the failure is closed or reopened.

## 3. Required Closure Fields

- `RCA-040`: Every corrective record shall include file or service target.
- `RCA-041`: Every corrective record shall include broken rule.
- `RCA-042`: Every corrective record shall include reason for failure.
- `RCA-043`: Every corrective record shall include evidence of fix.
- `RCA-044`: Every corrective record shall include regression risk note.
- `RCA-045`: Every corrective record shall include retest result.

## 4. Closure Rule

- `RCA-050`: No corrective action may close without retest evidence.
- `RCA-051`: If retest evidence fails, the item shall reopen.
- `RCA-052`: Closure by assertion alone is invalid.

