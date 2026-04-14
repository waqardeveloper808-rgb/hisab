"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import {
  createCostCenter,
  listCostCenters,
  updateCostCenter,
  type CostCenterRecord,
} from "@/lib/workspace-api";

const emptyDraft: CostCenterRecord = {
  id: 0,
  name: "",
  code: "",
  description: "",
  isActive: true,
};

export function CostCentersOverview() {
  const [costCenters, setCostCenters] = useState<CostCenterRecord[]>([]);
  const [draft, setDraft] = useState<CostCenterRecord>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    try {
      const nextCostCenters = await listCostCenters();
      setCostCenters(nextCostCenters);
      setDraft(nextCostCenters[0] ?? emptyDraft);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Cost centers could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const saved = draft.id
        ? await updateCostCenter(draft)
        : await createCostCenter({
            name: draft.name,
            code: draft.code,
            description: draft.description,
            isActive: draft.isActive,
          });
      const nextCostCenters = draft.id
        ? costCenters.map((item) => item.id === saved.id ? saved : item)
        : [...costCenters, saved].sort((left, right) => left.code.localeCompare(right.code));

      setCostCenters(nextCostCenters);
      setDraft(saved);
      setFeedback(draft.id ? "Cost center updated." : "Cost center created.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Cost center could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Cost centers</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Group purchase activity by department, project, or operational stream without leaving the workspace.</h1>
            <p className="mt-4 text-base leading-7 text-muted">These cost centers are available directly inside purchase draft editing and are stored on both the document and line level.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setDraft(emptyDraft)}>New cost center</Button>
            <Button onClick={() => void loadData()} variant="tertiary">Refresh</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <Card className="rounded-[1.8rem] bg-white/92 p-6">
          <h2 className="text-2xl font-semibold text-ink">Saved cost centers</h2>
          <div className="mt-5 space-y-3">
            {loading ? <div className="rounded-[1.4rem] border border-dashed border-line bg-surface-soft px-4 py-6 text-sm text-muted">Loading cost centers...</div> : null}
            {!loading && !costCenters.length ? <div className="rounded-[1.4rem] border border-dashed border-line bg-surface-soft px-4 py-6 text-sm text-muted">Create the first cost center to start tagging purchase documents.</div> : null}
            {costCenters.map((costCenter) => (
              <button key={costCenter.id} type="button" onClick={() => setDraft(costCenter)} className={["block w-full rounded-[1.4rem] border px-4 py-3 text-left text-sm", draft.id === costCenter.id ? "border-primary bg-primary-soft" : "border-line bg-surface-soft hover:bg-white"].join(" ")}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{costCenter.code}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{costCenter.isActive ? "Active" : "Inactive"}</span>
                </div>
                <p className="mt-1 text-ink">{costCenter.name}</p>
                <p className="mt-1 text-muted">{costCenter.description || "No description"}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="rounded-[1.8rem] bg-white/92 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-ink">{draft.id ? "Edit cost center" : "Create cost center"}</h2>
              <p className="mt-1 text-sm text-muted">Use stable codes so line-level allocation stays readable in reports and exports.</p>
            </div>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving" : draft.id ? "Save cost center" : "Create cost center"}</Button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input label="Code" value={draft.code} onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="OPS-RYD" />
            <Input label="Name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Riyadh operations" />
            <div className="md:col-span-2">
              <label htmlFor="cost-center-description" className="mb-2.5 block text-sm font-semibold text-ink">Description</label>
              <textarea id="cost-center-description" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} rows={4} className="block w-full rounded-[1.4rem] border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
            </div>
            <label className="inline-flex items-center gap-3 rounded-2xl border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink">
              <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} />
              Active for assignment
            </label>
          </div>
        </Card>
      </div>

      {error ? <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {feedback ? <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}
    </div>
  );
}