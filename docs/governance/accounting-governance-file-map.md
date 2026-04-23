# Accounting Governance File Map

Updated: 2026-04-23
Status: Replacement and deprecation map for accounting-system governance sources.

## 1. Authoritative New Governance Set

- `docs/governance/accounting-engine-constitution.md`
- `docs/governance/chart-of-accounts-constitution.md`
- `docs/governance/journal-engine-constitution.md`
- `docs/governance/transaction-posting-constitution.md`
- `docs/governance/vat-engine-constitution.md`
- `docs/governance/financial-reporting-constitution.md`
- `docs/governance/accounting-vat-control-point-seeds.md`
- `docs/governance/accounting-vat-audit-protocol-seeds.md`

## 2. Replace Or Merge

- `backend/app/Support/Standards/control-points-master.md` -> merge as legacy source material only
- `backend/app/Support/Standards/control-points-master.ts` -> merge as legacy source material only
- `backend/app/Support/Standards/control-points-canonical-review.md` -> merge as audit-history reference only
- `backend/app/Support/Standards/v2/control-points.v2.ts` -> retain as runtime/registry derivative
- `backend/app/Support/Standards/v2/control-point-governance.ts` -> retain as runtime/registry derivative
- `backend/app/Support/Standards/control-point-registry.ts` -> retain as runtime/registry derivative
- `backend/app/Support/Standards/document-engine-phase5-control-points.ts` -> retain as document/financial cross-domain derivative

## 3. Retain As Runtime Or Implementation Artifacts

- `lib/accounting-engine.ts`
- `lib/report-analytics.ts`
- `lib/control-point-audit-engine.ts`
- `backend/app/Support/Audit/accounting-logical-audit-engine.ts`
- `backend/app/Support/Standards/control-point-validation.ts`
- `backend/app/Support/Standards/control-point-summary.ts`
- `backend/app/Support/Standards/control-point-mapping.ts`
- `backend/app/Support/Standards/control-point-execution.ts`
- `backend/app/Support/Standards/control-point-engine.ts`
- `backend/app/Support/Standards/control-point-engine-validation.ts`
- `backend/app/Support/Standards/control-point-engine-runtime.ts`
- `backend/app/Support/Standards/control-point-engine-rules.md`
- `backend/app/Support/Standards/control-point-engine-registry.ts`
- `backend/app/Support/Standards/control-point-engine-control-points.ts`
- `backend/app/Support/Standards/control-point-categories.ts`
- `app/workspace/user/chart-of-accounts/page.tsx`
- `app/workspace/user/journal-entries/page.tsx`
- `app/workspace/user/ledger/page.tsx`
- `app/workspace/user/reports/trial-balance/page.tsx`
- `app/workspace/user/reports/balance-sheet/page.tsx`
- `app/workspace/user/reports/profit-loss/page.tsx`
- `app/workspace/user/reports/vat-summary/page.tsx`
- `app/workspace/user/reports/receivables-aging/page.tsx`
- `app/workspace/user/reports/payables-aging/page.tsx`
- `app/workspace/accounting/page.tsx`
- `app/workspace/accounting/books/page.tsx`
- `components/workspace/AccountingOverview.tsx`
- `components/workspace/AccountingReportPage.tsx`
- `components/workspace/BooksOverview.tsx`
- `components/workspace/ChartOfAccountsRegister.tsx`
- `components/workspace/JournalEntriesRegister.tsx`
- `components/workspace/ReportsOverview.tsx`
- `components/workspace/PaymentsRegister.tsx`
- `components/workspace/OpeningBalancesPage.tsx`
- `components/workspace/VatOverview.tsx`
- `components/workspace/InvoiceDetailWorkspace.tsx`
- `components/workflow/TransactionForm.tsx`

## 4. Deprecated As Primary Governance Truth

- legacy chart-of-accounts assumptions without hierarchy
- journal edit-after-post assumptions
- report-only accounting truth
- VAT behavior not tied to postings

## 5. Build Artifacts To Ignore

- `.next/`
- `node_modules/`
- `dist/`
- `build/`
- `coverage/`
- `artifacts/`
- `logs/`

## 6. Inheritance Rule

- `ACC-MAP-001`: Markdown governance documents are the source of truth.
- `ACC-MAP-002`: Runtime code and generated registries are derived artifacts.
- `ACC-MAP-003`: `.next` artifacts shall never be treated as source of truth.

