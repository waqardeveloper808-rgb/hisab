import { SupportAccountsOverview } from "@/components/workspace/SupportAccountsOverview";
import { requireWorkspaceAccess } from "@/lib/server-access";

export default async function SupportAccountsPage() {
  await requireWorkspaceAccess({ platform: ["platform.support_users.manage"] });

  return <SupportAccountsOverview />;
}