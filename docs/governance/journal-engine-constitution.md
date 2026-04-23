# Journal Engine Constitution

Updated: 2026-04-23
Status: Governing journal structure, immutability, and correction law.

## 1. Journal Authority

### 1.1 Clause IDs

- `ACC-JRN-001`: Every journal entry shall be structurally governed.
- `ACC-JRN-002`: Every journal line shall preserve posting reference and traceability metadata.
- `ACC-JRN-003`: Every posted journal shall remain explainable.

### 1.2 Structure

- `ACC-JRN-010`: Journal entry structure shall include entry identity, posting date, reference, source linkage, status, and line collection.
- `ACC-JRN-011`: Journal line structure shall include account, debit, credit, and traceability metadata.
- `ACC-JRN-012`: Compound entries shall be supported and shall remain one governed transaction.

### 1.3 Balancing

- `ACC-JRN-020`: Balanced-entry enforcement shall be mandatory.
- `ACC-JRN-021`: A journal shall not post if debits and credits do not balance.
- `ACC-JRN-022`: Posting date and period integrity shall be preserved.

### 1.4 Immutability and correction

- `ACC-JRN-030`: Journals shall be immutable after final post.
- `ACC-JRN-031`: Journal edit after posting shall be forbidden except through governed corrective paths.
- `ACC-JRN-032`: Reversal shall preserve lineage to the original entry.
- `ACC-JRN-033`: Adjustment shall preserve audit trail and correction reason.

### 1.5 Audit trail

- `ACC-JRN-040`: Every journal event shall retain audit trail data.
- `ACC-JRN-041`: Every reversal and adjustment shall remain retraceable to its source and target.
- `ACC-JRN-042`: No destructive editing path shall be accepted.

