# Identity & Workspace — `fail` list (control point engine, this repo)

**Stated UI (for reference only):** Fail = 78 (not reproduced here).  
**Engine result (`computeSubCategorySummary` for `moduleId: "identity-workspace"`):** **0** `fail` (84 rows total, all `pass` in this run).

**Explanation:** A control point is counted under a subcategory if it **includes** that module id in `linked_project_modules` (`controlPointsForModuleId`). The 19 Core System `fail` rows list **other** module ids (e.g. `workspace-ui` on CP-01) but **not** `identity-workspace` for the failing set — so **no** `fail` appears under the Identity & Workspace subcategory in this evaluation.

**Frozen fail IDs:** *none* (empty set).

**Validation vs stakeholder UI:** **MISMATCH** — see `validation-report.md`.
