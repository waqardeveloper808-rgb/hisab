# Subcategory overlap map (Core System scope)

**Method:** For each of the **19** unique `fail` control points, list which of the **five** Core System module ids in `lib/audit-engine/monitor-groups.ts` appear in `linked_project_modules`. Subcategory **tree** rows use `controlPointsForModuleId` (CP counted once **per** subcategory that lists it).

| CP-ID | Subcategories in Core (module ids) | Extra linked modules (non–Core) | Overlap / notes |
|-------|--------------------------------------|----------------------------------|-----------------|
| CP-01, CP-03, CP-19 | `document-engine` only | `accounting-engine`, `reports-engine`, `workspace-ui` | **Valid:** `workspace-ui` ≠ `identity-workspace`; not counted in Identity & Workspace. |
| CP-ACC-001,003,007,008,010,012 | `document-engine` only | + accounting, inventory, tax, proof, ui-ux, reports as applicable | **Valid** single subcategory in Core. |
| CP-INV-001,002 | `document-engine` only | inventory, accounting | **Valid** |
| CP-TMP-001…008 | **`document-engine` + `company-profile`** | + template-engine, + proof/ui-ux for some | **Valid duplicate count:** the same 8 unique CPs are expected to show as `fail` in **two** subcategory **lists**; they are **not** two separate root causes. |

**Suspicious?** If a browser showed a **huge** fail count in Identity (78) with **zero** pass while this engine shows **0** fail / **84** pass, that is a **suspicious cross-environment** mismatch, not a natural overlap pattern.

**Double-count of fails across subcategories (engine, not UI):** 8 (TMP) × 2 (company + document) + 11 (other fails × 1) = **27** `fail` **appearances**; **unique** Core fail set size = **19**.
