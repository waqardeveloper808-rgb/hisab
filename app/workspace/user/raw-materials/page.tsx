import { StockRegister } from "@/components/workspace/StockRegister";

export default function RawMaterialsPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="raw-materials">
      <StockRegister
        inventoryFilter="raw_material"
        title="Raw Materials"
        detail="Raw-material inventory stays connected to the same stock, journal, and document model used by the main stock register."
      />
    </div>
  );
}