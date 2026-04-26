# Validation report

| Requirement | Result | Evidence |
|-------------|--------|----------|
| Find live control point source | **PASS** (code) | `live-control-point-engine-source-map.md` — `getFreshSystemMonitorState` + `buildSystemMonitorControlPoints` |
| Prove Core System `fail` = 162 in payload | **FAIL** (this workspace) | `getFreshSystemMonitorState` / `buildSystemMonitorControlPoints` + `computeGroupSummary` for `core-system` → **fail: 19**, total 203. CLI: `npx tsx` from repo root, same as prior runs. |
| Screenshot 162 | **N/A (agent cannot capture)** | Human must attach |
| Network JSON 162 | **Not captured in IDE** | Human must `POST` `/api/system/monitor/refresh` on 162 build |
| Freeze 162 unique IDs | **FAIL** | `core-system-162-fail-list-freeze.md` — **19** only |
| Subcategory fail counts = UI (78,24,8,1,87) | **FAIL** | Engine: identity 0, company 8, contacts 0, product 0, document 19; see per-file freezes |
| Subcategory sum 198 (allowed) | **N/A** | Engine sum of fail **appearances** 27, not 198 (different universe) |
| Overlap map | **PASS (for 19)** | `subcategory-overlap-map.md` |
| RCA on 162 | **FAIL** | Performed on **19** with explicit caveat |
| No source file edits (product code) | **PASS** | Only `storage/app/agent-output/...` writes |

**Commands used (repro):**

```bash
cd C:\hisab
npx tsx -e "import { getFreshSystemMonitorState } from './backend/app/Support/Standards/control-point-engine'; import { computeGroupSummary } from './lib/audit-engine/control-point-summary-engine'; import { MONITOR_GROUP_DEFS } from './lib/audit-engine/monitor-groups'; const s = getFreshSystemMonitorState(); const cps = s.controlPoints; const def = MONITOR_GROUP_DEFS.find((g) => g.id === 'core-system')!; console.log(computeGroupSummary(cps, def));"
npx tsx -e "import { buildSystemMonitorControlPoints } from './lib/audit-engine/build-monitor-points'; import { filterControlPointsForMonitorList } from './lib/audit-engine/control-point-summary-engine'; import { monitorGroupModuleIds } from './lib/audit-engine/monitor-groups'; const cps = buildSystemMonitorControlPoints(); const f = filterControlPointsForMonitorList(cps, { status: 'fail', groupId: 'core-system', moduleId: null, healthNonPass: false, listAggregation: null }, monitorGroupModuleIds); console.log('unique core fail count', f.length);"
```

**Conclusion:** **FAIL** per TASK 1 proof rule (no 162 in observable payload) and TASK 3/4 list validation.
