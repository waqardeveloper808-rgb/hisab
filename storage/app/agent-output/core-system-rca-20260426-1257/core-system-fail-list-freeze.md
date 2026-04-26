# Core System — Fail list freeze

**Generated:** 2026-04-26T12:57 (local)  
**Project:** `C:\hisab`  
**Method:** `buildSystemMonitorControlPoints()` + `filterControlPointsForMonitorList` scoped to `groupId: "core-system"`, `status: "fail"` (same logic as System Monitor).  
**Group definition (canonical):** `MONITOR_GROUP_DEFS` in `lib/audit-engine/monitor-groups.ts` — modules: `identity-workspace`, `company-profile`, `contacts-counterparties`, `product-item-service`, `document-engine` (and CPs that **link** any of these in `linked_project_modules`).

## Data-source conflict (read before using this file)

| Metric | Stakeholder snapshot (this RCA request) | Reproducible in repo (this run) |
|--------|----------------------------------------|--------------------------------|
| Core System total | 203 | 203 (matches) |
| Pass | 18 | 173 |
| Fail | 162 | **19** |
| Partial | 23 | 11 |

**Conclusion:** The **203** group size aligns with the codebase. The pass/fail/partial **distribution does not**. This freeze contains the **19** `fail` rows the audit engine **actually evaluates today**, not 162. The 162 figure cannot be re-derived from the repository state without the exact “Copy visible filtered list” export from the UI session that produced it (or an alternate `control-point-runtime-results.json` / build).

If your monitor showed **18 + 162 + 23 = 203**, that arithmetic is internally consistent, but it **disagrees** with the committed evaluation pipeline output above—likely a different build, a different `results` payload, a UI aggregation bug, or a misread card (e.g. summed group rows vs unique list). **Re-paste the copied list** to replace this freeze for a 162-based RCA.

---

## Frozen items — all Core System `fail` (count = 19)

`Module` = pipe-joined `linked_project_modules` from the monitor DTO (same as “Copy” format).

| CP-ID | Status | Risk | Module | Title | Timestamp |
|-------|--------|------|--------|-------|------------|
| CP-01 | fail | critical | document-engine\|accounting-engine\|reports-engine\|workspace-ui | Journal impact filtering | 2026-04-26T09:57:23.346Z |
| CP-03 | fail | critical | document-engine\|accounting-engine\|reports-engine\|workspace-ui | Trial balance impact delta mode | 2026-04-26T09:57:23.346Z |
| CP-19 | fail | critical | document-engine\|accounting-engine\|reports-engine\|workspace-ui | Multi-invoice accounting consistency | 2026-04-26T09:57:23.346Z |
| CP-ACC-001 | fail | critical | accounting-engine\|document-engine\|inventory-engine\|reports-engine | Accounting Engine processing contract | 2026-04-26T09:57:23.346Z |
| CP-ACC-003 | fail | critical | accounting-engine\|document-engine\|inventory-engine\|reports-engine | Entries must balance | 2026-04-26T09:57:23.346Z |
| CP-ACC-007 | fail | critical | accounting-engine\|document-engine\|inventory-engine\|tax-vat-engine\|reports-engine | Accounting Engine feature - journal posting | 2026-04-26T09:57:23.346Z |
| CP-ACC-008 | fail | critical | accounting-engine\|document-engine\|inventory-engine\|tax-vat-engine\|reports-engine | Accounting Engine feature - opening balances | 2026-04-26T09:57:23.346Z |
| CP-ACC-010 | fail | critical | accounting-engine\|proof-layer\|document-engine\|inventory-engine\|tax-vat-engine\|reports-engine | Accounting Engine proof expectation - documents and inventory create traceable journal impacts | 2026-04-26T09:57:23.346Z |
| CP-ACC-012 | fail | critical | accounting-engine\|ui-ux-shell\|document-engine\|inventory-engine\|tax-vat-engine\|reports-engine | Accounting Engine UI expectation - journal and ledger drill-down | 2026-04-26T09:57:23.346Z |
| CP-INV-001 | fail | critical | inventory-engine\|document-engine\|accounting-engine | Inventory Engine processing contract | 2026-04-26T09:57:23.346Z |
| CP-INV-002 | fail | critical | inventory-engine\|document-engine\|accounting-engine | Inventory transactions must retain reference, journal entry number, and source linkage | 2026-04-26T09:57:23.346Z |
| CP-TMP-001 | fail | critical | template-engine\|document-engine\|company-profile | Template Engine feature - template CRUD | 2026-04-26T09:57:23.346Z |
| CP-TMP-002 | fail | critical | template-engine\|document-engine\|company-profile | Template Engine feature - section order | 2026-04-26T09:57:23.346Z |
| CP-TMP-003 | fail | critical | template-engine\|document-engine\|company-profile | Template Engine feature - asset assignment | 2026-04-26T09:57:23.346Z |
| CP-TMP-004 | fail | critical | template-engine\|document-engine\|company-profile | Template Engine feature - preview parity | 2026-04-26T09:57:23.346Z |
| CP-TMP-005 | fail | critical | template-engine\|proof-layer\|document-engine\|company-profile | Template Engine proof expectation - template changes affect live document output | 2026-04-26T09:57:23.346Z |
| CP-TMP-006 | fail | critical | template-engine\|ui-ux-shell\|document-engine\|company-profile | Template Engine UI expectation - dedicated template dashboard | 2026-04-26T09:57:23.346Z |
| CP-TMP-007 | fail | critical | template-engine\|ui-ux-shell\|document-engine\|company-profile | Template Engine UI expectation - real editing canvas | 2026-04-26T09:57:23.346Z |
| CP-TMP-008 | fail | critical | template-engine\|ui-ux-shell\|document-engine\|company-profile | Template Engine UI expectation - no fake family diversity | 2026-04-26T09:57:23.346Z |

**Evidence command (re-verification):**

```bash
cd C:\hisab && npx tsx -e "import { buildSystemMonitorControlPoints } from './lib/audit-engine/build-monitor-points'; import { filterControlPointsForMonitorList } from './lib/audit-engine/control-point-summary-engine'; import { monitorGroupModuleIds } from './lib/audit-engine/monitor-groups'; const cps = buildSystemMonitorControlPoints(); const f = filterControlPointsForMonitorList(cps, { status: 'fail', moduleId: null, groupId: 'core-system', healthNonPass: false, listAggregation: null }, monitorGroupModuleIds); console.log('count', f.length);"
```

Expected printed count: **19**.
