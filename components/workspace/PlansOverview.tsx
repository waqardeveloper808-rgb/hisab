"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useWorkspaceAccess } from "@/components/workspace/WorkspaceAccessProvider";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { hasAbility } from "@/lib/access-control";
import {
  createSubscriptionPlan,
  getPlatformConfig,
  listSubscriptionPlans,
  updatePlatformConfig,
  updateSubscriptionPlan,
  type PlatformConfigRecord,
  type SubscriptionPlanRecord,
} from "@/lib/workspace-api";

const emptyConfig: PlatformConfigRecord = {
  supportDisplayName: "Hisabix Support",
  supportWhatsappNumber: "966500000000",
  supportEmail: "support@hisabix.sa",
  freeTrialDays: 45,
  freeInvoiceLimit: 1,
  paidPlanMonthlyPriceSar: 40,
  defaultAgentCommissionRate: 20,
};

const emptyPlan: SubscriptionPlanRecord = {
  id: 0,
  code: "",
  name: "",
  description: "",
  monthlyPriceSar: 0,
  annualPriceSar: 0,
  trialDays: 0,
  invoiceLimit: null,
  customerLimit: null,
  accountantSeatLimit: null,
  featureFlags: {},
  marketingPoints: [],
  isVisible: true,
  isFree: false,
  isPaid: true,
  isActive: true,
  sortOrder: 0,
};

const featureToggleDefinitions = [
  { key: "document_templates", label: "Document templates" },
  { key: "custom_fields", label: "Dynamic fields" },
  { key: "cost_centers", label: "Cost centers" },
  { key: "purchase_intelligence", label: "Purchase intelligence" },
  { key: "business_intelligence", label: "Business intelligence" },
  { key: "support_center", label: "Help and support center" },
  { key: "api_invoicing", label: "API invoicing" },
];

const featureLimitDefinitions = [
  { key: "custom_fields_limit", label: "Custom field limit" },
];

function parseNumber(value: string) {
  return value.trim() === "" ? null : Number(value);
}

function parseBooleanFlag(value: string | number | boolean | null | undefined) {
  return value === true || value === "true" || value === 1 || value === "1";
}

