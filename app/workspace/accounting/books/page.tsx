import { permanentRedirect } from "next/navigation";

/** Legacy URL — canonical ledger/books UI lives at `/workspace/user/ledger`. */
export default async function AccountingBooksLegacyRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      for (const item of v) qs.append(k, String(item));
    } else {
      qs.set(k, String(v));
    }
  }
  const q = qs.toString();
  permanentRedirect(q ? `/workspace/user/ledger?${q}` : "/workspace/user/ledger");
}
