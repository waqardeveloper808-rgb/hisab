# Risk matrix

| Root cause ID | Root cause (short) | Affected CP count | Severity (business) | Impacted modules | Dependency | Recommended session | Fix complexity | Expected CP recovery | Proof required |
|---------------|--------------------|------------------:|---------------------|------------------|------------|---------------------|----------------|----------------------|----------------|
| RC-CORE-01 | GL/posting/INV spine + report impacts | 11 | Critical | `accounting-engine`, `document-engine`, `inventory-engine`, `reports-engine`, `proof-layer`, `ui-ux-shell` (partial) | Data model + `evaluateControlPointExecution` + trace snapshot | 1–3 | High (cross-cutting) | Up to 11 (some may need UI-only follow-up) | Runtime audit, trace evidence, optional UI capture |
| RC-CORE-02 | Template feature + parity + surface | 8 | High–Critical | `template-engine`, `document-engine`, `company-profile`, `proof-layer`, `ui-ux-shell` | Session 1 stable enough for line merge fields; else parallel team | 4–5 | Medium–High (render unification) | 8 (often **batch** 006–008) | Preview vs PDF, proof artifacts, route screenshots |

**Severity** here is business-facing (financial misstatement / wrong customer documents), not the monitor’s `critical` field (which is also influenced by `link_missing` in code).

**Expected “162 recovery”** from this matrix: **not estimable** — the repo does not expose 162 Core System `fail` rows. If the 162 set is real elsewhere, recompute this column from that set.
