"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ClipboardList,
  FileBadge,
  FileText,
  Package,
  Receipt,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  customers,
  invoices,
  payments,
  recentActivity,
  stockItems,
  dashboardSummary,
} from "@/data/workspace/index";
import { findCustomer } from "@/data/workspace/customers";
import { USER_WORKSPACE_BASE } from "@/lib/workspace/navigation";
import {
  formatCurrency,
  formatDate,
  relativeTime,
  statusLabel,
  statusTone,
} from "@/lib/workspace/format";
import { WorkspaceSuggestion } from "./WorkspaceSuggestion";

const KPI_ITEMS = [
  {
    label: "Sales this month",
    value: dashboardSummary.salesThisMonth,
    delta: 12.4,
    direction: "up" as const,
    icon: Receipt,
    description: "Issued + sent + paid invoices, current period",
  },
  {
    label: "Outstanding receivables",
    value: dashboardSummary.outstandingBalance,
    delta: 4.7,
    direction: "up" as const,
    icon: Wallet,
    description: "Net unpaid balance across customers",
  },
  {
    label: "VAT payable (period)",
    value: dashboardSummary.vatPayable,
    delta: 1.8,
    direction: "down" as const,
    icon: ShieldCheck,
    description: "Sales VAT − credit notes + debit notes",
  },
  {
    label: "Cleared collections",
    value: dashboardSummary.paymentsCleared,
    delta: 8.6,
    direction: "up" as const,
    icon: FileBadge,
    description: "Customer payments marked as cleared",
  },
];

function trendIcon(direction: "up" | "down" | "flat") {
  if (direction === "up") return <ArrowUpRight size={12} />;
  if (direction === "down") return <ArrowDownRight size={12} />;
  return <ArrowRight size={12} />;
}

