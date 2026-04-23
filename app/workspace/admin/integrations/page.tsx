import { notFound } from "next/navigation";
import { WorkspaceModulePage } from "@/components/workspace/WorkspaceModulePage";
import { getWorkspaceModulePageByHref } from "@/data/role-workspace";

export default function AdminIntegrationsPage() {
  const page = getWorkspaceModulePageByHref("/workspace/admin/integrations");
  if (!page) notFound();
  return <WorkspaceModulePage page={page} />;
}