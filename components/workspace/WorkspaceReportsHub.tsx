"use client";

import Link from "next/link";
import { FileBarChart } from "lucide-react";
import { USER_WORKSPACE_BASE } from "@/lib/workspace/navigation";
import { WorkspaceSuggestion } from "./WorkspaceSuggestion";

const B = USER_WORKSPACE_BASE;

type RLink = { href: string; label: string; sub: string; status: "LIVE" | "PARTIAL" | "FOUNDATION" };

const SECTIONS: { id: string; title: string; links: RLink[] }[] = [
  {
    id: "financial",
    title: "Financial statements",
    links: [
      { href: `${B}/reports/profit-loss`, label: "Profit and Loss", sub: "P&L from posted activity", status: "LIVE" },
      { href: `${B}/reports/profit-loss-by-branch`, label: "P&L by branch", sub: "Dimension slice (foundation)", status: "FOUNDATION" },
      { href: `${B}/reports/profit-loss-by-cost-center`, label: "P&L by cost center", sub: "Dimension slice (foundation)", status: "FOUNDATION" },
      { href: `${B}/reports/profit-loss-by-project`, label: "P&L by project", sub: "Dimension slice (foundation)", status: "FOUNDATION" },
      { href: `${B}/reports/cash-flow`, label: "Cash flow", sub: "Direct / operating view", status: "PARTIAL" },
      { href: `${B}/reports/cash-flow-indirect`, label: "Cash flow — indirect", sub: "Indirect method (foundation)", status: "FOUNDATION" },
      { href: `${B}/reports/balance-sheet`, label: "Balance sheet", sub: "Assets, liabilities, equity", status: "LIVE" },
      { href: `${B}/reports/cash-forecast`, label: "Cash forecast", sub: "Foundation shell", status: "FOUNDATION" },
      { href: `${B}/reports/management-pdf`, label: "Management reports (PDF)", sub: "Foundation — export shell only", status: "FOUNDATION" },
      { href: `${B}/reports/consolidated-pnl`, label: "Consolidated P&L", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/consolidated-cash-flow`, label: "Consolidated cash flow", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/consolidated-balance-sheet`, label: "Consolidated balance sheet", sub: "Foundation", status: "FOUNDATION" },
    ],
  },
  {
    id: "sales",
    title: "Sales",
    links: [
      { href: `${B}/reports/customer-balance`, label: "Customer balance summary", sub: "AR balances", status: "PARTIAL" },
      { href: `${B}/reports/customer-statement`, label: "Customer statement of account", sub: "Activity list (foundation)", status: "FOUNDATION" },
      { href: `${B}/reports/receivables-aging`, label: "Aged receivables", sub: "Aging buckets", status: "LIVE" },
      { href: `${B}/reports/aged-receivables-detail`, label: "Aged receivables — detail", sub: "Line detail (foundation)", status: "FOUNDATION" },
      { href: `${B}/reports/sales-by-contact`, label: "Sales by contact", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/sales-by-branch`, label: "Sales by branch", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/sales-by-project`, label: "Sales by project", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/sales-by-item`, label: "Sales by item", sub: "Foundation", status: "FOUNDATION" },
    ],
  },
  {
    id: "purchase",
    title: "Purchases & expenses",
    links: [
      { href: `${B}/reports/supplier-balance`, label: "Supplier balance summary", sub: "AP balances", status: "PARTIAL" },
      { href: `${B}/reports/supplier-statement`, label: "Supplier statement of account", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/payables-aging`, label: "Aged payables", sub: "Aging buckets", status: "LIVE" },
      { href: `${B}/reports/aged-payables-detail`, label: "Aged payables — detail", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/bills-by-contact`, label: "Bills by contact", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/bills-by-branch`, label: "Bills by branch", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/expenses-by-contact`, label: "Expenses by contact", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/expenses-by-branch`, label: "Expenses by branch", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/purchases-by-item`, label: "Purchases by item", sub: "Foundation", status: "FOUNDATION" },
    ],
  },
  {
    id: "payroll",
    title: "Payroll",
    links: [
      { href: `${B}/reports/payroll-summary`, label: "Payroll summary", sub: "Foundation", status: "FOUNDATION" },
    ],
  },
  {
    id: "forecasting",
    title: "Forecasting",
    links: [
      { href: `${B}/reports/forecasting`, label: "Forecasting hub", sub: "Foundation", status: "FOUNDATION" },
    ],
  },
  {
    id: "tax",
    title: "Tax / VAT",
    links: [
      { href: `${B}/vat`, label: "VAT overview", sub: "Operational dashboard", status: "PARTIAL" },
      { href: `${B}/reports/vat-summary`, label: "VAT summary", sub: "Taxable + tax by code", status: "LIVE" },
      { href: `${B}/reports/tax-report`, label: "Tax report", sub: "Extended view", status: "PARTIAL" },
      { href: `${B}/reports/tax-report-detail`, label: "Tax report — detail", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/vat-output-register`, label: "Output VAT register", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/vat-input-register`, label: "Input VAT register", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/vat-ledger`, label: "VAT payable / receivable ledger", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/vat-reconciliation`, label: "VAT reconciliation", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/vat-return-register`, label: "VAT return / submission register", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/vat-payment-government`, label: "VAT payment to government", sub: "Foundation", status: "FOUNDATION" },
    ],
  },
  {
    id: "accountants",
    title: "For accountants",
    links: [
      { href: `${B}/accounting`, label: "Accounting hub", sub: "Tabs + modules", status: "LIVE" },
      { href: `${B}/journal-entries`, label: "Journal entries", sub: "Register + detail", status: "LIVE" },
      { href: `${B}/chart-of-accounts`, label: "Chart of accounts", sub: "Master data", status: "LIVE" },
      { href: `${B}/ledger`, label: "General ledger", sub: "Posted lines", status: "LIVE" },
      { href: `${B}/reports/trial-balance`, label: "Trial balance", sub: "Balances by account", status: "LIVE" },
      { href: `${B}/reports/statement-of-account`, label: "Statement of account", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/opening-balances`, label: "Opening balances", sub: "Import / post", status: "PARTIAL" },
      { href: `${B}/tax-rates`, label: "Tax rates", sub: "KSA catalog", status: "LIVE" },
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    links: [
      { href: `${B}/reports/inventory-movement`, label: "Inventory movement", sub: "Links to stock movement register", status: "PARTIAL" },
      { href: `${B}/reports/inventory-by-warehouse`, label: "Inventory by warehouse", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/inventory-monthly`, label: "Inventory monthly summary", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/inventory-valuation`, label: "Inventory valuation", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/cogs`, label: "COGS report", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/raw-material-movement`, label: "Raw material movement", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/finished-goods-movement`, label: "Finished goods movement", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/defective-inventory`, label: "Defective inventory", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/repair-inventory`, label: "Repair / rework inventory", sub: "Foundation", status: "FOUNDATION" },
      { href: `${B}/reports/stock-adjustment`, label: "Stock adjustment", sub: "Link to adjustments register", status: "PARTIAL" },
    ],
  },
  {
    id: "banking",
    title: "Banking",
    links: [
      { href: `${B}/bank-accounts`, label: "Bank accounts", sub: "Cash & bank", status: "LIVE" },
      { href: `${B}/bank-reconciliation`, label: "Bank reconciliation", sub: "Statement import & match", status: "LIVE" },
    ],
  },
  {
    id: "audit",
    title: "Audit & assurance",
    links: [
      { href: `${B}/reports/audit-trail`, label: "Audit trail (GL-based)", sub: "Posted lines; composite audit in monitor", status: "PARTIAL" },
    ],
  },
];

function Badge({ s }: { s: RLink["status"] }) {
  const c =
    s === "LIVE" ? "wsv2-accounting-badge wsv2-accounting-badge--live" : s === "PARTIAL"
      ? "wsv2-accounting-badge wsv2-accounting-badge--partial"
      : "wsv2-accounting-badge wsv2-accounting-badge--foundation";
  return <span className={c} style={{ marginTop: 2 }}>{s}</span>;
}

export function WorkspaceReportsHub() {
  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">Reports</h1>
          <p className="wsv2-page-subtitle">Grouped like a professional accounting app. LIVE = report reads posted snapshot data; PARTIAL = mixed; FOUNDATION = route exists, integration incomplete.</p>
        </div>
      </div>
      <WorkspaceSuggestion
        id="reports-wafeq"
        tone="info"
        title="Data source note"
        description="V2 uses workspace preview or backend APIs per route. If backendReady is false in preview, tables may be empty while navigation remains valid."
      />

      {SECTIONS.map((sec) => (
        <section key={sec.id} className="wsv2-reports-section">
          <h2 className="wsv2-reports-section__title">{sec.title}</h2>
          <div className="wsv2-reports-link-grid">
            {sec.links.map((l) => (
              <Link key={l.href} href={l.href} className="wsv2-reports-link">
                <span style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <FileBarChart size={14} style={{ flexShrink: 0, marginTop: 1 }} color="var(--wsv2-primary)" />
                    {l.label}
                  </span>
                  <Badge s={l.status} />
                </span>
                <span className="wsv2-reports-link__sub">{l.sub}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
