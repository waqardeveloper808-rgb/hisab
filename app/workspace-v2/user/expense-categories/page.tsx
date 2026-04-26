import { WorkspaceV2ModulePlaceholder } from "@/components/workspace-v2/WorkspaceV2ModulePlaceholder";

export const metadata = {
  title: "Workspace V2 — Expense categories",
};

export default function Page() {
  return (
    <WorkspaceV2ModulePlaceholder
      title="Expense categories"
      subtitle="Map spend to the chart of accounts and reporting groups."
      primaryLabel="Add category"
      moduleId="expense-categories"
    />
  );
}
