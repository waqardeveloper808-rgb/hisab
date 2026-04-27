import { WorkspaceFoundationPage } from "@/components/workspace/WorkspaceFoundationPage";

export const metadata = { title: "Workspace — Period closing" };

export default function Page() {
  return (
    <WorkspaceFoundationPage
      title="Period closing"
      status="FOUNDATION"
      description="End-of-period close: post net income, lock period. Rules execute on the backend; this page is a shell until a guided UI is connected."
    />
  );
}
