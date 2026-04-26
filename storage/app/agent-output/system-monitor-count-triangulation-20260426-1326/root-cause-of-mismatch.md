# Root cause of mismatch (A/B vs C)

**Findings (proved in this run):**

1. **Browser UI (A)** and **Network/API (B)** are **identical** for the Core System row: 203 total, 18 pass, 162 fail, 23 partial, 0 blocked. The UI is **not** a stale read relative to the refresh payload for this session: it renders the same numbers the API returns in `groupScope` for `core-system`.

2. **CLI (C)**, a **separate** Node process that imports `getFreshSystemMonitorState` from disk via `npx tsx`, produces **173 / 19 / 11** for the same `computeGroupSummary(core-system)`.

3. **Total 203** is **stable** across A, B, and C. The **disagreement** is only in the **per-status** distribution of those 203 unique control points.

**Conclusion (no guessing, follow rules from mission):**

- **A = B = user copy (162).** The live Next.js app and its `/api/system/monitor/refresh` handler, as running on `localhost:3000` during this capture, are the **observable** “System Monitor” truth for the browser.

- **C ≠ (A, B).** A one-shot **tsx** run from the same repo does **not** match the **running** dev server’s computed statuses. This is **not** because `SystemMonitor` uses a different function name — both paths call `getFreshSystemMonitorState` → `buildSystemMonitorControlPoints` in source. The divergence is between **(1) the long-lived Next dev server + bundler** and **(2) a fresh Node/tsx process** loading the same files.

**Most plausible technical explanations to verify next (still diagnosis, not fix):**

1. **Stale or divergent dev server bundle** — the process bound to :3000 may have been started before recent changes to `control-point-execution` / evidence, so its in-memory compiled modules are older than a cold `npx tsx` import. **Test:** stop all `next dev` on :3000, start clean, re-run A/B/C in one go.

2. **Bundler vs plain Node resolution** — Next (Turbopack/webpack) can resolve a different **copy** of a dependency (or tree-shake differently) in edge cases, causing different `evaluateControlPointExecution` results. **Test:** `next build` + `next start` vs dev; or compare a single CP status from both paths.

3. **Environment** — if any evaluator reads `process.env.*`, .env not loaded the same in tsx vs Next. **Test:** log env at entry of `buildLegacySystemState` in both contexts.

**What is *not* the cause in this test:** A ≠ B. The “162 UI vs 19 helper” is **not** “DOM wrong and API right” (rule 2 inverted); here **A and B both say 162**.

**Authoritative for “what the monitor shows”:** **A and B (162 fail)**.  
**Authoritative for “what a cold Node import of current tree returns without Next”:** **C (19 fail)**—until a restart proves alignment.

**RCA which number to use (next task):** Use **A/B (162)** to describe the **shipped/visible** product behavior on the **running server**. Use the **A vs C** gap to open a **build/runtime parity** bug. After **restart**, if C matches B, use that unified count for RCA.

**Files in application source tree:** not modified in this triangulation (only `storage/app/agent-output/...` outputs).
