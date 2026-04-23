# Control Point Migration Plan

## Canonical Mapping Decisions
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

## First Safe V2 Migration Batch
- ACC-007 -> CP-ACC-001 (IFRS 15 Revenue from Contracts with Customers; IFRS 15 Step 1 - Identify the contract with a customer)
- ACC-008 -> CP-ACC-002 (IFRS 15 Revenue from Contracts with Customers; IFRS 15 Step 2 - Identify performance obligations)
- ACC-009 -> CP-ACC-003 (IFRS 15 Revenue from Contracts with Customers; IFRS 15 Step 3 - Determine the transaction price)
- ACC-010 -> CP-ACC-004 (IFRS 15 Revenue from Contracts with Customers; IFRS 15 Step 4 - Allocate the transaction price)
- ACC-011 -> CP-ACC-005 (IFRS 15 Revenue from Contracts with Customers; IFRS 15 Step 5 - Recognize revenue when control transfers)
- VAT-010 -> CP-TAX-001 (ZATCA Electronic Invoice XML Implementation Standard; KSA e-invoicing XML generation requirement)
- VAT-011 -> CP-TAX-002 (ZATCA Electronic Invoice XML Implementation Standard; PDF/A-3 hybrid invoice container requirement)
- VAT-012 -> CP-TAX-003 (ZATCA Electronic Invoice XML Implementation Standard; Invoice hash generation requirement)
- VAT-013 -> CP-TAX-004 (ZATCA Electronic Invoice XML Implementation Standard; Electronic signature metadata requirement)
- VAT-014 -> CP-TAX-005 (ZATCA Electronic Invoice XML Implementation Standard; QR TLV Tag 1 - Seller Name)
- VAT-015 -> CP-TAX-006 (ZATCA Electronic Invoice XML Implementation Standard; QR TLV Tag 2 - VAT Number)
- VAT-016 -> CP-TAX-007 (ZATCA Electronic Invoice XML Implementation Standard; QR TLV Tag 3 - Invoice Timestamp)
- VAT-017 -> CP-TAX-008 (ZATCA Electronic Invoice XML Implementation Standard; QR TLV Tag 4 - Invoice Total)
- VAT-018 -> CP-TAX-009 (ZATCA Electronic Invoice XML Implementation Standard; QR TLV Tag 5 - VAT Total)
- VAT-019 -> CP-TAX-010 (ZATCA Electronic Invoice XML Implementation Standard; QR TLV Tag 6 - XML Hash)
- VAT-020 -> CP-TAX-011 (ZATCA Electronic Invoice XML Implementation Standard; QR TLV Tag 7 - ECDSA Signature)
- VAT-021 -> CP-TAX-012 (ZATCA Electronic Invoice XML Implementation Standard; QR TLV Tag 8 - Public Key)
- VAT-022 -> CP-TAX-013 (ZATCA Electronic Invoice XML Implementation Standard; QR TLV Tag 9 - Cryptographic Stamp)
- VAT-023 -> CP-TAX-014 (EN 16931 Electronic invoicing - Semantic data model of the core elements of an electronic invoice; EN 16931 semantic data model mapping)
- DOC-001 -> CP-IVC-001 (EN 16931 Electronic invoicing - Semantic data model of the core elements of an electronic invoice; Core invoice data must exist in structured form)
- DOC-003 -> CP-IVC-002 (PDF/A-3 for archival packaging of hybrid invoices; Hybrid invoice archive container requirement)
- DOC-004 -> CP-IVC-003 (PDF/A-3 for archival packaging of hybrid invoices; Embedded machine-readable payload retrievability)
- DOC-012 -> CP-IVC-004 (EN 16931 Electronic invoicing - Semantic data model of the core elements of an electronic invoice; Structured and visual invoice values must remain consistent)
- INV-005 -> CP-INV-001 (IAS 2 Inventories; IAS 2 cost formulas - FIFO support)
- INV-006 -> CP-INV-002 (IAS 2 Inventories; IAS 2 recognition of inventory carrying amount as expense)

## Deferred Modules
- AUD, USR, ADM, AST, ACP remain registry-defined but are not populated in this safe first batch because the uploaded standards documents were unavailable in the workspace.
- Supporting modules outside the safe batch remain mapped in the migration map and module coverage outputs.
