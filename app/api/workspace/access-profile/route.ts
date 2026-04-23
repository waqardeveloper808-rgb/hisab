import { NextRequest, NextResponse } from "next/server";
import { authSessionCookieName, readAuthSessionOutcome } from "@/lib/auth-session";
import { resolveWorkspaceBackendContext } from "@/lib/workspace-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionOutcome = await readAuthSessionOutcome(request.cookies.get(authSessionCookieName)?.value);
  const backendContext = resolveWorkspaceBackendContext(sessionOutcome);

  if (sessionOutcome.status === "guest") {
    return NextResponse.json(
      { message: "Workspace session is required. Please sign in to continue." },
      { status: 401, headers: { "X-Workspace-Mode": "backend" } },
    );
  }

  if (sessionOutcome.status === "invalid_session") {
    return NextResponse.json(
      { message: "Invalid workspace session." },
      { status: 401, headers: { "X-Workspace-Mode": "backend" } },
    );
  }

  if (!backendContext.backendConfigured || !backendContext.backendBaseUrl || !backendContext.companyId || !backendContext.actorId || !backendContext.workspaceToken) {
    return NextResponse.json(
      { message: "Workspace backend is not configured." },
      { status: 503, headers: { "X-Workspace-Mode": "backend" } },
    );
  }

  const response = await fetch(`${backendContext.backendBaseUrl}/api/companies/${backendContext.companyId}/access-profile`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Gulf-Hisab-Actor-Id": String(backendContext.actorId),
      "X-Gulf-Hisab-Workspace-Token": backendContext.workspaceToken,
      "X-Gulf-Hisab-Active-Company-Id": String(backendContext.activeCompanyId),
    },
  });

  const body = await response.arrayBuffer();
  const headers = new Headers();
  const contentType = response.headers.get("content-type");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  headers.set("X-Workspace-Mode", "backend");

  return new NextResponse(body, {
    status: response.status,
    headers,
  });
}
