import { notFound } from "next/navigation";
import { WorkspaceModulePage } from "@/components/workspace/WorkspaceModulePage";
import { getWorkspaceModulePageByHref } from "@/data/role-workspace";

export default function AdminCompanyReviewsPage() {
  const page = getWorkspaceModulePageByHref("/workspace/admin/company-reviews");
  if (!page) notFound();
  return <WorkspaceModulePage page={page} />;
}