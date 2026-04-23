import { notFound } from "next/navigation";
import { WorkspaceModulePage } from "@/components/workspace/WorkspaceModulePage";
import { getWorkspaceModulePageByHref } from "@/data/role-workspace";

export default function AssistantHelpQueuePage() {
  const page = getWorkspaceModulePageByHref("/workspace/assistant/help-queue");
  if (!page) notFound();
  return <WorkspaceModulePage page={page} />;
}