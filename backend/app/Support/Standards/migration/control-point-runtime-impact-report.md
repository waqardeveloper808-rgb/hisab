# Control Point Runtime Impact Report

Runtime-critical files identified: 134
Direct legacy import files identified: 0
Files with old CP IDs in active code: 13
Dashboard files showing control point status: 5
Audit engine input files depending on old registries: 14

## Direct Legacy Runtime Imports
- None detected before rewiring.

## Runtime Files Carrying Old CP IDs
- backend/app/Http/Controllers/Api/JournalPostingController.php
- backend/app/Services/JournalPostingService.php
- backend/app/Support/Standards/control-points-master.ts
- backend/app/Support/Standards/v2/control-point-migration-map.json
- backend/app/Support/Standards/v2/control-points.v2.ts
- backend/bootstrap/app.php
- backend/tests/Feature/AccountingIntegrityEnforcementTest.php
- backend/tests/Feature/CoreAccountingValidationTest.php
- backend/tests/Feature/JournalPostingServiceTest.php
- backend/tests/Feature/Phase1ClosureWorkflowTest.php
- data/audit-runtime/control-point-runtime-results.json
- lib/control-point-audit-engine.ts
- lib/zatca-engine.test.ts

## Mapping Notes
- ACC: Legacy ACC already aligns directly to Accounting Control without prefix conflict.
- VAT: Legacy VAT maps to TAX because the target architecture reserves TAX for VAT and tax compliance controls.
- DOC: Legacy DOC maps to IVC because the current document controls are invoice and compliance document behaviors rather than a generic runtime document registry.
- INV: Legacy INV remains INV because Inventory and Invoice must not share prefixes and INV already denotes inventory.
- UIX: Legacy UIX maps to UX because the v2 primary module code is UX for user experience controls.
- FRM: Legacy FRM remains FRM as a controlled supporting module because the current surface is still forms-and-registers specific.
- TMP: Legacy TMP remains TMP as a supporting template engine module with distinct rendering responsibilities.
- VAL: Legacy VAL remains VAL as a supporting validation module for data and format rules.
- SEC: Legacy SEC remains SEC as a supporting security module while audit review governance is separated into AUD.
- BRD: Legacy BRD remains BRD as a supporting branding module with independent rendering requirements.
- XMD: Legacy XMD remains XMD as a supporting cross-module dependency module.
