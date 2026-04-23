import { NextRequest, NextResponse } from "next/server";
import { authSessionCookieName, readAuthSession } from "@/lib/auth-session";
import { runSystemCorrectionOverview } from "@/lib/system-correction-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await readAuthSession(request.cookies.get(authSessionCookieName)?.value);

  if (!session) {
    return NextResponse.json({ message: "Workspace session is required." }, { status: 401 });
  }

  const data = await runSystemCorrectionOverview(session);
  return NextResponse.json({ data });
}