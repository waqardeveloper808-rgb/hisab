import { StockRegister } from "@/components/workspace/StockRegister";

export default function SoldMaterialsPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="sold-materials">
      <StockRegister
        inventoryFilter="trading"
        title="Sold Materials"
        detail="Sold and resale materials are filtered into their own register without creating a second inventory implementation."
      />
    </div>
  );
}