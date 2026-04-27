import { WorkspaceFoundationPage } from "@/components/workspace/WorkspaceFoundationPage";

export const metadata = { title: "Workspace — Manual journal templates" };

export default function Page() {
  return (
    <WorkspaceFoundationPage
      title="Manual journal templates"
      status="FOUNDATION"
      description="Reusable line templates for one-click manual journals. Storage and application layer pending."
    />
  );
}
