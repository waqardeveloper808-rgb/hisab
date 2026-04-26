# UI truth vs “19” — comparison (and correction of the “helper” label)

## What produced “19”

| Mechanism | Path | Same as System Monitor? |
|------------|------|---------------------------|
| Prior `npx tsx -e` script | Imported `buildSystemMonitorControlPoints` and/or `filterControlPointsForMonitorList` with `groupId: "core-system"`, `status: "fail"` | **Logically** yes — same `controlPoints` array shape |
| **Authoritative in-app path** | `getFreshSystemMonitorState()` in `backend/app/Support/Standards/control-point-engine.ts` which calls `buildSystemMonitorControlPoints` | **This is the live chain** the page and refresh API use |

The “19” result is **not** from a separate “detached” engine. It is the **count produced by the committed evaluation** when Core System is scoped to **unique** CPs with `status === "fail"`.

**Why it is not 162 in this tree:** The repository’s `evaluateControlPointExecution` + current evidence/trace inputs mostly **PASS** workstream CPs; only a **fixed subset** of CPs evaluate to `fail` in `buildSystemMonitorControlPoints`. The **18 / 162 / 23** distribution you see in a browser is **inconsistent** with `getFreshSystemMonitorState()` as executed in this workspace (repro: Core System `computeGroupSummary` ≈ 173 / 19 / 11 for 203 total).

**Plausible reasons for 162 in *your* monitor (to investigate outside this RCA, not speculated as fact here):**

- Different **working tree** or uncommitted local edits to evaluators, registry, or environment.
- **Different** build output or cached **client chunk** (unlikely to flip 173 → 18 pass for Core System without code changes).
- **Visibility bug** in which numbers are read (e.g. non–Core-System cell mistaken for Core System) — **unverified**; document only as a check for humans.

**Why 19 must not be “ignored” for engineering truth in this repo:** It is the **output of the live function** the UI is wired to. Dismissing 19 in favor of 162 without a **payload** or **same-commit** run that shows 162 is not supported by the code path we can execute here. Conversely, **claiming 162 in artifacts without that payload** would be fiction.

**Instruction followed:** The prior diagnosis used the **same** `buildSystemMonitorControlPoints` pipeline, not a random helper; the name “helper” only meant `tsx` on the command line instead of the Next server. **Post-reconciliation:** treat **`getFreshSystemMonitorState()`** as the only named “live” entry point.

## Side-by-side (user UI vs this workspace `getFreshSystemMonitorState` math)

| Metric | Stakeholder UI (stated) | This workspace (executed) |
|--------|-------------------------|---------------------------|
| Core System pass | 18 | 173 |
| Core System fail | 162 | 19 |
| Core System partial | 23 | 11 |
| Core System total | 203 | 203 |
| Identity & Workspace pass | 0 | 84 |
| Identity & Workspace fail | 78 | 0 |
| Company Profile fail | 24 | 8 |
| … | … | (see `validation-report.md`) |

**Magnitude mismatch** (not a rounding error): the two views cannot be reconciled without additional runtime evidence from the environment that shows 162.
