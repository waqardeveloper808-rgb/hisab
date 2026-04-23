import { notFound } from "next/navigation";
import { WorkspaceModulePage } from "@/components/workspace/WorkspaceModulePage";
import { getWorkspaceModulePageByHref } from "@/data/role-workspace";

export default function AdminAccessManagementPage() {
  const page = getWorkspaceModulePageByHref("/workspace/admin/access-management");
  if (!page) notFound();
  return <WorkspaceModulePage page={page} />;
}