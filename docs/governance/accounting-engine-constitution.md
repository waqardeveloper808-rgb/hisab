# Accounting Engine Constitution

Updated: 2026-04-23
Status: Supreme financial truth constitution for accounting behavior.

## 1. Authority

### 1.1 Clause IDs

- `ACC-CON-001`: The accounting engine shall be the authoritative owner of financial truth.
- `ACC-CON-002`: The accounting engine shall own accounts, journal entries, journal lines, opening balances, posting metadata, and account balances.
- `ACC-CON-003`: The accounting engine shall not accept UI-driven accounting truth.

### 1.2 Boundaries

- `ACC-CON-010`: The accounting engine shall own double-entry, posting integrity, and financial state consistency.
- `ACC-CON-011`: The accounting engine shall not be replaced by report-only assumptions or preview-only state.
- `ACC-CON-012`: The accounting engine shall cooperate with document, payment, inventory, VAT, and reporting engines without surrendering financial authority.

### 1.3 Forbidden behavior

- `ACC-CON-020`: No single-entry behavior shall be accepted for business-critical financial events.
- `ACC-CON-021`: No silent financial state mutation shall be allowed.
- `ACC-CON-022`: No fake accounting truth surfaced only in UI or reports shall be considered valid.
- `ACC-CON-023`: No bypass path around journal generation shall be allowed for governed financial events.

## 2. Posting Authority

- `ACC-CON-030`: Posting authority shall require governed validation of source event, account mapping, and journal balance.
- `ACC-CON-031`: Posting shall be blocked when required accounts, journal data, or compliance conditions are missing.
- `ACC-CON-032`: Posted accounting truth shall become immutable except through governed reversal or adjustment paths.

## 3. Traceability

- `ACC-CON-040`: Every posted financial event shall remain traceable from source business event to journal entry and journal lines.
- `ACC-CON-041`: Every posted transaction shall carry evidence sufficient to reconstruct the accounting effect.
- `ACC-CON-042`: No posted financial event shall lose source type or source id lineage.

## 4. Engine Relationships

- `ACC-CON-050`: Document engine events shall post through the accounting engine.
- `ACC-CON-051`: Payment engine events shall post through the accounting engine.
- `ACC-CON-052`: Inventory engine events shall post through the accounting engine when a financial effect exists.
- `ACC-CON-053`: VAT engine outputs shall synchronize with accounting postings.
- `ACC-CON-054`: Reporting engine shall reflect posted truth and not redefine it.

