import { NextRequest, NextResponse } from "next/server";
import {
  authSessionCookieName,
  authSessionMaxAge,
  createAuthSessionValue,
  readAuthSessionOutcome,
} from "@/lib/auth-session";
import { resolveWorkspaceBackendContext } from "@/lib/workspace-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionResult = await readAuthSessionOutcome(request.cookies.get(authSessionCookieName)?.value);
  const backendContext = resolveWorkspaceBackendContext(sessionResult);

  if (sessionResult.status !== "ready" || ! sessionResult.session) {
    return NextResponse.json({
      data: null,
      access_status: backendContext.accessStatus,
      reason: sessionResult.reason,
    }, { status: 401, headers: { "X-Workspace-Mode": "backend" } });
  }

  const session = sessionResult.session;

  return NextResponse.json({
    user: {
      id: session.id,
      name: session.name,
      email: session.email,
      platform_role: session.platformRole ?? null,
    },
    active_company_id: backendContext.activeCompanyId,
    data: {
      user: {
        id: session.id,
        name: session.name,
        email: session.email,
        platform_role: session.platformRole ?? null,
      },
      ...session,
      user_id: session.userId,
      company_id: backendContext.activeCompanyId,
      active_company_id: backendContext.activeCompanyId,
      actor_id: backendContext.actorId,
      backend_base_url: backendContext.backendBaseUrl,
      backend_configured: backendContext.backendConfigured,
      access_status: backendContext.accessStatus,
      auth_token: session.authToken,
      workspace_backend_context: backendContext,
    },
  }, { headers: { "X-Workspace-Mode": "backend" } });
}

export async function PATCH(request: NextRequest) {
  const sessionResult = await readAuthSessionOutcome(request.cookies.get(authSessionCookieName)?.value);

  if (sessionResult.status !== "ready" || ! sessionResult.session) {
    return NextResponse.json({
      message: sessionResult.status === "guest" ? "Workspace session is required." : "Invalid workspace session.",
      access_status: sessionResult.status,
      reason: sessionResult.reason,
    }, { status: 401, headers: { "X-Workspace-Mode": "backend" } });
  }

  const session = sessionResult.session;

  const body = await request.json().catch(() => null) as {
    activeCompanyId?: number;
    activeCompanyLegalName?: string;
    activeCompanyRole?: string;
    activeCompanyAbilities?: string[];
  } | null;

  if (typeof body?.activeCompanyId !== "number" || ! body.activeCompanyLegalName) {
    return NextResponse.json({ message: "Active company payload is required." }, { status: 400, headers: { "X-Workspace-Mode": "backend" } });
  }

  const nextSession = {
    ...session,
    companyId: body.activeCompanyId,
    workspaceContext: {
      ...session.workspaceContext,
      activeCompany: {
        id: body.activeCompanyId,
        legalName: body.activeCompanyLegalName,
        role: body.activeCompanyRole,
        abilities: Array.isArray(body.activeCompanyAbilities) ? body.activeCompanyAbilities : session.workspaceContext?.activeCompany?.abilities,
      },
    },
  };

  const backendContext = resolveWorkspaceBackendContext(nextSession);
  const response = NextResponse.json({
    data: {
      ...nextSession,
      user_id: nextSession.userId,
      company_id: backendContext.activeCompanyId,
      active_company_id: backendContext.activeCompanyId,
      actor_id: backendContext.actorId,
      backend_base_url: backendContext.backendBaseUrl,
      backend_configured: backendContext.backendConfigured,
      access_status: backendContext.accessStatus,
      auth_token: nextSession.authToken,
      workspace_backend_context: backendContext,
    },
  }, {
    headers: { "X-Workspace-Mode": "backend" },
  });

  response.cookies.set(authSessionCookieName, await createAuthSessionValue(nextSession), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: authSessionMaxAge,
    path: "/",
  });

  return response;
}
