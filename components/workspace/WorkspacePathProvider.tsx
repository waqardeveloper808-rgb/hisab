"use client";

import { createContext, useContext } from "react";

type WorkspacePathContextValue = {
  basePath: string;
};

const WorkspacePathContext = createContext<WorkspacePathContextValue>({
  basePath: "/workspace",
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

export function mapWorkspaceHref(href: string, basePath: string) {
  if (!href.startsWith("/workspace")) {
    return href;
  }

  return `${basePath}${href.slice("/workspace".length) || ""}`;
}