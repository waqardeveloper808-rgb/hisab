# System Monitor — Summary copy / group-row list fix

## TASK 1 — Audit (before fix)

| Item | Detail |
|------|--------|
| **File** | `components/system-monitor/SystemMonitor.tsx` |
| **Copy all fails** | `onClick` called `formatVisibleList(filterByStatus(controlPoints, "fail"))` — **global unique** fail list. |
| **Summary > Fail** | Set `listAggregation: "visible-module-map"` and filtered with `controlPointsUnionVisibleMainGroups` + status → **deduplicated** union → count **178** (example), not **377** summed group fails. |
| **Why mismatch** | Summary Fail card = sum of per-group unique fail counts (double-count across groups). List used union dedupe, so `Matching` and copy both tracked unique CPs, not group-row cardinality. |

## After fix

- `listAggregation: "visible-module-map-group-results"` with `expandVisibleMainGroupsGroupRowResults` builds one row per CP **per main group** (Core / Finance / Platform), filtered by status / health.
- Right panel shows **GROUP:** headers; `Matching group-row results` = **377**; `Unique control points` = deduped id count (e.g. **178**).
- **Copy all fails** / **Copy all partials** use `formatSummaryGroupRowsForCopy` → `GROUP: …` blocks and `CP-ID | Status | Risk | Module | Title | Timestamp` lines; **377** data lines for current dataset.
- **Copy Full Audit Summary** prepends `SUMMARY (main module map — …)` with summed totals via `visibleSummaryMainMap` on `AuditReportContext`.

## Automated test

`npx vitest run lib/audit-engine/control-point-summary-engine.test.ts` — PASS (8 tests).

## Artifacts

- `before-copy-all-fails-global-178.png` — page before Summary Fail click (baseline).
- `after-summary-fail-click-377.png` — Summary Fail active; chip shows group-row + unique counts.
- `after-copy-all-fails-377.txt` — export from `formatSummaryGroupRowsForCopy(expand…, fail)`; footer comment lists group-row line count.
