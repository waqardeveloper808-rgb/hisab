# Recommended execution order (for a future implementation phase)

**Audit date:** 2026-04-26  
**Note:** Do not treat this as executed work.

1. **Define canonical URL strategy** (`/workspace` vs `/workspace-v2`) and **backend parity** gates.  
2. **Feature flag** `default_workspace=v2` in one configuration surface (env or config module).  
3. **Centralize default path** — consume from auth (`LoginForm`, `CompanySetupWizard`), `app/workspace/page.tsx`, `not-found`, and `role-workspace` `homeHref`.  
4. **Redirect hot legacy user paths** to V2 equivalents where 1:1 pages exist; document gaps.  
5. **Update `live-collector.ts`** to hit V2 audit routes (or dual-fetch with primary = V2).  
6. **Extend `evidence-engine.ts`** `getWorkspaceEvidence` + communication/document linked files for V2.  
7. **Revise CP standards text** in `control-points.v2.ts` for updated paths.  
8. **Adjust system map / mapping engine** critical routes to include V2.  
9. **Update developer tooling** (`tools/inspector/*`, any Playwright defaults).  
10. **Deprecation**: reduce traffic to `[...slug]` placeholder; monitor violation rates.  
11. **Remove flag** when CP pass rates stabilize on V2-scoped controls.

## Parallel workstreams

- **Product**: V2 feature completeness vs old user sidebar.  
- **Governance**: CP retargeting + evidence.  
- **Infra**: API namespace (`/api/workspace-v2`) only if required for monitor contracts.
