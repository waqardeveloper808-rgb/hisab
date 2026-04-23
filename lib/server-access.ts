import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authSessionCookieName, readAuthSession, type AuthSession } from "@/lib/auth-session";
import { canAccessWorkspaceArea } from "@/lib/access-control";
import type { WorkspaceAccessProfile } from "@/lib/workspace-api";
import {
  resolveWorkspaceBackendContext,
} from "@/lib/workspace-session";

const guestWorkspaceSession: AuthSession = {
  id: 0,
  userId: 0,
  name: "Guest preview",
  email: "preview@gulfhisab.local",
  platformRole: "guest",
};

export type WorkspaceAccessStatus = "guest" | "backend_unconfigured" | "backend_unavailable" | "ready";

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
  const authenticatedSession = await readAuthSession(cookieStore.get(authSessionCookieName)?.value);

  if (!authenticatedSession) {
    return {
      session: guestWorkspaceSession,
      access: null,
      accessStatus: "guest" as const,
    };
  }

  const result = await fetchWorkspaceAccessProfileResult(authenticatedSession);

  return {
    session: authenticatedSession,
    access: result.access,
    accessStatus: result.status,
  };
}

export async function fetchWorkspaceAccessProfile(session: AuthSession): Promise<WorkspaceAccessProfile | null> {
  return (await fetchWorkspaceAccessProfileResult(session)).access;
}

async function fetchWorkspaceAccessProfileResult(session: AuthSession): Promise<WorkspaceAccessProfileResult> {
  if (session.id <= 0) {
    return { access: null, status: "guest" };
  }

  const backendContext = resolveWorkspaceBackendContext(session);

  if (!backendContext) {
    return { access: null, status: "backend_unconfigured" };
  }

  try {
    const response = await fetch(`${backendContext.baseUrl}/api/companies/${backendContext.companyId}/access-profile`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Gulf-Hisab-Actor-Id": String(backendContext.actorId),
        "X-Gulf-Hisab-Workspace-Token": backendContext.apiToken,
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
  const { session, access, accessStatus } = await getWorkspaceSessionAccess();

  if (accessStatus === "guest") {
    redirect("/login");
  }

  if (! canAccessWorkspaceArea(access, requirements)) {
    redirect("/workspace/user");
  }

  return {
    session,
    access,
  };
}
