# Route ownership (after)

| Route | Owner | Notes |
|-------|-------|--------|
| `/workspace/user` and `/workspace/user/**` (mapped pages) | **Workspace V2** UI | `WorkspaceDualShell` selects `WorkspaceV2ThemeBoundary` + `WorkspaceV2Shell` for this prefix. Pages re-export `app/workspace-v2/user/**` where wired. |
| `/workspace/user/**` (unmapped legacy-only, e.g. `customers`, `journal-entries`) | **Legacy components** inside **V2 chrome** | Old page modules still render; sidebar is V2 (`navGroups`) so some legacy modules are URL-only unless linked elsewhere. |
| `/workspace-v2/user/**` | **Alias** | Same V2 pages; `V2_BASE` links now target `/workspace/user/...`. |
| `/workspace/admin`, `/assistant`, `/agent` | **Legacy** `WorkspaceShell` | No V2 parity folder; unchanged by design this pass. |
| `/workspace/settings/templates` | Redirect | → `/workspace/user/templates/studio`. |
| **Legacy files** | Preserved | `app/workspace/**`, `components/workspace/**` not deleted. |

## HTML markers

Live collector treats canonical user workspace as V2 when response body contains `wsv2-shell` or `data-wsv2`.
