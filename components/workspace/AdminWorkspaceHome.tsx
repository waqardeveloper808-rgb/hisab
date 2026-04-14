"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { WorkspaceRoleHeader } from "@/components/workspace/WorkspaceRoleHeader";
import { workspaceRoles } from "@/data/role-workspace";
import { listPlatformAgents, listPlatformCustomers, listSubscriptionPlans, listSupportAccounts, type PlatformAgentRecord, type PlatformCustomerRecord, type SubscriptionPlanRecord, type SupportAccountRecord } from "@/lib/workspace-api";

export function AdminWorkspaceHome() {
  const [customers, setCustomers] = useState<PlatformCustomerRecord[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanRecord[]>([]);
  const [supportAccounts, setSupportAccounts] = useState<SupportAccountRecord[]>([]);
  const [agents, setAgents] = useState<PlatformAgentRecord[]>([]);
  const role = workspaceRoles.admin;

  useEffect(() => {
    listPlatformCustomers({}).then(setCustomers).catch(() => setCustomers([]));
    listSubscriptionPlans().then(setPlans).catch(() => setPlans([]));
    listSupportAccounts().then(setSupportAccounts).catch(() => setSupportAccounts([]));
    listPlatformAgents({}).then(setAgents).catch(() => setAgents([]));
  }, []);

  const subscribedCustomers = customers.filter((customer) => customer.subscription !== null).length;
  const trialingCustomers = customers.filter((customer) => customer.subscription?.status === "trialing").length;
  const inactiveSupport = supportAccounts.filter((account) => !account.isPlatformActive).length;
  const hiddenPlans = plans.filter((plan) => !plan.isVisible || !plan.isActive).length;

  return (
    <div className="space-y-6">
      <WorkspaceRoleHeader
        eyebrow={role.eyebrow}
        title={role.title}
        description="This workspace is for platform control, not day-to-day bookkeeping. Customers, plans, support accounts, audit, integrations, and governance are grouped around admin decisions."
        actions={role.quickActions}
        focusAreas={[
          { label: "Customer control", detail: "Review company status, subscription state, and ownership without drifting into the customer operating workspace." },
          { label: "Revenue controls", detail: "Keep plans, visibility, referral agents, and support-account readiness aligned with the paid product." },
          { label: "Governance", detail: "Use audit, system health, and access management as explicit admin tasks instead of hidden utilities." },
        ]}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Customers", String(customers.length), `${subscribedCustomers} companies currently have a subscription linked`],
          ["Plans", String(plans.length), `${hiddenPlans} plan entries need visibility or status review`],
          ["Support accounts", String(supportAccounts.length), `${inactiveSupport} support accounts are inactive`],
          ["Referral agents", String(agents.length), `${agents.filter((agent) => agent.isActive).length} agents are currently active`],
        ].map(([title, value, caption]) => (
          <Card key={title} className="rounded-[1.8rem] bg-white/92 p-5">
            <p className="text-sm font-semibold text-muted">{title}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{caption}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <WorkspaceDataTable
          title="Customer review queue"
          caption="Customers that should be checked for subscription state, ownership, or activation."
          rows={customers.slice(0, 6)}
          emptyMessage="Customer records will appear here once the admin APIs respond."
          columns={[
            { header: "Company", render: (row) => row.legalName },
            { header: "Owner", render: (row) => row.owner.name || row.owner.email || "-" },
            { header: "Plan", render: (row) => row.subscription?.planName ?? "No plan" },
            { header: "Status", render: (row) => row.subscription?.status ?? (row.isActive ? "active" : "suspended") },
          ]}
        />

        <Card className="rounded-[1.8rem] bg-white/92 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Admin alerts</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-[1.3rem] border border-line bg-surface-soft px-4 py-3">
              <p className="text-sm font-semibold text-ink">Trial accounts waiting for review</p>
              <p className="mt-1 text-sm leading-6 text-muted">{trialingCustomers} customer accounts are still trialing and may need plan or activation follow-up.</p>
            </div>
            <div className="rounded-[1.3rem] border border-line bg-surface-soft px-4 py-3">
              <p className="text-sm font-semibold text-ink">Support account readiness</p>
              <p className="mt-1 text-sm leading-6 text-muted">{inactiveSupport} support accounts are inactive and should be checked before queue pressure rises.</p>
            </div>
            <div className="rounded-[1.3rem] border border-line bg-surface-soft px-4 py-3">
              <p className="text-sm font-semibold text-ink">Plan visibility check</p>
              <p className="mt-1 text-sm leading-6 text-muted">{hiddenPlans} plans are hidden or inactive, so the commercial story should be reviewed against the pricing surface.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {role.sidebarGroups.flatMap((group) => group.items).map((item) => (
              <Link key={item.href} href={item.href} className="rounded-[1.2rem] border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary/30 hover:bg-white hover:text-primary">
                {item.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}