import { NextResponse } from "next/server";
import { loadAuditStore } from "@/lib/audit-engine/store";

/**
 * Legacy compatibility endpoint.
 * The operational audit engine now lives under /api/audit/*.
 */
export async function GET() {
  const store = await loadAuditStore();
  return NextResponse.json({
    service: "gulf-hisab-audit-engine",
    status: "compatibility-shell",
    endpoints: {
      "POST /api/audit/runs": "Execute a new audit run",
      "GET /api/audit/summary": "Read latest audit summary",
      "GET /api/audit/retest-queue": "Read current retest queue",
    },
    latest_summary: store.summaries[0] ?? null,
    latest_session: store.sessions[0] ?? null,
    timestamp: new Date().toISOString(),
  });
}
