import { WorkspaceV2CompanySettings } from "@/components/workspace-v2/WorkspaceV2CompanySettings";
import { WorkspaceV2SettingsTabs } from "@/components/workspace-v2/WorkspaceV2Settings";

export const metadata = {
  title: "Workspace V2 — Company profile",
};

export default function WorkspaceV2SettingsCompanyPage() {
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <WorkspaceV2SettingsTabs />
      </div>
      <WorkspaceV2CompanySettings />
    </div>
  );
}
