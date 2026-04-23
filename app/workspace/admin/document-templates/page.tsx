import { notFound } from "next/navigation";
import { WorkspaceModulePage } from "@/components/workspace/WorkspaceModulePage";
import { getWorkspaceModulePageByHref } from "@/data/role-workspace";

export default function AdminDocumentTemplatesPage() {
  const page = getWorkspaceModulePageByHref("/workspace/admin/document-templates");
  if (!page) notFound();
  return <WorkspaceModulePage page={page} />;
}