"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { currency } from "@/components/workflow/utils";
import { getAgentDashboard, type AgentDashboardSnapshot } from "@/lib/workspace-api";

const emptyState: AgentDashboardSnapshot = {
  agent: {
    referralCode: "",
    commissionRate: 20,
    isActive: true,
  },
  summary: {
    totalReferrals: 0,
    totalSignups: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    pendingCommission: 0,
    earnedCommission: 0,
  },
  referrals: [],
  backendReady: false,
};

export function AgentOverview() {
  const [snapshot, setSnapshot] = useState<AgentDashboardSnapshot>(emptyState);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getAgentDashboard().then(setSnapshot);
  }, []);

  const referralLink = useMemo(() => {
    if (!snapshot.agent.referralCode) {
      return "";
    }

    if (typeof window === "undefined") {
      return `/register?plan=zatca-monthly&ref=${snapshot.agent.referralCode}`;
    }

    return `${window.location.origin}/register?plan=zatca-monthly&ref=${snapshot.agent.referralCode}`;
  }, [snapshot.agent.referralCode]);

  async function handleCopy() {
    if (!referralLink) {
      return;
    }

    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Agents</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Share one referral link, then track signups, trials, and commission from one dashboard.</h1>
            <p className="mt-4 text-base leading-7 text-muted">This is the sales view for partners and internal agents who bring businesses into Gulf Hisab.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCopy} disabled={!referralLink}>{copied ? "Copied link" : "Copy referral link"}</Button>
            <Button href="/register?plan=zatca-monthly" variant="secondary">Open signup flow</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total referrals", String(snapshot.summary.totalReferrals), "People who signed up with your code"],
          ["Subscriptions", String(snapshot.summary.totalSubscriptions), "Trial or active subscriptions linked to your code"],
          ["Pending commission", `${currency(snapshot.summary.pendingCommission)} SAR`, "Commission waiting for trial conversion"],
          ["Earned commission", `${currency(snapshot.summary.earnedCommission)} SAR`, "Commission already marked as earned"],
        ].map(([title, value, caption]) => (
          <Card key={title} className="rounded-[1.8rem] bg-white/92 p-5">
            <p className="text-sm font-semibold text-muted">{title}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{caption}</p>
          </Card>
        ))}
      </div>

      <Card className="rounded-[1.8rem] bg-white/92 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-ink">Your referral link</h2>
            <p className="mt-1 text-sm text-muted">Share this link with businesses that should start the Gulf Hisab trial under your referral code.</p>
          </div>
          <span className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-muted">
            {snapshot.backendReady ? `${snapshot.agent.commissionRate}% commission rate` : "Waiting for backend data"}
          </span>
        </div>
        <div className="mt-5 rounded-[1.4rem] border border-line bg-surface-soft px-4 py-4 text-sm text-ink">
          {referralLink || "Your referral link will appear here once the workspace connects to the backend."}
        </div>
      </Card>

      <WorkspaceDataTable
        title="Referral activity"
        caption="Every signup and subscription tied to your referral code."
        rows={snapshot.referrals}
        emptyMessage="Referral activity will appear here as soon as a business signs up with your code."
        columns={[
          { header: "Name", render: (row) => row.name || "-" },
          { header: "Email", render: (row) => row.email || "-" },
          { header: "Signed up", render: (row) => row.signedUpAt ? row.signedUpAt.slice(0, 10) : "-" },
          { header: "Subscription", render: (row) => row.subscription ? `${row.subscription.planName} (${row.subscription.status})` : "Pending" },
          { header: "Commission", align: "right", render: (row) => `${currency(row.commissionAmount)} SAR` },
          { header: "Status", render: (row) => row.commissionStatus.replaceAll("_", " ") },
        ]}
      />
    </div>
  );
}