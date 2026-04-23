import { redirect } from "next/navigation";
import { AgentOverview } from "@/components/workspace/AgentOverview";
import { canAccessWorkspaceArea } from "@/lib/access-control";
import { getWorkspaceSessionAccess } from "@/lib/server-access";

export default async function AgentsPage() {
  const { access } = await getWorkspaceSessionAccess();

  if (!canAccessWorkspaceArea(access, { company: ["workspace.agents.view"], platform: ["platform.agents.view"] })) {
    redirect("/workspace/dashboard");
  }

  return <AgentOverview />;
}