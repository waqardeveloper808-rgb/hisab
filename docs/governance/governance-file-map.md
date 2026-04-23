# Governance File Map

Updated: 2026-04-23
Status: Replacement and deprecation map for governance sources.

## 1. Source-of-Truth Set

### 1.1 Retain as authoritative

- `docs/governance/system-constitution.md`
- `docs/governance/master-design-authority.md`
- `docs/governance/master-design-v2.md`
- `docs/governance/standards-framework-v2.md`
- `docs/governance/control-point-governance.md`
- `docs/governance/audit-engine-governance.md`
- `docs/governance/root-cause-corrective-loop.md`
- `docs/governance/architect-dashboard-governance.md`

### 1.2 Replace or bridge

- `docs/master-design.md` -> replace with deprecation bridge to `docs/governance/master-design-v2.md`
- `docs/master-design-vnext.md` -> replace with deprecation bridge to `docs/governance/system-constitution.md` and `docs/governance/master-design-v2.md`
- `docs/prompt-engine-v4.md` -> replace with deprecation bridge to `docs/governance/audit-engine-governance.md`
- `docs/governance/master-design-vnext-phase1.md` -> deprecate
- `docs/governance/prompt-engine-v4-phase1.md` -> deprecate

### 1.3 Retain as derived runtime or implementation artifacts

- `backend/app/Support/Standards/v2/control-points.v2.ts`
- `backend/app/Support/Standards/v2/control-point-schema.ts`
- `backend/app/Support/Standards/control-point-governance.ts`
- `backend/app/Support/Standards/control-point-engine.ts`
- `backend/app/Support/Audit/root-cause-engine.ts`
- `lib/control-point-audit-engine.ts`
- `lib/master-design-engine.ts`
- `lib/master-design-control-points.ts`
- `lib/root-cause-engine.ts`
- `types/master-design.ts`
- `data/master-design/hierarchy.ts`
- `data/master-design/ksa-phase1.ts`
- `data/master-design/shared-platform.ts`
- `app/system/master-design/page.tsx`
- `components/system/MasterDesignDashboard.tsx`
- `components/system/MasterDesignTree.tsx`
- `components/workspace/MasterDesignDashboard.tsx`

### 1.4 Deprecated master-design references

- `data/master-design/`
- `backend/app/Support/Standards/legacy/`
- `backend/app/Support/Standards/migration/`
- `docs/governance/phase1-task-queue.json`
- `docs/architecture-comparison-2026-04-17.md`
- `build.prompt.md`

### 1.5 Generated or build artifacts to ignore

- `.next/`
- `node_modules/`
- `dist/`
- `build/`
- `coverage/`
- `artifacts/`
- `logs/`

## 2. Inheritance Rule

- `MAP-001`: Markdown constitutional documents are the source of truth.
- `MAP-002`: Code registries and JSON files are derived artifacts.
- `MAP-003`: Build output shall never be treated as source of truth.
- `MAP-004`: `.next` artifacts are explicitly excluded from source-of-truth status.

## 3. File Replacement Rule

- `MAP-010`: Deprecated files may remain only for transition, compatibility, or historical audit reference.
- `MAP-011`: Future prompts shall cite retained authoritative files only.
- `MAP-012`: Future work shall use this map before touching old master-design artifacts.
