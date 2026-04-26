# Duplicates, symptoms, and pass-through expectations

## RC-CORE-01 (11 CPs)

| Role | CP-ID | Rationale |
|------|-------|------------|
| **Primary (engine)** | CP-ACC-001, CP-ACC-003, CP-ACC-007 | “Contract”, **balance**, **posting** — other ACC/INV/report CPs **depend** on these invariants. |
| **Primary (reports UX)** | CP-01, CP-03, CP-19 | Depend on same GL truth; fail if subledger/report queries wrong. |
| **Symptom of trace/proof** | CP-ACC-010 | “Traceable journal impacts” often clears when **posting + evidence** path is real; can be **proof-only** if implementation already posts correctly (verify before coding). |
| **Symptom of linkage** | CP-INV-001, CP-INV-002 | If INV movements do not post or don’t **reference** JEs, both fail together. |
| **Often secondary to truth** | CP-ACC-012 | If drill-down is pure UI, may need separate UI work; if drill-down is empty because no **real** JEs, fixing spine **may** help partial→pass. |
| **Symptom of opening data** | CP-ACC-008 | Can be isolated (opening balance UX/data) or blocked until posting works. |

**Likely to pass with spine fix alone (re-evaluate, not guaranteed):** CP-ACC-010 (if proof was the only gap), parts of CP-19/CP-01/CP-03 (if only report filters were wrong).  
**Requires separate implementation:** CP-ACC-012 (if routes/components missing), CP-01 vs CP-03 (distinct report **modes**), CP-ACC-008 (if calendar/OB model separate).  
**Evidence-only re-run may suffice for:** CP-ACC-010 after a successful audit capture run — **if** `collectControlPointEvidence` then shows full chain.

---

## RC-CORE-02 (8 CPs)

| Role | CP-ID | Rationale |
|------|-------|------------|
| **Root (data model)** | CP-TMP-001, CP-TMP-002, CP-TMP-003 | CRUD, section order, assets — if model wrong, **all** UI/proof/parity fail. |
| **Symptom of render** | CP-TMP-004 | Preview/PDF mismatch — same as document-engine parity themes **inside** template scope. |
| **Proof layer** | CP-TMP-005 | May auto-pass if live document hash/proof is wired after 001–003/004. |
| **UI / route** | CP-TMP-006,007,008 | “Dashboard / canvas / no fake” — if same page uses mocks, all three fail as **one** UI task. |

**Likely to pass after unified template implementation:** 006–008 together (if one “real” template workspace ships).  
**Proof-only after feature fix:** CP-TMP-005.  
**Requires distinct engineering:** CP-TMP-004 (PDF pipeline), CP-TMP-003 (branding + asset governance) if not covered by one CRUD story.

---

## 162-stakeholder-list note

If **143** of the 162 are **not** in the table in `core-system-fail-list-freeze.md`, they are **out of scope** for this artifact run and were **not** de-duplicated against engine symptoms here.
