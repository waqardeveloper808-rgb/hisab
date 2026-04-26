import { WorkspaceModulePlaceholder } from "@/components/workspace/WorkspaceModulePlaceholder";

export const metadata = {
  title: "Workspace — Supplier credits",
};

export default function Page() {
  return (
    <WorkspaceModulePlaceholder
      title="Supplier credits / supplier credit notes"
      subtitle="Amounts the supplier owes you or applies against future bills."
      primaryLabel="New supplier credit"
      moduleId="supplier-credits"
    />
  );
}
