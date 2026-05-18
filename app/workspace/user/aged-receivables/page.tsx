import { AccountingReportPage } from "@/components/workspace/AccountingReportPage";

export default function AgedReceivablesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="aged-receivables" data-inspector-real-register="aged-receivables">
      <AccountingReportPage reportType="receivables-aging" />
    </div>
  );
}
