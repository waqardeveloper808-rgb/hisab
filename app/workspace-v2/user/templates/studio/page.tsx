import { WorkspaceV2TemplateStudio } from "@/components/workspace-v2/WorkspaceV2TemplateStudio";

type SearchParams = { template?: string };

type Props = {
  searchParams: Promise<SearchParams>;
};

export const metadata = {
  title: "Workspace V2 — Template studio",
};

export default async function WorkspaceV2TemplateStudioPage({ searchParams }: Props) {
  const params = await searchParams;
  return <WorkspaceV2TemplateStudio templateId={params?.template} />;
}
