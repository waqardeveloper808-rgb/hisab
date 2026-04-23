import { notFound } from "next/navigation";
import { WorkspaceModulePage } from "@/components/workspace/WorkspaceModulePage";
import { getWorkspaceModulePageByHref } from "@/data/role-workspace";

export default function AssistantOnboardingPage() {
  const page = getWorkspaceModulePageByHref("/workspace/assistant/onboarding");
  if (!page) notFound();
  return <WorkspaceModulePage page={page} />;
}