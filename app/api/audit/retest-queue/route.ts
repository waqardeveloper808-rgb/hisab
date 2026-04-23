import { NextResponse } from "next/server";
import { loadAuditStore } from "@/lib/audit-engine/store";

export async function GET() {
  const store = await loadAuditStore();
  return NextResponse.json({
    retest_queue: store.retest_queue,
    generated_at: store.last_updated,
  });
}
