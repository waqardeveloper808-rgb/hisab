import { ArchitectDashboard } from "@/components/system/MasterDesignDashboard";
import { getSystemState } from "@/backend/app/Support/Standards/control-point-engine";

export default async function ArchitectDashboardPage() {
  return <ArchitectDashboard initialState={await getSystemState()} />;
}
