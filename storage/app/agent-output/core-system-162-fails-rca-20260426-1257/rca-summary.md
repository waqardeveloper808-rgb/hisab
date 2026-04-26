# RCA summary — Core System fail items

**Date:** 2026-04-26  
**Engine path:** `buildSystemMonitorControlPoints` (`lib/audit-engine/build-monitor-points.ts`) + `filterControlPointsForMonitorList` with `core-system` group.

## Executive statement

- The **reproducible** Core System **fail** count in this repository is **19**, not 162. The **group total 203** matches the user’s “total 203” figure; **pass/fail/partial** does **not** (see freeze file).  
- The 19 failures **collapse to two** independent root-cause clusters: **(1) GL / posting / inventory / report impact spine** (11 CPs) and **(2) full template engine stack** (8 CPs).  
- A **162**-item RCA is **blocked** without the System Monitor “Copy visible filtered list” text or a checked-in `control-point-runtime-results.json` (or other payload) that yields 162 `fail` rows for **Core System** scope.

## Why 162 vs 19 cannot be explained from code alone (hypotheses, not proof)

1. **Different runtime results file** or audit not committed — evaluators would read different `status`.  
2. **UI aggregation** — if someone summed **per-module** or **per-group** fail rows, counts can **inflate** (the repo already documented a deduplication/union issue for System Monitor; see `system-monitor-summary-copy-fix` artifacts).  
3. **Inversion** of pass/fail in a one-off build (18 vs 173 pass is too large to be rounding — likely different inputs).  
4. **“Fail”** filter included non–Core-System CPs in the user’s headcount (mission scope says Core System only).  

## What the 19 share technically

- **RC-CORE-01:** The audit engine’s **linkage/traceability** and **evidence** layers (`collectTraceabilitySnapshot`, `domainLinkMissing`, `collectControlPointEvidence`) interact with `evaluateControlPointExecution` to mark `fail` and often **critical** risk when the **end-to-end business chain** is incomplete.  
- **RC-CORE-02:** The entire **CP-TMP-*** set fails — typical of a **module** that was scaffolded but not yet meeting **feature, parity, proof, and real UI** bars together.

## Recommended next action (governance)

1. Export **“Copy visible filtered list”** for **Core System → Fail** from the same environment that reported 162, and store it under `storage/app/agent-output/` for a **re-run of Tasks 1–3** only.  
2. In parallel, **reconcile** the Summary strip math vs **unique** fail list in System Monitor (already a known class of issues in this project’s validation reports).  
3. Treat the **19**-item classification in this package as the **code-truth** baseline for developers until a newer audit snapshot overrides it.

## Status block (see mission TASK 9)

- **RCA for 162:** No (blocked — list not in repo).  
- **RCA for 19 (repro):** Yes, complete.  
- **Application source code modified in this work:** None (only `storage/app/agent-output/...` deliverables).  

**Final STATUS:** `FAIL` for “162 fails analyzed” per strict mission; **PASS** for “explain engine-truth 19 and cluster” as partial completion.
