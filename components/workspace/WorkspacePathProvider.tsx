"use client";

import { createContext, useContext } from "react";
import { CANONICAL_USER_WORKSPACE_BASE } from "@/lib/active-workspace";

type WorkspacePathContextValue = {
  basePath: string;
};

const WorkspacePathContext = createContext<WorkspacePathContextValue>({
  basePath: CANONICAL_USER_WORKSPACE_BASE,
});

export function WorkspacePathProvider({
  value,
  children,
}: {
  value: WorkspacePathContextValue;
  children: React.ReactNode;
}) {
  return (
    <WorkspacePathContext.Provider value={value}>
      {children}
    </WorkspacePathContext.Provider>
  );
}

export function useWorkspacePath() {
  return useContext(WorkspacePathContext);
}

export { mapWorkspaceHref } from "@/lib/workspace-path";