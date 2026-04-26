# Execution time report

| Step | Duration (approx.) |
|------|---------------------|
| Vitest `lib/audit-engine/control-point-summary-engine.test.ts` | ~28s run time (reported); ~50s wall including transform/environment |
| Playwright screenshot script (`tools/capture-system-monitor-artifact-shots.ts`) | ~15s |
| ESLint (changed files) | ~7–12s |

Environment: Windows, project `C:\hisab`. Next dev on port 3000 was already running for Playwright (EADDRINUSE when starting a second instance).
