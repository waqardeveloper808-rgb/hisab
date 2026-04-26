# System Monitor summary + interaction fix — validation report

## Automated tests (`npx vitest run lib/audit-engine/control-point-summary-engine.test.ts`)

- **Result:** PASS (6 tests)
- **Checks:**
  1. Global unique: `pass + fail + partial + blocked === total`
  2. Each main group (Core System, Finance Engines, Platform Layers): status sum equals group unique total
  3. Core System + fail filter: list length equals group fail count; all items are `status === "fail"` and linked to group modules
  4. Finance Engines + fail: same pattern
  5. Platform Layers + pass: list length equals group pass count; all `pass`
  6. Sub-category (module `accounting-engine`): summary sum equals module total; fail filter length equals module fail count

## Counting model (Design A)

- **Header:** Global unique totals via `computeGlobalSummary` / `computeSummary` over the full control point list (each CP id once).
- **Module map group rows:** Group unique totals via `computeGroupSummary` → `controlPointsForGroupUnique` + `computeSummary` (each CP at most once per group).
- **Module / dependency rows:** `computeSubCategorySummary` → `controlPointsForModuleId` (CP may appear under multiple modules; module counts can exceed global unique FAIL).
- **UI note:** Module map includes explicit copy that group totals are not additive to global total when CPs span groups.

## Interaction

- Main category rows: Health (non-pass), Pass, Fail, Partial, Blocked, All CPs are clickable (`MasterDesignTree`: metrics enabled for groups; `cursor-pointer` via button + hover styles).
- Filter state: `MonitorListFilter` (`groupId`, `moduleId`, `status`, `healthNonPass`) drives `filterControlPointsForMonitorList` for the right-hand list.
- Header metric buttons clear group/module scope; tree metrics set group or module scope consistently.
- Clear filters resets to empty filter (global list).
- Copy actions:
  - **Copy visible filtered list:** current `list` from active filter
  - **Copy all fails / partials:** `filterByStatus` on full `controlPoints` (global unique)
  - **Copy current scope (all statuses):** all CPs in selected group or module, ignoring status
  - **Copy full audit summary:** `generateAuditReport` with group/module rows derived from the same summary helpers in `reportContext`

## Screenshots

Captured with Playwright (`tools/capture-system-monitor-artifact-shots.ts`) against `http://127.0.0.1:3000/system/master-design`.

| File | Description |
|------|-------------|
| `before-system-monitor.png` | Initial load |
| `after-global-summary.png` | Scroll to header summary strip |
| `after-core-system-fail-click.png` | Core System group Fail metric |
| `after-finance-engines-fail-click.png` | Finance Engines group Fail metric |
| `after-platform-layers-pass-click.png` | Platform Layers group Pass metric |
| `after-subcategory-click-still-working.png` | Sub-row `identity-workspace` Fail metric |

## Root cause (pre-fix)

- Header FAIL was **global unique** count; group row FAIL was **group unique** count. Summing or comparing them without labeling implied one total, causing confusion.
- `MasterDesignTree` disabled metric buttons when `node.isGroup` (`isMetric` returned false), so main category counters were non-interactive and showed non-pointer disabled styling.
