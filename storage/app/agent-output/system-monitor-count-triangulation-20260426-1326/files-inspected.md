# Files inspected (read; product source not edited)

- `C:\hisab\app\system\master-design\page.tsx` — RSC initial state
- `C:\hisab\app\api\system\monitor\refresh\route.ts` — `getFreshSystemMonitorState`
- `C:\hisab\backend\app\Support\Standards\control-point-engine.ts` — `buildLegacySystemState`, `getFreshSystemMonitorState`
- `C:\hisab\lib\audit-engine\build-monitor-points.ts` — `buildSystemMonitorControlPoints` (cited in chain)
- `C:\hisab\components\system\MasterDesignTree.tsx` — `data-inspector-system-tree-card`, metric DOM

**Local artifacts (this run):** `count-comparison.md`, `root-cause-of-mismatch.md`, `browser-ui-core-system.png`, `browser-ui-dom-snapshot.json`, `browser-refresh-*.json`, `cli-engine-output.json`, `_capture-dom.mjs` (Playwright helper, reproducibility only).

**Product / app / lib / components:** no writes.
