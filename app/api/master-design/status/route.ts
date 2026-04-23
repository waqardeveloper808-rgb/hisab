import { NextResponse } from "next/server";
import { getSystemState } from "@/backend/app/Support/Standards/control-point-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ data: await getSystemState() }, { headers: { "Cache-Control": "no-store" } });
}