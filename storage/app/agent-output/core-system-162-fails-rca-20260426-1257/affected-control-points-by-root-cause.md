# Affected control points by root cause

| Root cause ID | Title | CP IDs (count) |
|---------------|-------|------------------|
| RC-CORE-01 | GL / posting / inventory linkage spine | CP-01, CP-03, CP-19, CP-ACC-001, CP-ACC-003, CP-ACC-007, CP-ACC-008, CP-ACC-010, CP-ACC-012, CP-INV-001, CP-INV-002 (11) |
| RC-CORE-02 | Template engine (feature, parity, proof, UI) | CP-TMP-001, CP-TMP-002, CP-TMP-003, CP-TMP-004, CP-TMP-005, CP-TMP-006, CP-TMP-007, CP-TMP-008 (8) |

**Union:** 19 (disjoint; every fail belongs to exactly one cluster).

### If the stakeholder 162 set were available

Re-run the same **clustering** after classifying the pasted IDs; expect **more clusters** (e.g. partial-as-fail, workspace-only, or platform-layer CPs) if the list mixes non–Core-System-unique or different runtime JSON.
