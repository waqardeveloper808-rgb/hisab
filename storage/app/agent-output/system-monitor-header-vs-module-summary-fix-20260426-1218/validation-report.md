# System Monitor — header vs module map summary (dual summaries)

## TASK — Count sources

| Location | Role |
|----------|------|
| `lib/audit-engine/control-point-summary-engine.ts` — `computeGlobalSummary` | Global unique header counts (deduplicated). |
| `components/system-monitor/SystemMonitor.tsx` — `buildTreeNodes` + `computeGroupSummary` | Main group row counts on the Module Map. |
| `sumVisibleModuleMapSummaryFromDisplayedGroupRows(treeNodes)` | Visible Module Map header row = **sum** of the three displayed main group cards (intentional double-count across groups). |

## Why global FAIL ≠ Core FAIL + Finance FAIL + Platform FAIL (as unique CPs)

Each main group row counts control points **unique within that group**. The same failing CP can appear in more than one group row. Summing those row FAIL counts **counts that CP once per group**, so the sum can exceed **global unique** FAIL (each CP once in the whole system).

## Live proof (current workspace data, `buildSystemMonitorControlPoints` at capture time)

From `npx tsx` evaluation on 2026-04-26:

- **Global unique FAIL:** 20  
- **Core System FAIL:** 19  
- **Finance Engines FAIL:** 12  
- **Platform Layers FAIL:** 10  
- **Visible Module Map FAIL sum (19+12+10):** **41**  

Checks:

1. Global: `pass + fail + partial + blocked === total` (see `computeGlobalSummary` test).  
2. Visible row: `sumVisibleModuleMapSummaryFromDisplayedGroupRows` uses the same `passCount` / `failCount` / … as the three top-level tree nodes — FAIL sum equals Core + Finance + Platform FAIL **as displayed**.

## Automated tests

`npx vitest run lib/audit-engine/control-point-summary-engine.test.ts` — **8 passed** (includes visible sum + deduplicated visible-map list behavior).

## Screenshots

| File | Purpose |
|------|---------|
| `before-summary-confusion.png` | Full page baseline |
| `after-two-summary-sections.png` | Header scrolled to both summary strips |
| `after-visible-module-map-fail-click.png` | Visible Module Map Fail + panel title / note |
| `after-global-fail-click.png` | Global Fail + panel |

## Interaction

- **Global** row: filters full list (unique CPs worldwide) by status; Total clears to `EMPTY_FILTER`.  
- **Visible Module Map** row: `listAggregation: "visible-module-map"`; list = deduplicated union of CPs in any main group, filtered by status; panel shows summed card total vs `list.length` (Option B labeling).
