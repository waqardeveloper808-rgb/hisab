import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authSessionCookieName, readAuthSession, type AuthSession } from "@/lib/auth-session";
import { canAccessWorkspaceArea } from "@/lib/access-control";
import type { WorkspaceAccessProfile } from "@/lib/workspace-api";

const guestWorkspaceSession: AuthSession = {
  id: 0,
  name: "Guest preview",
  email: "preview@gulfhisab.local",
  platformRole: "guest",
};

function getWorkspaceBackendConfig() {
  const baseUrl = process.env.GULF_HISAB_API_BASE_URL ?? process.env.NEXT_PUBLIC_GULF_HISAB_API_BASE_URL;
  const companyId = process.env.GULF_HISAB_COMPANY_ID ?? process.env.NEXT_PUBLIC_GULF_HISAB_COMPANY_ID;
  const apiToken = process.env.GULF_HISAB_API_TOKEN ?? process.env.WORKSPACE_API_TOKEN;

  if (! baseUrl || ! companyId || ! apiToken) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    companyId,
    apiToken,
  };
}

export function hasAbility(abilities: string[], ability: string) {
  return abilities.includes("*") || abilities.includes(ability);
}

export function hasAnyAbility(abilities: string[], expected: string[]) {
  return expected.some((ability) => hasAbility(abilities, ability));
}

export async function getWorkspaceSessionAccess() {
  const cookieStore = await cookies();
  const session = await readAuthSession(cookieStore.get(authSessionCookieName)?.value) ?? guestWorkspaceSession;

  const access = await fetchWorkspaceAccessProfile(session);

  return {
    session,
    access,
  };
}

export async function fetchWorkspaceAccessProfile(session: AuthSession): Promise<WorkspaceAccessProfile | null> {
  if (session.id <= 0) {
    return null;
  }

  const config = getWorkspaceBackendConfig();

  if (! config) {
    return null;
  }

  try {
    const response = await fetch(`${config.baseUrl}/api/companies/${config.companyId}/access-profile`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Gulf-Hisab-Actor-Id": String(session.id),
        "X-Gulf-Hisab-Workspace-Token": config.apiToken,
      },
    });

    if (! response.ok) {
      return null;
    }

    const payload = await response.json() as { data: WorkspaceAccessProfile };
    return payload.data;
  } catch {
    return null;
  }
}

export async function requireWorkspaceAccess(requirements?: { platform?: string[]; company?: string[] }) {
  const { session, access } = await getWorkspaceSessionAccess();

  if (! canAccessWorkspaceArea(access, requirements)) {
    redirect("/workspace/dashboard");
  }

  return {
    session,
    access,
  };
}