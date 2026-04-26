# Root cause clusters

**Input size:** 19 failed CPs (repro engine). The mission’s “162” set is not present in repo output; clusters below explain **this** 19, which is a **low-cardinality** view of the same business spine (posting, inventory, template).

---

## RC-CORE-01 — General ledger and posting spine (document ↔ accounting ↔ reports)

- **Title:** GL posting invariants, impact views, and multi-invoice truth  
- **Description:** A coherent subset of **document-driven accounting** and **report impact** control points still returns `fail`: journal/trial-balance **impact** views (CP-01, CP-03), **multi-invoice** consistency (CP-19), and the **acc-engine** “contract + balance + journal + opening + proof + UI” set (CP-ACC-001,003,007,008,010,012). **Inventory** contract failures (CP-INV-001,002) are the same **posting and linkage** spine, expressed through stock movement.  
- **Affected CP IDs:** CP-01, CP-03, CP-19, CP-ACC-001, CP-ACC-003, CP-ACC-007, CP-ACC-008, CP-ACC-010, CP-ACC-012, CP-INV-001, CP-INV-002  
- **Count:** 11  
- **Domain:** 4 (primary) + 5 (inventory)  
- **Failure types (multi-select):** incomplete implementation, broken data linkage, missing proof/evidence, missing implementation (varies by CP)  
- **Business impact:** Financial statements and tax reporting cannot be **trusted** from the same source of truth; users cannot defensibly **drill** from numbers to source documents.  
- **Technical impact:** `control-point-execution` + `evidence-engine` + `traceability` snapshot do not **jointly** satisfy evaluators; optional **critical** severity if `domainLinkMissing` for accounting/inventory.  
- **Fix dependency:** Stable journal lines + document links + open periods + reporting queries; then proof generation; then UI drill-down.  
- **Recommended fix session:** Session 1 (see `recommended-execution-plan.md`)

---

## RC-CORE-02 — Template system (CRUD, parity, proof, and UI surface)

- **Title:** Template engine not shippable as defined by CP-TMP-001…008  
- **Description:** All eight template CPs fail. Feature and parity checks (001–004), proof (005), and UI (006–008) read as one **module** that has not met the **template-engine + document-engine + company-profile** (and `ui-ux-shell` / `proof-layer` where required) bar. “Preview parity” and “live output proof” are classic **render-path split** issues. “Dashboard / canvas / no fake data” is **placeholder UI** and **wrong route ownership** risk.  
- **Affected CP IDs:** CP-TMP-001, CP-TMP-002, CP-TMP-003, CP-TMP-004, CP-TMP-005, CP-TMP-006, CP-TMP-007, CP-TMP-008  
- **Count:** 8  
- **Domain:** 3, 9, 11, 14 (mixed)  
- **Failure types:** preview/PDF mismatch, missing proof/evidence, placeholder UI, wrong route ownership, incomplete implementation  
- **Business impact:** Branded, compliant customer-facing documents are not **governed**; users cannot trust template changes in production.  
- **Technical impact:** Separate code paths (preview, PDF, live), possibly missing `proof-layer` capture; shell may not expose a **real** template workspace.  
- **Fix dependency:** Unify **template contract** (section order, assets), then one render pipeline, then proof hooks, then shell routes. **Partially independent** of RC-CORE-01 except where templates drive **line/tax** display that ties to ACC/TAX.  
- **Recommended fix session:** Session 2 (post spine stabilization or in parallel if teams split)

---

## Optional micro-cluster (for execution only) — *symptom of RC-CORE-01*

Not a new root: **CP-ACC-010** is often the **evidence** face of the same broken trace as CP-ACC-001/003/007/INV-00x. If posting spine is fixed, 010 may flip on **proof** regeneration alone.

**Clusters total:** 2 primary (RC-CORE-01, RC-CORE-02). No third independent root is required to explain 19/19.
