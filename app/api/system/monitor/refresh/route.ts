import { getFreshSystemMonitorState } from "@/backend/app/Support/Standards/control-point-engine";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const data = getFreshSystemMonitorState();
    return NextResponse.json({ ok: true as const, data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false as const, error: message }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
