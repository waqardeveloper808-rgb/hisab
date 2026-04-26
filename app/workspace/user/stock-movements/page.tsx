import { WorkspaceStockRegister } from "@/components/workspace/WorkspaceStockRegister";

export const metadata = {
  title: "Workspace — Stock movements",
};

export default function Page() {
  return <WorkspaceStockRegister mode="stock" />;
}
