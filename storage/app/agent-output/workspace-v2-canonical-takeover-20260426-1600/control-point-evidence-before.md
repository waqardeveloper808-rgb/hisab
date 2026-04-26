# Control point / audit evidence (before)

- **`getWorkspaceEvidence()`:** `data/role-workspace.ts`, `data/workspace.ts`, `app/workspace/[...slug]/page.tsx`, `app/api/workspace/[...slug]/route.ts`, `lib/workspace-api.ts` only.
- **`collectLiveAuditRuntimeContext`:** No fetch of `/workspace/user`; shell bounded derived from admin audit + compatibility API.
- **`getControlPointEngineEvidence`:** `MasterDesignDashboard.tsx` only for UI proof line (no V2 shell reference).
