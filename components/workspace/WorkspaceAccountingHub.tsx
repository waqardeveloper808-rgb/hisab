"use client";

import Link from "next/link";
import { useState } from "react";
import { USER_WORKSPACE_BASE } from "@/lib/workspace/navigation";

export type DataStatus = "LIVE" | "PARTIAL" | "FOUNDATION";

type HubCard = {
  title: string;
  description: string;
  href: string;
  status: DataStatus;
  dataSource: string;
};

const base = USER_WORKSPACE_BASE;

const TAB_CONTENT: Record<string, { intro: string; cards: HubCard[] }> = {
  overview: {
    intro: "Single pipeline (where live): documents and manual journals → posted journal lines → ledger → trial balance → financial statements and tax reports.",
    cards: [
      { title: "Journal entries", description: "Browse and create manual journals; system entries appear from documents.", href: `${base}/journal-entries`, status: "LIVE", dataSource: "listJournals / workspace API" },
      { title: "General ledger (lines)", description: "Posted lines with running balance filter.", href: `${base}/ledger`, status: "LIVE", dataSource: "getBooksSnapshot" },
      { title: "Trial balance", description: "Aggregated account balances.", href: `${base}/reports/trial-balance`, status: "LIVE", dataSource: "getReportsSnapshot" },
      { title: "Reports hub", description: "Grouped financial, sales, tax, and inventory reports.", href: `${base}/reports`, status: "PARTIAL", dataSource: "getReportsSnapshot (varies by report)" },
    ],
  },
  journals: {
    intro: "Manual and system-generated journal activity.",
    cards: [
      { title: "Manual journals", description: "Shortcut to manual journal workflow (same register with entry modal).", href: `${base}/manual-journals`, status: "LIVE", dataSource: "Journal register + createJournal" },
      { title: "Journal entries", description: "Full register with split-view detail.", href: `${base}/journal-entries`, status: "LIVE", dataSource: "listJournals" },
      { title: "Recurring journals", description: "Templates for repeating journals (foundation).", href: `${base}/recurring-journals`, status: "FOUNDATION", dataSource: "Not connected" },
      { title: "Manual journal templates", description: "Saved journal patterns (foundation).", href: `${base}/manual-journal-templates`, status: "FOUNDATION", dataSource: "Not connected" },
    ],
  },
  ledger: {
    intro: "Ledger and book views.",
    cards: [
      { title: "General ledger", description: "All posted lines in one scrollable view.", href: `${base}/ledger`, status: "LIVE", dataSource: "getBooksSnapshot.generalLedger" },
      { title: "General ledger (report route)", description: "Alias route to the same data model.", href: `${base}/reports/general-ledger`, status: "PARTIAL", dataSource: "redirect → ledger" },
      { title: "Statement of account", description: "Account statement over a period (foundation UI).", href: `${base}/reports/statement-of-account`, status: "FOUNDATION", dataSource: "getBooksSnapshot (partial filter UX)" },
    ],
  },
  coa: {
    intro: "Chart of accounts and Wafeq-style hierarchy labels (metadata in app; codes unchanged).",
    cards: [
      { title: "Chart of accounts", description: "Accounts with classes; posting flags.", href: `${base}/chart-of-accounts`, status: "LIVE", dataSource: "listAccounts" },
      { title: "Opening balances", description: "Opening balance workflow.", href: `${base}/opening-balances`, status: "PARTIAL", dataSource: "listJournals + import flow" },
    ],
  },
  tax: {
    intro: "VAT and KSA tax rates catalog.",
    cards: [
      { title: "Tax rates (KSA)", description: "Default 15% and zero/exempt/RC schedules.", href: `${base}/tax-rates`, status: "LIVE", dataSource: "Static catalog + API when wired" },
      { title: "VAT dashboard", description: "Operational VAT view.", href: `${base}/vat`, status: "PARTIAL", dataSource: "VatOverview + API" },
      { title: "VAT summary report", description: "Taxable and VAT by code.", href: `${base}/reports/vat-summary`, status: "LIVE", dataSource: "getReportsSnapshot" },
      { title: "Tax report (extended)", description: "Extended tax lines (partial).", href: `${base}/reports/tax-report`, status: "PARTIAL", dataSource: "getReportsSnapshot" },
    ],
  },
  banking: {
    intro: "Banking and reconciliation.",
    cards: [
      { title: "Bank accounts", description: "Cash and bank register.", href: `${base}/bank-accounts`, status: "LIVE", dataSource: "BankAccountsRegister" },
      { title: "Bank reconciliation", description: "Match statements to journal lines.", href: `${base}/bank-reconciliation`, status: "LIVE", dataSource: "Reconciliation page" },
      { title: "Banking (legacy hub)", description: "Alternate entry.", href: `${base}/banking`, status: "LIVE", dataSource: "Bank accounts" },
    ],
  },
  "fixed-assets": {
    intro: "Fixed assets register and depreciation (foundation).",
    cards: [
      { title: "Fixed assets", description: "Asset register shell with status.", href: `${base}/fixed-assets`, status: "FOUNDATION", dataSource: "Planned: asset + depreciation journals" },
    ],
  },
  dimensions: {
    intro: "Cost centers, projects, and branches for dimensional reporting.",
    cards: [
      { title: "Cost centers", description: "Dimension master.", href: `${base}/cost-centers`, status: "PARTIAL", dataSource: "listCostCenters" },
      { title: "Projects", description: "Project dimension.", href: `${base}/projects`, status: "PARTIAL", dataSource: "Project records" },
      { title: "Branches", description: "Branch dimension.", href: `${base}/branches`, status: "PARTIAL", dataSource: "Branch records" },
      { title: "P&L by branch", description: "Foundation slice.", href: `${base}/reports/profit-loss-by-branch`, status: "FOUNDATION", dataSource: "P&L + branch filter (pending)" },
      { title: "P&L by cost center", description: "Foundation slice.", href: `${base}/reports/profit-loss-by-cost-center`, status: "FOUNDATION", dataSource: "P&L + cost center (pending)" },
      { title: "P&L by project", description: "Foundation slice.", href: `${base}/reports/profit-loss-by-project`, status: "FOUNDATION", dataSource: "P&L + project (pending)" },
    ],
  },
  closing: {
    intro: "Period end and cut-off (foundation / partial).",
    cards: [
      { title: "Period closing", description: "Close income statement to equity (governed by backend rules).", href: `${base}/period-closing`, status: "FOUNDATION", dataSource: "Not automated in UI" },
    ],
  },
  reports: {
    intro: "Deep links to the reports library.",
    cards: [
      { title: "All reports", description: "Wafeq-style grouped list.", href: `${base}/reports`, status: "PARTIAL", dataSource: "Mixed snapshots" },
      { title: "Profit & loss", description: "P&L statement.", href: `${base}/reports/profit-loss`, status: "LIVE", dataSource: "getReportsSnapshot" },
      { title: "Balance sheet", description: "Assets, liabilities, equity.", href: `${base}/reports/balance-sheet`, status: "LIVE", dataSource: "getReportsSnapshot" },
      { title: "Cash flow", description: "Direct method view where supported.", href: `${base}/reports/cash-flow`, status: "PARTIAL", dataSource: "getReportsSnapshot" },
      { title: "Cash flow indirect", description: "Indirect method (foundation).", href: `${base}/reports/cash-flow-indirect`, status: "FOUNDATION", dataSource: "Not implemented" },
      { title: "Audit trail (posting view)", description: "Journal lines / GL-based audit (partial vs full composite audit).", href: `${base}/reports/audit-trail`, status: "PARTIAL", dataSource: "getBooksSnapshot" },
    ],
  },
};

