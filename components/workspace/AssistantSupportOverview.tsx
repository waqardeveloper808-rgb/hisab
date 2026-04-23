"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { listPlatformCustomers, type PlatformCustomerRecord } from "@/lib/workspace-api";

export function AssistantSupportOverview() {
  const [customers, setCustomers] = useState<PlatformCustomerRecord[]>([]);

  useEffect(() => {
    listPlatformCustomers({}).then(setCustomers).catch((err: unknown) => { console.error('[AssistantSupportOverview] listPlatformCustomers failed:', err); setCustomers([]); });
  }, []);

  const summary = useMemo(() => ({
    total: customers.length,
    active: customers.filter((customer) => customer.isActive).length,
    trialing: customers.filter((customer) => customer.subscription?.status === "trialing").length,
    referred: customers.filter((customer) => customer.referralSource !== null).length,
  }), [customers]);

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-white/70 bg-white/95 p-6 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Assistant workspace</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Support work stays organised when customer health, onboarding, and next actions are visible together.</h1>
            <p className="mt-4 text-base leading-7 text-muted">This workspace uses live platform customer data to help support and onboarding teams decide who needs attention next.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/workspace/admin/customers" variant="secondary">Open customers</Button>
            <Button href="/workspace/help/ai">Open AI help</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Customer companies", String(summary.total), "Visible customer companies across the platform"],
          ["Active accounts", String(summary.active), "Companies currently active on the platform"],
          ["Trials running", String(summary.trialing), "Customers still inside trial conversion"],
          ["Agent sourced", String(summary.referred), "Companies linked to a referral source"],
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
          title="Customer recovery queue"
          caption="Start with customers that need subscription or onboarding attention."
          rows={customers.slice(0, 6)}
          emptyMessage="Customer records will appear here once the workspace backend is available."
          columns={[
            { header: "Company", render: (row) => row.legalName },
            { header: "Owner", render: (row) => row.owner.name || row.owner.email || "-" },
            { header: "Plan", render: (row) => row.subscription?.planName ?? "No plan" },
            { header: "Status", render: (row) => row.subscription?.status ?? (row.isActive ? "active" : "suspended") },
          ]}
        />

        <Card className="rounded-xl bg-white/95 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Onboarding helpers</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">Guide the customer to the next real action.</h2>
          <div className="mt-5 space-y-3 text-sm text-muted">
            <div className="rounded-lg border border-line bg-surface-soft px-4 py-3">Start with the live customer record to confirm plan, owner, and account health before changing access or billing.</div>
            <div className="rounded-lg border border-line bg-surface-soft px-4 py-3">Move the customer into the invoice, report, or AI help flow from links that exist inside the live workspace.</div>
            <div className="rounded-lg border border-line bg-surface-soft px-4 py-3">Keep support explicit and commercial by moving from issue to workflow, not from issue to ticket backlog.</div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="/workspace/admin/customers" className="rounded-lg border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary/30 hover:bg-white hover:text-primary">
              Review customer accounts
            </Link>
            <Link href="/workspace/reports" className="rounded-lg border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary/30 hover:bg-white hover:text-primary">
              Open reporting workspace
            </Link>
            <Link href="/workspace/help/ai" className="rounded-lg border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary/30 hover:bg-white hover:text-primary">
              Launch AI help
            </Link>
            <Link href="/workspace/invoices/new" className="rounded-lg border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary/30 hover:bg-white hover:text-primary">
              Start invoice flow
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}