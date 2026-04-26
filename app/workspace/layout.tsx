import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { WorkspaceAccessProvider } from "@/components/workspace/WorkspaceAccessProvider";
import { WorkspacePathProvider } from "@/components/workspace/WorkspacePathProvider";
import { WorkspaceDataProvider } from "@/components/workflow/WorkspaceDataProvider";
import { LayoutEditorProvider } from "@/components/workspace/LayoutEditorProvider";
import { requireWorkspaceAccess } from "@/lib/server-access";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { session, access, accessStatus } = await requireWorkspaceAccess();

  return (
    <WorkspacePathProvider value={{ basePath: "/workspace" }}>
      <WorkspaceAccessProvider value={access} session={session} accessStatus={accessStatus}>
        <WorkspaceDataProvider>
          <LayoutEditorProvider>
            <WorkspaceShell session={{
              ...session,
              activeCompanyId: session.workspaceContext?.activeCompany?.id ?? session.companyId ?? null,
              activeCompanyLegalName: session.workspaceContext?.activeCompany?.legalName ?? null,
              accessStatus,
            }} access={access}>
              {children}
            </WorkspaceShell>
          </LayoutEditorProvider>
        </WorkspaceDataProvider>
      </WorkspaceAccessProvider>
    </WorkspacePathProvider>
  );
}