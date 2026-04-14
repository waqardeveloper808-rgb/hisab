"use client";

import { createContext, useContext } from "react";
import type { WorkspaceAccessProfile } from "@/lib/workspace-api";

const WorkspaceAccessContext = createContext<WorkspaceAccessProfile | null>(null);

export function WorkspaceAccessProvider({
  value,
  children,
}: {
  value: WorkspaceAccessProfile | null;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceAccessContext.Provider value={value}>
      {children}
    </WorkspaceAccessContext.Provider>
  );
}

export function useWorkspaceAccess() {
  return useContext(WorkspaceAccessContext);
}