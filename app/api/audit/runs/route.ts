import { NextResponse } from "next/server";
import { saveAuditRun, loadAuditStore } from "@/lib/audit-engine/store";
import { runAuditExecution } from "@/lib/audit-engine/orchestrator";
import type { AuditExecutionOptions, AuditRequest } from "@/lib/audit-engine/types";

export async function GET() {
  const store = await loadAuditStore();
  return NextResponse.json({
    service: "gulf-hisab-audit-engine",
    runs: store.sessions,
    summaries: store.summaries,
    last_updated: store.last_updated,
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({})) as Partial<AuditExecutionOptions> & { request?: Partial<AuditRequest> };
  if (!payload.request?.scope) {
    return NextResponse.json({ error: "Audit scope is required." }, { status: 400 });
  }

  const execution = await runAuditExecution({
    request: payload.request as AuditRequest,
    context: payload.context,
    audit_id: payload.audit_id,
  });
  await saveAuditRun(execution.session, execution.summary, execution.control_results, execution.retest_queue);

  return NextResponse.json({
    audit_id: execution.session.audit_id,
    summary: execution.summary,
    session: execution.session,
    control_results: execution.control_results,
    integrity: execution.integrity,
  });
}
