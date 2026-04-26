import { WorkspaceCompanySettings } from "@/components/workspace/WorkspaceCompanySettings";
import { WorkspaceSettingsTabs } from "@/components/workspace/WorkspaceSettingsNav";

export const metadata = {
  title: "Workspace — Company profile",
};

export default function WorkspaceSettingsCompanyPage() {
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <WorkspaceSettingsTabs />
      </div>
      <WorkspaceCompanySettings />
    </div>
  );
}
