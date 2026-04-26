import { WorkspaceModulePlaceholder } from "@/components/workspace/WorkspaceModulePlaceholder";

export const metadata = {
  title: "Workspace — Expense categories",
};

export default function Page() {
  return (
    <WorkspaceModulePlaceholder
      title="Expense categories"
      subtitle="Map spend to the chart of accounts and reporting groups."
      primaryLabel="Add category"
      moduleId="expense-categories"
    />
  );
}
