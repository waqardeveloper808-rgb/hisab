import { StockRegister } from "@/components/workspace/StockRegister";

export default function FinishedMaterialsPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="finished-materials">
      <StockRegister
        inventoryFilter="finished_good"
        title="Finished Materials"
        detail="Finished goods are isolated here without breaking the shared intake, audit, document, and accounting linkage model."
      />
    </div>
  );
}