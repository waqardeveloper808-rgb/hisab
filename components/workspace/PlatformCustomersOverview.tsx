"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useWorkspaceAccess } from "@/components/workspace/WorkspaceAccessProvider";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { hasAbility } from "@/lib/access-control";
import { getPlatformCustomer, listPlatformCustomers, listSubscriptionPlans, updatePlatformCustomer, type PlatformCustomerRecord, type SubscriptionPlanRecord } from "@/lib/workspace-api";

const emptyCustomer: PlatformCustomerRecord = {
  id: 0,
  legalName: "",
  tradeName: "",
  taxNumber: "",
  registrationNumber: "",
  baseCurrency: "SAR",
  locale: "en",
  timezone: "Asia/Riyadh",
  isActive: true,
  suspendedReason: "",
  owner: { name: "", email: "" },
  users: [],
  subscription: null,
  referralSource: null,
};

const emptyPlanOptions: SubscriptionPlanRecord[] = [];

export function PlatformCustomersOverview() {
  const access = useWorkspaceAccess();
  const isPreview = ! access;
  const [filters, setFilters] = useState({ search: "", status: "" as "" | "active" | "suspended" });
  const [customers, setCustomers] = useState<PlatformCustomerRecord[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanRecord[]>(emptyPlanOptions);
  const [selectedCustomer, setSelectedCustomer] = useState<PlatformCustomerRecord>(emptyCustomer);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canManageCustomers = hasAbility(access?.platformAbilities ?? [], "platform.customers.manage");
  const selectedPlan = plans.find((plan) => plan.id === selectedCustomer.subscription?.planId) ?? null;

  const loadCustomers = useCallback(async () => {
    if (isPreview) {
      setCustomers([]);
      setPlans(emptyPlanOptions);
      setSelectedCustomer(emptyCustomer);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    try {
      const [nextCustomers, nextPlans] = await Promise.all([
        listPlatformCustomers(filters),
        listSubscriptionPlans(),
      ]);

      setCustomers(nextCustomers);
      setPlans(nextPlans);

      if (nextCustomers.length) {
        const nextSelected = selectedCustomer.id
          ? nextCustomers.find((customer) => customer.id === selectedCustomer.id) ?? nextCustomers[0]
          : nextCustomers[0];
        const detailedCustomer = await getPlatformCustomer(nextSelected.id);
        setSelectedCustomer(detailedCustomer);
      } else {
        setSelectedCustomer(emptyCustomer);
      }

      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Customers could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [filters, isPreview, selectedCustomer.id]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  async function handleSelect(customerId: number) {
    if (isPreview) {
      return;
    }

    try {
      const detailedCustomer = await getPlatformCustomer(customerId);
      setSelectedCustomer(detailedCustomer);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Customer details could not be loaded.");
    }
  }

  async function handleSave() {
    if (isPreview || ! selectedCustomer.id) {
      return;
    }

    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const saved = await updatePlatformCustomer(selectedCustomer);
      setSelectedCustomer(saved);
      setCustomers((current) => current.map((customer) => customer.id === saved.id ? saved : customer));
      setFeedback("Customer company details updated.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Customer changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-white/70 bg-white/95 p-6 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Customers</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Inspect company accounts, subscription state, referral source, and linked users from one support surface.</h1>
            <p className="mt-4 text-base leading-7 text-muted">This is the platform-level customer control area used by admin and support accounts.</p>
          </div>
          <Button onClick={() => void loadCustomers()} variant="secondary">Refresh</Button>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card className="rounded-xl bg-white/95 p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_180px_auto]">
              <Input label="Search customers" value={filters.search} disabled={isPreview} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
              <div>
                <label className="mb-2.5 block text-sm font-semibold text-ink" htmlFor="customer-status">Status</label>
                <select id="customer-status" className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-brand/45 focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60" value={filters.status} disabled={isPreview} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as "" | "active" | "suspended" }))}>
                  <option value="">All customers</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={() => void loadCustomers()} fullWidth disabled={isPreview}>Apply filters</Button>
              </div>
            </div>
          </Card>

          <WorkspaceDataTable
            registerTableId="platform-customers"
            title="Customer companies"
            caption="Select a company to review subscription, owner, and user details."
            rows={customers}
            emptyMessage={isPreview ? "Sign in to load live customer companies, subscriptions, and linked users." : loading ? "Loading customer companies..." : "No companies matched the current filters."}
            badge={isPreview ? "Preview" : loading ? "Loading" : `${customers.length} companies`}
            columns={[
              {
                id: "company",
                header: "Company",
                defaultWidth: 200,
                render: (row) => (
                  <button type="button" className="text-left font-semibold text-primary hover:text-primary-hover disabled:text-muted" disabled={isPreview} onClick={() => void handleSelect(row.id)}>
                    {row.legalName}
                  </button>
                ),
              },
              { id: "owner", header: "Owner", defaultWidth: 180, render: (row) => row.owner.name || row.owner.email || "-" },
              { id: "plan", header: "Plan", defaultWidth: 140, render: (row) => row.subscription?.planName ?? "No plan" },
              { id: "users", header: "Users", align: "right", defaultWidth: 80, render: (row) => row.users.length },
              { id: "status", header: "Status", defaultWidth: 100, render: (row) => row.isActive ? "Active" : "Suspended" },
            ]}
          />
        </div>

        <Card className="rounded-xl bg-white/95 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-ink">Company details</h2>
              <p className="mt-1 text-sm text-muted">Edit tenant status and inspect linked business context.</p>
            </div>
            <Button onClick={handleSave} disabled={saving || ! selectedCustomer.id || ! canManageCustomers}>{saving ? "Saving" : "Save company"}</Button>
          </div>
          {selectedCustomer.id ? (
            <div className="mt-5 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Legal name" value={selectedCustomer.legalName} disabled={! canManageCustomers} onChange={(event) => setSelectedCustomer((current) => ({ ...current, legalName: event.target.value }))} />
                <Input label="Trade name" value={selectedCustomer.tradeName} disabled={! canManageCustomers} onChange={(event) => setSelectedCustomer((current) => ({ ...current, tradeName: event.target.value }))} />
                <Input label="Tax number" value={selectedCustomer.taxNumber} disabled={! canManageCustomers} onChange={(event) => setSelectedCustomer((current) => ({ ...current, taxNumber: event.target.value }))} />
                <Input label="Registration number" value={selectedCustomer.registrationNumber} disabled={! canManageCustomers} onChange={(event) => setSelectedCustomer((current) => ({ ...current, registrationNumber: event.target.value }))} />
                <Input label="Base currency" value={selectedCustomer.baseCurrency} disabled={! canManageCustomers} onChange={(event) => setSelectedCustomer((current) => ({ ...current, baseCurrency: event.target.value.toUpperCase() }))} />
                <Input label="Locale" value={selectedCustomer.locale} disabled={! canManageCustomers} onChange={(event) => setSelectedCustomer((current) => ({ ...current, locale: event.target.value }))} />
                <div className="md:col-span-2">
                  <Input label="Timezone" value={selectedCustomer.timezone} disabled={! canManageCustomers} onChange={(event) => setSelectedCustomer((current) => ({ ...current, timezone: event.target.value }))} />
                </div>
              </div>

              {selectedPlan ? (
                <div className="rounded-lg border border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                  <p className="font-semibold text-ink">Plan limits and features</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <p>Invoice limit: <span className="font-semibold text-ink">{selectedPlan.invoiceLimit ?? "Unlimited"}</span></p>
                    <p>Customer limit: <span className="font-semibold text-ink">{selectedPlan.customerLimit ?? "Unlimited"}</span></p>
                    <p>Accountant seats: <span className="font-semibold text-ink">{selectedPlan.accountantSeatLimit ?? "Unlimited"}</span></p>
                    <p>Custom fields: <span className="font-semibold text-ink">{selectedPlan.featureFlags.custom_fields_limit ?? "Default"}</span></p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(selectedPlan.featureFlags).filter(([, value]) => value === true).map(([key]) => (
                      <span key={key} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary">{key.replaceAll("_", " ")}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink"><input type="checkbox" checked={selectedCustomer.isActive} disabled={! canManageCustomers} onChange={(event) => setSelectedCustomer((current) => ({ ...current, isActive: event.target.checked }))} />Customer company is active</label>
              {! selectedCustomer.isActive ? (
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-ink" htmlFor="suspended-reason">Suspended reason</label>
                  <textarea id="suspended-reason" className="min-h-24 w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-brand/45 focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60" value={selectedCustomer.suspendedReason} disabled={! canManageCustomers} onChange={(event) => setSelectedCustomer((current) => ({ ...current, suspendedReason: event.target.value }))} />
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                  <p className="font-semibold text-ink">Subscription</p>
                  <p className="mt-2 text-base text-ink">{selectedCustomer.subscription ? `${selectedCustomer.subscription.planName} (${selectedCustomer.subscription.status})` : "No subscription"}</p>
                </div>
                <div className="rounded-lg border border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                  <p className="font-semibold text-ink">Referral source</p>
                  <p className="mt-2 text-base text-ink">{selectedCustomer.referralSource ? `${selectedCustomer.referralSource.agentName || "Agent"} / ${selectedCustomer.referralSource.referralCode}` : "Direct signup"}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-ink" htmlFor="customer-plan">Assigned plan</label>
                  <select
                    id="customer-plan"
                    className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-brand/45 focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60"
                    value={selectedCustomer.subscription?.planId ?? ""}
                    disabled={! canManageCustomers}
                    onChange={(event) => {
                      const nextPlanId = event.target.value ? Number(event.target.value) : null;
                      const nextPlan = plans.find((plan) => plan.id === nextPlanId) ?? null;

                      setSelectedCustomer((current) => ({
                        ...current,
                        subscription: nextPlan ? {
                          planId: nextPlan.id,
                          planCode: nextPlan.code,
                          planName: nextPlan.name,
                          monthlyPriceSar: nextPlan.monthlyPriceSar,
                          status: current.subscription?.status ?? "active",
                        } : null,
                      }));
                    }}
                  >
                    <option value="">No assigned plan</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-ink" htmlFor="subscription-status">Subscription status</label>
                  <select
                    id="subscription-status"
                    className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-brand/45 focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60"
                    value={selectedCustomer.subscription?.status ?? "trialing"}
                    disabled={! canManageCustomers || !selectedCustomer.subscription}
                    onChange={(event) => setSelectedCustomer((current) => current.subscription ? {
                      ...current,
                      subscription: {
                        ...current.subscription,
                        status: event.target.value,
                      },
                    } : current)}
                  >
                    <option value="trialing">Trialing</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-line bg-surface-soft px-4 py-4">
                <p className="text-sm font-semibold text-ink">Linked users</p>
                <div className="mt-3 space-y-2 text-sm text-muted">
                  {selectedCustomer.users.length ? selectedCustomer.users.map((user) => (
                    <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                      <div>
                        <p className="font-semibold text-ink">{user.name}</p>
                        <p>{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-ink">{user.role}</p>
                        <p>{user.isActive ? "Active" : "Inactive"}</p>
                      </div>
                    </div>
                  )) : <p>No users linked to this company yet.</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-line bg-surface-soft px-4 py-6 text-sm text-muted">{isPreview ? "Sign in with an admin or support account to inspect live customer companies." : "Choose a company from the table to inspect it."}</div>
          )}
        </Card>
      </div>

      {isPreview ? <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">Preview mode shows the customer-control layout only. Sign in to search companies, edit subscription state, and save account changes.</div> : null}
      {! canManageCustomers ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">This account can view customer companies but cannot change company status or profile fields.</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}
    </div>
  );
}