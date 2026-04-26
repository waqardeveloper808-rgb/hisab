# Recommended execution plan (not executed; engineering guidance)

Rules from mission: foundation before UI; data before screens; route ownership; company/profile/contact/product before document flows; document/template before PDF polish; accounting/VAT before reports; proof before PASS; avoid unrelated modules in one session.

| Session | Objective | Affected LRC | ~CPs | Allowed areas | Forbidden | Proof / pass |
|---------|------------|-------------|------|---------------|-----------|--------------|
| **1** | **Control point consistency** — one commit/build where `getFreshSystemMonitorState` matches the browser payload; if 162 is real, find **why** the tree differs (document evidence: Network JSON vs CLI) | *meta* | 0 | scripts, `control-point-execution`, monitor refresh | product feature rewrites in same change set | Screenshot/JSON of `/api/system/monitor/refresh` and matching local `npx tsx` |
| **2** | **Identity + workspace + company + contact + product foundations** (only if 162 list demands it; **here** no fails in id/contact/product) | *future 162* | 0* | *per actual fail list* | n/a for this 19 | n/a |
| **3** | **Document + template** — LRC-03: TMP contract + preview/PDF + proof | LRC-03 | 8 | template-engine, document-engine, company-profile, proof | unrelated accounting refactors | TMP checks green; parity evidence |
| **4** | **Accounting + VAT linkage** (ACC/INV/CP-01,03,19) — LRC-01 + drill LRC-02 | LRC-01, LRC-02 | 11 | accounting, inventory, document, reports, ui routes for drill | template canvas in same week | GL + inv evaluators; drill UI |
| **5** | **Proof + control dashboard** — CP-ACC-010, CP-TMP-005, audit runtime refresh | 010, 005 | 2+ | proof-layer, `data/audit-runtime` capture | new CP definitions | `last_checked_at` and evidence bundles |
| **6+** | Communication, security, remaining UI (no CPs in 19) | n/a this run | 0 | *if future fails* | — | — |

\*Session 2 is a **placeholder** — this engine’s 19 fail set has **no** `fail` in identity, contacts, or product. Populate when 162 is frozen.

**Sessions 3–4 order:** If **template** is customer-blocking, run Session 3 early; if **GL** is the statutory risk, do Session 4 first — product decision.
