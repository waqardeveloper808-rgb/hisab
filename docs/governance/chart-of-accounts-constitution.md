# Chart of Accounts Constitution

Updated: 2026-04-23
Status: Governing chart-of-accounts structure and account discipline.

## 1. Structure

### 1.1 Clause IDs

- `ACC-COA-001`: The chart of accounts shall follow governed financial taxonomy.
- `ACC-COA-002`: The chart of accounts shall include assets, liabilities, equity, revenue, and expenses.
- `ACC-COA-003`: The chart of accounts shall preserve parent-child hierarchy rules.

### 1.2 Taxonomy rules

- `ACC-COA-010`: Asset accounts shall remain distinct from liability, equity, revenue, and expense accounts.
- `ACC-COA-011`: Contra accounts shall remain explicitly classified and shall not be hidden.
- `ACC-COA-012`: User-manageable accounts shall remain separate from system-protected accounts where governance requires it.

### 1.3 Code discipline

- `ACC-COA-020`: Account code discipline shall be stable, unique, and machine-auditable.
- `ACC-COA-021`: No hardcoded random account IDs shall be used in business logic.
- `ACC-COA-022`: No missing mapping for mandatory financial workflows shall be allowed.

### 1.4 Account rules

- `ACC-COA-030`: Disallowed account classes shall not accept postings.
- `ACC-COA-031`: Locked default accounts and protected categories shall not be deleted when they already have financial history.
- `ACC-COA-032`: Inactive accounts shall remain traceable and shall not be silently reused.
- `ACC-COA-033`: Contra-account rules shall preserve opposite balance orientation.

### 1.5 Mapping obligations

- `ACC-COA-040`: Documents, VAT, inventory, payroll, advances, bank, and reconciliation flows shall have explicit account mappings where relevant.
- `ACC-COA-041`: Missing mandatory mappings shall block posting.
- `ACC-COA-042`: Financial mappings shall remain governed by clause IDs and auditable records.

