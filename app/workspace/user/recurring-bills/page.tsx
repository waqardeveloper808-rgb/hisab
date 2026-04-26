import { WorkspaceModulePlaceholder } from "@/components/workspace/WorkspaceModulePlaceholder";

export const metadata = {
  title: "Workspace — Recurring bills",
};

export default function Page() {
  return (
    <WorkspaceModulePlaceholder
      title="Recurring bills"
      subtitle="Automated schedules for known periodic supplier costs."
      primaryLabel="New recurring bill"
      moduleId="recurring-bills"
    />
  );
}
