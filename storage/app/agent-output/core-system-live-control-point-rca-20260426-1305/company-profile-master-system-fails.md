# Company Profile Master System — `fail` list (control point engine, this repo)

**Stated UI:** Fail = 24.  
**Engine result (`moduleId: "company-profile"`):** **8** `fail` (8 `pass` / 16 in group row math from earlier: total 24 — here `fail+pass+partial` = 8+16+0 = 24).

**IDs (all in `fail` status, ordered):**

- CP-TMP-001, CP-TMP-002, CP-TMP-003, CP-TMP-004, CP-TMP-005, CP-TMP-006, CP-TMP-007, CP-TMP-008

| CP-ID | Risk | Title |
|-------|------|--------|
| CP-TMP-001 | critical | Template Engine feature - template CRUD |
| CP-TMP-002 | critical | Template Engine feature - section order |
| CP-TMP-003 | critical | Template Engine feature - asset assignment |
| CP-TMP-004 | critical | Template Engine feature - preview parity |
| CP-TMP-005 | critical | Template Engine proof expectation - template changes affect live document output |
| CP-TMP-006 | critical | Template Engine UI expectation - dedicated template dashboard |
| CP-TMP-007 | critical | Template Engine UI expectation - real editing canvas |
| CP-TMP-008 | critical | Template Engine UI expectation - no fake family diversity |

**Validation vs stakeholder (24):** **MISMATCH** (engine shows 8 fail, 16 pass for this subcategory; stakeholder shows 0 pass).
