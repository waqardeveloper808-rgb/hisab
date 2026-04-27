import { ReportPlaceholderBySlug } from "@/components/workspace/ReportPlaceholderBySlug";
import { WorkspaceReportsHub } from "@/components/workspace/WorkspaceReportsHub";

export const metadata = {
  title: "Workspace — Reports",
};

export default async function ReportCatchAllPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const path = (slug ?? []).join("/");
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-reports-catchall={path || "index"}>
      {path ? <ReportPlaceholderBySlug path={path} /> : <WorkspaceReportsHub />}
    </div>
  );
}
