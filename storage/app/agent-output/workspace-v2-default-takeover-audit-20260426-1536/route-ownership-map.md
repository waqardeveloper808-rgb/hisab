# Route ownership map — Workspace vs Workspace V2

**Audit date:** 2026-04-26  
**Scope:** Next.js `app/` routes, primary API proxies, navigation owners.

## Summary counts (from repository structure)

| Surface | Pattern | Approx. pages / routes |
|--------|---------|-------------------------|
| Old / default workspace | `app/workspace/**` | Large tree (user, admin, assistant, agent, invoices, bills, catch-all `[...slug]`, etc.) |
| Workspace V2 | `app/workspace-v2/**` | Smaller tree under `workspace-v2/user/**` |
| Old workspace API | `app/api/workspace/**` | `access-profile`, `audit`, `[...slug]` proxy |
| Workspace V2 API | `app/api/workspace-v2/**` | **Not present** (no matching files under `app/api`) |

## Route family table

| Route (family) | Current owner (implementation) | Old or V2 | Used by navigation? | Used by System Monitor / audit runtime? | Should become default? | Migration action |
|----------------|----------------------------------|-----------|---------------------|----------------------------------------|-------------------------|------------------|
| `/workspace` | `app/workspace/page.tsx` → redirects to `/workspace/user` | Old | Yes (`data/role-workspace.ts`, `data/workspace.ts`) | Indirectly (identity module critical routes list legacy paths) | **No** (replace with V2 entry or redirect) | Point root to V2 home; keep legacy path as alias during transition |
| `/workspace/user/**` | `app/workspace/user/**` + `components/workspace/*` | Old | Yes (primary role sidebar in `data/role-workspace.ts`) | Evidence + evaluators assume these HREFs | **No** | Map each V2 feature to `/workspace-v2/user/...` or unified `/workspace/...` after rename |
| `/workspace/admin/**` (incl. `/workspace/admin/audit`) | `app/workspace/admin/**` | Old | Yes (admin role nav) | **Yes** — live collector fetches this HTML for workspace shell / audit signals | Partial (admin may stay on old shell until parity) | Retarget live audit to V2-equivalent admin surface **or** keep admin on old tree but exclude from “product default” health |
| `/workspace/invoices/**`, `/workspace/bills/**` | Old document/detail routes | Old | Yes | Document / PDF CPs linked to `InvoiceDetailWorkspace`, `app/workspace/invoices/[documentId]/**` | **No** for V2-first product | Add V2 detail routes or redirect; update CP linked_files |
| `/workspace/[...slug]` | `app/workspace/[...slug]/page.tsx` | Old (catch-all) | Yes (module pages) | Violations if placeholder fallback (`evidence-engine`) | **No** | Reduce reliance; align “route truth” with V2 |
| `/api/workspace/audit` | `app/api/workspace/audit/route.ts` | Old | No (API) | **Yes** — `live-collector.ts` requires JSON with `compatibility-shell` substring | **No** as sole signal | Add `/api/workspace-v2/audit` or versioned contract; point collector at default workspace |
| `/api/workspace/[...slug]` | `app/api/workspace/[...slug]/route.ts` | Old | No | **Yes** — static analysis in `evidence-engine` | **No** as only proxy | Mirror or migrate proxy when V2 becomes default |
| `/workspace-v2` / `/workspace-v2/user/**` | `app/workspace-v2/**`, `WorkspaceV2Shell`, `lib/workspace-v2/navigation.ts` | V2 | Yes (V2 sidebar + marketing CTA) | **Not** in current live collector / workspace evidence bundle | **Yes** (product intent) | Promote to canonical URLs; update all HREFs and audits |

## Evidence citations

- Root workspace redirect: `app/workspace/page.tsx` → `redirect("/workspace/user")`.
- V2 nav base: `lib/workspace-v2/navigation.ts` (`V2_BASE = "/workspace-v2/user"`).
- Live audit HTTP probes (old only): `lib/audit-engine/live-collector.ts` (fetches `/workspace/admin/audit`, `/api/workspace/audit`).

## Notes

- **System Monitor UI** is hosted at `/system/master-design` (`app/system/master-design/page.tsx`); it consumes `getFreshSystemMonitorState` / control point engine output, not a workspace route, but **workspace health signals** inside that pipeline still target legacy workspace URLs as above.
