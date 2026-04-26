import { WorkspaceV2Profile } from "@/components/workspace-v2/WorkspaceV2Profile";
import { WorkspaceV2SettingsTabs } from "@/components/workspace-v2/WorkspaceV2Settings";

export const metadata = {
  title: "Workspace V2 — User profile",
};

export default function WorkspaceV2SettingsProfilePage() {
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <WorkspaceV2SettingsTabs />
      </div>
      <WorkspaceV2Profile />
    </div>
  );
}
