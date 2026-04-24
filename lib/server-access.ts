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

  if (backendContext.accessStatus === "company_context_missing") {
    return { access: null, status: "company_context_missing" };
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

  // #region agent log
  fetch('http://127.0.0.1:7465/ingest/b2483e75-3306-45a2-911d-fd8fcd98d8f8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b10564'},body:JSON.stringify({sessionId:'b10564',runId:'identity-entry-1',hypothesisId:'H4',location:'lib/server-access.ts:108',message:'Server workspace access gate evaluated',data:{sessionStatus,accessStatus,sessionId:session.id,companyId:session.companyId??null,hasAccess:Boolean(access),hasRequirements:Boolean(requirements)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (sessionStatus === "guest" || accessStatus === "invalid_session") {
    redirect("/login");
  }

  if (accessStatus === "company_context_missing" && !requirements) {
    return {
      session,
      access,
    };
  }

  if (accessStatus === "company_context_missing" || accessStatus === "backend_unconfigured" || accessStatus === "backend_unavailable") {
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
