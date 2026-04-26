# Current route map (before migration)

Same content as `pre-action-route-file-map.md` “before” column; see `route-ownership-before.md` for narrative summary.

| Area | File / path | Old vs V2 before |
|------|-------------|------------------|
| `/workspace/*` layout | `app/workspace/layout.tsx` | Legacy shell only |
| `/workspace/user/*` pages | `app/workspace/user/**` | Legacy components |
| `/workspace-v2/*` | `app/workspace-v2/**` | Full V2; alias URLs |
| APIs | `app/api/workspace/**` only | No `workspace-v2` API tree |