export function PlansOverview() {
  const access = useWorkspaceAccess();
  const isPreview = ! access;
  const [config, setConfig] = useState<PlatformConfigRecord>(emptyConfig);
  const [plans, setPlans] = useState<SubscriptionPlanRecord[]>([]);
  const [planDraft, setPlanDraft] = useState<SubscriptionPlanRecord>(emptyPlan);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canManagePlans = hasAbility(access?.platformAbilities ?? [], "platform.plans.manage");

  const loadData = useCallback(async () => {
    if (isPreview) {
      setConfig(emptyConfig);
      setPlans([]);
      setPlanDraft(emptyPlan);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    try {
      const [nextConfig, nextPlans] = await Promise.all([
        getPlatformConfig(),
        listSubscriptionPlans(),
      ]);

      if (nextConfig) {
        setConfig(nextConfig);
      }

      setPlans(nextPlans);
      setPlanDraft(nextPlans[0] ?? emptyPlan);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Platform plans could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [isPreview]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function updateDraft<K extends keyof SubscriptionPlanRecord>(key: K, value: SubscriptionPlanRecord[K]) {
    setPlanDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleConfigSave() {
    setSavingConfig(true);
    setFeedback(null);
    setError(null);

    try {
      const saved = await updatePlatformConfig(config);
      setConfig(saved);
      setFeedback("Platform pricing and support settings were saved.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Platform settings could not be saved.");
    } finally {
      setSavingConfig(false);
    }
  }

  async function handlePlanSave() {
    setSavingPlan(true);
    setFeedback(null);
    setError(null);

    try {
      const saved = planDraft.id
        ? await updateSubscriptionPlan(planDraft)
        : await createSubscriptionPlan(planDraft);

      const nextPlans = planDraft.id
        ? plans.map((plan) => (plan.id === saved.id ? saved : plan))
        : [...plans, saved].sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id);

      setPlans(nextPlans);
      setPlanDraft(saved);
      setFeedback(planDraft.id ? "Plan changes were saved." : "New plan created.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Plan changes could not be saved.");
    } finally {
      setSavingPlan(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-white/70 bg-white/95 p-6 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Platform plans</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Control pricing, limits, support defaults, and the sales offer from one operating screen.</h1>
            <p className="mt-4 text-base leading-7 text-muted">These values drive the public plans page, trial policy, support contact, and the subscription limits used inside access control.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setPlanDraft(emptyPlan)} variant="secondary" disabled={isPreview || ! canManagePlans}>New plan</Button>
            <Button onClick={() => void loadData()} variant="tertiary">Refresh</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="rounded-xl bg-white/95 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-ink">Support and trial defaults</h2>
                <p className="mt-1 text-sm text-muted">These values affect onboarding and the public pricing promise.</p>
              </div>
              <Button onClick={handleConfigSave} disabled={savingConfig || ! canManagePlans}>{savingConfig ? "Saving" : "Save defaults"}</Button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input label="Support display name" value={config.supportDisplayName} disabled={isPreview || ! canManagePlans} onChange={(event) => setConfig((current) => ({ ...current, supportDisplayName: event.target.value }))} />
              <Input label="Support WhatsApp" value={config.supportWhatsappNumber} disabled={isPreview || ! canManagePlans} onChange={(event) => setConfig((current) => ({ ...current, supportWhatsappNumber: event.target.value }))} />
              <Input label="Support email" type="email" value={config.supportEmail} disabled={isPreview || ! canManagePlans} onChange={(event) => setConfig((current) => ({ ...current, supportEmail: event.target.value }))} />
              <Input label="Free trial days" type="number" value={String(config.freeTrialDays)} disabled={isPreview || ! canManagePlans} onChange={(event) => setConfig((current) => ({ ...current, freeTrialDays: Number(event.target.value || 0) }))} />
              <Input label="Free invoice limit" type="number" value={String(config.freeInvoiceLimit)} disabled={isPreview || ! canManagePlans} onChange={(event) => setConfig((current) => ({ ...current, freeInvoiceLimit: Number(event.target.value || 0) }))} />
              <Input label="Default agent commission rate" type="number" value={String(config.defaultAgentCommissionRate)} disabled={isPreview || ! canManagePlans} onChange={(event) => setConfig((current) => ({ ...current, defaultAgentCommissionRate: Number(event.target.value || 0) }))} />
              <div className="md:col-span-2">
                <Input label="Reference monthly price" type="number" value={String(config.paidPlanMonthlyPriceSar)} disabled={isPreview || ! canManagePlans} onChange={(event) => setConfig((current) => ({ ...current, paidPlanMonthlyPriceSar: Number(event.target.value || 0) }))} />
              </div>
            </div>
          </Card>

          <WorkspaceDataTable
            registerTableId="admin-plans"
            title="Plans"
            caption="Visible pricing offers and internal limits. Select a row to edit it."
            rows={plans}
            emptyMessage={isPreview ? "Sign in with a platform admin account to load and edit real pricing plans." : loading ? "Loading plans..." : "No plans have been created yet."}
            badge={isPreview ? "Preview" : loading ? "Loading" : `${plans.length} plans`}
            columns={[
              {
                id: "plan",
                header: "Plan",
                defaultWidth: 200,
                render: (row) => (
                  <button type="button" className="text-left font-semibold text-primary hover:text-primary-hover disabled:text-muted" disabled={isPreview} onClick={() => setPlanDraft(row)}>
                    {row.name}
                  </button>
                ),
              },
              { id: "code", header: "Code", defaultWidth: 100, render: (row) => row.code },
              { id: "monthly", header: "Monthly", align: "right", defaultWidth: 100, render: (row) => `${row.monthlyPriceSar} SAR` },
              { id: "seats", header: "Seats", align: "right", defaultWidth: 90, render: (row) => row.accountantSeatLimit ?? "Unlimited" },
              { id: "status", header: "Status", defaultWidth: 90, render: (row) => row.isActive ? "Active" : "Inactive" },
            ]}
          />
        </div>

        <Card className="rounded-xl bg-white/95 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-ink">{planDraft.id ? `Edit ${planDraft.name || "plan"}` : "Create plan"}</h2>
              <p className="mt-1 text-sm text-muted">Feature flags are stored as enabled keys. Marketing points appear on pricing surfaces.</p>
            </div>
            <Button onClick={handlePlanSave} disabled={isPreview || savingPlan || ! canManagePlans}>{savingPlan ? "Saving" : planDraft.id ? "Save plan" : "Create plan"}</Button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input label="Code" value={planDraft.code} disabled={isPreview || ! canManagePlans} onChange={(event) => updateDraft("code", event.target.value)} />
            <Input label="Name" value={planDraft.name} disabled={isPreview || ! canManagePlans} onChange={(event) => updateDraft("name", event.target.value)} />
            <div className="md:col-span-2">
              <label className="mb-2.5 block text-sm font-semibold text-ink" htmlFor="plan-description">Description</label>
              <textarea id="plan-description" className="min-h-28 w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-brand/45 focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60" value={planDraft.description} disabled={isPreview || ! canManagePlans} onChange={(event) => updateDraft("description", event.target.value)} />
            </div>
            <Input label="Monthly price SAR" type="number" value={String(planDraft.monthlyPriceSar)} disabled={isPreview || ! canManagePlans} onChange={(event) => updateDraft("monthlyPriceSar", Number(event.target.value || 0))} />
            <Input label="Annual price SAR" type="number" value={String(planDraft.annualPriceSar)} disabled={isPreview || ! canManagePlans} onChange={(event) => updateDraft("annualPriceSar", Number(event.target.value || 0))} />
            <Input label="Trial days" type="number" value={String(planDraft.trialDays)} disabled={isPreview || ! canManagePlans} onChange={(event) => updateDraft("trialDays", Number(event.target.value || 0))} />
            <Input label="Sort order" type="number" value={String(planDraft.sortOrder)} disabled={isPreview || ! canManagePlans} onChange={(event) => updateDraft("sortOrder", Number(event.target.value || 0))} />
            <Input label="Invoice limit" type="number" value={planDraft.invoiceLimit ?? ""} disabled={isPreview || ! canManagePlans} onChange={(event) => updateDraft("invoiceLimit", parseNumber(event.target.value))} />
            <Input label="Customer limit" type="number" value={planDraft.customerLimit ?? ""} disabled={isPreview || ! canManagePlans} onChange={(event) => updateDraft("customerLimit", parseNumber(event.target.value))} />
            <Input label="Accountant seat limit" type="number" value={planDraft.accountantSeatLimit ?? ""} disabled={isPreview || ! canManagePlans} onChange={(event) => updateDraft("accountantSeatLimit", parseNumber(event.target.value))} />
            <div className="md:col-span-2">
              <label className="mb-2.5 block text-sm font-semibold text-ink" htmlFor="plan-marketing">Marketing points</label>
              <textarea id="plan-marketing" className="min-h-28 w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-brand/45 focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60" value={planDraft.marketingPoints.join("\n")} disabled={isPreview || ! canManagePlans} onChange={(event) => updateDraft("marketingPoints", event.target.value.split("\n").map((value) => value.trim()).filter(Boolean))} />
            </div>
            <div className="md:col-span-2">
              <p className="mb-2.5 text-sm font-semibold text-ink">Feature toggles</p>
              <div className="grid gap-3 md:grid-cols-2">
                {featureToggleDefinitions.map((feature) => (
                  <label key={feature.key} className="flex items-center gap-3 rounded-2xl border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink">
                    <input
                      type="checkbox"
                      checked={parseBooleanFlag(planDraft.featureFlags[feature.key])}
                      disabled={isPreview || ! canManagePlans}
                      onChange={(event) => updateDraft("featureFlags", {
                        ...planDraft.featureFlags,
                        [feature.key]: event.target.checked,
                      })}
                    />
                    {feature.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
              {featureLimitDefinitions.map((feature) => (
                <Input
                  key={feature.key}
                  label={feature.label}
                  type="number"
                  value={planDraft.featureFlags[feature.key] == null ? "" : String(planDraft.featureFlags[feature.key])}
                  disabled={isPreview || ! canManagePlans}
                  onChange={(event) => updateDraft("featureFlags", {
                    ...planDraft.featureFlags,
                    [feature.key]: parseNumber(event.target.value),
                  })}
                />
              ))}
            </div>
            <div className="md:col-span-2">
              <label className="mb-2.5 block text-sm font-semibold text-ink" htmlFor="plan-flags">Advanced feature flags</label>
              <textarea id="plan-flags" className="min-h-24 w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-brand/45 focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60" value={Object.entries(planDraft.featureFlags).filter(([key]) => !featureToggleDefinitions.some((item) => item.key === key) && !featureLimitDefinitions.some((item) => item.key === key)).map(([key, value]) => `${key}:${String(value)}`).join(", ")} disabled={isPreview || ! canManagePlans} onChange={(event) => updateDraft("featureFlags", {
                ...Object.fromEntries(Object.entries(planDraft.featureFlags).filter(([key]) => featureToggleDefinitions.some((item) => item.key === key) || featureLimitDefinitions.some((item) => item.key === key))),
                ...Object.fromEntries(event.target.value.split(",").map((value) => value.trim()).filter(Boolean).map((entry) => {
                  const [key, rawValue] = entry.split(":");
                  return [key.trim(), rawValue?.trim() === "true" ? true : rawValue?.trim() === "false" ? false : parseNumber(rawValue?.trim() ?? "") ?? rawValue?.trim() ?? true];
                })),
              })} />
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink"><input type="checkbox" checked={planDraft.isVisible} disabled={isPreview || ! canManagePlans} onChange={(event) => updateDraft("isVisible", event.target.checked)} />Visible on public pricing</label>
            <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink"><input type="checkbox" checked={planDraft.isActive} disabled={isPreview || ! canManagePlans} onChange={(event) => updateDraft("isActive", event.target.checked)} />Active for sales</label>
            <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink"><input type="checkbox" checked={planDraft.isFree} disabled={isPreview || ! canManagePlans} onChange={(event) => updateDraft("isFree", event.target.checked)} />Free plan</label>
            <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink"><input type="checkbox" checked={planDraft.isPaid} disabled={isPreview || ! canManagePlans} onChange={(event) => updateDraft("isPaid", event.target.checked)} />Paid plan</label>
          </div>
        </Card>
      </div>

      {isPreview ? <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">Preview mode shows the pricing-control layout only. Sign in as a platform admin to edit support defaults, plans, and feature flags.</div> : null}
      {! canManagePlans ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">This account can view platform plans but cannot change pricing or support defaults.</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}
    </div>
  );
}