# Inventory Governance File Map

Updated: 2026-04-23
Status: Replacement and deprecation map for inventory-system governance sources.

## 1. Authoritative New Governance Set

- `docs/governance/inventory-engine-constitution.md`
- `docs/governance/product-item-constitution.md`
- `docs/governance/stock-movement-constitution.md`
- `docs/governance/stock-valuation-constitution.md`
- `docs/governance/cogs-engine-constitution.md`
- `docs/governance/inventory-accounting-integration.md`
- `docs/governance/inventory-control-point-seeds.md`
- `docs/governance/inventory-audit-protocol-seeds.md`

## 2. Replace Or Merge

- `backend/app/Support/Standards/control-points-master.md` -> merge as legacy source material only
- `backend/app/Support/Standards/control-points-master.ts` -> merge as legacy source material only
- `backend/app/Support/Standards/control-points-canonical-review.md` -> merge as audit-history reference only
- `backend/app/Support/Standards/v2/control-points.v2.ts` -> retain as runtime/registry derivative
- `backend/app/Support/Standards/v2/control-point-governance.ts` -> retain as runtime/registry derivative
- `backend/app/Support/Standards/control-point-registry.ts` -> retain as runtime/registry derivative
- `backend/app/Support/Standards/document-engine-phase5-control-points.ts` -> retain as cross-domain derivative

## 3. Retain As Runtime Or Implementation Artifacts

- `lib/accounting-engine.ts`
- `lib/workspace-preview.ts`
- `backend/app/Services/InventoryService.php`
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
- `app/workspace/user/products/page.tsx`
- `app/workspace/user/items/page.tsx`
- `app/workspace/user/stock/page.tsx`
- `app/workspace/user/inventory-adjustments/page.tsx`
- `app/workspace/user/finished-materials/page.tsx`
- `app/workspace/user/raw-materials/page.tsx`
- `app/workspace/user/sold-materials/page.tsx`
- `app/workspace/user/consumables/page.tsx`
- `components/workspace/ProductsServicesRegister.tsx`
- `components/workspace/StockRegister.tsx`
- `components/workspace/InventoryAdjustmentsRegister.tsx`
- `components/workspace/BooksOverview.tsx`
- `components/workspace/InvoiceDetailWorkspace.tsx`
- `components/workflow/TransactionForm.tsx`

## 4. Deprecated As Primary Governance Truth

- manual stock editing assumptions
- stock changes without movement assumptions
- missing cost on sale assumptions
- stock/accounting mismatch acceptance
- hidden adjustments

## 5. Build Artifacts To Ignore

- `.next/`
- `node_modules/`
- `dist/`
- `build/`
- `coverage/`
- `artifacts/`
- `logs/`

## 6. Inheritance Rule

- `INV-MAP-001`: Markdown governance documents are the source of truth.
- `INV-MAP-002`: Runtime code and generated registries are derived artifacts.
- `INV-MAP-003`: `.next` artifacts shall never be treated as source of truth.

