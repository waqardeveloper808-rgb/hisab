# Domain classification (19 engine fails)

Scope: the **19** Core System `fail` rows in `core-system-fail-list-freeze.md` (reproducible). Not 162 (see freeze).

Legend — gap type:
- **impl** = implementation shortfall in product code
- **proof** = evaluator or evidence path cannot yet demonstrate PASS
- **mixed** = both (common when proof hooks exist but data/UI is incomplete)

| CP-ID | Primary domain (1–15) | Suspected root cause (technical) | impl vs proof | Dependency |
|-------|------------------------|----------------------------------|---------------|------------|
| CP-01 | 4 — Accounting / Journal / Ledger / Traceability | Report filters do not yet prove journal impact isolation across document set | mixed | Accurate GL/journal data from posting pipeline |
| CP-03 | 4 | Trial balance “delta/impact” mode not evaluable or not implemented for scope | mixed | CP-01/ACC engine truth |
| CP-19 | 4 | Multi-document posted totals vs expectation drift | impl | Coherent multi-invoice posting + reporting |
| CP-ACC-001 | 4 | “Processing contract” checks fail — engine API surface or invariants not fully satisfied | impl | `evaluateControlPointExecution` for ACC + fixtures |
| CP-ACC-003 | 4 | Unbalanced or non-debit-credit-strict entries in evaluated sample | impl | Posting + validation + opening data |
| CP-ACC-007 | 4 | Journal posting feature checks fail (workflows, routes, or posting outcomes) | mixed | CoA/period/entry model |
| CP-ACC-008 | 4 | Opening balance workflow not provable in audit | mixed | Year start + account balances |
| CP-ACC-010 | 9 — Proof / Audit / Evidence | End-to-end trace from doc/inventory to GL not evidenced for evaluator | proof + impl | `collectControlPointEvidence` + traceability snapshot |
| CP-ACC-012 | 11 — UI / UX Shell / Control Center | UI drill-down from journal/ledger to sources not found or not wired | impl | Real routes, not placeholder |
| CP-INV-001 | 5 — Inventory / COGS linkage | Inventory “contract” invariants fail checks | impl | Engine + data contract |
| CP-INV-002 | 5 | Strengthened linkage: refs, JE #, source — missing in chain | impl + broken data linkage | ACC posting + INV lines |
| CP-TMP-001 | 3 — Document / Template Engine | Template CRUD lifecycle not complete per checker | impl | `template-engine` + document-engine |
| CP-TMP-002 | 3 | Section order persistence/render vs contract | impl | template model |
| CP-TMP-003 | 14 — Branding / Template Asset Governance + 3 | Asset binding not single source of truth | mixed | company-profile assets |
| CP-TMP-004 | 3 + 8? | **Preview / PDF mismatch** (parity) | preview/PDF mismatch | document render + PDF path |
| CP-TMP-005 | 9 | No proof that template change propagates to live output | proof | build artifacts / preview hash / audit trail |
| CP-TMP-006 | 11 | No dedicated template dashboard that reviewer recognizes | impl + placeholder UI | route ownership, shell |
| CP-TMP-007 | 11 | “Real editing canvas” not exposed or is stub | placeholder UI + impl | WYSIWYG/data binding |
| CP-TMP-008 | 11 | “Fake family diversity” (mock sections) in UI | placeholder UI + impl | same as TMP-006/7 |

**Cross-cutting note:** `build-monitor-points` upgrades severity to `critical` when **traceability** is missing for accounting/vat/inventory domain linkage (`domainLinkMissing`). Many ACC/INV items appear `critical` because of that guard, not only because of pure business risk flags.

### Domain count (primary only)

| Domain | Count |
|--------|------:|
| 4 Accounting / Journal / Ledger / Traceability | 9 |
| 5 Inventory / COGS | 2 |
| 3 + 11 + 14 Template / document / branding / UI | 8 |

No primary assignment to VAT (1), import (13), or country (12) in this 19-list — those modules are **not** the failing **primary** for these IDs (VAT appears only as a linked module on some ACC rows).
