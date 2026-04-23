import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authSessionCookieName, readAuthSessionOutcome, type AuthSession } from "@/lib/auth-session";
import { canAccessWorkspaceArea } from "@/lib/access-control";
import type { WorkspaceAccessProfile } from "@/lib/workspace-api";
import {
  resolveWorkspaceBackendContext,
  type WorkspaceAccessStatus,
} from "@/lib/workspace-session";

const guestWorkspaceSession: AuthSession = {
  id: 0,
  userId: 0,
  name: "Guest preview",
  email: "preview@gulfhisab.local",
  platformRole: "guest",
};

type WorkspaceAccessProfileResult = {
  access: WorkspaceAccessProfile | null;
  status: WorkspaceAccessStatus;
};

export function hasAbility(abilities: string[], ability: string) {
  return abilities.includes("*") || abilities.includes(ability);
}

export function hasAnyAbility(abilities: string[], expected: string[]) {
  return expected.some((ability) => hasAbility(abilities, ability));
}

export async function getWorkspaceSessionAccess() {
  const cookieStore = await cookies();
  const sessionResult = await readAuthSessionOutcome(cookieStore.get(authSessionCookieName)?.value);
  const sessionStatus = sessionResult.status;

  if (sessionResult.status === "guest") {
    return {
      session: guestWorkspaceSession,
      access: null,
      sessionStatus: "guest" as const,
      accessStatus: "guest" as const,
    };
  }

  if (sessionResult.status === "invalid_session") {
    return {
      session: guestWorkspaceSession,
      access: null,
      sessionStatus: "invalid_session" as const,
      accessStatus: "invalid_session" as const,
    };
  }

  const result = await fetchWorkspaceAccessProfileResult(sessionResult.session);

  return {
    session: sessionResult.session,
    sessionStatus,
    access: result.access,
    accessStatus: result.status,
  };
}

export async function fetchWorkspaceAccessProfile(session: AuthSession): Promise<WorkspaceAccessProfile | null> {
  return (await fetchWorkspaceAccessProfileResult(session)).access;
}

async function fetchWorkspaceAccessProfileResult(session: AuthSession): Promise<WorkspaceAccessProfileResult> {
  const backendContext = resolveWorkspaceBackendContext(session);

  if (backendContext.accessStatus === "guest") {
    return { access: null, status: "guest" };
  }

  if (backendContext.accessStatus === "invalid_session") {
    return { access: null, status: "invalid_session" };
  }

  if (! backendContext.backendConfigured || !backendContext.backendBaseUrl || !backendContext.companyId || !backendContext.actorId || !backendContext.workspaceToken) {
    return { access: null, status: "backend_unconfigured" };
  }

  try {
    const response = await fetch(`${backendContext.backendBaseUrl}/api/companies/${backendContext.companyId}/access-profile`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Gulf-Hisab-Actor-Id": String(backendContext.actorId),
        "X-Gulf-Hisab-Workspace-Token": backendContext.workspaceToken,
      },
    });

    if (! response.ok) {
      return { access: null, status: "backend_unavailable" };
    }

    const payload = await response.json() as { data: WorkspaceAccessProfile };
    return { access: payload.data, status: "ready" };
  } catch {
    return { access: null, status: "backend_unavailable" };
  }
}

export async function requireWorkspaceAccess(requirements?: { platform?: string[]; company?: string[] }) {
  const { session, access, sessionStatus, accessStatus } = await getWorkspaceSessionAccess();

  if (sessionStatus === "guest" || accessStatus === "invalid_session") {
    redirect("/login");
  }

  if (accessStatus === "backend_unconfigured" || accessStatus === "backend_unavailable") {
    redirect("/workspace/user?access_status=" + accessStatus);
  }

  if (! canAccessWorkspaceArea(access, requirements)) {
    redirect("/workspace/user");
  }

  return {
    session,
    access,
  };
}
