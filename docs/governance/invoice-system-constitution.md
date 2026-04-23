# Invoice System Constitution

Updated: 2026-04-23
Status: Governing invoice layout and invoice truth law.

## 1. Invoice Authority

### 1.1 Clause IDs

- `INV-001`: The invoice system shall produce governed invoice output only.
- `INV-002`: Invoice layout shall follow a mandatory section order.
- `INV-003`: Invoice sections shall not shift randomly across render targets.

### 1.2 Mandatory order

1. Header
1.1 Logo and seller information.
2. Title
2.1 Tax Invoice.
3. Invoice Information box
3.1 Required invoice metadata.
4. Delivery Information
4.1 Present only when the source record includes delivery data.
5. Customer Information
5.1 Buyer identity and billing context.
6. Items Table
6.1 Line items and governed line totals.
7. Totals Section
7.1 Subtotal, VAT, and total.
8. Footer
8.1 Compliance, legal, or controlled footer content only.

### 1.3 Layout controls

- `INV-010`: No empty section shall be rendered.
- `INV-011`: No misplaced field shall be accepted.
- `INV-012`: No random layout shift shall be allowed.
- `INV-013`: The visible order shall match the governed invoice order exactly.

### 1.4 Expected behavior

- `INV-020`: The invoice system shall hide absent sections rather than leaving blank placeholders.
- `INV-021`: The invoice system shall keep invoice metadata in the governed information box.
- `INV-022`: The invoice system shall preserve bilingual invoice meaning where required by the compliance layer.

