# Route ownership (before)

- **Canonical `/workspace/user`:** Legacy `WorkspaceShell` + legacy page components.
- **`/workspace-v2/user`:** Workspace V2 shell + V2 pages; `V2_BASE` pointed at alias.
- **Control Point live probes:** `/workspace/admin/audit`, `/api/workspace/audit` only for workspace HTML signals.
- **Evidence `getWorkspaceEvidence`:** No Workspace V2 file references.

(See prior audit `workspace-v2-default-takeover-audit-20260426-1536` for detail.)
