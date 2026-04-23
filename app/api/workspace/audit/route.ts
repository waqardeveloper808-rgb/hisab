/* ─── Gulf Hisab AI Review Assistant — Audit API Route ─── */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    service: "Gulf Hisab AI Review Assistant",
    version: "1.0.0",
    endpoints: {
      "GET /api/workspace/audit": "This endpoint - service info",
    },
    status: "operational",
    timestamp: new Date().toISOString(),
  });
}
