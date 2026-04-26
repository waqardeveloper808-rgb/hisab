# Default workspace entry points

**Audit date:** 2026-04-26  
**Evidence:** Static analysis of navigation, auth, marketing, and shell configuration.

## Entry point matrix

| Entry | Location | Resolves to | Era |
|-------|----------|-------------|-----|
| **Marketing hero — “Workspace V2”** | `app/page.tsx` | `href="/workspace-v2/user"` | **V2** (visible in **all** environments from inspected code) |
| **Marketing hero — “Enter Workspace”** | `app/page.tsx` | `href="/workspace/user"` | **Old** — gated behind `process.env.NODE_ENV !== "production"` only |
| **Navbar — “System Monitor”** | `components/Navbar.tsx` | `href="/system/master-design"` | **Neither** (governance UI; uses CP engine) |
| **Navbar — “Login”** | `components/Navbar.tsx` | `/login` | N/A |
| **Navbar — dev entries** | `components/Navbar.tsx` (`devEntryLinks`, non-production) | `/workspace/user`, `/workspace-v2/user`, `/system/master-design` | **Both** + monitor |
| **Post-login redirect** | `components/auth/LoginForm.tsx` | `router.push(... "/workspace/user" ...)` when `company_id` present | **Old** |
| **Company setup completion** | `components/auth/CompanySetupWizard.tsx` | `router.push("/workspace/user?onboarding=complete")` (and skipped variant) | **Old** |
| **Workspace root** | `app/workspace/page.tsx` | `redirect("/workspace/user")` | **Old** |
| **404 assistance** | `app/not-found.tsx` | Button to `/workspace/user` | **Old** |
| **Role home / sidebar** | `data/role-workspace.ts` | `homeHref: "/workspace/user"` for user role; sidebar HREFs under `/workspace/...` | **Old** |
| **V2 in-app navigation** | `lib/workspace-v2/navigation.ts` | All links under `/workspace-v2/user/...` | **V2** |
| **App frame deep links** | `components/AppFrame.tsx` (inspected via grep) | Includes `/workspace/user/...` paths | **Old** |

## Interpretation

- **Production default user journey** after login and onboarding still lands on **`/workspace/user`** (old).
- **Workspace V2** is already a **first-class public CTA** on the landing page (`/workspace-v2/user`), but it is **not** the post-auth default.
- **System Monitor** is reachable from marketing navbar and does **not** correct the workspace split; it evaluates against evidence that still emphasizes the **old** tree (see `control-point-target-map.md`).

## Gap vs mission (“V2 default”)

To make V2 the default, **at minimum** these entry points must flip or alias:

1. `LoginForm` post-login target  
2. `CompanySetupWizard` completion / skip targets  
3. `app/workspace/page.tsx` redirect target (or retire `/workspace` root in favor of `/workspace-v2`)  
4. `data/role-workspace.ts` `homeHref` and sidebar HREFs (or generate from shared constant)  
5. `app/not-found.tsx` fallback CTA  
6. `app/page.tsx` CTA duplication (single canonical “workspace” button)
