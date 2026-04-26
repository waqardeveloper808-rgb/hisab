# Rollback plan

1. **Revert Git changes** to `app/workspace/layout.tsx`, `lib/workspace-v2/navigation.ts`, `data/role-workspace.ts`, `app/page.tsx`, `components/Navbar.tsx`, `backend/app/Support/Standards/evidence-engine.ts`, `lib/audit-engine/live-collector.ts`, `app/workspace/settings/templates/page.tsx`, and all `app/workspace/user/**` pages touched.
2. **Remove new files:** `components/workspace/WorkspaceDualShell.tsx`, new directories under `app/workspace/user/` listed as untracked in `git status`.
3. **Restore `V2_BASE`** to `/workspace-v2/user` if rolling back navigation only.
4. **No database or API contract rollback** required (no schema changes).
5. If production already served traffic: redeploy previous artifact or Git tag.
