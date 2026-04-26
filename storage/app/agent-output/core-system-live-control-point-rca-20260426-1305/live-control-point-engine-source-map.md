# Live control point engine — source map (this repository)

**Purpose:** Map the same execution chain the System Monitor **browser** uses (initial load and refresh) to a concrete file list. No alternate “helper” engine exists in-tree for the payload shape `SystemMonitorState`.

## 1. System Monitor route (App Router)

| Item | Value |
|------|--------|
| **Route (URL path)** | `/system/master-design` (see `app/system/master-design/page.tsx`) |
| **Server entry** | RSC `ArchitectDashboardPage` → `getSystemState()` |

```1:6:c:\hisab\app\system\master-design\page.tsx
import { ArchitectDashboard } from "@/components/system/MasterDesignDashboard";
import { getSystemState } from "@/backend/app/Support/Standards/control-point-engine";

export default async function ArchitectDashboardPage() {
  return <ArchitectDashboard initialState={await getSystemState()} />;
}
```

`getSystemState` is a thin async wrapper; it returns `getFreshSystemMonitorState()`.

## 2. System Monitor component

| Layer | File |
|-------|------|
| Shell | `components/system/MasterDesignDashboard.tsx` — wraps `SystemMonitor` with `initialState` |
| **Tree + list** | `components/system-monitor/SystemMonitor.tsx` — reads `data.controlPoints`, applies `computeGroupSummary`, `computeSubCategorySummary`, `filterControlPointsForMonitorList` from `lib/audit-engine/control-point-summary-engine.ts` |

## 3. API endpoint (client refresh)

| Item | Value |
|------|--------|
| **Method / path** | `POST` → `/api/system/monitor/refresh` |
| **File** | `app/api/system/monitor/refresh/route.ts` |
| **Response** | JSON `{ ok: true, data: SystemMonitorState }` with `no-store` cache |

```1:9:c:\hisab\app\api\system\monitor\refresh\route.ts
import { getFreshSystemMonitorState } from "@/backend/app/Support/Standards/control-point-engine";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const data = getFreshSystemMonitorState();
    return NextResponse.json({ ok: true as const, data }, { headers: { "Cache-Control": "no-store" } });
```

`SystemMonitor.tsx` fetches this on refresh (search for `res.json` in that file) and replaces `data` with the new payload.

## 4. Function that builds the displayed rows (single source of truth for CP list)

| Function | File |
|----------|------|
| **`getFreshSystemMonitorState()`** | `backend/app/Support/Standards/control-point-engine.ts` |
| Implementation | **`buildLegacySystemState()`** → `buildSystemMonitorControlPoints(generatedAt)` |

```162:165:c:\hisab\backend\app\Support\Standards\control-point-engine.ts
function buildLegacySystemState(): SystemState {
  const actual = getActualSystemMap();
  const generatedAt = new Date().toISOString();
  const controlPoints = buildSystemMonitorControlPoints(generatedAt);
```

| Deeper | File |
|--------|------|
| **`buildSystemMonitorControlPoints`** | `lib/audit-engine/build-monitor-points.ts` — maps `engineRegisteredControlPoints` + `evaluateControlPointExecution` + evidence/trace |
| **Registry** | `backend/.../control-point-engine-runtime.ts` / standards registry (re-exported as `engineRegisteredControlPoints`) |

## 5. Runtime payload / object shape

| Kind | Description |
|------|--------------|
| **Type** | `SystemMonitorState` (`components/system/MasterDesignDashboard.tsx`) — includes `controlPoints: SystemMonitorControlPoint[]`, `moduleHealth`, `groupScope`, `generatedAt` |
| **Provenance** | **Frontend + server use the same structure**: (1) **SSR** serializes the result of `getSystemState()` into the first paint; (2) **client** replays the same when calling `POST /api/system/monitor/refresh`. |
| **Classification** | **Frontend-computed** from a **unified in-process** call — not a separate Laravel backend, not a static JSON file for rows. (Optional) `data/audit-runtime/control-point-runtime-results.json` supplies **only** `last_checked_at` timestamps, not a second status model — see `build-monitor-points.ts`.) |

## 6. How Core System and subcategory numbers are produced (UI)

- **Group row (e.g. Core System):** `computeGroupSummary` → `controlPointsForGroupUnique` over the group’s `modules` in `lib/audit-engine/monitor-groups.ts` — **unique by CP id within the group**.
- **Subcategory row (e.g. Identity & Workspace):** `computeSubCategorySummary` → `controlPointsForModuleId` — **every CP that lists that `moduleId` in `linked_project_modules`**, not deduped with other rows.

## 7. Screenshot / network “162” evidence

- **This agent** cannot capture a **screenshot** of your browser or a **copy of your live Network** tab from the IDE.
- **Repro in this repo (CLI, same function as page):** `getFreshSystemMonitorState().controlPoints` with `computeGroupSummary` for `core-system` currently yields **fail: 19**, not 162 (evidence: `npx tsx` invocation in `validation-report.md` and `ui-vs-helper-count-comparison.md`).

**Conclusion (Task 1 proof rule):** The **source** that the UI is **wired to** in code is `getFreshSystemMonitorState` → `buildSystemMonitorControlPoints`. **Verified numeric parity with the user’s 162/18/23 UI in this working tree: not achieved** (see those files). Per mission rule, the **“162 in payload”** claim is **unproven** here.
