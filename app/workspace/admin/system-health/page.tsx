import { notFound } from "next/navigation";
import { WorkspaceModulePage } from "@/components/workspace/WorkspaceModulePage";
import { getWorkspaceModulePageByHref } from "@/data/role-workspace";

export default function AdminSystemHealthPage() {
  const page = getWorkspaceModulePageByHref("/workspace/admin/system-health");

  if (!page) {
    notFound();
  }

  return <WorkspaceModulePage page={page} />;
}