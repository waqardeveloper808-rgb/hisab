import { notFound } from "next/navigation";
import { WorkspaceModulePage } from "@/components/workspace/WorkspaceModulePage";
import { getWorkspaceModulePageByHref } from "@/data/role-workspace";

export default function AgentActivityPage() {
  const page = getWorkspaceModulePageByHref("/workspace/agent/activity");
  if (!page) notFound();
  return <WorkspaceModulePage page={page} />;
}