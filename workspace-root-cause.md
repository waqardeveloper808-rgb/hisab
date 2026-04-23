# Workspace Session Root Cause

## Symptom
- Client workspace calls from `lib/workspace-api.ts` `request(...)` failed with `Workspace session is required. Please sign in to continue.`
- Failures were visible in dashboard and reports callers (`getDashboardSnapshot`, `getReportsSnapshot`).

## Trace Results
1. `request(...)` sends browser calls to `/api/workspace/<path>` with `credentials: include`.
2. `/api/workspace/[...slug]/route.ts` reads the signed session cookie (`gulf_hisab_session`) via `readAuthSessionOutcome(...)`.
3. If the session outcome is `guest`, route returns HTTP 401 with message `Workspace session is required. Please sign in to continue.`.
4. Workspace pages rendered and executed client data calls even when server session resolution was not guaranteed to be authenticated.

## Root Causes
1. **Over-strict backend-context readiness in session binding**
   - `lib/workspace-session.ts` required an inline `session.authToken` to mark session ready.
   - Real flow supports configured workspace token fallback (`GULF_HISAB_API_TOKEN` / `WORKSPACE_API_TOKEN`) but readiness gate rejected that path.
   - Result: valid logged-in cookie/session could still be treated as unusable for workspace backend requests.

2. **Over-strict cookie normalization on read**
   - `lib/auth-session.ts` cookie normalization rejected session payloads when `authToken` was not inline, even if company/user context was valid.
   - This caused legitimate session cookies to be dropped from workspace resolution pipeline.

3. **Workspace layout did not enforce authenticated access server-side**
   - `app/workspace/layout.tsx` used passive `getWorkspaceSessionAccess()` and rendered workspace tree.
   - Client components then fired `/api/workspace/*` requests before auth was enforced by redirect, surfacing 401 session errors in dashboard/reports.

4. **Access provider redirected on any session refresh failure**
   - `WorkspaceAccessProvider.tsx` redirected to login on any `/api/auth/session` failure instead of auth-only failures.
   - This made refresh/direct-route behavior fragile in transient non-auth failures.

## Lost Auth Context Point
- Auth context was effectively lost at workspace backend context validation (token/company readiness gate), then surfaced by `/api/workspace/*` as `guest`/unauthenticated behavior.

## Required Fix Direction
- Accept valid signed session + company context and use workspace token fallback in backend context resolution.
- Enforce workspace authentication server-side in layout before rendering data-fetching workspace screens.
- Restrict client redirect behavior to explicit auth failures (401/403) only.
- Preserve real auth flow (no hardcoded company IDs, no fake session, no error suppression).
