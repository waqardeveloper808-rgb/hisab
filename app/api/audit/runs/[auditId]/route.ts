import { NextResponse } from "next/server";
import { getAuditSession, getAuditSummary } from "@/lib/audit-engine/store";

export async function GET(_request: Request, { params }: { params: { auditId: string } }) {
  const [session, summary] = await Promise.all([
    getAuditSession(params.auditId),
    getAuditSummary(params.auditId),
  ]);

  if (!session && !summary) {
    return NextResponse.json({ error: "Audit run not found." }, { status: 404 });
  }

  return NextResponse.json({
    session,
    summary,
  });
}
