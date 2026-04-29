"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useWorkspaceAccess } from "@/components/workspace/WorkspaceAccessProvider";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { hasAbility } from "@/lib/access-control";
import { listPlatformAgents, updatePlatformAgent, type PlatformAgentRecord } from "@/lib/workspace-api";

const emptyAgent: PlatformAgentRecord = {
  id: 0,
  name: "",
  email: "",
  referralCode: "",
  commissionRate: 0,
  isActive: true,
  referralsCount: 0,
  pendingCommission: 0,
  earnedCommission: 0,
};

export function PlatformAgentsOverview() {
  const access = useWorkspaceAccess();
  const isPreview = ! access;
  const [filters, setFilters] = useState({ search: "", status: "" as "" | "active" | "inactive" });
  const [agents, setAgents] = useState<PlatformAgentRecord[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<PlatformAgentRecord>(emptyAgent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canManageAgents = hasAbility(access?.platformAbilities ?? [], "platform.agents.manage");

  const loadAgents = useCallback(async () => {
    if (isPreview) {
      setAgents([]);
      setSelectedAgent(emptyAgent);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    try {
      const nextAgents = await listPlatformAgents(filters);
      setAgents(nextAgents);
      setSelectedAgent((current) => current.id ? nextAgents.find((agent) => agent.id === current.id) ?? current : nextAgents[0] ?? emptyAgent);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Agents could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [filters, isPreview]);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  async function handleSave() {
    if (isPreview || ! selectedAgent.id) {
      return;
    }

    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const saved = await updatePlatformAgent(selectedAgent);
      setAgents((current) => current.map((agent) => agent.id === saved.id ? saved : agent));
      setSelectedAgent(saved);
      setFeedback("Agent account updated.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Agent changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-white/70 bg-white/95 p-6 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Agent admin</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Search referral agents, adjust commission, and control who is active on the platform.</h1>
            <p className="mt-4 text-base leading-7 text-muted">This screen is live against the platform agent records, not a reporting mock.</p>
          </div>
          <Button onClick={() => void loadAgents()} variant="secondary">Refresh</Button>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="rounded-xl bg-white/95 p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_180px_auto]">
              <Input label="Search agents" value={filters.search} disabled={isPreview} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
              <div>
                <label className="mb-2.5 block text-sm font-semibold text-ink" htmlFor="agent-status">Status</label>
                <select id="agent-status" className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-brand/45 focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60" value={filters.status} disabled={isPreview} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as "" | "active" | "inactive" }))}>
                  <option value="">All agents</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={() => void loadAgents()} fullWidth disabled={isPreview}>Apply filters</Button>
              </div>
            </div>
          </Card>

          <WorkspaceDataTable
            registerTableId="platform-agents"
            title="Agents"
            caption="Select an agent row to edit commission and activation status."
            rows={agents}
            emptyMessage={isPreview ? "Sign in with a platform admin account to load live referral agents and commission data." : loading ? "Loading agents..." : "No agents matched the current filters."}
            badge={isPreview ? "Preview" : loading ? "Loading" : `${agents.length} agents`}
            columns={[
              {
                id: "name",
                header: "Name",
                defaultWidth: 180,
                render: (row) => (
                  <button type="button" className="text-left font-semibold text-primary hover:text-primary-hover disabled:text-muted" disabled={isPreview} onClick={() => setSelectedAgent(row)}>
                    {row.name || row.email}
                  </button>
                ),
              },
              { id: "code", header: "Referral code", defaultWidth: 120, render: (row) => row.referralCode },
              { id: "commission", header: "Commission", align: "right", defaultWidth: 100, render: (row) => `${row.commissionRate}%` },
              { id: "pending", header: "Pending", align: "right", defaultWidth: 110, render: (row) => `${row.pendingCommission} SAR` },
              { id: "status", header: "Status", defaultWidth: 100, render: (row) => row.isActive ? "Active" : "Inactive" },
            ]}
          />
        </div>

        <Card className="rounded-xl bg-white/95 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-ink">Agent details</h2>
              <p className="mt-1 text-sm text-muted">Edit commission and identity for the selected agent.</p>
            </div>
            <Button onClick={handleSave} disabled={isPreview || saving || ! selectedAgent.id || ! canManageAgents}>{saving ? "Saving" : "Save agent"}</Button>
          </div>
          {selectedAgent.id ? (
            <div className="mt-5 grid gap-4">
              <Input label="Name" value={selectedAgent.name} disabled={isPreview || ! canManageAgents} onChange={(event) => setSelectedAgent((current) => ({ ...current, name: event.target.value }))} />
              <Input label="Email" type="email" value={selectedAgent.email} disabled={isPreview || ! canManageAgents} onChange={(event) => setSelectedAgent((current) => ({ ...current, email: event.target.value }))} />
              <Input label="Referral code" value={selectedAgent.referralCode} readOnly />
              <Input label="Commission rate" type="number" value={String(selectedAgent.commissionRate)} disabled={isPreview || ! canManageAgents} onChange={(event) => setSelectedAgent((current) => ({ ...current, commissionRate: Number(event.target.value || 0) }))} />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                  <p className="font-semibold text-ink">Referral count</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">{selectedAgent.referralsCount}</p>
                </div>
                <div className="rounded-lg border border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                  <p className="font-semibold text-ink">Earned commission</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">{selectedAgent.earnedCommission} SAR</p>
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink"><input type="checkbox" checked={selectedAgent.isActive} disabled={isPreview || ! canManageAgents} onChange={(event) => setSelectedAgent((current) => ({ ...current, isActive: event.target.checked }))} />Agent is active</label>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-line bg-surface-soft px-4 py-6 text-sm text-muted">{isPreview ? "Sign in with a platform admin account to inspect live agents and commissions." : "Choose an agent from the table to edit it."}</div>
          )}
        </Card>
      </div>

      {isPreview ? <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">Preview mode shows the agent-admin layout only. Sign in to search agents, adjust commission rates, and change activation status.</div> : null}
      {! canManageAgents ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">This account can inspect agents but cannot change commission or activation status.</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}
    </div>
  );
}