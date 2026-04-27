import { WorkspaceFoundationPage } from "@/components/workspace/WorkspaceFoundationPage";

export const metadata = { title: "Workspace — Recurring journals" };

export default function Page() {
  return (
    <WorkspaceFoundationPage
      title="Recurring journals"
      status="FOUNDATION"
      description="Template-driven periodic journals (e.g. monthly accruals). Engine scheduling not wired in UI."
    />
  );
}
