import { StockRegister } from "@/components/workspace/StockRegister";

export default function InventoryPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="inventory" data-inspector-real-register="inventory">
      <StockRegister title="Inventory" detail="Live stock register and adjustment workspace." />
    </div>
  );
}
