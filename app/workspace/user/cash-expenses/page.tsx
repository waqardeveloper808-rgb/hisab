import { WorkspaceModulePlaceholder } from "@/components/workspace/WorkspaceModulePlaceholder";

export const metadata = {
  title: "Workspace — Cash expenses",
};

export default function Page() {
  return (
    <WorkspaceModulePlaceholder
      title="Cash expenses"
      subtitle="Quick spend recorded outside a formal supplier bill when needed."
      primaryLabel="Record cash expense"
      moduleId="cash-expenses"
    />
  );
}
