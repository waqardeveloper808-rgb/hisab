import "./workspace.css";
import { IBM_Plex_Sans_Arabic, Noto_Sans_Arabic } from "next/font/google";
import { WorkspaceDualShell } from "@/components/workspace/WorkspaceDualShell";
import { WorkspaceAccessProvider } from "@/components/workspace/WorkspaceAccessProvider";
import { WorkspacePathProvider } from "@/components/workspace/WorkspacePathProvider";
import { WorkspaceDataProvider } from "@/components/workflow/WorkspaceDataProvider";
import { LayoutEditorProvider } from "@/components/workspace/LayoutEditorProvider";
import { requireWorkspaceAccess } from "@/lib/server-access";

const fontNotoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-noto-sans-arabic",
  weight: ["400", "500", "600", "700"],
});

const fontIbmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-ibm-plex-sans-arabic",
  weight: ["400", "500", "600", "700"],
});

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { session, access, accessStatus } = await requireWorkspaceAccess();

  return (
    <div className={`${fontNotoSansArabic.variable} ${fontIbmPlexSansArabic.variable} min-h-full`}>
    <WorkspacePathProvider value={{ basePath: "/workspace" }}>
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