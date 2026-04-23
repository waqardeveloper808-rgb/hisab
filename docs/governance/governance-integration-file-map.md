# Governance Integration File Map

## 1. Governing Source Files
1.1 `docs/governance/system-constitution.md`
1.2 `docs/governance/master-design-authority.md`
1.3 `docs/governance/master-design-v2.md`
1.4 `docs/governance/governance-precedence-matrix.md`
1.5 `docs/governance/implementation-execution-law.md`
1.6 `docs/governance/architect-dashboard-operating-model.md`
1.7 `docs/governance/module-completion-and-acceptance-law.md`
1.8 `docs/governance/governance-runtime-binding-model.md`
1.9 `docs/governance/governance-lifecycle.md`
1.10 `docs/governance/full-system-governance-integration.md`

## 2. Machine-Readable Registry Files
2.1 `docs/governance/control-point-registry.json`
2.2 `docs/governance/audit-engine-registry.json`
2.3 `docs/governance/governance-integration-registry.json`

## 3. Dashboard / Viewer Files
3.1 `components/system/MasterDesignDashboard.tsx` is a governance viewer implementation and not law.
3.2 `app/system/master-design/page.tsx` is a governance viewer route and not law.

## 4. Runtime Implementation-Only Files
4.1 `lib/control-point-audit-engine.ts`
4.2 `lib/root-cause-engine.ts`
4.3 `lib/master-design-control-points.ts`
4.4 `backend/app/Support/Standards/control-point-engine.ts`
4.5 `backend/app/Support/Standards/control-point-registry.ts`
4.6 `backend/app/Support/Standards/v2/control-points.v2.ts`
4.7 `backend/app/Support/Standards/v2/control-point-governance.ts`
4.8 `lib/audit-prompt-generator.ts`

## 5. Deprecated Legacy Files
5.1 `docs/prompts/*.md` files that duplicate or weaken governance law are deprecated as primary truth.
5.2 Any legacy master-design dashboard reference is deprecated in governance language.

## 6. Build Artifacts
6.1 `.next/` shall be treated as build output only.
6.2 Artifacts folders shall be evidence only and shall not be treated as source of truth.

## 7. Inheritance Rule
7.1 Runtime viewer files may reflect governance status.
7.2 Runtime viewer files shall not redefine governance law.
7.3 Future prompts shall reference the file map and stable clause IDs.
