import { PlatformAgentsOverview } from "@/components/workspace/PlatformAgentsOverview";
import { requireWorkspaceAccess } from "@/lib/server-access";

export default async function AdminAgentsPage() {
  await requireWorkspaceAccess({ platform: ["platform.agents.view"] });

  return <PlatformAgentsOverview />;
}