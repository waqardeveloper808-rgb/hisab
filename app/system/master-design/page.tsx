import { MasterDesignDashboard } from "@/components/system/MasterDesignDashboard";
import { getSystemState } from "@/backend/app/Support/Standards/control-point-engine";

export default async function SystemMasterDesignPage() {
  return <MasterDesignDashboard initialState={await getSystemState()} />;
}