# RCA summary

1. **Live engine source (code):** `getFreshSystemMonitorState` → `buildSystemMonitorControlPoints` for **all** monitor rows. Same chain whether loaded from RSC or `POST /api/system/monitor/refresh`. **No** second engine for the 162 vs 19 split.  
2. **Your UI (162) vs this working tree (19/173/11):** **Inconsistent.** Subcategory **Identity** 78 fail vs **engine 0** fail is a **red flag** that the 162 view is **not** the same as executing this repository’s evaluators, **or** the browser is not running this build.  
3. **19 is not a “helper bug”** — it is the **result of the same** `buildSystemMonitorControlPoints` the UI is wired to in source. Dismissing it requires a **captured** Network payload, not a different script name.  
4. **RCA** on 162: **not completed**. **RCA** on 19: **complete** in `root-cause-clusters.md` and related files.  
5. **Next step:** On the environment that shows 162, save **`POST /api/system/monitor/refresh` response `data`** (or the Copy list) and diff against a local `npx tsx` call to `getFreshSystemMonitorState` from the same commit. Until then, the **defensible** product truth for **this** tree is the **19** unique fails.

**STATUS:** `FAIL` for mission’s 162/validation gates; `PARTIAL` for “explain live source + 19 + mismatch.”
