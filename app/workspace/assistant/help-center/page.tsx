import { notFound } from "next/navigation";
import { WorkspaceModulePage } from "@/components/workspace/WorkspaceModulePage";
import { getWorkspaceModulePageByHref } from "@/data/role-workspace";

export default function AssistantHelpCenterPage() {
  const page = getWorkspaceModulePageByHref("/workspace/assistant/help-center");
  if (!page) notFound();
  return <WorkspaceModulePage page={page} />;
}