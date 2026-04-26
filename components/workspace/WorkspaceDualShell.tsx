"use client";

import { usePathname } from "next/navigation";
import { WorkspaceThemeBoundary } from "@/components/workspace/WorkspaceThemeBoundary";
import { WorkspaceAppShell } from "@/components/workspace/WorkspaceAppShell";
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
 * Canonical /workspace/user/* uses the Workspace app chrome + theme.
 * Admin, assistant, agent, and other segments keep the legacy WorkspaceShell.
 */
export function WorkspaceDualShell({ session, access, children }: WorkspaceDualShellProps) {
  const pathname = usePathname() ?? "";
  const userApp = pathname === "/workspace/user" || pathname.startsWith("/workspace/user/");

  if (userApp) {
    return (
      <WorkspaceThemeBoundary>
        <WorkspaceAppShell>{children}</WorkspaceAppShell>
      </WorkspaceThemeBoundary>
    );
  }

  return (
    <WorkspaceShell session={session} access={access}>
      {children}
    </WorkspaceShell>
  );
}
