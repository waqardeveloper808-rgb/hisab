import { WorkspaceV2StockRegister } from "@/components/workspace-v2/WorkspaceV2StockRegister";

export const metadata = {
  title: "Workspace V2 — Products & services",
};

export default function Page() {
  return <WorkspaceV2StockRegister mode="products" />;
}
