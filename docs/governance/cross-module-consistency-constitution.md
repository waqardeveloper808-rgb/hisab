# Cross-Module Consistency Constitution

## 1. Purpose
1.1 This constitution shall govern cross-module consistency across all business engines.
1.2 Consistency shall be mandatory across invoice, accounting, VAT, inventory, payments, journals, documents, and reports.

## 2. Required Linkages
2.1 Invoice shall link to accounting and VAT.
2.2 Inventory shall link to accounting and COGS.
2.3 Payments shall link to accounting and balances.
2.4 Reports shall link to journals and documents.

## 3. Failure Law
3.1 Any mismatch between governed modules shall be treated as noncompliance.
3.2 Silent inconsistency shall be forbidden.
3.3 Partial reconciliation shall not be accepted as completion.

## 4. Clause IDs
4.1 Stable clauses in this document use the prefix `XMOD-CON`.
4.2 Future control points and audits shall reference the exact clause IDs defined here.

## 5. Enforceable Clauses
- `XMOD-CON-001`: Invoice shall remain linked to accounting and VAT.
- `XMOD-CON-002`: Inventory shall remain linked to accounting and COGS.
- `XMOD-CON-003`: Payments shall remain linked to accounting and balances.
- `XMOD-CON-004`: Reports shall remain linked to journals and documents.
- `XMOD-CON-005`: Mismatch shall fail compliance.
- `XMOD-CON-006`: Silent inconsistency shall be forbidden.
