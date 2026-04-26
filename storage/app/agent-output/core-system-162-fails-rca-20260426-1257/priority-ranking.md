# Priority ranking (P0–P5)

**Basis:** 19 engine fails, 2 root clusters. Tiers follow mission rules. Within RC-CORE-01, order is: **data contracts and posting** before **UI drill-down**; **trace/proof** after measurable truth exists.

| Tier | What belongs | Clusters / CPs | Why |
|------|----------------|----------------|-----|
| **P0 — Foundation blockers** | RC-CORE-01 core invariants: processing contract, balanced entries, posting, opening balances, INV linkage | CP-ACC-001,003,007,008; CP-INV-001,002; CP-19 (multi-invoice truth) | Everything else in finance is undefined without journal truth. |
| **P1 — Core business engine blockers** | Report impact + trace proof that sits on the spine | CP-01, CP-03; CP-ACC-010; CP-ACC-012 (if blocked only by data, else UI) | Reports and proof are **consumers** of P0. |
| **P2 — Document/template/compliance blockers** | Full template feature + parity (PDF/preview) | RC-CORE-02: CP-TMP-001–005 (esp. 004) | Customer-facing **document** truth. |
| **P3 — Workspace/routing/control visibility** | Template **shell** surface | CP-TMP-006,007,008; CP-ACC-012 if it was UI-only in P1 | “Wrong route / placeholder” must not ship to users. |
| **P4 — Evidence/reporting/proof blockers** | Re-run or extend proof after P2 (template proof) | CP-TMP-005; residual CP-ACC-010 if still proof-gated | **Proof** after implementation exists. |
| **P5 — UI polish and lower risk** | Only after TEMPLATE feature complete — tighten copy, empty states, non-blocking UX | (none **specific** in 19; partial CPs 11 total in group are follow-up) | Lower risk once engines green. |

**Prioritization rubric (mission):**

1. **Foundation:** RC-CORE-01 P0.  
2. **Business risk:** Unbalanced or unlinkable JEs = highest.  
3. **Affected CP count:** RC-CORE-01 = 11, RC-CORE-02 = 8.  
4. **Blocks other modules:** Posting blocks VAT reports, tax proofs, and template numeric merge fields.  
5. **Accounting/VAT/document truth:** Dominated by RC-CORE-01 first.  
6. **UI vs engine:** CP-TMP-006–008 and CP-ACC-012 are **UI-heavy**; scheduled **after** their engines or in parallel on separate owners.

**Top root causes by affected CP count (this run):**  
1. RC-CORE-01 — 11  
2. RC-CORE-02 — 8

*(Only two roots cover 100% of fails; positions 3–10 in the user template are **not applicable** to the 19-item population.)*
