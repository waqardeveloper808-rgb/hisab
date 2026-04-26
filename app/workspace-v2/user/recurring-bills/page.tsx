import { WorkspaceV2ModulePlaceholder } from "@/components/workspace-v2/WorkspaceV2ModulePlaceholder";

export const metadata = {
  title: "Workspace V2 — Recurring bills",
};

export default function Page() {
  return (
    <WorkspaceV2ModulePlaceholder
      title="Recurring bills"
      subtitle="Automated schedules for known periodic supplier costs."
      primaryLabel="New recurring bill"
      moduleId="recurring-bills"
    />
  );
}
