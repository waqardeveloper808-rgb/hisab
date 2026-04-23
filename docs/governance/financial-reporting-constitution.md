# Financial Reporting Constitution

Updated: 2026-04-23
Status: Governing financial report truth and drill-down law.

## 1. Authority

### 1.1 Clause IDs

- `ACC-RPT-001`: Financial reporting shall reflect posted truth, not UI approximations.
- `ACC-RPT-002`: Every report shall have an owner engine and input truth source.
- `ACC-RPT-003`: Drill-down to source record or journal shall be possible where applicable.

### 1.2 Report obligations

- `ACC-RPT-010`: Trial balance shall expose imbalance if present.
- `ACC-RPT-011`: General ledger shall remain traceable to journals and source records.
- `ACC-RPT-012`: Profit and loss shall derive from posted accounting truth.
- `ACC-RPT-013`: Balance sheet shall derive from posted accounting truth.
- `ACC-RPT-014`: VAT summary shall derive from VAT truth and postings.
- `ACC-RPT-015`: VAT detail shall remain traceable to document and journal impact.
- `ACC-RPT-016`: Receivables aging shall reflect open balances after governed payment, note, and adjustment effects.
- `ACC-RPT-017`: Payables aging shall reflect open balances after governed payment and adjustment effects.
- `ACC-RPT-018`: Invoice register shall reflect posted document truth.
- `ACC-RPT-019`: Payment register shall reflect posted payment truth.
- `ACC-RPT-020`: Stock/accounting connected reporting shall remain linked where relevant.

### 1.3 Forbidden behaviors

- `ACC-RPT-030`: Reports shall not hide broken posting state.
- `ACC-RPT-031`: Missing posting shall surface explicitly.
- `ACC-RPT-032`: No report shall claim integrity when journal truth is incomplete.

### 1.4 Filter and reconciliation

- `ACC-RPT-040`: Filters shall not break traceability or alter truth.
- `ACC-RPT-041`: Report aggregation shall reconcile to ledger and journal source data.
- `ACC-RPT-042`: If reconciliation fails, the report shall expose the discrepancy rather than masking it.

