# Core System — 162 unique fail freeze

**Status:** **BLOCKED / NOT PRODUCED** — a list of **exactly 162** unique failed CP-IDs for Core System **cannot** be generated from the **live `getFreshSystemMonitorState` pipeline in this working tree**; that pipeline yields **19** unique `fail` for the Core System group (unique-by-group, same rule as the UI’s `computeGroupSummary` for the group row).

**Required for a valid 162-row freeze (operational, not in IDE):**
1. In the **same** deployment as the 162 monitor, use System Monitor: **Core System → Fail → Copy visible filtered list**, or
2. Capture the JSON body of `POST /api/system/monitor/refresh` and extract CPs with `status: "fail"` in Core System’s unique set (same filter the UI would apply to the main group row).

**Do not** pad this file to 162 with guessed IDs.

---

## Appendix A — `buildSystemMonitorControlPoints` (same chain as `getFreshSystemMonitorState`) — 19 unique Core System `fail`

Source run: 2026-04-26 (machine-local `npx tsx` calling `buildSystemMonitorControlPoints` + `filterControlPointsForMonitorList` with `groupId: "core-system"`, `status: "fail"`). Timestamps are per-run; refresh to regenerate.

`Core subcats` = intersection of `linked_project_modules` with the five Core System `moduleId`s: `identity-workspace`, `company-profile`, `contacts-counterparties`, `product-item-service`, `document-engine`.

| CP-ID | Status | Risk | linked_project_modules | Title | Timestamp | Core subcats (appearances) |
|-------|--------|------|------------------------|-------|-----------|----------------------------|
| CP-01 | fail | critical | document-engine, accounting-engine, reports-engine, workspace-ui | Journal impact filtering | 2026-04-26T10:06:03.790Z | document-engine |
| CP-03 | fail | critical | (same) | Trial balance impact delta mode | 2026-04-26T10:06:03.790Z | document-engine |
| CP-19 | fail | critical | (same) | Multi-invoice accounting consistency | 2026-04-26T10:06:03.790Z | document-engine |
| CP-ACC-001 | fail | critical | accounting-engine, document-engine, inventory-engine, reports-engine | Accounting Engine processing contract | 2026-04-26T10:06:03.790Z | document-engine |
| CP-ACC-003 | fail | critical | (same) | Entries must balance | 2026-04-26T10:06:03.790Z | document-engine |
| CP-ACC-007 | fail | critical | + tax-vat-engine | Accounting Engine feature - journal posting | 2026-04-26T10:06:03.790Z | document-engine |
| CP-ACC-008 | fail | critical | (same) | Accounting Engine feature - opening balances | 2026-04-26T10:06:03.790Z | document-engine |
| CP-ACC-010 | fail | critical | + proof-layer | Accounting Engine proof expectation - documents and inventory create traceable journal impacts | 2026-04-26T10:06:03.790Z | document-engine |
| CP-ACC-012 | fail | critical | + ui-ux-shell | Accounting Engine UI expectation - journal and ledger drill-down | 2026-04-26T10:06:03.790Z | document-engine |
| CP-INV-001 | fail | critical | inventory-engine, document-engine, accounting-engine | Inventory Engine processing contract | 2026-04-26T10:06:03.790Z | document-engine |
| CP-INV-002 | fail | critical | (same) | Inventory transactions must retain reference, journal entry number, and source linkage | 2026-04-26T10:06:03.790Z | document-engine |
| CP-TMP-001 | fail | critical | template-engine, document-engine, company-profile | Template Engine feature - template CRUD | 2026-04-26T10:06:03.790Z | document-engine, company-profile |
| CP-TMP-002 | fail | critical | (same) | Template Engine feature - section order | 2026-04-26T10:06:03.790Z | document-engine, company-profile |
| CP-TMP-003 | fail | critical | (same) | Template Engine feature - asset assignment | 2026-04-26T10:06:03.790Z | document-engine, company-profile |
| CP-TMP-004 | fail | critical | (same) | Template Engine feature - preview parity | 2026-04-26T10:06:03.790Z | document-engine, company-profile |
| CP-TMP-005 | fail | critical | + proof-layer | Template Engine proof expectation - template changes affect live document output | 2026-04-26T10:06:03.790Z | document-engine, company-profile |
| CP-TMP-006 | fail | critical | + ui-ux-shell | Template Engine UI expectation - dedicated template dashboard | 2026-04-26T10:06:03.790Z | document-engine, company-profile |
| CP-TMP-007 | fail | critical | (same) | Template Engine UI expectation - real editing canvas | 2026-04-26T10:06:03.790Z | document-engine, company-profile |
| CP-TMP-008 | fail | critical | (same) | Template Engine UI expectation - no fake family diversity | 2026-04-26T10:06:03.790Z | document-engine, company-profile |

**Count check:** 19 unique IDs — **not** 162. **Task validation:** **FAIL** on the “exactly 162” requirement.

---

## Linked subcategory note

Core System’s five `moduleId` keys in `lib/audit-engine/monitor-groups.ts` are: `identity-workspace`, `company-profile`, `contacts-counterparties`, `product-item-service`, `document-engine`. A CP is listed under a subcategory if its `linked_project_modules` **includes** that id. The 19 fails are concentrated where those links and evaluators line up; **subcategory** row counts in **this** tree **do not** match the stakeholder’s 78/24/8/1/87 pattern (see `validation-report.md`).
