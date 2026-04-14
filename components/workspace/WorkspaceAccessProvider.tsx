"use client";

import { createContext, useContext } from "react";
import type { WorkspaceAccessProfile } from "@/lib/workspace-api";

const WorkspaceAccessContext = createContext<WorkspaceAccessProfile | null>(null);
const WorkspaceSessionContext = createContext<{
  id: number;
  name: string;
  email: string;
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
    name: string;
    email: string;
    platformRole?: string;
  };
  children: React.ReactNode;
}) {
  return (
    <WorkspaceSessionContext.Provider value={session}>
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