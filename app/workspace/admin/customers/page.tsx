import { PlatformCustomersOverview } from "@/components/workspace/PlatformCustomersOverview";
import { requireWorkspaceAccess } from "@/lib/server-access";

export default async function AdminCustomersPage() {
  await requireWorkspaceAccess({ platform: ["platform.customers.view"] });

  return <PlatformCustomersOverview />;
}