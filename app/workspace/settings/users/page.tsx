import { CompanyUsersOverview } from "@/components/workspace/CompanyUsersOverview";
import { requireWorkspaceAccess } from "@/lib/server-access";

export default async function CompanyUsersPage() {
  await requireWorkspaceAccess({ company: ["company.users.manage"] });

  return <CompanyUsersOverview />;
}