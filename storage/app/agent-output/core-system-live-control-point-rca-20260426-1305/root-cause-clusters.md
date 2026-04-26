# Root cause clusters

**Input:** The reproducible unique Core System `fail` set in this working tree has **19** control points (not 162). A 162-based cluster set requires the pasted 162 list.

| RC-ID | Title | Description | Affected CP IDs | Count | Domain (mission 1–13) | Primary failure type(s) | Business impact | Technical impact | Dependency | Session (see `recommended-execution-plan.md`) |
|-------|--------|-------------|-----------------|------:|------------------------|---------------------------|-----------------|------------------|------------|----------------------------------|
| LRC-01 | Posting + reporting spine (ACC / INV + CP-01,03,19) | Double-entry, posting, balance, open periods, inventory linkage, report impact and multi-invoice truth | CP-01,03,19, CP-ACC-001,003,007,008,010, CP-INV-001,002 | 10 | 8, 5, and document/report surfaces | incomplete implementation, broken data linkage, missing proof/evidence | Unreliable GL and reports | Evaluators and trace fail | Journal truth before deep proof/UX | 2 |
| LRC-02 | Accounting UI drill | Journal/ledger drill from shell | CP-ACC-012 | 1 | 8 + 10 | wrong route, placeholder, or dependent on LRC-01 | No operational drill-down to sources | `ui-ux-shell` / route checks | Can follow LRC-01 | 2–3 |
| LRC-03 | Template engine full stack | CRUD, order, assets, preview parity, proof, dashboard/canvas, no mock | CP-TMP-001…008 | 8 | 3, 6, 14, 9, 10 | preview/PDF mismatch, missing proof, placeholder UI, incomplete | Uncontrolled document output | template + document + company profile | Parity with PDF path | 3 |

**Domains:** (8) Accounting — 11/19 including ACC-012; (5) Inventory — INV; (3)/(6) Document/Template — TMP + CP-01,03,19; (9) proof — 010, 005; (7) VAT only as a linked engine on some ACC, not a separate failing tax CP in this 19 set.

**Clusters (primary roots): 3** — LRC-01 is the main spine; LRC-02 is often a **symptom** of LRC-01 or a small UI slice; LRC-03 is a **separate** template vertical.