const TAB_ORDER = [
  { id: "overview", label: "Overview" },
  { id: "journals", label: "Journals" },
  { id: "ledger", label: "Ledger" },
  { id: "coa", label: "Chart of accounts" },
  { id: "tax", label: "Tax & VAT" },
  { id: "banking", label: "Banking" },
  { id: "fixed-assets", label: "Fixed assets" },
  { id: "dimensions", label: "Dimensions" },
  { id: "closing", label: "Closing" },
  { id: "reports", label: "Reports" },
] as const;

function StatusBadge({ s }: { s: DataStatus }) {
  const cls =
    s === "LIVE"
      ? "wsv2-accounting-badge wsv2-accounting-badge--live"
      : s === "PARTIAL"
        ? "wsv2-accounting-badge wsv2-accounting-badge--partial"
        : "wsv2-accounting-badge wsv2-accounting-badge--foundation";
  return <span className={cls}>{s}</span>;
}

export function WorkspaceAccountingHub() {
  const [tab, setTab] = useState<string>("overview");
  const content = TAB_CONTENT[tab] ?? TAB_CONTENT.overview;

  return (
    <div data-wsv2 data-inspector-accounting-hub="true">
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">Accounting</h1>
          <p className="wsv2-page-subtitle">For accountants — journals, books, tax, dimensions, and statements. Status labels describe data integration today.</p>
        </div>
      </div>

      <div className="wsv2-accounting-tabs" role="tablist" aria-label="Accounting sections">
        {TAB_ORDER.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={["wsv2-accounting-tab", tab === t.id ? "wsv2-accounting-tab--active" : ""].filter(Boolean).join(" ")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="wsv2-accounting-intro">{content.intro}</p>

      <div className="wsv2-accounting-card-grid">
        {content.cards.map((c) => (
          <Link key={c.href} href={c.href} className="wsv2-accounting-card">
            <div className="wsv2-accounting-card__head">
              <span className="wsv2-accounting-card__title">{c.title}</span>
              <StatusBadge s={c.status} />
            </div>
            <p className="wsv2-accounting-card__desc">{c.description}</p>
            <p className="wsv2-accounting-card__meta">
              <strong>Data:</strong> {c.dataSource}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
