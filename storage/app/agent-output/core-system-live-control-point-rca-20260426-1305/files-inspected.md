# Files inspected (read or cited; no product edits)

| Path | Why |
|------|-----|
| `C:\hisab\app\system\master-design\page.tsx` | RSC entry for System Monitor |
| `C:\hisab\app\api\system\monitor\refresh\route.ts` | Refresh API |
| `C:\hisab\backend\app\Support\Standards\control-point-engine.ts` | `getFreshSystemMonitorState`, `buildLegacySystemState` |
| `C:\hisab\lib\audit-engine\build-monitor-points.ts` | `buildSystemMonitorControlPoints` |
| `C:\hisab\lib\audit-engine\monitor-groups.ts` | Core System module list |
| `C:\hisab\lib\audit-engine\control-point-summary-engine.ts` | `computeGroupSummary`, `computeSubCategorySummary`, `filterControlPointsForMonitorList` |
| `C:\hisab\components\system-monitor\SystemMonitor.tsx` | UI consumption of `data.controlPoints` |
| `C:\hisab\components\system\MasterDesignDashboard.tsx` | `SystemMonitorState` type and `ArchitectDashboard` |
| (CLI) | `npx tsx` repro for counts — not a file read |

**Application source under `C:\hisab\` (app, lib, components, backend):** **not modified**.
