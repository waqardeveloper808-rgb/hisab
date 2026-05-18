import { NextResponse } from "next/server";
import { authSessionCookieName, authSessionCookieSecure } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set(authSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: authSessionCookieSecure(),
    maxAge: 0,
    path: "/",
  });

  return response;
}