"use client";

import Link from "next/link";
import { USER_WORKSPACE_BASE } from "@/lib/workspace/navigation";

const B = USER_WORKSPACE_BASE;

type Entry = {
  title: string;
  description: string;
  status: "LIVE" | "PARTIAL" | "FOUNDATION";
  dataSource: string;
  primaryCta?: { href: string; label: string };
};

const REGISTRY: Record<string, Entry> = {
  "profit-loss-by-branch": { title: "P&L by branch", description: "Filters P&L by branch dimension; requires posted lines tagged with branch.", status: "FOUNDATION", dataSource: "P&L + branch slice (pending)", primaryCta: { href: `${B}/reports/profit-loss`, label: "Open P&L" } },
  "profit-loss-by-cost-center": { title: "P&L by cost center", description: "Dimension slice on P&L (foundation).", status: "FOUNDATION", dataSource: "P&L + cost center (pending)", primaryCta: { href: `${B}/reports/profit-loss`, label: "Open P&L" } },
  "profit-loss-by-project": { title: "P&L by project", description: "Dimension slice (foundation).", status: "FOUNDATION", dataSource: "P&L + project (pending)", primaryCta: { href: `${B}/reports/profit-loss`, label: "Open P&L" } },
  "cash-flow-indirect": { title: "Cash flow — indirect method", description: "Working capital adjustments to reach cash (foundation).", status: "FOUNDATION", dataSource: "N/A", primaryCta: { href: `${B}/reports/cash-flow`, label: "Open cash flow (direct view)" } },
  "statement-of-account": { title: "Statement of account", description: "Account activity for a range — use general ledger with account filter (PARTIAL).", status: "PARTIAL", dataSource: "getBooksSnapshot", primaryCta: { href: `${B}/ledger`, label: "Open ledger" } },
  "cash-forecast": { title: "Cash forecast", description: "Rolling cash projection from posted bank/cash and scheduled AP/AR (foundation).", status: "FOUNDATION", dataSource: "Not connected" },
  "management-pdf": { title: "Management reports (PDF)", description: "Packaged management PDFs — shell only; PDF engine not invoked from this report route.", status: "FOUNDATION", dataSource: "N/A" },
  "consolidated-pnl": { title: "Consolidated P&L", description: "Multi-entity consolidation (foundation).", status: "FOUNDATION", dataSource: "N/A" },
  "consolidated-cash-flow": { title: "Consolidated cash flow", description: "Multi-entity cash flow (foundation).", status: "FOUNDATION", dataSource: "N/A" },
  "consolidated-balance-sheet": { title: "Consolidated balance sheet", description: "Multi-entity balance sheet (foundation).", status: "FOUNDATION", dataSource: "N/A" },
  "customer-balance": { title: "Customer balance summary", description: "Open customer (AR) positions from posted sub-ledgers where connected.", status: "PARTIAL", dataSource: "Aging / receivables data", primaryCta: { href: `${B}/reports/receivables-aging`, label: "Open receivables aging" } },
  "customer-statement": { title: "Customer statement of account", description: "Chronological AR activity (foundation: use ledger + contact filter).", status: "FOUNDATION", dataSource: "Planned: contact sub-ledger" },
  "aged-receivables-detail": { title: "Aged receivables — detail", description: "Bucket detail lines (foundation).", status: "FOUNDATION", dataSource: "N/A" },
  "sales-by-contact": { title: "Sales by contact", description: "Dimension slice on revenue (foundation).", status: "FOUNDATION", dataSource: "N/A" },
  "sales-by-branch": { title: "Sales by branch", description: "Branch dimension (foundation).", status: "FOUNDATION", dataSource: "N/A" },
  "sales-by-project": { title: "Sales by project", description: "Project dimension (foundation).", status: "FOUNDATION", dataSource: "N/A" },
  "sales-by-item": { title: "Sales by item", description: "Item-level revenue (foundation).", status: "FOUNDATION", dataSource: "N/A" },
  "supplier-balance": { title: "Supplier balance summary", description: "Open supplier (AP) positions where connected.", status: "PARTIAL", dataSource: "Payables aging", primaryCta: { href: `${B}/reports/payables-aging`, label: "Open payables aging" } },
  "supplier-statement": { title: "Supplier statement of account", description: "Chronological AP activity (foundation).", status: "FOUNDATION", dataSource: "N/A" },
  "aged-payables-detail": { title: "Aged payables — detail", description: "Bucket detail (foundation).", status: "FOUNDATION", dataSource: "N/A" },
  "bills-by-contact": { title: "Bills by contact", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "bills-by-branch": { title: "Bills by branch", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "expenses-by-contact": { title: "Expenses by contact", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "expenses-by-branch": { title: "Expenses by branch", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "purchases-by-item": { title: "Purchases by item", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "payroll-summary": { title: "Payroll summary", description: "Foundation — payroll not wired in V2 reports bundle.", status: "FOUNDATION", dataSource: "N/A" },
  "forecasting": { title: "Forecasting", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "tax-report-detail": { title: "Tax report — detail", description: "Line-level tax (foundation).", status: "FOUNDATION", dataSource: "N/A" },
  "vat-output-register": { title: "Output VAT register", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "vat-input-register": { title: "Input VAT register", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "vat-ledger": { title: "VAT payable / receivable ledger", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "vat-reconciliation": { title: "VAT reconciliation", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "vat-return-register": { title: "VAT return / submission register", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "vat-payment-government": { title: "VAT payment to government", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "inventory-by-warehouse": { title: "Inventory by warehouse", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "inventory-monthly": { title: "Inventory monthly summary", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "inventory-valuation": { title: "Inventory valuation", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "cogs": { title: "COGS report", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "raw-material-movement": { title: "Raw material movement", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "finished-goods-movement": { title: "Finished goods movement", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "defective-inventory": { title: "Defective inventory", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "repair-inventory": { title: "Repair / rework inventory", description: "Foundation.", status: "FOUNDATION", dataSource: "N/A" },
  "stock-adjustment": { title: "Stock adjustment", description: "Links to stock adjustment workflow.", status: "PARTIAL", dataSource: "Inventory adjustments register", primaryCta: { href: `${B}/inventory-adjustments`, label: "Open inventory adjustments" } },
};

const BADGE: Record<Entry["status"], string> = {
  LIVE: "wsv2-accounting-badge wsv2-accounting-badge--live",
  PARTIAL: "wsv2-accounting-badge wsv2-accounting-badge--partial",
  FOUNDATION: "wsv2-accounting-badge wsv2-accounting-badge--foundation",
};

export function ReportPlaceholderBySlug({ path }: { path: string }) {
  const entry = REGISTRY[path] ?? {
    title: `Report: ${path.replaceAll("-", " ")}`,
    description: "This report route is reserved for a future engine slice. Use the reports hub to navigate.",
    status: "FOUNDATION" as const,
    dataSource: "Not yet implemented",
  };

  return (
    <div className="wsv2-page-header" style={{ marginTop: 8 }}>
      <div style={{ maxWidth: 42 * 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <h1 className="wsv2-page-title" style={{ margin: 0 }}>{entry.title}</h1>
          <span className={BADGE[entry.status]}>{entry.status}</span>
        </div>
        <p className="wsv2-page-subtitle" style={{ marginTop: 4 }}>{entry.description}</p>
        <p style={{ fontSize: 12, color: "var(--wsv2-ink-subtle)", marginTop: 8 }}>
          <strong>Data source:</strong> {entry.dataSource}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {entry.primaryCta ? (
            <Link href={entry.primaryCta.href} className="wsv2-btn">
              {entry.primaryCta.label}
            </Link>
          ) : null}
          <Link href={`${B}/reports`} className="wsv2-btn-secondary">
            All reports
          </Link>
          <Link href={`${B}/accounting`} className="wsv2-btn-secondary">
            Accounting hub
          </Link>
        </div>
      </div>
    </div>
  );
}

export function hasPlaceholder(path: string) {
  return path in REGISTRY;
}
