# Document Governance File Map

Updated: 2026-04-23
Status: Replacement and deprecation map for document-system governance sources.

## 1. Authoritative New Governance Set

- `docs/governance/document-engine-constitution.md`
- `docs/governance/invoice-system-constitution.md`
- `docs/governance/template-engine-constitution.md`
- `docs/governance/template-editor-constitution.md`
- `docs/governance/preview-engine-constitution.md`
- `docs/governance/pdf-generator-constitution.md`
- `docs/governance/document-lifecycle-constitution.md`
- `docs/governance/compliance-document-law.md`
- `docs/governance/document-control-point-seeds.md`
- `docs/governance/document-audit-protocol-seeds.md`

## 2. Replace Or Merge

- `docs/architecture-comparison-2026-04-17.md` -> merge as historical reference only for document/template notes
- `docs/governance/master-design-v2.md` -> retain for higher-level governance, not document-system primary truth
- `docs/governance/control-point-governance.md` -> retain for higher-level control law, not document-system specific truth
- `docs/governance/audit-engine-governance.md` -> retain for higher-level audit law, not document-system specific truth

## 3. Retain As Runtime Or Implementation Artifacts

- `lib/document-engine/index.tsx`
- `lib/document-engine/InvoiceTemplate.tsx`
- `lib/document-engine/contracts/taxInvoiceSaudiStandardContract.ts`
- `lib/document-engine/contracts/taxInvoiceAhnContract.ts`
- `lib/document-engine/mappers/mapInvoiceToSaudiStandard.ts`
- `lib/document-engine/mappers/mapInvoiceToAhnTemplate.ts`
- `lib/document-engine/renderers/renderTaxInvoiceSaudiStandard.ts`
- `lib/document-engine/renderers/renderTaxInvoiceAhn.ts`
- `lib/workspace-preview.ts`
- `lib/zatca-engine.ts`
- `app/workspace/invoices/new/page.tsx`
- `app/workspace/invoices/[documentId]/page.tsx`
- `app/workspace/invoices/[documentId]/pdf/route.ts`
- `components/workspace/InvoiceRegister.tsx`
- `components/workspace/InvoiceDetailWorkspace.tsx`
- `components/workspace/DocumentTemplatesRegister.tsx`
- `components/workspace/SettingsOverview.tsx`
- `backend/app/Support/Standards/document-engine-phase5-control-points.ts`
- `data/document-canonical-contract.json`
- `data/document-template-adapter.ts`

## 4. Deprecated As Primary Governance Truth

- legacy template freedom assumptions
- preview-only truth claims
- PDF-only divergence claims
- document UI logic as source of truth

## 5. Build Artifacts To Ignore

- `.next/`
- `node_modules/`
- `dist/`
- `build/`
- `coverage/`
- `artifacts/`
- `logs/`

## 6. Inheritance Rule

- `DOC-MAP-001`: Markdown governance documents are the source of truth.
- `DOC-MAP-002`: Runtime code and generated registries are derived artifacts.
- `DOC-MAP-003`: `.next` artifacts shall never be treated as source of truth.

