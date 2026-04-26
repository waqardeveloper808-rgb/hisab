"use client";

import Link from "next/link";
import { Button } from "@/components/Button";
import type { WorkspaceAccessStatus } from "@/lib/workspace-session";

type WorkspaceRecoveryStateProps = {
  accessStatus?: WorkspaceAccessStatus;
  session: {
    name: string;
    email: string;
    activeCompanyId?: number | null;
  };
};

const stateContent: Record<WorkspaceAccessStatus, {
  badge: string;
  title: string;
  description: string;
  steps: string[];
}> = {
  guest: {
    badge: "Authentication required",
    title: "Sign in to continue",
    description: "Your workspace session is missing, so Hisabix cannot load company data yet.",
    steps: [
      "Sign in again to restore your workspace session.",
      "After login, return to the workspace to continue.",
    ],
  },
  invalid_session: {
    badge: "Session issue",
    title: "Your session needs to be refreshed",
    description: "The current workspace session is no longer valid.",
    steps: [
      "Sign out and sign back in to restore the secure session cookie.",
      "Retry opening the workspace after the session refresh completes.",
    ],
  },
  company_context_missing: {
    badge: "Company setup required",
    title: "Finish workspace onboarding",
    description: "Your user session is active, but no active company is linked yet. The workspace shell stays available so you can complete setup without hitting a redirect loop.",
    steps: [
      "Create or connect a company profile for this user.",
      "Select the active company so invoices, reports, and settings can load.",
      "Return to the workspace home after company setup is complete.",
    ],
  },
  backend_unconfigured: {
    badge: "Configuration required",
    title: "Workspace backend is not configured",
    description: "The frontend session is active, but the workspace backend connection does not have enough company context to load business data.",
    steps: [
      "Verify the active company is attached to the current session.",
      "Confirm the workspace API base URL and token are configured.",
      "Reload the workspace after configuration is restored.",
    ],
  },
  backend_unavailable: {
    badge: "Backend unavailable",
    title: "Workspace data service is temporarily unavailable",
    description: "The shell is loaded, but the workspace backend could not be reached for company data.",
    steps: [
      "Confirm the backend API is running and reachable.",
      "Retry once the backend access profile endpoint responds again.",
      "Use Help if the issue persists after backend recovery.",
    ],
  },
  ready: {
    badge: "Ready",
    title: "Workspace is ready",
    description: "Your workspace is connected and ready to load data.",
    steps: [],
  },
};

export function WorkspaceRecoveryState({ accessStatus = "backend_unavailable", session }: WorkspaceRecoveryStateProps) {
  const content = stateContent[accessStatus] ?? stateContent.backend_unavailable;
  const isCompanySetupState = accessStatus === "company_context_missing";
  const isGuestState = accessStatus === "guest";

  return (
    <section className="mx-auto max-w-4xl rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <span className="inline-flex rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
            {content.badge}
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-ink">{content.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">{content.description}</p>
          </div>
        </div>
        <div className="min-w-[240px] rounded-xl border border-line bg-surface-soft p-4 text-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Session</p>
          <p className="mt-2 font-semibold text-ink">{session.name}</p>
          <p className="text-muted">{session.email}</p>
          <p className="mt-3 text-xs text-muted">
            Active company: {typeof session.activeCompanyId === "number" && session.activeCompanyId > 0 ? `#${session.activeCompanyId}` : "not selected"}
          </p>
        </div>
      </div>

      {content.steps.length > 0 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-xl border border-line p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Next steps</p>
            <ol className="mt-3 space-y-3 text-sm text-ink">
              {content.steps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-line p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Actions</p>
            <div className="mt-3 space-y-2">
              <Button size="sm" variant="primary" href={isCompanySetupState ? "/onboarding/company" : isGuestState ? "/login" : "/workspace/help"}>
                {isCompanySetupState ? "Open Company Setup" : isGuestState ? "Go to Login" : "Open Help"}
              </Button>
              <Button size="sm" variant="secondary" href="/plans">
                View Plans
              </Button>
              <Link href="/login" className="block text-xs font-semibold text-primary hover:underline">
                Return to login
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
