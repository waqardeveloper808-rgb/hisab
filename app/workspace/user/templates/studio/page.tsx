import { WorkspaceTemplateStudio } from "@/components/workspace/WorkspaceTemplateStudio";
import type { TemplateStyle } from "@/lib/workspace/document-template-schemas";

type SearchParams = {
  template?: string;
  templateId?: string;
  style?: string;
  documentType?: string;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export const metadata = {
  title: "Workspace — Template studio",
};

export default async function WorkspaceTemplateStudioPage({ searchParams }: Props) {
  const params = await searchParams;
  const templateKey = params?.templateId ?? params?.template;
  const styleRaw = params?.style;
  const initialStyle =
    styleRaw === "standard" || styleRaw === "modern" || styleRaw === "compact"
      ? (styleRaw as TemplateStyle)
      : undefined;

  return (
    <WorkspaceTemplateStudio
      templateId={templateKey}
      initialStyle={initialStyle}
      documentTypeParam={params?.documentType}
    />
  );
}
