"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { useWorkspaceAccess } from "@/components/workspace/WorkspaceAccessProvider";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { WorkspaceRoleHeader } from "@/components/workspace/WorkspaceRoleHeader";
import { workspaceRoles } from "@/data/role-workspace";
import { listPlatformCustomers, type PlatformCustomerRecord } from "@/lib/workspace-api";

const previewCustomers: PlatformCustomerRecord[] = [
  {
    id: 1,
    legalName: "Blue Palm Trading",
    tradeName: "Blue Palm",
    taxNumber: "310998887770003",
    registrationNumber: "1010654321",
    baseCurrency: "SAR",
    locale: "en-SA",
    timezone: "Asia/Riyadh",
    isActive: true,
    suspendedReason: "",
    owner: { name: "Sara Nasser", email: "sara@bluepalm.sa" },
    users: [{ id: 1, name: "Sara Nasser", email: "sara@bluepalm.sa", role: "owner", isActive: true }],
    subscription: { planId: 1, status: "trialing", planCode: "zatca-monthly", planName: "Operational Plan", monthlyPriceSar: 40 },
    referralSource: null,
  },
  {
    id: 2,
    legalName: "Najd Supplies",
    tradeName: "Najd Supplies",
    taxNumber: "300111222330003",
    registrationNumber: "1010789001",
    baseCurrency: "SAR",
    locale: "en-SA",
    timezone: "Asia/Riyadh",
    isActive: false,
    suspendedReason: "Awaiting billing follow-up",
    owner: { name: "", email: "" },
    users: [],
    subscription: null,
    referralSource: null,
  },
];

export function AssistantWorkspaceHome() {
  const access = useWorkspaceAccess();
  const isPreview = !access;
  const [customers, setCustomers] = useState<PlatformCustomerRecord[]>([]);
  const role = workspaceRoles.assistant;

  useEffect(() => {
    if (isPreview) {
      setCustomers(previewCustomers);
      return;
    }

    listPlatformCustomers({}).then(setCustomers).catch((err: unknown) => { console.error('[AssistantWorkspaceHome] listPlatformCustomers failed:', err); setCustomers([]); });
  }, [isPreview]);

  const trialing = customers.filter((customer) => customer.subscription?.status === "trialing");
  const suspended = customers.filter((customer) => !customer.isActive);
  const unassignedOwner = customers.filter((customer) => !customer.owner.name && !customer.owner.email);
  const followUpQueue = [...trialing, ...suspended].slice(0, 8);

  return (
    <div className="space-y-6">
      <WorkspaceRoleHeader
        eyebrow={role.eyebrow}
        title={role.title}
        description="This workspace is tuned for operational support: help intake, onboarding, invoice guidance, customer follow-up, and pending tasks all stay in one visible queue."
        actions={role.quickActions}
        focusAreas={[
          { label: "Help intake", detail: "Make the first response path obvious with a clear help queue and AI help entry points." },
          { label: "Customer follow-up", detail: "Keep trial, suspended, and blocked customers visible so they get a real next action instead of a vague note." },
          { label: "Operational guidance", detail: "Route invoice support, onboarding help, and knowledge links into working destinations inside the product." },
        ]}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Help queue", String(followUpQueue.length), "Customers that look most likely to need a prompt support response"],
          ["Trials needing touch", String(trialing.length), "Trial accounts that should get onboarding or usage follow-up"],
          ["Suspended accounts", String(suspended.length), "Customers that may need billing, activation, or account recovery help"],
          ["Unassigned owners", String(unassignedOwner.length), "Accounts that need clear ownership before support can progress smoothly"],
        ].map(([title, value, caption]) => (
          <Card key={title} className="rounded-xl bg-white/95 p-4">
            <p className="text-sm font-semibold text-muted">{title}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{caption}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
        <WorkspaceDataTable
          registerTableId="assistant-followup-queue"
          title="Customer follow-up queue"
          caption="Operational follow-up list for onboarding, billing help, and account recovery."
          rows={followUpQueue}
          emptyMessage="Support queue items will appear here once customer records need operational follow-up."
          columns={[
            { id: "company", header: "Company", defaultWidth: 200, render: (row) => row.legalName },
            { id: "owner", header: "Owner", defaultWidth: 180, render: (row) => row.owner.name || row.owner.email || "-" },
            { id: "plan", header: "Plan", defaultWidth: 140, render: (row) => row.subscription?.planName ?? "No plan" },
            { id: "reason", header: "Reason", defaultWidth: 140, render: (row) => row.subscription?.status ?? (row.isActive ? "follow-up" : "suspended") },
          ]}
        />

        <Card className="rounded-xl bg-white/95 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Assistant alerts</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-line bg-surface-soft px-3 py-2.5">
              <p className="text-sm font-semibold text-ink">Invoice help demand</p>
              <p className="mt-1 text-sm leading-6 text-muted">Use invoice guidance early when customers are trialing or suspended to prevent avoidable drop-off.</p>
            </div>
            <div className="rounded-lg border border-line bg-surface-soft px-3 py-2.5">
              <p className="text-sm font-semibold text-ink">Onboarding priority</p>
              <p className="mt-1 text-sm leading-6 text-muted">{trialing.length} customers are still trialing and should be guided to their next business workflow quickly.</p>
            </div>
            <div className="rounded-lg border border-line bg-surface-soft px-3 py-2.5">
              <p className="text-sm font-semibold text-ink">Pending customer tasks</p>
              <p className="mt-1 text-sm leading-6 text-muted">Keep blocked customers out of email limbo by routing them into a clear next task from this workspace.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {role.sidebarGroups.flatMap((group) => group.items).map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border border-line bg-surface-soft px-3 py-2.5 text-sm font-semibold text-ink transition hover:border-primary/30 hover:bg-white hover:text-primary">
                {item.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {isPreview ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Preview mode keeps the support workspace usable with demo follow-up accounts. Sign in to work against live customer health and subscription records.
        </div>
      ) : null}
    </div>
  );
}