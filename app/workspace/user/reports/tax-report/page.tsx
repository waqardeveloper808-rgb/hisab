import { redirect } from "next/navigation";

/** Alias: extended tax lines — primary VAT list is VAT summary today. */
export default function TaxReportPage() {
  redirect("/workspace/user/reports/vat-summary");
}
