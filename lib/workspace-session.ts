import type { AuthSession } from "@/lib/auth-session";

export type WorkspaceCompanyContext = NonNullable<AuthSession["workspaceContext"]>["activeCompany"];
export type WorkspaceBackendContext = {
  baseUrl: string;
  companyId: string;
  apiToken: string;
  actorId: number;
};

export function getWorkspaceBackendBaseUrl() {
  const baseUrl = process.env.GULF_HISAB_API_BASE_URL ?? process.env.NEXT_PUBLIC_GULF_HISAB_API_BASE_URL;
  return baseUrl?.replace(/\/$/, "") ?? null;
}

export function getWorkspaceApiToken(session?: AuthSession | null) {
  if (typeof session?.authToken === "string" && session.authToken.trim().length > 0) {
    return session.authToken;
  }

  return process.env.GULF_HISAB_API_TOKEN ?? process.env.WORKSPACE_API_TOKEN ?? null;
}

export function getConfiguredWorkspaceCompanyId() {
  return process.env.GULF_HISAB_COMPANY_ID ?? process.env.NEXT_PUBLIC_GULF_HISAB_COMPANY_ID ?? null;
}

export function resolveSessionWorkspaceCompanyId(session: AuthSession | null) {
  const explicitCompanyId = session?.companyId;

  if (typeof explicitCompanyId === "number" && explicitCompanyId > 0) {
    return String(explicitCompanyId);
  }

  const sessionCompanyId = session?.workspaceContext?.activeCompany?.id;

  if (typeof sessionCompanyId === "number" && sessionCompanyId > 0) {
    return String(sessionCompanyId);
  }

  return null;
}

export function resolveWorkspaceBackendContext(session: AuthSession | null): WorkspaceBackendContext | null {
  const baseUrl = getWorkspaceBackendBaseUrl();
  const companyId = resolveSessionWorkspaceCompanyId(session);
  const apiToken = getWorkspaceApiToken(session);

  if (!session || !baseUrl || !companyId || !apiToken) {
    return null;
  }

  return {
    baseUrl,
    companyId,
    apiToken,
    actorId: session.userId ?? session.id,
  };
}
