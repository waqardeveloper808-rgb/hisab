# Validation report

| Check | Method | Outcome |
|-------|--------|---------|
| Core System `fail` count | `npx tsx` one-liner (see `core-system-fail-list-freeze.md`) | **19** (expected) |
| Core System group `total` | `controlPointsForGroupUnique` with `monitorGroupModuleIds("core-system")` | **203** |
| Stakeholder 162 | Not present in engine output; no pasted list in repo | **INCONCLUSIVE / BLOCKER** for 162-specific RCA |
| Artifacts 1–8 present | File listing | 9 required files present; extra `execution-log`, `files-modified-list`, `validation-report` for governance |
| App codebase modified | No edits outside `storage/app/agent-output` | **PASS (no code)** |

**Verdict:** Technical validation of **repro** monitor output **PASS**. Mission validation against **162** **FAIL** until the frozen 162 list is provided.
