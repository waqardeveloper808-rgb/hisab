"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { currency } from "@/components/workflow/utils";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { WorkspaceRoleHeader } from "@/components/workspace/WorkspaceRoleHeader";
import { workspaceRoles } from "@/data/role-workspace";
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

export function AgentWorkspaceHome() {
  const [snapshot, setSnapshot] = useState<AgentDashboardSnapshot>(emptyState);
  const role = workspaceRoles.agent;

  useEffect(() => {
    getAgentDashboard().then(setSnapshot).catch((err: unknown) => { console.error('[AgentWorkspaceHome] getAgentDashboard failed:', err); setSnapshot(emptyState); });
  }, []);

  const pendingOutreach = snapshot.referrals.filter((row) => row.commissionStatus === "pending" || row.subscription === null).length;
  const referralLink = useMemo(() => {
    if (!snapshot.agent.referralCode) {
      return "/register?plan=zatca-monthly";
    }

    return `/register?plan=zatca-monthly&ref=${snapshot.agent.referralCode}`;
  }, [snapshot.agent.referralCode]);

  return (
    <div className="space-y-6">
      <WorkspaceRoleHeader
        eyebrow={role.eyebrow}
        title={role.title}
        description="This workspace is commercially focused: work leads, referrals, assigned accounts, follow-ups, and outreach from one pipeline instead of a generic partner dashboard."
        actions={role.quickActions}
        focusAreas={[
          { label: "Lead intake", detail: "Keep new opportunities, referral status, and trial-ready businesses visible in one queue." },
          { label: "Follow-up discipline", detail: "Use pending outreach and activity tracking to keep opportunities from going cold." },
          { label: "Assigned accounts", detail: "Make account ownership explicit so commercial follow-up and expansion stay organised." },
        ]}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Leads and referrals", String(snapshot.summary.totalReferrals), `${snapshot.summary.totalSignups} signups have entered the funnel`],
          ["Active subscriptions", String(snapshot.summary.activeSubscriptions), `${snapshot.summary.totalSubscriptions} total subscriptions linked to referrals`],
          ["Pending outreach", String(pendingOutreach), "Referral records still need a call, message, or conversion push"],
          ["Pending commission", `${currency(snapshot.summary.pendingCommission)} SAR`, `${currency(snapshot.summary.earnedCommission)} SAR already earned`],
        ].map(([title, value, caption]) => (
          <Card key={title} className="rounded-xl bg-white/95 p-5">
            <p className="text-sm font-semibold text-muted">{title}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{caption}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
        <WorkspaceDataTable
          title="Referral and pipeline activity"
          caption="Recent referred businesses and their subscription state."
          rows={snapshot.referrals}
          emptyMessage="Referral activity will appear here when new businesses sign up under this agent code."
          columns={[
            { header: "Lead", render: (row) => row.name || "-" },
            { header: "Email", render: (row) => row.email || "-" },
            { header: "Signed up", render: (row) => row.signedUpAt ? row.signedUpAt.slice(0, 10) : "-" },
            { header: "Subscription", render: (row) => row.subscription ? `${row.subscription.planName} (${row.subscription.status})` : "Pending" },
          ]}
        />

        <Card className="rounded-xl bg-white/95 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Agent alerts</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-line bg-surface-soft px-4 py-3">
              <p className="text-sm font-semibold text-ink">Pending outreach</p>
              <p className="mt-1 text-sm leading-6 text-muted">{pendingOutreach} referral records still need direct outreach or follow-up.</p>
            </div>
            <div className="rounded-lg border border-line bg-surface-soft px-4 py-3">
              <p className="text-sm font-semibold text-ink">Assigned-account review</p>
              <p className="mt-1 text-sm leading-6 text-muted">Use assigned accounts and pipeline views to avoid duplicate ownership on active opportunities.</p>
            </div>
            <div className="rounded-lg border border-line bg-surface-soft px-4 py-3">
              <p className="text-sm font-semibold text-ink">Live signup flow</p>
              <p className="mt-1 text-sm leading-6 text-muted">Push qualified leads into the live registration path with the referral code attached.</p>
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-line bg-surface-soft px-4 py-3 text-sm text-ink">
            Referral link: {referralLink}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {role.sidebarGroups.flatMap((group) => group.items).map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary/30 hover:bg-white hover:text-primary">
                {item.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}