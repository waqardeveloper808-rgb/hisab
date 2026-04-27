import { WorkspaceFoundationPage } from "@/components/workspace/WorkspaceFoundationPage";

export const metadata = { title: "Workspace — Fixed assets" };

export default function Page() {
  return (
    <WorkspaceFoundationPage
      title="Fixed assets"
      status="FOUNDATION"
      description="Register for capitalized assets, depreciation schedules, and disposals. Not yet backed by a dedicated posted engine in this V2 build."
      nextSteps="Planned: asset cards linked to journal lines (Dr Fixed asset / Cr Bank) and period depreciation (Dr Depreciation / Cr Accum. depreciation)."
    />
  );
}
