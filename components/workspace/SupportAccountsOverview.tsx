"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useWorkspaceAccess } from "@/components/workspace/WorkspaceAccessProvider";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { hasAbility } from "@/lib/access-control";
import { createSupportAccount, listSupportAccounts, updateSupportAccount, type SupportAccountRecord } from "@/lib/workspace-api";

type SupportAccountDraft = SupportAccountRecord & {
  password: string;
};

const emptyAccount: SupportAccountDraft = {
  id: 0,
  name: "",
  email: "",
  password: "",
  platformRole: "support",
  supportPermissions: [],
  isPlatformActive: true,
};

export function SupportAccountsOverview() {
  const access = useWorkspaceAccess();
  const isPreview = ! access;
  const canManageSupportAccounts = hasAbility(access?.platformAbilities ?? [], "platform.support_users.manage");
  const [accounts, setAccounts] = useState<SupportAccountRecord[]>([]);
  const [draft, setDraft] = useState<SupportAccountDraft>(emptyAccount);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    if (isPreview) {
      setAccounts([]);
      setDraft(emptyAccount);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    try {
      const nextAccounts = await listSupportAccounts();
      setAccounts(nextAccounts);
      setDraft((current) => current.id ? { ...current, ...(nextAccounts.find((account) => account.id === current.id) ?? current), password: "" } : emptyAccount);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Support accounts could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [isPreview]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  async function handleSave() {
    if (isPreview || ! canManageSupportAccounts) {
      return;
    }

    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const saved = draft.id
        ? await updateSupportAccount(draft.password ? draft : { ...draft, password: undefined })
        : await createSupportAccount(draft);

      const nextAccounts = draft.id
        ? accounts.map((account) => account.id === saved.id ? saved : account)
        : [...accounts, saved].sort((left, right) => left.name.localeCompare(right.name));

      setAccounts(nextAccounts);
      setDraft({ ...saved, password: "" });
      setFeedback(draft.id ? "Support account updated." : "Support account created.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Support account changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-white/70 bg-white/95 p-6 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Support accounts</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Create, activate, and limit who can operate the platform.</h1>
            <p className="mt-4 text-base leading-7 text-muted">This screen manages real support and super-admin user records.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setDraft(emptyAccount)} variant="secondary" disabled={isPreview || ! canManageSupportAccounts}>New account</Button>
            <Button onClick={() => void loadAccounts()} variant="tertiary">Refresh</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <WorkspaceDataTable
          registerTableId="admin-support-accounts"
          title="Support and admin accounts"
          caption="Select a row to edit it or create a new operating account."
          rows={accounts}
          emptyMessage={isPreview ? "Sign in with a super-admin account to load live support and admin users." : loading ? "Loading support accounts..." : "No support accounts exist yet."}
          badge={isPreview ? "Preview" : loading ? "Loading" : `${accounts.length} accounts`}
          columns={[
            {
              id: "name",
              header: "Name",
              defaultWidth: 180,
              render: (row) => (
                <button type="button" className="text-left font-semibold text-primary hover:text-primary-hover disabled:text-muted" disabled={isPreview} onClick={() => setDraft({ ...row, password: "" })}>
                  {row.name}
                </button>
              ),
            },
            { id: "email", header: "Email", defaultWidth: 200, render: (row) => row.email },
            { id: "role", header: "Role", defaultWidth: 120, render: (row) => row.platformRole.replaceAll("_", " ") },
            { id: "status", header: "Status", defaultWidth: 100, render: (row) => row.isPlatformActive ? "Active" : "Disabled" },
          ]}
        />

        <Card className="rounded-xl bg-white/95 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-ink">{draft.id ? "Edit support account" : "Create support account"}</h2>
              <p className="mt-1 text-sm text-muted">Support permissions can narrow a support account below its default role.</p>
            </div>
            <Button onClick={handleSave} disabled={isPreview || saving || ! canManageSupportAccounts}>{saving ? "Saving" : draft.id ? "Save account" : "Create account"}</Button>
          </div>
          <div className="mt-5 grid gap-4">
            <Input label="Name" value={draft.name} disabled={isPreview || ! canManageSupportAccounts} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
            <Input label="Email" type="email" value={draft.email} disabled={isPreview || ! canManageSupportAccounts} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} />
            <Input label={draft.id ? "New password (optional)" : "Password"} type="password" value={draft.password} disabled={isPreview || ! canManageSupportAccounts} onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))} />
            <div>
              <label className="mb-2.5 block text-sm font-semibold text-ink" htmlFor="platform-role">Platform role</label>
              <select id="platform-role" className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-brand/45 focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60" value={draft.platformRole} disabled={isPreview || ! canManageSupportAccounts} onChange={(event) => setDraft((current) => ({ ...current, platformRole: event.target.value }))}>
                <option value="support">Support</option>
                <option value="super_admin">Super admin</option>
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-semibold text-ink" htmlFor="support-permissions">Support permissions</label>
              <textarea id="support-permissions" className="min-h-24 w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-brand/45 focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60" value={draft.supportPermissions.join(", ")} disabled={isPreview || ! canManageSupportAccounts} onChange={(event) => setDraft((current) => ({ ...current, supportPermissions: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) }))} />
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink"><input type="checkbox" checked={draft.isPlatformActive} disabled={isPreview || ! canManageSupportAccounts} onChange={(event) => setDraft((current) => ({ ...current, isPlatformActive: event.target.checked }))} />Account is active</label>
          </div>
        </Card>
      </div>

      {isPreview ? <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">Preview mode shows the support-account layout only. Sign in as a super-admin to create or change platform operator accounts.</div> : null}
      {! canManageSupportAccounts ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">This account can view support accounts but cannot create, disable, or edit them.</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}
    </div>
  );
}