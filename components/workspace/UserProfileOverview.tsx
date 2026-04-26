"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useWorkspaceSession } from "@/components/workspace/WorkspaceAccessProvider";

type UserProfileDraft = {
  displayName: string;
  email: string;
  phone: string;
  jobTitle: string;
  preferredLanguage: string;
  timezone: string;
};

const profileStorageKey = "hisabix:user-profile-draft";

function readStoredProfile(): Partial<UserProfileDraft> | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(profileStorageKey);
    return raw ? JSON.parse(raw) as Partial<UserProfileDraft> : null;
  } catch {
    return null;
  }
}

export function UserProfileOverview() {
  const session = useWorkspaceSession();
  const [draft, setDraft] = useState<UserProfileDraft>({
    displayName: session?.name ?? "",
    email: session?.email ?? "",
    phone: "",
    jobTitle: "",
    preferredLanguage: "en",
    timezone: "Asia/Riyadh",
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStoredProfile();
    setDraft((current) => ({
      ...current,
      displayName: stored?.displayName ?? session?.name ?? current.displayName,
      email: stored?.email ?? session?.email ?? current.email,
      phone: stored?.phone ?? current.phone,
      jobTitle: stored?.jobTitle ?? current.jobTitle,
      preferredLanguage: stored?.preferredLanguage ?? current.preferredLanguage,
      timezone: stored?.timezone ?? current.timezone,
    }));
  }, [session?.email, session?.name]);

  const profileSummary = useMemo(() => ([
    { label: "Workspace access", value: session?.accessStatus === "guest" ? "Preview mode" : "Authenticated session" },
    { label: "Platform role", value: session?.platformRole ?? "User" },
    { label: "Active company", value: session?.activeCompanyLegalName ?? "Not selected" },
  ]), [session?.accessStatus, session?.activeCompanyLegalName, session?.platformRole]);

  function updateDraft<K extends keyof UserProfileDraft>(key: K, value: UserProfileDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFeedback(null);
  }

  function handleSave() {
    try {
      window.localStorage.setItem(profileStorageKey, JSON.stringify(draft));
      setFeedback("User profile preferences saved on this device.");
    } catch {
      setFeedback("User profile changes could not be saved in this browser.");
    }
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border-white/70 bg-white/95 p-4 shadow-[0_20px_40px_-34px_rgba(17,32,24,0.18)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">User settings</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">Profile and workspace preferences</h1>
            <p className="mt-2 text-sm leading-6 text-muted">Keep operator details, preferred language, and local workspace preferences together without affecting company-level settings.</p>
          </div>
          <Button onClick={handleSave}>Save profile</Button>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-xl bg-white/95 p-4">
          <h2 className="text-lg font-semibold text-ink">User info</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input label="Display name" value={draft.displayName} onChange={(event) => updateDraft("displayName", event.target.value)} />
            <Input label="Email" type="email" value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} />
            <Input label="Phone" value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} />
            <Input label="Job title" value={draft.jobTitle} onChange={(event) => updateDraft("jobTitle", event.target.value)} />
            <Input label="Preferred language" value={draft.preferredLanguage} onChange={(event) => updateDraft("preferredLanguage", event.target.value)} />
            <Input label="Timezone" value={draft.timezone} onChange={(event) => updateDraft("timezone", event.target.value)} />
          </div>
        </Card>

        <Card className="rounded-xl bg-white/95 p-4">
          <h2 className="text-lg font-semibold text-ink">Session summary</h2>
          <div className="mt-4 space-y-3">
            {profileSummary.map((item) => (
              <div key={item.label} className="rounded-lg border border-line bg-surface-soft px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-ink">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-800">
            Profile preferences are stored locally for this workspace browser session. Company identity and document defaults stay under company settings.
          </div>
        </Card>
      </div>

      {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}
    </div>
  );
}
