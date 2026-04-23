import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { WorkspaceAccessProvider } from "@/components/workspace/WorkspaceAccessProvider";
import { WorkspacePathProvider } from "@/components/workspace/WorkspacePathProvider";
import { WorkspaceDataProvider } from "@/components/workflow/WorkspaceDataProvider";
import { LayoutEditorProvider } from "@/components/workspace/LayoutEditorProvider";
import { getWorkspaceSessionAccess } from "@/lib/server-access";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { session, access } = await getWorkspaceSessionAccess();

  return (
    <WorkspacePathProvider value={{ basePath: "/workspace" }}>
      <WorkspaceAccessProvider value={access} session={session}>
        <WorkspaceDataProvider>
          <LayoutEditorProvider>
            <WorkspaceShell session={session} access={access}>{children}</WorkspaceShell>
          </LayoutEditorProvider>
        </WorkspaceDataProvider>
      </WorkspaceAccessProvider>
    </WorkspacePathProvider>
  );
}