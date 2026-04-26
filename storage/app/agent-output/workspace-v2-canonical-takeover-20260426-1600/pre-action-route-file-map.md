# Pre-action route / file map (summary)

| Area | File / path | Era before change | Planned action |
|------|-------------|-------------------|----------------|
| Workspace layout | `app/workspace/layout.tsx` | Legacy `WorkspaceShell` only | `WorkspaceDualShell` + `v2.css`; V2 chrome for `/workspace/user/*` |
| User home | `app/workspace/user/page.tsx` | `UserWorkspaceHome` | Re-export V2 dashboard |
| User feature pages | `app/workspace/user/**/page.tsx` (overlap) | Legacy registers | Re-export matching `app/workspace-v2/user/**` |
| User new paths | — | Missing under canonical tree | Add re-export-only routes (customer-payments, templates/studio, etc.) |
| V2 alias | `app/workspace-v2/**` | Full V2 tree | Unchanged; redirects updated to canonical `/workspace/user/...` |
| Navigation | `lib/workspace-v2/navigation.ts` | `V2_BASE = /workspace-v2/user` | `V2_BASE = /workspace/user`, `V2_ALIAS_BASE` |
| Settings templates | `app/workspace/settings/templates/page.tsx` | `DocumentTemplatesRegister` | Redirect to `/workspace/user/templates/studio` |
| Evidence | `backend/.../evidence-engine.ts` | Old workspace files only | Add V2 + `WorkspaceDualShell` static evidence |
| Live collector | `lib/audit-engine/live-collector.ts` | Admin audit HTML only | Also fetch `/workspace/user`; `canonical_user_workspace_v2_surface` |
| Admin / assistant / agent | `app/workspace/admin/**` etc. | Legacy shell | **Unchanged** (no V2 admin tree in repo) |
