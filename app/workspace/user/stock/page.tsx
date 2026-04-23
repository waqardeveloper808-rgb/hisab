import Link from "next/link";
import { StockRegister } from "@/components/workspace/StockRegister";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const returnTo = Array.isArray(resolvedSearchParams.returnTo)
    ? resolvedSearchParams.returnTo[0]
    : resolvedSearchParams.returnTo;

  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="stock" className="space-y-3">
      {returnTo ? (
        <div className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2">
          <div>
            <p className="text-sm font-semibold text-ink">Inventory opened from invoice workflow</p>
            <p className="text-xs text-muted">Complete the stock action, then return to the invoice draft.</p>
          </div>
          <Link href={returnTo} className="rounded-md border border-line bg-surface-soft px-3 py-2 text-sm font-semibold text-ink hover:border-primary/30 hover:bg-white hover:text-primary">
            Return to invoice
          </Link>
        </div>
      ) : null}
      <StockRegister />
    </div>
  );
}
