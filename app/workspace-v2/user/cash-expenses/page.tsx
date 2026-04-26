import { WorkspaceV2ModulePlaceholder } from "@/components/workspace-v2/WorkspaceV2ModulePlaceholder";

export const metadata = {
  title: "Workspace V2 — Cash expenses",
};

export default function Page() {
  return (
    <WorkspaceV2ModulePlaceholder
      title="Cash expenses"
      subtitle="Quick spend recorded outside a formal supplier bill when needed."
      primaryLabel="Record cash expense"
      moduleId="cash-expenses"
    />
  );
}
