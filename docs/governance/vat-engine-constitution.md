# VAT Engine Constitution

Updated: 2026-04-23
Status: Governing VAT calculation, classification, and compliance law.

## 1. Authority

### 1.1 Clause IDs

- `VAT-CON-001`: The VAT engine shall own VAT calculation authority.
- `VAT-CON-002`: The VAT engine shall remain synchronized with the invoice engine and accounting engine.
- `VAT-CON-003`: The VAT engine shall produce traceable VAT outcomes at line and document level.

### 1.2 Calculation rules

- `VAT-CON-010`: VAT Received shall represent output VAT recognized on sales-side taxable events.
- `VAT-CON-011`: VAT Paid shall represent input VAT recognized on purchase-side taxable events.
- `VAT-CON-012`: VAT Payable shall equal VAT Received minus VAT Paid where the governed tax model requires that relationship.
- `VAT-CON-013`: Output and input VAT handling shall remain explicit and auditable.

### 1.3 Classification rules

- `VAT-CON-020`: Tax category resolution shall be governed and deterministic.
- `VAT-CON-021`: Customer origin alone shall not decide tax treatment.
- `VAT-CON-022`: Supply location logic shall be governed and shall influence classification where required.
- `VAT-CON-023`: Warning or override behavior shall be visible, justified, and auditable.

### 1.4 Compliance triggers

- `VAT-CON-030`: ZATCA applicability logic shall trigger compliance obligations where required.
- `VAT-CON-031`: QR or compliance trigger law shall be explicit and not implicit.
- `VAT-CON-032`: Future EU tax and e-invoicing extensibility shall remain supported by design.

### 1.5 Evidence

- `VAT-CON-040`: Any VAT-sensitive finalization shall carry evidence for classification, totals, and compliance gates.
- `VAT-CON-041`: VAT detail and summary reports shall remain traceable to source documents and journal impact.

