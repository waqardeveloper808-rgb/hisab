import { NextRequest, NextResponse } from "next/server";
import {
  authSessionCookieName,
  authSessionMaxAge,
  createAuthSessionValue,
} from "@/lib/auth-session";

export const dynamic = "force-dynamic";

function getBackendBaseUrl() {
  const baseUrl = process.env.GULF_HISAB_API_BASE_URL ?? process.env.NEXT_PUBLIC_GULF_HISAB_API_BASE_URL;
  return baseUrl?.replace(/\/$/, "") ?? null;
}

export async function POST(request: NextRequest) {
  const baseUrl = getBackendBaseUrl();

  if (! baseUrl) {
    return NextResponse.json({ message: "Backend auth is not configured." }, { status: 503 });
  }

  const body = await request.json();
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

  const payload = JSON.parse(text) as { data: { id: number; name: string; email: string; platform_role?: string } };
  const sessionValue = await createAuthSessionValue(payload.data);
  const nextResponse = NextResponse.json({ data: payload.data });

  nextResponse.cookies.set(authSessionCookieName, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: authSessionMaxAge,
    path: "/",
  });

  return nextResponse;
}