export function WorkspaceDashboard() {
  const pendingInvoices = invoices.filter((inv) =>
    ["draft", "issued", "sent", "viewed", "partially_paid", "overdue"].includes(inv.status),
  );
  const stockAlerts = stockItems.filter((item) => item.status !== "in_stock");
  const recentPayments = payments.slice(0, 4);

  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">Workspace overview</h1>
          <p className="wsv2-page-subtitle">
            Hisabix workspace — invoicing, VAT visibility, and collections at a glance.
          </p>
        </div>
        <div className="wsv2-page-actions">
          <Link href={`${USER_WORKSPACE_BASE}/invoices`} className="wsv2-btn-secondary wsv2-icon-btn">
            <FileText size={14} /> Open invoice register
          </Link>
          <Link href="/workspace/invoices/new?documentType=tax_invoice" className="wsv2-btn">
            <Receipt size={14} /> Create invoice
          </Link>
        </div>
      </div>

      <WorkspaceSuggestion
        id="dashboard-preview-data"
        tone="info"
        title="Preview mode"
        description="This workspace is showing realistic demo data so you can review V2 layouts without affecting real records."
      />

      <div className="wsv2-grid wsv2-grid-kpi" style={{ marginTop: 14 }}>
        {KPI_ITEMS.map((kpi) => (
          <article key={kpi.label} className="wsv2-kpi" aria-label={kpi.label}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                className="wsv2-icon-btn"
                aria-hidden="true"
                style={{ height: 28, minWidth: 28, padding: 4, color: "var(--wsv2-primary)" }}
              >
                <kpi.icon size={14} />
              </span>
              <span className="wsv2-kpi-label">{kpi.label}</span>
            </div>
            <div className="wsv2-kpi-value">{formatCurrency(kpi.value)}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="wsv2-kpi-trend" data-tone={kpi.direction}>
                {trendIcon(kpi.direction)}
                {kpi.delta.toFixed(1)}%
              </span>
              <span style={{ fontSize: 11.5, color: "var(--wsv2-ink-subtle)" }}>{kpi.description}</span>
            </div>
          </article>
        ))}
      </div>

      <div
        className="wsv2-grid"
        style={{ marginTop: 16, gridTemplateColumns: "minmax(0, 1.45fr) minmax(0, 1fr)" }}
      >
        <section className="wsv2-card" aria-label="Pending documents">
          <header
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 14px",
              borderBottom: "1px solid var(--wsv2-line)",
            }}
          >
            <div>
              <h2 className="wsv2-card-title">Pending documents</h2>
              <p className="wsv2-card-subtitle">
                {pendingInvoices.length} invoices waiting on action
              </p>
            </div>
            <Link
              href={`${USER_WORKSPACE_BASE}/invoices`}
              className="wsv2-btn-ghost"
              style={{ marginLeft: "auto" }}
            >
              Open register <ArrowRight size={12} />
            </Link>
          </header>
          <div className="wsv2-list">
            {pendingInvoices.slice(0, 6).map((inv) => {
              const customer = findCustomer(inv.customerId);
              return (
                <Link
                  key={inv.id}
                  href={`${USER_WORKSPACE_BASE}/invoices?doc=${inv.id}`}
                  className="wsv2-list-item"
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{inv.number}</div>
                    <div style={{ fontSize: 12, color: "var(--wsv2-ink-subtle)" }}>
                      {customer?.legalName ?? "—"} · Due {formatDate(inv.dueDate)}
                    </div>
                  </div>
                  <div className="meta" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="wsv2-pill" data-tone={statusTone(inv.status)}>
                      <span className="wsv2-status-dot" /> {statusLabel(inv.status)}
                    </span>
                    <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                      {formatCurrency(inv.balance)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="wsv2-card" aria-label="Quick actions">
          <header
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid var(--wsv2-line)",
            }}
          >
            <h2 className="wsv2-card-title">Quick actions</h2>
            <p className="wsv2-card-subtitle">Frequent operations</p>
          </header>
          <div style={{ padding: 14, display: "grid", gap: 8 }}>
            <Link href={`${USER_WORKSPACE_BASE}/invoices`} className="wsv2-quick-action">
              <FileText /> Create tax invoice
            </Link>
            <Link href={`${USER_WORKSPACE_BASE}/quotations`} className="wsv2-quick-action">
              <FileBadge /> Issue a quotation
            </Link>
            <Link href={`${USER_WORKSPACE_BASE}/customer-payments`} className="wsv2-quick-action">
              <Wallet /> Record customer payment
            </Link>
            <Link href={`${USER_WORKSPACE_BASE}/products-services`} className="wsv2-quick-action">
              <Package /> Add product or service
            </Link>
            <Link href={`${USER_WORKSPACE_BASE}/templates`} className="wsv2-quick-action">
              <ClipboardList /> Manage document templates
            </Link>
          </div>
        </section>
      </div>

      <div
        className="wsv2-grid"
        style={{ marginTop: 16, gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}
      >
        <section className="wsv2-card" aria-label="Recent activity">
          <header style={{ padding: "12px 14px", borderBottom: "1px solid var(--wsv2-line)" }}>
            <h2 className="wsv2-card-title">Recent activity</h2>
            <p className="wsv2-card-subtitle">Last actions across this workspace</p>
          </header>
          <div className="wsv2-list">
            {recentActivity.map((entry) => (
              <div key={entry.id} className="wsv2-list-item">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5 }}>{entry.actor}</div>
                  <div style={{ fontSize: 12, color: "var(--wsv2-ink-muted)", marginTop: 2 }}>
                    {entry.description}
                  </div>
                </div>
                <span className="meta">{relativeTime(entry.at)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="wsv2-card" aria-label="Stock alerts">
          <header style={{ padding: "12px 14px", borderBottom: "1px solid var(--wsv2-line)" }}>
            <h2 className="wsv2-card-title">Stock alerts</h2>
            <p className="wsv2-card-subtitle">
              {stockAlerts.length} item{stockAlerts.length === 1 ? "" : "s"} need attention
            </p>
          </header>
          <div className="wsv2-list">
            {stockAlerts.length === 0 ? (
              <div className="wsv2-list-item" style={{ color: "var(--wsv2-ink-subtle)" }}>
                All inventory items are above their reorder level.
              </div>
            ) : (
              stockAlerts.map((item) => (
                <Link
                  key={item.id}
                  href={`${USER_WORKSPACE_BASE}/stock-movements`}
                  className="wsv2-list-item"
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: "var(--wsv2-ink-subtle)" }}>
                      SKU {item.sku} · On hand {item.onHand} {item.unit}
                    </div>
                  </div>
                  <div className="meta">
                    <span className="wsv2-pill" data-tone={statusTone(item.status)}>
                      <span className="wsv2-status-dot" /> {statusLabel(item.status)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <div
        className="wsv2-grid"
        style={{ marginTop: 16, gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}
      >
        <section className="wsv2-card" aria-label="Customer balances">
          <header style={{ padding: "12px 14px", borderBottom: "1px solid var(--wsv2-line)" }}>
            <h2 className="wsv2-card-title">Customer balances</h2>
            <p className="wsv2-card-subtitle">Top open balances</p>
          </header>
          <div className="wsv2-list">
            {customers
              .filter((customer) => customer.outstandingBalance > 0)
              .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
              .slice(0, 5)
              .map((customer) => (
                <div key={customer.id} className="wsv2-list-item">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{customer.legalName}</div>
                    <div style={{ fontSize: 12, color: "var(--wsv2-ink-subtle)" }}>
                      VAT {customer.vatNumber ?? "—"} · {customer.city ?? ""}
                    </div>
                  </div>
                  <span className="meta" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--wsv2-ink)" }}>
                    {formatCurrency(customer.outstandingBalance)}
                  </span>
                </div>
              ))}
          </div>
        </section>

        <section className="wsv2-card" aria-label="Recent payments">
          <header style={{ padding: "12px 14px", borderBottom: "1px solid var(--wsv2-line)" }}>
            <h2 className="wsv2-card-title">Recent payments</h2>
            <p className="wsv2-card-subtitle">Last received customer payments</p>
          </header>
          <div className="wsv2-list">
            {recentPayments.map((payment) => {
              const customer = findCustomer(payment.customerId);
              return (
                <Link
                  key={payment.id}
                  href={`${USER_WORKSPACE_BASE}/customer-payments`}
                  className="wsv2-list-item"
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{payment.number}</div>
                    <div style={{ fontSize: 12, color: "var(--wsv2-ink-subtle)" }}>
                      {customer?.legalName ?? "—"} · {payment.invoiceNumber}
                    </div>
                  </div>
                  <span className="meta" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--wsv2-ink)" }}>
                    {formatCurrency(payment.amount)}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
