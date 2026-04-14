import { notFound } from "next/navigation";
import { WorkspaceModulePage } from "@/components/workspace/WorkspaceModulePage";
import { findWorkspaceModulePage } from "@/data/role-workspace";

export default async function WorkspaceCatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = findWorkspaceModulePage(slug);

  if (!page) {
    notFound();
  }

  return <WorkspaceModulePage page={page} />;
}