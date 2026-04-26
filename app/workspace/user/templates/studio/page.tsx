import { WorkspaceTemplateStudio } from "@/components/workspace/WorkspaceTemplateStudio";

type SearchParams = { template?: string };

type Props = {
  searchParams: Promise<SearchParams>;
};

export const metadata = {
  title: "Workspace — Template studio",
};

export default async function WorkspaceTemplateStudioPage({ searchParams }: Props) {
  const params = await searchParams;
  return <WorkspaceTemplateStudio templateId={params?.template} />;
}
