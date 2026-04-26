import { WorkspaceV2ModulePlaceholder } from "@/components/workspace-v2/WorkspaceV2ModulePlaceholder";

export const metadata = {
  title: "Workspace V2 — Purchase returns",
};

export default function Page() {
  return (
    <WorkspaceV2ModulePlaceholder
      title="Purchase returns"
      subtitle="Return stock to a supplier and reduce payables in line with the goods movement."
      primaryLabel="New purchase return"
      moduleId="purchase-returns"
    />
  );
}
