import { NextRequest, NextResponse } from "next/server";
import { authSessionCookieName, readAuthSession } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

const allowedRoots = new Set([
  "config",
  "plans",
  "agents",
  "customers",
  "support-accounts",
]);

function getBackendConfig() {
  const baseUrl = process.env.GULF_HISAB_API_BASE_URL ?? process.env.NEXT_PUBLIC_GULF_HISAB_API_BASE_URL;
  const apiToken = process.env.GULF_HISAB_API_TOKEN ?? process.env.WORKSPACE_API_TOKEN;

  if (! baseUrl || ! apiToken) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiToken,
  };
}

async function handle(request: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
  const config = getBackendConfig();
  const session = await readAuthSession(request.cookies.get(authSessionCookieName)?.value);

  if (! session) {
    return NextResponse.json({ message: "Sign in is required." }, { status: 401 });
  }

  if (! config) {
    return NextResponse.json({ message: "Workspace backend is not configured." }, { status: 503 });
  }

  const { slug } = await context.params;

  if (! slug.length || ! allowedRoots.has(slug[0])) {
    return NextResponse.json({ message: "Unsupported platform path." }, { status: 404 });
  }

  const search = request.nextUrl.search;
  const targetUrl = `${config.baseUrl}/api/platform/${slug.join("/")}${search}`;
  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : await request.arrayBuffer();

  const response = await fetch(targetUrl, {
    method: request.method,
    body,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      "X-Gulf-Hisab-Actor-Id": String(session.id),
      "X-Gulf-Hisab-Workspace-Token": config.apiToken,
    },
  });

  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;