import { StockRegister } from "@/components/workspace/StockRegister";

export default function ConsumablesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="consumables">
      <StockRegister
        inventoryFilter="consumables"
        title="Consumables"
        detail="Consumables use the same register infrastructure while surfacing their own operational slice for review and replenishment."
      />
    </div>
  );
}