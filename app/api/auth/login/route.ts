import { NextRequest, NextResponse } from "next/server";
import {
  authSessionCookieName,
  authSessionMaxAge,
  createAuthSessionValue,
} from "@/lib/auth-session";
import {
  getConfiguredWorkspaceCompanyId,
  getWorkspaceApiToken,
  getWorkspaceBackendBaseUrl,
  type WorkspaceCompanyContext,
} from "@/lib/workspace-session";

export const dynamic = "force-dynamic";

const dummyLoginEmail = process.env.DUMMY_LOGIN_EMAIL?.trim().toLowerCase() || "demo@gulfhisab.local";
const dummyLoginPassword = process.env.DUMMY_LOGIN_PASSWORD || "demo123";

function resolvePayloadAuthToken(payloadData: Record<string, unknown> | undefined) {
  const candidateKeys = ["auth_token", "authToken", "workspace_token", "workspaceToken", "token", "access_token"];

  for (const key of candidateKeys) {
    const value = payloadData?.[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function isDummyLoginRequest(body: unknown) {
  if (process.env.NODE_ENV === "production" || ! body || typeof body !== "object") {
    return false;
  }

  const candidate = body as { email?: unknown; password?: unknown };

  return typeof candidate.email === "string"
    && typeof candidate.password === "string"
    && candidate.email.trim().toLowerCase() === dummyLoginEmail
    && candidate.password === dummyLoginPassword;
}

function buildDummyCompanyContext() {
  const companyId = Number(getConfiguredWorkspaceCompanyId() ?? "2");

  return {
    id: Number.isFinite(companyId) && companyId > 0 ? companyId : 2,
    legalName: process.env.DUMMY_LOGIN_COMPANY_NAME?.trim() || "Gulf Hisab Demo Company",
    role: "owner",
    abilities: ["*"],
  } satisfies WorkspaceCompanyContext;
}

async function createDummyLoginResponse() {
  const activeCompany = buildDummyCompanyContext();
  const authToken = getWorkspaceApiToken() ?? "dummy-workspace-token";
  const sessionValue = await createAuthSessionValue({
    id: 999001,
    userId: 999001,
    name: process.env.DUMMY_LOGIN_NAME?.trim() || "Demo User",
    email: dummyLoginEmail,
    authToken,
    companyId: activeCompany.id,
    platformRole: "admin",
    workspaceContext: {
      activeCompany,
    },
  });

  const nextResponse = NextResponse.json({
    data: {
      id: 999001,
      user_id: 999001,
      name: process.env.DUMMY_LOGIN_NAME?.trim() || "Demo User",
      email: dummyLoginEmail,
      auth_token: authToken,
      company_id: activeCompany.id,
      platform_role: "admin",
      workspace_context: {
        active_company: {
          id: activeCompany.id,
          legal_name: activeCompany.legalName,
          role: activeCompany.role,
          abilities: activeCompany.abilities,
        },
      },
      dummy_login: true,
    },
  });

  nextResponse.cookies.set(authSessionCookieName, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: authSessionMaxAge,
    path: "/",
  });

  return nextResponse;
}

function getBackendBaseUrl() {
  return getWorkspaceBackendBaseUrl();
}

async function resolvePreferredCompanyContext(params: {
  baseUrl: string;
  actorId: number;
  fallbackCompany: WorkspaceCompanyContext | undefined;
}) {
  const companyId = getConfiguredWorkspaceCompanyId();
  const apiToken = getWorkspaceApiToken();

  if (! companyId || ! apiToken) {
    return params.fallbackCompany;
  }

  try {
    const response = await fetch(`${params.baseUrl}/api/companies/${companyId}/access-profile`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Gulf-Hisab-Actor-Id": String(params.actorId),
        "X-Gulf-Hisab-Workspace-Token": apiToken,
      },
    });

    if (! response.ok) {
      return params.fallbackCompany;
    }

    const payload = await response.json() as {
      data?: {
        company?: { id?: number; legal_name?: string };
        membership?: { role?: string; abilities?: string[] } | null;
      };
    };
    const company = payload.data?.company;

    if (typeof company?.id !== "number" || typeof company.legal_name !== "string") {
      return params.fallbackCompany;
    }

    return {
      id: company.id,
      legalName: company.legal_name,
      role: payload.data?.membership?.role,
      abilities: Array.isArray(payload.data?.membership?.abilities) ? payload.data.membership.abilities : params.fallbackCompany?.abilities,
    } satisfies WorkspaceCompanyContext;
  } catch {
    return params.fallbackCompany;
  }
}

export async function POST(request: NextRequest) {
  const baseUrl = getBackendBaseUrl();
  const body = await request.json();

  if (isDummyLoginRequest(body)) {
    return createDummyLoginResponse();
  }

  if (! baseUrl) {
    return NextResponse.json({ message: "Backend auth is not configured." }, { status: 503 });
  }

  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await response.text();

  if (! response.ok) {
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
      },
    });
  }

  const payload = JSON.parse(text) as {
    data: {
      id: number;
      name: string;
      email: string;
      platform_role?: string;
      auth_token?: string;
      authToken?: string;
      workspace_token?: string;
      workspaceToken?: string;
      token?: string;
      access_token?: string;
      workspace_context?: {
        active_company?: {
          id: number;
          legal_name: string;
          role?: string;
          abilities?: string[];
        } | null;
      };
    };
  };
  const fallbackCompany = payload.data.workspace_context?.active_company
    ? {
        id: payload.data.workspace_context.active_company.id,
        legalName: payload.data.workspace_context.active_company.legal_name,
        role: payload.data.workspace_context.active_company.role,
        abilities: payload.data.workspace_context.active_company.abilities,
      } satisfies WorkspaceCompanyContext
    : undefined;
  const activeCompany = await resolvePreferredCompanyContext({
    baseUrl,
    actorId: payload.data.id,
    fallbackCompany,
  });
  const authToken = resolvePayloadAuthToken(payload.data as unknown as Record<string, unknown>) ?? getWorkspaceApiToken();

  const sessionValue = await createAuthSessionValue({
    id: payload.data.id,
    userId: payload.data.id,
    name: payload.data.name,
    email: payload.data.email,
    authToken: authToken ?? undefined,
    companyId: activeCompany?.id,
    platformRole: payload.data.platform_role,
    workspaceContext: activeCompany
      ? {
          activeCompany,
        }
      : undefined,
  });
  const nextResponse = NextResponse.json({
    data: {
      id: payload.data.id,
      user_id: payload.data.id,
      name: payload.data.name,
      email: payload.data.email,
      auth_token: authToken,
      company_id: activeCompany?.id ?? null,
      platform_role: payload.data.platform_role,
      workspace_context: activeCompany
        ? {
            active_company: {
              id: activeCompany.id,
              legal_name: activeCompany.legalName,
              role: activeCompany.role,
              abilities: activeCompany.abilities,
            },
          }
        : payload.data.workspace_context,
    },
  });

  nextResponse.cookies.set(authSessionCookieName, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: authSessionMaxAge,
    path: "/",
  });

  return nextResponse;
}