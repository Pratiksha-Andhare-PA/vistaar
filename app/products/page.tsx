
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProductList } from "@/components/products/product-list";

export default function ProductsPage() {
  return (
    <DashboardShell>
      <ProductList />
    </DashboardShell>
  );
}
