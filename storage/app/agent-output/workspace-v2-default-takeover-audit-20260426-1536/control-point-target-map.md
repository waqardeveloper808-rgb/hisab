# Control Point Engine — target map (Workspace vs Workspace V2)

**Audit date:** 2026-04-26  
**Method:** Read-only inspection of evaluation pipeline: `control-point-execution.ts` → `evidence-engine.ts` → `build-monitor-points.ts` → optional `live-collector.ts` runtime context.

**Important:** This document maps **what the engine checks**, not live PASS/FAIL counts (no runtime monitor refresh was executed in this audit).

## Execution pipeline (evidence-first)

1. **`evaluateControlPointExecution`** (`backend/app/Support/Standards/control-point-execution.ts`) builds a `ControlPointEvidenceBundle` via **`collectControlPointEvidence`** (`evidence-engine.ts`).
2. **`buildSystemMonitorControlPoints`** (`lib/audit-engine/build-monitor-points.ts`) attaches monitor metadata, traceability, and `evaluation_method` from the standards record.
3. **`collectLiveAuditRuntimeContext`** (`lib/audit-engine/live-collector.ts`) fetches **legacy** workspace audit HTML/JSON and backend report APIs; observed values for registry controls like `CP-WSP-001` / `CP-WSP-002` embed **old** route patterns.

## Category → files / routes / evidence (auditor view)

| Area | How CPs are classified (`classifyControlPoint` in `evidence-engine.ts`) | Primary evidence sources (observed in code) | Old workspace vs V2 vs mixed |
|------|------------------------------------------------------------------------|---------------------------------------------|------------------------------|
| **Identity & Workspace** | Module codes `USR`, `ADM`, `AST`, `ACP`, `AUD`, `COM` → “Workflow CPs”; plus linked `identity-workspace` in system map | **`getWorkspaceEvidence()`**: `data/role-workspace.ts`, `data/workspace.ts`, `app/workspace/[...slug]/page.tsx`, `app/api/workspace/[...slug]/route.ts`, `lib/workspace-api.ts`. **`getControlPointEngineEvidence()`** hard-requires **`components/workspace/MasterDesignDashboard.tsx`** (System Monitor wrapper). **`collectLiveAuditRuntimeContext`**: `/workspace/admin/audit`, `/api/workspace/audit`. | **Old workspace** (no `workspace-v2` paths in this bundle) |
| **Template Engine** | `TMP`, `DOC`, `BRD` (partial) → “Document CPs” / brand | `getDocumentEvidence()`, `getBrandEvidence()` → `backend/storage/app/private/template-engine-runtime.json`, preview JSON stores. | **Mostly backend + JSON**; **UI parity not tied to V2** (`components/workspace-v2/*` not referenced) |
| **Document Engine** | `IVC`, `DOC`, `TMP` | `getDocumentEvidence()` (preview stores); **`document-engine-phase5-control-points.ts`** links **`InvoiceDetailWorkspace.tsx`**, **`DocumentViewer.tsx`**, **`app/api/workspace/[...slug]/route.ts`**. | **Old workspace** |
| **Preview / PDF parity** | Evaluator key `document-contract` (clause regex on template/preview/pdf) | Live facts: backend `documents/:id/preview` in `live-collector.ts` (not V2 React preview). UX checks use `document_preview_available` / `document_pdf_available` flags from that fetch. | **Backend + old client path assumptions**; **V2 PDF** lives in `lib/workspace-v2/exports/pdf.ts` — **not** wired into this evidence path |
| **Registers** | `ACC`, `INV`, workflow CPs with accounting/inventory clauses | `getAccountingEvidence` / `getInventoryEvidence` → preview JSON stores; backend reports: invoice register, GL, stock, VAT in `live-collector.ts`. Old UI registers under `components/workspace/*Register*.tsx`. | **Mixed**: backend truth is shared; **UI evidence** favors **old** registers |
| **Create / detail pages** | Document / workflow CPs | Static links in standards (`v2/control-points.v2.ts` evaluation text often says “Inspect `/workspace/...`”). Code violations reference **`app/workspace/[...slug]/page.tsx`**, invoice detail components. V2 lists/registers exist but are not in CP `linked_files`. | **Old** in standards text + engine violations; **V2** **unclear / absent** from CP definitions |
| **Workspace shell** | `UX`, and workspace-flow evaluator | `live-collector` derives `workspace_shell_bounded` from **legacy** audit page + compatibility API. `CP-WSP-003` observed values: shell bounded flags. V2 shell: `components/workspace-v2/WorkspaceV2Shell.tsx` — **not** referenced in `getWorkspaceEvidence`. | **Old** |
| **Route ownership** | Security / workflow placeholders | Violations: `workspace-placeholder-fallback`, `workspace-auth-fallback-banner`, `workspace-silent-backend-fallback` tied to **old** catch-all + API proxy + `lib/workspace-api.ts`. | **Old** |

## Registry control points (explicit old routes in live collector)

From `buildControlObservedValues` in `live-collector.ts`:

| Control ID | Declared route / file | Target era |
|------------|----------------------|------------|
| `CP-WSP-001` | `/workspace/admin/audit`, `app/workspace/admin/audit/page.tsx` | Old |
| `CP-WSP-002` | `/api/workspace/audit`, `app/api/workspace/audit/route.ts` | Old |
| `CP-WSP-003` | Workspace shell bounded (derived from same legacy fetches) | Old / mixed |

## Standards dataset (`control-points.v2.ts`)

Human-readable **`evaluation_method`** fields frequently instruct inspectors to open **`/workspace/...`** URLs (admin, help, agents, settings, etc.). Those instructions are **stale relative to Workspace V2** unless updated to `/workspace-v2/...` or a future canonical `/workspace/...` after route migration.

## Per “failed CP” question

Without a captured System Monitor snapshot, failed CP IDs cannot be listed authoritatively. **However**, any CP that:

- pulls **`getWorkspaceEvidence()`**,
- uses **communication** evidence (`CommunicationRegister.tsx`, `InvoiceDetailWorkspace.tsx`, `lib/workspace-api.ts`),
- or uses **document phase 5** linked files,

is **old-workspace-targeted** until definitions and `linked_files` are retargeted. CPs that only use backend JSON / PHP routes are **era-agnostic** but still **not V2-aware**.

## Stale evaluator signals (summary)

| Signal | Why stale / misleading for V2-first |
|--------|-------------------------------------|
| `getControlPointEngineEvidence` → `MasterDesignDashboard.tsx` | True by import; does not prove V2 workspace health |
| `getWorkspaceEvidence` | 100% old-tree file paths |
| `collectLiveAuditRuntimeContext` | Hard-coded `/workspace/admin/audit` + `/api/workspace/audit` |
| `control-points.v2.ts` text | Instructions reference `/workspace/*` |
