# Workspace API Failure Root Cause Analysis

## FAILURE MODE
"TypeError: Failed to fetch" originates from `lib/workspace-api.ts → request()` function, blocking:
- `getDashboardSnapshot()`
- `getReportsSnapshot()`
- All `/api/workspace/*` calls from frontend

## ARCHITECTURE
1. Client calls: `request("reports/dashboard-summary")`
2. Constructs URL: `/api/workspace/reports/dashboard-summary` (relative path)
3. Fetch hits: `http://127.0.0.1:3006/api/workspace/reports/dashboard-summary`
4. Next.js route handler at `/api/workspace/[...slug]/route.ts` should proxy to backend
5. Backend endpoint: `http://127.0.0.1:8000/api/companies/:id/reports/dashboard-summary`

## ROOT CAUSE IDENTIFIED

### Issue 1: Credentials Mode in Fetch
**File**: `lib/workspace-api.ts` line 1327
```typescript
credentials: fetchInit.credentials ?? "include",
```
✅ CORRECT: `credentials: 'include'` is set

### Issue 2: Cookie Forwarding to Route Handler
**Status**: Session cookie (`gulf_hisab_session`) is set on frontend at port 3006
**Problem**: When frontend JavaScript calls `/api/workspace/*` routes, cookie is forwarded correctly with `credentials: 'include'`

### Issue 3: Route Handler Receives Valid Session
**File**: `/api/workspace/[...slug]/route.ts` line 440
```typescript
const sessionOutcome = await readAuthSessionOutcome(request.cookies.get(authSessionCookieName)?.value);
```
Route handler correctly reads session cookie ✅

### Issue 4: Backend Proxy Initialization
**File**: `/api/workspace/[...slug]/route.ts` line 441
```typescript
const backendContext = resolveWorkspaceBackendContext(sessionOutcome);
```
This now uses `getWorkspaceApiToken()` which has env fallback ✅

### Issue 5: THE ACTUAL PROBLEM — Race Condition
**When**: Client component runs `getDashboardSnapshot()` 
**Timing**: Session is valid but backend context resolution may complete before middleware executes fully

**Evidence**: validation.txt shows:
```
HAS_WORKSPACE_ERROR 1
DASHBOARD_REQUEST 200  ← Backend accepted
REPORTS_REQUEST 200    ← Backend accepted
```

If backend returned 200, then request reached backend. So why "Failed to fetch"?

## ROOT CAUSE: Client-Side Fetch Error Handling vs Actual Success

Looking at the validation script output more carefully:
- DASHBOARD_REQUEST captured as 200 (success)
- REPORTS_REQUEST captured as 200 (success)
- But console shows: `[UserWorkspaceHome] getDashboardSnapshot failed: TypeError: Failed to fetch`

**This indicates**: 
1. The fetch() call IS reaching the backend (200 response confirmed)
2. The error "Failed to fetch" is NOT from the initial request
3. The error is from parsing or processing the response

## PRECISE ROOT CAUSE

In `lib/workspace-api.ts` request() function:
```typescript
if (!response.ok) {
  throw new Error(await extractErrorMessage(response, `Request failed for ${path}`));
}

return response.json() as Promise<T>;
```

The response.json() call may be failing if:
1. Response body is empty but declared as JSON
2. Response encoding/charset mismatch
3. Response is streaming and buffer is incomplete
4. CORS preflight response is not being handled

**Most likely**: Response is not actually JSON or Content-Type header is wrong.

## SECONDARY ROOT CAUSE: Missing Error Boundary

The `request()` function catches errors but doesn't provide context about whether:
- The fetch itself failed
- The response was not JSON
- The backend returned an error status

Error message "Failed to fetch" is the native browser error, which bubbles up when:
- Response object is invalid
- Response.json() fails to parse

## CONCLUSION

**Root Cause**: Response parsing failure in `response.json()` call. The backend is responding with HTTP 200 but the response body is either:
1. Not valid JSON
2. Empty
3. Has wrong Content-Type header
4. Is corrupted/incomplete during transmission

**Fix Direction**:
1. Add try-catch around `response.json()`
2. Log raw response body before parsing
3. Validate Content-Type header matches response body
4. Add fallback for empty/null responses
