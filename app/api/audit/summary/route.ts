import { NextResponse } from "next/server";
import { loadAuditStore } from "@/lib/audit-engine/store";

export async function GET() {
  const store = await loadAuditStore();
  const summary = store.summaries[0] ?? null;
  return NextResponse.json({
    summary,
    latest_session: store.sessions[0] ?? null,
    last_updated: store.last_updated,
  });
}
