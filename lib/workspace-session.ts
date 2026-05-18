import type { AuthSession, AuthSessionReadResult } from "@/lib/auth-session";

export type WorkspaceCompanyContext = NonNullable<AuthSession["workspaceContext"]>["activeCompany"];
export type WorkspaceAccessStatus = "guest" | "invalid_session" | "company_context_missing" | "backend_unconfigured" | "backend_unavailable" | "ready";
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
  const workspaceToken = getWorkspaceApiToken(session ?? null);

  return Boolean(session)
    && typeof session?.id === "number"
    && session.id > 0
    && typeof session.userId === "number"
    && session.userId > 0
    && typeof workspaceToken === "string"
    && workspaceToken.trim().length > 0;
}

function hasWorkspaceCompanyContext(session: AuthSession) {
  const activeCompany = session.workspaceContext?.activeCompany;

  return typeof activeCompany?.id === "number"
    && activeCompany.id > 0
    && typeof activeCompany.legalName === "string"
    && activeCompany.legalName.trim().length > 0;
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
    const token = getWorkspaceApiToken(null);
    const companyIdStr = getConfiguredWorkspaceCompanyId();
    const auditActorRaw = process.env.GULF_HISAB_AUDIT_ACTOR_ID ?? process.env.AUDIT_ACTOR_ID;
    const auditActorId = auditActorRaw !== undefined && String(auditActorRaw).trim() !== ""
      ? Number.parseInt(String(auditActorRaw), 10)
      : NaN;
    if (backendBaseUrl && token && companyIdStr) {
      const activeCompanyId = Number.parseInt(String(companyIdStr), 10);
      return {
        backendBaseUrl,
        activeCompanyId: Number.isFinite(activeCompanyId) ? activeCompanyId : null,
        companyId: companyIdStr,
        actorId: Number.isFinite(auditActorId) && auditActorId > 0 ? auditActorId : 1,
        workspaceToken: token,
        backendConfigured: true,
        accessStatus: "ready",
      };
    }
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
    const token = getWorkspaceApiToken(null);
    const companyIdStr = getConfiguredWorkspaceCompanyId();
    const auditActorRaw = process.env.GULF_HISAB_AUDIT_ACTOR_ID ?? process.env.AUDIT_ACTOR_ID;
    const auditActorId = auditActorRaw !== undefined && String(auditActorRaw).trim() !== ""
      ? Number.parseInt(String(auditActorRaw), 10)
      : NaN;
    if (backendBaseUrl && token && companyIdStr) {
      const activeCompanyId = Number.parseInt(String(companyIdStr), 10);
      return {
        backendBaseUrl,
        activeCompanyId: Number.isFinite(activeCompanyId) ? activeCompanyId : null,
        companyId: companyIdStr,
        actorId: Number.isFinite(auditActorId) && auditActorId > 0 ? auditActorId : 1,
        workspaceToken: token,
        backendConfigured: true,
        accessStatus: "ready",
      };
    }
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

  if (!hasWorkspaceCompanyContext(sessionResult.session)) {
    return {
      backendBaseUrl,
      activeCompanyId: null,
      companyId: resolveSessionWorkspaceCompanyId(sessionResult.session),
      actorId: sessionResult.session.userId,
      workspaceToken: getWorkspaceApiToken(sessionResult.session),
      backendConfigured: false,
      accessStatus: "company_context_missing",
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

export {
  ACTIVE_WORKSPACE_SLUG,
  getActiveWorkspace,
  getActiveWorkspaceSlug,
  CANONICAL_USER_WORKSPACE_BASE,
  canonicalizeWorkspaceHref,
  canonicalizeWorkspacePathname,
  WORKSPACE_PATH_NO_PREFIX_ROOTS,
} from "./active-workspace";
