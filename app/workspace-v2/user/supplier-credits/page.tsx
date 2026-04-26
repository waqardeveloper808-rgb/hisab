import { WorkspaceV2ModulePlaceholder } from "@/components/workspace-v2/WorkspaceV2ModulePlaceholder";

export const metadata = {
  title: "Workspace V2 — Supplier credits",
};

export default function Page() {
  return (
    <WorkspaceV2ModulePlaceholder
      title="Supplier credits / supplier credit notes"
      subtitle="Amounts the supplier owes you or applies against future bills."
      primaryLabel="New supplier credit"
      moduleId="supplier-credits"
    />
  );
}
