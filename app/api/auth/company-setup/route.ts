import { NextRequest, NextResponse } from "next/server";
import {
  authSessionCookieName,
  authSessionMaxAge,
  createAuthSessionValue,
  readAuthSession,
} from "@/lib/auth-session";
import { getWorkspaceApiToken, getWorkspaceBackendBaseUrl } from "@/lib/workspace-session";

export const dynamic = "force-dynamic";

type CompanySetupResponse = {
  data?: {
    id?: number;
    legal_name?: string;
  };
};

export async function POST(request: NextRequest) {
  const session = await readAuthSession(request.cookies.get(authSessionCookieName)?.value);

  if (!session?.userId) {
    return NextResponse.json({ message: "Sign in is required before company setup." }, { status: 401 });
  }

  const baseUrl = getWorkspaceBackendBaseUrl();
  const workspaceToken = getWorkspaceApiToken(session);

  if (!baseUrl || !workspaceToken) {
    return NextResponse.json({ message: "Workspace backend is not configured." }, { status: 503 });
  }

  const payload = await request.json();
  const response = await fetch(`${baseUrl}/api/companies`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Gulf-Hisab-Actor-Id": String(session.userId),
      "X-Gulf-Hisab-Workspace-Token": workspaceToken,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
      },
    });
  }

  const result = JSON.parse(text) as CompanySetupResponse;
  const companyId = Number(result.data?.id ?? 0);
  const legalName = String(result.data?.legal_name ?? "").trim();

  if (!companyId || !legalName) {
    return NextResponse.json({ message: "Company setup returned an incomplete response." }, { status: 502 });
  }

  const sessionValue = await createAuthSessionValue({
    ...session,
    companyId,
    authToken: workspaceToken,
    workspaceContext: {
      activeCompany: {
        id: companyId,
        legalName,
        role: "owner",
      },
    },
  });

  const nextResponse = NextResponse.json({
    data: {
      id: companyId,
      legal_name: legalName,
    },
  }, { status: 201 });

  nextResponse.cookies.set(authSessionCookieName, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: authSessionMaxAge,
    path: "/",
  });

  return nextResponse;
}
