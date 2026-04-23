import { PlansOverview } from "@/components/workspace/PlansOverview";
import { requireWorkspaceAccess } from "@/lib/server-access";

export default async function AdminPlansPage() {
  await requireWorkspaceAccess({ platform: ["platform.plans.view"] });

  return <PlansOverview />;
}