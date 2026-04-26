# Recommended execution plan (future — not executed in this task)

**Rules applied:** Foundation before UI; data contracts before screens; accounting before reports; preview/PDF parity before polish; route ownership before sidebar; proof after implementation; do not mix unrelated modules per session.

---

## Session 1 — Posting and inventory linkage spine (P0)

- **Objective:** Satisfy `CP-ACC-001,003,007,008` and `CP-INV-001,002` as far as **engine + data** allow; make **multi-invoice** posting consistent for evaluation (`CP-19`).  
- **Clusters:** RC-CORE-01 (subset)  
- **CP count (target this session):** 7–8 (depending on `CP-19` scoping)  
- **Allowed files/areas (typical, not a patch list):** `backend` accounting/inventory services, `data` where posting hooks live, `control-point-execution` / evidence only if **evaluator** contract is wrong — **as architect directs**.  
- **Forbidden:** `components` template dashboard-only refactors, unrelated `platform-layers` modules.  
- **Proof required:** Rerun `audit:control-points:runtime` or the capture tool that generated `data/audit-runtime/control-point-runtime-results.json` (stakeholder process).  
- **Pass/fail:** Targeted CPs → `pass` or defensible `partial` with **documented** remaining gap; System Monitor count for this scope drops accordingly.

## Session 2 — Reports impact + drill (P1)

- **Objective:** `CP-01`, `CP-03` report modes; unblocks impact visibility.  
- **Clusters:** RC-CORE-01 (report surfacing)  
- **CP count:** 2  
- **Allowed:** `reports-engine`, document–GL join queries, workspace UI for report **filters** only.  
- **Forbidden:** New template WYSIWYG.  
- **Proof:** Screenshot/audit lines showing filter matches journal ids.  
- **Pass/fail:** `CP-01`, `CP-03` → `pass` if engine numbers agree with journal detail.

## Session 3 — Trace + drill-down (P1 / P2 bridge)

- **Objective:** `CP-ACC-010` (evidence) and `CP-ACC-012` (UI). Address **link_missing**-style severity in monitor if `domainLinkMissing` still true in `lib/audit-engine/build-monitor-points.ts` trace.  
- **CP count:** 2  
- **Allowed:** `proof-layer`, `ui-ux-shell` accounting routes, traceability entities.  
- **Forbidden:** Template canvas.  
- **Proof:** Evaluator `collectControlPointEvidence` shows full chain; user can drill in app.  
- **Pass/fail:** Both `pass` or explicit partial if UI exists but one edge case remains.

## Session 4 — Template engine: data + parity (P2)

- **Objective:** `CP-TMP-001,002,003,004,005` — CRUD, order, assets, **preview vs PDF** parity, proof.  
- **Clusters:** RC-CORE-02 (feature)  
- **CP count:** 5  
- **Allowed:** `template-engine`, `document-engine`, `company-profile` branding, PDF pipeline.  
- **Forbidden:** Identity workspace, unrelated `tax-vat-engine` (unless field merge requires).  
- **Proof:** Re-render and hash/artifact strategy per proof governance.  
- **Pass/fail:** Parity and proof CPs can only PASS after a single render contract.

## Session 5 — Template UI surface (P3)

- **Objective:** `CP-TMP-006,007,008` — real dashboard, real canvas, **no mock** “family” rows.  
- **CP count:** 3  
- **Allowed:** `ui-ux-shell` routes, template editor components.  
- **Forbidden:** Re-breaking Session 4 render contract.  
- **Proof:** Route snapshot + no placeholder markers in code paths evaluators use.  
- **Pass/fail:** All three `pass`.

## Later sessions

- **Re-evaluate** all **11 partial** in Core System group (not fails in this 19 set) — they may be the **real** long tail.  
- **Reconcile** stakeholder **162** fail claim with `filterControlPointsForMonitorList` (possible UI/aggregation issue — see `storage\app\agent-output\system-monitor-summary-copy-fix-20260426-1248\validation-report.md` theme on dedupe).  
- **If** 162 list is validated: re-run this RCA’s Tasks 1–5 against that list.

---

**Note:** `SESSION` boundaries follow **RC-CORE-01** then **RC-CORE-02**; do not merge **template** and **GL posting** in one session (mission rule 7).
