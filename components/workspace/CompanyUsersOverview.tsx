"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useWorkspaceAccess } from "@/components/workspace/WorkspaceAccessProvider";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { hasAbility } from "@/lib/access-control";
import { createCompanyUser, getCompanyUsers, updateCompanyUser, type CompanyUserRecord, type CompanyUsersSnapshot } from "@/lib/workspace-api";

type CompanyUserDraft = CompanyUserRecord & {
  password: string;
};

const emptyUser: CompanyUserDraft = {
  id: 0,
  name: "",
  email: "",
  role: "accountant",
  isActive: true,
  permissions: [],
  joinedAt: "",
  password: "",
};

const emptySnapshot: CompanyUsersSnapshot = {
  seatLimit: null,
  users: [],
};

export function CompanyUsersOverview() {
  const access = useWorkspaceAccess();
  const isPreview = ! access;
  const canManageUsers = hasAbility(access?.membership?.abilities ?? [], "company.users.manage");
  const [snapshot, setSnapshot] = useState<CompanyUsersSnapshot>(emptySnapshot);
  const [draft, setDraft] = useState<CompanyUserDraft>(emptyUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (isPreview) {
      setSnapshot(emptySnapshot);
      setDraft(emptyUser);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    try {
      const nextSnapshot = await getCompanyUsers();

      if (nextSnapshot) {
        setSnapshot(nextSnapshot);
        setDraft((current) => current.id ? { ...current, ...(nextSnapshot.users.find((user) => user.id === current.id) ?? current), password: "" } : emptyUser);
      }

      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Company users could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [isPreview]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function handleSave() {
    if (isPreview || ! canManageUsers) {
      return;
    }

    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const saved = draft.id
        ? await updateCompanyUser(draft.password ? draft : { ...draft, password: undefined })
        : await createCompanyUser(draft);

      const nextUsers = draft.id
        ? snapshot.users.map((user) => user.id === saved.id ? saved : user)
        : [...snapshot.users, saved];

      setSnapshot((current) => ({ ...current, users: nextUsers }));
      setDraft({ ...saved, password: "" });
      setFeedback(draft.id ? "Company user updated." : "Company user created.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Company user changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const activeAccountants = snapshot.users.filter((user) => user.role === "accountant" && user.isActive).length;

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Company users</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Manage business admins and accountant seats with real backend enforcement.</h1>
            <p className="mt-4 text-base leading-7 text-muted">Seat limits are enforced by the subscription plan. Owner accounts stay outside this editor by design.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setDraft(emptyUser)} variant="secondary" disabled={isPreview || ! canManageUsers}>New user</Button>
            <Button onClick={() => void loadUsers()} variant="tertiary">Refresh</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-[1.8rem] bg-white/92 p-5"><p className="text-sm font-semibold text-muted">Total users</p><p className="mt-3 text-3xl font-semibold text-ink">{snapshot.users.length}</p></Card>
        <Card className="rounded-[1.8rem] bg-white/92 p-5"><p className="text-sm font-semibold text-muted">Active accountants</p><p className="mt-3 text-3xl font-semibold text-ink">{activeAccountants}</p></Card>
        <Card className="rounded-[1.8rem] bg-white/92 p-5"><p className="text-sm font-semibold text-muted">Seat limit</p><p className="mt-3 text-3xl font-semibold text-ink">{snapshot.seatLimit ?? "Unlimited"}</p></Card>
        <Card className="rounded-[1.8rem] bg-white/92 p-5"><p className="text-sm font-semibold text-muted">Remaining seats</p><p className="mt-3 text-3xl font-semibold text-ink">{snapshot.seatLimit === null ? "Unlimited" : Math.max(snapshot.seatLimit - activeAccountants, 0)}</p></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <WorkspaceDataTable
          title="Internal users"
          caption="Select a row to edit its role, permissions, and active status."
          rows={snapshot.users}
          emptyMessage={isPreview ? "Sign in with a company admin account to load and manage internal users." : loading ? "Loading users..." : "No internal users have been added yet."}
          badge={isPreview ? "Preview" : loading ? "Loading" : `${snapshot.users.length} users`}
          columns={[
            {
              header: "Name",
              render: (row) => (
                <button type="button" className="text-left font-semibold text-primary hover:text-primary-hover disabled:text-muted" disabled={isPreview} onClick={() => setDraft({ ...row, password: "" })}>
                  {row.name}
                </button>
              ),
            },
            { header: "Email", render: (row) => row.email },
            { header: "Role", render: (row) => row.role },
            { header: "Status", render: (row) => row.isActive ? "Active" : "Inactive" },
          ]}
        />

        <Card className="rounded-[1.8rem] bg-white/92 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-ink">{draft.id ? "Edit user" : "Create user"}</h2>
              <p className="mt-1 text-sm text-muted">Use explicit permissions only when the default role abilities are too broad.</p>
            </div>
            <Button onClick={handleSave} disabled={isPreview || saving || ! canManageUsers}>{saving ? "Saving" : draft.id ? "Save user" : "Create user"}</Button>
          </div>
          <div className="mt-5 grid gap-4">
            <Input label="Name" value={draft.name} disabled={isPreview || ! canManageUsers} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
            <Input label="Email" type="email" value={draft.email} disabled={isPreview || ! canManageUsers} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} />
            <Input label={draft.id ? "New password (optional)" : "Password"} type="password" value={draft.password} disabled={isPreview || ! canManageUsers} onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))} />
            <div>
              <label className="mb-2.5 block text-sm font-semibold text-ink" htmlFor="company-user-role">Role</label>
              <select id="company-user-role" className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-brand/45 focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60" value={draft.role} disabled={isPreview || ! canManageUsers} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}>
                <option value="accountant">Accountant</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-semibold text-ink" htmlFor="company-user-permissions">Explicit permissions</label>
              <textarea id="company-user-permissions" className="min-h-24 w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-brand/45 focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60" value={draft.permissions.join(", ")} disabled={isPreview || ! canManageUsers} onChange={(event) => setDraft((current) => ({ ...current, permissions: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) }))} />
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink"><input type="checkbox" checked={draft.isActive} disabled={isPreview || ! canManageUsers} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} />User is active</label>
          </div>
        </Card>
      </div>

      {isPreview ? <div className="rounded-[1.2rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">Preview mode shows the user-management layout only. Sign in with a company admin account to manage admins, accountant seats, and permissions.</div> : null}
      {! canManageUsers ? <div className="rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">This account can view company users but cannot create, disable, or edit them.</div> : null}
      {error ? <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {feedback ? <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}
    </div>
  );
}