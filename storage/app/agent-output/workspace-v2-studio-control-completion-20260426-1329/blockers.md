# Blockers (repository-wide, not V2 Studio–specific)

Running `npx tsc --noEmit` from the repo root still fails on files outside the Workspace V2 Template Studio surface (e.g. API routes, unrelated components, tests).

Workspace V2 paths touched for this work did not appear in the filtered `tsc` output after fixing `mergeTemplateUi` → `infoCardLayout` typing in `lib/workspace-v2/template-ui-settings.ts`.
