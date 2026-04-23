import { notFound } from "next/navigation";
import { WorkspaceModulePage } from "@/components/workspace/WorkspaceModulePage";
import { getWorkspaceModulePageByHref } from "@/data/role-workspace";

export default function AssistantCustomerFollowUpPage() {
  const page = getWorkspaceModulePageByHref("/workspace/assistant/customer-follow-up");
  if (!page) notFound();
  return <WorkspaceModulePage page={page} />;
}