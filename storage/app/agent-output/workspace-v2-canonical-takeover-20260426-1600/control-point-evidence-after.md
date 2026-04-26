# Control point / audit evidence (after)

## Static (`evidence-engine.ts`)

- New **`canonicalWorkspaceV2StaticEvidence`** block (filesystem): `WorkspaceDualShell.tsx`, `navigation.ts` (`V2_BASE = "/workspace/user"`), `app/workspace/user/page.tsx` re-export probe, `WorkspaceV2Shell.tsx`.
- **`getWorkspaceEvidence()`** adds four items: canonical V2 router, V2 navigation base, canonical home re-export, V2 shell component.
- **`getControlPointEngineEvidence()`** adds `WorkspaceDualShell.tsx` line.

## Live (`live-collector.ts`)

- Fetches **`GET /workspace/user`** alongside existing probes.
- **`canonical_user_workspace_v2_surface`**: response includes `wsv2-shell` or `data-wsv2`.
- **`workspace_shell_bounded`**, **`workspace_route_owner_present`**: use admin audit **or** canonical V2 user surface + compatibility API + session.
- **`route_html_by_path` / `route_status_by_path`**: include `/workspace/user`.
- **`CP-WSP-001` observed values**: `canonical_user_route`, `canonical_user_workspace_v2_surface`, implementation note for re-exports.

## System Monitor JSON

- Refresh payload contains evidence labels **`Canonical user workspace V2 router`** and references **`WorkspaceDualShell`** (verified via string search on `system-monitor-refresh-after.json`).
