import { ProductsServicesRegister } from "@/components/workspace/ProductsServicesRegister";

export default function UserProductsPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="products" data-inspector-real-register="products">
      <ProductsServicesRegister />
    </div>
  );
}