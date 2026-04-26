# System Monitor — count comparison (Core System group row)

| Source | Total | Pass | Fail | Partial | Blocked | Timestamp / ref | Notes |
|--------|------:|-----:|-----:|--------:|--------:|-------------------|--------|
| **A — Browser UI DOM** (Playwright, `[data-inspector-system-tree-card="core-system"]` metrics) | 203 | 18 | 162 | 23 | 0 | 2026-04-26 (see `browser-ui-dom-snapshot.json`) | String counts from buttons: Pass/Fail/Partial/Blocked; total from "Engine CP total (this row)" line |
| **B — Browser API** (`POST /api/system/monitor/refresh` → `data.groupScope` entry `id: "core-system"`) | 203 | 18 | 162 | 23 | 0 | `generatedAt`: 2026-04-26T10:27:13.664Z (see `browser-refresh-api-response.json`) | From live dev server on `127.0.0.1:3000` |
| **C — CLI engine** (`npx tsx` → `getFreshSystemMonitorState()` + `computeGroupSummary` for `core-system`) | 203 | 173 | 19 | 11 | 0 | `generatedAt`: 2026-04-26T10:28:04.993Z (see `cli-engine-output.json`) | Same function names as server code path; different **process** than the running Next server |
| **D — User copied list** (stated earlier) | 203 | 18 | 162 | 23 | 0 | (user) | **Matches A and B** in this run |

**Equality:** A = B = D. **C differs** on pass / fail / partial (total and blocked same).

**Screenshot file:** `browser-ui-core-system.png` (source A visual proof).
