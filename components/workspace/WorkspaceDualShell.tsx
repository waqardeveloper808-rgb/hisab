"use client";

import { usePathname } from "next/navigation";
import { WorkspaceV2ThemeBoundary } from "@/components/workspace-v2/WorkspaceV2ThemeBoundary";
import { WorkspaceV2Shell } from "@/components/workspace-v2/WorkspaceV2Shell";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import type { WorkspaceAccessProfile } from "@/lib/workspace-api";
import type { WorkspaceAccessStatus } from "@/lib/workspace-session";

type WorkspaceDualShellProps = {
  session: {
    id: number;
    name: string;
    email: string;
    platformRole?: string;
    activeCompanyId?: number | null;
    activeCompanyLegalName?: string | null;
    accessStatus?: WorkspaceAccessStatus;
  };
  access: WorkspaceAccessProfile | null;
  children: React.ReactNode;
};

/**
 * Canonical /workspace/user/* uses Workspace V2 chrome + theme.
 * Admin, assistant, agent, and other segments keep the legacy WorkspaceShell.
 */
export function WorkspaceDualShell({ session, access, children }: WorkspaceDualShellProps) {
  const pathname = usePathname() ?? "";
  const v2User = pathname === "/workspace/user" || pathname.startsWith("/workspace/user/");

  if (v2User) {
    return (
      <WorkspaceV2ThemeBoundary>
        <WorkspaceV2Shell>{children}</WorkspaceV2Shell>
      </WorkspaceV2ThemeBoundary>
    );
  }

  return (
    <WorkspaceShell session={session} access={access}>
      {children}
    </WorkspaceShell>
  );
}
