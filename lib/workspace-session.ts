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

const workspacePathAliases: Record<string, string> = {
  invoices: "sales-documents",
  customers: "contacts",
  products: "products",
};

export function getWorkspaceBackendBaseUrl() {
  const baseUrl = process.env.GULF_HISAB_API_BASE_URL ?? process.env.NEXT_PUBLIC_GULF_HISAB_API_BASE_URL;
  return baseUrl?.replace(/\/$/, "") ?? null;
}

export function getConfiguredWorkspaceCompanyId() {
  return process.env.GULF_HISAB_COMPANY_ID ?? process.env.NEXT_PUBLIC_GULF_HISAB_COMPANY_ID ?? null;
}

export function getWorkspaceApiToken(session?: AuthSession | null) {
  if (typeof session?.authToken === "string" && session.authToken.trim().length > 0) {
    return session.authToken;
  }

  return process.env.GULF_HISAB_API_TOKEN ?? process.env.WORKSPACE_API_TOKEN ?? null;
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

export function resolveWorkspaceBackendPath(slug: string[]) {
  if (!slug.length) {
    return slug;
  }

  const [root, ...rest] = slug;
  const backendRoot = workspacePathAliases[root] ?? root;

  return [backendRoot, ...rest];
}

function isSessionReady(session: AuthSession | null): session is AuthSession {
  const activeCompanyId = session?.companyId ?? session?.workspaceContext?.activeCompany?.id;
  const workspaceToken = getWorkspaceApiToken(session ?? null);

  return Boolean(session)
    && typeof session?.id === "number"
    && session.id > 0
    && typeof session.userId === "number"
    && session.userId > 0
    && typeof activeCompanyId === "number"
    && activeCompanyId > 0
    && typeof workspaceToken === "string"
    && workspaceToken.trim().length > 0;
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
  const workspaceToken = getWorkspaceApiToken(sessionResult.session);
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
