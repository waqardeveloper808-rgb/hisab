import { WorkspaceStockRegister } from "@/components/workspace/WorkspaceStockRegister";

export const metadata = {
  title: "Workspace — Products & services",
};

export default function Page() {
  return <WorkspaceStockRegister mode="products" />;
}
