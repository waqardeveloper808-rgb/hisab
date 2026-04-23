import { notFound } from "next/navigation";
import { WorkspaceModulePage } from "@/components/workspace/WorkspaceModulePage";
import { getWorkspaceModulePageByHref } from "@/data/role-workspace";

export default function AssistantInvoiceHelpPage() {
  const page = getWorkspaceModulePageByHref("/workspace/assistant/invoice-help");
  if (!page) notFound();
  return <WorkspaceModulePage page={page} />;
}