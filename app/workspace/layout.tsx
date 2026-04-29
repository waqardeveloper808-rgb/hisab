import "./workspace.css";
import { WorkspaceDualShell } from "@/components/workspace/WorkspaceDualShell";
import { WorkspaceAccessProvider } from "@/components/workspace/WorkspaceAccessProvider";
import { WorkspacePathProvider } from "@/components/workspace/WorkspacePathProvider";
import { WorkspaceDataProvider } from "@/components/workflow/WorkspaceDataProvider";
import { LayoutEditorProvider } from "@/components/workspace/LayoutEditorProvider";
import { requireWorkspaceAccess } from "@/lib/server-access";
import { CANONICAL_USER_WORKSPACE_BASE } from "@/lib/active-workspace";

/** Arabic fonts load once on root `app/layout.tsx` (`--font-*` variables cascade here). */

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { session, access, accessStatus } = await requireWorkspaceAccess();

  return (
    <div className="min-h-full">
    <WorkspacePathProvider value={{ basePath: CANONICAL_USER_WORKSPACE_BASE }}>
      <WorkspaceAccessProvider value={access} session={session} accessStatus={accessStatus}>
        <WorkspaceDataProvider>
          <LayoutEditorProvider>
            <WorkspaceDualShell
              session={{
                ...session,
                activeCompanyId: session.workspaceContext?.activeCompany?.id ?? session.companyId ?? null,
                activeCompanyLegalName: session.workspaceContext?.activeCompany?.legalName ?? null,
                accessStatus,
              }}
              access={access}
            >
              {children}
            </WorkspaceDualShell>
          </LayoutEditorProvider>
        </WorkspaceDataProvider>
      </WorkspaceAccessProvider>
    </WorkspacePathProvider>
    </div>
  );
}
