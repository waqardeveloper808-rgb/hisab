import { WorkspaceModulePlaceholder } from "@/components/workspace/WorkspaceModulePlaceholder";

export const metadata = {
  title: "Workspace — Purchase returns",
};

export default function Page() {
  return (
    <WorkspaceModulePlaceholder
      title="Purchase returns"
      subtitle="Return stock to a supplier and reduce payables in line with the goods movement."
      primaryLabel="New purchase return"
      moduleId="purchase-returns"
    />
  );
}
