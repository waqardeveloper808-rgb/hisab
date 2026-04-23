import { NextResponse } from "next/server";
import { getAuditSession, getAuditSummary } from "@/lib/audit-engine/store";

export async function GET(_request: Request, context: { params: Promise<{ auditId: string }> }) {
  const { auditId } = await context.params;
  const [session, summary] = await Promise.all([
    getAuditSession(auditId),
    getAuditSummary(auditId),
  ]);

  if (!session && !summary) {
    return NextResponse.json({ error: "Audit run not found." }, { status: 404 });
  }

  return NextResponse.json({
    session,
    summary,
  });
}
