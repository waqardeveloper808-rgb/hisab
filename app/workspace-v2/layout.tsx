import "./v2.css";
import { WorkspaceV2ThemeBoundary } from "@/components/workspace-v2/WorkspaceV2ThemeBoundary";

export default function WorkspaceV2Layout({ children }: { children: React.ReactNode }) {
  return <WorkspaceV2ThemeBoundary>{children}</WorkspaceV2ThemeBoundary>;
}
