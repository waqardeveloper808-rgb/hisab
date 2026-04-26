# Primary vs symptoms (19 unique `fail` set)

| Cluster | Primary root | Secondary symptoms (may pass after primary) | Likely need separate work |
|---------|-------------|---------------------------------------------|----------------------------|
| LRC-01 | Invariants: balanced entries, journal posting, opening balance, inv linkage, report impact, trace proof (010) | CP-19, CP-01, CP-03 may follow once data correct | CP-01 vs CP-03 if two distinct report **modes** |
| LRC-02 | **CP-ACC-012** | Passes if only drill UI missing but real data exists | Fails on its own if route ownership wrong |
| LRC-03 | **CP-TMP-001** model + **CP-TMP-004** single render | **CP-TMP-005** proof, **CP-TMP-006–008** if one real screen ships | **CP-TMP-003** / branding may need governance outside one CRUD PR |

| Proof-only re-run? | **CP-ACC-010** only if LRC-01 data already posts — verify before assuming |
| Route/UI only? | **CP-ACC-012**, **CP-TMP-006–008** if engines green |

**Not applicable to 162** until 162 list exists.
