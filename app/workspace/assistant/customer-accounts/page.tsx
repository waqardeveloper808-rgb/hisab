import { notFound } from "next/navigation";
import { WorkspaceModulePage } from "@/components/workspace/WorkspaceModulePage";
import { getWorkspaceModulePageByHref } from "@/data/role-workspace";

export default function AssistantCustomerAccountsPage() {
  const page = getWorkspaceModulePageByHref("/workspace/assistant/customer-accounts");
  if (!page) notFound();
  return <WorkspaceModulePage page={page} />;
}