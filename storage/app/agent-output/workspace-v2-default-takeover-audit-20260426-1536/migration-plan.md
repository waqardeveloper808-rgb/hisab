# Safe migration plan — Workspace V2 as default

**Audit date:** 2026-04-26  
**Mode:** Plan only; **no execution** in this task.

## Preconditions (non-negotiable)

- Decide whether **canonical URLs** will become `/workspace/...` (V2 implementation behind old path) or **`/workspace-v2/...`** retained as public path with redirects from legacy.
- Confirm **backend/API parity**: V2 currently leans on `data/workspace-v2/*` in many screens; old tree uses `lib/workspace-api.ts`. Default flip without API wiring will **greenlight UI** but **redshift** CPs tied to real data flows.

## 1. Route redirect strategy

| Phase | Action |
|-------|--------|
| A | Introduce **single source of truth** constant (e.g. `DEFAULT_WORKSPACE_BASE`) consumed by auth, onboarding, 404, and marketing. |
| B | Either **301/302** ` /workspace/user` → `/workspace-v2/user` (if V2 keeps its path), or **rename routes** by moving `app/workspace-v2` to `app/workspace` in a coordinated Next.js cutover. |
| C | Preserve **admin / assistant / agent** routes on old tree until parity exists; scope redirects to **end-user** paths first. |
| D | Add **compat** `/api/workspace/audit` behavior or **parallel** endpoint so monitors do not read empty/wrong JSON during transition. |

## 2. Navigation update strategy

- Replace `data/role-workspace.ts` HREFs with V2 paths **or** generate nav from `lib/workspace-v2/navigation.ts` for the user role.
- Update `components/AppFrame.tsx` and any `mapWorkspaceHref` consumers if base path changes.
- Navbar / landing: one primary **Workspace** button pointing at canonical base; keep System Monitor separate.

## 3. Old workspace deprecation strategy

| Layer | Approach |
|-------|----------|
| **User financial workflows** | Mark old registers as **legacy** in code comments/docs; route users away. |
| **Catch-all placeholder** | `app/workspace/[...slug]/page.tsx` triggers CP violations when placeholder — reduce traffic to it via redirects. |
| **API proxy** | Keep `app/api/workspace/[...slug]` until all clients migrate; log usage if possible. |
| **Admin** | Staged deprecation: do not block V2 default for standard users while admin remains on old shell **if** CP scope is narrowed. |

## 4. Control Point Engine retargeting strategy

| Component | Change |
|-----------|--------|
| `lib/audit-engine/live-collector.ts` | Point `fetchText` / `fetchJson` to **V2 audit surfaces** (new pages + APIs) or **dual-fetch** with preference for V2. |
| `backend/.../evidence-engine.ts` | Extend `getWorkspaceEvidence()` with **V2 file paths** (`WorkspaceV2Shell.tsx`, `app/workspace-v2/**`) and/or branch on active default. |
| `getControlPointEngineEvidence` | Replace or supplement `MasterDesignDashboard.tsx` proof with **V2 shell** import or neutral engine-only proof. |
| `document-engine-phase5-control-points.ts` | Add **V2** `linked_files` for template/PDF parity **or** explicit “legacy-only” scope on old CPs. |
| `control-points.v2.ts` | Update `evaluation_method` strings from `/workspace/...` to canonical paths. |
| **Violations** | Re-tune `workspace-placeholder-fallback` triggers if catch-all is legacy-only. |

## 5. Evidence / proof update strategy

- Refresh `data/system-map/actual-map.ts` / **`lib/mapping-engine.ts`** critical route lists to include **`/workspace-v2/user`** (and future merged paths).
- Update inspector tooling (e.g. `tools/inspector/runtime-debug.ts` currently uses `/workspace/user/invoices`) to default to V2 URLs.
- Regenerate or clear **`data/audit-runtime/control-point-runtime-results.json`** expectations after retargeting.

## 6. Rollback plan

| Trigger | Rollback |
|---------|----------|
| Auth loop or 404 spike | Revert **redirect** / constant to `/workspace/user` only; disable V2 default flag. |
| CP engine false criticals | Switch live collector to **legacy endpoints** via feature flag; scope monitor to “legacy workspace” module group until evidence updated. |
| API mismatch | Gate V2 default behind **“backend parity”** feature flag. |

## Success criteria (for a later execution phase)

- Post-login lands on **V2** without manual URL entry.
- System Monitor **workspace**-scoped CPs evaluate **V2** files/routes **or** explicitly exclude legacy-only CPs.
- No critical violations solely caused by **routing to deprecated** old shell while product work is in V2.
