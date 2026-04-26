# Document Engine — `fail` list (control point engine, this repo)

**Stated UI:** Fail = 87.  
**Engine result (`moduleId: "document-engine"`):** **19** `fail` (92 pass, 11 partial, 122 total).

**Unique fail IDs (all Core System `fail` rows link `document-engine`):**

`CP-01, CP-03, CP-19, CP-ACC-001, CP-ACC-003, CP-ACC-007, CP-ACC-008, CP-ACC-010, CP-ACC-012, CP-INV-001, CP-INV-002, CP-TMP-001, CP-TMP-002, CP-TMP-003, CP-TMP-004, CP-TMP-005, CP-TMP-006, CP-TMP-007, CP-TMP-008`

**Subcategory `fail` count sum (engine):** 0 + 8 + 0 + 0 + 19 = **27** **appearances** of `fail` across the five Core subcategories, not 198 — because 8 of the 19 (TMP) are counted in both `company-profile` and `document-engine` (2× each) and 11 of the 19 are **only** in `document-engine` (ACC/INV/CP-xx): 8×2 + 11 = 16 + 11 = 27. Wait: 8×2=16, plus 11 only document = 27. Yes.

**Validation vs stakeholder (87):** **MISMATCH**.

### Why 27 appearances ≠ 19 unique

The eight `CP-TMP-*` each appear in the fail list for both **company-profile** and **document-engine** (each links both). The remaining eleven unique fails only appear under **document-engine** in Core subcategory rows.

**Unique count across group remains 19** (`controlPointsForGroupUnique` for Core System).
