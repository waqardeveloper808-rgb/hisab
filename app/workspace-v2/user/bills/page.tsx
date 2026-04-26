import { WorkspaceV2ModulePlaceholder } from "@/components/workspace-v2/WorkspaceV2ModulePlaceholder";

export const metadata = {
  title: "Workspace V2 — Bills",
};

export default function Page() {
  return (
    <WorkspaceV2ModulePlaceholder
      title="Bills"
      subtitle="Supplier bills to pay, matched to purchase receipts where applicable."
      primaryLabel="New bill"
      moduleId="bills"
    />
  );
}
