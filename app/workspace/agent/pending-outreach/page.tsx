import { notFound } from "next/navigation";
import { WorkspaceModulePage } from "@/components/workspace/WorkspaceModulePage";
import { getWorkspaceModulePageByHref } from "@/data/role-workspace";

export default function AgentPendingOutreachPage() {
  const page = getWorkspaceModulePageByHref("/workspace/agent/pending-outreach");
  if (!page) notFound();
  return <WorkspaceModulePage page={page} />;
}