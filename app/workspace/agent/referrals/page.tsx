import { notFound } from "next/navigation";
import { WorkspaceModulePage } from "@/components/workspace/WorkspaceModulePage";
import { getWorkspaceModulePageByHref } from "@/data/role-workspace";

export default function AgentReferralsPage() {
  const page = getWorkspaceModulePageByHref("/workspace/agent/referrals");
  if (!page) notFound();
  return <WorkspaceModulePage page={page} />;
}