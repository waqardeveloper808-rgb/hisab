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

/** Matches WorkspaceThemeBoundary + WorkspaceAppSidebar/top bar chrome (`data-wsv2`). */
function pathnameUsesWorkspaceAppChrome(pathname: string): boolean {
  if (pathname === "/workspace/user" || pathname.startsWith("/workspace/user/")) return true;
  /** Ledger/Books/COA/account overview historically mounted outside `/user`; share NEW chrome anyway until routed exclusively via canonical URLs. */
  if (pathname === "/workspace/accounting" || pathname.startsWith("/workspace/accounting/")) return true;
  return false;
}

/**
 * Canonical /workspace/user/* uses the Workspace app chrome + theme.
 * Legacy `/workspace/accounting/*` uses the same app chrome (Books, COA, overview).
 * Admin, assistant, agent, invoices/bills shells, etc. keep the legacy WorkspaceShell until migrated.
 */
export function WorkspaceDualShell({ session, access, children }: WorkspaceDualShellProps) {
  const pathname = usePathname() ?? "";
  const userApp = pathnameUsesWorkspaceAppChrome(pathname);

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
