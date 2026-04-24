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
        // #region agent log
        fetch('http://127.0.0.1:7465/ingest/b2483e75-3306-45a2-911d-fd8fcd98d8f8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b10564'},body:JSON.stringify({sessionId:'b10564',runId:'identity-entry-1',hypothesisId:'H5',location:'components/workspace/WorkspaceAccessProvider.tsx:45',message:'Workspace access provider received session response',data:{pathname:pathname||null,status:response.status,ok:response.ok,initialSessionId:session.id,initialCompanyId:session.companyId??null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error(`session:${response.status}`);
          }

          return;
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

        // #region agent log
        fetch('http://127.0.0.1:7465/ingest/b2483e75-3306-45a2-911d-fd8fcd98d8f8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b10564'},body:JSON.stringify({sessionId:'b10564',runId:'identity-entry-1',hypothesisId:'H5',location:'components/workspace/WorkspaceAccessProvider.tsx:71',message:'Workspace access provider accepted session payload',data:{pathname:pathname||null,responseSessionId:payload.data.id,responseCompanyId:payload.data.companyId??payload.data.company_id??null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

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
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "";

        // #region agent log
        fetch('http://127.0.0.1:7465/ingest/b2483e75-3306-45a2-911d-fd8fcd98d8f8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b10564'},body:JSON.stringify({sessionId:'b10564',runId:'identity-entry-1',hypothesisId:'H4',location:'components/workspace/WorkspaceAccessProvider.tsx:83',message:'Workspace access provider session fetch failed',data:{pathname:pathname||null,message},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        if (!message.startsWith("session:")) {
          return;
        }

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
