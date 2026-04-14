import { NextResponse } from "next/server";
import { authSessionCookieName } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set(authSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });

  return response;
}