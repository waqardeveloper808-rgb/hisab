# Changed Files

| File | Status | Why it changed | Related gate | Evidence |
|---|---|---|---|---|
| `backend/app/Services/DocumentTemplateRendererService.php` | modified | Add fallback template resolution so document previews render from active templates; unblocks document preview and PDF control paths. | Control-point audit + document preview parity | `proof/control-point-results-after.json`, `proof/pdf-control-proof.json` |
| `tools/generate-quarter-stress-test-data.mjs` | created | Generate deterministic quarter stress data, proof summaries, and the import fixture. | Quarter stress generator + import control | `proof/quarter-stress-summary.json`, `proof/import-control-proof.json` |
| `tools/validate-hard-recovery-full-system.ps1` | rewritten | Replace the fake quarter-stress blocker with the real generator, audit commands, browser proof, and proof writes. | Hard recovery validation | `proof/hard-recovery-validation-after.json` |
| `tools/validate-final-recovery-template-zatca-audit.ps1` | rewritten | Delegate final recovery validation to the repaired hard-recovery script. | Final recovery validation | `logs/validate-final-recovery-template-zatca-audit.log` |
| `data/import-fixtures/quarter-stress-import.csv` | created | Deterministic import mapping fixture with realistic business columns. | CP-IMP-002 | `proof/import-control-proof.json` |
| `data/quarter-stress-q1-q2.json` | created | Generated quarter stress dataset consumed by proof and artifact packaging. | Quarter stress generator | `proof/quarter-stress-summary.json` |
| `ARTIFACT_LOCATION.txt` | updated | Point the workspace to the active artifact root and final ZIP paths. | Artifact packaging | `ARTIFACT_LOCATION.txt` |

## Scope Check

- No unrelated source files were edited in this recovery run.
- The backend renderer change is isolated to the document preview fallback path.
- The new tool and data files are limited to the quarter-stress generator and validation harness.
