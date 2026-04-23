import type { AuthSession, AuthSessionReadResult } from "@/lib/auth-session";

export type WorkspaceCompanyContext = NonNullable<AuthSession["workspaceContext"]>["activeCompany"];
export type WorkspaceAccessStatus = "guest" | "invalid_session" | "backend_unconfigured" | "backend_unavailable" | "ready";
export type WorkspaceBackendContext = {
  backendBaseUrl: string | null;
  activeCompanyId: number | null;
  companyId: string | null;
  actorId: number | null;
  workspaceToken: string | null;
  backendConfigured: boolean;
  accessStatus: WorkspaceAccessStatus;
};

export function getWorkspaceBackendBaseUrl() {
  const baseUrl = process.env.GULF_HISAB_API_BASE_URL ?? process.env.NEXT_PUBLIC_GULF_HISAB_API_BASE_URL;
  return baseUrl?.replace(/\/$/, "") ?? null;
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

function isSessionReady(session: AuthSession | null): session is AuthSession {
  return Boolean(session)
    && typeof session?.id === "number"
    && session.id > 0
    && typeof session.userId === "number"
    && session.userId > 0
    && typeof session.authToken === "string"
    && session.authToken.trim().length > 0
    && typeof session.companyId === "number"
    && session.companyId > 0
    && typeof session.workspaceContext?.activeCompany?.id === "number"
    && session.workspaceContext.activeCompany.id > 0
    && typeof session.workspaceContext.activeCompany.legalName === "string"
    && session.workspaceContext.activeCompany.legalName.trim().length > 0;
}

function isAuthSessionReadResult(value: AuthSession | AuthSessionReadResult | null): value is AuthSessionReadResult {
  return Boolean(value && typeof value === "object" && "status" in value && "session" in value);
}

export function resolveWorkspaceBackendContext(sessionInput: AuthSession | AuthSessionReadResult | null): WorkspaceBackendContext {
  const backendBaseUrl = getWorkspaceBackendBaseUrl();
  const sessionResult = isAuthSessionReadResult(sessionInput)
    ? sessionInput
    : sessionInput
      ? { status: "ready" as const, session: sessionInput, reason: null }
      : { status: "guest" as const, session: null, reason: "missing" as const };

  if (sessionResult.status === "guest") {
    return {
      backendBaseUrl,
      activeCompanyId: null,
      companyId: null,
      actorId: null,
      workspaceToken: null,
      backendConfigured: false,
      accessStatus: "guest",
    };
  }

  if (sessionResult.status === "invalid_session" || !isSessionReady(sessionResult.session)) {
    return {
      backendBaseUrl,
      activeCompanyId: null,
      companyId: null,
      actorId: null,
      workspaceToken: null,
      backendConfigured: false,
      accessStatus: "invalid_session",
    };
  }

  const activeCompanyId = sessionResult.session.companyId ?? sessionResult.session.workspaceContext?.activeCompany?.id ?? null;
  const actorId = sessionResult.session.userId;
  const workspaceToken = sessionResult.session.authToken;
  const backendConfigured = Boolean(backendBaseUrl && activeCompanyId && actorId && workspaceToken);

  return {
    backendBaseUrl,
    activeCompanyId,
    companyId: activeCompanyId ? String(activeCompanyId) : null,
    actorId,
    workspaceToken,
    backendConfigured,
    accessStatus: backendConfigured ? "ready" : "backend_unconfigured",
  };
}
