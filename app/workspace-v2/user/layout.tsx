import { WorkspaceV2Shell } from "@/components/workspace-v2/WorkspaceV2Shell";

export default function WorkspaceV2UserLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceV2Shell>{children}</WorkspaceV2Shell>;
}
