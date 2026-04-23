"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { WorkspaceAccessProfile } from "@/lib/workspace-api";

const WorkspaceAccessContext = createContext<WorkspaceAccessProfile | null>(null);
const WorkspaceSessionContext = createContext<{
  id: number;
  userId: number;
  name: string;
  email: string;
  authToken?: string;
  companyId?: number;
  platformRole?: string;
} | null>(null);

export function WorkspaceAccessProvider({
  value,
  session,
  children,
}: {
  value: WorkspaceAccessProfile | null;
  session: {
    id: number;
    userId: number;
    name: string;
    email: string;
    authToken?: string;
    companyId?: number;
    platformRole?: string;
  };
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [resolvedSession, setResolvedSession] = useState(session);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/session", { cache: "no-store", credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`session:${response.status}`);
        }

        const payload = await response.json() as {
          data?: {
            id: number;
            userId?: number;
            user_id?: number;
            name: string;
            email: string;
            authToken?: string;
            auth_token?: string;
            companyId?: number;
            company_id?: number;
            platformRole?: string;
          } | null;
        };

        if (!active || !payload.data) {
          return;
        }

        setResolvedSession({
          id: payload.data.id,
          userId: payload.data.userId ?? payload.data.user_id ?? payload.data.id,
          name: payload.data.name,
          email: payload.data.email,
          authToken: payload.data.authToken ?? payload.data.auth_token,
          companyId: payload.data.companyId ?? payload.data.company_id,
          platformRole: payload.data.platformRole,
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        router.replace(`/login?next=${encodeURIComponent(pathname || "/workspace/user")}`);
      });

    return () => {
      active = false;
    };
  }, [pathname, router]);

  return (
    <WorkspaceSessionContext.Provider value={resolvedSession}>
      <WorkspaceAccessContext.Provider value={value}>
        {children}
      </WorkspaceAccessContext.Provider>
    </WorkspaceSessionContext.Provider>
  );
}

export function useWorkspaceAccess() {
  return useContext(WorkspaceAccessContext);
}

export function useWorkspaceSession() {
  return useContext(WorkspaceSessionContext);
}

export function useWorkspaceMode() {
  const session = useWorkspaceSession();
  const isPreview = (session?.id ?? 0) <= 0;

  return {
    isPreview,
    isAuthenticated: !isPreview,
  };
}
