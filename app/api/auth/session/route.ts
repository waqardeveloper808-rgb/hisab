import { NextRequest, NextResponse } from "next/server";
import {
  authSessionCookieName,
  authSessionMaxAge,
  createAuthSessionValue,
  readAuthSession,
} from "@/lib/auth-session";
import { getWorkspaceApiToken } from "@/lib/workspace-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await readAuthSession(request.cookies.get(authSessionCookieName)?.value);

  if (! session) {
    return NextResponse.json({ data: null }, { status: 401 });
  }

  return NextResponse.json({
    data: {
      ...session,
      user_id: session.userId,
      company_id: session.companyId ?? session.workspaceContext?.activeCompany?.id ?? null,
      auth_token: session.authToken ?? getWorkspaceApiToken(session),
    },
  });
}

export async function PATCH(request: NextRequest) {
  const session = await readAuthSession(request.cookies.get(authSessionCookieName)?.value);

  if (! session) {
    return NextResponse.json({ message: "Workspace session is required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as {
    activeCompanyId?: number;
    activeCompanyLegalName?: string;
    activeCompanyRole?: string;
    activeCompanyAbilities?: string[];
  } | null;

  if (typeof body?.activeCompanyId !== "number" || ! body.activeCompanyLegalName) {
    return NextResponse.json({ message: "Active company payload is required." }, { status: 400 });
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

  const response = NextResponse.json({ data: nextSession });
  response.cookies.set(authSessionCookieName, await createAuthSessionValue(nextSession), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: authSessionMaxAge,
    path: "/",
  });

  return response;
}