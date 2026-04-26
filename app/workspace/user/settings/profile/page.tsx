import { WorkspaceUserProfile } from "@/components/workspace/WorkspaceUserProfile";
import { WorkspaceSettingsTabs } from "@/components/workspace/WorkspaceSettingsNav";

export const metadata = {
  title: "Workspace — User profile",
};

export default function WorkspaceSettingsProfilePage() {
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <WorkspaceSettingsTabs />
      </div>
      <WorkspaceUserProfile />
    </div>
  );
}
