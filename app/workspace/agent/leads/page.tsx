import { notFound } from "next/navigation";
import { WorkspaceModulePage } from "@/components/workspace/WorkspaceModulePage";
import { getWorkspaceModulePageByHref } from "@/data/role-workspace";

export default function AgentLeadsPage() {
  const page = getWorkspaceModulePageByHref("/workspace/agent/leads");
  if (!page) notFound();
  return <WorkspaceModulePage page={page} />;
}