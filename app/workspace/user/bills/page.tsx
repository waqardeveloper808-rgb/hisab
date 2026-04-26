import { WorkspaceModulePlaceholder } from "@/components/workspace/WorkspaceModulePlaceholder";

export const metadata = {
  title: "Workspace — Bills",
};

export default function Page() {
  return (
    <WorkspaceModulePlaceholder
      title="Bills"
      subtitle="Supplier bills to pay, matched to purchase receipts where applicable."
      primaryLabel="New bill"
      moduleId="bills"
    />
  );
}
