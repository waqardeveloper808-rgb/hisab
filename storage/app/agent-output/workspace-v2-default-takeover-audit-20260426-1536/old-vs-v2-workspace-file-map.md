# Old vs Workspace V2 — file map

**Audit date:** 2026-04-26  
**Source:** Directory listings under `C:\hisab` (glob), plus targeted file reads.

## App routes

| Area | Old (default) | Workspace V2 |
|------|---------------|--------------|
| Layout | `app/workspace/layout.tsx` | `app/workspace-v2/layout.tsx`, `app/workspace-v2/user/layout.tsx` |
| Entry redirect | `app/workspace/page.tsx` → `/workspace/user` | V2 uses `/workspace-v2/user` (see `app/workspace-v2/user/page.tsx`) |
| Catch-all | `app/workspace/[...slug]/page.tsx` | **None** under `workspace-v2` (explicit pages only) |
| User surface | `app/workspace/user/**` (many modules) | `app/workspace-v2/user/**` (subset: dashboard, registers, templates studio, import, reports, etc.) |
| Admin / agent / assistant | `app/workspace/admin/**`, `agent/**`, `assistant/**` | **No V2 equivalents** in `app/workspace-v2` tree |

## API routes

| Old | V2 |
|-----|-----|
| `app/api/workspace/[...slug]/route.ts` | **Not found** |
| `app/api/workspace/audit/route.ts` | **Not found** |
| `app/api/workspace/access-profile/route.ts` | **Not found** |

## Components

| Concern | Old | V2 |
|---------|-----|-----|
| Shell | `components/workspace/WorkspaceShell.tsx` | `components/workspace-v2/WorkspaceV2Shell.tsx` |
| Sidebar / topbar | `components/workspace/*` (many) | `WorkspaceV2Sidebar.tsx`, `WorkspaceV2Topbar.tsx` |
| Registers | `*Register.tsx` under `components/workspace/` | `WorkspaceV2Register.tsx`, `WorkspaceV2*Register.tsx` |
| Template / PDF / preview | `DocumentViewer`, `InvoiceDetailWorkspace`, layout editors | `WorkspaceV2TemplateStudio.tsx`, `WorkspaceV2DocumentPreview.tsx`, `WorkspaceV2DocumentRenderer.tsx`, `WorkspaceV2PreviewPanel.tsx` |
| System Monitor host | `components/system/MasterDesignDashboard.tsx` (re-exports monitor) | Same monitor UI — **not** duplicated under `workspace-v2` |

## Libraries

| Old | V2 |
|-----|-----|
| `lib/workspace-api.ts` (referenced heavily by audit) | No `lib/workspace-api-v2.ts` observed |
| `lib/workspace-session.ts` (used by live collector) | Shared — not V2-specific |
| `data/workspace.ts` module metadata | `lib/workspace-v2/navigation.ts` + `data/workspace-v2/*` demo data |

## Data

| Old | V2 |
|-----|-----|
| `data/workspace.ts`, `data/role-workspace.ts` | `data/workspace-v2/*.ts` (customers, invoices, templates, stock, etc.) |

## Overlap / coupling

- **Workspace V2** currently uses **local/demo datasets** under `data/workspace-v2/` for many registers and previews; **old workspace** integrates with **`lib/workspace-api.ts`** and backend proxies. Default takeover requires **explicit** decision: wire V2 to the same APIs or accept different CP expectations.
- **No** `app/api/workspace-v2/**` — V2 is largely a **frontend route slice** without a parallel API namespace in this repo snapshot.
