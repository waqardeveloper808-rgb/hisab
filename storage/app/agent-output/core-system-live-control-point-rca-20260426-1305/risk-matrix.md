# Risk matrix (19-fail engine truth)

| Root cause | CP count | Severity | Impacted modules | Dependency | Suggested session | Fix complexity | Expected recovery | Proof |
|------------|----------|----------|------------------|------------|-------------------|---------------|---------------------|--------|
| LRC-01 | 10 | Critical (financial) | document, accounting, inventory, reports | Coherent posting + queries | 4 | High | Up to 10 | evaluators + data |
| LRC-02 | 1 | High (ops) | ui-ux, accounting, document | LRC-01 or routes | 4 | Low–med | 1 | UI capture |
| LRC-03 | 8 | High–critical (customer output) | template, document, company | Render contract | 3 | Med–high | 8 (batch) | PDF vs preview + proof |

**162** — matrix **not** produced without row list.
