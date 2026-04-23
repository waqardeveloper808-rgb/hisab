# Workspace Governance File Map

Updated: 2026-04-23
Status: Workspace and UX governance classification map.

## 1. Replace With New Governance Pack

- `docs/architecture-comparison-2026-04-17.md` -> replace as reference-only comparison, not governing law
- `docs/governance/master-design-vnext-phase1.md` -> merge into the new workspace constitution pack only as historical context
- `docs/governance/prompt-engine-v4-phase1.md` -> merge into the new audit seed documents only as historical context

## 2. Retain As Runtime Or Implementation Artifacts

- `app/workspace/layout.tsx`
- `app/workspace/[...slug]/page.tsx`
- `app/workspace/user/page.tsx`
- `app/workspace/admin/page.tsx`
- `app/workspace/assistant/page.tsx`
- `app/workspace/agent/page.tsx`
- `components/workspace/WorkspaceShell.tsx`
- `components/workspace/WorkspaceModulePage.tsx`
- `components/workspace/WorkspaceRoleHeader.tsx`
- `components/workspace/UserWorkspaceHome.tsx`
- `components/workspace/InvoiceRegister.tsx`
- `components/workspace/InvoiceDetailWorkspace.tsx`
- `components/workspace/DocumentLinkPreviewModal.tsx`
- `components/workspace/LayoutEditorPanel.tsx`
- `components/workspace/StandardActionBar.tsx`
- `components/workspace/DocumentTemplatesRegister.tsx`
- `components/workspace/RegistersOverview.tsx`
- `components/workspace/ReportsOverview.tsx`
- `components/workspace/ReconciliationPage.tsx`
- `components/workspace/ReviewDashboard.tsx`
- `components/workspace/MasterDesignDashboard.tsx`
- `components/workspace/MasterDesignTree.tsx`
- `components/system/MasterDesignDashboard.tsx`
- `components/system/MasterDesignTree.tsx`
- `data/role-workspace.ts`
- `data/workspace.ts`
- `lib/workspace-api.ts`
- `lib/workspace-preview.ts`
- `lib/workspace-path.ts`
- `lib/workspace-session.ts`

## 3. Replace Naming References In Governance Language

- `MasterDesignDashboard` -> governed naming should be interpreted as implementation detail only
- `System Master Design` -> replace in governance language with Architect Dashboard where the governance surface is referenced
- `Master Design Dashboard` -> replace in governance language with Architect Dashboard

## 4. Merge / Historical Context

- `docs/architecture-comparison-2026-04-17.md`
- `data/role-workspace.ts`
- `components/workspace/WorkspaceModulePage.tsx`
- `components/workspace/WorkspaceShell.tsx`

## 5. Deprecate As Governance Truth

- `docs/architecture-comparison-2026-04-17.md` as primary authority
- `docs/governance/master-design-vnext-phase1.md` as primary authority
- `docs/governance/prompt-engine-v4-phase1.md` as primary authority
- any `Master Design Dashboard` phrasing in governance text

## 6. Runtime Code Not To Touch In This Prompt

- `app/workspace/layout.tsx`
- `app/workspace/[...slug]/page.tsx`
- `components/workspace/WorkspaceShell.tsx`
- `components/workspace/WorkspaceModulePage.tsx`
- `components/workspace/MasterDesignDashboard.tsx`
- `components/system/MasterDesignDashboard.tsx`
- `data/role-workspace.ts`
- `lib/workspace-api.ts`
- `lib/workspace-preview.ts`
- `lib/workspace-session.ts`

