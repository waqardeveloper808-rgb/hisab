# Files inspected (read or structurally listed)

**Audit date:** 2026-04-26  
**Repository root:** `C:\hisab`

## Glob / directory inventory

- `app/**/workspace/**/*.{tsx,ts}`  
- `app/**/workspace-v2/**/*.{tsx,ts}`  
- `app/api/workspace/**/*`  
- `components/**/workspace*/**/*`  
- `lib/**/workspace*/**/*`  
- `data/**/workspace*/**/*`  
- `middleware.ts` (search: **none** at repo root pattern)  
- `app/system/master-design/**/*`

## Read in full or in substantial part

- `backend/app/Support/Standards/control-point-engine.ts`  
- `backend/app/Support/Standards/control-point-execution.ts`  
- `backend/app/Support/Standards/evidence-engine.ts` (sections: `getWorkspaceEvidence`, `collectControlPointEvidence`, `classifyControlPoint`, `getEvaluatorKey`, violations builder)  
- `lib/audit-engine/build-monitor-points.ts`  
- `lib/audit-engine/live-collector.ts`  
- `lib/workspace-v2/navigation.ts`  
- `components/auth/LoginForm.tsx`  
- `components/Navbar.tsx`  
- `app/page.tsx`  
- `app/workspace/page.tsx`  
- `data/role-workspace.ts` (header + user role block)  
- `data/system-map/actual-map.ts` (header + identity-workspace module)  
- `components/system/MasterDesignDashboard.tsx`  

## Grep-assisted (pattern hits reviewed)

- `/workspace-v2`, `/workspace` references across `*.ts` / `*.tsx` (sampled lines)  
- `control-point` / `SystemMonitor` discovery under `lib/`, `backend/`, `components/`  

## Not inspected

- `node_modules/`, `.next/`, full contents of `backend/app/Support/Standards/v2/control-points.v2.ts` (large file; sampled via grep only)  
- `control-points-master.ts` (extremely large; sampled via grep only)  
- Runtime System Monitor output / browser console  
