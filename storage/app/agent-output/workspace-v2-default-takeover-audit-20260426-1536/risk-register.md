# Risk register — Workspace V2 default takeover

**Audit date:** 2026-04-26

| ID | Risk | Likelihood | Impact | Mitigation (plan-level) |
|----|------|------------|--------|-------------------------|
| R1 | **Auth / onboarding** still push users to `/workspace/user` | High | Users never see V2 as default despite CTA | Flip `LoginForm` + `CompanySetupWizard`; single canonical base constant |
| R2 | **Live collector** probes only `/workspace/admin/audit` + `/api/workspace/audit` | High | Monitor shows FAIL/PARTIAL when V2 is healthy | Dual-target or migrate probes; version the audit API contract |
| R3 | **`getWorkspaceEvidence()`** ignores all `workspace-v2` files | High | Widespread **false** workspace CP results | Add V2 evidence items; branch on default workspace |
| R4 | **V2 demo data** vs **old API-backed** workspace | Medium | Functional regression if default flips before API wiring | Feature-flag default; parity checklist per module |
| R5 | **Admin / assistant / agent** remain on old tree only | Medium | Inconsistent “workspace” definition | Scope CP modules: split “end-user workspace” vs “staff consoles” |
| R6 | **Standards text** (`evaluation_method`) references `/workspace/...` only | Medium | Manual audits / reviewers test wrong URLs | Bulk update paths in `control-points.v2.ts` |
| R7 | **Catch-all placeholder** `app/workspace/[...slug]/page.tsx` still triggers violations | Medium | Noise in security/workspace CPs | Redirect traffic; narrow violation to “legacy tree” |
| R8 | **Bookmarked** old URLs | Low | 404 or wrong shell | Long-lived redirects from hot paths |
| R9 | **Inspector / E2E tools** hard-code old routes | Medium | CI signals diverge from product | Update `tools/*` defaults to V2 |

## Residual risk

Even with redirects, **two shells** may coexist for months. CP engine must **name which shell is in scope** per control point to avoid mixed signals.
