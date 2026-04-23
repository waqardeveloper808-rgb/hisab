# Product / Item Constitution

Updated: 2026-04-23
Status: Governing item model law for inventory and stock behavior.

## 1. Item Authority

### 1.1 Clause IDs

- `INV-ITEM-001`: The item model shall support governed item types.
- `INV-ITEM-002`: The item model shall distinguish stock-tracked and non-stock items.
- `INV-ITEM-003`: The item model shall remain traceable to inventory and accounting rules where relevant.

### 1.2 Item types

- `INV-ITEM-010`: Supported item types shall include product, service, inventory item, and non-inventory item.
- `INV-ITEM-011`: Product and inventory item categories shall support stock tracking where configured.
- `INV-ITEM-012`: Service and non-inventory items shall not be forced into stock tracking without governed reason.

### 1.3 Required fields

- `INV-ITEM-020`: Required item fields shall include cost, selling price, VAT category, and unit.
- `INV-ITEM-021`: Missing cost on stock-sensitive items shall block governed sale or movement behavior where required.
- `INV-ITEM-022`: Item truth shall remain consistent across document, stock, and accounting flows.

